package com.flightmanagement.referencemanagerservice.entity;

import com.flightmanagement.referencemanagerservice.entity.enums.SeatClass;
import com.flightmanagement.referencemanagerservice.entity.enums.SeatType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "aircraft_seats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AircraftSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aircraft_configuration_id")
    private AircraftSeatConfiguration aircraftConfiguration;

    @Column(nullable = false)
    private String seatNumber;          // 12A, 23F

    @Column
    private Integer rowNumber;          // 12, 23

    @Column
    private String seatLetter;          // A, B, C, D, E, F

    @Enumerated(EnumType.STRING)
    private SeatClass seatClass;        // ECONOMY, BUSINESS, FIRST

    @Enumerated(EnumType.STRING)
    private SeatType seatType;          // WINDOW, AISLE, MIDDLE

    @Column
    private Boolean hasExtraLegroom = false;    // Ekstra bacak alanı

    @Column
    private Boolean isEmergencyExit = false;    // Acil çıkış kapısı

    @Column
    private Boolean isBlocked = false;          // Bloke koltuk

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}