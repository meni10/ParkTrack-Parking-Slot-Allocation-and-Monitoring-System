(function (global) {
    "use strict";

    const { api, app } = global.SmartParking;

    function clearFieldErrors() {
        ["vehicleNumber", "ownerName", "vehicleType"].forEach((field) => {
            const errEl = document.getElementById(`err-checkin-${field}`);
            if (errEl) errEl.textContent = "";
        });
        document.querySelectorAll("#checkin-form .input-invalid").forEach((el) => {
            el.classList.remove("input-invalid");
        });
    }

    function setFieldError(field, message) {
        const errEl = document.getElementById(`err-checkin-${field}`);
        if (errEl) errEl.textContent = message;

        const inputMap = {
            vehicleNumber: "checkin-vehicle-number",
            ownerName: "checkin-owner-name",
            vehicleType: "checkin-vehicle-type"
        };
        const inputEl = document.getElementById(inputMap[field]);
        if (inputEl) inputEl.classList.add("input-invalid");
    }

    function validateCheckInForm(values) {
        clearFieldErrors();
        let valid = true;

        if (!values.vehicleNumber) {
            setFieldError("vehicleNumber", "Vehicle number is required.");
            valid = false;
        } else if (values.vehicleNumber.length > 20) {
            setFieldError("vehicleNumber", "Vehicle number must not exceed 20 characters.");
            valid = false;
        }

        if (!values.ownerName) {
            setFieldError("ownerName", "Owner name is required.");
            valid = false;
        } else if (values.ownerName.length > 100) {
            setFieldError("ownerName", "Owner name must not exceed 100 characters.");
            valid = false;
        }

        if (!values.vehicleType) {
            setFieldError("vehicleType", "Please select a vehicle type.");
            valid = false;
        }

        return valid;
    }

    function renderTicketResult(ticket) {
        const container = document.getElementById("checkin-ticket-result");
        if (!container) return;

        container.innerHTML = `
            <div class="result-card">
                <div class="result-card-header">
                    <h3 class="result-card-title">Ticket Issued</h3>
                    ${app.statusBadgeHtml(ticket.status)}
                </div>
                <dl class="detail-list">
                    <div class="detail-item">
                        <dt>Ticket Number</dt>
                        <dd class="mono">${app.escapeHtml(ticket.ticketNumber)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Vehicle Number</dt>
                        <dd>${app.escapeHtml(ticket.vehicleNumber)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Vehicle Type</dt>
                        <dd>${app.escapeHtml(ticket.vehicleType)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Allocated Spot</dt>
                        <dd>Floor ${app.escapeHtml(ticket.floorNumber)} · ${app.escapeHtml(ticket.spotNumber)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Entry Time</dt>
                        <dd>${app.formatDateTime(ticket.entryTime)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Status</dt>
                        <dd>${app.escapeHtml(ticket.status)}</dd>
                    </div>
                </dl>
                <div class="form-actions" style="margin-top: 16px;">
                    <button type="button" id="copy-ticket-btn" class="btn btn-sm btn-secondary">Copy Ticket #</button>
                    <button type="button" id="go-checkout-btn" class="btn btn-sm btn-outline">Check Out This Vehicle</button>
                </div>
            </div>
        `;

        const copyBtn = document.getElementById("copy-ticket-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(ticket.ticketNumber);
                    app.showToast("info", "Copied", `Copied ${ticket.ticketNumber} to clipboard.`);
                } catch {
                    app.showToast("info", "Ticket Number", ticket.ticketNumber);
                }
            });
        }

        const goCheckoutBtn = document.getElementById("go-checkout-btn");
        if (goCheckoutBtn) {
            goCheckoutBtn.addEventListener("click", () => {
                app.navigateTo("checkout", { skipLoad: true });
                if (global.SmartParking.checkout && typeof global.SmartParking.checkout.prefillTicket === "function") {
                    global.SmartParking.checkout.prefillTicket(ticket);
                }
            });
        }
    }

    async function handleCheckInSubmit(event) {
        event.preventDefault();

        const payload = {
            vehicleNumber: document.getElementById("checkin-vehicle-number").value.trim().toUpperCase(),
            ownerName: document.getElementById("checkin-owner-name").value.trim(),
            vehicleType: document.getElementById("checkin-vehicle-type").value
        };

        if (!validateCheckInForm(payload)) {
            return;
        }

        const submitBtn = document.getElementById("checkin-submit-btn");
        submitBtn.disabled = true;
        app.setLoading(true);

        try {
            const response = await api.checkIn(payload);
            const ticket = response.data;
            try {
                global.sessionStorage.setItem("sp_last_checkin_ticket", JSON.stringify(ticket));
            } catch {
                // Ignore storage quota errors
            }
            renderTicketResult(ticket);
            app.setApiOnlineStatus(true);
            app.updateLastSynced();
            app.showToast("success", "Check-in Complete", response.message || "Vehicle checked in successfully.");
            document.getElementById("checkin-form").reset();
        } catch (err) {
            if (err.status === 0) {
                app.setApiOnlineStatus(false);
            }
            if (err.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([field, msg]) => setFieldError(field, msg));
            }
            app.showToast("error", "Check-in Failed", err.message);
        } finally {
            submitBtn.disabled = false;
            app.setLoading(false);
        }
    }

    app.registerViewLoader("checkin", () => {
        clearFieldErrors();
        try {
            const saved = global.sessionStorage.getItem("sp_last_checkin_ticket");
            if (saved) {
                renderTicketResult(JSON.parse(saved));
            }
        } catch {
            // Ignore invalid cached data
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("checkin-form");
        if (form) {
            form.addEventListener("submit", handleCheckInSubmit);
            form.addEventListener("reset", clearFieldErrors);
        }
    });
})(window);
