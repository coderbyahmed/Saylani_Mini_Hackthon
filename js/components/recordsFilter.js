// ============================================================
// RECORDS FILTER — UI CONTROLLER
// Responsibility: Client-side search, status filtering, sorting,
// and filter reset. Operates on the already-loaded records array
// from recordsTable.js. No Firestore queries.
// ============================================================

import { getCachedRecords, renderRecords } from "./recordsTable.js";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let filterTimeout = null;

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  refs = {
    searchInput: document.getElementById("searchRecords"),
    statusFilter: document.getElementById("filterStatus"),
    sortSelect: document.getElementById("sortBy"),
    refreshBtn: document.querySelector(".toolbar > button:nth-of-type(1)"),
  };

  return refs;
};

// ============================================================
// PRIVATE — COMPARE TIMESTAMPS
// Handles Firestore Timestamp, Date, string, and seconds
// object formats. Returns a numeric difference for sorting.
// ============================================================

const getTime = (ts) => {
  if (!ts) return 0;
  if (typeof ts === "object" && typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "object" && typeof ts.seconds === "number") return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "string") return new Date(ts).getTime();
  return 0;
};

const compareTimestamps = (a, b) => getTime(a) - getTime(b);

// ============================================================
// PRIVATE — APPLY FILTERS
// Reads current filter controls, filters/sorts the cached
// records in memory, then renders the result.
// ============================================================

const applyFilters = () => {
  const r = cacheDOMRefs();
  const records = getCachedRecords();

  const searchTerm = (r.searchInput ? r.searchInput.value : "").trim().toLowerCase();
  const statusValue = r.statusFilter ? r.statusFilter.value : "";
  const sortValue = r.sortSelect ? r.sortSelect.value : "newest";

  // --------------------------------------------------
  // Filter
  // --------------------------------------------------

  let filtered = records;

  // Search — case-insensitive partial match on name, email, phone
  if (searchTerm) {
    filtered = filtered.filter((record) => {
      const name = (record.fullName || "").toLowerCase();
      const email = (record.email || "").toLowerCase();
      const phone = (record.phoneNumber || "").toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
    });
  }

  // Status — exact match (values are lowercase in HTML, records use capitalized)
  if (statusValue) {
    const target = statusValue.toLowerCase();
    filtered = filtered.filter((record) => {
      const status = (record.status || "").toLowerCase();
      return status === target;
    });
  }

  // --------------------------------------------------
  // Sort
  // --------------------------------------------------

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "newest":
        return compareTimestamps(b.createdAt, a.createdAt);
      case "oldest":
        return compareTimestamps(a.createdAt, b.createdAt);
      case "name-asc":
        return (a.fullName || "").localeCompare(b.fullName || "");
      case "name-desc":
        return (b.fullName || "").localeCompare(a.fullName || "");
      default:
        return 0;
    }
  });

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  if (filtered.length === 0) {
    renderRecords(filtered, {
      emptyTitle: "No matching records found",
      emptyDesc: "Try adjusting your search or filter criteria.",
    });
  } else {
    renderRecords(filtered);
  }
};

// ============================================================
// PRIVATE — RESET FILTERS
// Clears search input, resets status to "All Status" and sort
// to "Newest First", then re-renders the full record set.
// ============================================================

const resetFilters = () => {
  const r = cacheDOMRefs();

  if (r.searchInput) r.searchInput.value = "";
  if (r.statusFilter) r.statusFilter.value = "";
  if (r.sortSelect) r.sortSelect.value = "newest";

  applyFilters();
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  // Live search with debounce
  if (r.searchInput) {
    r.searchInput.addEventListener("input", () => {
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(applyFilters, 300);
    });
  }

  // Status filter
  if (r.statusFilter) {
    r.statusFilter.addEventListener("change", applyFilters);
  }

  // Sort
  if (r.sortSelect) {
    r.sortSelect.addEventListener("change", applyFilters);
  }

  // Refresh button — resets filter controls only, no Firestore call
  if (r.refreshBtn) {
    r.refreshBtn.addEventListener("click", resetFilters);
  }

  // Re-apply filters after CRUD operations to maintain current filter state
  document.addEventListener("record-added", () => {
    setTimeout(applyFilters, 0);
  });
};

// ============================================================
// INIT
// ============================================================

const initRecordsFilter = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.searchInput && !refs.statusFilter && !refs.sortSelect) return;

  setupEventListeners();
};

export { initRecordsFilter };
