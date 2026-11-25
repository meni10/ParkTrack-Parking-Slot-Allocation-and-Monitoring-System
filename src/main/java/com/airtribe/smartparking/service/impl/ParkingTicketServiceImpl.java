package com.airtribe.smartparking.service.impl;

import com.airtribe.smartparking.common.util.TicketNumberGenerator;
import com.airtribe.smartparking.entity.ParkingSpot;
import com.airtribe.smartparking.entity.ParkingTicket;
import com.airtribe.smartparking.entity.Vehicle;
import com.airtribe.smartparking.enums.ParkingTicketStatus;
import com.airtribe.smartparking.exception.ResourceNotFoundException;
import com.airtribe.smartparking.exception.TicketNotFoundException;
import com.airtribe.smartparking.repository.ParkingTicketRepository;
import com.airtribe.smartparking.service.ParkingTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ParkingTicketServiceImpl implements ParkingTicketService {

    private final ParkingTicketRepository parkingTicketRepository;


    @Override
    public ParkingTicket createParkingTicket(Vehicle vehicle, ParkingSpot parkingSpot) {

        ParkingTicket ticket = ParkingTicket.builder()
                .ticketNumber(TicketNumberGenerator.generate())
                .entryTime(LocalDateTime.now())
                .vehicle(vehicle)
                .status(ParkingTicketStatus.ACTIVE)
                .parkingSpot(parkingSpot)
                .build();


        return parkingTicketRepository.save(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingTicket findByTicketNumber(String ticketNumber) {
        return parkingTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found with number " + ticketNumber));
    }

    @Override
    public ParkingTicket findActiveTicket(String vehicleNumber) {

        return parkingTicketRepository.findByVehicleVehicleNumberAndStatus(vehicleNumber, ParkingTicketStatus.ACTIVE)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active ticket not found for vehicle number " + vehicleNumber));
    }

    @Override
    public ParkingTicket closeParkingTicket(ParkingTicket parkingTicket, LocalDateTime exitTime) {

        parkingTicket.setExitTime(exitTime);
        parkingTicket.setStatus(ParkingTicketStatus.COMPLETED);

        return parkingTicketRepository.save(parkingTicket);


    }

    @Override
    public ParkingTicket save(ParkingTicket parkingTicket) {
        return parkingTicketRepository.save(parkingTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingTicket> findTickets(String vehicleNumber, ParkingTicketStatus status) {
        String normalizedVehicleNumber = (vehicleNumber != null && !vehicleNumber.isBlank())
                ? vehicleNumber.trim()
                : null;
        return parkingTicketRepository.findTicketsWithDetails(normalizedVehicleNumber, status);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingTicket findTicketWithDetailsByNumber(String ticketNumber) {
        if (ticketNumber == null || ticketNumber.isBlank()) {
            throw new IllegalArgumentException("Ticket number is required");
        }
        return parkingTicketRepository.findByTicketNumberWithDetails(ticketNumber.trim())
                .orElseThrow(() ->
                        new TicketNotFoundException("Ticket not found with number " + ticketNumber.trim()));
    }
}
