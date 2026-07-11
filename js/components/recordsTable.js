// ============================================================
// RECORDS TABLE — UI CONTROLLER
// Responsibility: Fetch records from Firestore and render the
// records table. Handles loading, empty, and error states.
// No business logic, no Firestore queries, no Firebase calls.
// ============================================================

import { fetchRecords } from "../dashboard/dashboardService.js";
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
let allRecords = [];
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
// Extracts initials from a full name for the avatar fallback.
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
// Creates a single <tr> element from a record object.
// ============================================================

const buildRow = (record) => {
  const tr = document.createElement("tr");
  tr.dataset.recordId = record.id;

  const initials = getInitials(record.fullName);
  const imageHtml = record.profileImageUrl
    ? `<img src="${record.profileImageUrl}" alt="${record.fullName}" class="table-avatar-img" />`
    : `<span class="table-avatar" aria-hidden="true">${initials}</span>`;

  const statusClass = getBadgeClass(record.status);

  tr.innerHTML = `
    <td>${imageHtml}</td>
    <td>${record.fullName || "—"}</td>
    <td class="td-email"><span>${record.email || "—"}</span></td>
    <td class="td-phone">${record.phoneNumber || "—"}</td>
    <td><span class="${statusClass}">${record.status || "—"}</span></td>
    <td>${formatDate(record.createdAt)}</td>
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
// PRIVATE — RENDER RECORDS
// Clears the tbody and appends rows for each record.
// Updates the heading with the record count.
// ============================================================

const renderRecords = (records, options = {}) => {
  const { tbody, heading, table, empty, loader } = cacheDOMRefs();

  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = "";

  if (records.length === 0) {
    // Show empty state, hide table and loader
    if (table) table.hidden = true;
    if (empty) {
      empty.hidden = false;
      const title = empty.querySelector("h3");
      const desc = empty.querySelector("p");
      if (title) title.textContent = options.emptyTitle || "No records found";
      if (desc) desc.textContent = options.emptyDesc || "Add your first record to get started.";
    }
    if (loader) loader.hidden = true;
    if (heading) heading.textContent = options.headingText || "All Records";
    document.dispatchEvent(new CustomEvent("records-updated", { detail: { records: [] } }));
    return;
  }

  // Render rows
  records.forEach((record) => {
    const row = buildRow(record);
    tbody.appendChild(row);
  });

  // Show table, hide empty state and loader
  if (table) table.hidden = false;
  if (empty) empty.hidden = true;
  if (loader) loader.hidden = true;
  if (heading) heading.textContent = options.headingText || `All Records (${records.length})`;

  // Notify pagination when the rendered dataset changes
  document.dispatchEvent(new CustomEvent("records-updated", { detail: { records } }));
};

// ============================================================
// PRIVATE — HANDLE LOAD ERROR
// Shows the empty state with an error message when fetching
// records fails.
// ============================================================

const handleLoadError = (message) => {
  const { table, empty, loader, heading } = cacheDOMRefs();

  if (table) table.hidden = true;
  if (loader) loader.hidden = true;

  if (empty) {
    empty.hidden = false;
    const title = empty.querySelector("h3");
    const desc = empty.querySelector("p");
    if (title) title.textContent = "Failed to load records";
    if (desc) desc.textContent = message || "An error occurred while fetching records. Please try again.";
  }

  if (heading) heading.textContent = "All Records";

  showErrorToast(message || "Failed to load records.");
};

// ============================================================
// PUBLIC — LOAD AND RENDER
// Fetches records from Firestore and renders the table.
// Shows loader during fetch, empty state if no records.
// Can be called externally to refresh the table.
// ============================================================

const loadAndRender = async () => {
  const { loader, table, empty, heading } = cacheDOMRefs();

  // Show loader, hide table and empty state
  if (loader) loader.hidden = false;
  if (table) table.hidden = true;
  if (empty) empty.hidden = true;
  if (heading) heading.textContent = "All Records";

  try {

    const records = await fetchRecords();
    allRecords = records;
    fullDataSet = records;
    // Dispatch event so pagination can take over the render
    document.dispatchEvent(new CustomEvent("records-updated", { detail: { records } }));

  } catch (error) {

    handleLoadError(error.message);

  }
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const { emptyAddBtn } = cacheDOMRefs();

  // Empty state "Add Record" button triggers the existing modal
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener("click", () => {
      const addBtn = document.querySelector("#addRecordBtn");
      if (addBtn) addBtn.click();
    });
  }

  // Listen for record-added event to refresh the table
  document.addEventListener("record-added", loadAndRender);
};

// ============================================================
// INIT
// ============================================================

const initRecordsTable = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();
  setupEventListeners();
  loadAndRender();
};

// ============================================================
// PUBLIC — GET CACHED RECORDS
// Returns the in-memory records array (no Firestore query).
// Used by the filter module for client-side filtering.
// ============================================================

const getCachedRecords = () => allRecords;

const getFullDataSet = () => fullDataSet;

export { initRecordsTable, loadAndRender as refreshRecordsTable, renderRecords, getCachedRecords, getFullDataSet };
