package com.flightmanagement.referencemanagerservice.repository;

import com.flightmanagement.referencemanagerservice.entity.CrewMember;
import com.flightmanagement.referencemanagerservice.entity.enums.CrewType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CrewMemberRepository extends JpaRepository<CrewMember, Long> {
    Optional<CrewMember> findByEmployeeNumber(String employeeNumber);
    List<CrewMember> findByAirlineId(Long airlineId);
    List<CrewMember> findByBaseAirportId(Long baseAirportId);
    List<CrewMember> findByCrewType(CrewType crewType);
    boolean existsByEmployeeNumber(String employeeNumber);
}