// ============================================================
// DASHBOARD STATS — UI CONTROLLER
// Responsibility: Render the four overview stat cards (Total,
// Active, Pending, Archived) from a single Firestore fetch.
// Reuses in-memory cached assets when available.
// No business logic, no Firestore queries of its own beyond
// the initial load if cache is empty.
// ============================================================

import { getFullDataSet } from "./assetsTable.js";
import { fetchAssets } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const CARD_IDS = {
  total: "cardTotalRecords",
  active: "cardActiveRecords",
  pending: "cardPendingRecords",
  archived: "cardArchivedRecords",
};

// ============================================================
// STATE
// ============================================================

let initialized = false;

// ============================================================
// PRIVATE — UPDATE CARDS
// Accepts the full assets array, computes the four counts,
// and updates the DOM stat-value elements.
// ============================================================

const updateCards = (records) => {
  const totalEl = document.getElementById(CARD_IDS.total);
  const activeEl = document.getElementById(CARD_IDS.active);
  const pendingEl = document.getElementById(CARD_IDS.pending);
  const archivedEl = document.getElementById(CARD_IDS.archived);

  const total = records.length;
  const active = records.filter((r) => r.status === "Active").length;
  const pending = records.filter((r) => r.status === "Pending").length;
  const archived = records.filter((r) => r.status === "Archived").length;

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (activeEl) activeEl.textContent = active.toLocaleString();
  if (pendingEl) pendingEl.textContent = pending.toLocaleString();
  if (archivedEl) archivedEl.textContent = archived.toLocaleString();
};

// ============================================================
// PRIVATE — LOAD COUNTS
// Reads from the in-memory cache if available, otherwise
// performs a single Firestore fetch.
// ============================================================

const loadCounts = async () => {
  let records = getFullDataSet();

  if (records.length === 0) {
    try {
      records = await fetchAssets();
    } catch (error) {
      console.error("DashboardStats: fetch failed —", error.message);
      return;
    }
  }

  updateCards(records);
};

// ============================================================
// PRIVATE — HANDLE ASSETS UPDATED
// ============================================================

const onRecordsUpdated = () => {
  const records = getFullDataSet();
  if (records.length > 0) {
    updateCards(records);
  }
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  document.addEventListener("records-updated", onRecordsUpdated);
};

// ============================================================
// INIT
// ============================================================

const initDashboardStats = () => {
  if (initialized) return;
  initialized = true;

  loadCounts();
  setupEventListeners();
};

export { initDashboardStats };
