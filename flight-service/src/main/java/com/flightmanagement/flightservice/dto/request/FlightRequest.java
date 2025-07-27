package com.flightmanagement.flightservice.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.validator.ValidFlightCreation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@ValidFlightCreation
public class FlightRequest {

    @NotBlank(message = "Flight number is required")
    @Pattern(regexp = "^[A-Z]{2}\\d{1,4}$", message = "Flight number must be in format: TK123")
    private String flightNumber;

    @NotNull(message = "Airline ID is required")
    private Long airlineId;

    @NotNull(message = "Aircraft ID is required")
    private Long aircraftId;

    // YENİ SISTEM: Route bazlı yaklaşım
    @NotNull(message = "Route ID is required", groups = RouteBasedValidation.class)
    private Long routeId;

    // Airport-based creation için
    private Long originAirportId;
    private Long destinationAirportId;

    // Creation mode indicator - ZORUNLU ALAN
    @NotBlank(message = "Creation mode is required")
    @Pattern(regexp = "ROUTE|AIRPORTS|MULTI_AIRPORTS",
            message = "Creation mode must be ROUTE, AIRPORTS, or MULTI_AIRPORTS")
    private String creationMode;

    // Multi-segment airport creation için
    @Valid
    @Size(min = 2, max = 10, message = "Multi-segment flight must have 2-10 segments")
    private List<AirportSegmentRequest> airportSegments;

    private Boolean isMultiSegmentAirportFlight = false;

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

    private List<FlightSegmentRequest> segments;

    public boolean isRouteBasedFlight() {
        return "ROUTE".equals(creationMode) && routeId != null;
    }

