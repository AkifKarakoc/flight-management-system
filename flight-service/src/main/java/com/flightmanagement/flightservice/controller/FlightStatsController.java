package com.flightmanagement.flightservice.controller;

import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.service.FlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/flights/stats")
@RequiredArgsConstructor
public class FlightStatsController {

    private final FlightService flightService;

    @GetMapping("/count/date/{date}")
    public ResponseEntity<Map<String, Object>> getFlightCountByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long count = flightService.getFlightCountByDate(date);

        Map<String, Object> response = new HashMap<>();
        response.put("date", date);
        response.put("totalFlights", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count/airline/{airlineId}/date/{date}")
    public ResponseEntity<Map<String, Object>> getFlightCountByAirlineAndDate(
            @PathVariable Long airlineId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long count = flightService.getFlightCountByAirlineAndDate(airlineId, date);

        Map<String, Object> response = new HashMap<>();
        response.put("airlineId", airlineId);
        response.put("date", date);
        response.put("flightCount", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count/status/{status}/date/{date}")
    public ResponseEntity<Map<String, Object>> getFlightCountByStatus(
            @PathVariable FlightStatus status,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long count = flightService.getFlightCountByStatus(status, date);

        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("date", date);
        response.put("flightCount", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/{date}")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("date", date);
        dashboard.put("totalFlights", flightService.getFlightCountByDate(date));
        dashboard.put("scheduledFlights", flightService.getFlightCountByStatus(FlightStatus.SCHEDULED, date));
        dashboard.put("departedFlights", flightService.getFlightCountByStatus(FlightStatus.DEPARTED, date));
        dashboard.put("arrivedFlights", flightService.getFlightCountByStatus(FlightStatus.ARRIVED, date));
        dashboard.put("cancelledFlights", flightService.getFlightCountByStatus(FlightStatus.CANCELLED, date));
        dashboard.put("delayedFlights", flightService.getFlightCountByStatus(FlightStatus.DELAYED, date));

        return ResponseEntity.ok(dashboard);
    }
}