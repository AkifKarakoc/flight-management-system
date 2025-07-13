package com.flightmanagement.flightservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceTokenManager {

    private final RestTemplate restTemplate;

    @Value("${reference-manager.base-url}")
    private String referenceManagerBaseUrl;

    private String cachedToken;
    private LocalDateTime tokenExpiry;

    public String getServiceToken() {
        // Token var ve geçerli mi kontrol et
        if (cachedToken != null && tokenExpiry != null &&
                LocalDateTime.now().isBefore(tokenExpiry.minusMinutes(5))) {
            return cachedToken;
        }

        // Yeni token al
        return refreshToken();
    }

    private String refreshToken() {
        try {
            String loginUrl = referenceManagerBaseUrl + "/api/v1/auth/login";

            String loginBody = "{\"username\":\"admin\",\"password\":\"admin123\"}";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> loginRequest = new HttpEntity<>(loginBody, headers);

            ResponseEntity<LoginResponse> response = restTemplate.exchange(
                    loginUrl, HttpMethod.POST, loginRequest, LoginResponse.class);

            if (response.getBody() != null) {
                cachedToken = response.getBody().getAccessToken();
                // Token 24 saat geçerli
                tokenExpiry = LocalDateTime.now().plusSeconds(response.getBody().getExpiresIn() / 1000);
                log.info("Service token refreshed successfully");
                return cachedToken;
            }
        } catch (Exception e) {
            log.error("Failed to refresh service token: {}", e.getMessage());
        }
        return null;
    }

    public static class LoginResponse {
        private String accessToken;
        private String tokenType;
        private long expiresIn;

        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public long getExpiresIn() { return expiresIn; }
        public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    }
}