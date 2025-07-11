-- Airlines table
CREATE TABLE airlines (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          iata_code VARCHAR(3) UNIQUE NOT NULL,
                          icao_code VARCHAR(4) UNIQUE NOT NULL,
                          name VARCHAR(255) NOT NULL,
                          country VARCHAR(100),
                          type VARCHAR(50),
                          active BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Airports table
CREATE TABLE airports (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          iata_code VARCHAR(3) UNIQUE NOT NULL,
                          icao_code VARCHAR(4) UNIQUE NOT NULL,
                          name VARCHAR(255) NOT NULL,
                          city VARCHAR(100) NOT NULL,
                          country VARCHAR(100) NOT NULL,
                          timezone VARCHAR(50),
                          latitude DOUBLE,
                          longitude DOUBLE,
                          elevation INT,
                          type VARCHAR(50),
                          active BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Aircrafts table
CREATE TABLE aircrafts (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           registration_number VARCHAR(20) UNIQUE NOT NULL,
                           aircraft_type VARCHAR(10) NOT NULL,
                           manufacturer VARCHAR(50),
                           model VARCHAR(50),
                           seat_capacity INT,
                           cargo_capacity INT,
                           max_range INT,
                           manufacture_date DATE,
                           last_maintenance DATE,
                           status VARCHAR(30) DEFAULT 'ACTIVE',
                           airline_id BIGINT,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           FOREIGN KEY (airline_id) REFERENCES airlines(id)
);

-- Routes table
CREATE TABLE routes (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        origin_airport_id BIGINT NOT NULL,
                        destination_airport_id BIGINT NOT NULL,
                        distance INT,
                        estimated_flight_time INT,
                        active BOOLEAN DEFAULT TRUE,
                        route_type VARCHAR(30),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
                        FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
                        UNIQUE KEY unique_route (origin_airport_id, destination_airport_id)
);

-- Crew Members table
CREATE TABLE crew_members (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              first_name VARCHAR(100) NOT NULL,
                              last_name VARCHAR(100) NOT NULL,
                              employee_number VARCHAR(50) UNIQUE NOT NULL,
                              national_id VARCHAR(20),
                              date_of_birth DATE,
                              gender VARCHAR(10),
                              phone_number VARCHAR(20),
                              email VARCHAR(100),
                              crew_type VARCHAR(30) NOT NULL,
                              license_number VARCHAR(50),
                              license_expiry DATE,
                              aircraft_qualifications VARCHAR(255),
                              languages VARCHAR(100),
                              status VARCHAR(20) DEFAULT 'ACTIVE',
                              base_airport_id BIGINT,
                              airline_id BIGINT NOT NULL,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              FOREIGN KEY (base_airport_id) REFERENCES airports(id),
                              FOREIGN KEY (airline_id) REFERENCES airlines(id)
);

-- Gates table
CREATE TABLE gates (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       gate_number VARCHAR(10) NOT NULL,
                       terminal VARCHAR(10),
                       airport_id BIGINT NOT NULL,
                       gate_type VARCHAR(20),
                       active BOOLEAN DEFAULT TRUE,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       FOREIGN KEY (airport_id) REFERENCES airports(id),
                       UNIQUE KEY unique_gate (airport_id, gate_number)
);

-- Aircraft Seat Configurations table
CREATE TABLE aircraft_seat_configurations (
                                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              aircraft_id BIGINT NOT NULL UNIQUE,
                                              total_seats INT,
                                              total_rows INT,
                                              seats_per_row INT,
                                              economy_seats INT,
                                              business_seats INT,
                                              first_class_seats INT,
                                              seat_layout TEXT,
                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                              FOREIGN KEY (aircraft_id) REFERENCES aircrafts(id)
);

-- Aircraft Seats table
CREATE TABLE aircraft_seats (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                aircraft_configuration_id BIGINT NOT NULL,
                                seat_number VARCHAR(5) NOT NULL,
                                row_number INT,
                                seat_letter VARCHAR(1),
                                seat_class VARCHAR(20),
                                seat_type VARCHAR(20),
                                has_extra_legroom BOOLEAN DEFAULT FALSE,
                                is_emergency_exit BOOLEAN DEFAULT FALSE,
                                is_blocked BOOLEAN DEFAULT FALSE,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                FOREIGN KEY (aircraft_configuration_id) REFERENCES aircraft_seat_configurations(id),
                                UNIQUE KEY unique_seat (aircraft_configuration_id, seat_number)
);