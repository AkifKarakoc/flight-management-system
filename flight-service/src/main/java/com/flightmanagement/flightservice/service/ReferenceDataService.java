package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.cache.RouteCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferenceDataService {

    private final RestTemplate restTemplate;

    @Value("${reference.service.url:http://localhost:8081}")
    private String referenceServiceUrl;

    @Cacheable("airlines")
    public AirlineCache getAirline(Long airlineId) {
        log.debug("Fetching airline data for ID: {}", airlineId);
        try {
            String url = referenceServiceUrl + "/api/v1/airlines/" + airlineId;
            return restTemplate.getForObject(url, AirlineCache.class);
        } catch (Exception e) {
            log.error("Error fetching airline {}: {}", airlineId, e.getMessage());
            throw new RuntimeException("Failed to fetch airline data", e);
        }
    }

    @Cacheable("airports")
    public AirportCache getAirport(Long airportId) {
        log.debug("Fetching airport data for ID: {}", airportId);
        try {
            String url = referenceServiceUrl + "/api/v1/airports/" + airportId;
            return restTemplate.getForObject(url, AirportCache.class);
        } catch (Exception e) {
            log.error("Error fetching airport {}: {}", airportId, e.getMessage());
            throw new RuntimeException("Failed to fetch airport data", e);
        }
    }

    @Cacheable("aircraft")
    public AircraftCache getAircraft(Long aircraftId) {
        log.debug("Fetching aircraft data for ID: {}", aircraftId);
        try {
            String url = referenceServiceUrl + "/api/v1/aircrafts/" + aircraftId;
            return restTemplate.getForObject(url, AircraftCache.class);
        } catch (Exception e) {
            log.error("Error fetching aircraft {}: {}", aircraftId, e.getMessage());
            throw new RuntimeException("Failed to fetch aircraft data", e);
        }
    }

    // YENİ: Route data service
    @Cacheable("routes")
    public RouteCache getRoute(Long routeId) {
        log.debug("Fetching route data for ID: {}", routeId);
        try {
            String url = referenceServiceUrl + "/api/v1/routes/" + routeId;
            return restTemplate.getForObject(url, RouteCache.class);
        } catch (Exception e) {
            log.error("Error fetching route {}: {}", routeId, e.getMessage());
            throw new RuntimeException("Failed to fetch route data", e);
        }
    }

    // Route'dan airport bilgilerini getir (backward compatibility için)
    public AirportCache getOriginAirportFromRoute(Long routeId) {
        try {
            RouteCache route = getRoute(routeId);
            if (route.getOriginAirportId() != null) {
                return getAirport(route.getOriginAirportId());
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching origin airport from route {}: {}", routeId, e.getMessage());
            return null;
        }
    }

    public AirportCache getDestinationAirportFromRoute(Long routeId) {
        try {
            RouteCache route = getRoute(routeId);
            if (route.getDestinationAirportId() != null) {
                return getAirport(route.getDestinationAirportId());
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching destination airport from route {}: {}", routeId, e.getMessage());
            return null;
        }
    }

    // Cache invalidation methods
    public void invalidateAirlineCache(Long airlineId) {
        log.debug("Invalidating airline cache for ID: {}", airlineId);
        // Cache eviction logic here
    }

    public void invalidateAirportCache(Long airportId) {
        log.debug("Invalidating airport cache for ID: {}", airportId);
        // Cache eviction logic here
    }

    public void invalidateAircraftCache(Long aircraftId) {
        log.debug("Invalidating aircraft cache for ID: {}", aircraftId);
        // Cache eviction logic here
    }

    public void invalidateRouteCache(Long routeId) {
        log.debug("Invalidating route cache for ID: {}", routeId);
        // Cache eviction logic here
    }

    // Batch operations for performance
    public RouteCache[] getRoutesByIds(Long[] routeIds) {
        log.debug("Fetching multiple routes: {}", routeIds.length);
        try {
            String url = referenceServiceUrl + "/api/v1/routes/batch";
            return restTemplate.postForObject(url, routeIds, RouteCache[].class);
        } catch (Exception e) {
            log.error("Error fetching multiple routes: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch batch route data", e);
        }
    }

    // Health check
    public boolean isReferenceServiceHealthy() {
        try {
            String url = referenceServiceUrl + "/actuator/health";
            restTemplate.getForObject(url, String.class);
            return true;
        } catch (Exception e) {
            log.warn("Reference service health check failed: {}", e.getMessage());
            return false;
        }
    }
}