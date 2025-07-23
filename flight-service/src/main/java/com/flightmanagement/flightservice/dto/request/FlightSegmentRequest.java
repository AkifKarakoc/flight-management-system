package com.flightmanagement.flightservice.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FlightSegmentRequest {

    @NotNull(message = "Segment number is required")
    @Min(value = 1, message = "Segment number must be at least 1")
    private Integer segmentNumber;

    @NotNull(message = "Origin airport ID is required")
    private Long originAirportId;

    @NotNull(message = "Destination airport ID is required")
    private Long destinationAirportId;

    @NotNull(message = "Scheduled departure is required")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledDeparture;

    @NotNull(message = "Scheduled arrival is required")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledArrival;

    @Min(value = 0, message = "Connection time cannot be negative")
    @Max(value = 1440, message = "Connection time cannot exceed 24 hours (1440 minutes)")
    private Integer connectionTimeMinutes;

    @Size(max = 10, message = "Gate number cannot exceed 10 characters")
    private String gateNumber;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}