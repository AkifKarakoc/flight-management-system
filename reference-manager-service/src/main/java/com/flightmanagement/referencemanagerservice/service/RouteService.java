package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.dto.request.RouteRequest;
import com.flightmanagement.referencemanagerservice.dto.response.RouteResponse;
import com.flightmanagement.referencemanagerservice.entity.Airport;
import com.flightmanagement.referencemanagerservice.entity.Route;
import com.flightmanagement.referencemanagerservice.exception.ResourceNotFoundException;
import com.flightmanagement.referencemanagerservice.exception.BusinessException;
import com.flightmanagement.referencemanagerservice.mapper.RouteMapper;
import com.flightmanagement.referencemanagerservice.repository.AirportRepository;
import com.flightmanagement.referencemanagerservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RouteService {
    private final RouteRepository routeRepository;
    private final AirportRepository airportRepository;
    private final RouteMapper routeMapper;
    private final KafkaProducerService kafkaProducerService;

    public List<RouteResponse> getAllRoutes() {
        log.debug("Fetching all routes");
        return routeRepository.findAll().stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    public RouteResponse getRouteById(Long id) {
        log.debug("Fetching route with id: {}", id);
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        return routeMapper.toResponse(route);
    }

    public RouteResponse createRoute(RouteRequest request) {
        log.debug("Creating new route from {} to {}", request.getOriginAirportId(), request.getDestinationAirportId());

        if (request.getOriginAirportId().equals(request.getDestinationAirportId())) {
            throw new BusinessException("Origin and destination airports cannot be the same");
        }

        Airport originAirport = airportRepository.findById(request.getOriginAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Origin airport not found with id: " + request.getOriginAirportId()));

        Airport destinationAirport = airportRepository.findById(request.getDestinationAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination airport not found with id: " + request.getDestinationAirportId()));

        routeRepository.findByOriginAirportIdAndDestinationAirportId(
                        request.getOriginAirportId(), request.getDestinationAirportId())
                .ifPresent(existing -> {
                    throw new BusinessException("Route already exists between these airports");
                });

        Route route = routeMapper.toEntity(request);
        route.setOriginAirport(originAirport);
        route.setDestinationAirport(destinationAirport);
        route = routeRepository.save(route);

        kafkaProducerService.sendRouteEvent("ROUTE_CREATED", route);

        return routeMapper.toResponse(route);
    }

    public RouteResponse updateRoute(Long id, RouteRequest request) {
        log.debug("Updating route with id: {}", id);

        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        if (request.getOriginAirportId().equals(request.getDestinationAirportId())) {
            throw new BusinessException("Origin and destination airports cannot be the same");
        }

        if (!route.getOriginAirport().getId().equals(request.getOriginAirportId()) ||
                !route.getDestinationAirport().getId().equals(request.getDestinationAirportId())) {

            Airport originAirport = airportRepository.findById(request.getOriginAirportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Origin airport not found with id: " + request.getOriginAirportId()));

            Airport destinationAirport = airportRepository.findById(request.getDestinationAirportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination airport not found with id: " + request.getDestinationAirportId()));

            routeRepository.findByOriginAirportIdAndDestinationAirportId(
                            request.getOriginAirportId(), request.getDestinationAirportId())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new BusinessException("Route already exists between these airports");
                        }
                    });

            route.setOriginAirport(originAirport);
            route.setDestinationAirport(destinationAirport);
        }

        routeMapper.updateEntity(route, request);
        route = routeRepository.save(route);

        kafkaProducerService.sendRouteEvent("ROUTE_UPDATED", route);

        return routeMapper.toResponse(route);
    }

    public void deleteRoute(Long id) {
        log.debug("Deleting route with id: {}", id);

        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        routeRepository.delete(route);

        kafkaProducerService.sendRouteEvent("ROUTE_DELETED", route);
    }
}