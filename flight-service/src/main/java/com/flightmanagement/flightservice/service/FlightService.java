package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.FlightResponse;
import com.flightmanagement.flightservice.entity.Flight;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.exception.DuplicateResourceException;
import com.flightmanagement.flightservice.exception.ResourceNotFoundException;
import com.flightmanagement.flightservice.mapper.FlightMapper;
import com.flightmanagement.flightservice.repository.FlightRepository;
import com.flightmanagement.flightservice.validator.FlightValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.flightmanagement.flightservice.dto.response.stats.FlightChartDataDto;
import com.flightmanagement.flightservice.dto.response.stats.FlightTypeDistributionDto;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.stream.Stream;
import java.util.Map;
import java.util.HashMap;
import com.flightmanagement.flightservice.dto.request.ConnectingFlightRequest;
import com.flightmanagement.flightservice.dto.request.FlightSegmentRequest;
import com.flightmanagement.flightservice.entity.FlightConnection;
import com.flightmanagement.flightservice.repository.FlightConnectionRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FlightService {

    private final FlightRepository flightRepository;
    private final FlightMapper flightMapper;
    private final FlightValidator flightValidator;
    private final ReferenceDataService referenceDataService;
    private final KafkaProducerService kafkaProducerService;
    private final WebSocketMessageService webSocketMessageService;
    private final FlightConnectionRepository flightConnectionRepository;

    public List<FlightResponse> getAllFlights() {
        log.debug("Fetching all flights");
        return flightRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FlightResponse getFlightById(Long id) {
        log.debug("Fetching flight with id: {}", id);
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        return mapToResponse(flight);
    }

    public List<FlightResponse> getFlightsByDate(LocalDate date) {
        log.debug("Fetching flights for date: {}", date);
        return flightRepository.findByFlightDate(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByAirline(Long airlineId) {
        log.debug("Fetching flights for airline: {}", airlineId);
        return flightRepository.findByAirlineId(airlineId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByAirport(Long airportId) {
        log.debug("Fetching flights for airport: {}", airportId);
        return flightRepository.findByOriginAirportIdOrDestinationAirportId(airportId, airportId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getFlightsByStatus(FlightStatus status) {
        log.debug("Fetching flights with status: {}", status);
        return flightRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FlightResponse> getDelayedFlights(Integer minDelayMinutes) {
        log.debug("Fetching flights delayed by more than {} minutes", minDelayMinutes);
        return flightRepository.findDelayedFlights(minDelayMinutes).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FlightResponse createFlight(FlightRequest request) {
        log.debug("Creating new flight: {}", request.getFlightNumber());

        // Validation
        flightValidator.validateFlightRequest(request);

        // Check for duplicate flight
        flightRepository.findByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
                });

        Flight flight = flightMapper.toEntity(request);
        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_CREATED", flight);
        webSocketMessageService.sendFlightUpdate("CREATE", mapToResponse(flight), mapToResponse(flight).getId(), mapToResponse(flight).getFlightNumber());

        return mapToResponse(flight);
    }

    public FlightResponse updateFlight(Long id, FlightRequest request) {
        log.debug("Updating flight with id: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        // Validation
        flightValidator.validateFlightUpdate(flight, request);

        // Check for duplicate flight number (if changed)
        if (!flight.getFlightNumber().equals(request.getFlightNumber()) ||
                !flight.getFlightDate().equals(request.getFlightDate())) {
            flightRepository.findByFlightNumberAndFlightDate(request.getFlightNumber(), request.getFlightDate())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new DuplicateResourceException(
                                    "Flight already exists: " + request.getFlightNumber() + " on " + request.getFlightDate());
                        }
                    });
        }

        flightMapper.updateEntity(flight, request);
        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_UPDATED", flight);
        webSocketMessageService.sendFlightUpdate("UPDATE", mapToResponse(flight), id, mapToResponse(flight).getFlightNumber());

        return mapToResponse(flight);
    }

    public void deleteFlight(Long id) {
        log.debug("Deleting flight with id: {}", id);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flightRepository.delete(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_DELETED", flight);
        webSocketMessageService.sendFlightUpdate("DELETE", null, id, flight.getFlightNumber());
    }

    public FlightResponse updateFlightStatus(Long id, FlightStatus status) {
        log.debug("Updating flight status: {} to {}", id, status);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        FlightStatus oldStatus = flight.getStatus();
        flight.setStatus(status);

        // Auto-set actual times based on status
        if (status == FlightStatus.DEPARTED && flight.getActualDeparture() == null) {
            flight.setActualDeparture(LocalDateTime.now());
        }
        if (status == FlightStatus.ARRIVED && flight.getActualArrival() == null) {
            flight.setActualArrival(LocalDateTime.now());
        }

        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_STATUS_CHANGED", flight);
        webSocketMessageService.sendFlightStatusUpdate(flight.getFlightNumber(), oldStatus.toString(), status.toString(), mapToResponse(flight), id);

        log.info("Flight {} status changed from {} to {}", flight.getFlightNumber(), oldStatus, status);
        return mapToResponse(flight);
    }

    public FlightResponse recordDelay(Long id, Integer delayMinutes, String reason) {
        log.debug("Recording delay for flight: {}, {} minutes", id, delayMinutes);

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flight.setDelayMinutes(delayMinutes);
        flight.setDelayReason(reason);

        if (delayMinutes > 0 && flight.getStatus() == FlightStatus.SCHEDULED) {
            flight.setStatus(FlightStatus.DELAYED);
        }

        flight = flightRepository.save(flight);

        // Kafka event
        kafkaProducerService.sendFlightEvent("FLIGHT_DELAYED", flight);

        return mapToResponse(flight);
    }

    // Statistics methods
    public Long getFlightCountByDate(LocalDate date) {
        return flightRepository.countFlightsByDate(date);
    }

    public Long getFlightCountByAirlineAndDate(Long airlineId, LocalDate date) {
        return flightRepository.countFlightsByAirlineAndDate(airlineId, date);
    }

    public Long getFlightCountByStatus(FlightStatus status, LocalDate date) {
        return flightRepository.countFlightsByStatusAndDate(status, date);
    }

// Yeni metodlar

    /**
     * Aktarmalı uçuş oluşturur
     */
    @Transactional
    public FlightResponse createConnectingFlight(ConnectingFlightRequest request) {
        log.info("Creating connecting flight: {}", request.getMainFlightNumber());

        // Ana uçuş oluştur (virtual flight - sadece takip için)
        Flight mainFlight = createMainFlight(request);
        Flight savedMainFlight = flightRepository.save(mainFlight);

        // Segment uçuşları oluştur
        List<Flight> segments = new ArrayList<>();
        for (int i = 0; i < request.getSegments().size(); i++) {
            FlightSegmentRequest segmentRequest = request.getSegments().get(i);
            Flight segment = createSegmentFlight(savedMainFlight, segmentRequest, i + 1);
            Flight savedSegment = flightRepository.save(segment);
            segments.add(savedSegment);

            // FlightConnection kaydı oluştur
            FlightConnection connection = new FlightConnection();
            connection.setMainFlightId(savedMainFlight.getId());
            connection.setSegmentFlightId(savedSegment.getId());
            connection.setSegmentOrder(i + 1);
            connection.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());
            flightConnectionRepository.save(connection);
        }

        // Response oluştur
        FlightResponse response = mapToResponse(savedMainFlight); // Mevcut metod kullanıldı
        response.setConnectingFlights(segments.stream()
                .map(this::mapToResponse) // this::mapToResponse kullanıldı
                .collect(Collectors.toList()));
        response.setTotalSegments(segments.size());
        response.setFullRoute(buildFullRoute(segments));

        // Kafka event gönder
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_CREATED", savedMainFlight);

        log.info("Connecting flight created successfully: {}", savedMainFlight.getId());
        return response;
    }

    /**
     * Ana uçuş için tüm segment'leri getirir
     */
    public List<FlightResponse> getConnectingFlights(Long mainFlightId) {
        log.info("Getting connecting flights for main flight: {}", mainFlightId);

        List<Flight> segments = flightRepository.findByParentFlightIdOrderBySegmentNumber(mainFlightId);
        return segments.stream()
                .map(this::mapToResponse) // Mevcut mapToResponse metodunu kullan
                .collect(Collectors.toList());
    }

    /**
     * Aktarmalı uçuş detayını getirir
     */
    public FlightResponse getConnectingFlightDetails(Long mainFlightId) {
        log.info("Getting connecting flight details: {}", mainFlightId);

        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + mainFlightId));

        if (!mainFlight.getIsConnectingFlight()) {
            throw new RuntimeException("Flight is not a connecting flight: " + mainFlightId); // InvalidRequestException yerine
        }

        List<FlightResponse> segments = getConnectingFlights(mainFlightId);

        FlightResponse response = mapToResponse(mainFlight);
        response.setConnectingFlights(segments);
        response.setTotalSegments(segments.size());
        response.setFullRoute(buildFullRouteFromResponses(segments)); // Yeni metod

        return response;
    }

    /**
     * Aktarmalı uçuş günceller
     */
    @Transactional
    public FlightResponse updateConnectingFlight(Long mainFlightId, ConnectingFlightRequest request) {
        log.info("Updating connecting flight: {}", mainFlightId);

        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + mainFlightId));

        if (!mainFlight.getIsConnectingFlight()) {
            throw new RuntimeException("Flight is not a connecting flight: " + mainFlightId);
        }

        // Mevcut segment'leri sil
        List<FlightConnection> existingConnections = flightConnectionRepository.findByMainFlightIdOrderBySegmentOrder(mainFlightId);
        existingConnections.forEach(connection -> {
            flightRepository.deleteById(connection.getSegmentFlightId());
            flightConnectionRepository.delete(connection);
        });

        // Ana uçuş bilgilerini güncelle
        updateMainFlightFromRequest(mainFlight, request);
        Flight savedMainFlight = flightRepository.save(mainFlight);

        // Yeni segment'leri oluştur
        List<Flight> newSegments = new ArrayList<>();
        for (int i = 0; i < request.getSegments().size(); i++) {
            FlightSegmentRequest segmentRequest = request.getSegments().get(i);
            Flight segment = createSegmentFlight(savedMainFlight, segmentRequest, i + 1);
            Flight savedSegment = flightRepository.save(segment);
            newSegments.add(savedSegment);

            FlightConnection connection = new FlightConnection();
            connection.setMainFlightId(savedMainFlight.getId());
            connection.setSegmentFlightId(savedSegment.getId());
            connection.setSegmentOrder(i + 1);
            connection.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());
            flightConnectionRepository.save(connection);
        }

        // Response oluştur
        FlightResponse response = mapToResponse(savedMainFlight);
        response.setConnectingFlights(newSegments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList()));
        response.setTotalSegments(newSegments.size());
        response.setFullRoute(buildFullRoute(newSegments));

        // Kafka event gönder
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_UPDATED", savedMainFlight);

        log.info("Connecting flight updated successfully: {}", mainFlightId);
        return response;
    }

    /**
     * Aktarmalı uçuş siler
     */
    @Transactional
    public void deleteConnectingFlight(Long mainFlightId) {
        log.info("Deleting connecting flight: {}", mainFlightId);

        Flight mainFlight = flightRepository.findById(mainFlightId)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + mainFlightId));

        if (!mainFlight.getIsConnectingFlight()) {
            throw new RuntimeException("Flight is not a connecting flight: " + mainFlightId);
        }

        // Segment'leri ve connection'ları sil
        List<FlightConnection> connections = flightConnectionRepository.findByMainFlightIdOrderBySegmentOrder(mainFlightId);
        connections.forEach(connection -> {
            flightRepository.deleteById(connection.getSegmentFlightId());
            flightConnectionRepository.delete(connection);
        });

        // Ana uçuşu sil
        flightRepository.delete(mainFlight);

        // Kafka event gönder
        kafkaProducerService.sendFlightEvent("CONNECTING_FLIGHT_DELETED", mainFlight);

        log.info("Connecting flight deleted successfully: {}", mainFlightId);
    }


    /**
     * Filtreli aktarmalı uçuşları getirir
     */
    public Page<FlightResponse> getConnectingFlightsWithFilters(Pageable pageable, Long airlineId, LocalDate flightDate) {
        log.info("Getting connecting flights with filters - airline: {}, date: {}", airlineId, flightDate);

        // Specification kullanarak dinamik sorgular oluşturabiliriz
        Page<Flight> flights;

        if (airlineId != null && flightDate != null) {
            flights = flightRepository.findByIsConnectingFlightTrueAndAirlineIdAndFlightDate(
                    airlineId, flightDate, (Pageable) pageable);
        } else if (airlineId != null) {
            flights = flightRepository.findByIsConnectingFlightTrueAndAirlineId(airlineId, (Pageable) pageable);
        } else if (flightDate != null) {
            flights = flightRepository.findByIsConnectingFlightTrueAndFlightDate(flightDate, (Pageable) pageable);
        } else {
            flights = flightRepository.findByIsConnectingFlightTrue((Pageable) pageable);
        }

        return flights.map(flight -> {
            FlightResponse response = mapToResponse(flight);

            // Segment'leri ekle
            List<FlightResponse> segments = getConnectingFlights(flight.getId());
            response.setConnectingFlights(segments);
            response.setTotalSegments(segments.size());
            response.setFullRoute(buildFullRouteFromResponses(segments));

            return response;
        });
    }

    private FlightResponse mapToResponse(Flight flight) {
        FlightResponse response = flightMapper.toResponse(flight);

        try {
            // Load reference data from cache/service
            AirlineCache airline = referenceDataService.getAirline(flight.getAirlineId());
            response.setAirline(airline);

            AircraftCache aircraft = referenceDataService.getAircraft(flight.getAircraftId());
            response.setAircraft(aircraft);

            AirportCache originAirport = referenceDataService.getAirport(flight.getOriginAirportId());
            response.setOriginAirport(originAirport);

            AirportCache destinationAirport = referenceDataService.getAirport(flight.getDestinationAirportId());
            response.setDestinationAirport(destinationAirport);

        } catch (Exception e) {
            log.warn("Could not load all reference data for flight {}: {}", flight.getId(), e.getMessage());
        }

        return response;
    }

    /**
     * Belirtilen bir tarihe ait tüm temel istatistikleri döndürür.
     * @param date İstatistiklerin hesaplanacağı tarih.
     * @return Tarihe ait istatistikleri içeren bir Map.
     */
    public Map<String, Object> getDailySummary(LocalDate date) {
        log.debug("Fetching daily summary for date: {}", date);
        Map<String, Object> summary = new HashMap<>();
        summary.put("date", date);
        summary.put("totalFlights", flightRepository.countFlightsByDate(date));
        summary.put("scheduled", flightRepository.countFlightsByStatusAndDate(FlightStatus.SCHEDULED, date));
        summary.put("departed", flightRepository.countFlightsByStatusAndDate(FlightStatus.DEPARTED, date));
        summary.put("arrived", flightRepository.countFlightsByStatusAndDate(FlightStatus.ARRIVED, date));
        summary.put("cancelled", flightRepository.countFlightsByStatusAndDate(FlightStatus.CANCELLED, date));
        summary.put("delayed", flightRepository.countFlightsByStatusAndDate(FlightStatus.DELAYED, date));
        return summary;
    }

    /**
     * Belirtilen tarih aralığı için grafik verisi oluşturur.
     * @param startDate Başlangıç tarihi.
     * @param endDate Bitiş tarihi.
     * @return Grafik için formatlanmış DTO.
     */
    public FlightChartDataDto getFlightChartData(LocalDate startDate, LocalDate endDate) {
        log.debug("Generating flight chart data from {} to {}", startDate, endDate);

        // 1. DTO'yu ve tarih listesini oluştur
        FlightChartDataDto chartData = new FlightChartDataDto();
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        List<LocalDate> dateRange = Stream.iterate(startDate, date -> date.plusDays(1))
                .limit(daysBetween)
                .collect(Collectors.toList());

        // 2. Her gün için tüm sayaçları sıfırla başlat
        dateRange.forEach(date -> {
            chartData.getDates().add(date.toString());
            chartData.getScheduled().add(0L);
            chartData.getDeparted().add(0L);
            chartData.getArrived().add(0L);
            chartData.getCancelled().add(0L);
            chartData.getDelayed().add(0L);
        });

        // 3. Veritabanından toplu veriyi çek
        List<Object[]> results = flightRepository.countFlightsGroupedByDateAndStatus(startDate, endDate);

        // 4. Veritabanı sonuçlarını işleyerek DTO'yu doldur
        for (Object[] result : results) {
            LocalDate date = (LocalDate) result[0];
            FlightStatus status = (FlightStatus) result[1];
            long count = (long) result[2];

            int index = dateRange.indexOf(date);
            if (index == -1) continue; // Should not happen with the query logic

            switch (status) {
                case SCHEDULED:
                    chartData.getScheduled().set(index, count);
                    break;
                case DEPARTED:
                    chartData.getDeparted().set(index, count);
                    break;
                case ARRIVED:
                    chartData.getArrived().set(index, count);
                    break;
                case CANCELLED:
                    chartData.getCancelled().set(index, count);
                    break;
                case DELAYED:
                    chartData.getDelayed().set(index, count);
                    break;
            }
        }

        return chartData;
    }

    /**
     * Tüm uçuşların tiplerine göre dağılımını döndürür.
     * @return Uçuş tipi ve sayısını içeren DTO listesi.
     */
    public List<FlightTypeDistributionDto> getFlightTypeDistribution() {
        log.debug("Fetching flight type distribution");
        List<Object[]> results = flightRepository.countFlightsGroupedByType();

        return results.stream()
                .map(result -> new FlightTypeDistributionDto((FlightType) result[0], (long) result[1]))
                .collect(Collectors.toList());
    }

    private Flight createMainFlight(ConnectingFlightRequest request) {
        Flight mainFlight = new Flight();
        mainFlight.setFlightNumber(request.getMainFlightNumber());
        mainFlight.setAirlineId(request.getAirlineId());
        mainFlight.setAircraftId(request.getAircraftId());
        mainFlight.setType(request.getType());
        mainFlight.setPassengerCount(request.getPassengerCount());
        mainFlight.setCargoWeight(request.getCargoWeight());
        mainFlight.setNotes(request.getNotes());
        mainFlight.setActive(request.getActive());
        mainFlight.setIsConnectingFlight(true);
        mainFlight.setSegmentNumber(0); // Ana uçuş için 0

        // İlk ve son segment'ten origin/destination alınacak
        FlightSegmentRequest firstSegment = request.getSegments().get(0);
        FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
        mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
        mainFlight.setFlightDate(firstSegment.getScheduledDeparture().toLocalDate());
        mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
        mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());

        return mainFlight;
    }

    private Flight createSegmentFlight(Flight mainFlight, FlightSegmentRequest segmentRequest, int segmentNumber) {
        Flight segment = new Flight();
        segment.setFlightNumber(mainFlight.getFlightNumber() + "-" + segmentNumber); // TK123-1, TK123-2
        segment.setAirlineId(mainFlight.getAirlineId());
        segment.setAircraftId(mainFlight.getAircraftId());
        segment.setOriginAirportId(segmentRequest.getOriginAirportId());
        segment.setDestinationAirportId(segmentRequest.getDestinationAirportId());
        segment.setFlightDate(segmentRequest.getScheduledDeparture().toLocalDate());
        segment.setScheduledDeparture(segmentRequest.getScheduledDeparture());
        segment.setScheduledArrival(segmentRequest.getScheduledArrival());
        segment.setType(mainFlight.getType());
        segment.setPassengerCount(mainFlight.getPassengerCount());
        segment.setCargoWeight(mainFlight.getCargoWeight());
        segment.setGateNumber(segmentRequest.getGateNumber());
        segment.setNotes(segmentRequest.getNotes());
        segment.setActive(mainFlight.getActive());

        // Aktarmalı uçuş bilgileri
        segment.setParentFlightId(mainFlight.getId());
        segment.setSegmentNumber(segmentNumber);
        segment.setIsConnectingFlight(false); // Segment'ler kendileri connecting değil
        segment.setConnectionTimeMinutes(segmentRequest.getConnectionTimeMinutes());

        return segment;
    }

    private void updateMainFlightFromRequest(Flight mainFlight, ConnectingFlightRequest request) {
        mainFlight.setFlightNumber(request.getMainFlightNumber());
        mainFlight.setAirlineId(request.getAirlineId());
        mainFlight.setAircraftId(request.getAircraftId());
        mainFlight.setType(request.getType());
        mainFlight.setPassengerCount(request.getPassengerCount());
        mainFlight.setCargoWeight(request.getCargoWeight());
        mainFlight.setNotes(request.getNotes());
        mainFlight.setActive(request.getActive());

        // İlk ve son segment'ten origin/destination güncelle
        FlightSegmentRequest firstSegment = request.getSegments().get(0);
        FlightSegmentRequest lastSegment = request.getSegments().get(request.getSegments().size() - 1);

        mainFlight.setOriginAirportId(firstSegment.getOriginAirportId());
        mainFlight.setDestinationAirportId(lastSegment.getDestinationAirportId());
        mainFlight.setScheduledDeparture(firstSegment.getScheduledDeparture());
        mainFlight.setScheduledArrival(lastSegment.getScheduledArrival());
    }

    private String buildFullRoute(List<Flight> segments) {
        if (segments.isEmpty()) return "";

        StringBuilder route = new StringBuilder();

        // İlk segment'in origin'i ekle
        route.append(getAirportIataCodeFromId(segments.get(0).getOriginAirportId()));

        // Tüm segment'lerin destination'larını ekle
        for (Flight segment : segments) {
            route.append(" → ").append(getAirportIataCodeFromId(segment.getDestinationAirportId()));
        }

        return route.toString();
    }

    private String buildFullRouteFromResponses(List<FlightResponse> segments) {
        if (segments.isEmpty()) return "";

        StringBuilder route = new StringBuilder();

        // İlk segment'in origin'i ekle
        if (segments.get(0).getOriginAirport() != null) {
            route.append(segments.get(0).getOriginAirport().getIataCode());
        }

        // Tüm segment'lerin destination'larını ekle
        for (FlightResponse segment : segments) {
            if (segment.getDestinationAirport() != null) {
                route.append(" → ").append(segment.getDestinationAirport().getIataCode());
            }
        }

        return route.toString();
    }

    private String getAirportIataCodeFromId(Long airportId) {
        // ReferenceDataService kullanarak airport bilgisini al
        try {
            AirportCache airport = referenceDataService.getAirport(airportId);
            return airport.getIataCode();
        } catch (Exception e) {
            log.warn("Could not get airport IATA code for ID: {}", airportId);
            return "XXX"; // Fallback
        }
    }
}