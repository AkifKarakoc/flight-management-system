package com.flightmanagement.flightservice.validator;

import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.exception.BusinessException;
import com.flightmanagement.flightservice.service.ReferenceDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class FlightValidator {

    private final ReferenceDataService referenceDataService;

    public void validateFlightRequest(FlightRequest request) {
        validateBasicRules(request);
        validateReferenceData(request);
        validateBusinessRules(request);
    }

    public void validateFlightUpdate(Flight existingFlight, FlightRequest request) {
        validateBasicRules(request);
        validateReferenceData(request);
        validateBusinessRules(request);
        validateUpdateRules(existingFlight, request);
    }

    private void validateBasicRules(FlightRequest request) {
        // Origin ve destination aynı olamaz
        if (request.getOriginAirportId().equals(request.getDestinationAirportId())) {
            throw new BusinessException("Origin and destination airports cannot be the same");
        }

        // Scheduled arrival, scheduled departure'dan sonra olmalı
        if (request.getScheduledArrival().isBefore(request.getScheduledDeparture()) ||
                request.getScheduledArrival().isEqual(request.getScheduledDeparture())) {
            throw new BusinessException("Scheduled arrival must be after scheduled departure");
        }

        // Actual times validation
        if (request.getActualDeparture() != null && request.getActualArrival() != null) {
            if (request.getActualArrival().isBefore(request.getActualDeparture()) ||
                    request.getActualArrival().isEqual(request.getActualDeparture())) {
                throw new BusinessException("Actual arrival must be after actual departure");
            }
        }

        // Flight date validation with scheduled times
        if (!request.getScheduledDeparture().toLocalDate().equals(request.getFlightDate())) {
            throw new BusinessException("Scheduled departure date must match flight date");
        }
    }

    private void validateReferenceData(FlightRequest request) {
        // Airline validation
        if (!referenceDataService.isValidAirline(request.getAirlineId())) {
            throw new BusinessException("Invalid airline ID: " + request.getAirlineId());
        }

        // Airport validation
        if (!referenceDataService.isValidAirport(request.getOriginAirportId())) {
            throw new BusinessException("Invalid origin airport ID: " + request.getOriginAirportId());
        }

        if (!referenceDataService.isValidAirport(request.getDestinationAirportId())) {
            throw new BusinessException("Invalid destination airport ID: " + request.getDestinationAirportId());
        }

        // Aircraft validation
        if (!referenceDataService.isValidAircraft(request.getAircraftId())) {
            throw new BusinessException("Invalid aircraft ID: " + request.getAircraftId());
        }

        // Aircraft-Airline relationship validation
        if (!referenceDataService.isAircraftBelongsToAirline(request.getAircraftId(), request.getAirlineId())) {
            throw new BusinessException("Aircraft does not belong to the specified airline");
        }
    }

    private void validateBusinessRules(FlightRequest request) {
        // Minimum flight duration check (30 minutes)
        long durationMinutes = java.time.Duration.between(
                request.getScheduledDeparture(), request.getScheduledArrival()).toMinutes();
        if (durationMinutes < 30) {
            throw new BusinessException("Minimum flight duration is 30 minutes");
        }

        // Maximum flight duration check (18 hours)
        if (durationMinutes > 1080) {
            throw new BusinessException("Maximum flight duration is 18 hours");
        }

        // Passenger count validation for passenger flights
        if (request.getType().name().equals("PASSENGER")) {
            if (request.getPassengerCount() == null || request.getPassengerCount() < 0) {
                throw new BusinessException("Passenger count is required for passenger flights");
            }
        }

        // Cargo weight validation for cargo flights
        if (request.getType().name().equals("CARGO")) {
            if (request.getCargoWeight() == null || request.getCargoWeight() < 0) {
                throw new BusinessException("Cargo weight is required for cargo flights");
            }
        }

        // Past departure time validation (with 1 hour buffer)
        if (request.getScheduledDeparture().isBefore(LocalDateTime.now().minusHours(1))) {
            throw new BusinessException("Cannot schedule flights more than 1 hour in the past");
        }
    }

    private void validateUpdateRules(Flight existingFlight, FlightRequest request) {
        // Completed flights cannot be modified significantly
        if (existingFlight.getStatus().name().equals("ARRIVED")) {
            if (!request.getFlightNumber().equals(existingFlight.getFlightNumber()) ||
                    !request.getAirlineId().equals(existingFlight.getAirlineId()) ||
                    !request.getOriginAirportId().equals(existingFlight.getOriginAirportId()) ||
                    !request.getDestinationAirportId().equals(existingFlight.getDestinationAirportId()) ||
                    !request.getFlightDate().equals(existingFlight.getFlightDate())) {
                throw new BusinessException("Cannot modify core flight details for completed flights");
            }
        }

        // Cancelled flights have limited update options
        if (existingFlight.getStatus().name().equals("CANCELLED")) {
            if (!request.getStatus().name().equals("CANCELLED") &&
                    !request.getStatus().name().equals("SCHEDULED")) {
                throw new BusinessException("Cancelled flights can only be rescheduled or remain cancelled");
            }
        }

        // Departed flights cannot change departure time
        if (existingFlight.getStatus().name().equals("DEPARTED") ||
                existingFlight.getStatus().name().equals("ARRIVED")) {
            if (existingFlight.getActualDeparture() != null &&
                    !existingFlight.getActualDeparture().equals(request.getActualDeparture())) {
                throw new BusinessException("Cannot modify actual departure time for departed flights");
            }
        }
    }
}