package com.airtribe.smartparking.dto.response;

import com.airtribe.smartparking.enums.FloorStatus;
import lombok.*;

import java.util.List;

/**
 * Response DTO representing a parking floor and its individual parking spots.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParkingFloorResponse {

    private Integer floorNumber;

    private String floorName;

    private FloorStatus status;

    private List<ParkingSpotResponse> spots;
}
