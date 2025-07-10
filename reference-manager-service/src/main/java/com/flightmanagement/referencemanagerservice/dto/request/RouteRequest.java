package com.flightmanagement.referencemanagerservice.dto.request;

import com.flightmanagement.referencemanagerservice.entity.enums.RouteType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class RouteRequest {
    @NotNull(message = "Origin airport ID is required")
    private Long originAirportId;

    @NotNull(message = "Destination airport ID is required")
    private Long destinationAirportId;

    @Positive(message = "Distance must be positive")
    private Integer distance;

    @Positive(message = "Flight time must be positive")
    private Integer estimatedFlightTime;

    private Boolean active = true;

    @NotNull(message = "Route type is required")
    private RouteType routeType;
}