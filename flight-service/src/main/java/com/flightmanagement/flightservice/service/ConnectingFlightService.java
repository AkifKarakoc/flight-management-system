package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightSegmentRequest;
import com.flightmanagement.flightservice.dto.response.FlightConnectionResponse;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.FlightConnection;
import com.flightmanagement.flightservice.exception.InvalidRequestException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightConnectionRepository;
import com.flightmanagement.flightservice.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConnectingFlightService {

    private final FlightRepository flightRepository;
    private final FlightConnectionRepository flightConnectionRepository;
    private final FlightMapper flightMapper;
    private final ReferenceDataService referenceDataService;
    private final KafkaProducerService kafkaProducerService;

    /**
     * Aktarmalı uçuş validasyonu
     */
    public void validateConnectingFlightRequest(ConnectingFlightRequest request) {
        // Minimum 2 segment olmalı
        if (request.getSegments() == null || request.getSegments().size() < 2) {
            throw new InvalidRequestException("Connecting flight must have at least 2 segments");
        }

        // Maksimum 10 segment olabilir
        if (request.getSegments().size() > 10) {
            throw new InvalidRequestException("Connecting flight cannot have more than 10 segments");
        }

        // Segment'lerin sıralı olduğunu kontrol et
        for (int i = 0; i < request.getSegments().size() - 1; i++) {
            FlightSegmentRequest current = request.getSegments().get(i);
            FlightSegmentRequest next = request.getSegments().get(i + 1);

            // Bir segment'in destination'ı, bir sonrakinin origin'i olmalı
            if (!current.getDestinationAirportId().equals(next.getOriginAirportId())) {
                throw new InvalidRequestException(
                        String.format("Segment %d destination must match segment %d origin", i + 1, i + 2));
            }

            // Zamanlama kontrolü
            if (current.getScheduledArrival().isAfter(next.getScheduledDeparture())) {
                throw new InvalidRequestException(
                        String.format("Segment %d arrival time must be before segment %d departure time", i + 1, i + 2));
            }

            // Minimum connection time (30 dakika)
            long connectionMinutes = java.time.Duration.between(
                    current.getScheduledArrival(), next.getScheduledDeparture()).toMinutes();

            if (connectionMinutes < 30) {
                throw new InvalidRequestException(
                        String.format("Minimum 30 minutes connection time required between segments %d and %d", i + 1, i + 2));
            }
        }

        // Uçuş numarası benzersizliği kontrolü
        boolean exists = flightRepository.existsMainFlightByFlightNumberAndDate(
                request.getMainFlightNumber(),
                request.getSegments().get(0).getScheduledDeparture().toLocalDate());

        if (exists) {
            throw new InvalidRequestException(
                    "Flight number already exists for this date: " + request.getMainFlightNumber());
        }
    }

    /**
     * Connection time hesaplama
     */
    public Integer calculateConnectionTime(FlightSegmentRequest current, FlightSegmentRequest next) {
        if (current == null || next == null) return null;

        return (int) java.time.Duration.between(
                current.getScheduledArrival(),
                next.getScheduledDeparture()
        ).toMinutes();
    }

    /**
     * Full route string oluşturma
     */
    public String buildRouteString(List<FlightSegmentRequest> segments) {
        if (segments == null || segments.isEmpty()) return "";

        StringBuilder route = new StringBuilder();

        // İlk segment'in origin'i
        String firstOrigin = getAirportCode(segments.get(0).getOriginAirportId());
        route.append(firstOrigin);

        // Tüm destination'ları ekle
        for (FlightSegmentRequest segment : segments) {
            String destination = getAirportCode(segment.getDestinationAirportId());
            route.append(" → ").append(destination);
        }

        return route.toString();
    }

    /**
     * Segment sayısı ve toplam süre hesaplama
     */
    public Integer calculateTotalFlightTime(List<FlightSegmentRequest> segments) {
        if (segments == null || segments.isEmpty()) return null;

        int totalMinutes = 0;
        for (FlightSegmentRequest segment : segments) {
            totalMinutes += (int) java.time.Duration.between(
                    segment.getScheduledDeparture(),
                    segment.getScheduledArrival()
            ).toMinutes();
        }

        return totalMinutes;
    }

    /**
     * Connection detaylarını getir
     */
    public List<FlightConnectionResponse> getConnectionDetails(Long mainFlightId) {
        List<FlightConnection> connections = flightConnectionRepository
                .findByMainFlightIdOrderBySegmentOrder(mainFlightId);

        return connections.stream()
                .map(flightMapper::toConnectionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Segment status güncelleme mantığı
     */
    public void updateConnectingFlightStatus(Long mainFlightId) {
        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Main flight not found"));

        List<Flight> segments = flightRepository.findByParentFlightIdOrderBySegmentNumber(mainFlightId);

        // Tüm segment'lerin statuslarına göre ana uçuş statusunu belirle
        boolean allCompleted = segments.stream().allMatch(s -> s.getStatus().name().equals("ARRIVED"));
        boolean anyInProgress = segments.stream().anyMatch(s ->
                s.getStatus().name().equals("DEPARTED") || s.getStatus().name().equals("BOARDING"));
        boolean anyCancelled = segments.stream().anyMatch(s -> s.getStatus().name().equals("CANCELLED"));

        if (anyCancelled) {
            mainFlight.setStatus(com.flightmanagement.flightservice.entity.enums.FlightStatus.CANCELLED);
        } else if (allCompleted) {
            mainFlight.setStatus(com.flightmanagement.flightservice.entity.enums.FlightStatus.ARRIVED);
        } else if (anyInProgress) {
            mainFlight.setStatus(com.flightmanagement.flightservice.entity.enums.FlightStatus.DEPARTED);
        }

        flightRepository.save(mainFlight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_STATUS_UPDATED", mainFlight);
    }

    private String getAirportCode(Long airportId) {
        try {
            return referenceDataService.getAirport(airportId).getIataCode();
        } catch (Exception e) {
            log.warn("Could not get airport code for ID: {}", airportId);
            return "XXX";
        }
    }
}