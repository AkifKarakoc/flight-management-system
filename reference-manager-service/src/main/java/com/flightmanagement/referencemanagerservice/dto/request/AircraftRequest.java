package com.flightmanagement.referencemanagerservice.dto.request;

import com.flightmanagement.referencemanagerservice.entity.enums.AircraftStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AircraftRequest {
    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Aircraft type is required")
    private String aircraftType;

    private String manufacturer;
    private String model;

    @Positive(message = "Seat capacity must be positive")
    private Integer seatCapacity;

    @Positive(message = "Cargo capacity must be positive")
    private Integer cargoCapacity;

    @Positive(message = "Max range must be positive")
    private Integer maxRange;

    private LocalDate manufactureDate;
    private LocalDate lastMaintenance;

    private AircraftStatus status = AircraftStatus.ACTIVE;

    @NotNull(message = "Airline ID is required")
    private Long airlineId;
}