package com.flightmanagement.flightservice.validator;

import com.flightmanagement.flightservice.dto.cache.RouteCache;
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
        validateRouteOrAirports(request);
        validateReferenceData(request);
        validateBusinessRules(request);
    }

    public void validateFlightUpdate(Flight existingFlight, FlightRequest request) {
        validateBasicRules(request);
        validateRouteOrAirports(request);
        validateReferenceData(request);
        validateBusinessRules(request);
        validateUpdateRules(existingFlight, request);
    }

    private void validateBasicRules(FlightRequest request) {
        // Flight time consistency kontrolü
        if (!request.isFlightTimeValid()) {
            throw new BusinessException("Scheduled arrival must be after scheduled departure");
        }

        // Actual times consistency kontrolü
        if (!request.areActualTimesValid()) {
            throw new BusinessException("Actual arrival must be after actual departure");
        }

        // Flight date, scheduled departure ile uyumlu olmalı
        if (request.getFlightDate() != null && request.getScheduledDeparture() != null) {
            if (!request.getFlightDate().equals(request.getScheduledDeparture().toLocalDate())) {
                throw new BusinessException("Flight date must match scheduled departure date");
            }
        }
    }

    private void validateRouteOrAirports(FlightRequest request) {
        if (request.isRouteBasedFlight()) {
            // Yeni yaklaşım: Route bazlı validation
            validateRouteBased(request);
        } else if (request.isLegacyFlight()) {
            // Eski yaklaşım: Airport bazlı validation (backward compatibility)
            validateLegacyAirportBased(request);
        } else {
            throw new BusinessException("Either routeId or both originAirportId and destinationAirportId must be provided");
        }
    }

    private void validateRouteBased(FlightRequest request) {
        log.debug("Validating route-based flight with route ID: {}", request.getRouteId());

        if (request.getRouteId() == null) {
            throw new BusinessException("Route ID is required for route-based flights");
        }

        // Route'un varlığını kontrol et
        try {
            RouteCache route = referenceDataService.getRoute(request.getRouteId());
            if (route == null) {
                throw new BusinessException("Route not found with ID: " + request.getRouteId());
            }

            // Route aktif mi?
            // Bu kontrol ReferenceDataService'te yapılabilir, ama burada da ekstra güvenlik
            log.debug("Route validation passed for route: {}", route.getRouteCode());

        } catch (Exception e) {
            throw new BusinessException("Invalid route ID: " + request.getRouteId());
        }
    }

    private void validateLegacyAirportBased(FlightRequest request) {
        log.debug("Validating legacy airport-based flight: {} -> {}",
                request.getOriginAirportId(), request.getDestinationAirportId());

        // Origin ve destination aynı olamaz
        if (request.getOriginAirportId().equals(request.getDestinationAirportId())) {
            throw new BusinessException("Origin and destination airports cannot be the same");
        }
    }

    private void validateReferenceData(FlightRequest request) {
        // Airline validation
        try {
            referenceDataService.getAirline(request.getAirlineId());
        } catch (Exception e) {
            throw new BusinessException("Invalid airline ID: " + request.getAirlineId());
        }

        // Aircraft validation
        try {
            referenceDataService.getAircraft(request.getAircraftId());
        } catch (Exception e) {
            throw new BusinessException("Invalid aircraft ID: " + request.getAircraftId());
        }

        // Legacy airport validation (eğer route bazlı değilse)
        if (request.isLegacyFlight()) {
            try {
                referenceDataService.getAirport(request.getOriginAirportId());
                referenceDataService.getAirport(request.getDestinationAirportId());
            } catch (Exception e) {
                throw new BusinessException("Invalid airport ID in legacy flight request");
            }
        }
    }

    private void validateBusinessRules(FlightRequest request) {
        // Flight number format kontrolü (regex'i DTO'da var ama ekstra kontrol)
        if (request.getFlightNumber() != null &&
                !request.getFlightNumber().matches("^[A-Z]{2}\\d{1,4}$")) {
            throw new BusinessException("Flight number must be in format: TK123");
        }

        // Passenger count vs aircraft capacity kontrolü
        try {
            var aircraft = referenceDataService.getAircraft(request.getAircraftId());
            if (request.getPassengerCount() != null && aircraft.getPassengerCapacity() != null) {
                if (request.getPassengerCount() > aircraft.getPassengerCapacity()) {
                    throw new BusinessException(
                            String.format("Passenger count (%d) exceeds aircraft capacity (%d)",
                                    request.getPassengerCount(), aircraft.getPassengerCapacity())
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Could not validate passenger capacity: {}", e.getMessage());
            // Aircraft bilgisi alınamazsa capacity kontrolü yapma
        }

        // Departure time gelecekte olmalı (yeni uçuşlar için)
        if (request.getScheduledDeparture() != null &&
                request.getScheduledDeparture().isBefore(LocalDateTime.now().minusHours(1))) {
            // 1 saat tolerans veriyoruz
            throw new BusinessException("Scheduled departure cannot be more than 1 hour in the past");
        }

        // Connecting flight validation
        if (request.isConnectingFlightRequest()) {
            validateConnectingFlightSegments(request);
        }
    }

    private void validateConnectingFlightSegments(FlightRequest request) {
        if (request.getSegments() == null || request.getSegments().isEmpty()) {
            throw new BusinessException("Connecting flight must have segments");
        }

        if (request.getSegments().size() < 2) {
            throw new BusinessException("Connecting flight must have at least 2 segments");
        }

        // Segment'lerin bağlantısını kontrol et
        for (int i = 0; i < request.getSegments().size() - 1; i++) {
            var currentSegment = request.getSegments().get(i);
            var nextSegment = request.getSegments().get(i + 1);

            if (!currentSegment.getDestinationAirportId().equals(nextSegment.getOriginAirportId())) {
                throw new BusinessException(
                        String.format("Segment %d destination must match segment %d origin", i + 1, i + 2)
                );
            }

            // Connection time kontrolü
            if (currentSegment.getScheduledArrival().isAfter(nextSegment.getScheduledDeparture())) {
                throw new BusinessException(
                        String.format("Segment %d arrival time must be before segment %d departure time", i + 1, i + 2)
                );
            }
        }
    }

    private void validateUpdateRules(Flight existingFlight, FlightRequest request) {
        // Eğer uçuş DEPARTED veya ARRIVED durumunda ise, bazı alanlar değiştirilemez
        if (existingFlight.isDeparted()) {
            if (!existingFlight.getFlightNumber().equals(request.getFlightNumber())) {
                throw new BusinessException("Cannot change flight number after departure");
            }

            if (!existingFlight.getRouteId().equals(request.getRouteId())) {
                throw new BusinessException("Cannot change route after departure");
            }

            if (!existingFlight.getScheduledDeparture().equals(request.getScheduledDeparture())) {
                throw new BusinessException("Cannot change scheduled departure after departure");
            }
        }

        // Completed flights için daha kısıtlayıcı kurallar
        if (existingFlight.isCompleted()) {
            if (!existingFlight.getScheduledArrival().equals(request.getScheduledArrival())) {
                throw new BusinessException("Cannot change scheduled arrival for completed flights");
            }
        }
    }
}