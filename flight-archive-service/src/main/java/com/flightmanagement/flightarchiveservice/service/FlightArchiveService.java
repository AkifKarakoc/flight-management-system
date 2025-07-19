package com.flightmanagement.flightarchiveservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flightmanagement.flightarchiveservice.dto.response.FlightArchiveResponse;
import com.flightmanagement.flightarchiveservice.dto.response.FlightStatsResponse;
import com.flightmanagement.flightarchiveservice.entity.FlightArchive;
import com.flightmanagement.flightarchiveservice.event.FlightEvent;
import com.flightmanagement.flightarchiveservice.mapper.FlightArchiveMapper;
import com.flightmanagement.flightarchiveservice.repository.FlightArchiveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FlightArchiveService {

    private final FlightArchiveRepository flightArchiveRepository;
    private final FlightArchiveMapper flightArchiveMapper;
    private final ObjectMapper objectMapper;

    public FlightArchive archiveFlightEvent(FlightEvent event) {
        log.debug("Archiving flight event: {} for flight: {}", event.getEventType(), event.getEntityId());

        // Duplicate check
        if (flightArchiveRepository.existsByEventId(event.getEventId())) {
            log.warn("Event already archived: {}", event.getEventId());
            return null;
        }

        try {
            FlightArchive archive = mapEventToArchive(event);
            archive = flightArchiveRepository.save(archive);
            log.info("Flight event archived successfully: {}", event.getEventId());
            return archive;
        } catch (Exception e) {
            log.error("Failed to archive flight event: {}", event.getEventId(), e);
            throw new RuntimeException("Failed to archive flight event", e);
        }
    }

    public List<FlightArchiveResponse> getFlightHistory(String flightNumber, LocalDate date) {
        log.debug("Getting flight history for: {} on {}", flightNumber, date);
        return flightArchiveRepository.findByFlightNumberAndFlightDate(flightNumber, date)
                .stream()
                .map(flightArchiveMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<FlightArchiveResponse> getFlightsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        log.debug("Getting flights between {} and {}", startDate, endDate);
        return flightArchiveRepository.findByFlightDateBetween(startDate, endDate, pageable)
                .map(flightArchiveMapper::toResponse);
    }

    public List<FlightArchiveResponse> getFlightsByAirline(Long airlineId, LocalDate startDate, LocalDate endDate) {
        log.debug("Getting flights for airline: {} between {} and {}", airlineId, startDate, endDate);
        return flightArchiveRepository.findByAirlineIdAndFlightDateBetween(airlineId, startDate, endDate)
                .stream()
                .map(flightArchiveMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<FlightArchiveResponse> getDelayedFlights(Integer minDelayMinutes, LocalDate date) {
        log.debug("Getting flights delayed by more than {} minutes on {}", minDelayMinutes, date);
        return flightArchiveRepository.findDelayedFlightsByDate(minDelayMinutes, date)
                .stream()
                .map(flightArchiveMapper::toResponse)
                .collect(Collectors.toList());
    }

    public FlightStatsResponse getFlightStatistics(LocalDate date) {
        log.debug("Calculating flight statistics for: {}", date);

        FlightStatsResponse stats = new FlightStatsResponse();
        stats.setDate(date);
        stats.setTotalFlights(flightArchiveRepository.countByFlightDate(date));
        stats.setArrivedFlights(flightArchiveRepository.countByStatusAndDate("ARRIVED", date));
        stats.setDepartedFlights(flightArchiveRepository.countByStatusAndDate("DEPARTED", date));
        stats.setCancelledFlights(flightArchiveRepository.countByStatusAndDate("CANCELLED", date));
        stats.setDelayedFlights(flightArchiveRepository.countDelayedFlightsByDate(date));

        Double avgDelay = flightArchiveRepository.getAverageDelayByDate(date);
        stats.setAverageDelayMinutes(avgDelay != null ? avgDelay : 0.0);

        return stats;
    }

    public List<FlightArchiveResponse> getRecentEvents(int limit) {
        log.debug("Getting {} most recent flight events", limit);
        return flightArchiveRepository.findTop10ByOrderByEventTimeDesc()
                .stream()
                .limit(limit)
                .map(flightArchiveMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cleanupOldRecords(int retentionDays) {
        log.info("Cleaning up flight archives older than {} days", retentionDays);
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        flightArchiveRepository.deleteArchivedBefore(cutoffDate);
        log.info("Cleanup completed for records before {}", cutoffDate);
    }

    @SuppressWarnings("unchecked")
    private FlightArchive mapEventToArchive(FlightEvent event) throws Exception {
        FlightArchive archive = new FlightArchive();

        // Event metadata
        archive.setEventId(event.getEventId());
        archive.setEventType(event.getEventType());
        archive.setEventTime(event.getEventTime());
        archive.setEntityType(event.getEntityType());
        archive.setEntityId(event.getEntityId());
        archive.setVersion(event.getVersion());

        // Store complete payload as JSON
        archive.setPayload(objectMapper.writeValueAsString(event.getPayload()));

        // Extract flight data from payload
        if (event.getPayload() instanceof Map) {
            Map<String, Object> payload = (Map<String, Object>) event.getPayload();

            archive.setFlightId(getLongValue(payload, "id"));
            archive.setFlightNumber(getStringValue(payload, "flightNumber"));

            // FIX: Array formatındaki date'i handle et
            archive.setFlightDate(parseFlightDate(payload.get("flightDate")));
            archive.setScheduledDeparture(parseFlightDateTime(payload.get("scheduledDeparture")));
            archive.setScheduledArrival(parseFlightDateTime(payload.get("scheduledArrival")));
            archive.setActualDeparture(parseFlightDateTime(payload.get("actualDeparture")));
            archive.setActualArrival(parseFlightDateTime(payload.get("actualArrival")));

            archive.setStatus(getStringValue(payload, "status"));
            archive.setFlightType(getStringValue(payload, "type"));
            archive.setPassengerCount(getIntegerValue(payload, "passengerCount"));
            archive.setCargoWeight(getIntegerValue(payload, "cargoWeight"));
            archive.setGateNumber(getStringValue(payload, "gateNumber"));
            archive.setDelayMinutes(getIntegerValue(payload, "delayMinutes"));
            archive.setDelayReason(getStringValue(payload, "delayReason"));
            archive.setActive(getBooleanValue(payload, "active"));

            // Extract airline info
            Map<String, Object> airline = (Map<String, Object>) payload.get("airline");
            if (airline != null) {
                archive.setAirlineId(getLongValue(airline, "id"));
                archive.setAirlineName(getStringValue(airline, "name"));
                archive.setAirlineIataCode(getStringValue(airline, "iataCode"));
            }

            // Extract aircraft info
            Map<String, Object> aircraft = (Map<String, Object>) payload.get("aircraft");
            if (aircraft != null) {
                archive.setAircraftId(getLongValue(aircraft, "id"));
                archive.setAircraftRegistration(getStringValue(aircraft, "registrationNumber"));
                archive.setAircraftType(getStringValue(aircraft, "aircraftType"));
            }

            // Extract origin airport info
            Map<String, Object> originAirport = (Map<String, Object>) payload.get("originAirport");
            if (originAirport != null) {
                archive.setOriginAirportId(getLongValue(originAirport, "id"));
                archive.setOriginAirportIata(getStringValue(originAirport, "iataCode"));
                archive.setOriginAirportName(getStringValue(originAirport, "name"));
            }

            // Extract destination airport info
            Map<String, Object> destinationAirport = (Map<String, Object>) payload.get("destinationAirport");
            if (destinationAirport != null) {
                archive.setDestinationAirportId(getLongValue(destinationAirport, "id"));
                archive.setDestinationAirportIata(getStringValue(destinationAirport, "iataCode"));
                archive.setDestinationAirportName(getStringValue(destinationAirport, "name"));
            }
        }

        archive.setArchivedAt(LocalDateTime.now());
        return archive;
    }

    private LocalDate parseFlightDate(Object dateObj) {
        if (dateObj == null) return null;

        try {
            if (dateObj instanceof List) {
                List<Integer> dateList = (List<Integer>) dateObj;
                if (dateList.size() >= 3) {
                    return LocalDate.of(dateList.get(0), dateList.get(1), dateList.get(2));
                }
            } else if (dateObj instanceof String) {
                return LocalDate.parse((String) dateObj);
            }
        } catch (Exception e) {
            log.warn("Failed to parse flight date: {}", dateObj, e);
        }

        return null;
    }

    private LocalDateTime parseFlightDateTime(Object dateTimeObj) {
        if (dateTimeObj == null) return null;

        try {
            if (dateTimeObj instanceof List) {
                List<Integer> dateTimeList = (List<Integer>) dateTimeObj;
                if (dateTimeList.size() >= 5) {
                    return LocalDateTime.of(
                            dateTimeList.get(0), // year
                            dateTimeList.get(1), // month
                            dateTimeList.get(2), // day
                            dateTimeList.get(3), // hour
                            dateTimeList.get(4)  // minute
                    );
                } else if (dateTimeList.size() >= 3) {
                    return LocalDate.of(dateTimeList.get(0), dateTimeList.get(1), dateTimeList.get(2)).atStartOfDay();
                }
            } else if (dateTimeObj instanceof String) {
                return LocalDateTime.parse((String) dateTimeObj);
            }
        } catch (Exception e) {
            log.warn("Failed to parse flight datetime: {}", dateTimeObj, e);
        }

        return null;
    }

    // Helper methods for safe type conversion
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Long getLongValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }

    private Integer getIntegerValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    private Boolean getBooleanValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return null;
    }

    private LocalDate getLocalDateValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value != null) {
            try {
                return LocalDate.parse(value.toString());
            } catch (Exception e) {
                log.warn("Failed to parse LocalDate: {}", value);
            }
        }
        return null;
    }

    private LocalDateTime getLocalDateTimeValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value != null) {
            try {
                return LocalDateTime.parse(value.toString());
            } catch (Exception e) {
                log.warn("Failed to parse LocalDateTime: {}", value);
            }
        }
        return null;
    }
}