package com.flightmanagement.flightservice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FlightConnectionResponse {
    private Long id;
    private Long mainFlightId;
    private Long segmentFlightId;
    private Integer segmentOrder;
    private Integer connectionTimeMinutes;

    // Mapper'da kullanılan field'lar
    private String mainFlightNumber;
    private String segmentFlightNumber;
    private String originAirportCode;
    private String destinationAirportCode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    // İlişkili uçuş detayları
    private FlightResponse segmentFlight;
}