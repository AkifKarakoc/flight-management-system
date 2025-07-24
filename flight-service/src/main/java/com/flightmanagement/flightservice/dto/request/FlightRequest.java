package com.flightmanagement.flightservice.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FlightRequest {

    @NotBlank(message = "Flight number is required")
    @Pattern(regexp = "^[A-Z]{2}\\d{1,4}$", message = "Flight number must be in format: TK123")
    private String flightNumber;

    @NotNull(message = "Airline ID is required")
    private Long airlineId;

    @NotNull(message = "Aircraft ID is required")
    private Long aircraftId;

    // YENİ: Route bazlı yaklaşım
    @NotNull(message = "Route ID is required")
    private Long routeId;

    // ESKİ ALANLAR: Backward compatibility için (DEPRECATED)
    @Deprecated
    private Long originAirportId;       // Route'dan otomatik olarak alınacak

    @Deprecated
    private Long destinationAirportId;  // Route'dan otomatik olarak alınacak

    @NotNull(message = "Flight date is required")
    @FutureOrPresent(message = "Flight date cannot be in the past")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate flightDate;

    @NotNull(message = "Scheduled departure is required")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledDeparture;

    @NotNull(message = "Scheduled arrival is required")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledArrival;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualDeparture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualArrival;

    private FlightStatus status = FlightStatus.SCHEDULED;

    @NotNull(message = "Flight type is required")
    private FlightType type;

    @Min(value = 0, message = "Passenger count cannot be negative")
    @Max(value = 1000, message = "Passenger count cannot exceed 1000")
    private Integer passengerCount;

    @Min(value = 0, message = "Cargo weight cannot be negative")
    private Integer cargoWeight;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    @Size(max = 10, message = "Gate number cannot exceed 10 characters")
    private String gateNumber;

    @Min(value = 0, message = "Delay minutes cannot be negative")
    private Integer delayMinutes;

    @Size(max = 200, message = "Delay reason cannot exceed 200 characters")
    private String delayReason;

    private Boolean active = true;

    // Aktarmalı uçuş alanları
    private Long parentFlightId;

    @Min(value = 1, message = "Segment number must be at least 1")
    private Integer segmentNumber = 1;

    private Boolean isConnectingFlight = false;

    @Min(value = 0, message = "Connection time cannot be negative")
    @Max(value = 1440, message = "Connection time cannot exceed 24 hours (1440 minutes)")
    private Integer connectionTimeMinutes;

    // Aktarmalı uçuş segment'leri için liste
    private List<FlightSegmentRequest> segments;

    // Helper methods for validation
    public boolean isRouteBasedFlight() {
        return routeId != null;
    }

    public boolean isLegacyFlight() {
        return routeId == null && originAirportId != null && destinationAirportId != null;
    }

    public boolean isConnectingFlightRequest() {
        return Boolean.TRUE.equals(isConnectingFlight) && segments != null && !segments.isEmpty();
    }

    // Validation helper - flight time consistency
    public boolean isFlightTimeValid() {
        if (scheduledDeparture != null && scheduledArrival != null) {
            return scheduledArrival.isAfter(scheduledDeparture);
        }
        return true;
    }

    // Validation helper - actual vs scheduled times
    public boolean areActualTimesValid() {
        if (actualDeparture != null && actualArrival != null) {
            return actualArrival.isAfter(actualDeparture);
        }
        return true;
    }
}