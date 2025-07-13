package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferenceDataService {

    private final CacheService cacheService;
    private final RestTemplate restTemplate;
    private final ServiceTokenManager serviceTokenManager; // ServiceTokenManager enjekte edildi

    @Value("${reference-manager.base-url}")
    private String referenceManagerBaseUrl;

    private HttpEntity<?> createAuthenticatedRequest() {
        HttpHeaders headers = new HttpHeaders();
        String token = serviceTokenManager.getServiceToken(); // getServiceToken çağrısı buradan yapıldı
        if (token != null) {
            headers.set("Authorization", "Bearer " + token);
        }
        return new HttpEntity<>(headers);
    }

    public AirlineCache getAirline(Long id) {
        // First try cache
        AirlineCache airline = cacheService.getAirlineFromCache(id);
        if (airline != null) {
            return airline;
        }

        // Cache miss - fetch from Reference Manager
        try {
            String url = referenceManagerBaseUrl + "/api/v1/airlines/" + id;
            HttpEntity<?> requestEntity = createAuthenticatedRequest();

            ResponseEntity<AirlineCache> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, new ParameterizedTypeReference<AirlineCache>() {});

            if (response.getBody() != null) {
                airline = response.getBody();
                cacheService.cacheAirline(id, airline);
                log.debug("Fetched and cached airline: {} from Reference Manager", airline.getName());
                return airline;
            }
        } catch (Exception e) {
            log.error("Failed to fetch airline from Reference Manager: {}", e.getMessage());
        }

        throw new ResourceNotFoundException("Airline not found with id: " + id);
    }

    public AirportCache getAirport(Long id) {
        // First try cache
        AirportCache airport = cacheService.getAirportFromCache(id);
        if (airport != null) {
            return airport;
        }

        // Cache miss - fetch from Reference Manager
        try {
            String url = referenceManagerBaseUrl + "/api/v1/airports/" + id;
            HttpEntity<?> requestEntity = createAuthenticatedRequest();

            ResponseEntity<AirportCache> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, new ParameterizedTypeReference<AirportCache>() {});

            if (response.getBody() != null) {
                airport = response.getBody();
                cacheService.cacheAirport(id, airport);
                log.debug("Fetched and cached airport: {} from Reference Manager", airport.getName());
                return airport;
            }
        } catch (Exception e) {
            log.error("Failed to fetch airport from Reference Manager: {}", e.getMessage());
        }

        throw new ResourceNotFoundException("Airport not found with id: " + id);
    }

    public AircraftCache getAircraft(Long id) {
        // First try cache
        AircraftCache aircraft = cacheService.getAircraftFromCache(id);
        if (aircraft != null) {
            return aircraft;
        }

        // Cache miss - fetch from Reference Manager
        try {
            String url = referenceManagerBaseUrl + "/api/v1/aircrafts/" + id;
            HttpEntity<?> requestEntity = createAuthenticatedRequest();

            ResponseEntity<AircraftCache> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, new ParameterizedTypeReference<AircraftCache>() {});

            if (response.getBody() != null) {
                aircraft = response.getBody();
                cacheService.cacheAircraft(id, aircraft);
                log.debug("Fetched and cached aircraft: {} from Reference Manager", aircraft.getRegistrationNumber());
                return aircraft;
            }
        } catch (Exception e) {
            log.error("Failed to fetch aircraft from Reference Manager: {}", e.getMessage());
        }

        throw new ResourceNotFoundException("Aircraft not found with id: " + id);
    }

    // Validation methods
    public boolean isValidAirline(Long airlineId) {
        try {
            getAirline(airlineId);
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }

    public boolean isValidAirport(Long airportId) {
        try {
            getAirport(airportId);
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }

    public boolean isValidAircraft(Long aircraftId) {
        try {
            getAircraft(aircraftId);
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }

    public boolean isAircraftBelongsToAirline(Long aircraftId, Long airlineId) {
        try {
            AircraftCache aircraft = getAircraft(aircraftId);
            // Null check ekle
            return aircraft.getAirlineId() != null && aircraft.getAirlineId().equals(airlineId);
        } catch (ResourceNotFoundException e) {
            log.warn("Aircraft not found: {}", aircraftId);
            return false;
        } catch (Exception e) {
            log.error("Error checking aircraft-airline relationship: {}", e.getMessage());
            return false;
        }
    }

    // Inner class for login response
    public static class LoginResponse {
        private String accessToken;
        private String tokenType;
        private long expiresIn;

        // Getters and setters
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public long getExpiresIn() { return expiresIn; }
        public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    }
}