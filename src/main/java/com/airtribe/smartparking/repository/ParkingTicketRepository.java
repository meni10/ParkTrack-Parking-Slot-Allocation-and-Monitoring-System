package com.airtribe.smartparking.repository;

import com.airtribe.smartparking.entity.ParkingTicket;
import com.airtribe.smartparking.enums.ParkingTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingTicketRepository extends JpaRepository<ParkingTicket, Long> {

    Optional<ParkingTicket> findByTicketNumber(String ticketNumber);


    List<ParkingTicket> findByVehicleVehicleNumber(String vehicleNumber);

    Optional<ParkingTicket> findByVehicleVehicleNumberAndStatus(
            String vehicleNumber,
            ParkingTicketStatus status
    );

    boolean existsByVehicleVehicleNumberAndStatus(
            String vehicleNumber,
            ParkingTicketStatus parkingTicketStatus
    );

    @Query("""
            SELECT pt
            FROM ParkingTicket pt
            JOIN FETCH pt.vehicle v
            JOIN FETCH pt.parkingSpot ps
            JOIN FETCH ps.parkingFloor pf
            WHERE (:vehicleNumber IS NULL OR LOWER(v.vehicleNumber) = LOWER(:vehicleNumber))
              AND (:status IS NULL OR pt.status = :status)
            ORDER BY pt.entryTime DESC, pt.id DESC
            """)
    List<ParkingTicket> findTicketsWithDetails(
            @Param("vehicleNumber") String vehicleNumber,
            @Param("status") ParkingTicketStatus status
    );

    @Query("""
            SELECT pt
            FROM ParkingTicket pt
            JOIN FETCH pt.vehicle v
            JOIN FETCH pt.parkingSpot ps
            JOIN FETCH ps.parkingFloor pf
            WHERE pt.ticketNumber = :ticketNumber
            """)
    Optional<ParkingTicket> findByTicketNumberWithDetails(@Param("ticketNumber") String ticketNumber);
}
