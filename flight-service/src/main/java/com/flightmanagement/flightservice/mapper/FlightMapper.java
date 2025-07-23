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

    Flight toEntity(FlightRequest request);

    @Mapping(target = "airline", ignore = true)
    @Mapping(target = "aircraft", ignore = true)
    @Mapping(target = "originAirport", ignore = true)
    @Mapping(target = "destinationAirport", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "totalSegments", ignore = true)
    @Mapping(target = "fullRoute", ignore = true)
    @Mapping(expression = "java(flight.getFlightDuration())", target = "flightDuration")
    @Mapping(expression = "java(flight.isDelayed())", target = "isDelayed")
    FlightResponse toResponse(Flight flight);

    void updateEntity(@MappingTarget Flight flight, FlightRequest request);

    // Aktarmalı uçuş için mapping metodları

    /**
     * ConnectingFlightRequest'ten Flight entity'sine map eder
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "originAirportId", ignore = true)
    @Mapping(target = "destinationAirportId", ignore = true)
    @Mapping(target = "flightDate", ignore = true)
    @Mapping(target = "scheduledDeparture", ignore = true)
    @Mapping(target = "scheduledArrival", ignore = true)
    @Mapping(target = "actualDeparture", ignore = true)
    @Mapping(target = "actualArrival", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "gateNumber", ignore = true)
    @Mapping(target = "delayMinutes", ignore = true)
    @Mapping(target = "delayReason", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "parentFlight", ignore = true)
    @Mapping(target = "connectingFlights", ignore = true)
    @Mapping(target = "flightConnections", ignore = true)
    @Mapping(source = "mainFlightNumber", target = "flightNumber")
    @Mapping(constant = "true", target = "isConnectingFlight")
    @Mapping(constant = "0", target = "segmentNumber")
    @Mapping(target = "parentFlightId", ignore = true)
    @Mapping(target = "connectionTimeMinutes", ignore = true)
    Flight toMainFlightEntity(ConnectingFlightRequest request);

    /**
     * FlightConnection entity'sini FlightConnectionResponse'a map eder
     */
    @Mapping(target = "segmentFlight", ignore = true)
    FlightConnectionResponse toConnectionResponse(FlightConnection connection);

    // Default metodlar - MapStruct bu metodları implement edecek
    default Flight toSegmentFlightEntity(FlightSegmentRequest segmentRequest, Flight mainFlight, int segmentNumber) {
        if (segmentRequest == null || mainFlight == null) return null;

        Flight segment = new Flight();
        segment.setFlightNumber(mainFlight.getFlightNumber() + "-" + segmentNumber);
        segment.setAirlineId(mainFlight.getAirlineId());
        segment.setAircraftId(mainFlight.getAircraftId());
        segment.setOriginAirportId(segmentRequest.getOriginAirportId());
        segment.setDestinationAirportId(segmentRequest.getDestinationAirportId());
        segment.setFlightDate(segmentRequest.getScheduledDeparture().toLocalDate());
        segment.setScheduledDeparture(segmentRequest.getScheduledDeparture());
        segment.setScheduledArrival(segmentRequest.getScheduledArrival());
        segment.setType(mainFlight.getType());
        segment.setPassengerCount(mainFlight.getPassengerCount());
        segment.setCargoWeight(mainFlight.getCargoWeight());
        segment.setGateNumber(segmentRequest.getGateNumber());
        segment.setNotes(segmentRequest.getNotes());
        segment.setActive(mainFlight.getActive());
        segment.setStatus(com.flightmanagement.flightservice.entity.enums.FlightStatus.SCHEDULED);

        // Aktarmalı uçuş bilgileri
        segment.setParentFlightId(mainFlight.getId());
        segment.setSegmentNumber(segmentNumber);
        segment.setIsConnectingFlight(false);
        segment.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());

        return segment;
    }

    default void updateMainFlightFromRequest(Flight mainFlight, ConnectingFlightRequest request) {
        if (request == null || mainFlight == null) return;

        mainFlight.setFlightNumber(request.getMainFlightNumber());
        mainFlight.setAirlineId(request.getAirlineId());
        mainFlight.setAircraftId(request.getAircraftId());
        mainFlight.setType(request.getType());
        mainFlight.setPassengerCount(request.getPassengerCount());
        mainFlight.setCargoWeight(request.getCargoWeight());
        mainFlight.setNotes(request.getNotes());
        mainFlight.setActive(request.getActive());

        // İlk ve son segment'ten origin/destination güncelle
        if (request.getSegments() != null && !request.getSegments().isEmpty()) {
            FlightSegmentRequest firstSegment = request.getSegments().get(0);
            FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

            mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
            mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
            mainFlight.setFlightDate(firstSegment.getScheduledDeparture().toLocalDate());
            mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
            mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());
        }
    }

    default void enrichMainFlightFromSegments(Flight mainFlight, ConnectingFlightRequest request) {
        if (request == null || mainFlight == null || request.getSegments() == null || request.getSegments().isEmpty()) {
            return;
        }

        FlightSegmentRequest firstSegment = request.getSegments().get(0);
        FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
        mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
        mainFlight.setFlightDate(firstSegment.getScheduledDeparture().toLocalDate());
        mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
        mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());
    }
}