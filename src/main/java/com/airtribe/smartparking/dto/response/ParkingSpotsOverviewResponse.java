package com.airtribe.smartparking.dto.response;

import lombok.*;

import java.util.List;

/**
 * Response DTO containing overall spot status counts and per-floor spot listings.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParkingSpotsOverviewResponse {

    private int totalSpots;

    private int availableSpots;

    private int occupiedSpots;

    private int reservedSpots;

    private int outOfServiceSpots;

    private List<ParkingFloorResponse> floors;
}
