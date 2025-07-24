package com.flightmanagement.flightservice.repository;

import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
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

    // YENİ: Route bazlı sorgular
    List<Flight> findByRouteId(Long routeId);

    List<Flight> findByRouteIdAndFlightDate(Long routeId, LocalDate flightDate);

    Page<Flight> findByRouteId(Long routeId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.routeId = :routeId AND f.active = true")
    long countActiveFlightsByRoute(@Param("routeId") Long routeId);

    // ESKİ: Airport bazlı sorgular (backward compatibility)
    @Deprecated
    List<Flight> findByOriginAirportId(Long originAirportId);

    @Deprecated
    List<Flight> findByDestinationAirportId(Long destinationAirportId);

    @Deprecated
    List<Flight> findByOriginAirportIdAndDestinationAirportId(Long originId, Long destinationId);

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

    // Gecikme bazlı sorgular
    @Query("SELECT f FROM Flight f WHERE f.delayMinutes > :minDelay AND f.flightDate = :date")
    List<Flight> findDelayedFlights(@Param("minDelay") Integer minDelay, @Param("date") LocalDate date);

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

    @Query("SELECT f.status, COUNT(f) FROM Flight f WHERE f.flightDate = :date GROUP BY f.status")
    List<Object[]> countFlightsGroupedByStatus(@Param("date") LocalDate date);

    // Airline bazlı istatistikler
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.airlineId = :airlineId AND f.flightDate = :date")
    long countFlightsByAirlineAndDate(@Param("airlineId") Long airlineId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.status = :status AND f.flightDate = :date")
    long countFlightsByStatusAndDate(@Param("status") FlightStatus status, @Param("date") LocalDate date);

    // Connecting flight queries - parent flight ile sıralı
    @Query("SELECT f FROM Flight f WHERE f.parentFlightId = :parentFlightId ORDER BY f.segmentNumber")
    List<Flight> findByParentFlightIdOrderBySegmentNumber(@Param("parentFlightId") Long parentFlightId);

    // Connecting flight sorgular - aktif connecting flight'lar
    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true")
    List<Flight> findByIsConnectingFlightTrue();

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true AND f.flightDate = :date")
    List<Flight> findByIsConnectingFlightTrueAndFlightDate(@Param("date") LocalDate date);

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true AND f.airlineId = :airlineId")
    List<Flight> findByIsConnectingFlightTrueAndAirlineId(@Param("airlineId") Long airlineId);

    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true AND f.airlineId = :airlineId AND f.flightDate = :date")
    List<Flight> findByIsConnectingFlightTrueAndAirlineIdAndFlightDate(@Param("airlineId") Long airlineId, @Param("date") LocalDate date);

    // Grup istatistikleri
    @Query("SELECT f.flightDate, f.status, COUNT(f) FROM Flight f WHERE f.flightDate BETWEEN :startDate AND :endDate GROUP BY f.flightDate, f.status ORDER BY f.flightDate")
    List<Object[]> countFlightsGroupedByDateAndStatus(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

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

    // Cleanup sorguları
    @Query("DELETE FROM Flight f WHERE f.flightDate < :cutoffDate AND f.status IN ('CANCELLED', 'ARRIVED')")
    void deleteOldCompletedFlights(@Param("cutoffDate") LocalDate cutoffDate);

    // Route migration helper sorguları (geçici)
    @Query("SELECT f FROM Flight f WHERE f.routeId IS NULL AND f.originAirportId IS NOT NULL AND f.destinationAirportId IS NOT NULL")
    List<Flight> findFlightsNeedingRouteAssignment();

    @Query("UPDATE Flight f SET f.routeId = :routeId WHERE f.originAirportId = :originId AND f.destinationAirportId = :destId AND f.routeId IS NULL")
    void assignRouteToLegacyFlights(@Param("routeId") Long routeId,
                                    @Param("originId") Long originId,
                                    @Param("destId") Long destId);

    // Eksik metodlar - FlightRepository'ye ekle:

    List<Flight> findByOriginAirportIdOrDestinationAirportId(Long originAirportId, Long destinationAirportId);

    List<Flight> findByDelayMinutesGreaterThanEqual(Integer minDelayMinutes);

    // Connecting flights için filtreleme
    @Query("SELECT f FROM Flight f WHERE f.isConnectingFlight = true " +
            "AND (:airlineId IS NULL OR f.airlineId = :airlineId) " +
            "AND (:flightDate IS NULL OR f.flightDate = :flightDate)")
    Page<Flight> findConnectingFlightsWithFilters(@Param("airlineId") Long airlineId,
                                                  @Param("flightDate") LocalDate flightDate,
                                                  Pageable pageable);
}