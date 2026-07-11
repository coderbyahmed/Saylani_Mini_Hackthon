// ============================================================
// DASHBOARD CARD — UI CONTROLLER
// Responsibility: Render the four overview stat cards (Total,
// Active, Pending, Archived) from a single Firestore fetch.
// Reuses in-memory cached records when available.
// No business logic, no Firestore queries of its own beyond
// the initial load if cache is empty.
// ============================================================

import { getFullDataSet } from "./recordsTable.js";
import { fetchRecords } from "../dashboard/dashboardService.js";

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
// Accepts the full records array, computes the four counts,
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
// performs a single Firestore fetch. Falls back gracefully
// on error without crashing the dashboard.
// ============================================================

const loadCounts = async () => {
  let records = getFullDataSet();

  if (records.length === 0) {
    try {
      records = await fetchRecords();
    } catch (error) {
      console.error("DashboardCard: fetch failed —", error.message);
      return;
    }
  }

  updateCards(records);
};

// ============================================================
// PRIVATE — HANDLE RECORDS UPDATED
// Reads from the full in-memory dataset (which is refreshed
// by recordsTable on every CRUD operation).
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

const initDashboardCard = () => {
  if (initialized) return;
  initialized = true;

  loadCounts();
  setupEventListeners();
};

export { initDashboardCard };
