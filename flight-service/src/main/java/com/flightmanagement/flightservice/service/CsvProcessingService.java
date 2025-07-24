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

            // Validate headers
            if (records.size() > 0) {
                validateCsvHeaders(records.get(0));
            }

            // Skip header row
            for (int i = 1; i < records.size(); i++) {
                String[] row = records.get(i);
                totalRows++;

                try {
                    FlightRequest flightRequest = parseRowToFlightRequest(row, i + 1);
                    flightService.createFlight(flightRequest);
                    successCount++;
                    log.debug("Successfully processed row {}: {}", i + 1, flightRequest.getFlightNumber());
                } catch (Exception e) {
                    String errorMsg = "Row " + (i + 1) + ": " + e.getMessage();
                    errors.add(errorMsg);
                    log.warn("Failed to process row {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (IOException | CsvException e) {
            throw new BusinessException("Error reading CSV file: " + e.getMessage());
        }

        result.setTotalRows(totalRows);
        result.setSuccessCount(successCount);
        result.setFailureCount(totalRows - successCount);
        result.setErrors(errors);

        // Success/failure messages
        if (result.isCompleteSuccess()) {
            result.setMessage("All flights processed successfully");
        } else if (result.isPartialSuccess()) {
            result.setMessage("Partially successful: " + result.getSummary());
        } else {
            result.setMessage("All flights failed to process");
        }

        log.info("CSV processing completed: {} successful, {} failed out of {} total rows",
                successCount, totalRows - successCount, totalRows);

        return result;
    }

    private void validateCsvHeaders(String[] headers) {
        List<String> requiredHeaders = List.of(
                "flightNumber", "airlineId", "aircraftId", "routeId",
                "flightDate", "scheduledDeparture", "scheduledArrival", "type"
        );

        List<String> missingHeaders = new ArrayList<>();
        for (String required : requiredHeaders) {
            boolean found = false;
            for (String header : headers) {
                if (header.trim().equalsIgnoreCase(required)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                missingHeaders.add(required);
            }
        }

        if (!missingHeaders.isEmpty()) {
            throw new BusinessException("Missing required CSV headers: " + String.join(", ", missingHeaders));
        }
    }

    private FlightRequest parseRowToFlightRequest(String[] row, int rowNumber) {
        if (row.length < 8) {
            throw new BusinessException("Insufficient columns. Expected at least 8 columns");
        }

        try {
            FlightRequest request = new FlightRequest();

            // Required fields - Route bazlı yeni sistem
            // CSV columns: flightNumber, airlineId, aircraftId, routeId, flightDate,
            //              scheduledDeparture, scheduledArrival, type, passengerCount, cargoWeight, notes

            request.setFlightNumber(parseString(row[0], "Flight Number"));
            request.setAirlineId(parseLong(row[1], "Airline ID"));
            request.setAircraftId(parseLong(row[2], "Aircraft ID"));
            request.setRouteId(parseLong(row[3], "Route ID"));  // YENİ: Route ID
            request.setFlightDate(parseDate(row[4], "Flight Date"));
            request.setScheduledDeparture(parseDateTime(row[5], "Scheduled Departure"));
            request.setScheduledArrival(parseDateTime(row[6], "Scheduled Arrival"));
            request.setType(parseFlightType(row[7], "Flight Type"));

            // Optional fields
            if (row.length > 8 && !row[8].trim().isEmpty()) {
                request.setPassengerCount(parseInteger(row[8], "Passenger Count"));
            }
            if (row.length > 9 && !row[9].trim().isEmpty()) {
                request.setCargoWeight(parseInteger(row[9], "Cargo Weight"));
            }
            if (row.length > 10 && !row[10].trim().isEmpty()) {
                request.setNotes(row[10].trim());
            }
            if (row.length > 11 && !row[11].trim().isEmpty()) {
                request.setGateNumber(row[11].trim());
            }

            // Default values
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

    public String generateCsvTemplate() {
        StringBuilder template = new StringBuilder();
        template.append("flightNumber,airlineId,aircraftId,routeId,flightDate,scheduledDeparture,scheduledArrival,type,passengerCount,cargoWeight,notes,gateNumber\n");
        template.append("TK100,1,1,1,2025-07-20,2025-07-20 08:00,2025-07-20 09:30,PASSENGER,180,,Morning flight Istanbul-Ankara,A12\n");
        template.append("TK200,1,2,2,2025-07-20,2025-07-20 14:00,2025-07-20 16:30,PASSENGER,165,,Afternoon flight Ankara-Izmir,B05\n");
        template.append("CG100,1,1,3,2025-07-20,2025-07-20 20:00,2025-07-20 21:30,CARGO,,8000,Night cargo flight,C01\n");

        return template.toString();
    }

    public List<String> validateCsvContent(MultipartFile file) {
        List<String> validationErrors = new ArrayList<>();

        if (file.isEmpty()) {
            validationErrors.add("CSV file is empty");
            return validationErrors;
        }

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> records = reader.readAll();

            if (records.isEmpty()) {
                validationErrors.add("CSV file has no data");
                return validationErrors;
            }

            // Header validation
            try {
                validateCsvHeaders(records.get(0));
            } catch (BusinessException e) {
                validationErrors.add("Header validation failed: " + e.getMessage());
            }

            // Content validation (without saving)
            for (int i = 1; i < records.size() && i <= 100; i++) { // Limit to first 100 rows for validation
                String[] row = records.get(i);
                try {
                    parseRowToFlightRequest(row, i + 1);
                } catch (Exception e) {
                    validationErrors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            if (records.size() > 101) {
                validationErrors.add("Note: Only first 100 rows were validated. Total rows: " + (records.size() - 1));
            }

        } catch (IOException | CsvException e) {
            validationErrors.add("Error reading CSV file: " + e.getMessage());
        }

        return validationErrors;
    }
}