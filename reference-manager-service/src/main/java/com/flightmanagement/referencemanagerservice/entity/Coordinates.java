package com.flightmanagement.referencemanagerservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coordinates {
    @Column
    private Double latitude;

    @Column
    private Double longitude;
}