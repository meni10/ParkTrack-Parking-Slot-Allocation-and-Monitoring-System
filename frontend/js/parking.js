(function (global) {
    "use strict";

    const { api, app } = global.SmartParking;

    function populateFloorFilter(floors) {
        const select = document.getElementById("filter-floor");
        if (!select) {
            return;
        }
        const previous = select.value || "ALL";
        const options = [`<option value="ALL">All Floors</option>`];
        (floors || []).forEach((floor) => {
            options.push(
                `<option value="${app.escapeHtml(floor.floorNumber)}">Floor ${app.escapeHtml(floor.floorNumber)} - ${app.escapeHtml(floor.floorName)}</option>`
            );
        });
        select.innerHTML = options.join("");
        if ([...select.options].some((o) => o.value === previous)) {
            select.value = previous;
        }
    }

    function renderFloors() {
        const container = document.getElementById("floors-container");
        if (!container) {
            return;
        }

        const overview = app.state.spotsOverview;
        if (!overview || !Array.isArray(overview.floors) || overview.floors.length === 0) {
            container.innerHTML = `<p class="empty-state">No parking floors found in the database.</p>`;
            return;
        }

        const floorFilter = document.getElementById("filter-floor").value;
        const statusFilter = document.getElementById("filter-spot-status").value;
        const typeFilter = document.getElementById("filter-spot-type").value;

        const filteredFloors = overview.floors.filter((floor) => {
            return floorFilter === "ALL" || String(floor.floorNumber) === String(floorFilter);
        });

        const html = filteredFloors
            .map((floor) => {
                const allSpots = floor.spots || [];
                const matchingSpots = allSpots.filter((spot) => {
                    const statusMatch = statusFilter === "ALL" || spot.status === statusFilter;
                    const typeMatch = typeFilter === "ALL" || spot.spotType === typeFilter;
                    return statusMatch && typeMatch;
                });

                const availableCount = allSpots.filter((s) => s.status === "AVAILABLE").length;
                const occupiedCount = allSpots.filter((s) => s.status === "OCCUPIED").length;

                const spotsHtml = matchingSpots.length > 0
                    ? `<div class="spots-grid">
                        ${matchingSpots
                            .map((spot) => {
                                const statusClass = `spot-${String(spot.status || "").toLowerCase()}`;
                                return `
                                    <div class="spot-tile ${app.escapeHtml(statusClass)}" title="Spot ${app.escapeHtml(spot.spotNumber)} (${app.escapeHtml(spot.spotType)}) - ${app.escapeHtml(spot.status)}">
                                        <span class="spot-number">${app.escapeHtml(spot.spotNumber)}</span>
                                        <span class="spot-type">${app.escapeHtml(spot.spotType)}</span>
                                        <span class="spot-status-text">${app.escapeHtml(spot.status)}</span>
                                    </div>
                                `;
                            })
                            .join("")}
                       </div>`
                    : `<p class="empty-state">No spots match the selected filters on this floor.</p>`;

                return `
                    <article class="floor-card">
                        <div class="floor-header">
                            <div class="floor-title-group">
                                <h3 class="floor-title">Floor ${app.escapeHtml(floor.floorNumber)}: ${app.escapeHtml(floor.floorName)}</h3>
                                ${app.statusBadgeHtml(floor.status)}
                            </div>
                            <span class="floor-meta">
                                ${allSpots.length} total · ${availableCount} available · ${occupiedCount} occupied
                            </span>
                        </div>
                        ${spotsHtml}
                    </article>
                `;
            })
            .join("");

        container.innerHTML = html || `<p class="empty-state">No floors match the current filter.</p>`;
    }

    async function loadParkingManagement() {
        app.setLoading(true);
        try {
            const response = await api.getSpotsOverview();
            app.state.spotsOverview = response.data;
            populateFloorFilter(response.data ? response.data.floors : []);
            renderFloors();
            app.setApiOnlineStatus(true);
            app.updateLastSynced();
        } catch (err) {
            app.setApiOnlineStatus(false);
            app.showToast("error", "Parking Load Error", err.message);
        } finally {
            app.setLoading(false);
        }
    }

    app.registerViewLoader("parking", loadParkingManagement);

    document.addEventListener("DOMContentLoaded", () => {
        ["filter-floor", "filter-spot-status", "filter-spot-type"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", renderFloors);
            }
        });
    });
})(window);
