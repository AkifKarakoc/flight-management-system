package com.flightmanagement.flightservice.dto.cache;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RouteCache {
    private Long id;
    private String routeCode;
    private String routeName;
    private String routePath;           // "IST → ANK → IZM"
    private String routeType;           // DOMESTIC, INTERNATIONAL
    private Integer distance;           // km
    private Integer estimatedFlightTime; // dakika
    private Boolean isMultiSegment;
    private Integer segmentCount;

    // Origin/Destination info (from route)
    private Long originAirportId;
    private String originAirportCode;
    private String originAirportName;

    private Long destinationAirportId;
    private String destinationAirportCode;
    private String destinationAirportName;

    // Helper methods
    public String getSimpleRoute() {
        if (originAirportCode != null && destinationAirportCode != null) {
            return originAirportCode + " → " + destinationAirportCode;
        }
        return routePath;
    }

    public boolean isDomestic() {
        return "DOMESTIC".equals(routeType);
    }

    public boolean isInternational() {
        return "INTERNATIONAL".equals(routeType);
    }
}