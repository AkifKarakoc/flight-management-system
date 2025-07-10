package com.flightmanagement.referencemanagerservice.entity;

import com.flightmanagement.referencemanagerservice.entity.enums.GateType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "gates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Gate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String gateNumber;        // A12, B3

    @Column
    private String terminal;          // T1, T2

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "airport_id")
    private Airport airport;

    @Enumerated(EnumType.STRING)
    private GateType gateType;        // DOMESTIC, INTERNATIONAL

    @Column
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}