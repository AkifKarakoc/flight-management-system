package com.flightmanagement.flightservice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.flightmanagement.flightservice.dto.cache.AircraftCache;
import com.flightmanagement.flightservice.dto.cache.AirlineCache;
import com.flightmanagement.flightservice.dto.cache.AirportCache;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FlightResponse {
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
    private Integer passengerCount;
    private Integer cargoWeight;
    private String notes;
    private String gateNumber;
    private Integer delayMinutes;
    private String delayReason;
    private Boolean active;
    private Integer flightDuration;
    private Boolean isDelayed;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime updatedAt;
}