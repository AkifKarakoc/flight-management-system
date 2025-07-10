package com.flightmanagement.referencemanagerservice.repository;

import com.flightmanagement.referencemanagerservice.entity.Gate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GateRepository extends JpaRepository<Gate, Long> {
    List<Gate> findByAirportId(Long airportId);
    Optional<Gate> findByAirportIdAndGateNumber(Long airportId, String gateNumber);
}