package com.flightmanagement.flightservice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlightResponse {

    // Temel uçuş bilgileri
    private Long id;
    private String flightNumber;
    private AirlineCache airline;
    private AircraftCache aircraft;
    private AirportCache originAirport;
    private AirportCache destinationAirport;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate flightDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledDeparture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime scheduledArrival;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualDeparture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime actualArrival;

    private FlightStatus status;
    private FlightType type;

    // Operasyonel bilgiler
    private Integer passengerCount;
    private Integer cargoWeight;
    private String notes;
    private String gateNumber;
    private Integer delayMinutes;
    private String delayReason;
    private Boolean active;

    // Hesaplanan alanlar
    private Integer flightDuration;
    private Boolean isDelayed;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime updatedAt;

    // Aktarmalı uçuş alanları
    private Long parentFlightId;
    private Integer segmentNumber;
    private Boolean isConnectingFlight;
    private Integer connectionTimeMinutes;

    // İlişkili uçuşlar ve rota bilgileri
    private List<FlightResponse> connectingFlights;
    private Integer totalSegments;
    private String fullRoute; // "IST → FRA → JFK" formatında
    private Integer totalFlightTime; // Toplam uçuş süresi (dakika)
    private Integer totalConnectionTime; // Toplam bağlantı süresi (dakika)

    // Aktarmalı uçuş durum bilgileri
    private String connectionStatus; // "ON_TIME", "DELAYED", "RISK" gibi
    private Boolean isLastSegment;
    private Boolean isFirstSegment;

    // Helper metodlar
    public boolean isConnecting() {
        return Boolean.TRUE.equals(isConnectingFlight);
    }

    public boolean hasSegments() {
        return connectingFlights != null && !connectingFlights.isEmpty();
    }

    public boolean isMainFlight() {
        return parentFlightId == null && Boolean.TRUE.equals(isConnectingFlight);
    }

    public boolean isSegmentFlight() {
        return parentFlightId != null;
    }

    public int getSegmentCount() {
        return totalSegments != null ? totalSegments : (hasSegments() ? connectingFlights.size() : 0);
    }

    public String getDisplayFlightNumber() {
        if (isConnecting() && segmentNumber != null && segmentNumber > 0) {
            return flightNumber + " (Segment " + segmentNumber + ")";
        }
        return flightNumber;
    }

    public String getRouteDisplay() {
        if (fullRoute != null && !fullRoute.isEmpty()) {
            return fullRoute;
        }

        // Fallback: origin → destination
        if (originAirport != null && destinationAirport != null) {
            return originAirport.getIataCode() + " → " + destinationAirport.getIataCode();
        }

        return "";
    }

    public LocalDateTime getEstimatedArrival() {
        // Gerçek varış varsa onu döndür
        if (actualArrival != null) {
            return actualArrival;
        }

        // Gecikme varsa planlanan varışa ekle
        if (scheduledArrival != null && delayMinutes != null && delayMinutes > 0) {
            return scheduledArrival.plusMinutes(delayMinutes);
        }

        return scheduledArrival;
    }

    public LocalDateTime getEstimatedDeparture() {
        // Gerçek kalkış varsa onu döndür
        if (actualDeparture != null) {
            return actualDeparture;
        }

        // Gecikme varsa planlanan kalkışa ekle
        if (scheduledDeparture != null && delayMinutes != null && delayMinutes > 0) {
            return scheduledDeparture.plusMinutes(delayMinutes);
        }

        return scheduledDeparture;
    }

    public boolean isInProgress() {
        return status == FlightStatus.BOARDING ||
                status == FlightStatus.DEPARTED;
    }

    public boolean isCompleted() {
        return status == FlightStatus.ARRIVED;
    }

    public boolean isCancelled() {
        return status == FlightStatus.CANCELLED;
    }

    public String getStatusDisplay() {
        if (status == null) return "Unknown";

        switch (status) {
            case SCHEDULED:
                return isDelayed != null && isDelayed ? "Delayed" : "On Time";
            case BOARDING:
                return "Boarding";
            case DEPARTED:
                return "Departed";
            case ARRIVED:
                return "Arrived";
            case DELAYED:
                return "Delayed";
            case CANCELLED:
                return "Cancelled";
            default:
                return status.name();
        }
    }
}