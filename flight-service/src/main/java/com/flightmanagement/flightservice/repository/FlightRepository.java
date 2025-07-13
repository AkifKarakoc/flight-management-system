package com.flightmanagement.flightservice.repository;

import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
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
}