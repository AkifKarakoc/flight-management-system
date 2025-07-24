package com.flightmanagement.referencemanagerservice.mapper;

import com.flightmanagement.referencemanagerservice.dto.request.RouteRequest;
import com.flightmanagement.referencemanagerservice.dto.request.RouteSegmentRequest;
import com.flightmanagement.referencemanagerservice.dto.response.RouteResponse;
import com.flightmanagement.referencemanagerservice.dto.response.RouteSegmentResponse;
import com.flightmanagement.referencemanagerservice.entity.Route;
import com.flightmanagement.referencemanagerservice.entity.RouteSegment;
import org.mapstruct.*;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {AirportMapper.class})
public interface RouteMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(target = "segments", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Route toEntity(RouteRequest request);

    @Mapping(target = "segments", source = "segments")
    @Mapping(target = "totalDistance", expression = "java(calculateTotalDistance(route))")
    @Mapping(target = "totalEstimatedTime", expression = "java(calculateTotalEstimatedTime(route))")
    @Mapping(target = "routePath", expression = "java(buildRoutePath(route))")
    @Mapping(target = "segmentCount", expression = "java(getSegmentCount(route))")
    @Mapping(target = "createdByUserName", ignore = true) // Service'te set edilecek
    @Mapping(target = "airlineName", ignore = true)      // Service'te set edilecek
    RouteResponse toResponse(Route route);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(target = "segments", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget Route route, RouteRequest request);

    // RouteSegment mapping
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "route", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    RouteSegment toSegmentEntity(RouteSegmentRequest request);

    @Mapping(target = "segmentPath", expression = "java(buildSegmentPath(segment))")
    RouteSegmentResponse toSegmentResponse(RouteSegment segment);

    List<RouteSegmentResponse> toSegmentResponseList(List<RouteSegment> segments);

    // Helper methods for calculations
    default Integer calculateTotalDistance(Route route) {
        if (route == null) return null;

        if (Boolean.TRUE.equals(route.getIsMultiSegment()) && route.getSegments() != null) {
            return route.getSegments().stream()
                    .filter(segment -> segment.getDistance() != null)
                    .mapToInt(RouteSegment::getDistance)
                    .sum();
        }

        return route.getDistance();
    }

    default Integer calculateTotalEstimatedTime(Route route) {
        if (route == null) return null;

        if (Boolean.TRUE.equals(route.getIsMultiSegment()) && route.getSegments() != null) {
            return route.getSegments().stream()
                    .filter(segment -> segment.getEstimatedFlightTime() != null)
                    .mapToInt(RouteSegment::getEstimatedFlightTime)
                    .sum();
        }

        return route.getEstimatedFlightTime();
    }

    default String buildRoutePath(Route route) {
        if (route == null) return null;

        if (Boolean.TRUE.equals(route.getIsMultiSegment()) && route.getSegments() != null && !route.getSegments().isEmpty()) {
            // Multi-segment route path
            StringBuilder path = new StringBuilder();
            List<RouteSegment> sortedSegments = route.getSegments().stream()
                    .sorted((s1, s2) -> Integer.compare(s1.getSegmentOrder(), s2.getSegmentOrder()))
                    .collect(Collectors.toList());

            // İlk segment'in origin'ini ekle
            if (!sortedSegments.isEmpty() && sortedSegments.get(0).getOriginAirport() != null) {
                path.append(sortedSegments.get(0).getOriginAirport().getIataCode());
            }

            // Tüm segment'lerin destination'larını ekle
            for (RouteSegment segment : sortedSegments) {
                if (segment.getDestinationAirport() != null) {
                    path.append(" → ").append(segment.getDestinationAirport().getIataCode());
                }
            }

            return path.toString();
        } else {
            // Simple route path
            StringBuilder path = new StringBuilder();
            if (route.getOriginAirport() != null) {
                path.append(route.getOriginAirport().getIataCode());
            }
            if (route.getDestinationAirport() != null) {
                if (path.length() > 0) {
                    path.append(" → ");
                }
                path.append(route.getDestinationAirport().getIataCode());
            }
            return path.toString();
        }
    }

    default String buildSegmentPath(RouteSegment segment) {
        if (segment == null) return null;

        StringBuilder path = new StringBuilder();
        if (segment.getOriginAirport() != null) {
            path.append(segment.getOriginAirport().getIataCode());
        }
        if (segment.getDestinationAirport() != null) {
            if (path.length() > 0) {
                path.append(" → ");
            }
            path.append(segment.getDestinationAirport().getIataCode());
        }
        return path.toString();
    }

    default Integer getSegmentCount(Route route) {
        if (route == null) return 0;

        if (Boolean.TRUE.equals(route.getIsMultiSegment()) && route.getSegments() != null) {
            return route.getSegments().size();
        }

        return 1; // Simple route = 1 segment
    }
}