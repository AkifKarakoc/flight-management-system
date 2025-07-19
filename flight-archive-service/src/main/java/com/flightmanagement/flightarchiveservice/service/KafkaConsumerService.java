package com.flightmanagement.flightarchiveservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flightmanagement.flightarchiveservice.event.FlightEvent;
import com.flightmanagement.flightarchiveservice.event.ReferenceEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final FlightArchiveService flightArchiveService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "flight.events", groupId = "flight-archive-service-group")
    public void handleFlightEvent(@Payload Object eventPayload,
                                  @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                  @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                                  @Header(KafkaHeaders.OFFSET) long offset,
                                  Acknowledgment acknowledgment) {

        log.info("Received event from topic: {}, partition: {}, offset: {}", topic, partition, offset);
        log.debug("Event payload type: {}", eventPayload.getClass().getName());
        log.debug("Event payload: {}", eventPayload);

        try {
            FlightEvent event = convertToFlightEvent(eventPayload);
            if (event != null) {
                flightArchiveService.archiveFlightEvent(event);
                log.info("Flight event processed successfully: {}", event.getEventId());
            } else {
                log.warn("Failed to convert payload to FlightEvent: {}", eventPayload);
            }

            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process flight event. Payload: {}", eventPayload, e);
            acknowledgment.acknowledge(); // Skip invalid messages
        }
    }

    @KafkaListener(topics = "reference.events", groupId = "flight-archive-service-group")
    public void handleReferenceEvent(@Payload Object eventPayload,
                                     @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                     Acknowledgment acknowledgment) {

        log.debug("Received reference event from topic: {}", topic);

        try {
            ReferenceEvent event = convertToReferenceEvent(eventPayload);
            if (event != null) {
                log.info("Reference event processed: {} - {}", event.getEntityType(), event.getEventType());
            }
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process reference event. Payload: {}", eventPayload, e);
            acknowledgment.acknowledge();
        }
    }

    @SuppressWarnings("unchecked")
    private FlightEvent convertToFlightEvent(Object payload) {
        try {
            if (payload instanceof FlightEvent) {
                return (FlightEvent) payload;
            } else if (payload instanceof Map) {
                return objectMapper.convertValue(payload, FlightEvent.class);
            } else if (payload instanceof String) {
                return objectMapper.readValue((String) payload, FlightEvent.class);
            } else {
                log.warn("Unknown payload type for FlightEvent: {}", payload.getClass());
                return null;
            }
        } catch (Exception e) {
            log.error("Error converting to FlightEvent", e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private ReferenceEvent convertToReferenceEvent(Object payload) {
        try {
            if (payload instanceof ReferenceEvent) {
                return (ReferenceEvent) payload;
            } else if (payload instanceof Map) {
                return objectMapper.convertValue(payload, ReferenceEvent.class);
            } else if (payload instanceof String) {
                return objectMapper.readValue((String) payload, ReferenceEvent.class);
            } else {
                log.warn("Unknown payload type for ReferenceEvent: {}", payload.getClass());
                return null;
            }
        } catch (Exception e) {
            log.error("Error converting to ReferenceEvent", e);
            return null;
        }
    }
}