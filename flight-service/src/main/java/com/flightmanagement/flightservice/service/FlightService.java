package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.cache.RouteCache;
import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightSegmentRequest;
import com.flightmanagement.flightservice.dto.response.FlightConnectionResponse;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.dto.response.stats.FlightChartDataDto;
import com.flightmanagement.flightservice.dto.response.stats.FlightTypeDistributionDto;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.FlightConnection;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.exception.BusinessException;
import com.flightmanagement.flightservice.exception.DuplicateResourceException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightConnectionRepository;
import com.flightmanagement.flightservice.repository.FlightRepository;
import com.flightmanagement.flightservice.validator.FlightValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

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
    private final FlightConnectionRepository flightConnectionRepository;
    private final FlightMapper flightMapper;
    private final FlightValidator flightValidator;
    private final ReferenceDataService referenceDataService;
    private final KafkaProducerService kafkaProducerService;
    private final WebSocketMessageService webSocketMessageService;
    private final ConnectingFlightService connectingFlightService;
    private final RestTemplate restTemplate;

    @Value("${reference.service.url:http://localhost:8081}")
    private String referenceServiceUrl;

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

        // Route veya airport bilgilerini düzenle
        if (request.isRouteBasedFlight()) {
            populateAirportsFromRoute(request);
        } else if (request.isLegacyFlight()) {
            createOrFindRouteForLegacyFlight(request);
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

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_CREATED", flight);

        // WebSocket notification
        FlightResponse response = buildFlightResponse(flight);
        webSocketMessageService.sendFlightUpdate("CREATE", response, flight.getId(), flight.getFlightNumber());


        return buildFlightResponse(flight);
    }

    public FlightResponse updateFlight(Long id, FlightRequest request) {
        log.debug("Updating flight with id: {}", id);

        Flight existingFlight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flightValidator.validateFlightUpdate(existingFlight, request);

        // Route güncellemesi
        if (request.isRouteBasedFlight()) {
            populateAirportsFromRoute(request);
        }

        FlightResponse oldResponse = buildFlightResponse(existingFlight);

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

        // Status değişiminde otomatik zaman güncellemeleri
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

            // Scheduled times'ı güncelle
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

        // Connecting flights varsa onları da sil
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

        connectingFlightService.validateConnectingFlightRequest(request);

        // Ana uçuş oluştur
        Flight mainFlight = createMainFlight(request);
        mainFlight = flightRepository.save(mainFlight);

        // Segment'leri oluştur
        List<Flight> segments = new ArrayList<>();
        for (int i = 0; i < request.getSegments().size(); i++) {
            Flight segment = createSegmentFlight(mainFlight, request.getSegments().get(i), i + 1);
            segment = flightRepository.save(segment);
            segments.add(segment);

            // Connection kaydı oluştur
            FlightConnection connection = new FlightConnection();
            connection.setMainFlight(mainFlight);
            connection.setSegmentFlight(segment);
            connection.setSegmentOrder(i + 1);
            connection.setConnectionTimeMinutes(request.getSegments().get(i).getConnectionTimeMinutes());
            flightConnectionRepository.save(connection);
        }

        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_CREATED", mainFlight);

        return buildFlightResponse(mainFlight);
    }

    public FlightResponse getConnectingFlightDetails(Long mainFlightId) {
        log.debug("Getting connecting flight details for id: {}", mainFlightId);

        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + mainFlightId));

        return buildFlightResponse(mainFlight);
    }

    public List<FlightResponse> getConnectingFlights(Long mainFlightId) {
        log.debug("Getting connecting flights for main flight: {}", mainFlightId);

        List<Flight> segments = flightRepository.findByParentFlightId(mainFlightId);
        return segments.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    // ===============================
    // STATISTICS AND REPORTING
    // ===============================

    public Map<String, Object> getFlightStatistics(LocalDate date) {
        log.debug("Fetching flight statistics for date: {}", date);

        Map<String, Object> stats = new HashMap<>();

        // Temel sayılar
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

        // Yüzdelik hesaplamalar
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

    public List<FlightTypeDistributionDto> getFlightTypeDistribution() {
        log.debug("Fetching flight type distribution");
        List<Object[]> results = flightRepository.countFlightsGroupedByType();

        return results.stream()
                .map(result -> new FlightTypeDistributionDto((FlightType) result[0], (Long) result[1]))
                .collect(Collectors.toList());
    }

    // ===============================
    // SEARCH AND FILTER OPERATIONS
    // ===============================

    public Page<FlightResponse> searchFlights(String flightNumber, Long airlineId, Long routeId,
                                              LocalDate startDate, LocalDate endDate,
                                              FlightStatus status, Pageable pageable) {
        log.debug("Searching flights with filters");

        // Custom search implementation
        List<Flight> allFlights = flightRepository.findAll();

        List<Flight> filteredFlights = allFlights.stream()
                .filter(flight -> flightNumber == null || flight.getFlightNumber().contains(flightNumber))
                .filter(flight -> airlineId == null || flight.getAirlineId().equals(airlineId))
                .filter(flight -> routeId == null || routeId.equals(flight.getRouteId()))
                .filter(flight -> startDate == null || !flight.getFlightDate().isBefore(startDate))
                .filter(flight -> endDate == null || !flight.getFlightDate().isAfter(endDate))
                .filter(flight -> status == null || flight.getStatus().equals(status))
                .collect(Collectors.toList());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredFlights.size());
        List<Flight> pageContent = filteredFlights.subList(start, end);

        List<FlightResponse> responses = pageContent.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, filteredFlights.size());
    }

    // ===============================
    // MIGRATION AND HELPER METHODS
    // ===============================

    @Transactional
    public void migrateLegacyFlightsToRoutes() {
        log.info("Starting migration of legacy flights to routes");

        List<Flight> legacyFlights = flightRepository.findFlightsNeedingRouteAssignment();
        log.info("Found {} legacy flights to migrate", legacyFlights.size());

        Map<String, Long> routeCache = new HashMap<>();

        for (Flight flight : legacyFlights) {
            try {
                String key = flight.getOriginAirportId() + "-" + flight.getDestinationAirportId();

                Long routeId = routeCache.get(key);
                if (routeId == null) {
                    routeId = findOrCreateRoute(flight.getOriginAirportId(), flight.getDestinationAirportId());
                    routeCache.put(key, routeId);
                }

                flight.setRouteId(routeId);
                flightRepository.save(flight);

                log.debug("Migrated flight {} to route {}", flight.getFlightNumber(), routeId);

            } catch (Exception e) {
                log.error("Failed to migrate flight {}: {}", flight.getId(), e.getMessage());
            }
        }

        log.info("Migration completed. Created {} unique routes", routeCache.size());
    }

    public Map<String, Object> getMigrationStatus() {
        Map<String, Object> status = new HashMap<>();

        List<Flight> needingMigration = flightRepository.findFlightsNeedingRouteAssignment();
        long totalFlights = flightRepository.count();
        long migratedFlights = totalFlights - needingMigration.size();

        status.put("totalFlights", totalFlights);
        status.put("migratedFlights", migratedFlights);
        status.put("needingMigration", needingMigration.size());
        status.put("migrationComplete", needingMigration.isEmpty());
        status.put("migrationPercentage", totalFlights > 0 ? (double) migratedFlights / totalFlights * 100 : 100.0);

        return status;
    }

    public FlightResponse createFlightWithNewRoute(FlightRequest request, String routeCode, String routeName) {
        log.debug("Creating flight with new route: {}", routeCode);

        // Yeni route oluştur
        Long routeId = createNewRoute(request.getOriginAirportId(), request.getDestinationAirportId(),
                routeCode, routeName);

        // Flight request'e route ID ekle
        request.setRouteId(routeId);

        return createFlight(request);
    }

    public Map<String, Object> getFlightRouteInfo(Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + flightId));

        Map<String, Object> info = new HashMap<>();
        info.put("flightId", flight.getId());
        info.put("flightNumber", flight.getFlightNumber());
        info.put("routeId", flight.getRouteId());
        info.put("legacyOriginAirportId", flight.getOriginAirportId());
        info.put("legacyDestinationAirportId", flight.getDestinationAirportId());

        try {
            if (flight.getRouteId() != null) {
                RouteCache route = referenceDataService.getRoute(flight.getRouteId());
                info.put("routeInfo", route);
            }
        } catch (Exception e) {
            info.put("routeError", e.getMessage());
        }

        return info;
    }

    // Eksik metodları ekle
    public List<FlightResponse> getFlightsByAirport(Long airportId) {
        log.debug("Getting flights by airport id: {}", airportId);

        List<Flight> flights = flightRepository.findByOriginAirportIdOrDestinationAirportId(airportId, airportId);
        return flights.stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getDelayedFlights(Integer minDelayMinutes) {
        log.debug("Getting delayed flights with minimum delay: {} minutes", minDelayMinutes);

        List<Flight> flights = flightRepository.findByDelayMinutesGreaterThanEqual(minDelayMinutes);
        return flights.stream()
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

    // FlightService'e eklenecek ek metod:

    public Page<FlightResponse> getAllFlightsWithFilters(Pageable pageable, String flightNumber, Long airlineId, LocalDate flightDate) {
        log.debug("Getting all flights with filters - flightNumber: {}, airlineId: {}, flightDate: {}",
                flightNumber, airlineId, flightDate);

        // Basit filtreleme - daha gelişmiş implementation yapılabilir
        Page<Flight> flightsPage;

        if (flightNumber != null && flightDate != null) {
            List<Flight> flights = flightRepository.findByFlightNumberAndFlightDate(flightNumber, flightDate);
            flightsPage = new PageImpl<>(flights, pageable, flights.size());
        } else if (airlineId != null && flightDate != null) {
            List<Flight> flights = flightRepository.findByAirlineIdAndFlightDate(airlineId, flightDate);
            flightsPage = new PageImpl<>(flights, pageable, flights.size());
        } else if (flightDate != null) {
            List<Flight> flights = flightRepository.findByFlightDate(flightDate);
            flightsPage = new PageImpl<>(flights, pageable, flights.size());
        } else if (airlineId != null) {
            flightsPage = flightRepository.findByAirlineId(airlineId, pageable);
        } else {
            flightsPage = flightRepository.findAll(pageable);
        }

        List<FlightResponse> responses = flightsPage.getContent().stream()
                .map(this::buildFlightResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, flightsPage.getTotalElements());
    }

    // ===============================
    // PRIVATE HELPER METHODS
    // ===============================

    private void populateAirportsFromRoute(FlightRequest request) {
        try {
            RouteCache route = referenceDataService.getRoute(request.getRouteId());

            // Backward compatibility için airport ID'lerini set et
            request.setOriginAirportId(route.getOriginAirportId());
            request.setDestinationAirportId(route.getDestinationAirportId());

            log.debug("Populated airports from route {}: {} -> {}",
                    route.getRouteCode(), route.getOriginAirportCode(), route.getDestinationAirportCode());

        } catch (Exception e) {
            throw new BusinessException("Failed to get route information: " + e.getMessage());
        }
    }

    private void createOrFindRouteForLegacyFlight(FlightRequest request) {
        log.debug("Processing legacy flight - finding or creating route for {} -> {}",
                request.getOriginAirportId(), request.getDestinationAirportId());

        try {
            Long routeId = findOrCreateRoute(request.getOriginAirportId(), request.getDestinationAirportId());
            request.setRouteId(routeId);

            log.debug("Assigned route ID {} to legacy flight", routeId);

        } catch (Exception e) {
            log.warn("Could not create route for legacy flight: {}", e.getMessage());
        }
    }

    private Long findOrCreateRoute(Long originAirportId, Long destinationAirportId) {
        try {
            String url = referenceServiceUrl + "/api/v1/routes/search?originId=" + originAirportId + "&destId=" + destinationAirportId;
            RouteCache existingRoute = restTemplate.getForObject(url, RouteCache.class);

            if (existingRoute != null) {
                return existingRoute.getId();
            }
        } catch (Exception e) {
            log.debug("No existing route found, will create new one");
        }

        return createAutoRoute(originAirportId, destinationAirportId);
    }

    private Long createAutoRoute(Long originAirportId, Long destinationAirportId) {
        try {
            Map<String, Object> routeRequest = new HashMap<>();
            routeRequest.put("routeCode", "AUTO-" + originAirportId + "-" + destinationAirportId);
            routeRequest.put("routeName", "Auto Route " + originAirportId + " to " + destinationAirportId);
            routeRequest.put("originAirportId", originAirportId);
            routeRequest.put("destinationAirportId", destinationAirportId);
            routeRequest.put("routeType", "DOMESTIC");
            routeRequest.put("visibility", "PUBLIC");
            routeRequest.put("isMultiSegment", false);
            routeRequest.put("active", true);

            String url = referenceServiceUrl + "/api/v1/routes";
            RouteCache createdRoute = restTemplate.postForObject(url, routeRequest, RouteCache.class);

            if (createdRoute != null) {
                log.info("Created auto route: {}", createdRoute.getRouteCode());
                return createdRoute.getId();
            }

        } catch (Exception e) {
            log.error("Failed to create auto route: {}", e.getMessage());
        }

        throw new BusinessException("Could not create route for airports: " + originAirportId + " -> " + destinationAirportId);
    }

    private Long createNewRoute(Long originAirportId, Long destinationAirportId, String routeCode, String routeName) {
        try {
            Map<String, Object> routeRequest = new HashMap<>();
            routeRequest.put("routeCode", routeCode);
            routeRequest.put("routeName", routeName);
            routeRequest.put("originAirportId", originAirportId);
            routeRequest.put("destinationAirportId", destinationAirportId);
            routeRequest.put("routeType", "DOMESTIC");
            routeRequest.put("visibility", "PRIVATE");
            routeRequest.put("isMultiSegment", false);
            routeRequest.put("active", true);

            String url = referenceServiceUrl + "/api/v1/routes";
            RouteCache createdRoute = restTemplate.postForObject(url, routeRequest, RouteCache.class);

            if (createdRoute != null) {
                return createdRoute.getId();
            }

        } catch (Exception e) {
            log.error("Failed to create new route: {}", e.getMessage());
        }

        throw new BusinessException("Could not create new route");
    }

    private Flight createMainFlight(ConnectingFlightRequest request) {
        Flight mainFlight = new Flight();
        updateMainFlightFromRequest(mainFlight, request);
        return mainFlight;
    }

    private Flight createSegmentFlight(Flight mainFlight, FlightSegmentRequest segmentRequest, int segmentNumber) {
        Flight segment = new Flight();
        segment.setFlightNumber(mainFlight.getFlightNumber() + "-" + segmentNumber);
        segment.setAirlineId(mainFlight.getAirlineId());
        segment.setAircraftId(mainFlight.getAircraftId());
        segment.setOriginAirportId(segmentRequest.getOriginAirportId());
        segment.setDestinationAirportId(segmentRequest.getDestinationAirportId());
        segment.setFlightDate(segmentRequest.getScheduledDeparture().toLocalDate());
        segment.setScheduledDeparture(segmentRequest.getScheduledDeparture());
        segment.setScheduledArrival(segmentRequest.getScheduledArrival());
        segment.setType(mainFlight.getType());
        segment.setPassengerCount(mainFlight.getPassengerCount());
        segment.setCargoWeight(mainFlight.getCargoWeight());
        segment.setGateNumber(segmentRequest.getGateNumber());
        segment.setNotes(segmentRequest.getNotes());
        segment.setActive(mainFlight.getActive());
        segment.setParentFlightId(mainFlight.getId());
        segment.setSegmentNumber(segmentNumber);
        segment.setIsConnectingFlight(false);
        segment.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());

        return segment;
    }

    private void updateMainFlightFromRequest(Flight mainFlight, ConnectingFlightRequest request) {
        mainFlight.setFlightNumber(request.getMainFlightNumber());
        mainFlight.setAirlineId(request.getAirlineId());
        mainFlight.setAircraftId(request.getAircraftId());
        mainFlight.setType(request.getType());
        mainFlight.setPassengerCount(request.getPassengerCount());
        mainFlight.setCargoWeight(request.getCargoWeight());
        mainFlight.setNotes(request.getNotes());
        mainFlight.setActive(request.getActive());
        mainFlight.setIsConnectingFlight(true);
        mainFlight.setSegmentNumber(0);

        FlightSegmentRequest firstSegment = request.getSegments().get(0);
        FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
        mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
        mainFlight.setFlightDate(firstSegment.getScheduledDeparture().toLocalDate());
        mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
        mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());
    }

    private FlightResponse buildFlightResponse(Flight flight) {
        FlightResponse response = flightMapper.toResponse(flight);

        try {
            // Reference data'ları al
            response.setAirline(referenceDataService.getAirline(flight.getAirlineId()));
            response.setAircraft(referenceDataService.getAircraft(flight.getAircraftId()));

            // Route bilgilerini ekle
            if (flight.getRouteId() != null) {
                RouteCache route = referenceDataService.getRoute(flight.getRouteId());
                response.setRoute(route);
                response.setRoutePath(route.getRoutePath());
                response.setRouteDistance(route.getDistance());
                response.setRouteEstimatedTime(route.getEstimatedFlightTime());
                response.setIsMultiSegmentRoute(route.getIsMultiSegment());

                // Airport bilgilerini route'dan al
                if (route.getOriginAirportId() != null) {
                    response.setOriginAirport(referenceDataService.getAirport(route.getOriginAirportId()));
                }
                if (route.getDestinationAirportId() != null) {
                    response.setDestinationAirport(referenceDataService.getAirport(route.getDestinationAirportId()));
                }
            } else {
                // Legacy airport bilgileri (backward compatibility)
                if (flight.getOriginAirportId() != null) {
                    response.setOriginAirport(referenceDataService.getAirport(flight.getOriginAirportId()));
                }
                if (flight.getDestinationAirportId() != null) {
                    response.setDestinationAirport(referenceDataService.getAirport(flight.getDestinationAirportId()));
                }
            }

            // Connecting flights varsa ekle
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
            // Response'u eksik bilgi ile döndür
        }

        return response;
    }

    private String buildFullRouteFromSegments(List<Flight> segments) {
        if (segments.isEmpty()) return "";

        StringBuilder route = new StringBuilder();

        try {
            // İlk segment'in origin'i
            Flight firstSegment = segments.get(0);
            if (firstSegment.getRouteId() != null) {
                RouteCache firstRoute = referenceDataService.getRoute(firstSegment.getRouteId());
                route.append(firstRoute.getOriginAirportCode());
            } else if (firstSegment.getOriginAirportId() != null) {
                AirportCache originAirport = referenceDataService.getAirport(firstSegment.getOriginAirportId());
                route.append(originAirport.getIataCode());
            }

            // Tüm segment'lerin destination'ları
            for (Flight segment : segments) {
                if (segment.getRouteId() != null) {
                    RouteCache segmentRoute = referenceDataService.getRoute(segment.getRouteId());
                    route.append(" → ").append(segmentRoute.getDestinationAirportCode());
                } else if (segment.getDestinationAirportId() != null) {
                    AirportCache destAirport = referenceDataService.getAirport(segment.getDestinationAirportId());
                    route.append(" → ").append(destAirport.getIataCode());
                }
            }

        } catch (Exception e) {
            log.warn("Error building full route from segments: {}", e.getMessage());
            return "Complex Route";
        }

        return route.toString();
    }

    // ===============================
    // STATISTICS METHODS
    // ===============================

    /**
     * Belirtilen tarihte toplam uçuş sayısını getirir
     */
    public Long getFlightCountByDate(LocalDate date) {
        log.debug("Getting flight count for date: {}", date);
        return flightRepository.countFlightsByDate(date);
    }

    /**
     * Belirtilen havayolu ve tarihte uçuş sayısını getirir
     */
    public Long getFlightCountByAirlineAndDate(Long airlineId, LocalDate date) {
        log.debug("Getting flight count for airline {} and date: {}", airlineId, date);
        return flightRepository.countFlightsByAirlineAndDate(airlineId, date);
    }

    /**
     * Belirtilen durum ve tarihte uçuş sayısını getirir
     */
    public Long getFlightCountByStatus(FlightStatus status, LocalDate date) {
        log.debug("Getting flight count for status {} and date: {}", status, date);
        return flightRepository.countFlightsByStatusAndDate(status, date);
    }

    /**
     * Günlük özet istatistikleri getirir
     */
    public Map<String, Object> getDailySummary(LocalDate date) {
        log.debug("Getting daily summary for date: {}", date);
        return calculateDailyStats(date);
    }

    /**
     * Chart verisi için uçuş sayılarını getirir
     */
    public FlightChartDataDto getFlightChartData(LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching flight chart data from {} to {}", startDate, endDate);

        FlightChartDataDto chartData = new FlightChartDataDto();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            // Her status için count'ları al
            long scheduledCount = flightRepository.countFlightsByStatusAndDate(FlightStatus.SCHEDULED, currentDate);
            long departedCount = flightRepository.countFlightsByStatusAndDate(FlightStatus.DEPARTED, currentDate);
            long arrivedCount = flightRepository.countFlightsByStatusAndDate(FlightStatus.ARRIVED, currentDate);
            long cancelledCount = flightRepository.countFlightsByStatusAndDate(FlightStatus.CANCELLED, currentDate);
            long delayedCount = flightRepository.countFlightsByStatusAndDate(FlightStatus.DELAYED, currentDate);

            chartData.addDataPoint(currentDate, scheduledCount, departedCount, arrivedCount, cancelledCount, delayedCount);
            currentDate = currentDate.plusDays(1);
        }

        return chartData;
    }

    /**
     * Günlük istatistikleri hesaplar
     */
    private Map<String, Object> calculateDailyStats(LocalDate date) {
        log.debug("Calculating daily stats for date: {}", date);

        Map<String, Object> stats = new HashMap<>();

        // Temel sayılar
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

        // Yüzdelik hesaplamalar
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
}