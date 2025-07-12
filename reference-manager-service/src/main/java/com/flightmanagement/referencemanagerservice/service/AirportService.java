package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.dto.request.AirportRequest;
import com.flightmanagement.referencemanagerservice.dto.response.AirportResponse;
import com.flightmanagement.referencemanagerservice.dto.response.DeletionCheckResult;
import com.flightmanagement.referencemanagerservice.entity.Airport;
import com.flightmanagement.referencemanagerservice.entity.Coordinates;
import com.flightmanagement.referencemanagerservice.entity.CrewMember;
import com.flightmanagement.referencemanagerservice.entity.Gate;
import com.flightmanagement.referencemanagerservice.entity.Route;
import com.flightmanagement.referencemanagerservice.exception.ResourceNotFoundException;
import com.flightmanagement.referencemanagerservice.exception.DuplicateResourceException;
import com.flightmanagement.referencemanagerservice.mapper.AirportMapper;
import com.flightmanagement.referencemanagerservice.repository.AirportRepository;
import com.flightmanagement.referencemanagerservice.repository.CrewMemberRepository;
import com.flightmanagement.referencemanagerservice.repository.GateRepository;
import com.flightmanagement.referencemanagerservice.repository.RouteRepository;
import com.flightmanagement.referencemanagerservice.validator.AirportDeletionValidator;
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
public class AirportService {
    private final AirportRepository airportRepository;
    private final RouteRepository routeRepository;
    private final GateRepository gateRepository;
    private final CrewMemberRepository crewMemberRepository;
    private final AirportMapper airportMapper;
    private final KafkaProducerService kafkaProducerService;
    private final AirportDeletionValidator deletionValidator;
    private final RouteService routeService;

    public List<AirportResponse> getAllAirports() {
        log.debug("Fetching all airports");
        return airportRepository.findAll().stream()
                .map(airportMapper::toResponse)
                .collect(Collectors.toList());
    }

    public AirportResponse getAirportById(Long id) {
        log.debug("Fetching airport with id: {}", id);
        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with id: " + id));
        return airportMapper.toResponse(airport);
    }

    public AirportResponse getAirportByIataCode(String iataCode) {
        log.debug("Fetching airport with IATA code: {}", iataCode);
        Airport airport = airportRepository.findByIataCode(iataCode)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with IATA code: " + iataCode));
        return airportMapper.toResponse(airport);
    }

    public AirportResponse createAirport(AirportRequest request) {
        log.debug("Creating new airport with IATA code: {}", request.getIataCode());

        if (airportRepository.existsByIataCode(request.getIataCode())) {
            throw new DuplicateResourceException("Airport already exists with IATA code: " + request.getIataCode());
        }

        if (airportRepository.existsByIcaoCode(request.getIcaoCode())) {
            throw new DuplicateResourceException("Airport already exists with ICAO code: " + request.getIcaoCode());
        }

        Airport airport = airportMapper.toEntity(request);

        // Set coordinates
        if (request.getLatitude() != null && request.getLongitude() != null) {
            airport.setCoordinates(new Coordinates(request.getLatitude(), request.getLongitude()));
        }

        airport = airportRepository.save(airport);

        // Kafka event publish
        kafkaProducerService.sendAirportEvent("AIRPORT_CREATED", airport);

        return airportMapper.toResponse(airport);
    }

    public AirportResponse updateAirport(Long id, AirportRequest request) {
        log.debug("Updating airport with id: {}", id);

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with id: " + id));

        // Check for duplicates only if codes are being changed
        if (!airport.getIataCode().equals(request.getIataCode()) &&
                airportRepository.existsByIataCode(request.getIataCode())) {
            throw new DuplicateResourceException("Airport already exists with IATA code: " + request.getIataCode());
        }

        if (!airport.getIcaoCode().equals(request.getIcaoCode()) &&
                airportRepository.existsByIcaoCode(request.getIcaoCode())) {
            throw new DuplicateResourceException("Airport already exists with ICAO code: " + request.getIcaoCode());
        }

        airportMapper.updateEntity(airport, request);

        // Update coordinates
        if (request.getLatitude() != null && request.getLongitude() != null) {
            airport.setCoordinates(new Coordinates(request.getLatitude(), request.getLongitude()));
        }

        airport = airportRepository.save(airport);

        // Kafka event publish
        kafkaProducerService.sendAirportEvent("AIRPORT_UPDATED", airport);

        return airportMapper.toResponse(airport);
    }

    public DeletionCheckResult checkAirportDeletion(Long id) {
        log.debug("Checking deletion dependencies for airport with id: {}", id);

        // Airport var mı kontrol et
        airportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with id: " + id));

        return deletionValidator.checkDependencies(id);
    }

    public void deleteAirport(Long id) {
        log.debug("Deleting airport with id: {}", id);

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with id: " + id));

        // Dependency validation
        deletionValidator.validateDeletion(id);

        airportRepository.delete(airport);

        // Kafka event publish
        kafkaProducerService.sendAirportEvent("AIRPORT_DELETED", airport);
    }

    @Transactional
    public void forceDeleteAirport(Long id) {
        log.debug("Force deleting airport with id: {}", id);

        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found with id: " + id));

        // İlişkili kayıtları önce sil
        List<Route> originRoutes = routeRepository.findByOriginAirportId(id);
        List<Route> destRoutes = routeRepository.findByDestinationAirportId(id);

        for (Route route : originRoutes) {
            routeService.deleteRoute(route.getId());
        }
        for (Route route : destRoutes) {
            routeService.deleteRoute(route.getId());
        }

        List<Gate> gates = gateRepository.findByAirportId(id);
        for (Gate gate : gates) {
            gateRepository.delete(gate);
        }

        // Base airport olarak kullanan crew member'ları güncelle (null yap)
        List<CrewMember> basedCrews = crewMemberRepository.findByBaseAirportId(id);
        for (CrewMember crew : basedCrews) {
            crew.setBaseAirport(null);
            crewMemberRepository.save(crew);
        }

        airportRepository.delete(airport);

        // Kafka event publish
        kafkaProducerService.sendAirportEvent("AIRPORT_FORCE_DELETED", airport);
    }
}