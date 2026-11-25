(function (global) {
    "use strict";

    const { api, app } = global.SmartParking;

    function clearFieldErrors() {
        ["ticketNumber", "vehicleNumber", "paymentMode", "paymentStatus"].forEach((field) => {
            const errEl = document.getElementById(`err-checkout-${field}`);
            if (errEl) errEl.textContent = "";
        });
        document.querySelectorAll("#checkout-form .input-invalid").forEach((el) => {
            el.classList.remove("input-invalid");
        });
    }

    function setFieldError(field, message) {
        const errEl = document.getElementById(`err-checkout-${field}`);
        if (errEl) errEl.textContent = message;

        const inputMap = {
            ticketNumber: "checkout-ticket-number",
            vehicleNumber: "checkout-vehicle-number",
            paymentMode: "checkout-payment-mode",
            paymentStatus: "checkout-payment-status"
        };
        const inputEl = document.getElementById(inputMap[field]);
        if (inputEl) inputEl.classList.add("input-invalid");
    }

    function renderPreviewCard(ticket) {
        const card = document.getElementById("checkout-preview-card");
        if (!card) return;

        if (!ticket) {
            card.classList.add("hidden");
            card.innerHTML = "";
            return;
        }

        card.classList.remove("hidden");
        card.innerHTML = `
            <div class="result-card-header" style="margin-bottom: 8px; padding-bottom: 8px;">
                <strong style="color: var(--blue-900);">Parking Ticket Details</strong>
                ${app.statusBadgeHtml(ticket.status)}
            </div>
            <dl class="detail-list">
                <div class="detail-item">
                    <dt>Ticket #</dt>
                    <dd class="mono">${app.escapeHtml(ticket.ticketNumber)}</dd>
                </div>
                <div class="detail-item">
                    <dt>Vehicle</dt>
                    <dd>${app.escapeHtml(ticket.vehicleNumber)} (${app.escapeHtml(ticket.vehicleType)})</dd>
                </div>
                <div class="detail-item">
                    <dt>Spot</dt>
                    <dd>Floor ${app.escapeHtml(ticket.floorNumber)} · ${app.escapeHtml(ticket.spotNumber)}</dd>
                </div>
                <div class="detail-item">
                    <dt>Entry Time</dt>
                    <dd>${app.formatDateTime(ticket.entryTime)}</dd>
                </div>
            </dl>
        `;
    }

    function prefillTicket(ticket) {
        if (!ticket) return;
        clearFieldErrors();
        document.getElementById("checkout-ticket-number").value = ticket.ticketNumber || "";
        document.getElementById("checkout-vehicle-number").value = ticket.vehicleNumber || "";
        renderPreviewCard(ticket);
    }

    async function prefillFromTicketNumber(ticketNumber) {
        await loadActiveTicketsDropdown();
        await lookupTicket(ticketNumber);
    }

    async function lookupTicket(rawQuery) {
        const query = (rawQuery || "").trim();
        if (!query) {
            app.showToast("info", "Lookup", "Enter a ticket number or vehicle registration number.");
            return;
        }

        app.setLoading(true);
        try {
            let ticket = null;
            if (query.toUpperCase().startsWith("TKT-")) {
                const res = await api.getTicketByNumber(query);
                ticket = res.data;
            } else {
                const res = await api.getTickets({ vehicleNumber: query, status: "ACTIVE" });
                const list = res.data || [];
                if (list.length === 0) {
                    throw new api.ApiError(`No active ticket found for vehicle number ${query}.`, 404);
                }
                ticket = list[0];
            }

            prefillTicket(ticket);
            if (ticket.status !== "ACTIVE") {
                app.showToast("info", "Ticket Status", `Ticket ${ticket.ticketNumber} is already ${ticket.status}.`);
            } else {
                app.showToast("success", "Ticket Found", `Loaded active ticket ${ticket.ticketNumber}.`);
            }
            app.setApiOnlineStatus(true);
        } catch (err) {
            if (err.status === 0) app.setApiOnlineStatus(false);
            renderPreviewCard(null);
            app.showToast("error", "Lookup Failed", err.message);
        } finally {
            app.setLoading(false);
        }
    }

    async function loadActiveTicketsDropdown() {
        const select = document.getElementById("checkout-active-select");
        if (!select) return;

        try {
            const res = await api.getTickets({ status: "ACTIVE" });
            const activeTickets = res.data || [];
            app.state.tickets = activeTickets;

            const options = [`<option value="">-- Select an active ticket (${activeTickets.length}) --</option>`];
            activeTickets.forEach((t) => {
                options.push(
                    `<option value="${app.escapeHtml(t.ticketNumber)}">${app.escapeHtml(t.vehicleNumber)} · ${app.escapeHtml(t.ticketNumber)} (Floor ${app.escapeHtml(t.floorNumber)} ${app.escapeHtml(t.spotNumber)})</option>`
                );
            });
            select.innerHTML = options.join("");
            app.setApiOnlineStatus(true);
        } catch (err) {
            if (err.status === 0) app.setApiOnlineStatus(false);
        }
    }

    function validateCheckOutForm(values) {
        clearFieldErrors();
        let valid = true;

        if (!values.ticketNumber) {
            setFieldError("ticketNumber", "Ticket number is required.");
            valid = false;
        }
        if (!values.vehicleNumber) {
            setFieldError("vehicleNumber", "Vehicle number is required.");
            valid = false;
        }
        if (!values.paymentMode) {
            setFieldError("paymentMode", "Please select a payment mode.");
            valid = false;
        }
        if (!values.paymentStatus) {
            setFieldError("paymentStatus", "Please select a payment status.");
            valid = false;
        }

        return valid;
    }

    function renderCheckoutResult(payment, updatedTicket) {
        const container = document.getElementById("checkout-result");
        if (!container) return;

        const entryTime = updatedTicket ? updatedTicket.entryTime : null;
        const exitTime = updatedTicket ? updatedTicket.exitTime : null;
        const ticketStatus = updatedTicket ? updatedTicket.status : "COMPLETED";
        const spotInfo = updatedTicket
            ? `Floor ${app.escapeHtml(updatedTicket.floorNumber)} · ${app.escapeHtml(updatedTicket.spotNumber)}`
            : "—";

        const spotReleasedNote = payment.paymentStatus === "SUCCESS"
            ? "Parking spot has been released and is now AVAILABLE."
            : "Payment was not SUCCESS, so the parking spot was not released.";

        container.innerHTML = `
            <div class="result-card">
                <div class="result-card-header">
                    <h3 class="result-card-title">Payment &amp; Check-out Receipt</h3>
                    ${app.statusBadgeHtml(payment.paymentStatus)}
                </div>
                <dl class="detail-list">
                    <div class="detail-item">
                        <dt>Ticket Number</dt>
                        <dd class="mono">${app.escapeHtml(payment.ticketNumber)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Ticket Status</dt>
                        <dd>${app.statusBadgeHtml(ticketStatus)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Parking Spot</dt>
                        <dd>${spotInfo}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Total Charge</dt>
                        <dd class="amount-highlight">${app.formatCurrency(payment.amount)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Entry Time</dt>
                        <dd>${app.formatDateTime(entryTime)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Exit Time</dt>
                        <dd>${app.formatDateTime(exitTime)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Payment Mode</dt>
                        <dd>${app.escapeHtml(payment.paymentMode)}</dd>
                    </div>
                    <div class="detail-item">
                        <dt>Paid At</dt>
                        <dd>${app.formatDateTime(payment.paidAt)}</dd>
                    </div>
                </dl>
                <p style="margin: 14px 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                    ${app.escapeHtml(spotReleasedNote)}
                </p>
            </div>
        `;
    }

    async function handleCheckOutSubmit(event) {
        event.preventDefault();

        const payload = {
            ticketNumber: document.getElementById("checkout-ticket-number").value.trim(),
            vehicleNumber: document.getElementById("checkout-vehicle-number").value.trim().toUpperCase(),
            paymentMode: document.getElementById("checkout-payment-mode").value,
            paymentStatus: document.getElementById("checkout-payment-status").value
        };

        if (!validateCheckOutForm(payload)) {
            return;
        }

        const submitBtn = document.getElementById("checkout-submit-btn");
        submitBtn.disabled = true;
        app.setLoading(true);

        try {
            const response = await api.checkOut(payload);
            const payment = response.data;

            let updatedTicket = null;
            try {
                const ticketRes = await api.getTicketByNumber(payment.ticketNumber || payload.ticketNumber);
                updatedTicket = ticketRes.data;
            } catch {
                // Keep receipt rendering even if secondary ticket fetch fails
            }

            renderCheckoutResult(payment, updatedTicket);
            try {
                global.sessionStorage.setItem(
                    "sp_last_checkout_receipt",
                    JSON.stringify({ payment, updatedTicket })
                );
            } catch {
                // Ignore storage quota errors
            }
            app.setApiOnlineStatus(true);
            app.updateLastSynced();
            app.showToast("success", "Check-out Complete", response.message || "Vehicle checked out successfully.");

            document.getElementById("checkout-form").reset();
            renderPreviewCard(null);
            await loadActiveTicketsDropdown();
        } catch (err) {
            if (err.status === 0) {
                app.setApiOnlineStatus(false);
            }
            if (err.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([field, msg]) => setFieldError(field, msg));
            }
            app.showToast("error", "Check-out Failed", err.message);
        } finally {
            submitBtn.disabled = false;
            app.setLoading(false);
        }
    }

    app.registerViewLoader("checkout", async () => {
        try {
            const saved = global.sessionStorage.getItem("sp_last_checkout_receipt");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.payment) {
                    renderCheckoutResult(parsed.payment, parsed.updatedTicket);
                }
            }
        } catch {
            // Ignore invalid cached data
        }
        await loadActiveTicketsDropdown();
    });

    document.addEventListener("DOMContentLoaded", () => {

        const lookupBtn = document.getElementById("checkout-lookup-btn");
        const lookupInput = document.getElementById("checkout-lookup-input");
        if (lookupBtn && lookupInput) {
            lookupBtn.addEventListener("click", () => lookupTicket(lookupInput.value));
            lookupInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    lookupTicket(lookupInput.value);
                }
            });
        }

        const activeSelect = document.getElementById("checkout-active-select");
        if (activeSelect) {
            activeSelect.addEventListener("change", () => {
                if (activeSelect.value) {
                    const selected = (app.state.tickets || []).find((t) => t.ticketNumber === activeSelect.value);
                    if (selected) {
                        prefillTicket(selected);
                    } else {
                        lookupTicket(activeSelect.value);
                    }
                }
            });
        }

        const form = document.getElementById("checkout-form");
        if (form) {
            form.addEventListener("submit", handleCheckOutSubmit);
            form.addEventListener("reset", () => {
                clearFieldErrors();
                renderPreviewCard(null);
            });
        }
    });

    global.SmartParking = global.SmartParking || {};
    global.SmartParking.checkout = {
        prefillTicket,
        prefillFromTicketNumber
    };
})(window);
