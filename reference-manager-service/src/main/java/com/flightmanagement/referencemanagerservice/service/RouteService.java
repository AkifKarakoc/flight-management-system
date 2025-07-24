package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.dto.request.RouteRequest;
import com.flightmanagement.referencemanagerservice.dto.request.RouteSegmentRequest;
import com.flightmanagement.referencemanagerservice.dto.response.DeletionCheckResult;
import com.flightmanagement.referencemanagerservice.dto.response.RouteResponse;
import com.flightmanagement.referencemanagerservice.entity.Airport;
import com.flightmanagement.referencemanagerservice.entity.Route;
import com.flightmanagement.referencemanagerservice.entity.RouteSegment;
import com.flightmanagement.referencemanagerservice.entity.enums.RouteVisibility;
import com.flightmanagement.referencemanagerservice.exception.ResourceNotFoundException;
import com.flightmanagement.referencemanagerservice.exception.BusinessException;
import com.flightmanagement.referencemanagerservice.exception.DuplicateResourceException;
import com.flightmanagement.referencemanagerservice.mapper.RouteMapper;
import com.flightmanagement.referencemanagerservice.repository.AirportRepository;
import com.flightmanagement.referencemanagerservice.repository.RouteRepository;
import com.flightmanagement.referencemanagerservice.repository.RouteSegmentRepository;
import com.flightmanagement.referencemanagerservice.validator.RouteDeletionValidator;
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
public class RouteService {
    private final RouteRepository routeRepository;
    private final RouteSegmentRepository routeSegmentRepository;
    private final AirportRepository airportRepository;
    private final RouteMapper routeMapper;
    private final KafkaProducerService kafkaProducerService;
    private final RouteDeletionValidator deletionValidator;