    public boolean isConnectingFlightRequest() {
        return Boolean.TRUE.equals(isConnectingFlight) && segments != null && !segments.isEmpty();
    }

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
        if (segments == null || segments.isEmpty() || segments.size() == 1) {
            return true;
        }
        for (int i = 0; i < segments.size() - 1; i++) {
            if (!segments.get(i).getDestinationAirportId().equals(segments.get(i + 1).getOriginAirportId())) {
                return false;
            }
        }
        return true;
    }

    // Multi-segment helpers
    public Long getFirstOriginAirportId() {
        if (isMultiSegmentAirportCreation() && airportSegments != null && !airportSegments.isEmpty()) {
            return airportSegments.get(0).getOriginAirportId();
        }
        return originAirportId;
    }

    public Long getLastDestinationAirportId() {
        if (isMultiSegmentAirportCreation() && airportSegments != null && !airportSegments.isEmpty()) {
            return airportSegments.get(airportSegments.size() - 1).getDestinationAirportId();
        }
        return destinationAirportId;
    }

    public boolean isRouteBasedCreation() {
        return "ROUTE".equals(creationMode);
    }

    public boolean isAirportBasedCreation() {
        return "AIRPORTS".equals(creationMode);
    }

    public boolean isMultiSegmentAirportCreation() {
        return "MULTI_AIRPORTS".equals(creationMode);
    }

    public boolean hasValidCreationMode() {
        if (creationMode == null || creationMode.trim().isEmpty()) {
            return false;
        }

        switch (creationMode) {
            case "ROUTE":
                return routeId != null;

            case "AIRPORTS":
                return originAirportId != null &&
                        destinationAirportId != null &&
                        !originAirportId.equals(destinationAirportId);

            case "MULTI_AIRPORTS":
                return airportSegments != null &&
                        airportSegments.size() >= 2 &&
                        airportSegments.size() <= 10 &&
                        validateAirportSegmentsSequence();

            default:
                return false;
        }
    }

    private boolean validateAirportSegmentsSequence() {
        if (airportSegments == null || airportSegments.size() < 2) {
            return false;
        }

        // Segment order validation
        for (int i = 0; i < airportSegments.size(); i++) {
            AirportSegmentRequest segment = airportSegments.get(i);

            // Segment order must be sequential starting from 1
            if (segment.getSegmentOrder() == null || segment.getSegmentOrder() != (i + 1)) {
                return false;
            }

            // Origin and destination must be different
            if (segment.getOriginAirportId() == null ||
                    segment.getDestinationAirportId() == null ||
                    segment.getOriginAirportId().equals(segment.getDestinationAirportId())) {
                return false;
            }
        }

        // Continuity validation: each segment's destination = next segment's origin
        for (int i = 0; i < airportSegments.size() - 1; i++) {
            AirportSegmentRequest current = airportSegments.get(i);
            AirportSegmentRequest next = airportSegments.get(i + 1);

            if (!current.getDestinationAirportId().equals(next.getOriginAirportId())) {
                return false;
            }
        }

        return true;
    }

    public boolean hasConflictingData() {
        // Check for conflicting creation modes
        int modeCount = 0;

        if (isRouteBasedCreation() && routeId != null) modeCount++;
        if (isAirportBasedCreation() && originAirportId != null && destinationAirportId != null) modeCount++;
        if (isMultiSegmentAirportCreation() && airportSegments != null && !airportSegments.isEmpty()) modeCount++;

        return modeCount > 1; // Conflict if more than one mode has data
    }

    public List<String> getValidationErrors() {
        List<String> errors = new ArrayList<>();

        if (creationMode == null || creationMode.trim().isEmpty()) {
            errors.add("Creation mode is required");
            return errors;
        }

        switch (creationMode) {
            case "ROUTE":
                if (routeId == null) {
                    errors.add("Route ID is required for route-based creation");
                }
                if (originAirportId != null || destinationAirportId != null) {
                    errors.add("Airport IDs should not be provided for route-based creation");
                }
                if (airportSegments != null && !airportSegments.isEmpty()) {
                    errors.add("Airport segments should not be provided for route-based creation");
                }
                break;

            case "AIRPORTS":
                if (originAirportId == null) {
                    errors.add("Origin airport ID is required for airport-based creation");
                }
                if (destinationAirportId == null) {
                    errors.add("Destination airport ID is required for airport-based creation");
                }
                if (originAirportId != null && destinationAirportId != null &&
                        originAirportId.equals(destinationAirportId)) {
                    errors.add("Origin and destination airports cannot be the same");
                }
                if (routeId != null) {
                    errors.add("Route ID should not be provided for airport-based creation");
                }
                if (airportSegments != null && !airportSegments.isEmpty()) {
                    errors.add("Airport segments should not be provided for direct airport creation");
                }
                break;

            case "MULTI_AIRPORTS":
                if (airportSegments == null || airportSegments.isEmpty()) {
                    errors.add("Airport segments are required for multi-segment creation");
                } else {
                    if (airportSegments.size() < 2) {
                        errors.add("Multi-segment creation requires at least 2 segments");
                    }
                    if (airportSegments.size() > 10) {
                        errors.add("Multi-segment creation cannot have more than 10 segments");
                    }

                    // Detailed segment validation
                    List<String> segmentErrors = validateSegmentDetails();
                    errors.addAll(segmentErrors);
                }
                if (routeId != null) {
                    errors.add("Route ID should not be provided for multi-segment creation");
                }
                if (originAirportId != null || destinationAirportId != null) {
                    errors.add("Individual airport IDs should not be provided for multi-segment creation");
                }
                break;

            default:
                errors.add("Invalid creation mode: " + creationMode);
        }

        return errors;
    }

    private List<String> validateSegmentDetails() {
        List<String> errors = new ArrayList<>();

        if (airportSegments == null) {
            return errors;
        }

        // Check segment numbering
        for (int i = 0; i < airportSegments.size(); i++) {
            AirportSegmentRequest segment = airportSegments.get(i);

            if (segment.getSegmentOrder() == null) {
                errors.add("Segment " + (i + 1) + " is missing segment order");
            } else if (segment.getSegmentOrder() != (i + 1)) {
                errors.add("Segment " + (i + 1) + " has incorrect segment order: expected " + (i + 1) +
                        ", found " + segment.getSegmentOrder());
            }

            if (segment.getOriginAirportId() == null) {
                errors.add("Segment " + (i + 1) + " is missing origin airport ID");
            }

            if (segment.getDestinationAirportId() == null) {
                errors.add("Segment " + (i + 1) + " is missing destination airport ID");
            }

            if (segment.getOriginAirportId() != null && segment.getDestinationAirportId() != null &&
                    segment.getOriginAirportId().equals(segment.getDestinationAirportId())) {
                errors.add("Segment " + (i + 1) + " origin and destination airports cannot be the same");
            }

            // Connection time validation
            if (segment.getConnectionTimeMinutes() != null) {
                if (segment.getConnectionTimeMinutes() < 0) {
                    errors.add("Segment " + (i + 1) + " connection time cannot be negative");
                }
                if (segment.getConnectionTimeMinutes() > 1440) {
                    errors.add("Segment " + (i + 1) + " connection time cannot exceed 24 hours");
                }
            }
        }

        // Check continuity
        for (int i = 0; i < airportSegments.size() - 1; i++) {
            AirportSegmentRequest current = airportSegments.get(i);
            AirportSegmentRequest next = airportSegments.get(i + 1);

            if (current.getDestinationAirportId() != null && next.getOriginAirportId() != null &&
                    !current.getDestinationAirportId().equals(next.getOriginAirportId())) {
                errors.add("Route continuity broken: Segment " + (i + 1) + " destination must match Segment " +
                        (i + 2) + " origin");
            }
        }

        return errors;
    }

    public boolean hasBothRouteAndAirports() {
        return (isRouteBasedCreation() && (originAirportId != null || destinationAirportId != null)) ||
                (isAirportBasedCreation() && routeId != null) ||
                (isMultiSegmentAirportCreation() && routeId != null);
    }

    public boolean hasValidFlightData() {
        return hasValidCreationMode() && !hasConflictingData();
    }

    public String getCreationModeDescription() {
        switch (creationMode) {
            case "ROUTE":
                return "Using existing route (ID: " + routeId + ")";
            case "AIRPORTS":
                return "Direct flight between airports (ID: " + originAirportId + " → " + destinationAirportId + ")";
            case "MULTI_AIRPORTS":
                return "Multi-segment flight with " + (airportSegments != null ? airportSegments.size() : 0) + " segments";
            default:
                return "Unknown creation mode: " + creationMode;
        }
    }

    public int getSegmentCount() {
        if (isMultiSegmentAirportCreation() && airportSegments != null) {
            return airportSegments.size();
        }
        return 1; // Single segment for direct flights
    }

    public int getStopCount() {
        return getSegmentCount() - 1; // Stops = segments - 1
    }

    public boolean isComplexRoute() {
        return isMultiSegmentAirportCreation() && getSegmentCount() > 3;
    }

    // [YENİ EKLE] Validation groups for conditional validation
    public interface RouteBasedValidation {}
    public interface AirportBasedValidation {}
    public interface MultiAirportValidation {}
}