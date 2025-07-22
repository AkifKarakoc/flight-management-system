package com.flightmanagement.referencemanagerservice.config; // Kendi paket adınızı kontrol edin

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Projedeki tüm API endpoint'leri için geçerli
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000") // Sadece frontend'inize izin verin
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // OPTIONS metoduna izin vermek kritik
                        .allowedHeaders("*") // Tüm başlıklara izin ver (Authorization dahil)
                        .allowCredentials(true);
            }
        };
    }
}