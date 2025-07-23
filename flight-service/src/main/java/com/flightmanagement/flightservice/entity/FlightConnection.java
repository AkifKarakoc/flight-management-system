package com.flightmanagement.flightservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "flight_connections")
@Data
@EqualsAndHashCode(exclude = {"mainFlight", "segmentFlight"})
@ToString(exclude = {"mainFlight", "segmentFlight"})
public class FlightConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "main_flight_id", nullable = false)
    private Long mainFlightId;

    @Column(name = "segment_flight_id", nullable = false)
    private Long segmentFlightId;

    @Column(name = "segment_order", nullable = false)
    private Integer segmentOrder;

    @Column(name = "connection_time_minutes")
    private Integer connectionTimeMinutes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "main_flight_id", insertable = false, updatable = false)
    private Flight mainFlight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_flight_id", insertable = false, updatable = false)
    private Flight segmentFlight;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}