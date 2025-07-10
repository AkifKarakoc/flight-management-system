package com.flightmanagement.referencemanagerservice.mapper;

import com.flightmanagement.referencemanagerservice.dto.request.RouteRequest;
import com.flightmanagement.referencemanagerservice.dto.response.RouteResponse;
import com.flightmanagement.referencemanagerservice.entity.Route;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {AirportMapper.class})
public interface RouteMapper {
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    Route toEntity(RouteRequest request);

    RouteResponse toResponse(Route route);

    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    void updateEntity(@MappingTarget Route route, RouteRequest request);
}