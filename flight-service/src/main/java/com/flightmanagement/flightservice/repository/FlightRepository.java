package com.flightmanagement.flightservice.repository;

import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    // Temel sorgular
    List<Flight> findByFlightNumber(String flightNumber);

    List<Flight> findByFlightNumberAndFlightDate(String flightNumber, LocalDate flightDate);

    Optional<Flight> findByFlightNumberAndFlightDateAndSegmentNumber(
            String flightNumber, LocalDate flightDate, Integer segmentNumber);

    List<Flight> findByStatus(FlightStatus status);

    List<Flight> findByFlightDate(LocalDate flightDate);

    List<Flight> findByFlightDateBetween(LocalDate startDate, LocalDate endDate);

    // Route bazlı sorgular
    List<Flight> findByRouteId(Long routeId);

    List<Flight> findByRouteIdAndFlightDate(Long routeId, LocalDate flightDate);

    Page<Flight> findByRouteId(Long routeId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.routeId = :routeId AND f.active = true")
    long countActiveFlightsByRoute(@Param("routeId") Long routeId);

    // Airline bazlı sorgular
    List<Flight> findByAirlineId(Long airlineId);

    Page<Flight> findByAirlineId(Long airlineId, Pageable pageable);

    List<Flight> findByAirlineIdAndFlightDate(Long airlineId, LocalDate flightDate);

    // Aircraft bazlı sorgular
    List<Flight> findByAircraftId(Long aircraftId);

    List<Flight> findByAircraftIdAndFlightDate(Long aircraftId, LocalDate flightDate);

    // Status bazlı sorgular
    List<Flight> findByStatusAndFlightDate(FlightStatus status, LocalDate flightDate);

    @Query("SELECT f FROM Flight f WHERE f.status = :status AND f.flightDate BETWEEN :startDate AND :endDate")
    List<Flight> findByStatusAndDateRange(@Param("status") FlightStatus status,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);

    // Aktarmalı uçuş sorgular
    List<Flight> findByParentFlightId(Long parentFlightId);

    List<Flight> findByIsConnectingFlightTrueAndParentFlightId(Long parentFlightId);

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true AND f.segmentNumber > 0 ORDER BY f.segmentNumber")
    List<Flight> findConnectingFlightSegments();

    // İstatistik sorguları
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.flightDate = :date")
    long countFlightsByDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.flightDate = :date AND f.status = :status")
    long countFlightsByDateAndStatus(@Param("date") LocalDate date, @Param("status") FlightStatus status);

    @Query("SELECT f.type, COUNT(f) FROM Flight f WHERE f.flightDate = :date GROUP BY f.type")
    List<Object[]> countFlightsGroupedByType(@Param("date") LocalDate date);

    @Query("SELECT f.type, COUNT(f) FROM Flight f GROUP BY f.type")
    List<Object[]> countFlightsGroupedByType();

    // Airline bazlı istatistikler
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.airlineId = :airlineId AND f.flightDate = :date")
    long countFlightsByAirlineAndDate(@Param("airlineId") Long airlineId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.status = :status AND f.flightDate = :date")
    long countFlightsByStatusAndDate(@Param("status") FlightStatus status, @Param("date") LocalDate date);

    // Connecting flight queries
    @Query("SELECT f FROM Flight f WHERE f.parentFlightId = :parentFlightId ORDER BY f.segmentNumber")
    List<Flight> findByParentFlightIdOrderBySegmentNumber(@Param("parentFlightId") Long parentFlightId);

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true")
    List<Flight> findByIsConnectingFlightTrue();

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true AND f.flightDate = :date")
    List<Flight> findByIsConnectingFlightTrueAndFlightDate(@Param("date") LocalDate date);

    // Performans sorguları
    @Query("SELECT f FROM Flight f WHERE f.scheduledDeparture BETWEEN :start AND :end ORDER BY f.scheduledDeparture")
    List<Flight> findFlightsInTimeRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT f FROM Flight f WHERE f.routeId = :routeId AND f.flightDate BETWEEN :startDate AND :endDate ORDER BY f.scheduledDeparture")
    List<Flight> findFlightsByRouteAndDateRange(@Param("routeId") Long routeId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    // Validation sorguları
    boolean existsByFlightNumberAndFlightDate(String flightNumber, LocalDate flightDate);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Flight f " +
            "WHERE f.aircraftId = :aircraftId AND f.flightDate = :date AND " +
            "((f.scheduledDeparture <= :departure AND f.scheduledArrival > :departure) OR " +
            "(f.scheduledDeparture < :arrival AND f.scheduledArrival >= :arrival) OR " +
            "(f.scheduledDeparture >= :departure AND f.scheduledArrival <= :arrival))")
    boolean hasAircraftConflict(@Param("aircraftId") Long aircraftId,
                                @Param("date") LocalDate date,
                                @Param("departure") LocalDateTime departure,
                                @Param("arrival") LocalDateTime arrival);
}