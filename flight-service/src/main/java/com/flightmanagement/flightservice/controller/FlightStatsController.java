package com.flightmanagement.flightservice.controller;

import com.flightmanagement.flightservice.dto.response.stats.FlightChartDataDto;
import com.flightmanagement.flightservice.dto.response.stats.FlightTypeDistributionDto;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.service.FlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/flights/stats")
@RequiredArgsConstructor
public class FlightStatsController {

    private final FlightService flightService;

    // --- ESKİ METOTLARINIZ ---

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

    @GetMapping("/summary/{date}")
    public ResponseEntity<Map<String, Object>> getDailySummary(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(flightService.getDailySummary(date));
    }

    @GetMapping("/daily-chart")
    public ResponseEntity<FlightChartDataDto> getFlightChartData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(flightService.getFlightChartData(startDate, endDate));
    }

    @GetMapping("/type-distribution")
    public ResponseEntity<List<FlightTypeDistributionDto>> getFlightTypeDistribution() {
        return ResponseEntity.ok(flightService.getFlightTypeDistribution());
    }
}