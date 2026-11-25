package com.airtribe.smartparking.service.impl;

import com.airtribe.smartparking.dto.response.ParkingAvailabilityResponse;
import com.airtribe.smartparking.dto.response.ParkingFloorResponse;
import com.airtribe.smartparking.dto.response.ParkingSpotResponse;
import com.airtribe.smartparking.dto.response.ParkingSpotsOverviewResponse;
import com.airtribe.smartparking.entity.ParkingFloor;
import com.airtribe.smartparking.entity.ParkingSpot;
import com.airtribe.smartparking.enums.ParkingSpotStatus;
import com.airtribe.smartparking.enums.ParkingSpotType;
import com.airtribe.smartparking.enums.VehicleType;
import com.airtribe.smartparking.exception.ParkingSpotNotAvailableException;
import com.airtribe.smartparking.exception.ResourceNotFoundException;
import com.airtribe.smartparking.repository.ParkingFloorRepository;
import com.airtribe.smartparking.repository.ParkingSpotRepository;
import com.airtribe.smartparking.service.ParkingSpotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ParkingSpotServiceImpl implements ParkingSpotService {


    private final ParkingSpotRepository parkingSpotRepository;
    private final ParkingFloorRepository parkingFloorRepository;

    @Override
    public ParkingSpot allocateParkingSpot(VehicleType vehicleType) {

        ParkingSpotType spotType = mapVehicleTypeToSpotType(vehicleType);

        ParkingSpot parkingSpot = findAvailableSpot(spotType);

        updateParkingSpotStatus(parkingSpot, ParkingSpotStatus.OCCUPIED);

        return parkingSpotRepository.save(parkingSpot);


    }


    @Override
    public void releaseParkingSpot(Long parkingSpotId) {

        ParkingSpot parkingSpot = findById(parkingSpotId);

        updateParkingSpotStatus(parkingSpot, ParkingSpotStatus.AVAILABLE);

        parkingSpotRepository.save(parkingSpot);

    }

    @Override
    public ParkingSpot findById(Long parkingSpotId) {


        return parkingSpotRepository.findById(parkingSpotId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking Spot not found with id : " + parkingSpotId));

    }

    @Override
    public ParkingAvailabilityResponse getParkingAvailability() {
        List<ParkingSpot> allSpots = parkingSpotRepository.findAll();

        long bikeAvailable = allSpots.stream()
                .filter(spot -> spot.getSpotType() == ParkingSpotType.BIKE && spot.getStatus() == ParkingSpotStatus.AVAILABLE)
                .count();

        long compactAvailable = allSpots.stream()
                .filter(spot -> spot.getSpotType() == ParkingSpotType.COMPACT && spot.getStatus() == ParkingSpotStatus.AVAILABLE)
                .count();

        long largeAvailable = allSpots.stream()
                .filter(spot -> spot.getSpotType() == ParkingSpotType.LARGE && spot.getStatus() == ParkingSpotStatus.AVAILABLE)
                .count();

        long busAvailable = allSpots.stream()
                .filter(spot -> spot.getSpotType() == ParkingSpotType.BUS && spot.getStatus() == ParkingSpotStatus.AVAILABLE)
                .count();

        return ParkingAvailabilityResponse.builder()
                .bikeAvailable((int) bikeAvailable)
                .compactAvailable((int) compactAvailable)
                .largeAvailable((int) largeAvailable)
                .busAvailable((int) busAvailable)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingSpotsOverviewResponse getAllFloorsWithSpots() {
        List<ParkingFloor> floors = parkingFloorRepository.findAllByOrderByFloorNumberAsc();
        List<ParkingSpot> spots = parkingSpotRepository.findAllWithFloorOrderByFloorAndId();

        Map<Integer, List<ParkingSpotResponse>> spotsByFloor = spots.stream()
                .map(spot -> ParkingSpotResponse.builder()
                        .spotNumber(spot.getSpotNumber())
                        .spotType(spot.getSpotType())
                        .status(spot.getStatus())
                        .floorNumber(spot.getParkingFloor().getFloorNumber())
                        .build())
                .collect(Collectors.groupingBy(ParkingSpotResponse::getFloorNumber));

        List<ParkingFloorResponse> floorResponses = floors.stream()
                .map(floor -> ParkingFloorResponse.builder()
                        .floorNumber(floor.getFloorNumber())
                        .floorName(floor.getFloorName())
                        .status(floor.getStatus())
                        .spots(spotsByFloor.getOrDefault(floor.getFloorNumber(), Collections.emptyList()))
                        .build())
                .toList();

        int availableCount = countByStatus(spots, ParkingSpotStatus.AVAILABLE);
        int occupiedCount = countByStatus(spots, ParkingSpotStatus.OCCUPIED);
        int reservedCount = countByStatus(spots, ParkingSpotStatus.RESERVED);
        int outOfServiceCount = countByStatus(spots, ParkingSpotStatus.OUT_OF_SERVICE);

        return ParkingSpotsOverviewResponse.builder()
                .totalSpots(spots.size())
                .availableSpots(availableCount)
                .occupiedSpots(occupiedCount)
                .reservedSpots(reservedCount)
                .outOfServiceSpots(outOfServiceCount)
                .floors(floorResponses)
                .build();
    }

    private int countByStatus(List<ParkingSpot> spots, ParkingSpotStatus status) {
        return (int) spots.stream()
                .filter(spot -> spot.getStatus() == status)
                .count();
    }

    // ===========================
    // Private Helper Methods
    // ===========================
    private ParkingSpotType mapVehicleTypeToSpotType(VehicleType vehicleType) {

        // use switch case

        return switch (vehicleType) {

            case BIKE -> ParkingSpotType.BIKE;

            case CAR -> ParkingSpotType.COMPACT;

            case SUV -> ParkingSpotType.LARGE;

            case BUS -> ParkingSpotType.BUS;

            case TRUCK -> ParkingSpotType.LARGE;


        };
    }

    private ParkingSpot findAvailableSpot(ParkingSpotType spotType) {

        return parkingSpotRepository.findFirstBySpotTypeAndStatusOrderByIdAsc(spotType, ParkingSpotStatus.AVAILABLE)
                .orElseThrow(() ->
                        new ParkingSpotNotAvailableException("No available parking spot for type : " + spotType));
    }

    private void updateParkingSpotStatus(ParkingSpot parkingSpot, ParkingSpotStatus parkingSpotStatus) {

        parkingSpot.setStatus(parkingSpotStatus);
    }
}
