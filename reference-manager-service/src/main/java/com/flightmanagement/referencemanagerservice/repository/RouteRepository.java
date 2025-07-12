package com.flightmanagement.referencemanagerservice.repository;

import com.flightmanagement.referencemanagerservice.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByOriginAirportId(Long originAirportId);
    List<Route> findByDestinationAirportId(Long destinationAirportId);
    Optional<Route> findByOriginAirportIdAndDestinationAirportId(Long originId, Long destinationId);
    long countByOriginAirportId(Long originAirportId);
    long countByDestinationAirportId(Long destinationAirportId);
}