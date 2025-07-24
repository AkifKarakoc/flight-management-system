package com.flightmanagement.referencemanagerservice.dto.request;

import com.flightmanagement.referencemanagerservice.entity.enums.RouteType;
import com.flightmanagement.referencemanagerservice.entity.enums.RouteVisibility;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class RouteRequest {

    @NotBlank(message = "Route code is required")
    @Size(max = 50, message = "Route code cannot exceed 50 characters")
    private String routeCode;

    @NotBlank(message = "Route name is required")
    @Size(max = 200, message = "Route name cannot exceed 200 characters")
    private String routeName;

    // Basit route için (tek segment - backward compatibility)
    private Long originAirportId;

    private Long destinationAirportId;

    @Positive(message = "Distance must be positive")
    private Integer distance;

    @Positive(message = "Flight time must be positive")
    private Integer estimatedFlightTime;

    private Boolean active = true;

    @NotNull(message = "Route type is required")
    private RouteType routeType;

    // Yeni ownership alanları
    private Long createdByUserId;  // Controller'da set edilecek (security context'ten)

    @NotNull(message = "Visibility is required")
    private RouteVisibility visibility = RouteVisibility.PRIVATE;

    private Long airlineId;

    // Multi-segment route için
    private Boolean isMultiSegment = false;

    @Valid
    private List<RouteSegmentRequest> segments;

    // Validation helper methods
    public boolean isSimpleRoute() {
        return !Boolean.TRUE.equals(isMultiSegment) &&
                (segments == null || segments.isEmpty()) &&
                originAirportId != null && destinationAirportId != null;
    }

    public boolean isMultiSegmentRoute() {
        return Boolean.TRUE.equals(isMultiSegment) &&
                segments != null && segments.size() > 1;
    }
}