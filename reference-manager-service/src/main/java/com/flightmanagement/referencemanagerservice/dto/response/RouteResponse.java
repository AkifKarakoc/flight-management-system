package com.flightmanagement.referencemanagerservice.dto.response;

import com.flightmanagement.referencemanagerservice.entity.enums.RouteType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RouteResponse {
    private Long id;
    private AirportResponse originAirport;
    private AirportResponse destinationAirport;
    private Integer distance;
    private Integer estimatedFlightTime;
    private Boolean active;
    private RouteType routeType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}