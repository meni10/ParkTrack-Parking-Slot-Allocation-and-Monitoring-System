(function (global) {
    "use strict";

    const API_BASE_URL = "http://localhost:8080/api/v1/parking";

    /**
     * Custom error carrying HTTP status, server message, and field-level validation errors.
     */
    class ApiError extends Error {
        constructor(message, status, fieldErrors) {
            super(message);
            this.name = "ApiError";
            this.status = status || 0;
            this.fieldErrors = fieldErrors || null;
        }
    }

    async function request(path, options = {}) {
        const url = `${API_BASE_URL}${path}`;
        const config = {
            method: options.method || "GET",
            cache: "no-store",
            headers: {
                "Accept": "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {})
            },
            ...(options.body ? { body: JSON.stringify(options.body) } : {})
        };

        let response;
        try {
            response = await fetch(url, config);
        } catch (networkError) {
            throw new ApiError(
                "Unable to reach the backend at http://localhost:8080. Verify Spring Boot is running and CORS is enabled.",
                0,
                null
            );
        }

        let payload = null;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            payload = await response.json().catch(() => null);
        }

        if (!response.ok) {
            const message =
                (payload && payload.message) ||
                (payload && payload.error) ||
                `Request failed with HTTP ${response.status}`;
            const fieldErrors = (payload && payload.errors) || null;
            throw new ApiError(message, response.status, fieldErrors);
        }

        if (payload && Object.prototype.hasOwnProperty.call(payload, "data")) {
            return payload;
        }

        return { success: true, message: "Success", data: payload };
    }

    const ParkingApi = {
        ApiError,

        getAvailability() {
            return request("/availability");
        },

        getSpotsOverview() {
            return request("/spots");
        },

        getTickets(filters = {}) {
            const params = new URLSearchParams();
            if (filters.vehicleNumber && filters.vehicleNumber.trim()) {
                params.set("vehicleNumber", filters.vehicleNumber.trim());
            }
            if (filters.status && filters.status.trim()) {
                params.set("status", filters.status.trim());
            }
            const query = params.toString();
            return request(`/tickets${query ? `?${query}` : ""}`);
        },

        getTicketByNumber(ticketNumber) {
            return request(`/tickets/${encodeURIComponent(ticketNumber.trim())}`);
        },

        checkIn(checkInPayload) {
            return request("/check-in", {
                method: "POST",
                body: checkInPayload
            });
        },

        checkOut(checkOutPayload) {
            return request("/check-out", {
                method: "POST",
                body: checkOutPayload
            });
        }
    };

    global.SmartParking = global.SmartParking || {};
    global.SmartParking.api = ParkingApi;
})(window);
