package com.flightmanagement.flightservice.repository;

import com.flightmanagement.flightservice.entity.FlightConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlightConnectionRepository extends JpaRepository<FlightConnection, Long> {

    // Ana uçuş için tüm segment'leri getir
    List<FlightConnection> findByMainFlightIdOrderBySegmentOrder(Long mainFlightId);

    // Belirli bir segment uçuşunu getir
    List<FlightConnection> findBySegmentFlightId(Long segmentFlightId);

    // Ana uçuş silme kontrolü
    boolean existsByMainFlightId(Long mainFlightId);
    boolean existsBySegmentFlightId(Long segmentFlightId);

    // Ana uçuş için segment sayısı
    @Query("SELECT COUNT(fc) FROM FlightConnection fc WHERE fc.mainFlightId = :mainFlightId")
    Long countSegmentsByMainFlightId(@Param("mainFlightId") Long mainFlightId);

    // Segment sırası kontrolü
    @Query("SELECT fc FROM FlightConnection fc WHERE fc.mainFlightId = :mainFlightId AND fc.segmentOrder = :segmentOrder")
    FlightConnection findByMainFlightIdAndSegmentOrder(@Param("mainFlightId") Long mainFlightId, @Param("segmentOrder") Integer segmentOrder);

    // Ana uçuş için segment detayları
    @Query("SELECT fc.segmentFlight FROM FlightConnection fc WHERE fc.mainFlightId = :mainFlightId ORDER BY fc.segmentOrder")
    List<Object> findSegmentFlightsByMainFlightId(@Param("mainFlightId") Long mainFlightId);
}