package com.flightmanagement.flightservice.controller;

import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.CsvUploadResult;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.exception.DuplicateResourceException;
import com.flightmanagement.flightservice.service.CsvProcessingService;
import com.flightmanagement.flightservice.service.FlightService;
import com.flightmanagement.flightservice.repository.FlightRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;

@RestController
@RequestMapping("/api/v1/flights")
@RequiredArgsConstructor
@Slf4j
public class FlightController {

    private final FlightService flightService;
    private final CsvProcessingService csvProcessingService;
    private final FlightRepository flightRepository;

    // ===============================
    // TEMEL FLIGHT CRUD İŞLEMLERİ
    // ===============================

    @GetMapping
    public ResponseEntity<Page<FlightResponse>> getAllFlights(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String flightNumber,
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate flightDate,
            @RequestParam(required = false) Long routeId) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        Page<FlightResponse> flights = flightService.getAllFlightsWithFilters(
                pageable, flightNumber, airlineId, flightDate);

        return ResponseEntity.ok(flights);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightResponse> getFlightById(@PathVariable Long id) {
        return ResponseEntity.ok(flightService.getFlightById(id));
    }

    @GetMapping("/flight-number/{flightNumber}")
    public ResponseEntity<List<FlightResponse>> getFlightsByNumber(@PathVariable String flightNumber) {
        return ResponseEntity.ok(flightService.getFlightsByFlightNumber(flightNumber));
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
        log.info("Creating new flight: {}", request.getFlightNumber());
        return new ResponseEntity<>(flightService.createFlight(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateFlight(@PathVariable Long id,
                                                       @Valid @RequestBody FlightRequest request) {
        log.info("Updating flight with ID: {}", id);
        return ResponseEntity.ok(flightService.updateFlight(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateFlightStatus(@PathVariable Long id,
                                                             @RequestParam FlightStatus status) {
        log.info("Updating flight status for ID: {} to {}", id, status);
        return ResponseEntity.ok(flightService.updateFlightStatus(id, status));
    }

    @PutMapping("/{id}/delay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> recordDelay(@PathVariable Long id,
                                                      @RequestParam Integer delayMinutes,
                                                      @RequestParam(required = false) String reason) {
        log.info("Recording delay for flight ID: {} - {} minutes", id, delayMinutes);
        return ResponseEntity.ok(flightService.recordDelay(id, delayMinutes, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        log.info("Deleting flight with ID: {}", id);
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }

    // ===============================
    // ROUTE BAZLI ENDPOİNTLER
    // ===============================

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<FlightResponse>> getFlightsByRoute(
            @PathVariable Long routeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Getting flights for route ID: {} on date: {}", routeId, date);
        List<FlightResponse> flights = flightService.getFlightsByRoute(routeId, date);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/route/{routeId}/paged")
    public ResponseEntity<Page<FlightResponse>> getFlightsByRoutePaged(
            @PathVariable Long routeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledDeparture") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        Page<FlightResponse> flights = flightService.getFlightsByRoutePaged(routeId, pageable);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/{id}/route-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getFlightRouteInfo(@PathVariable Long id) {
        log.info("Getting route info for flight ID: {}", id);
        Map<String, Object> routeInfo = flightService.getFlightRouteInfo(id);
        return ResponseEntity.ok(routeInfo);
    }

    // ===============================
    // CSV UPLOAD ENDPOİNTLERİ
    // ===============================

    @PostMapping("/upload-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CsvUploadResult> uploadFlights(@RequestParam("file") MultipartFile file) {
        log.info("Processing CSV upload: {}", file.getOriginalFilename());

        CsvUploadResult result = csvProcessingService.processCsvFile(file);

        if (result.isCompleteFailure()) {
            return ResponseEntity.badRequest().body(result);
        } else if (result.isPartialSuccess()) {
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
        } else {
            return ResponseEntity.ok(result);
        }
    }

    @PostMapping("/validate-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> validateCsv(@RequestParam("file") MultipartFile file) {
        log.info("Validating CSV file: {}", file.getOriginalFilename());

        List<String> errors = csvProcessingService.validateCsvContent(file);

        Map<String, Object> response = new HashMap<>();
        response.put("valid", errors.isEmpty());
        response.put("errors", errors);
        response.put("errorCount", errors.size());

        if (errors.isEmpty()) {
            response.put("message", "CSV file is valid and ready for import");
        } else {
            response.put("message", "CSV file has validation errors");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/csv-template")
    public ResponseEntity<String> getCsvTemplate() {
        String template = csvProcessingService.generateCsvTemplate();
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=flight_template.csv")
                .body(template);
    }

    // ===============================
    // AKTARMALI UÇUŞ ENDPOİNTLERİ
    // ===============================

    @PostMapping("/connecting")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> createConnectingFlight(
            @Valid @RequestBody ConnectingFlightRequest request) {

        log.info("Creating connecting flight: {}", request.getMainFlightNumber());

        try {
            FlightResponse response = flightService.createConnectingFlight(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (DuplicateResourceException e) {
            log.error("Duplicate connecting flight: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error creating connecting flight: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create connecting flight");
        }
    }

    @GetMapping("/connecting/{mainFlightId}")
    public ResponseEntity<FlightResponse> getConnectingFlightDetails(
            @PathVariable Long mainFlightId) {

        log.info("Getting connecting flight details: {}", mainFlightId);
        FlightResponse response = flightService.getConnectingFlightDetails(mainFlightId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{mainFlightId}/segments")
    public ResponseEntity<List<FlightResponse>> getFlightSegments(
            @PathVariable Long mainFlightId) {

        log.info("Getting flight segments for main flight: {}", mainFlightId);
        List<FlightResponse> segments = flightService.getConnectingFlights(mainFlightId);
        return ResponseEntity.ok(segments);
    }

    @PutMapping("/connecting/{mainFlightId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateConnectingFlight(
            @PathVariable Long mainFlightId,
            @Valid @RequestBody ConnectingFlightRequest request) {

        log.info("Updating connecting flight: {}", mainFlightId);

        try {
            FlightResponse response = flightService.updateConnectingFlight(mainFlightId, request);
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            log.error("Connecting flight not found: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating connecting flight: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update connecting flight");
        }
    }

    @DeleteMapping("/connecting/{mainFlightId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConnectingFlight(@PathVariable Long mainFlightId) {

        log.info("Deleting connecting flight: {}", mainFlightId);

        try {
            flightService.deleteConnectingFlight(mainFlightId);
            return ResponseEntity.noContent().build();

        } catch (ResourceNotFoundException e) {
            log.error("Connecting flight not found: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error deleting connecting flight: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete connecting flight");
        }
    }

    @GetMapping("/connecting")
    public ResponseEntity<Page<FlightResponse>> getConnectingFlights(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate flightDate) {

        log.info("Getting connecting flights - page: {}, size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        Page<FlightResponse> response = flightService.getConnectingFlightsWithFilters(
                pageable, airlineId, flightDate);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/segments/{segmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateFlightSegment(
            @PathVariable Long segmentId,
            @Valid @RequestBody FlightRequest request) {

        log.info("Updating flight segment: {}", segmentId);

        try {
            Flight segment = flightRepository.findById(segmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Flight segment not found"));

            if (segment.getParentFlightId() == null) {
                throw new RuntimeException("Flight is not a segment of connecting flight");
            }

            FlightResponse response = flightService.updateFlight(segmentId, request);
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            log.error("Flight segment not found: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating flight segment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update flight segment");
        }
    }

    @PatchMapping("/segments/{segmentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightResponse> updateSegmentStatus(
            @PathVariable Long segmentId,
            @RequestParam FlightStatus status,
            @RequestParam(required = false) String reason) {

        log.info("Updating segment status: {} to {}", segmentId, status);

        try {
            FlightResponse response = flightService.updateFlightStatus(segmentId, status);
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            log.error("Flight segment not found: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating segment status: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update segment status");
        }
    }

    // ===============================
    // SİSTEM BİLGİ ENDPOİNTLERİ
    // ===============================

    @GetMapping("/system-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("systemType", "ROUTE_BASED");
        info.put("version", "2.0");
        info.put("description", "Route-based Flight Management System");
        info.put("legacyMigrationStatus", "COMPLETED");
        info.put("totalFlights", flightRepository.count());
        info.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(info);
    }

    @GetMapping("/migration-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        Map<String, Object> status = flightService.getMigrationStatus();
        return ResponseEntity.ok(status);
    }

    // ===============================
    // BULK OPERATIONS
    // ===============================

    @PostMapping("/bulk-status-update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> bulkStatusUpdate(
            @RequestParam List<Long> flightIds,
            @RequestParam FlightStatus status,
            @RequestParam(required = false) String reason) {

        log.info("Bulk status update for {} flights to {}", flightIds.size(), status);

        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (Long flightId : flightIds) {
            try {
                flightService.updateFlightStatus(flightId, status);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add("Flight " + flightId + ": " + e.getMessage());
            }
        }

        result.put("totalRequested", flightIds.size());
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        result.put("status", failureCount == 0 ? "SUCCESS" : (successCount == 0 ? "FAILED" : "PARTIAL"));

        if (failureCount > 0) {
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
        } else {
            return ResponseEntity.ok(result);
        }
    }

    @DeleteMapping("/bulk-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> bulkDeleteFlights(
            @RequestParam List<Long> flightIds,
            @RequestParam(defaultValue = "false") boolean force) {

        log.info("Bulk delete for {} flights, force: {}", flightIds.size(), force);

        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (Long flightId : flightIds) {
            try {
                // Check if flight can be deleted (not departed unless forced)
                if (!force) {
                    Flight flight = flightRepository.findById(flightId)
                            .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
                    if (flight.isDeparted()) {
                        throw new RuntimeException("Cannot delete departed flight without force flag");
                    }
                }

                flightService.deleteFlight(flightId);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add("Flight " + flightId + ": " + e.getMessage());
            }
        }

        result.put("totalRequested", flightIds.size());
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        result.put("status", failureCount == 0 ? "SUCCESS" : (successCount == 0 ? "FAILED" : "PARTIAL"));

        if (failureCount > 0) {
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
        } else {
            return ResponseEntity.ok(result);
        }
    }

    // ===============================
    // SEARCH ve FILTERING
    // ===============================

    @GetMapping("/search")
    public ResponseEntity<Page<FlightResponse>> searchFlights(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) FlightStatus status,
            @RequestParam(required = false) FlightType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledDeparture") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        log.info("Advanced flight search - query: {}, routeId: {}, airlineId: {}", query, routeId, airlineId);

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        // For now, use basic filtering. Can be enhanced with advanced search logic
        Page<FlightResponse> flights = flightService.getAllFlightsWithFilters(
                pageable, query, airlineId, startDate);

        return ResponseEntity.ok(flights);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<FlightResponse>> filterFlights(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) FlightStatus status,
            @RequestParam(required = false) FlightType type,
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) Boolean delayed,
            @RequestParam(required = false) Integer minDelayMinutes) {

        log.info("Filtering flights - date: {}, status: {}, routeId: {}", date, status, routeId);

        List<FlightResponse> flights;

        if (date != null) {
            flights = flightService.getFlightsByDate(date);
        } else if (status != null) {
            flights = flightService.getFlightsByStatus(status);
        } else if (routeId != null) {
            flights = flightService.getFlightsByRoute(routeId, null);
        } else if (Boolean.TRUE.equals(delayed)) {
            flights = flightService.getDelayedFlights(minDelayMinutes != null ? minDelayMinutes : 15);
        } else {
            // Default: return today's flights
            flights = flightService.getFlightsByDate(LocalDate.now());
        }

        // Apply additional filters if needed
        if (type != null) {
            flights = flights.stream()
                    .filter(f -> type.equals(f.getType()))
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(flights);
    }

    // ===============================
    // HELPER ENDPOİNTLER
    // ===============================

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getFlightCounts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = date != null ? date : LocalDate.now();

        Map<String, Object> counts = new HashMap<>();
        counts.put("date", targetDate);
        counts.put("total", flightService.getFlightCountByDate(targetDate));
        counts.put("scheduled", flightService.getFlightCountByStatus(FlightStatus.SCHEDULED, targetDate));
        counts.put("departed", flightService.getFlightCountByStatus(FlightStatus.DEPARTED, targetDate));
        counts.put("arrived", flightService.getFlightCountByStatus(FlightStatus.ARRIVED, targetDate));
        counts.put("delayed", flightService.getFlightCountByStatus(FlightStatus.DELAYED, targetDate));
        counts.put("cancelled", flightService.getFlightCountByStatus(FlightStatus.CANCELLED, targetDate));

        return ResponseEntity.ok(counts);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "flight-service");
        health.put("timestamp", LocalDateTime.now());
        health.put("version", "2.0-ROUTE-BASED");
        return ResponseEntity.ok(health);
    }
}