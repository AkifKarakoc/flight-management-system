package com.flightmanagement.flightservice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.cache.RouteCache;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlightResponse {

    // Temel uçuş bilgileri
    private Long id;
    private String flightNumber;
    private AirlineCache airline;
    private AircraftCache aircraft;

    // YENİ: Route bilgisi
    private RouteCache route;
    private String routePath;           // "IST → ANK → IZM" şeklinde route path

    // ESKİ: Airport bilgileri (backward compatibility)
    private AirportCache originAirport;
    private AirportCache destinationAirport;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate flightDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledDeparture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledArrival;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualDeparture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualArrival;

    private FlightStatus status;
    private FlightType type;

    // Operasyonel bilgiler
    private Integer passengerCount;
    private Integer cargoWeight;
    private String notes;
    private String gateNumber;
    private Integer delayMinutes;
    private String delayReason;
    private Boolean active;

    // Hesaplanan alanlar
    private Integer flightDuration;
    private Boolean isDelayed;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime updatedAt;

    // Aktarmalı uçuş alanları
    private Long parentFlightId;
    private Integer segmentNumber;
    private Boolean isConnectingFlight;
    private Integer connectionTimeMinutes;
    private List<FlightResponse> connectingFlights;  // Segment'ler
    private Integer totalSegments;                   // Toplam segment sayısı
    private String fullRoute;                        // Tam route string'i

    // Route bilgisi detayları
    private Integer routeDistance;                   // Route'un toplam mesafesi
    private Integer routeEstimatedTime;              // Route'un tahmini süresi
    private Boolean isMultiSegmentRoute;             // Route çoklu segment mi?

    // Helper methods
    public boolean isRouteBasedFlight() {
        return route != null;
    }

    public boolean isLegacyFlight() {
        return route == null && originAirport != null && destinationAirport != null;
    }

    public boolean hasConnections() {
        return Boolean.TRUE.equals(isConnectingFlight) &&
                connectingFlights != null && !connectingFlights.isEmpty();
    }

    public String getDisplayRoute() {
        if (routePath != null) {
            return routePath;
        } else if (originAirport != null && destinationAirport != null) {
            return originAirport.getIataCode() + " → " + destinationAirport.getIataCode();
        }
        return "Unknown Route";
    }
}