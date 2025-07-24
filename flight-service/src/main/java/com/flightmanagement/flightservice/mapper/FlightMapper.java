package com.flightmanagement.flightservice.mapper;

import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightSegmentRequest;
import com.flightmanagement.flightservice.dto.response.FlightConnectionResponse;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.FlightConnection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FlightMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "parentFlight", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "flightConnections", ignore = true)
    Flight toEntity(FlightRequest request);

    @Mapping(target = "airline", ignore = true)
    @Mapping(target = "aircraft", ignore = true)
    @Mapping(target = "route", ignore = true)
    @Mapping(target = "routePath", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "totalSegments", ignore = true)
    @Mapping(target = "fullRoute", ignore = true)
    @Mapping(target = "routeDistance", ignore = true)
    @Mapping(target = "routeEstimatedTime", ignore = true)
    @Mapping(target = "isMultiSegmentRoute", ignore = true)
    @Mapping(expression = "java(flight.getFlightDuration())", target = "flightDuration")
    @Mapping(expression = "java(flight.isDelayed())", target = "isDelayed")
    FlightResponse toResponse(Flight flight);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "parentFlight", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "flightConnections", ignore = true)
    void updateEntity(@MappingTarget Flight flight, FlightRequest request);

    // Aktarmalı uçuş için mapping metodları

    /**
     * ConnectingFlightRequest'ten Flight entity'sine map eder
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "routeId", ignore = true)  // Route ID farklı şekilde set edilecek
    @Mapping(target = "originAirportId", ignore = true)
    @Mapping(target = "destinationAirportId", ignore = true)
    @Mapping(target = "flightDate", ignore = true)
    @Mapping(target = "scheduledDeparture", ignore = true)
    @Mapping(target = "scheduledArrival", ignore = true)
    @Mapping(target = "actualDeparture", ignore = true)
    @Mapping(target = "actualArrival", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "delayMinutes", ignore = true)
    @Mapping(target = "delayReason", ignore = true)
    @Mapping(target = "gateNumber", ignore = true)
    @Mapping(target = "notes", ignore = true)
    @Mapping(target = "parentFlightId", ignore = true)
    @Mapping(target = "segmentNumber", ignore = true)
    @Mapping(target = "isConnectingFlight", ignore = true)
    @Mapping(target = "connectionTimeMinutes", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "parentFlight", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "flightConnections", ignore = true)
    Flight connectingRequestToEntity(ConnectingFlightRequest request);

    /**
     * FlightSegmentRequest'ten Flight entity'sine map eder
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "flightNumber", ignore = true)
    @Mapping(target = "airlineId", ignore = true)
    @Mapping(target = "aircraftId", ignore = true)
    @Mapping(target = "routeId", ignore = true)  // Route ID farklı şekilde set edilecek
    @Mapping(target = "flightDate", ignore = true)
    @Mapping(target = "actualDeparture", ignore = true)
    @Mapping(target = "actualArrival", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "passengerCount", ignore = true)
    @Mapping(target = "cargoWeight", ignore = true)
    @Mapping(target = "delayMinutes", ignore = true)
    @Mapping(target = "delayReason", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "parentFlightId", ignore = true)
    @Mapping(target = "segmentNumber", ignore = true)
    @Mapping(target = "isConnectingFlight", ignore = true)
    @Mapping(target = "connectionTimeMinutes", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "parentFlight", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "flightConnections", ignore = true)
    Flight segmentRequestToEntity(FlightSegmentRequest request);

    /**
     * FlightConnection entity'sini FlightConnectionResponse'a map eder
     */
    @Mapping(target = "mainFlightNumber", source = "mainFlight.flightNumber")
    @Mapping(target = "segmentFlightNumber", source = "segmentFlight.flightNumber")
    @Mapping(target = "originAirportCode", ignore = true)  // Service'te set edilecek
    @Mapping(target = "destinationAirportCode", ignore = true)  // Service'te set edilecek
    FlightConnectionResponse toConnectionResponse(FlightConnection connection);
}