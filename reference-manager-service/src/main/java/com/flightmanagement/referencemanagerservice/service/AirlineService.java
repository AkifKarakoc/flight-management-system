package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.dto.request.AirlineRequest;
import com.flightmanagement.referencemanagerservice.dto.response.AirlineResponse;
import com.flightmanagement.referencemanagerservice.entity.Airline;
import com.flightmanagement.referencemanagerservice.exception.ResourceNotFoundException;
import com.flightmanagement.referencemanagerservice.exception.DuplicateResourceException;
import com.flightmanagement.referencemanagerservice.mapper.AirlineMapper;
import com.flightmanagement.referencemanagerservice.repository.AirlineRepository;
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
public class AirlineService {
    private final AirlineRepository airlineRepository;
    private final AirlineMapper airlineMapper;
    private final KafkaProducerService kafkaProducerService;

    public List<AirlineResponse> getAllAirlines() {
        log.debug("Fetching all airlines");
        return airlineRepository.findAll().stream()
                .map(airlineMapper::toResponse)
                .collect(Collectors.toList());
    }

    public AirlineResponse getAirlineById(Long id) {
        log.debug("Fetching airline with id: {}", id);
        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + id));
        return airlineMapper.toResponse(airline);
    }

    public AirlineResponse getAirlineByIataCode(String iataCode) {
        log.debug("Fetching airline with IATA code: {}", iataCode);
        Airline airline = airlineRepository.findByIataCode(iataCode)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with IATA code: " + iataCode));
        return airlineMapper.toResponse(airline);
    }

    public AirlineResponse createAirline(AirlineRequest request) {
        log.debug("Creating new airline with IATA code: {}", request.getIataCode());

        if (airlineRepository.existsByIataCode(request.getIataCode())) {
            throw new DuplicateResourceException("Airline already exists with IATA code: " + request.getIataCode());
        }

        if (airlineRepository.existsByIcaoCode(request.getIcaoCode())) {
            throw new DuplicateResourceException("Airline already exists with ICAO code: " + request.getIcaoCode());
        }

        Airline airline = airlineMapper.toEntity(request);
        airline = airlineRepository.save(airline);

        // Kafka event publish
        kafkaProducerService.sendAirlineEvent("AIRLINE_CREATED", airline);

        return airlineMapper.toResponse(airline);
    }

    public AirlineResponse updateAirline(Long id, AirlineRequest request) {
        log.debug("Updating airline with id: {}", id);

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + id));

        // Check for duplicates only if codes are being changed
        if (!airline.getIataCode().equals(request.getIataCode()) &&
                airlineRepository.existsByIataCode(request.getIataCode())) {
            throw new DuplicateResourceException("Airline already exists with IATA code: " + request.getIataCode());
        }

        if (!airline.getIcaoCode().equals(request.getIcaoCode()) &&
                airlineRepository.existsByIcaoCode(request.getIcaoCode())) {
            throw new DuplicateResourceException("Airline already exists with ICAO code: " + request.getIcaoCode());
        }

        airlineMapper.updateEntity(airline, request);
        airline = airlineRepository.save(airline);

        // Kafka event publish
        kafkaProducerService.sendAirlineEvent("AIRLINE_UPDATED", airline);

        return airlineMapper.toResponse(airline);
    }

    public void deleteAirline(Long id) {
        log.debug("Deleting airline with id: {}", id);

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + id));

        airlineRepository.delete(airline);

        // Kafka event publish
        kafkaProducerService.sendAirlineEvent("AIRLINE_DELETED", airline);
    }
}