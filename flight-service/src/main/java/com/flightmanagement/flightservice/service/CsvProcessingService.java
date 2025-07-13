package com.flightmanagement.flightservice.service;

import com.flightmanagement.flightservice.dto.request.FlightRequest;
import com.flightmanagement.flightservice.dto.response.CsvUploadResult;
import com.flightmanagement.flightservice.entity.enums.FlightStatus;
import com.flightmanagement.flightservice.entity.enums.FlightType;
import com.flightmanagement.flightservice.exception.BusinessException;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvProcessingService {

    private final FlightService flightService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public CsvUploadResult processCsvFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("CSV file is empty");
        }

        if (!file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            throw new BusinessException("File must be a CSV file");
        }

        CsvUploadResult result = new CsvUploadResult();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int totalRows = 0;

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> records = reader.readAll();

            if (records.isEmpty()) {
                throw new BusinessException("CSV file has no data");
            }

            // Skip header row
            for (int i = 1; i < records.size(); i++) {
                String[] row = records.get(i);
                totalRows++;

                try {
                    FlightRequest flightRequest = parseRowToFlightRequest(row, i + 1);
                    flightService.createFlight(flightRequest);
                    successCount++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

        } catch (IOException | CsvException e) {
            throw new BusinessException("Error reading CSV file: " + e.getMessage());
        }

        result.setTotalRows(totalRows);
        result.setSuccessCount(successCount);
        result.setFailureCount(totalRows - successCount);
        result.setErrors(errors);

        log.info("CSV processing completed: {} successful, {} failed out of {} total rows",
                successCount, totalRows - successCount, totalRows);

        return result;
    }

    private FlightRequest parseRowToFlightRequest(String[] row, int rowNumber) {
        if (row.length < 12) {
            throw new BusinessException("Insufficient columns. Expected at least 12 columns");
        }

        try {
            FlightRequest request = new FlightRequest();

            // CSV columns: flightNumber, airlineId, aircraftId, originAirportId, destinationAirportId,
            //              flightDate, scheduledDeparture, scheduledArrival, type, passengerCount, cargoWeight, notes

            request.setFlightNumber(parseString(row[0], "Flight Number"));
            request.setAirlineId(parseLong(row[1], "Airline ID"));
            request.setAircraftId(parseLong(row[2], "Aircraft ID"));
            request.setOriginAirportId(parseLong(row[3], "Origin Airport ID"));
            request.setDestinationAirportId(parseLong(row[4], "Destination Airport ID"));
            request.setFlightDate(parseDate(row[5], "Flight Date"));
            request.setScheduledDeparture(parseDateTime(row[6], "Scheduled Departure"));
            request.setScheduledArrival(parseDateTime(row[7], "Scheduled Arrival"));
            request.setType(parseFlightType(row[8], "Flight Type"));

            // Optional fields
            if (row.length > 9 && !row[9].trim().isEmpty()) {
                request.setPassengerCount(parseInteger(row[9], "Passenger Count"));
            }
            if (row.length > 10 && !row[10].trim().isEmpty()) {
                request.setCargoWeight(parseInteger(row[10], "Cargo Weight"));
            }
            if (row.length > 11 && !row[11].trim().isEmpty()) {
                request.setNotes(row[11].trim());
            }

            request.setStatus(FlightStatus.SCHEDULED);
            request.setActive(true);

            return request;

        } catch (Exception e) {
            throw new BusinessException("Row " + rowNumber + " parsing error: " + e.getMessage());
        }
    }

    private String parseString(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException(fieldName + " cannot be empty");
        }
        return value.trim();
    }

    private Long parseLong(String value, String fieldName) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            throw new BusinessException(fieldName + " must be a valid number: " + value);
        }
    }

    private Integer parseInteger(String value, String fieldName) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new BusinessException(fieldName + " must be a valid integer: " + value);
        }
    }

    private LocalDate parseDate(String value, String fieldName) {
        try {
            return LocalDate.parse(value.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new BusinessException(fieldName + " must be in format YYYY-MM-DD: " + value);
        }
    }

    private LocalDateTime parseDateTime(String value, String fieldName) {
        try {
            return LocalDateTime.parse(value.trim(), DATETIME_FORMATTER);
        } catch (DateTimeParseException e) {
            // ISO format'ı da dene
            try {
                return LocalDateTime.parse(value.trim());
            } catch (DateTimeParseException e2) {
                throw new BusinessException(fieldName + " must be in format YYYY-MM-DD HH:MM or ISO format: " + value);
            }
        }
    }

    private FlightType parseFlightType(String value, String fieldName) {
        try {
            return FlightType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(fieldName + " must be one of: PASSENGER, CARGO, POSITIONING, FERRY, TRAINING: " + value);
        }
    }
}