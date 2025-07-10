package com.flightmanagement.referencemanagerservice.repository;

import com.flightmanagement.referencemanagerservice.entity.AircraftSeatConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AircraftSeatConfigurationRepository extends JpaRepository<AircraftSeatConfiguration, Long> {
    Optional<AircraftSeatConfiguration> findByAircraftId(Long aircraftId);
}