package com.flightmanagement.flightservice.entity;

import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String flightNumber;        // TK123, PC456

    @Column(nullable = false)
    private Long airlineId;             // Reference Manager'dan

    @Column(nullable = false)
    private Long aircraftId;            // Reference Manager'dan

    @Column(nullable = false)
    private Long originAirportId;       // Reference Manager'dan

    @Column(nullable = false)
    private Long destinationAirportId;  // Reference Manager'dan

    @Column(nullable = false)
    private LocalDate flightDate;       // Uçuş tarihi

    @Column(nullable = false)
    private LocalDateTime scheduledDeparture;  // Planlanan kalkış

    @Column(nullable = false)
    private LocalDateTime scheduledArrival;    // Planlanan varış

    @Column
    private LocalDateTime actualDeparture;     // Gerçek kalkış

    @Column
    private LocalDateTime actualArrival;       // Gerçek varış

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status = FlightStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightType type = FlightType.PASSENGER;

    @Column
    private Integer passengerCount;     // Yolcu sayısı

    @Column
    private Integer cargoWeight;        // Kargo ağırlığı (kg)

    @Column(length = 500)
    private String notes;               // Notlar

    @Column
    private String gateNumber;          // Gate numarası

    @Column
    private Integer delayMinutes;       // Gecikme dakikası

    @Column(length = 200)
    private String delayReason;         // Gecikme nedeni

    @Column
    private Boolean active = true;      // Aktif/Pasif

    @Column(name = "parent_flight_id")
    private Long parentFlightId;

    @Column(name = "segment_number", nullable = false)
    private Integer segmentNumber = 1;

    @Column(name = "is_connecting_flight", nullable = false)
    private Boolean isConnectingFlight = false;

    @Column(name = "connection_time_minutes")
    private Integer connectionTimeMinutes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;



    // Helper methods
    public boolean isDelayed() {
        return delayMinutes != null && delayMinutes > 0;
    }

    public boolean isDeparted() {
        return status == FlightStatus.DEPARTED ||
                status == FlightStatus.ARRIVED;
    }

    public boolean isCompleted() {
        return status == FlightStatus.ARRIVED;
    }

    public String getFullFlightNumber() {
        // Airline kodunu ekleyebiliriz ileride
        return flightNumber;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_flight_id", insertable = false, updatable = false)
    private Flight parentFlight;

    @OneToMany(mappedBy = "parentFlight", fetch = FetchType.LAZY)
    private List<Flight> connectingFlights = new ArrayList<>();

    @OneToMany(mappedBy = "mainFlight", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<FlightConnection> flightConnections = new ArrayList<>();

    // Uçuş süresi hesaplama (dakika)
    public Integer getFlightDuration() {
        if (actualDeparture != null && actualArrival != null) {
            return (int) java.time.Duration.between(actualDeparture, actualArrival).toMinutes();
        } else if (scheduledDeparture != null && scheduledArrival != null) {
            return (int) java.time.Duration.between(scheduledDeparture, scheduledArrival).toMinutes();
        }
        return null;
    }
}