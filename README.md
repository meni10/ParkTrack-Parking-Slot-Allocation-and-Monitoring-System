# Smart Parking Management System 🚗

A Java Spring Boot application that manages parking spaces, vehicle check-in, check-out, and payment processing.

The system automatically assigns an available parking spot based on the vehicle type and updates parking availability.

## Features

- Check available parking spaces.
- Register vehicle check-in.
- Automatically allocate parking spots.
- Generate parking tickets.
- Prevent duplicate vehicle check-ins.
- Calculate parking fees.
- Process parking payments.
- Release parking spots after successful payment.
- Handle errors and validate user requests.

## Technologies Used

- **Java 21**
- **Spring Boot**
- **Spring Data JPA**
- **Hibernate**
- **MySQL**
- **Maven**
- **Swagger**
- **JUnit & Mockito**
- **Docker**

## How It Works

1. The user submits vehicle details.
2. The system checks whether the vehicle is already parked.
3. It identifies an available parking spot based on the vehicle type.
4. The first available matching spot is selected using ascending parking spot ID.
5. The system marks the spot as occupied and generates a parking ticket.
6. During check-out, the system calculates the parking fee.
7. After successful payment, the parking spot becomes available again.

## Parking Slot Allocation

The project uses a **First Available Slot Allocation** approach.

- Bike → Bike Slot
- Car → Compact Slot
- SUV → Large Slot
- Bus → Bus Slot
- Truck → Large Slot

The system selects the first available matching spot based on its ID. Pessimistic locking is used to prevent multiple requests from allocating the same spot simultaneously.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/parking/availability` | Check parking availability |
| POST | `/api/v1/parking/check-in` | Register vehicle check-in |
| POST | `/api/v1/parking/check-out` | Process vehicle check-out |

## How to Run the Project

**Prerequisites:**
- Java 21
- MySQL
- Maven

**Steps:**

1. Clone the repository:

   ```bash
   git clone https://github.com/meni10/ParkTrack-Parking-Slot-Allocation-and-Monitoring-System.git
   ```

2. Open the project in your IDE.

3. Configure your MySQL database and environment variables:

   ```text
   DB_URL
   DB_USERNAME
   DB_PASSWORD
   ```

4. Run the application:

   ```bash
   mvn spring-boot:run
   ```

5. Access the application at:

   ```text
   http://localhost:8080
   ```

## API Documentation

Swagger UI:

```text
http://localhost:8080/swagger-ui
```

## Project Purpose

This project demonstrates how Java, Spring Boot, and MySQL can be used to develop a parking management application with automated slot allocation, ticket management, and payment processing.
