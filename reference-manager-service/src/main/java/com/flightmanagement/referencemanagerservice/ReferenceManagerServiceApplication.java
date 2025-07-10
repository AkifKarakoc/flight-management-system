package com.flightmanagement.referencemanagerservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class ReferenceManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReferenceManagerApplication.class, args);
    }
}