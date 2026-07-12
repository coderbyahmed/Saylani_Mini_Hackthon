// ============================================================
// ASSETS FILTER — UI CONTROLLER
// Responsibility: Client-side search, status filtering, category
// filtering, sorting, and filter reset. Operates on the already-
// loaded assets array from assetsTable.js. No Firestore queries.
// ============================================================

import { getCachedRecords, renderAssets } from "./assetsTable.js";

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
    categoryFilter: document.getElementById("filterCategory"),
    sortSelect: document.getElementById("sortBy"),
    refreshBtn: document.querySelector(".toolbar > button:nth-of-type(1)"),
  };

  return refs;
};

// ============================================================
// PRIVATE — COMPARE TIMESTAMPS
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
// ============================================================

const applyFilters = () => {
  const r = cacheDOMRefs();
  const records = getCachedRecords();

  const searchTerm = (r.searchInput ? r.searchInput.value : "").trim().toLowerCase();
  const statusValue = r.statusFilter ? r.statusFilter.value : "";
  const categoryValue = r.categoryFilter ? r.categoryFilter.value : "";
  const sortValue = r.sortSelect ? r.sortSelect.value : "newest";

  let filtered = records;

  if (searchTerm) {
    filtered = filtered.filter((record) => {
      const name = (record.assetName || "").toLowerCase();
      const assetId = (record.assetId || "").toLowerCase();
      const category = (record.category || "").toLowerCase();
      const location = (record.location || "").toLowerCase();
      return (
        name.includes(searchTerm) ||
        assetId.includes(searchTerm) ||
        category.includes(searchTerm) ||
        location.includes(searchTerm)
      );
    });
  }

  if (statusValue) {
    const target = statusValue.toLowerCase();
    filtered = filtered.filter((record) => {
      const status = (record.status || "").toLowerCase();
      return status === target;
    });
  }

  if (categoryValue) {
    const target = categoryValue.toLowerCase();
    filtered = filtered.filter((record) => {
      const category = (record.category || "").toLowerCase();
      return category === target;
    });
  }

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "newest":
        return compareTimestamps(b.createdAt, a.createdAt);
      case "oldest":
        return compareTimestamps(a.createdAt, b.createdAt);
      case "name-asc":
        return (a.assetName || "").localeCompare(b.assetName || "");
      case "name-desc":
        return (b.assetName || "").localeCompare(a.assetName || "");
      default:
        return 0;
    }
  });

  if (filtered.length === 0) {
    renderAssets(filtered, {
      emptyTitle: "No matching assets found",
      emptyDesc: "Try adjusting your search or filter criteria.",
    });
  } else {
    renderAssets(filtered);
  }
};

// ============================================================
// PRIVATE — RESET FILTERS
// ============================================================

const resetFilters = () => {
  const r = cacheDOMRefs();

  if (r.searchInput) r.searchInput.value = "";
  if (r.statusFilter) r.statusFilter.value = "";
  if (r.categoryFilter) r.categoryFilter.value = "";
  if (r.sortSelect) r.sortSelect.value = "newest";

  applyFilters();
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  if (r.searchInput) {
    r.searchInput.addEventListener("input", () => {
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(applyFilters, 300);
    });
  }

  if (r.statusFilter) {
    r.statusFilter.addEventListener("change", applyFilters);
  }

  if (r.categoryFilter) {
    r.categoryFilter.addEventListener("change", applyFilters);
  }

  if (r.sortSelect) {
    r.sortSelect.addEventListener("change", applyFilters);
  }

  if (r.refreshBtn) {
    r.refreshBtn.addEventListener("click", resetFilters);
  }

  document.addEventListener("record-added", () => {
    setTimeout(applyFilters, 0);
  });
};

// ============================================================
// INIT
// ============================================================

const initAssetsFilter = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.searchInput && !refs.statusFilter && !refs.sortSelect) return;

  setupEventListeners();
};

export { initAssetsFilter };
