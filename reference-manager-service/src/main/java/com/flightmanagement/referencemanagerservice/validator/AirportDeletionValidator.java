package com.flightmanagement.referencemanagerservice.validator;

import com.flightmanagement.referencemanagerservice.dto.response.DeletionCheckResult;
import com.flightmanagement.referencemanagerservice.exception.BusinessException;
import com.flightmanagement.referencemanagerservice.repository.CrewMemberRepository;
import com.flightmanagement.referencemanagerservice.repository.GateRepository;
import com.flightmanagement.referencemanagerservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AirportDeletionValidator {

    private final RouteRepository routeRepository;
    private final CrewMemberRepository crewMemberRepository;
    private final GateRepository gateRepository;

    public void validateDeletion(Long airportId) throws BusinessException {
        DeletionCheckResult result = checkDependencies(airportId);

        if (!result.isCanDelete()) {
            throw new BusinessException(
                    String.format("Cannot delete airport: %s", result.getReason())
            );
        }
    }

    public DeletionCheckResult checkDependencies(Long airportId) {
        List<String> blockers = new ArrayList<>();
        Map<String, Integer> dependentEntities = new HashMap<>();

        // Route kontrolü (origin veya destination olarak kullanılıyor mu?)
        long originRouteCount = routeRepository.countByOriginAirportId(airportId);
        long destRouteCount = routeRepository.countByDestinationAirportId(airportId);
        long totalRoutes = originRouteCount + destRouteCount;

        if (totalRoutes > 0) {
            blockers.add(String.format("%d active route(s)", totalRoutes));
            dependentEntities.put("routes", (int) totalRoutes);
        }

        // Crew base airport kontrolü
        long basedCrewCount = crewMemberRepository.countByBaseAirportId(airportId);
        if (basedCrewCount > 0) {
            blockers.add(String.format("%d crew member(s) based here", basedCrewCount));
            dependentEntities.put("crewMembers", (int) basedCrewCount);
        }

        // Gate kontrolü
        long gateCount = gateRepository.countByAirportId(airportId);
        if (gateCount > 0) {
            blockers.add(String.format("%d active gate(s)", gateCount));
            dependentEntities.put("gates", (int) gateCount);
        }

        return DeletionCheckResult.builder()
                .canDelete(blockers.isEmpty())
                .reason(blockers.isEmpty() ? "No dependencies found" : String.join(", ", blockers))
                .dependentEntities(dependentEntities)
                .build();
    }
}