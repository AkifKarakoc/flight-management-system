package com.flightmanagement.referencemanagerservice.dto.response;

import com.flightmanagement.referencemanagerservice.entity.enums.AircraftStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AircraftResponse {
    private Long id;
    private String registrationNumber;
    private String aircraftType;
    private String manufacturer;
    private String model;
    private Integer seatCapacity;
    private Integer cargoCapacity;
    private Integer maxRange;
    private LocalDate manufactureDate;
    private LocalDate lastMaintenance;
    private AircraftStatus status;
    private AirlineResponse airline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}