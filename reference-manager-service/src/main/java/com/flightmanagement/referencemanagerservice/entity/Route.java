package com.flightmanagement.referencemanagerservice.entity;

import com.flightmanagement.referencemanagerservice.entity.enums.RouteType;
import com.flightmanagement.referencemanagerservice.entity.enums.RouteVisibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"segments"})
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String routeCode;          // "TK-001", "PC-002" gibi unique kod

    @Column(nullable = false, length = 200)
    private String routeName;          // "Istanbul-Ankara-Izmir Route"

    @Column
    private Integer distance;          // km (toplam mesafe)

    @Column
    private Integer estimatedFlightTime; // dakika (toplam süre)

    @Column
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RouteType routeType;       // DOMESTIC, INTERNATIONAL, CONTINENTAL

    // Yeni ownership alanları
    @Column(name = "created_by_user_id")
    private Long createdByUserId;      // Route'u oluşturan kullanıcı

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RouteVisibility visibility = RouteVisibility.PRIVATE;

    @Column(name = "airline_id")
    private Long airlineId;            // Hangi havayolu için

    // Aktarmalı route'lar için segment'ler
    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("segmentOrder")
    private List<RouteSegment> segments = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper methods
    public boolean isSimpleRoute() {
        return segments != null && segments.size() == 1;
    }

    public boolean isMultiSegmentRoute() {
        return segments != null && segments.size() > 1;
    }

    public void addSegment(RouteSegment segment) {
        if (segments == null) {
            segments = new ArrayList<>();
        }
        segment.setRoute(this);
        segments.add(segment);
    }

    public void removeSegment(RouteSegment segment) {
        if (segments != null) {
            segments.remove(segment);
            segment.setRoute(null);
        }
    }
}