package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.dto.request.AircraftRequest;
import com.flightmanagement.referencemanagerservice.dto.response.AircraftResponse;
import com.flightmanagement.referencemanagerservice.entity.Aircraft;
import com.flightmanagement.referencemanagerservice.entity.Airline;
import com.flightmanagement.referencemanagerservice.exception.ResourceNotFoundException;
import com.flightmanagement.referencemanagerservice.exception.DuplicateResourceException;
import com.flightmanagement.referencemanagerservice.mapper.AircraftMapper;
import com.flightmanagement.referencemanagerservice.repository.AircraftRepository;
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
public class AircraftService {
    private final AircraftRepository aircraftRepository;
    private final AirlineRepository airlineRepository;
    private final AircraftMapper aircraftMapper;
    private final KafkaProducerService kafkaProducerService;

    public List<AircraftResponse> getAllAircrafts() {
        log.debug("Fetching all aircrafts");
        return aircraftRepository.findAll().stream()
                .map(aircraftMapper::toResponse)
                .collect(Collectors.toList());
    }

    public AircraftResponse getAircraftById(Long id) {
        log.debug("Fetching aircraft with id: {}", id);
        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found with id: " + id));
        return aircraftMapper.toResponse(aircraft);
    }

    public List<AircraftResponse> getAircraftsByAirline(Long airlineId) {
        log.debug("Fetching aircrafts for airline: {}", airlineId);
        return aircraftRepository.findByAirlineId(airlineId).stream()
                .map(aircraftMapper::toResponse)
                .collect(Collectors.toList());
    }

    public AircraftResponse createAircraft(AircraftRequest request) {
        log.debug("Creating new aircraft with registration: {}", request.getRegistrationNumber());

        if (aircraftRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new DuplicateResourceException("Aircraft already exists with registration: " + request.getRegistrationNumber());
        }

        Airline airline = airlineRepository.findById(request.getAirlineId())
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + request.getAirlineId()));

        Aircraft aircraft = aircraftMapper.toEntity(request);
        aircraft.setAirline(airline);
        aircraft = aircraftRepository.save(aircraft);

        kafkaProducerService.sendAircraftEvent("AIRCRAFT_CREATED", aircraft);

        return aircraftMapper.toResponse(aircraft);
    }

    public AircraftResponse updateAircraft(Long id, AircraftRequest request) {
        log.debug("Updating aircraft with id: {}", id);

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found with id: " + id));

        if (!aircraft.getRegistrationNumber().equals(request.getRegistrationNumber()) &&
                aircraftRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new DuplicateResourceException("Aircraft already exists with registration: " + request.getRegistrationNumber());
        }

        if (!aircraft.getAirline().getId().equals(request.getAirlineId())) {
            Airline airline = airlineRepository.findById(request.getAirlineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + request.getAirlineId()));
            aircraft.setAirline(airline);
        }

        aircraftMapper.updateEntity(aircraft, request);
        aircraft = aircraftRepository.save(aircraft);

        kafkaProducerService.sendAircraftEvent("AIRCRAFT_UPDATED", aircraft);

        return aircraftMapper.toResponse(aircraft);
    }

    public void deleteAircraft(Long id) {
        log.debug("Deleting aircraft with id: {}", id);

        Aircraft aircraft = aircraftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found with id: " + id));

        aircraftRepository.delete(aircraft);

        kafkaProducerService.sendAircraftEvent("AIRCRAFT_DELETED", aircraft);
    }
}