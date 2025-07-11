package com.flightmanagement.referencemanagerservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
public class ReferenceManagerServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReferenceManagerServiceApplication.class, args);
    }
}