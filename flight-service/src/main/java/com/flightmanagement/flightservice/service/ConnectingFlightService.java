package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightSegmentRequest;
import com.flightmanagement.flightservice.dto.response.FlightConnectionResponse;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.FlightConnection;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.exception.InvalidRequestException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightConnectionRepository;
import com.flightmanagement.flightservice.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.flightmanagement.flightservice.exception.BusinessException;

import java.time.LocalDate;
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

    // ConnectingFlightService'e eklenecek eksik metodlar:

    public FlightResponse updateConnectingFlight(Long mainFlightId, ConnectingFlightRequest request) {
        log.debug("Updating connecting flight with ID: {}", mainFlightId);

        // Mevcut ana uçuşu bul
        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Main flight not found with ID: " + mainFlightId));

        if (!Boolean.TRUE.equals(mainFlight.getIsConnectingFlight())) {
            throw new BusinessException("Flight is not a connecting flight");
        }

        // Validasyon
        validateConnectingFlightRequest(request);

        // Mevcut segment'leri sil
        List<Flight> existingSegments = flightRepository.findByParentFlightIdOrderBySegmentNumber(mainFlightId);
        flightRepository.deleteAll(existingSegments);

        // Ana uçuşu güncelle
        updateMainFlightFromRequest(mainFlight, request);
        mainFlight = flightRepository.save(mainFlight);

        // Yeni segment'leri oluştur
        createFlightSegments(mainFlight, request);

        // Connection'ları kaydet
        saveFlightConnections(mainFlight, request);

        // Response oluştur
        FlightResponse response = flightMapper.toResponse(mainFlight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_UPDATED", mainFlight);

        return response;
    }

    public void deleteConnectingFlight(Long mainFlightId) {
        log.debug("Deleting connecting flight with ID: {}", mainFlightId);

        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Main flight not found with ID: " + mainFlightId));

        if (!Boolean.TRUE.equals(mainFlight.getIsConnectingFlight())) {
            throw new BusinessException("Flight is not a connecting flight");
        }

        // Segment'leri sil
        List<Flight> segments = flightRepository.findByParentFlightIdOrderBySegmentNumber(mainFlightId);
        flightRepository.deleteAll(segments);

        // Connection'ları sil
        List<FlightConnection> connections = flightConnectionRepository.findByMainFlightIdOrderBySegmentOrder(mainFlightId);
        flightConnectionRepository.deleteAll(connections);

        // Ana uçuşu sil
        flightRepository.delete(mainFlight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_DELETED", mainFlight);
    }

    public Page<FlightResponse> getConnectingFlightsWithFilters(Pageable pageable, Long airlineId, LocalDate flightDate) {
        log.debug("Getting connecting flights with filters - airlineId: {}, flightDate: {}", airlineId, flightDate);

        Page<Flight> flightsPage = flightRepository.findConnectingFlightsWithFilters(airlineId, flightDate, pageable);

        List<FlightResponse> responses = flightsPage.getContent().stream()
                .map(flightMapper::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, flightsPage.getTotalElements());
    }

    // Helper metodlar
    private void updateMainFlightFromRequest(Flight mainFlight, ConnectingFlightRequest request) {
        mainFlight.setFlightNumber(request.getMainFlightNumber());
        mainFlight.setAirlineId(request.getAirlineId());
        mainFlight.setAircraftId(request.getAircraftId());
        mainFlight.setType(request.getType());
        mainFlight.setPassengerCount(request.getPassengerCount());
        mainFlight.setCargoWeight(request.getCargoWeight());
        mainFlight.setNotes(request.getNotes());
        mainFlight.setActive(request.getActive());

        // İlk ve son segment'leri kullanarak ana uçuş bilgilerini güncelle
        FlightSegmentRequest firstSegment = request.getSegments().get(0);
        FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
        mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
        mainFlight.setFlightDate(firstSegment.getScheduledDeparture().toLocalDate());
        mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
        mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());
    }

    private void createFlightSegments(Flight mainFlight, ConnectingFlightRequest request) {
        List<FlightSegmentRequest> segments = request.getSegments();

        for (int i = 0; i < segments.size(); i++) {
            FlightSegmentRequest segmentRequest = segments.get(i);
            Flight segment = createSegmentFromRequest(mainFlight, segmentRequest, i + 1);
            flightRepository.save(segment);
        }
    }

    private Flight createSegmentFromRequest(Flight mainFlight, FlightSegmentRequest segmentRequest, int segmentNumber) {
        Flight segment = new Flight();

        // Ana uçuştan kopyalanacak bilgiler
        segment.setFlightNumber(mainFlight.getFlightNumber() + "-" + segmentNumber);
        segment.setAirlineId(mainFlight.getAirlineId());
        segment.setAircraftId(mainFlight.getAircraftId());
        segment.setType(mainFlight.getType());
        segment.setPassengerCount(mainFlight.getPassengerCount());
        segment.setCargoWeight(mainFlight.getCargoWeight());
        segment.setActive(mainFlight.getActive());

        // Segment'e özel bilgiler
        segment.setOriginAirportId(segmentRequest.getOriginAirportId());
        segment.setDestinationAirportId(segmentRequest.getDestinationAirportId());
        segment.setFlightDate(segmentRequest.getScheduledDeparture().toLocalDate());
        segment.setScheduledDeparture(segmentRequest.getScheduledDeparture());
        segment.setScheduledArrival(segmentRequest.getScheduledArrival());
        segment.setGateNumber(segmentRequest.getGateNumber());
        segment.setNotes(segmentRequest.getNotes());

        // Connecting flight ilişkisi
        segment.setParentFlightId(mainFlight.getId());
        segment.setSegmentNumber(segmentNumber);
        segment.setIsConnectingFlight(false); // Bu bir segment, ana uçuş değil
        segment.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());
        segment.setStatus(FlightStatus.SCHEDULED);

        return segment;
    }

    private void saveFlightConnections(Flight mainFlight, ConnectingFlightRequest request) {
        List<FlightSegmentRequest> segments = request.getSegments();

        for (int i = 0; i < segments.size(); i++) {
            FlightConnection connection = new FlightConnection();
            connection.setMainFlightId(mainFlight.getId());
            // Segment flight ID'yi daha sonra set etmek gerekecek
            connection.setSegmentOrder(i + 1);
            connection.setConnectionTimeMinutes(segments.get(i).getConnectionTimeMinutes());

            flightConnectionRepository.save(connection);
        }
    }

}