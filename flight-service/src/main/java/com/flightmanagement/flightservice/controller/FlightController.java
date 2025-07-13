package com.flightmanagement.flightservice.controller;

import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.CsvUploadResult;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.service.CsvProcessingService;
import com.flightmanagement.flightservice.service.FlightService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final CsvProcessingService csvProcessingService;

    @GetMapping
    public ResponseEntity<List<FlightResponse>> getAllFlights() {
        return ResponseEntity.ok(flightService.getAllFlights());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightResponse> getFlightById(@PathVariable Long id) {
        return ResponseEntity.ok(flightService.getFlightById(id));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<FlightResponse>> getFlightsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(flightService.getFlightsByDate(date));
    }

    @GetMapping("/airline/{airlineId}")
    public ResponseEntity<List<FlightResponse>> getFlightsByAirline(@PathVariable Long airlineId) {
        return ResponseEntity.ok(flightService.getFlightsByAirline(airlineId));
    }

    @GetMapping("/airport/{airportId}")
    public ResponseEntity<List<FlightResponse>> getFlightsByAirport(@PathVariable Long airportId) {
        return ResponseEntity.ok(flightService.getFlightsByAirport(airportId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<FlightResponse>> getFlightsByStatus(@PathVariable FlightStatus status) {
        return ResponseEntity.ok(flightService.getFlightsByStatus(status));
    }

    @GetMapping("/delayed")
    public ResponseEntity<List<FlightResponse>> getDelayedFlights(
            @RequestParam(defaultValue = "15") Integer minDelayMinutes) {
        return ResponseEntity.ok(flightService.getDelayedFlights(minDelayMinutes));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> createFlight(@Valid @RequestBody FlightRequest request) {
        return new ResponseEntity<>(flightService.createFlight(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateFlight(@PathVariable Long id,
                                                       @Valid @RequestBody FlightRequest request) {
        return ResponseEntity.ok(flightService.updateFlight(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateFlightStatus(@PathVariable Long id,
                                                             @RequestParam FlightStatus status) {
        return ResponseEntity.ok(flightService.updateFlightStatus(id, status));
    }

    @PutMapping("/{id}/delay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> recordDelay(@PathVariable Long id,
                                                      @RequestParam Integer delayMinutes,
                                                      @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(flightService.recordDelay(id, delayMinutes, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CsvUploadResult> uploadFlights(@RequestParam("file") MultipartFile file) {
        CsvUploadResult result = csvProcessingService.processCsvFile(file);

        if (result.isCompleteFailure()) {
            return ResponseEntity.badRequest().body(result);
        } else if (result.isPartialSuccess()) {
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
        } else {
            return ResponseEntity.ok(result);
        }
    }
}