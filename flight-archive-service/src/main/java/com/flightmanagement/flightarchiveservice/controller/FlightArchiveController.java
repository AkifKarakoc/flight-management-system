package com.flightmanagement.flightarchiveservice.controller;

import com.flightmanagement.flightarchiveservice.dto.response.FlightArchiveResponse;
import com.flightmanagement.flightarchiveservice.dto.response.FlightStatsResponse;
import com.flightmanagement.flightarchiveservice.service.FlightArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/archive")
@RequiredArgsConstructor
public class FlightArchiveController {

    private final FlightArchiveService flightArchiveService;

    @GetMapping("/flights/history")
    public ResponseEntity<List<FlightArchiveResponse>> getFlightHistory(
            @RequestParam String flightNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<FlightArchiveResponse> history = flightArchiveService.getFlightHistory(flightNumber, date);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/flights")
    public ResponseEntity<Page<FlightArchiveResponse>> getFlightsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Pageable pageable) {

        Page<FlightArchiveResponse> flights = flightArchiveService.getFlightsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/flights/airline/{airlineId}")
    public ResponseEntity<List<FlightArchiveResponse>> getFlightsByAirline(
            @PathVariable Long airlineId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<FlightArchiveResponse> flights = flightArchiveService.getFlightsByAirline(airlineId, startDate, endDate);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/flights/delayed")
    public ResponseEntity<List<FlightArchiveResponse>> getDelayedFlights(
            @RequestParam(defaultValue = "15") Integer minDelayMinutes,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<FlightArchiveResponse> flights = flightArchiveService.getDelayedFlights(minDelayMinutes, date);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/flights/recent")
    public ResponseEntity<List<FlightArchiveResponse>> getRecentEvents(
            @RequestParam(defaultValue = "10") int limit) {

        List<FlightArchiveResponse> events = flightArchiveService.getRecentEvents(limit);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/stats/{date}")
    public ResponseEntity<FlightStatsResponse> getFlightStatistics(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        FlightStatsResponse stats = flightArchiveService.getFlightStatistics(date);
        return ResponseEntity.ok(stats);
    }
}