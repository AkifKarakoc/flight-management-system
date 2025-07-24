package com.flightmanagement.flightservice.dto.response.stats;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class FlightChartDataDto {
    private List<String> dates = new ArrayList<>();
    private List<Long> scheduled = new ArrayList<>();
    private List<Long> departed = new ArrayList<>();
    private List<Long> arrived = new ArrayList<>();
    private List<Long> cancelled = new ArrayList<>();
    private List<Long> delayed = new ArrayList<>();

    public FlightChartDataDto(LocalDate currentDate, long count) {
    }
}