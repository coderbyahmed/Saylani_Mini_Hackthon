// ============================================================
// ASSETS TABLE — UI CONTROLLER
// Responsibility: Fetch assets from Firestore and render the
// assets table. Handles loading, empty, and error states.
// No business logic, no Firestore queries, no Firebase calls.
// ============================================================

import { fetchAssets } from "../dashboard/dashboardService.js";
import { showErrorToast } from "../ui/toast.js";

// ============================================================
// CONSTANTS
// ============================================================

const TBODY_SELECTOR = "#recordsBody";
const LOADER_SELECTOR = "#tableLoader";
const EMPTY_SELECTOR = "#tableEmpty";
const TABLE_SELECTOR = "#recordsTable";
const HEADING_SELECTOR = "#table-heading";
const EMPTY_ADD_BTN_SELECTOR = "#emptyAddRecordBtn";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let allAssets = [];
let fullDataSet = [];

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  refs = {
    tbody: document.querySelector(TBODY_SELECTOR),
    loader: document.querySelector(LOADER_SELECTOR),
    empty: document.querySelector(EMPTY_SELECTOR),
    table: document.querySelector(TABLE_SELECTOR),
    heading: document.querySelector(HEADING_SELECTOR),
    emptyAddBtn: document.querySelector(EMPTY_ADD_BTN_SELECTOR),
  };

  return refs;
};

// ============================================================
// PRIVATE — FORMAT TIMESTAMP
// Converts a Firestore Timestamp or date string to a readable
// format like "10 Jul 2026".
// ============================================================

const formatDate = (timestamp) => {
  if (!timestamp) return "—";

  try {
    let date;

    if (typeof timestamp === "object" && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "—";
    }

    if (isNaN(date.getTime())) return "—";

    const day = date.getDate().toString().padStart(2, "0");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return "—";
  }
};

// ============================================================
// PRIVATE — GET INITIALS
// Extracts initials from a name for the avatar fallback.
// ============================================================

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================
// PRIVATE — BUILD STATUS BADGE CLASS
// Returns the appropriate CSS class for a status value.
// ============================================================

const getBadgeClass = (status) => {
  switch (status) {
    case "Active":
      return "status-badge status-active";
    case "Inactive":
      return "status-badge status-inactive";
    case "Pending":
      return "status-badge status-pending";
    case "Archived":
      return "status-badge status-archived";
    default:
      return "status-badge";
  }
};

// ============================================================
// PRIVATE — BUILD TABLE ROW
// Creates a single <tr> element from an asset object.
// ============================================================

const buildRow = (asset) => {
  const tr = document.createElement("tr");
  tr.dataset.recordId = asset.id;

  const initials = getInitials(asset.assetName);
  const imageHtml = asset.assetImageUrl
    ? `<img src="${asset.assetImageUrl}" alt="${asset.assetName}" class="table-avatar-img" />`
    : `<span class="table-avatar" aria-hidden="true">${initials}</span>`;

  const statusClass = getBadgeClass(asset.status);

  tr.innerHTML = `
    <td>${imageHtml}</td>
    <td>${asset.assetName || "—"}</td>
    <td><span class="td-asset-id">${asset.assetId || "—"}</span></td>
    <td>${asset.category || "—"}</td>
    <td><span class="${statusClass}">${asset.status || "—"}</span></td>
    <td>
      <div class="action-buttons">
        <button type="button" class="view-btn" aria-label="View">View</button>
        <button type="button" class="edit-btn" aria-label="Edit">Edit</button>
        <button type="button" class="delete-btn" aria-label="Delete">Delete</button>
      </div>
    </td>
  `;

  return tr;
};

// ============================================================
// PRIVATE — RENDER ASSETS
// Clears the tbody and appends rows for each asset.
// Updates the heading with the asset count.
// ============================================================

const renderAssets = (assets, options = {}) => {
  const { tbody, heading, table, empty, loader } = cacheDOMRefs();

  if (!tbody) return;

  tbody.innerHTML = "";

  if (assets.length === 0) {
    if (table) table.hidden = true;
    if (empty) {
      empty.hidden = false;
      const title = empty.querySelector("h3");
      const desc = empty.querySelector("p");
      if (title) title.textContent = options.emptyTitle || "No assets found";
      if (desc) desc.textContent = options.emptyDesc || "Add your first asset to get started.";
    }
    if (loader) loader.hidden = true;
    if (heading) heading.textContent = options.headingText || "All Assets";
    document.dispatchEvent(new CustomEvent("records-updated", { detail: { records: [] } }));
    return;
  }

  assets.forEach((asset) => {
    const row = buildRow(asset);
    tbody.appendChild(row);
  });

  if (table) table.hidden = false;
  if (empty) empty.hidden = true;
  if (loader) loader.hidden = true;
  if (heading) heading.textContent = options.headingText || `All Assets (${assets.length})`;

  document.dispatchEvent(new CustomEvent("records-updated", { detail: { records: assets } }));
};

// ============================================================
// PRIVATE — HANDLE LOAD ERROR
// Shows the empty state with an error message when fetching
// assets fails.
// ============================================================

const handleLoadError = (message) => {
  const { table, empty, loader, heading } = cacheDOMRefs();

  if (table) table.hidden = true;
  if (loader) loader.hidden = true;

  if (empty) {
    empty.hidden = false;
    const title = empty.querySelector("h3");
    const desc = empty.querySelector("p");
    if (title) title.textContent = "Failed to load assets";
    if (desc) desc.textContent = message || "An error occurred while fetching assets. Please try again.";
  }

  if (heading) heading.textContent = "All Assets";

  showErrorToast(message || "Failed to load assets.");
};

// ============================================================
// PUBLIC — LOAD AND RENDER
// Fetches assets from Firestore and renders the table.
// Shows loader during fetch, empty state if no assets.
// Can be called externally to refresh the table.
// ============================================================

const loadAndRender = async () => {
  const { loader, table, empty, heading } = cacheDOMRefs();

  if (loader) loader.hidden = false;
  if (table) table.hidden = true;
  if (empty) empty.hidden = true;
  if (heading) heading.textContent = "All Assets";

  try {

    const assets = await fetchAssets();
    allAssets = assets;
    fullDataSet = assets;
    document.dispatchEvent(new CustomEvent("records-updated", { detail: { records: assets } }));
    renderAssets(assets);

  } catch (error) {

    handleLoadError(error.message);

  }
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const { emptyAddBtn } = cacheDOMRefs();

  if (emptyAddBtn) {
    emptyAddBtn.addEventListener("click", () => {
      const addBtn = document.querySelector("#addRecordBtn");
      if (addBtn) addBtn.click();
    });
  }

  document.addEventListener("record-added", loadAndRender);
};

// ============================================================
// INIT
// ============================================================

const initAssetsTable = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();
  setupEventListeners();
  loadAndRender();
};

// ============================================================
// PUBLIC — GET CACHED ASSETS
// Returns the in-memory assets array (no Firestore query).
// Used by the filter module for client-side filtering.
// ============================================================

const getCachedRecords = () => allAssets;

const getFullDataSet = () => fullDataSet;

export { initAssetsTable, loadAndRender as refreshAssetsTable, renderAssets, getCachedRecords, getFullDataSet };
