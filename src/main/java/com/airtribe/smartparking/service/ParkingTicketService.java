package com.airtribe.smartparking.service;

import com.airtribe.smartparking.entity.ParkingSpot;
import com.airtribe.smartparking.entity.ParkingTicket;
import com.airtribe.smartparking.entity.Vehicle;
import com.airtribe.smartparking.enums.ParkingTicketStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface ParkingTicketService {

    ParkingTicket createParkingTicket(
            Vehicle vehicle,
            ParkingSpot parkingSpot
    );

    ParkingTicket findByTicketNumber(String ticketNumber);

    ParkingTicket findActiveTicket(String vehicleNumber);

    ParkingTicket closeParkingTicket(
            ParkingTicket parkingTicket,
            LocalDateTime exitTime
    );

    ParkingTicket save(ParkingTicket parkingTicket);

    List<ParkingTicket> findTickets(String vehicleNumber, ParkingTicketStatus status);

    ParkingTicket findTicketWithDetailsByNumber(String ticketNumber);
}
