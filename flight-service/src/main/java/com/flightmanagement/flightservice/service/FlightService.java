package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.RouteCache;
import com.flightmanagement.flightservice.dto.request.AirportSegmentRequest;
import com.flightmanagement.flightservice.dto.request.ArchiveSearchRequest;
import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.ArchivedFlightResponse;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.dto.response.stats.FlightChartDataDto;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
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
    private final ArchiveServiceClient archiveServiceClient;
    private final AutoRouteService autoRouteService;


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

    public Page<FlightResponse> getAllFlightsWithFilters(Pageable pageable, String flightNumber, Long airlineId, LocalDate flightDate) {
        log.debug("Fetching flights with filters - flightNumber: {}, airlineId: {}, flightDate: {}",
                flightNumber, airlineId, flightDate);

        Page<Flight> flights = flightRepository.findFlightsWithFilters(flightNumber, airlineId, flightDate, null, pageable);
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

    public List<FlightResponse> getDelayedFlights(Integer minDelayMinutes) {
        log.debug("Fetching delayed flights with minimum delay: {} minutes", minDelayMinutes);
        LocalDate today = LocalDate.now();
        List<Flight> flights = flightRepository.findDelayedFlightsByDateAndMinutes(today, minDelayMinutes);
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

    public List<FlightResponse> getFlightsByAirport(Long airportId) {
        log.debug("Fetching flights for airport: {}", airportId);

        // Route üzerinden airport'a ait uçuşları bul
        List<Flight> flights = new ArrayList<>();
        try {
            // Tüm aktif route'ları al ve bu airport'u içerenleri filtrele
            RouteCache[] routes = referenceDataService.getActiveRoutes();
            for (RouteCache route : routes) {
                if (route.getOriginAirportId() != null && route.getOriginAirportId().equals(airportId) ||
                        route.getDestinationAirportId() != null && route.getDestinationAirportId().equals(airportId)) {
                    flights.addAll(flightRepository.findByRouteId(route.getId()));
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch flights by airport through routes: {}", e.getMessage());
        }

        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    // ===============================
    // FLIGHT CRUD OPERATIONS
    // ===============================

    public FlightResponse createFlight(FlightRequest request) {
        log.debug("Creating flight: {} (Mode: {})", request.getFlightNumber(),
                request.getCreationMode() != null ? request.getCreationMode() : "AUTO");

        // Route ID resolution strategy
        resolveRouteId(request);

        // Validation
        flightValidator.validateFlightRequest(request);

        // Multi-segment airport-based flight ise connecting flight oluştur
        if (request.isMultiSegmentAirportCreation()) {
            return createMultiSegmentAirportFlight(request);
        }

        // Single flight creation
        return createSingleFlight(request);
    }

    public Map<String, Object> previewRouteForAirports(Long originAirportId, Long destinationAirportId) {
        return autoRouteService.previewRoute(originAirportId, destinationAirportId);
    }

    public FlightResponse updateFlight(Long id, FlightRequest request) {
        log.debug("Updating flight with id: {}", id);

        Flight existingFlight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flightValidator.validateFlightUpdate(existingFlight, request);

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

        FlightStatus oldStatus = flight.getStatus();
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
                // Archive flight when it arrives
                archiveCompletedFlight(flight);
                break;
        }

        flight = flightRepository.save(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_STATUS_CHANGED", flight);

        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightStatusUpdate(flight.getFlightNumber(), oldStatus.name(),
                status.name(), response, flight.getId());

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
    // CONNECTING FLIGHTS
    // ===============================

    public FlightResponse createConnectingFlight(ConnectingFlightRequest request) {
        log.debug("Creating connecting flight: {}", request.getMainFlightNumber());
        return connectingFlightService.createConnectingFlight(request);
    }

    public FlightResponse getConnectingFlightDetails(Long mainFlightId) {
        log.debug("Getting connecting flight details: {}", mainFlightId);
        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Main flight not found"));

        if (!Boolean.TRUE.equals(mainFlight.getIsConnectingFlight())) {
            throw new BusinessException("Flight is not a connecting flight");
        }

        return buildFlightResponse(mainFlight);
    }

    public List<FlightResponse> getConnectingFlights(Long mainFlightId) {
        log.debug("Getting connecting flight segments: {}", mainFlightId);
        List<Flight> segments = flightRepository.findByParentFlightIdOrderBySegmentNumber(mainFlightId);
        return segments.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

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
    // STATISTICS AND REPORTING
    // ===============================

    public Map<String, Object> getDailySummary(LocalDate date) {
        log.debug("Fetching daily summary for date: {}", date);

        Map<String, Object> summary = new HashMap<>();

        Object[] stats = flightRepository.getFlightStatsByDate(date);
        if (stats != null) {
            summary.put("totalFlights", ((Number) stats[0]).longValue() + ((Number) stats[1]).longValue() +
                    ((Number) stats[2]).longValue() + ((Number) stats[3]).longValue() +
                    ((Number) stats[4]).longValue());
            summary.put("scheduledFlights", ((Number) stats[0]).longValue());
            summary.put("departedFlights", ((Number) stats[1]).longValue());
            summary.put("arrivedFlights", ((Number) stats[2]).longValue());
            summary.put("cancelledFlights", ((Number) stats[3]).longValue());
            summary.put("delayedFlights", ((Number) stats[4]).longValue());

            long totalFlights = ((Number) summary.get("totalFlights")).longValue();
            long arrivedFlights = ((Number) summary.get("arrivedFlights")).longValue();
            long delayedFlights = ((Number) summary.get("delayedFlights")).longValue();
            long cancelledFlights = ((Number) summary.get("cancelledFlights")).longValue();

            if (totalFlights > 0) {
                summary.put("onTimePerformance", (double) (arrivedFlights - delayedFlights) / totalFlights * 100);
                summary.put("cancellationRate", (double) cancelledFlights / totalFlights * 100);
                summary.put("delayRate", (double) delayedFlights / totalFlights * 100);
                summary.put("completionRate", (double) arrivedFlights / totalFlights * 100);
            } else {
                summary.put("onTimePerformance", 0.0);
                summary.put("cancellationRate", 0.0);
                summary.put("delayRate", 0.0);
                summary.put("completionRate", 0.0);
            }

            // Average delay
            Double avgDelay = flightRepository.getAverageDelayByDate(date);
            summary.put("averageDelayMinutes", avgDelay != null ? avgDelay : 0.0);
        }

        summary.put("date", date);
        return summary;
    }

    public FlightChartDataDto getFlightChartData(LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching flight chart data from {} to {}", startDate, endDate);

        FlightChartDataDto chartData = new FlightChartDataDto();
        List<Object[]> results = flightRepository.getFlightChartData(startDate, endDate);

        for (Object[] result : results) {
            LocalDate date = (LocalDate) result[0];
            Long scheduled = ((Number) result[1]).longValue();
            Long departed = ((Number) result[2]).longValue();
            Long arrived = ((Number) result[3]).longValue();
            Long cancelled = ((Number) result[4]).longValue();
            Long delayed = ((Number) result[5]).longValue();

            chartData.addDataPoint(date, scheduled, departed, arrived, cancelled, delayed);
        }

        return chartData;
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
    // ROUTE HELPER METHODS
    // ===============================

    public FlightResponse createFlightWithNewRoute(FlightRequest request, String routeCode, String routeName) {
        log.debug("Creating flight with new route: {}", routeCode);

        // Bu method Reference Manager'a yeni route oluşturma isteği gönderebilir
        // Şimdilik mevcut route ID'nin valid olduğunu varsayıyoruz
        return createFlight(request);
    }

    public Map<String, Object> getFlightRouteInfo(Long id) {
        log.debug("Getting route info for flight: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        Map<String, Object> routeInfo = new HashMap<>();
        routeInfo.put("flightId", flight.getId());
        routeInfo.put("flightNumber", flight.getFlightNumber());
        routeInfo.put("routeId", flight.getRouteId());

        try {
            RouteCache route = referenceDataService.getRoute(flight.getRouteId());
            routeInfo.put("route", route);
        } catch (Exception e) {
            log.warn("Could not fetch route info: {}", e.getMessage());
            routeInfo.put("routeError", e.getMessage());
        }

        return routeInfo;
    }

    public Map<String, Object> getMigrationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("migrationCompleted", true);
        status.put("message", "System is fully route-based. No migration needed.");
        status.put("routeBasedFlights", flightRepository.count());
        status.put("lastUpdated", LocalDateTime.now());
        return status;
    }

    public Page<ArchivedFlightResponse> searchArchivedFlights(ArchiveSearchRequest searchRequest, Pageable pageable) {
        log.debug("Searching archived flights with criteria: {}", searchRequest);
        return archiveServiceClient.searchArchivedFlights(searchRequest, pageable);
    }

    public ArchivedFlightResponse getArchivedFlight(String flightNumber, LocalDate flightDate) {
        log.debug("Getting archived flight: {} on {}", flightNumber, flightDate);
        return archiveServiceClient.getArchivedFlight(flightNumber, flightDate);
    }

    public Map<String, Object> getArchiveStats(LocalDate startDate, LocalDate endDate) {
        log.debug("Getting archive stats from {} to {}", startDate, endDate);
        return archiveServiceClient.getArchiveStats(startDate, endDate);
    }

    

    // ===============================
    // PRIVATE HELPER METHODS
    // ===============================

    private FlightResponse buildFlightResponse(Flight flight) {
        FlightResponse response = flightMapper.toResponse(flight);

        try {
            // Reference data'ları cache'ten al
            response.setAirline(referenceDataService.getAirline(flight.getAirlineId()));
            response.setAircraft(referenceDataService.getAircraft(flight.getAircraftId()));

            // Route bilgilerini al
            if (flight.getRouteId() != null) {
                RouteCache route = referenceDataService.getRoute(flight.getRouteId());
                response.setRoute(route);
                response.setRoutePath(route.getRoutePath());
                response.setRouteDistance(route.getDistance());
                response.setRouteEstimatedTime(route.getEstimatedFlightTime());
                response.setIsMultiSegmentRoute(route.getIsMultiSegment());

                // Route'dan airport bilgilerini al (backward compatibility için)
                if (route.getOriginAirportId() != null) {
                    response.setOriginAirport(referenceDataService.getAirport(route.getOriginAirportId()));
                }
                if (route.getDestinationAirportId() != null) {
                    response.setDestinationAirport(referenceDataService.getAirport(route.getDestinationAirportId()));
                }
            }

            // Connecting flight segments
            if (Boolean.TRUE.equals(flight.getIsConnectingFlight()) && flight.getParentFlightId() == null) {
                List<Flight> segments = flightRepository.findByParentFlightIdOrderBySegmentNumber(flight.getId());
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
                if (firstRoute.getOriginAirportCode() != null) {
                    route.append(firstRoute.getOriginAirportCode());
                }
            }

            for (Flight segment : segments) {
                if (segment.getRouteId() != null) {
                    RouteCache segmentRoute = referenceDataService.getRoute(segment.getRouteId());
                    if (segmentRoute.getDestinationAirportCode() != null) {
                        route.append(" → ").append(segmentRoute.getDestinationAirportCode());
                    }
                }
            }

        } catch (Exception e) {
            log.warn("Error building full route from segments: {}", e.getMessage());
            return "Complex Route";
        }

        return route.toString();
    }

    private void archiveCompletedFlight(Flight flight) {
        try {
            if (FlightStatus.ARRIVED.equals(flight.getStatus()) || FlightStatus.CANCELLED.equals(flight.getStatus())) {
                log.debug("Archiving completed flight: {}", flight.getFlightNumber());

                Map<String, Object> flightData = buildFlightArchiveData(flight);
                archiveServiceClient.archiveFlight(flightData);

                log.info("Flight {} archived successfully", flight.getFlightNumber());
            }
        } catch (Exception e) {
            log.error("Failed to archive flight {}: {}", flight.getFlightNumber(), e.getMessage());
            // Don't fail the main operation if archiving fails
        }
    }

    private Map<String, Object> buildFlightArchiveData(Flight flight) {
        Map<String, Object> data = new HashMap<>();

        // Basic flight info
        data.put("id", flight.getId());
        data.put("flightNumber", flight.getFlightNumber());
        data.put("flightDate", flight.getFlightDate());
        data.put("scheduledDeparture", flight.getScheduledDeparture());
        data.put("scheduledArrival", flight.getScheduledArrival());
        data.put("actualDeparture", flight.getActualDeparture());
        data.put("actualArrival", flight.getActualArrival());
        data.put("status", flight.getStatus());
        data.put("type", flight.getType());
        data.put("passengerCount", flight.getPassengerCount());
        data.put("cargoWeight", flight.getCargoWeight());
        data.put("delayMinutes", flight.getDelayMinutes());
        data.put("delayReason", flight.getDelayReason());
        data.put("gateNumber", flight.getGateNumber());
        data.put("notes", flight.getNotes());
        data.put("createdAt", flight.getCreatedAt());
        data.put("updatedAt", flight.getUpdatedAt());

        // Reference data
        try {
            var airline = referenceDataService.getAirline(flight.getAirlineId());
            if (airline != null) {
                Map<String, Object> airlineData = new HashMap<>();
                airlineData.put("id", airline.getId());
                airlineData.put("iataCode", airline.getIataCode());
                airlineData.put("name", airline.getName());
                airlineData.put("country", airline.getCountry());
                data.put("airline", airlineData);
            }

            var aircraft = referenceDataService.getAircraft(flight.getAircraftId());
            if (aircraft != null) {
                Map<String, Object> aircraftData = new HashMap<>();
                aircraftData.put("id", aircraft.getId());
                aircraftData.put("registrationNumber", aircraft.getRegistrationNumber());
                aircraftData.put("aircraftType", aircraft.getAircraftType());
                aircraftData.put("manufacturer", aircraft.getManufacturer());
                data.put("aircraft", aircraftData);
            }

            if (flight.getRouteId() != null) {
                var route = referenceDataService.getRoute(flight.getRouteId());
                if (route != null) {
                    Map<String, Object> routeData = new HashMap<>();
                    routeData.put("id", route.getId());
                    routeData.put("routeCode", route.getRouteCode());
                    routeData.put("routePath", route.getRoutePath());
                    routeData.put("distance", route.getDistance());
                    data.put("route", routeData);

                    // Airport data from route
                    if (route.getOriginAirportId() != null) {
                        var originAirport = referenceDataService.getAirport(route.getOriginAirportId());
                        if (originAirport != null) {
                            Map<String, Object> originData = new HashMap<>();
                            originData.put("id", originAirport.getId());
                            originData.put("iataCode", originAirport.getIataCode());
                            originData.put("name", originAirport.getName());
                            originData.put("city", originAirport.getCity());
                            data.put("originAirport", originData);
                        }
                    }

                    if (route.getDestinationAirportId() != null) {
                        var destAirport = referenceDataService.getAirport(route.getDestinationAirportId());
                        if (destAirport != null) {
                            Map<String, Object> destData = new HashMap<>();
                            destData.put("id", destAirport.getId());
                            destData.put("iataCode", destAirport.getIataCode());
                            destData.put("name", destAirport.getName());
                            destData.put("city", destAirport.getCity());
                            data.put("destinationAirport", destData);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not populate reference data for archive: {}", e.getMessage());
        }

        // Performance metrics
        if (flight.getActualDeparture() != null && flight.getActualArrival() != null) {
            int actualDuration = (int) Duration.between(flight.getActualDeparture(), flight.getActualArrival()).toMinutes();
            data.put("actualFlightDuration", actualDuration);
        }

        if (flight.getDelayMinutes() != null && flight.getDelayMinutes() > 0) {
            data.put("isDelayed", true);
            data.put("delayCategory", getDelayCategory(flight.getDelayMinutes()));
        } else {
            data.put("isDelayed", false);
        }

        return data;
    }

    private String getDelayCategory(Integer delayMinutes) {
        if (delayMinutes == null || delayMinutes <= 0) return "ON_TIME";
        if (delayMinutes <= 15) return "MINOR_DELAY";
        if (delayMinutes <= 60) return "MODERATE_DELAY";
        return "MAJOR_DELAY";
    }

    /**
     * Route ID çözümleme stratejisi
     */
    private void resolveRouteId(FlightRequest request) {
        // 1. Route ID zaten varsa, doğrula ve devam et
        if (request.isRouteBasedCreation()) {
            log.debug("Using provided route ID: {}", request.getRouteId());
            return;
        }

        // 2. Single airport-based creation
        if (request.isAirportBasedCreation()) {
            log.debug("Auto-finding/creating direct route for airports {} -> {}",
                    request.getOriginAirportId(), request.getDestinationAirportId());

            Long routeId = autoRouteService.findOrCreateDirectRoute(
                    request.getOriginAirportId(), request.getDestinationAirportId());
            request.setRouteId(routeId);

            log.info("Resolved route ID: {} for flight {}", routeId, request.getFlightNumber());
            return;
        }

        // 3. Multi-segment airport-based creation
        if (request.isMultiSegmentAirportCreation()) {
            log.debug("Auto-finding/creating multi-segment route for {} segments",
                    request.getAirportSegments().size());

            Long routeId = autoRouteService.findOrCreateMultiSegmentRoute(
                    request.getAirportSegments(), request.getFlightNumber());
            request.setRouteId(routeId);

            log.info("Resolved multi-segment route ID: {} for flight {}", routeId, request.getFlightNumber());
            return;
        }

        throw new BusinessException("No valid route resolution strategy found");
    }

    /**
     * Single flight creation
     */
    private FlightResponse createSingleFlight(FlightRequest request) {
        // Duplicate check
        if (flightRepository.existsByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())) {
            throw new DuplicateResourceException("Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
        }

        // Aircraft conflict check
        if (flightRepository.hasAircraftConflict(request.getAircraftId(), request.getFlightDate(),
                request.getScheduledDeparture(), request.getScheduledArrival())) {
            throw new BusinessException("Aircraft has conflicting flight schedule");
        }

        // Aircraft-Route compatibility check
        flightValidator.validateAircraftRouteCompatibility(request.getAircraftId(), request.getRouteId());

        Flight flight = flightMapper.toEntity(request);
        flight = flightRepository.save(flight);

        kafkaProducerService.sendFlightEvent("FLIGHT_CREATED", flight);

        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightUpdate("CREATE", response, flight.getId(), flight.getFlightNumber());

        return response;
    }

    /**
     * Multi-segment airport-based flight creation
     */
    private FlightResponse createMultiSegmentAirportFlight(FlightRequest request) {
        log.debug("Creating multi-segment airport-based flight: {}", request.getFlightNumber());

        // Convert airport segments to connecting flight request
        ConnectingFlightRequest connectingRequest = convertToConnectingFlightRequest(request);

        // Use existing connecting flight service
        return connectingFlightService.createConnectingFlight(connectingRequest);
    }

    /**
     * Airport-based request'i connecting flight request'e çevir
     */
    private ConnectingFlightRequest convertToConnectingFlightRequest(FlightRequest request) {
        ConnectingFlightRequest connectingRequest = new ConnectingFlightRequest();

        // Ana uçuş bilgileri
        connectingRequest.setMainFlightNumber(request.getFlightNumber());
        connectingRequest.setAirlineId(request.getAirlineId());
        connectingRequest.setAircraftId(request.getAircraftId());
        connectingRequest.setType(request.getType());
        connectingRequest.setPassengerCount(request.getPassengerCount());
        connectingRequest.setCargoWeight(request.getCargoWeight());
        connectingRequest.setNotes(request.getNotes());
        connectingRequest.setActive(request.getActive());

        // Airport segments'leri flight segments'lere çevir
        List<FlightSegmentRequest> flightSegments = convertAirportSegmentsToFlightSegments(
                request.getAirportSegments(), request);

        connectingRequest.setSegments(flightSegments);

        return connectingRequest;
    }

    /**
     * Airport segments'leri flight segments'lere çevir
     */
    private List<FlightSegmentRequest> convertAirportSegmentsToFlightSegments(
            List<AirportSegmentRequest> airportSegments, FlightRequest request) {

        List<FlightSegmentRequest> flightSegments = new ArrayList<>();

        // Base timing - ilk segment'in zamanı request'ten gelir
        LocalDateTime currentDeparture = request.getScheduledDeparture();

        for (int i = 0; i < airportSegments.size(); i++) {
            AirportSegmentRequest airportSegment = airportSegments.get(i);

            FlightSegmentRequest flightSegment = new FlightSegmentRequest();
            flightSegment.setSegmentNumber(airportSegment.getSegmentOrder());
            flightSegment.setOriginAirportId(airportSegment.getOriginAirportId());
            flightSegment.setDestinationAirportId(airportSegment.getDestinationAirportId());
            flightSegment.setConnectionTimeMinutes(airportSegment.getConnectionTimeMinutes());

            // Timing calculation
            flightSegment.setScheduledDeparture(currentDeparture);

            // Flight duration hesapla (airport'lar arası mesafeye göre)
            Integer estimatedDuration = calculateSegmentDuration(
                    airportSegment.getOriginAirportId(),
                    airportSegment.getDestinationAirportId());

            LocalDateTime segmentArrival = currentDeparture.plusMinutes(estimatedDuration);
            flightSegment.setScheduledArrival(segmentArrival);

            flightSegments.add(flightSegment);

            // Next segment'in departure'ını hesapla (connection time dahil)
            if (i < airportSegments.size() - 1) {
                Integer connectionTime = airportSegment.getConnectionTimeMinutes();
                if (connectionTime == null) {
                    connectionTime = 60; // Default 1 hour connection
                }
                currentDeparture = segmentArrival.plusMinutes(connectionTime);
            }
        }

        return flightSegments;
    }

    /**
     * Segment duration hesaplama
     */
    private Integer calculateSegmentDuration(Long originAirportId, Long destinationAirportId) {
        try {
            var originAirport = referenceDataService.getAirport(originAirportId);
            var destinationAirport = referenceDataService.getAirport(destinationAirportId);

            if (originAirport != null && destinationAirport != null) {
                // Distance-based calculation
                Integer distance = calculateDistanceBetweenAirports(originAirport, destinationAirport);
                return (int) Math.ceil(distance / 800.0 * 60); // 800 km/h average speed
            }
        } catch (Exception e) {
            log.warn("Error calculating segment duration: {}", e.getMessage());
        }

        return 90; // Default 1.5 hours
    }

    /**
     * Airport'lar arası mesafe hesaplama
     */
    private Integer calculateDistanceBetweenAirports(Object originAirport, Object destinationAirport) {
        // AutoRouteService'teki logic'i kullan
        return 500; // Placeholder - gerçek implementation AutoRouteService'te
    }

    // Yeni helper method'lar
    public Map<String, Object> previewMultiSegmentRoute(@Valid List<AirportSegmentRequest> segments) {
        return autoRouteService.previewMultiSegmentRoute(segments);
    }

    public Map<String, Object> previewDirectRoute(Long originAirportId, Long destinationAirportId) {
        return autoRouteService.previewRoute(originAirportId, destinationAirportId);
    }
}