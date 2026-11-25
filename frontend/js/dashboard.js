(function (global) {
    "use strict";

    const { api, app } = global.SmartParking;

    function computeTotalsBySpotType(spotsOverview) {
        const totals = { BIKE: 0, COMPACT: 0, LARGE: 0, BUS: 0 };
        if (!spotsOverview || !Array.isArray(spotsOverview.floors)) {
            return totals;
        }
        spotsOverview.floors.forEach((floor) => {
            (floor.spots || []).forEach((spot) => {
                if (Object.prototype.hasOwnProperty.call(totals, spot.spotType)) {
                    totals[spot.spotType] += 1;
                }
            });
        });
        return totals;
    }

    function renderKpis(overview) {
        const total = overview ? overview.totalSpots : 0;
        const available = overview ? overview.availableSpots : 0;
        const occupied = overview ? overview.occupiedSpots : 0;
        const reserved = overview ? overview.reservedSpots : 0;
        const outOfService = overview ? overview.outOfServiceSpots : 0;

        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

        document.getElementById("kpi-total-spots").textContent = String(total);
        document.getElementById("kpi-available-spots").textContent = String(available);
        document.getElementById("kpi-occupied-spots").textContent = String(occupied);
        document.getElementById("kpi-occupancy-rate").textContent = `${occupancyRate}% occupancy`;
        document.getElementById("kpi-other-spots").textContent = String(reserved + outOfService);
        document.getElementById("kpi-other-breakdown").textContent =
            `${reserved} reserved, ${outOfService} out of service`;
    }

    function renderAvailability(availability, overview) {
        const container = document.getElementById("availability-breakdown");
        if (!container) {
            return;
        }

        if (!availability) {
            container.innerHTML = `<p class="empty-state">Availability data unavailable.</p>`;
            return;
        }

        const totalsByType = computeTotalsBySpotType(overview);
        const rows = [
            { label: "Bike Spots (BIKE)", key: "BIKE", available: availability.bikeAvailable },
            { label: "Compact Spots (CAR)", key: "COMPACT", available: availability.compactAvailable },
            { label: "Large Spots (SUV / TRUCK)", key: "LARGE", available: availability.largeAvailable },
            { label: "Bus Spots (BUS)", key: "BUS", available: availability.busAvailable }
        ];

        container.innerHTML = rows
            .map((row) => {
                const total = totalsByType[row.key] || 0;
                const percent = total > 0 ? Math.min(100, Math.round((row.available / total) * 100)) : 0;
                const countLabel = total > 0
                    ? `${row.available} / ${total} available`
                    : `${row.available} available`;

                return `
                    <div class="availability-row">
                        <div class="availability-row-top">
                            <span class="availability-type">${app.escapeHtml(row.label)}</span>
                            <span class="availability-count">${app.escapeHtml(countLabel)}</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function renderActiveTickets(tickets) {
        const container = document.getElementById("dashboard-active-tickets");
        if (!container) {
            return;
        }

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `<p class="empty-state">No vehicles are currently parked.</p>`;
            return;
        }

        const rowsHtml = tickets.slice(0, 8)
            .map((ticket) => `
                <tr>
                    <td class="mono">${app.escapeHtml(ticket.ticketNumber)}</td>
                    <td><strong>${app.escapeHtml(ticket.vehicleNumber)}</strong></td>
                    <td>${app.escapeHtml(ticket.vehicleType)}</td>
                    <td>Floor ${app.escapeHtml(ticket.floorNumber)} · ${app.escapeHtml(ticket.spotNumber)}</td>
                    <td>${app.formatDateTime(ticket.entryTime)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline js-quick-checkout"
                            data-ticket="${app.escapeHtml(ticket.ticketNumber)}"
                            data-vehicle="${app.escapeHtml(ticket.vehicleNumber)}">
                            Check Out
                        </button>
                    </td>
                </tr>
            `)
            .join("");

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Ticket #</th>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Entry Time</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;

        container.querySelectorAll(".js-quick-checkout").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (global.SmartParking.checkout && typeof global.SmartParking.checkout.prefillFromTicketNumber === "function") {
                    app.navigateTo("checkout", { skipLoad: true });
                    global.SmartParking.checkout.prefillFromTicketNumber(btn.dataset.ticket);
                }
            });
        });
    }

    async function loadDashboard() {
        app.setLoading(true);
        try {
            const [availabilityRes, spotsRes, activeTicketsRes] = await Promise.all([
                api.getAvailability(),
                api.getSpotsOverview(),
                api.getTickets({ status: "ACTIVE" })
            ]);

            app.state.availability = availabilityRes.data;
            app.state.spotsOverview = spotsRes.data;
            app.state.tickets = activeTicketsRes.data || [];

            renderKpis(spotsRes.data);
            renderAvailability(availabilityRes.data, spotsRes.data);
            renderActiveTickets(activeTicketsRes.data || []);

            app.setApiOnlineStatus(true);
            app.updateLastSynced();
        } catch (err) {
            app.setApiOnlineStatus(false);
            app.showToast("error", "Dashboard Error", err.message);
        } finally {
            app.setLoading(false);
        }
    }

    app.registerViewLoader("dashboard", loadDashboard);
})(window);
