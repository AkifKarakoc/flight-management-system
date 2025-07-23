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
import com.flightmanagement.flightservice.repository.FlightRepository; // Repository import ekle
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import com.flightmanagement.flightservice.dto.response.stats.FlightChartDataDto;
import com.flightmanagement.flightservice.dto.response.stats.FlightTypeDistributionDto;

import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;
import java.util.Map;
import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.response.FlightConnectionResponse;

@RestController
@RequestMapping("/api/v1/flights")
@RequiredArgsConstructor
@Slf4j
public class FlightController {

    private final FlightService flightService;
    private final CsvProcessingService csvProcessingService;
    private final FlightRepository flightRepository; // Repository field ekle

    // Mevcut metodlar aynı kalacak...
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

    // AKTARMALI UÇUŞ ENDPOİNTLERİ - DÜZELTİLMİŞ

    /**
     * Aktarmalı uçuş oluşturur
     */
    @PostMapping("/connecting")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
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

    /**
     * Aktarmalı uçuş detayını getirir
     */
    @GetMapping("/connecting/{mainFlightId}")
    public ResponseEntity<FlightResponse> getConnectingFlightDetails(
            @PathVariable Long mainFlightId) {

        log.info("Getting connecting flight details: {}", mainFlightId);
        FlightResponse response = flightService.getConnectingFlightDetails(mainFlightId);
        return ResponseEntity.ok(response);
    }

    /**
     * Ana uçuş için tüm segment'leri getirir
     */
    @GetMapping("/{mainFlightId}/segments")
    public ResponseEntity<List<FlightResponse>> getFlightSegments(
            @PathVariable Long mainFlightId) {

        log.info("Getting flight segments for main flight: {}", mainFlightId);
        List<FlightResponse> segments = flightService.getConnectingFlights(mainFlightId);
        return ResponseEntity.ok(segments);
    }

    /**
     * Aktarmalı uçuş günceller
     */
    @PutMapping("/connecting/{mainFlightId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
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

    /**
     * Aktarmalı uçuş siler
     */
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

    /**
     * Tüm aktarmalı uçuşları getirir
     */
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

    /**
     * Belirli segment'i günceller
     */
    @PutMapping("/segments/{segmentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    public ResponseEntity<FlightResponse> updateFlightSegment(
            @PathVariable Long segmentId,
            @Valid @RequestBody FlightRequest request) {

        log.info("Updating flight segment: {}", segmentId);

        try {
            // Segment'in parent uçuş olup olmadığını kontrol et
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

    /**
     * Segment durum günceller
     */
    @PatchMapping("/segments/{segmentId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    public ResponseEntity<FlightResponse> updateSegmentStatus(
            @PathVariable Long segmentId,
            @RequestParam FlightStatus status,
            @RequestParam(required = false) String reason) {

        log.info("Updating segment status: {} to {}", segmentId, status);

        try {
            // updateFlightStatus metodunu 2 parametre ile çağır
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

    // İSTATİSTİK ENDPOİNTLERİ
    @GetMapping("/stats/daily-summary")
    public ResponseEntity<Map<String, Object>> getDailySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(flightService.getDailySummary(date));
    }

    @GetMapping("/stats/chart-data")
    public ResponseEntity<FlightChartDataDto> getFlightChartData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(flightService.getFlightChartData(startDate, endDate));
    }

    @GetMapping("/stats/type-distribution")
    public ResponseEntity<List<FlightTypeDistributionDto>> getFlightTypeDistribution() {
        return ResponseEntity.ok(flightService.getFlightTypeDistribution());
    }
}