    // Admin için tüm route'ları getir
    public List<RouteResponse> getAllRoutes() {
        log.debug("Admin fetching all routes");
        return routeRepository.findAllForAdmin().stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    // Kullanıcı için görünür route'ları getir
    public List<RouteResponse> getRoutesForUser(Long userId, boolean isAdmin) {
        log.debug("Fetching routes for user: {}, isAdmin: {}", userId, isAdmin);

        List<Route> routes;
        if (isAdmin) {
            routes = routeRepository.findAllForAdmin();
        } else {
            routes = routeRepository.findVisibleRoutesForUser(userId);
        }

        return routes.stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    // Kullanıcının kendi oluşturduğu route'ları getir
    public List<RouteResponse> getUserRoutes(Long userId) {
        log.debug("Fetching user's own routes for user: {}", userId);
        return routeRepository.findByCreatedByUserId(userId).stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    // Havayolu için paylaşılan route'ları getir
    public List<RouteResponse> getSharedRoutesForAirline(Long airlineId) {
        log.debug("Fetching shared routes for airline: {}", airlineId);
        return routeRepository.findSharedRoutesForAirline(airlineId).stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    public RouteResponse getRouteById(Long id) {
        log.debug("Fetching route with id: {}", id);
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        return routeMapper.toResponse(route);
    }

    public DeletionCheckResult checkRouteDeletion(Long id) {
        log.debug("Checking deletion dependencies for route with id: {}", id);

        routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        return deletionValidator.checkDependencies(id);
    }

    public RouteResponse createRoute(RouteRequest request, Long currentUserId, boolean isAdmin) {
        log.debug("Creating new route: {} by user: {}", request.getRouteCode(), currentUserId);

        // Validasyonlar
        validateRouteRequest(request);

        // Route code unique kontrolü
        if (routeRepository.existsByRouteCode(request.getRouteCode())) {
            throw new DuplicateResourceException("Route with code '" + request.getRouteCode() + "' already exists");
        }

        // Route oluştur
        Route route = new Route();
        route.setRouteCode(request.getRouteCode());
        route.setRouteName(request.getRouteName());
        route.setRouteType(request.getRouteType());
        route.setActive(request.getActive());
        route.setCreatedByUserId(currentUserId);
        route.setVisibility(request.getVisibility());
        route.setAirlineId(request.getAirlineId());
        route.setIsMultiSegment(request.getIsMultiSegment());

        if (request.isSimpleRoute()) {
            // Basit route (tek segment)
            createSimpleRoute(route, request);
        } else if (request.isMultiSegmentRoute()) {
            // Multi-segment route
            createMultiSegmentRoute(route, request);
        } else {
            throw new BusinessException("Route must be either simple or multi-segment");
        }

        route = routeRepository.save(route);

        kafkaProducerService.sendRouteEvent("ROUTE_CREATED", route);

        return routeMapper.toResponse(route);
    }

    public RouteResponse updateRoute(Long id, RouteRequest request, Long currentUserId, boolean isAdmin) {
        log.debug("Updating route with id: {} by user: {}", id, currentUserId);

        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        // Ownership kontrolü (admin her şeyi güncelleyebilir)
        if (!isAdmin && !route.getCreatedByUserId().equals(currentUserId)) {
            throw new BusinessException("You can only update your own routes");
        }

        validateRouteRequest(request);

        // Route code değişirse unique kontrolü
        if (!route.getRouteCode().equals(request.getRouteCode()) &&
                routeRepository.existsByRouteCode(request.getRouteCode())) {
            throw new DuplicateResourceException("Route with code '" + request.getRouteCode() + "' already exists");
        }

        // Temel bilgileri güncelle
        route.setRouteCode(request.getRouteCode());
        route.setRouteName(request.getRouteName());
        route.setRouteType(request.getRouteType());
        route.setActive(request.getActive());
        route.setVisibility(request.getVisibility());
        route.setAirlineId(request.getAirlineId());

        // Route tipi değişirse segment'leri güncelle
        if (!route.getIsMultiSegment().equals(request.getIsMultiSegment())) {
            // Mevcut segment'leri temizle
            routeSegmentRepository.deleteByRouteId(route.getId());
            route.getSegments().clear();

            route.setIsMultiSegment(request.getIsMultiSegment());

            if (request.isSimpleRoute()) {
                updateSimpleRoute(route, request);
            } else if (request.isMultiSegmentRoute()) {
                updateMultiSegmentRoute(route, request);
            }
        } else {
            // Aynı tip, sadece detayları güncelle
            if (request.isSimpleRoute()) {
                updateSimpleRoute(route, request);
            } else if (request.isMultiSegmentRoute()) {
                updateMultiSegmentRoute(route, request);
            }
        }

        route = routeRepository.save(route);

        kafkaProducerService.sendRouteEvent("ROUTE_UPDATED", route);

        return routeMapper.toResponse(route);
    }

    public void deleteRoute(Long id, Long currentUserId, boolean isAdmin) {
        log.debug("Deleting route with id: {} by user: {}", id, currentUserId);

        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        // Ownership kontrolü
        if (!isAdmin && !route.getCreatedByUserId().equals(currentUserId)) {
            throw new BusinessException("You can only delete your own routes");
        }

        // Bağımlılık kontrolü
        DeletionCheckResult deletionCheck = deletionValidator.checkDependencies(id);
        if (!deletionCheck.isCanDelete()) {
            throw new BusinessException("Cannot delete route. " + deletionCheck.getReason());
        }

        routeRepository.delete(route);

        kafkaProducerService.sendRouteEvent("ROUTE_DELETED", route);
    }

    // Backward compatibility için eski metod (system user olarak çalışır)
    public void deleteRoute(Long id) {
        log.debug("Deleting route with id: {} (system operation)", id);
        deleteRoute(id, 0L, true); // System user ID=0, admin=true
    }

    // Route code generate etme (auto-generation için)
    public String generateRouteCode(String prefix) {
        int counter = 1;
        String code;
        do {
            code = String.format("%s-%03d", prefix, counter);
            counter++;
        } while (routeRepository.existsByRouteCode(code));

        return code;
    }

    // Private helper methods
    private void validateRouteRequest(RouteRequest request) {
        if (request.isSimpleRoute()) {
            validateSimpleRoute(request);
        } else if (request.isMultiSegmentRoute()) {
            validateMultiSegmentRoute(request);
        } else {
            throw new BusinessException("Invalid route configuration");
        }
    }

    private void validateSimpleRoute(RouteRequest request) {
        if (request.getOriginAirportId() == null || request.getDestinationAirportId() == null) {
            throw new BusinessException("Origin and destination airports are required for simple route");
        }

        if (request.getOriginAirportId().equals(request.getDestinationAirportId())) {
            throw new BusinessException("Origin and destination airports cannot be the same");
        }
    }

    private void validateMultiSegmentRoute(RouteRequest request) {
        if (request.getSegments() == null || request.getSegments().size() < 2) {
            throw new BusinessException("Multi-segment route must have at least 2 segments");
        }

        // Segment'lerin bağlantısını kontrol et
        for (int i = 0; i < request.getSegments().size() - 1; i++) {
            RouteSegmentRequest current = request.getSegments().get(i);
            RouteSegmentRequest next = request.getSegments().get(i + 1);

            if (!current.getDestinationAirportId().equals(next.getOriginAirportId())) {
                throw new BusinessException("Segment " + (i + 1) + " destination must match segment " + (i + 2) + " origin");
            }
        }
    }

    private void createSimpleRoute(Route route, RouteRequest request) {
        Airport originAirport = airportRepository.findById(request.getOriginAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Origin airport not found"));

        Airport destinationAirport = airportRepository.findById(request.getDestinationAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination airport not found"));

        route.setOriginAirport(originAirport);
        route.setDestinationAirport(destinationAirport);
        route.setDistance(request.getDistance());
        route.setEstimatedFlightTime(request.getEstimatedFlightTime());
    }

    private void createMultiSegmentRoute(Route route, RouteRequest request) {
        int totalDistance = 0;
        int totalTime = 0;

        for (RouteSegmentRequest segmentRequest : request.getSegments()) {
            RouteSegment segment = createRouteSegment(route, segmentRequest);
            route.addSegment(segment);

            if (segment.getDistance() != null) totalDistance += segment.getDistance();
            if (segment.getEstimatedFlightTime() != null) totalTime += segment.getEstimatedFlightTime();
        }

        route.setDistance(totalDistance);
        route.setEstimatedFlightTime(totalTime);

        // İlk ve son segment'ten origin/destination belirle
        RouteSegmentRequest firstSegment = request.getSegments().get(0);
        RouteSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        route.setOriginAirport(airportRepository.findById(firstSegment.getOriginAirportId()).orElse(null));
        route.setDestinationAirport(airportRepository.findById(lastSegment.getDestinationAirportId()).orElse(null));
    }

    private void updateSimpleRoute(Route route, RouteRequest request) {
        createSimpleRoute(route, request);
    }

    private void updateMultiSegmentRoute(Route route, RouteRequest request) {
        // Mevcut segment'leri temizle
        routeSegmentRepository.deleteByRouteId(route.getId());
        route.getSegments().clear();

        // Yeni segment'leri oluştur
        createMultiSegmentRoute(route, request);
    }

    private RouteSegment createRouteSegment(Route route, RouteSegmentRequest request) {
        Airport originAirport = airportRepository.findById(request.getOriginAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Origin airport not found for segment"));

        Airport destinationAirport = airportRepository.findById(request.getDestinationAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination airport not found for segment"));

        RouteSegment segment = new RouteSegment();
        segment.setRoute(route);
        segment.setSegmentOrder(request.getSegmentOrder());
        segment.setOriginAirport(originAirport);
        segment.setDestinationAirport(destinationAirport);
        segment.setDistance(request.getDistance());
        segment.setEstimatedFlightTime(request.getEstimatedFlightTime());
        segment.setActive(request.getActive());

        return segment;
    }

    // Eski createRoute signature için wrapper
    public RouteResponse createRoute(RouteRequest request) {
        log.debug("Creating route with legacy signature");
        Long systemUserId = 0L; // System user
        boolean isAdmin = true;  // System operation
        return createRoute(request, systemUserId, isAdmin);
    }

    // Eski updateRoute signature için wrapper
    public RouteResponse updateRoute(Long id, RouteRequest request) {
        log.debug("Updating route with legacy signature");
        Long systemUserId = 0L; // System user
        boolean isAdmin = true;  // System operation
        return updateRoute(id, request, systemUserId, isAdmin);
    }

}