package com.flightmanagement.referencemanagerservice.repository;

import com.flightmanagement.referencemanagerservice.entity.AircraftSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AircraftSeatRepository extends JpaRepository<AircraftSeat, Long> {
    List<AircraftSeat> findByAircraftConfigurationId(Long configurationId);
    Optional<AircraftSeat> findByAircraftConfigurationIdAndSeatNumber(Long configurationId, String seatNumber);
}