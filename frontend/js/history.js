(function (global) {
    "use strict";

    const { api, app } = global.SmartParking;

    function renderHistoryTable(tickets) {
        const container = document.getElementById("history-table-container");
        if (!container) return;

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `<p class="empty-state">No parking ticket records found.</p>`;
            return;
        }

        const rowsHtml = tickets
            .map((ticket) => {
                const actionHtml = ticket.status === "ACTIVE"
                    ? `<button type="button" class="btn btn-sm btn-outline js-history-checkout" data-ticket="${app.escapeHtml(ticket.ticketNumber)}">Check Out</button>`
                    : `<span style="color: var(--text-muted); font-size: 0.8rem;">Closed</span>`;

                return `
                    <tr>
                        <td class="mono">${app.escapeHtml(ticket.ticketNumber)}</td>
                        <td><strong>${app.escapeHtml(ticket.vehicleNumber)}</strong></td>
                        <td>${app.escapeHtml(ticket.vehicleType)}</td>
                        <td>Floor ${app.escapeHtml(ticket.floorNumber)} · ${app.escapeHtml(ticket.spotNumber)}</td>
                        <td>${app.formatDateTime(ticket.entryTime)}</td>
                        <td>${app.formatDateTime(ticket.exitTime)}</td>
                        <td>${app.formatCurrency(ticket.totalFee)}</td>
                        <td>${app.statusBadgeHtml(ticket.status)}</td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            })
            .join("");

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Ticket #</th>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Spot</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Total Fee</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;

        container.querySelectorAll(".js-history-checkout").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (global.SmartParking.checkout && typeof global.SmartParking.checkout.prefillFromTicketNumber === "function") {
                    app.navigateTo("checkout", { skipLoad: true });
                    global.SmartParking.checkout.prefillFromTicketNumber(btn.dataset.ticket);
                }
            });
        });
    }

    async function loadHistory() {
        const vehicleNumber = document.getElementById("history-vehicle-filter").value.trim();
        const status = document.getElementById("history-status-filter").value;

        app.setLoading(true);
        try {
            const response = await api.getTickets({ vehicleNumber, status });
            const tickets = response.data || [];
            renderHistoryTable(tickets);
            app.setApiOnlineStatus(true);
            app.updateLastSynced();
        } catch (err) {
            app.setApiOnlineStatus(false);
            app.showToast("error", "History Load Error", err.message);
        } finally {
            app.setLoading(false);
        }
    }

    app.registerViewLoader("history", loadHistory);

    document.addEventListener("DOMContentLoaded", () => {
        const filterForm = document.getElementById("history-filter-form");
        if (filterForm) {
            filterForm.addEventListener("submit", (e) => {
                e.preventDefault();
                loadHistory();
            });
        }

        const statusSelect = document.getElementById("history-status-filter");
        if (statusSelect) {
            statusSelect.addEventListener("change", loadHistory);
        }

        const resetBtn = document.getElementById("history-reset-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                document.getElementById("history-vehicle-filter").value = "";
                document.getElementById("history-status-filter").value = "";
                loadHistory();
            });
        }
    });
})(window);
