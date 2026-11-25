package com.airtribe.smartparking.controller;

import com.airtribe.smartparking.common.constants.ApiConstants;
import com.airtribe.smartparking.common.response.ApiResponseDto;
import com.airtribe.smartparking.common.util.ResponseBuilder;
import com.airtribe.smartparking.dto.request.CheckInRequest;
import com.airtribe.smartparking.dto.request.CheckOutRequest;
import com.airtribe.smartparking.dto.response.ParkingAvailabilityResponse;
import com.airtribe.smartparking.dto.response.ParkingSpotsOverviewResponse;
import com.airtribe.smartparking.dto.response.ParkingTicketResponse;
import com.airtribe.smartparking.dto.response.PaymentResponse;
import com.airtribe.smartparking.enums.ParkingTicketStatus;
import com.airtribe.smartparking.service.ParkingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiConstants.API_V1 + ApiConstants.PARKING)
@Tag(name = "Parking Management",
        description = "REST APIs for Smart Parking System")
public class ParkingController {

    private final ParkingService parkingService;


    @PostMapping(ApiConstants.CHECK_IN)
    @Operation(summary = "Vehicle Check-In",
            description = "Registers a vehicle, allocates an available parking spot, and generates a parking ticket."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Vehicle checked in successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "409", description = "Vehicle already parked")
    })
    public ResponseEntity<ApiResponseDto<ParkingTicketResponse>>
    checkInVehicle(@Valid @RequestBody CheckInRequest request) {

        ParkingTicketResponse response = parkingService.checkIn(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseBuilder.success("Vehicle checked in successfully", response));


    }

    @PostMapping(ApiConstants.CHECK_OUT)
    @Operation(summary = "Vehicle Check-Out",
            description = "Checks out a vehicle, calculates the parking fee, records the payment, and releases the parking spot."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vehicle checked out successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "404", description = "Active parking ticket not found")
    })
    public ResponseEntity<ApiResponseDto<PaymentResponse>> checkOutVehicle(
            @Valid
            @RequestBody
            CheckOutRequest checkOutRequest) {

        PaymentResponse response = parkingService.checkOut(checkOutRequest);

        return ResponseEntity.ok()
                .body(ResponseBuilder.success("Vehicle checked out successfully", response));
    }

    @GetMapping(ApiConstants.AVAILABILITY)
    @Operation(
            summary = "Parking Availability",
            description = "Returns the current availability of parking spots."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Parking availability retrieved successfully"
    )
    public ResponseEntity<ApiResponseDto<ParkingAvailabilityResponse>> getParkingAvailability() {

        ParkingAvailabilityResponse response =
                parkingService.getParkingAvailability();

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        "Parking availability fetched successfully.",
                        response
                )
        );
    }

    @GetMapping(ApiConstants.SPOTS)
    @Operation(
            summary = "Parking Floors and Spots",
            description = "Returns all parking floors, individual parking spots, and overall status counts."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Parking floors and spots retrieved successfully"
    )
    public ResponseEntity<ApiResponseDto<ParkingSpotsOverviewResponse>> getParkingSpots() {
        ParkingSpotsOverviewResponse response = parkingService.getAllFloorsWithSpots();
        return ResponseEntity.ok(
                ResponseBuilder.success("Parking spots fetched successfully.", response)
        );
    }

    @GetMapping(ApiConstants.TICKETS)
    @Operation(
            summary = "Parking Ticket History",
            description = "Returns parking tickets ordered from newest to oldest, optionally filtered by vehicleNumber or status."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Parking tickets retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid filter parameter")
    })
    public ResponseEntity<ApiResponseDto<List<ParkingTicketResponse>>> getParkingTickets(
            @RequestParam(required = false) String vehicleNumber,
            @RequestParam(required = false) ParkingTicketStatus status) {
        List<ParkingTicketResponse> response = parkingService.getTickets(vehicleNumber, status);
        return ResponseEntity.ok(
                ResponseBuilder.success("Parking tickets fetched successfully.", response)
        );
    }

    @GetMapping(ApiConstants.TICKETS + "/{ticketNumber}")
    @Operation(
            summary = "Get Ticket by Number",
            description = "Returns parking ticket details for a given ticket number."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Parking ticket retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid ticket number"),
            @ApiResponse(responseCode = "404", description = "Parking ticket not found")
    })
    public ResponseEntity<ApiResponseDto<ParkingTicketResponse>> getTicketByNumber(
            @PathVariable @NotBlank(message = "Ticket number is required") String ticketNumber) {
        ParkingTicketResponse response = parkingService.getTicketByNumber(ticketNumber);
        return ResponseEntity.ok(
                ResponseBuilder.success("Parking ticket fetched successfully.", response)
        );
    }

}
