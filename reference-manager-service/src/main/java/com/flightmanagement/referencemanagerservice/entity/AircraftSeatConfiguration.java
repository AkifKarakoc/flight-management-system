package com.flightmanagement.referencemanagerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "aircraft_seat_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AircraftSeatConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aircraft_id", nullable = false)
    private Aircraft aircraft;

    @Column
    private Integer totalSeats;

    @Column
    private Integer totalRows;

    @Column
    private Integer seatsPerRow;

    @Column
    private Integer economySeats;

    @Column
    private Integer businessSeats;

    @Column
    private Integer firstClassSeats;

    @Column(columnDefinition = "TEXT")
    private String seatLayout;          // JSON format seat map

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "aircraftConfiguration", cascade = CascadeType.ALL)
    private List<AircraftSeat> seats = new ArrayList<>();
}