package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.exception.DuplicateResourceException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightRepository;
import com.flightmanagement.flightservice.validator.FlightValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FlightService {

    private final FlightRepository flightRepository;
    private final FlightMapper flightMapper;
    private final FlightValidator flightValidator;
    private final ReferenceDataService referenceDataService;
    private final KafkaProducerService kafkaProducerService;

    public List<FlightResponse> getAllFlights() {
        log.debug("Fetching all flights");
        return flightRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FlightResponse getFlightById(Long id) {
        log.debug("Fetching flight with id: {}", id);
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        return mapToResponse(flight);
    }

    public List<FlightResponse> getFlightsByDate(LocalDate date) {
        log.debug("Fetching flights for date: {}", date);
        return flightRepository.findByFlightDate(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByAirline(Long airlineId) {
        log.debug("Fetching flights for airline: {}", airlineId);
        return flightRepository.findByAirlineId(airlineId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByAirport(Long airportId) {
        log.debug("Fetching flights for airport: {}", airportId);
        return flightRepository.findByOriginAirportIdOrDestinationAirportId(airportId, airportId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByStatus(FlightStatus status) {
        log.debug("Fetching flights with status: {}", status);
        return flightRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getDelayedFlights(Integer minDelayMinutes) {
        log.debug("Fetching flights delayed by more than {} minutes", minDelayMinutes);
        return flightRepository.findDelayedFlights(minDelayMinutes).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FlightResponse createFlight(FlightRequest request) {
        log.debug("Creating new flight: {}", request.getFlightNumber());

        // Validation
        flightValidator.validateFlightRequest(request);

        // Check for duplicate flight
        flightRepository.findByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
                });

        Flight flight = flightMapper.toEntity(request);
        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_CREATED", flight);

        return mapToResponse(flight);
    }

    public FlightResponse updateFlight(Long id, FlightRequest request) {
        log.debug("Updating flight with id: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        // Validation
        flightValidator.validateFlightUpdate(flight, request);

        // Check for duplicate flight number (if changed)
        if (!flight.getFlightNumber().equals(request.getFlightNumber()) ||
                !flight.getFlightDate().equals(request.getFlightDate())) {
            flightRepository.findByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new DuplicateResourceException(
                                    "Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
                        }
                    });
        }

        flightMapper.updateEntity(flight, request);
        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_UPDATED", flight);

        return mapToResponse(flight);
    }

    public void deleteFlight(Long id) {
        log.debug("Deleting flight with id: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flightRepository.delete(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_DELETED", flight);
    }

    public FlightResponse updateFlightStatus(Long id, FlightStatus status) {
        log.debug("Updating flight status: {} to {}", id, status);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        FlightStatus oldStatus = flight.getStatus();
        flight.setStatus(status);

        // Auto-set actual times based on status
        if (status == FlightStatus.DEPARTED && flight.getActualDeparture() == null) {
            flight.setActualDeparture(LocalDateTime.now());
        }
        if (status == FlightStatus.ARRIVED && flight.getActualArrival() == null) {
            flight.setActualArrival(LocalDateTime.now());
        }

        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_STATUS_CHANGED", flight);

        log.info("Flight {} status changed from {} to {}", flight.getFlightNumber(), oldStatus, status);
        return mapToResponse(flight);
    }

    public FlightResponse recordDelay(Long id, Integer delayMinutes, String reason) {
        log.debug("Recording delay for flight: {}, {} minutes", id, delayMinutes);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flight.setDelayMinutes(delayMinutes);
        flight.setDelayReason(reason);

        if (delayMinutes > 0 && flight.getStatus() == FlightStatus.SCHEDULED) {
            flight.setStatus(FlightStatus.DELAYED);
        }

        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_DELAYED", flight);

        return mapToResponse(flight);
    }

    // Statistics methods
    public Long getFlightCountByDate(LocalDate date) {
        return flightRepository.countFlightsByDate(date);
    }

    public Long getFlightCountByAirlineAndDate(Long airlineId, LocalDate date) {
        return flightRepository.countFlightsByAirlineAndDate(airlineId, date);
    }

    public Long getFlightCountByStatus(FlightStatus status, LocalDate date) {
        return flightRepository.countFlightsByStatusAndDate(status, date);
    }

    private FlightResponse mapToResponse(Flight flight) {
        FlightResponse response = flightMapper.toResponse(flight);

        try {
            // Load reference data from cache/service
            AirlineCache airline = referenceDataService.getAirline(flight.getAirlineId());
            response.setAirline(airline);

            AircraftCache aircraft = referenceDataService.getAircraft(flight.getAircraftId());
            response.setAircraft(aircraft);

            AirportCache originAirport = referenceDataService.getAirport(flight.getOriginAirportId());
            response.setOriginAirport(originAirport);

            AirportCache destinationAirport = referenceDataService.getAirport(flight.getDestinationAirportId());
            response.setDestinationAirport(destinationAirport);

        } catch (Exception e) {
            log.warn("Could not load all reference data for flight {}: {}", flight.getId(), e.getMessage());
        }

        return response;
    }
}