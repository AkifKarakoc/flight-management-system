package com.flightmanagement.flightservice.repository;

import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties;
import org.springframework.data.domain.Page;
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

    // Flight number ile arama
    Optional<Flight> findByFlightNumberAndFlightDate(String flightNumber, LocalDate flightDate);
    List<Flight> findByFlightNumber(String flightNumber);

    // Airline bazlı aramalar
    List<Flight> findByAirlineId(Long airlineId);
    List<Flight> findByAirlineIdAndFlightDate(Long airlineId, LocalDate flightDate);

    // Airport bazlı aramalar
    List<Flight> findByOriginAirportId(Long originAirportId);
    List<Flight> findByDestinationAirportId(Long destinationAirportId);
    List<Flight> findByOriginAirportIdOrDestinationAirportId(Long originId, Long destinationId);

    // Aircraft bazlı aramalar
    List<Flight> findByAircraftId(Long aircraftId);

    // Tarih bazlı aramalar
    List<Flight> findByFlightDate(LocalDate flightDate);
    List<Flight> findByFlightDateBetween(LocalDate startDate, LocalDate endDate);

    // Status bazlı aramalar
    List<Flight> findByStatus(FlightStatus status);
    List<Flight> findByStatusAndFlightDate(FlightStatus status, LocalDate flightDate);

    // Type bazlı aramalar
    List<Flight> findByType(FlightType type);

    // Zaman bazlı aramalar
    List<Flight> findByScheduledDepartureBetween(LocalDateTime start, LocalDateTime end);
    List<Flight> findByScheduledArrivalBetween(LocalDateTime start, LocalDateTime end);

    // Gecikme aramaları
    @Query("SELECT f FROM Flight f WHERE f.delayMinutes > :minutes")
    List<Flight> findDelayedFlights(@Param("minutes") Integer minutes);

    @Query("SELECT f FROM Flight f WHERE f.status = 'DELAYED' AND f.flightDate = :date")
    List<Flight> findDelayedFlightsByDate(@Param("date") LocalDate date);

    // Aktif uçuşlar
    List<Flight> findByActiveTrue();
    List<Flight> findByActiveTrueAndFlightDate(LocalDate flightDate);

    // İstatistik sorguları
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.flightDate = :date")
    Long countFlightsByDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.airlineId = :airlineId AND f.flightDate = :date")
    Long countFlightsByAirlineAndDate(@Param("airlineId") Long airlineId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(f) FROM Flight f WHERE f.status = :status AND f.flightDate = :date")
    Long countFlightsByStatusAndDate(@Param("status") FlightStatus status, @Param("date") LocalDate date);

    // Rota bazlı sayım
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.originAirportId = :originId AND f.destinationAirportId = :destId")
    Long countFlightsByRoute(@Param("originId") Long originId, @Param("destId") Long destinationId);

    // Grafik verisi için tarih ve duruma göre gruplanmış sayım
    @Query("SELECT f.flightDate, f.status, COUNT(f) FROM Flight f WHERE f.flightDate BETWEEN :startDate AND :endDate GROUP BY f.flightDate, f.status")
    List<Object[]> countFlightsGroupedByDateAndStatus(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Uçuş tipine göre gruplanmış sayım
    @Query("SELECT f.type, COUNT(f) FROM Flight f GROUP BY f.type")
    List<Object[]> countFlightsGroupedByType();

    // Aktarmalı uçuş aramaları
    List<Flight> findByParentFlightId(Long parentFlightId);
    List<Flight> findByParentFlightIdOrderBySegmentNumber(Long parentFlightId);

    // Ana uçuşlar (aktarmalı olmayan)
    List<Flight> findByIsConnectingFlightFalse();
    List<Flight> findByIsConnectingFlightTrue();

    // Parent-child ilişkisi kontrolü
    boolean existsByParentFlightId(Long parentFlightId);

    // Segment uçuş sayısı
    @Query("SELECT COUNT(f) FROM Flight f WHERE f.parentFlightId = :parentFlightId")
    Long countSegmentsByParentFlightId(@Param("parentFlightId") Long parentFlightId);

    // Ana uçuş için tüm segment'ler
    @Query("SELECT f FROM Flight f WHERE f.parentFlightId = :parentFlightId ORDER BY f.segmentNumber")
    List<Flight> findConnectingFlightsByParentId(@Param("parentFlightId") Long parentFlightId);

    // Segment numarasıyla arama
    @Query("SELECT f FROM Flight f WHERE f.parentFlightId = :parentFlightId AND f.segmentNumber = :segmentNumber")
    Optional<Flight> findByParentFlightIdAndSegmentNumber(@Param("parentFlightId") Long parentFlightId, @Param("segmentNumber") Integer segmentNumber);

    // Paginated connecting flights
    Page<Flight> findByIsConnectingFlightTrue(SpringDataWebProperties.Pageable pageable);
    Page<Flight> findByIsConnectingFlightTrueAndAirlineId(Long airlineId, SpringDataWebProperties.Pageable pageable);
    Page<Flight> findByIsConnectingFlightTrueAndFlightDate(LocalDate flightDate, SpringDataWebProperties.Pageable pageable);
    Page<Flight> findByIsConnectingFlightTrueAndAirlineIdAndFlightDate(Long airlineId, LocalDate flightDate, SpringDataWebProperties.Pageable pageable);

    // Validation queries
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Flight f WHERE f.flightNumber = :flightNumber AND f.flightDate = :flightDate AND f.parentFlightId IS NULL")
    boolean existsMainFlightByFlightNumberAndDate(@Param("flightNumber") String flightNumber, @Param("flightDate") LocalDate flightDate);
}