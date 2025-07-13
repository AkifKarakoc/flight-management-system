package com.flightmanagement.flightservice.mapper;

import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FlightMapper {

    Flight toEntity(FlightRequest request);

    @Mapping(target = "airline", ignore = true)
    @Mapping(target = "aircraft", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(expression = "java(flight.getFlightDuration())", target = "flightDuration")
    @Mapping(expression = "java(flight.isDelayed())", target = "isDelayed")
    FlightResponse toResponse(Flight flight);

    void updateEntity(@MappingTarget Flight flight, FlightRequest request);
}