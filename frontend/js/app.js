(function (global) {
    "use strict";

    const VIEW_METADATA = {
        dashboard: {
            title: "Dashboard",
            subtitle: "Real-time parking capacity and operations overview"
        },
        parking: {
            title: "Parking Management",
            subtitle: "Parking floors and live individual spot status grid"
        },
        checkin: {
            title: "Vehicle Check-in",
            subtitle: "Register a vehicle and allocate an available spot"
        },
        checkout: {
            title: "Vehicle Check-out",
            subtitle: "Calculate parking fee, record payment, and release spot"
        },
        history: {
            title: "Parking History",
            subtitle: "Browse and filter recorded parking tickets"
        }
    };

    const state = {
        currentView: "dashboard",
        spotsOverview: null,
        availability: null,
        tickets: []
    };

    const viewLoaders = {};
    let activeLoadCount = 0;

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDateTime(isoString) {
        if (!isoString) {
            return "—";
        }
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return escapeHtml(isoString);
        }
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    function formatCurrency(amount) {
        if (amount === null || amount === undefined) {
            return "—";
        }
        const numeric = Number(amount);
        if (Number.isNaN(numeric)) {
            return escapeHtml(amount);
        }
        return `₹${numeric.toFixed(2)}`;
    }

    function statusBadgeHtml(status) {
        const normalized = String(status || "").toUpperCase();
        const classMap = {
            ACTIVE: "badge-blue",
            AVAILABLE: "badge-green",
            SUCCESS: "badge-green",
            COMPLETED: "badge-green",
            OCCUPIED: "badge-red",
            FAILED: "badge-red",
            LOST: "badge-red",
            RESERVED: "badge-amber",
            PENDING: "badge-amber",
            MAINTENANCE: "badge-amber",
            OUT_OF_SERVICE: "badge-slate",
            INACTIVE: "badge-slate",
            REFUNDED: "badge-slate"
        };
        const badgeClass = classMap[normalized] || "badge-slate";
        return `<span class="badge ${badgeClass}">${escapeHtml(normalized || "UNKNOWN")}</span>`;
    }

    function setLoading(isLoading) {
        const loader = document.getElementById("global-loader");
        if (!loader) {
            return;
        }
        if (isLoading) {
            activeLoadCount += 1;
        } else {
            activeLoadCount = Math.max(0, activeLoadCount - 1);
        }
        loader.classList.toggle("hidden", activeLoadCount === 0);
    }

    function setApiOnlineStatus(isOnline) {
        const dot = document.getElementById("api-status-indicator");
        const text = document.getElementById("api-status-text");
        if (!dot || !text) {
            return;
        }
        dot.classList.remove("status-checking", "status-online", "status-offline");
        if (isOnline) {
            dot.classList.add("status-online");
            text.textContent = "Backend Connected";
        } else {
            dot.classList.add("status-offline");
            text.textContent = "Backend Offline";
        }
    }

    function updateLastSynced() {
        const label = document.getElementById("last-updated");
        if (label) {
            label.textContent = `Synced ${new Date().toLocaleTimeString()}`;
        }
    }

    function showToast(type, title, message) {
        const container = document.getElementById("toast-container");
        if (!container) {
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type || "info"}`;
        toast.innerHTML = `
            <div>
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
        `;

        const dismiss = () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        };

        toast.querySelector(".toast-close").addEventListener("click", dismiss);
        container.appendChild(toast);
        setTimeout(dismiss, 5000);
    }

    function closeMobileSidebar() {
        const sidebar = document.getElementById("sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        const toggle = document.getElementById("menu-toggle");
        if (sidebar) sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("visible");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    function registerViewLoader(viewName, loaderFn) {
        viewLoaders[viewName] = loaderFn;
    }

    async function refreshCurrentView() {
        const loader = viewLoaders[state.currentView];
        if (typeof loader === "function") {
            await loader();
        }
    }

    function getInitialViewFromHash() {
        const hashView = (global.location.hash || "").replace(/^#/, "").trim();
        return VIEW_METADATA[hashView] ? hashView : "dashboard";
    }

    function navigateTo(viewName, options = {}) {
        const targetView = VIEW_METADATA[viewName] ? viewName : "dashboard";
        state.currentView = targetView;

        if (!options.skipHash && global.location.hash !== `#${targetView}`) {
            global.history.replaceState(null, "", `#${targetView}`);
        }

        document.querySelectorAll(".nav-item").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === targetView);
        });

        document.querySelectorAll(".view-section").forEach((section) => {
            section.classList.toggle("active", section.id === `view-${targetView}`);
        });

        const titleEl = document.getElementById("page-title");
        const subtitleEl = document.getElementById("page-subtitle");
        if (titleEl) titleEl.textContent = VIEW_METADATA[targetView].title;
        if (subtitleEl) subtitleEl.textContent = VIEW_METADATA[targetView].subtitle;

        closeMobileSidebar();

        if (!options.skipLoad) {
            refreshCurrentView();
        }
    }

    function bindGlobalEvents() {
        document.querySelectorAll(".nav-item").forEach((btn) => {
            btn.addEventListener("click", () => navigateTo(btn.dataset.view));
        });

        document.addEventListener("click", (event) => {
            const navTrigger = event.target.closest("[data-nav]");
            if (navTrigger) {
                navigateTo(navTrigger.dataset.nav);
            }
        });

        global.addEventListener("hashchange", () => {
            const hashView = getInitialViewFromHash();
            if (hashView !== state.currentView) {
                navigateTo(hashView, { skipHash: true });
            }
        });

        const menuToggle = document.getElementById("menu-toggle");
        const sidebar = document.getElementById("sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (menuToggle && sidebar && backdrop) {
            menuToggle.addEventListener("click", () => {
                const isOpen = sidebar.classList.toggle("open");
                backdrop.classList.toggle("visible", isOpen);
                menuToggle.setAttribute("aria-expanded", String(isOpen));
            });
            backdrop.addEventListener("click", closeMobileSidebar);
        }

        const refreshBtn = document.getElementById("refresh-btn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", refreshCurrentView);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindGlobalEvents();
        // Run after all deferred module DOMContentLoaded listeners have registered their view loaders
        global.setTimeout(() => {
            navigateTo(getInitialViewFromHash(), { skipHash: true });
        }, 0);
    });

    global.SmartParking = global.SmartParking || {};
    global.SmartParking.app = {
        state,
        escapeHtml,
        formatDateTime,
        formatCurrency,
        statusBadgeHtml,
        setLoading,
        setApiOnlineStatus,
        updateLastSynced,
        showToast,
        registerViewLoader,
        refreshCurrentView,
        navigateTo
    };
})(window);
