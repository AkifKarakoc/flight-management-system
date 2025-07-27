package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.cache.RouteCache;
import com.flightmanagement.flightservice.dto.request.AirportSegmentRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoRouteService {

    private final RestTemplate restTemplate;
    private final ReferenceDataService referenceDataService;
    private final ServiceTokenManager serviceTokenManager;

    @Value("${reference-manager.base-url}")
    private String referenceServiceUrl;

    /**
     * Single segment için route bulur veya oluşturur
     */
    public Long findOrCreateDirectRoute(Long originAirportId, Long destinationAirportId) {
        log.debug("Finding or creating direct route for {} -> {}", originAirportId, destinationAirportId);

        try {
            // 1. Önce exact match ara
            RouteCache existingRoute = findExactDirectRoute(originAirportId, destinationAirportId);
            if (existingRoute != null) {
                log.debug("Found existing direct route: {} ({})", existingRoute.getRouteCode(), existingRoute.getId());
                return existingRoute.getId();
            }

            // 2. Bulunamazsa yeni oluştur
            return createNewDirectRoute(originAirportId, destinationAirportId);

        } catch (Exception e) {
            log.error("Error finding/creating direct route for {} -> {}: {}",
                    originAirportId, destinationAirportId, e.getMessage());
            throw new RuntimeException("Failed to find or create direct route", e);
        }
    }

    /**
     * Multi-segment için route bulur veya oluşturur
     */
    public Long findOrCreateMultiSegmentRoute(List<AirportSegmentRequest> airportSegments, String mainFlightNumber) {
        log.debug("Finding or creating multi-segment route for {} segments", airportSegments.size());

        try {
            // 1. Önce exact match ara
            RouteCache existingRoute = findExactMultiSegmentRoute(airportSegments);
            if (existingRoute != null) {
                log.debug("Found existing multi-segment route: {} ({})", existingRoute.getRouteCode(), existingRoute.getId());
                return existingRoute.getId();
            }

            // 2. Bulunamazsa yeni oluştur
            return createNewMultiSegmentRoute(airportSegments, mainFlightNumber);

        } catch (Exception e) {
            log.error("Error finding/creating multi-segment route: {}", e.getMessage());
            throw new RuntimeException("Failed to find or create multi-segment route", e);
        }
    }

    /**
     * Exact direct route bulma
     */
    private RouteCache findExactDirectRoute(Long originAirportId, Long destinationAirportId) {
        try {
            RouteCache[] existingRoutes = referenceDataService.getActiveRoutes();

            for (RouteCache route : existingRoutes) {
                if (isExactDirectMatch(route, originAirportId, destinationAirportId)) {
                    return route;
                }
            }
        } catch (Exception e) {
            log.warn("Error searching existing direct routes: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Exact multi-segment route bulma
     */
    private RouteCache findExactMultiSegmentRoute(List<AirportSegmentRequest> segments) {
        try {
            RouteCache[] existingRoutes = referenceDataService.getActiveRoutes();

            for (RouteCache route : existingRoutes) {
                if (isExactMultiSegmentMatch(route, segments)) {
                    return route;
                }
            }
        } catch (Exception e) {
            log.warn("Error searching existing multi-segment routes: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Direct route exact match kontrolü
     */
    private boolean isExactDirectMatch(RouteCache route, Long originId, Long destId) {
        return route.getOriginAirportId() != null &&
                route.getDestinationAirportId() != null &&
                route.getOriginAirportId().equals(originId) &&
                route.getDestinationAirportId().equals(destId) &&
                route.isActive() &&
                !route.isMultiSegmentRoute(); // Tek segment olmalı
    }

    /**
     * Multi-segment route exact match kontrolü
     */
    private boolean isExactMultiSegmentMatch(RouteCache route, List<AirportSegmentRequest> segments) {
        if (!route.isMultiSegmentRoute() ||
                route.getSegmentCount() == null ||
                route.getSegmentCount() != segments.size()) {
            return false;
        }

        // TODO: Segment detaylarını karşılaştır
        // Bu için Reference Manager'dan route segments'leri almak gerekir
        // Şimdilik false döndürüyoruz - implementation'ı daha sonra tamamlarız
        return false;
    }

    /**
     * Yeni direct route oluşturma
     */
    private Long createNewDirectRoute(Long originAirportId, Long destinationAirportId) {
        try {
            AirportCache originAirport = referenceDataService.getAirport(originAirportId);
            AirportCache destinationAirport = referenceDataService.getAirport(destinationAirportId);

            if (originAirport == null || destinationAirport == null) {
                throw new RuntimeException("Invalid airport IDs provided");
            }

            Map<String, Object> routeData = buildDirectRouteData(originAirport, destinationAirport);
            return createRouteInReferenceManager(routeData);

        } catch (Exception e) {
            log.error("Error creating new direct route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create new direct route", e);
        }
    }

    /**
     * Yeni multi-segment route oluşturma
     */
    private Long createNewMultiSegmentRoute(List<AirportSegmentRequest> airportSegments, String mainFlightNumber) {
        try {
            Map<String, Object> routeData = buildMultiSegmentRouteData(airportSegments, mainFlightNumber);
            return createRouteInReferenceManager(routeData);

        } catch (Exception e) {
            log.error("Error creating new multi-segment route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create new multi-segment route", e);
        }
    }

    /**
     * Direct route data builder
     */
    private Map<String, Object> buildDirectRouteData(AirportCache originAirport, AirportCache destinationAirport) {
        Map<String, Object> routeData = new HashMap<>();

        String routeCode = generateDirectRouteCode(originAirport.getIataCode(), destinationAirport.getIataCode());
        String routeName = String.format("%s to %s Route", originAirport.getName(), destinationAirport.getName());
        String routeType = determineRouteType(originAirport.getCountry(), destinationAirport.getCountry());
        Integer distance = calculateEstimatedDistance(originAirport, destinationAirport);
        Integer flightTime = calculateEstimatedFlightTime(distance);

        routeData.put("routeCode", routeCode);
        routeData.put("routeName", routeName);
        routeData.put("routeType", routeType);
        routeData.put("visibility", "PUBLIC");
        routeData.put("active", true);
        routeData.put("distance", distance);
        routeData.put("estimatedFlightTime", flightTime);
        routeData.put("isMultiSegment", false);

        // Single segment
        Map<String, Object> segment = new HashMap<>();
        segment.put("segmentOrder", 1);
        segment.put("originAirportId", originAirport.getId());
        segment.put("destinationAirportId", destinationAirport.getId());
        segment.put("distance", distance);
        segment.put("estimatedFlightTime", flightTime);
        segment.put("active", true);

        routeData.put("segments", java.util.List.of(segment));

        return routeData;
    }

    /**
     * Multi-segment route data builder
     */
    private Map<String, Object> buildMultiSegmentRouteData(List<AirportSegmentRequest> airportSegments, String mainFlightNumber) {
        Map<String, Object> routeData = new HashMap<>();

        // İlk ve son airport'ları al
        AirportSegmentRequest firstSegment = airportSegments.get(0);
        AirportSegmentRequest lastSegment = airportSegments.get(airportSegments.size() - 1);

        AirportCache firstOrigin = referenceDataService.getAirport(firstSegment.getOriginAirportId());
        AirportCache lastDestination = referenceDataService.getAirport(lastSegment.getDestinationAirportId());

        if (firstOrigin == null || lastDestination == null) {
            throw new RuntimeException("Invalid airport IDs in segments");
        }

        String routeCode = generateMultiSegmentRouteCode(firstOrigin.getIataCode(), lastDestination.getIataCode(), airportSegments.size());
        String routeName = String.format("%s to %s Multi-Segment Route (%d stops)",
                firstOrigin.getName(), lastDestination.getName(), airportSegments.size() - 1);

        // Route type'ı tüm segment'lere göre belirle
        String routeType = determineMultiSegmentRouteType(airportSegments);

        // Total distance ve time hesapla
        Integer totalDistance = calculateTotalDistance(airportSegments);
        Integer totalFlightTime = calculateTotalFlightTime(airportSegments);

        routeData.put("routeCode", routeCode);
        routeData.put("routeName", routeName);
        routeData.put("routeType", routeType);
        routeData.put("visibility", "PUBLIC");
        routeData.put("active", true);
        routeData.put("distance", totalDistance);
        routeData.put("estimatedFlightTime", totalFlightTime);
        routeData.put("isMultiSegment", true);

        // Segments oluştur
        List<Map<String, Object>> segments = new ArrayList<>();
        for (int i = 0; i < airportSegments.size(); i++) {
            AirportSegmentRequest airportSegment = airportSegments.get(i);

            AirportCache origin = referenceDataService.getAirport(airportSegment.getOriginAirportId());
            AirportCache destination = referenceDataService.getAirport(airportSegment.getDestinationAirportId());

            if (origin == null || destination == null) {
                throw new RuntimeException("Invalid airport ID in segment " + (i + 1));
            }

            Integer segmentDistance = calculateEstimatedDistance(origin, destination);
            Integer segmentFlightTime = calculateEstimatedFlightTime(segmentDistance);

            Map<String, Object> segment = new HashMap<>();
            segment.put("segmentOrder", i + 1);
            segment.put("originAirportId", airportSegment.getOriginAirportId());
            segment.put("destinationAirportId", airportSegment.getDestinationAirportId());
            segment.put("distance", segmentDistance);
            segment.put("estimatedFlightTime", segmentFlightTime);
            segment.put("active", true);

            segments.add(segment);
        }

        routeData.put("segments", segments);

        return routeData;
    }

    /**
     * Reference Manager'a route creation request
     */
    private Long createRouteInReferenceManager(Map<String, Object> routeData) {
        String url = referenceServiceUrl + "/api/v1/routes";
        HttpHeaders headers = createAuthHeaders();
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(routeData, headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object idObj = response.getBody().get("id");
            Long routeId = ((Number) idObj).longValue();

            log.info("Created new route with ID: {}", routeId);
            return routeId;
        } else {
            throw new RuntimeException("Failed to create route in Reference Manager");
        }
    }

    // Helper methods
    private String generateDirectRouteCode(String originCode, String destCode) {
        long timestamp = System.currentTimeMillis() % 10000;
        return String.format("%s-%s-D%d", originCode, destCode, timestamp);
    }

    private String generateMultiSegmentRouteCode(String originCode, String destCode, int segmentCount) {
        long timestamp = System.currentTimeMillis() % 10000;
        return String.format("%s-%s-M%d-%d", originCode, destCode, segmentCount, timestamp);
    }

    private String determineRouteType(String originCountry, String destCountry) {
        if (originCountry != null && destCountry != null && originCountry.equals(destCountry)) {
            return "DOMESTIC";
        } else {
            return "INTERNATIONAL";
        }
    }

    private String determineMultiSegmentRouteType(List<AirportSegmentRequest> segments) {
        try {
            Set<String> countries = new HashSet<>();

            for (AirportSegmentRequest segment : segments) {
                AirportCache origin = referenceDataService.getAirport(segment.getOriginAirportId());
                AirportCache destination = referenceDataService.getAirport(segment.getDestinationAirportId());

                if (origin != null && origin.getCountry() != null) {
                    countries.add(origin.getCountry());
                }
                if (destination != null && destination.getCountry() != null) {
                    countries.add(destination.getCountry());
                }
            }

            return countries.size() > 1 ? "INTERNATIONAL" : "DOMESTIC";
        } catch (Exception e) {
            log.warn("Error determining multi-segment route type: {}", e.getMessage());
            return "INTERNATIONAL"; // Default to international for safety
        }
    }

    private Integer calculateTotalDistance(List<AirportSegmentRequest> segments) {
        int totalDistance = 0;

        for (AirportSegmentRequest segment : segments) {
            try {
                AirportCache origin = referenceDataService.getAirport(segment.getOriginAirportId());
                AirportCache destination = referenceDataService.getAirport(segment.getDestinationAirportId());

                if (origin != null && destination != null) {
                    totalDistance += calculateEstimatedDistance(origin, destination);
                }
            } catch (Exception e) {
                log.warn("Error calculating distance for segment: {}", e.getMessage());
                totalDistance += 500; // Default segment distance
            }
        }

        return totalDistance;
    }

    private Integer calculateTotalFlightTime(List<AirportSegmentRequest> segments) {
        int totalFlightTime = 0;

        for (AirportSegmentRequest segment : segments) {
            try {
                AirportCache origin = referenceDataService.getAirport(segment.getOriginAirportId());
                AirportCache destination = referenceDataService.getAirport(segment.getDestinationAirportId());

                if (origin != null && destination != null) {
                    Integer distance = calculateEstimatedDistance(origin, destination);
                    totalFlightTime += calculateEstimatedFlightTime(distance);
                }

                // Connection time ekle (son segment hariç)
                if (segment.getConnectionTimeMinutes() != null) {
                    totalFlightTime += segment.getConnectionTimeMinutes();
                }
            } catch (Exception e) {
                log.warn("Error calculating flight time for segment: {}", e.getMessage());
                totalFlightTime += 90; // Default segment time
            }
        }

        return totalFlightTime;
    }

    // Existing helper methods...
    private Integer calculateEstimatedDistance(AirportCache origin, AirportCache destination) {
        if (origin.getLatitude() != null && origin.getLongitude() != null &&
                destination.getLatitude() != null && destination.getLongitude() != null) {

            return calculateHaversineDistance(
                    origin.getLatitude(), origin.getLongitude(),
                    destination.getLatitude(), destination.getLongitude()
            );
        }

        if (origin.getCountry() != null && destination.getCountry() != null) {
            if (origin.getCountry().equals(destination.getCountry())) {
                return 400; // Domestic flight average
            } else {
                return 1200; // International flight average
            }
        }

        return 600; // Default estimate
    }

    private Integer calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (int) (R * c); // Distance in km
    }

    private Integer calculateEstimatedFlightTime(Integer distance) {
        if (distance != null) {
            double hours = distance / 800.0; // 800 km/h average speed
            return (int) Math.ceil(hours * 60); // Convert to minutes
        }
        return 90; // Default 1.5 hours
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String token = serviceTokenManager.getServiceToken();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        headers.set("Content-Type", "application/json");
        return headers;
    }

    /**
     * Multi-segment route preview
     */
    public Map<String, Object> previewMultiSegmentRoute(List<AirportSegmentRequest> segments) {
        try {
            Map<String, Object> preview = new HashMap<>();

            // Segment details
            List<Map<String, Object>> segmentPreviews = new ArrayList<>();
            int totalDistance = 0;
            int totalFlightTime = 0;

            for (int i = 0; i < segments.size(); i++) {
                AirportSegmentRequest segment = segments.get(i);
                AirportCache origin = referenceDataService.getAirport(segment.getOriginAirportId());
                AirportCache destination = referenceDataService.getAirport(segment.getDestinationAirportId());

                if (origin == null || destination == null) {
                    throw new RuntimeException("Invalid airport ID in segment " + (i + 1));
                }

                Integer segmentDistance = calculateEstimatedDistance(origin, destination);
                Integer segmentFlightTime = calculateEstimatedFlightTime(segmentDistance);

                totalDistance += segmentDistance;
                totalFlightTime += segmentFlightTime;

                if (segment.getConnectionTimeMinutes() != null) {
                    totalFlightTime += segment.getConnectionTimeMinutes();
                }

                Map<String, Object> segmentPreview = new HashMap<>();
                segmentPreview.put("segmentOrder", i + 1);
                segmentPreview.put("originAirport", origin);
                segmentPreview.put("destinationAirport", destination);
                segmentPreview.put("distance", segmentDistance);
                segmentPreview.put("flightTime", segmentFlightTime);
                segmentPreview.put("connectionTime", segment.getConnectionTimeMinutes());
                segmentPreview.put("route", origin.getIataCode() + " → " + destination.getIataCode());

                segmentPreviews.add(segmentPreview);
            }

            // Overall preview
            AirportSegmentRequest firstSegment = segments.get(0);
            AirportSegmentRequest lastSegment = segments.get(segments.size() - 1);

            AirportCache firstOrigin = referenceDataService.getAirport(firstSegment.getOriginAirportId());
            AirportCache lastDestination = referenceDataService.getAirport(lastSegment.getDestinationAirportId());

            preview.put("segments", segmentPreviews);
            preview.put("totalSegments", segments.size());
            preview.put("totalDistance", totalDistance);
            preview.put("totalFlightTime", totalFlightTime);
            preview.put("routeType", determineMultiSegmentRouteType(segments));
            preview.put("overallRoute", firstOrigin.getIataCode() + " → " + lastDestination.getIataCode());
            preview.put("stopCount", segments.size() - 1);

            return preview;
        } catch (Exception e) {
            log.error("Error creating multi-segment route preview: {}", e.getMessage());
            throw new RuntimeException("Failed to create route preview", e);
        }
    }
}