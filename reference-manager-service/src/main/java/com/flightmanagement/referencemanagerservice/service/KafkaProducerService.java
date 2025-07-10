package com.flightmanagement.referencemanagerservice.service;

import com.flightmanagement.referencemanagerservice.entity.*;
import com.flightmanagement.referencemanagerservice.event.ReferenceEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, ReferenceEvent> kafkaTemplate;
    private static final String TOPIC = "reference.events";

    public void sendAirlineEvent(String eventType, Airline airline) {
        ReferenceEvent event = ReferenceEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .entityType("AIRLINE")
                .entityId(airline.getId().toString())
                .payload(airline)
                .version("1.0")
                .build();

        log.info("Sending airline event: {} for airline: {}", eventType, airline.getIataCode());
        kafkaTemplate.send(TOPIC, event);
    }

    public void sendAirportEvent(String eventType, Airport airport) {
        ReferenceEvent event = ReferenceEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .entityType("AIRPORT")
                .entityId(airport.getId().toString())
                .payload(airport)
                .version("1.0")
                .build();

        log.info("Sending airport event: {} for airport: {}", eventType, airport.getIataCode());
        kafkaTemplate.send(TOPIC, event);
    }

    public void sendAircraftEvent(String eventType, Aircraft aircraft) {
        ReferenceEvent event = ReferenceEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .entityType("AIRCRAFT")
                .entityId(aircraft.getId().toString())
                .payload(aircraft)
                .version("1.0")
                .build();

        log.info("Sending aircraft event: {} for aircraft: {}", eventType, aircraft.getRegistrationNumber());
        kafkaTemplate.send(TOPIC, event);
    }

    public void sendRouteEvent(String eventType, Route route) {
        ReferenceEvent event = ReferenceEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .entityType("ROUTE")
                .entityId(route.getId().toString())
                .payload(route)
                .version("1.0")
                .build();

        log.info("Sending route event: {} for route: {}", eventType, route.getId());
        kafkaTemplate.send(TOPIC, event);
    }

    public void sendCrewMemberEvent(String eventType, CrewMember crewMember) {
        ReferenceEvent event = ReferenceEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .entityType("CREW_MEMBER")
                .entityId(crewMember.getId().toString())
                .payload(crewMember)
                .version("1.0")
                .build();

        log.info("Sending crew member event: {} for crew: {}", eventType, crewMember.getEmployeeNumber());
        kafkaTemplate.send(TOPIC, event);
    }
}