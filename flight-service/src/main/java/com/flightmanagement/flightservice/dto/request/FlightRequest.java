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

    // YENİ SISTEM: Route bazlı yaklaşım
    @NotNull(message = "Route ID is required")
    private Long routeId;

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

    // Flight duration calculation helper
    public Integer getEstimatedDurationMinutes() {
        if (scheduledDeparture != null && scheduledArrival != null) {
            return (int) java.time.Duration.between(scheduledDeparture, scheduledArrival).toMinutes();
        }
        return null;
    }

    // Business logic helpers
    public boolean isCargoFlight() {
        return FlightType.CARGO.equals(type);
    }

    public boolean isPassengerFlight() {
        return FlightType.PASSENGER.equals(type);
    }

    public boolean isSpecialFlight() {
        return FlightType.POSITIONING.equals(type) ||
                FlightType.FERRY.equals(type) ||
                FlightType.TRAINING.equals(type);
    }

    // Validation helper for flight type consistency
    public boolean isFlightTypeConsistent() {
        switch (type) {
            case CARGO:
                return (passengerCount == null || passengerCount == 0) &&
                        (cargoWeight != null && cargoWeight > 0);
            case PASSENGER:
                return passengerCount != null && passengerCount > 0;
            case POSITIONING:
            case FERRY:
            case TRAINING:
                return passengerCount == null || passengerCount == 0;
            default:
                return true;
        }
    }

    // For connecting flights
    public boolean hasValidSegmentSequence() {
        if (!isConnectingFlightRequest()) {
            return true;
        }

        for (int i = 0; i < segments.size() - 1; i++) {
            FlightSegmentRequest current = segments.get(i);
            FlightSegmentRequest next = segments.get(i + 1);

            if (!current.getDestinationAirportId().equals(next.getOriginAirportId())) {
                return false;
            }

            if (!current.getScheduledArrival().isBefore(next.getScheduledDeparture())) {
                return false;
            }
        }
        return true;
    }
}