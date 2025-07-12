package com.flightmanagement.referencemanagerservice.validator;

import com.flightmanagement.referencemanagerservice.dto.response.DeletionCheckResult;
import com.flightmanagement.referencemanagerservice.exception.BusinessException;
import com.flightmanagement.referencemanagerservice.repository.AircraftSeatConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AircraftDeletionValidator {

    private final AircraftSeatConfigurationRepository seatConfigurationRepository;

    public void validateDeletion(Long aircraftId) throws BusinessException {
        DeletionCheckResult result = checkDependencies(aircraftId);

        if (!result.isCanDelete()) {
            throw new BusinessException(
                    String.format("Cannot delete aircraft: %s", result.getReason())
            );
        }
    }

    public DeletionCheckResult checkDependencies(Long aircraftId) {
        List<String> blockers = new ArrayList<>();
        Map<String, Integer> dependentEntities = new HashMap<>();

        // Seat configuration kontrolü
        boolean hasSeatConfig = seatConfigurationRepository.findByAircraftId(aircraftId).isPresent();
        if (hasSeatConfig) {
            blockers.add("1 seat configuration exists");
            dependentEntities.put("seatConfigurations", 1);
        }

        // Future: Flight kontrolü
        // long flightCount = flightRepository.countByAircraftId(aircraftId);
        // if (flightCount > 0) {
        //     blockers.add(String.format("%d active flight(s)", flightCount));
        //     dependentEntities.put("flights", (int) flightCount);
        // }

        return DeletionCheckResult.builder()
                .canDelete(blockers.isEmpty())
                .reason(blockers.isEmpty() ? "No dependencies found" : String.join(", ", blockers))
                .dependentEntities(dependentEntities)
                .build();
    }
}