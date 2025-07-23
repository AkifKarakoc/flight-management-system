package com.flightmanagement.flightservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class ConnectingFlightRequest {

    @NotBlank(message = "Main flight number is required")
    @Pattern(regexp = "^[A-Z]{2}\\d{1,4}$", message = "Flight number must be in format: TK123")
    private String mainFlightNumber;

    @NotNull(message = "Airline ID is required")
    private Long airlineId;

    @NotNull(message = "Aircraft ID is required")
    private Long aircraftId;

    @NotNull(message = "Flight type is required")
    private com.flightmanagement.flightservice.entity.enums.FlightType type;

    @Min(value = 0, message = "Passenger count cannot be negative")
    @Max(value = 1000, message = "Passenger count cannot exceed 1000")
    private Integer passengerCount;

    @Min(value = 0, message = "Cargo weight cannot be negative")
    private Integer cargoWeight;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    @NotEmpty(message = "At least 2 segments are required for connecting flight")
    @Size(min = 2, max = 10, message = "Connecting flight must have between 2 and 10 segments")
    @Valid
    private List<FlightSegmentRequest> segments;

    private Boolean active = true;
}