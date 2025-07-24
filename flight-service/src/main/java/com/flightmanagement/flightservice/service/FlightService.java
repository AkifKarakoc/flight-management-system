package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.RouteCache;
import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.dto.response.stats.FlightTypeDistributionDto;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.exception.BusinessException;
import com.flightmanagement.flightservice.exception.DuplicateResourceException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightRepository;
import com.flightmanagement.flightservice.validator.FlightValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
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
    private final WebSocketMessageService webSocketMessageService;
    private final ConnectingFlightService connectingFlightService;

    // ===============================
    // TEMEL FLIGHT OPERATIONS
    // ===============================

    public Page<FlightResponse> getAllFlights(Pageable pageable) {
        log.debug("Fetching all flights with pagination");
        Page<Flight> flights = flightRepository.findAll(pageable);
        List<FlightResponse> responses = flights.getContent().stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, flights.getTotalElements());
    }

    public FlightResponse getFlightById(Long id) {
        log.debug("Fetching flight with id: {}", id);
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        return buildFlightResponse(flight);
    }

    public List<FlightResponse> getFlightsByFlightNumber(String flightNumber) {
        log.debug("Fetching flights with number: {}", flightNumber);
        List<Flight> flights = flightRepository.findByFlightNumber(flightNumber);
        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByDate(LocalDate date) {
        log.debug("Fetching flights for date: {}", date);
        List<Flight> flights = flightRepository.findByFlightDate(date);
        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByStatus(FlightStatus status) {
        log.debug("Fetching flights with status: {}", status);
        List<Flight> flights = flightRepository.findByStatus(status);
        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByAirline(Long airlineId) {
        log.debug("Fetching flights for airline: {}", airlineId);
        List<Flight> flights = flightRepository.findByAirlineId(airlineId);
        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    // ===============================
    // ROUTE BASED OPERATIONS
    // ===============================

    public List<FlightResponse> getFlightsByRoute(Long routeId, LocalDate date) {
        log.debug("Fetching flights for route {} on date {}", routeId, date);

        List<Flight> flights;
        if (date != null) {
            flights = flightRepository.findByRouteIdAndFlightDate(routeId, date);
        } else {
            flights = flightRepository.findByRouteId(routeId);
        }

        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    public Page<FlightResponse> getFlightsByRoutePaged(Long routeId, Pageable pageable) {
        log.debug("Fetching flights for route {} with pagination", routeId);
        Page<Flight> flights = flightRepository.findByRouteId(routeId, pageable);
        List<FlightResponse> responses = flights.getContent().stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, flights.getTotalElements());
    }

    // ===============================
    // FLIGHT CRUD OPERATIONS
    // ===============================

    public FlightResponse createFlight(FlightRequest request) {
        log.debug("Creating flight: {}", request.getFlightNumber());

        // Validation
        flightValidator.validateFlightRequest(request);

        // Route bilgilerini düzenle
        if (request.isRouteBasedFlight()) {
            populateAirportsFromRoute(request);
        }

        // Duplicate check
        if (flightRepository.existsByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())) {
            throw new DuplicateResourceException("Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
        }

        // Aircraft conflict check
        if (flightRepository.hasAircraftConflict(request.getAircraftId(), request.getFlightDate(),
                request.getScheduledDeparture(), request.getScheduledArrival())) {
            throw new BusinessException("Aircraft has conflicting flight schedule");
        }

        Flight flight = flightMapper.toEntity(request);
        flight = flightRepository.save(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_CREATED", flight);

        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightUpdate("CREATE", response, flight.getId(), flight.getFlightNumber());

        return response;
    }

    public FlightResponse updateFlight(Long id, FlightRequest request) {
        log.debug("Updating flight with id: {}", id);

        Flight existingFlight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flightValidator.validateFlightUpdate(existingFlight, request);

        if (request.isRouteBasedFlight()) {
            populateAirportsFromRoute(request);
        }

        flightMapper.updateEntity(existingFlight, request);
        Flight updatedFlight = flightRepository.save(existingFlight);

        kafkaProducerService.sendFlightEvent("FLIGHT_UPDATED", updatedFlight);

        FlightResponse newResponse = buildFlightResponse(updatedFlight);
        webSocketMessageService.sendFlightUpdate("UPDATE", newResponse, updatedFlight.getId(), updatedFlight.getFlightNumber());

        return newResponse;
    }

    public FlightResponse updateFlightStatus(Long id, FlightStatus status) {
        log.debug("Updating flight status for id: {} to {}", id, status);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flight.setStatus(status);

        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case DEPARTED:
                if (flight.getActualDeparture() == null) {
                    flight.setActualDeparture(now);
                }
                break;
            case ARRIVED:
                if (flight.getActualArrival() == null) {
                    flight.setActualArrival(now);
                }
                break;
        }

        flight = flightRepository.save(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_STATUS_CHANGED", flight);

        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightUpdate("STATUS_CHANGE", response, flight.getId(), flight.getFlightNumber());

        return response;
    }

    public FlightResponse recordDelay(Long id, Integer delayMinutes, String reason) {
        log.debug("Recording delay for flight id: {}, delay: {} minutes", id, delayMinutes);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flight.setDelayMinutes(delayMinutes);
        flight.setDelayReason(reason);

        if (delayMinutes > 0) {
            flight.setStatus(FlightStatus.DELAYED);
            flight.setScheduledDeparture(flight.getScheduledDeparture().plusMinutes(delayMinutes));
            flight.setScheduledArrival(flight.getScheduledArrival().plusMinutes(delayMinutes));
        }

        flight = flightRepository.save(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_DELAYED", flight);

        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightUpdate("DELAY", response, flight.getId(), flight.getFlightNumber());

        return response;
    }

    public void deleteFlight(Long id) {
        log.debug("Deleting flight with id: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        if (Boolean.TRUE.equals(flight.getIsConnectingFlight())) {
            List<Flight> segments = flightRepository.findByParentFlightId(id);
            flightRepository.deleteAll(segments);
        }

        flightRepository.delete(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_DELETED", flight);
        webSocketMessageService.sendFlightUpdate("DELETE", null, id, flight.getFlightNumber());
    }

    // ===============================
    // STATISTICS AND REPORTING
    // ===============================

    public Map<String, Object> getFlightStatistics(LocalDate date) {
        log.debug("Fetching flight statistics for date: {}", date);

        Map<String, Object> stats = new HashMap<>();

        long totalFlights = flightRepository.countFlightsByDate(date);
        long scheduledFlights = flightRepository.countFlightsByDateAndStatus(date, FlightStatus.SCHEDULED);
        long departedFlights = flightRepository.countFlightsByDateAndStatus(date, FlightStatus.DEPARTED);
        long arrivedFlights = flightRepository.countFlightsByDateAndStatus(date, FlightStatus.ARRIVED);
        long delayedFlights = flightRepository.countFlightsByDateAndStatus(date, FlightStatus.DELAYED);
        long cancelledFlights = flightRepository.countFlightsByDateAndStatus(date, FlightStatus.CANCELLED);

        stats.put("totalFlights", totalFlights);
        stats.put("scheduledFlights", scheduledFlights);
        stats.put("departedFlights", departedFlights);
        stats.put("arrivedFlights", arrivedFlights);
        stats.put("delayedFlights", delayedFlights);
        stats.put("cancelledFlights", cancelledFlights);

        if (totalFlights > 0) {
            stats.put("onTimePerformance", (double) (arrivedFlights - delayedFlights) / totalFlights * 100);
            stats.put("cancellationRate", (double) cancelledFlights / totalFlights * 100);
            stats.put("delayRate", (double) delayedFlights / totalFlights * 100);
        } else {
            stats.put("onTimePerformance", 0.0);
            stats.put("cancellationRate", 0.0);
            stats.put("delayRate", 0.0);
        }

        return stats;
    }

    public Long getFlightCountByDate(LocalDate date) {
        log.debug("Getting flight count for date: {}", date);
        return flightRepository.countFlightsByDate(date);
    }

    public Long getFlightCountByAirlineAndDate(Long airlineId, LocalDate date) {
        log.debug("Getting flight count for airline {} and date: {}", airlineId, date);
        return flightRepository.countFlightsByAirlineAndDate(airlineId, date);
    }

    public Long getFlightCountByStatus(FlightStatus status, LocalDate date) {
        log.debug("Getting flight count for status {} and date: {}", status, date);
        return flightRepository.countFlightsByStatusAndDate(status, date);
    }

    public List<FlightTypeDistributionDto> getFlightTypeDistribution() {
        log.debug("Fetching flight type distribution");
        List<Object[]> results = flightRepository.countFlightsGroupedByType();

        return results.stream()
                .map(result -> new FlightTypeDistributionDto((FlightType) result[0], (Long) result[1]))
                .collect(Collectors.toList());
    }

    // ===============================
    // CONNECTING FLIGHTS (SIMPLIFIED)
    // ===============================

    public FlightResponse updateConnectingFlight(Long mainFlightId, ConnectingFlightRequest request) {
        log.debug("Updating connecting flight: {}", mainFlightId);
        return connectingFlightService.updateConnectingFlight(mainFlightId, request);
    }

    public void deleteConnectingFlight(Long mainFlightId) {
        log.debug("Deleting connecting flight: {}", mainFlightId);
        connectingFlightService.deleteConnectingFlight(mainFlightId);
    }

    public Page<FlightResponse> getConnectingFlightsWithFilters(Pageable pageable, Long airlineId, LocalDate flightDate) {
        log.debug("Getting connecting flights with filters - airlineId: {}, date: {}", airlineId, flightDate);
        return connectingFlightService.getConnectingFlightsWithFilters(pageable, airlineId, flightDate);
    }

    // ===============================
    // PRIVATE HELPER METHODS
    // ===============================

    private void populateAirportsFromRoute(FlightRequest request) {
        try {
            RouteCache route = referenceDataService.getRoute(request.getRouteId());

            log.debug("Populated airports from route {}: {} -> {}",
                    route.getRouteCode(), route.getOriginAirportCode(), route.getDestinationAirportCode());

        } catch (Exception e) {
            throw new BusinessException("Failed to get route information: " + e.getMessage());
        }
    }

    private FlightResponse buildFlightResponse(Flight flight) {
        FlightResponse response = flightMapper.toResponse(flight);

        try {
            response.setAirline(referenceDataService.getAirline(flight.getAirlineId()));
            response.setAircraft(referenceDataService.getAircraft(flight.getAircraftId()));

            if (flight.getRouteId() != null) {
                RouteCache route = referenceDataService.getRoute(flight.getRouteId());
                response.setRoute(route);
                response.setRoutePath(route.getRoutePath());
                response.setRouteDistance(route.getDistance());
                response.setRouteEstimatedTime(route.getEstimatedFlightTime());
                response.setIsMultiSegmentRoute(route.getIsMultiSegment());

                if (route.getOriginAirportId() != null) {
                    response.setOriginAirport(referenceDataService.getAirport(route.getOriginAirportId()));
                }
                if (route.getDestinationAirportId() != null) {
                    response.setDestinationAirport(referenceDataService.getAirport(route.getDestinationAirportId()));
                }
            }

            if (Boolean.TRUE.equals(flight.getIsConnectingFlight()) && flight.getParentFlightId() == null) {
                List<Flight> segments = flightRepository.findByParentFlightId(flight.getId());
                List<FlightResponse> segmentResponses = segments.stream()
                        .map(this::buildFlightResponse)
                        .collect(Collectors.toList());
                response.setConnectingFlights(segmentResponses);
                response.setTotalSegments(segments.size());
                response.setFullRoute(buildFullRouteFromSegments(segments));
            }

        } catch (Exception e) {
            log.warn("Error populating reference data for flight {}: {}", flight.getId(), e.getMessage());
        }

        return response;
    }

    private String buildFullRouteFromSegments(List<Flight> segments) {
        if (segments.isEmpty()) return "";

        StringBuilder route = new StringBuilder();

        try {
            Flight firstSegment = segments.get(0);
            if (firstSegment.getRouteId() != null) {
                RouteCache firstRoute = referenceDataService.getRoute(firstSegment.getRouteId());
                route.append(firstRoute.getOriginAirportCode());
            }

            for (Flight segment : segments) {
                if (segment.getRouteId() != null) {
                    RouteCache segmentRoute = referenceDataService.getRoute(segment.getRouteId());
                    route.append(" → ").append(segmentRoute.getDestinationAirportCode());
                }
            }

        } catch (Exception e) {
            log.warn("Error building full route from segments: {}", e.getMessage());
            return "Complex Route";
        }

        return route.toString();
    }
}