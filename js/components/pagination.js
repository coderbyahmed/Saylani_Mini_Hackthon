// ============================================================
// PAGINATION — UI CONTROLLER
// Responsibility: Slice the assets array into pages (10/page),
// render page controls, and call renderAssets with the slice.
// Integrates with assetsTable and assetsFilter via
// records-updated custom events.
// ============================================================

import { renderAssets, getFullDataSet } from "./assetsTable.js";

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;
const NAV_SELECTOR = "#paginationNav";
const PREV_SELECTOR = "#paginationPrev";
const NEXT_SELECTOR = "#paginationNext";
const LIST_SELECTOR = "#paginationList";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let currentPage = 1;
let totalPages = 1;
let currentDataset = [];
let isPaginating = false;

// ============================================================
// PRIVATE — RENDER CONTROLS
// Updates the existing DOM elements — Previous button,
// page-number <ul>, and Next button.
// ============================================================

const renderControls = (page, total) => {
  const nav = document.querySelector(NAV_SELECTOR);
  const prevBtn = document.querySelector(PREV_SELECTOR);
  const nextBtn = document.querySelector(NEXT_SELECTOR);
  const list = document.querySelector(LIST_SELECTOR);

  if (!nav || !prevBtn || !nextBtn || !list) return;

  // Show / hide when only one page
  nav.hidden = total <= 1;
  if (total <= 1) return;

  // Previous / Next disabled state
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= total;

  // Build page-number list items
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  list.innerHTML = "";

  const appendPage = (pageNum) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = pageNum;
    if (pageNum === page) btn.setAttribute("aria-current", "page");
    btn.addEventListener("click", () => goToPage(pageNum));
    li.appendChild(btn);
    list.appendChild(li);
  };

  const appendEllipsis = () => {
    const li = document.createElement("li");
    li.className = "pagination__ellipsis";
    li.textContent = "\u2026";
    list.appendChild(li);
  };

  if (start > 1) {
    appendPage(1);
    if (start > 2) appendEllipsis();
  }

  for (let i = start; i <= end; i++) {
    appendPage(i);
  }

  if (end < total) {
    if (end < total - 1) appendEllipsis();
    appendPage(total);
  }
};

// ============================================================
// PUBLIC — GO TO PAGE
// Slices the current dataset and re-renders the table.
// ============================================================

const goToPage = (page) => {
  if (page < 1 || page > totalPages || isPaginating) return;

  currentPage = page;
  isPaginating = true;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = currentDataset.slice(start, end);

  const emptyText = currentDataset.length === 0 && getFullDataSet().length > 0
    ? { emptyTitle: "No matching assets found", emptyDesc: "Try adjusting your search or filter criteria." }
    : {};

  renderAssets(slice, emptyText);
  renderControls(currentPage, totalPages);

  isPaginating = false;
};

// ============================================================
// PRIVATE — HANDLE RECORDS UPDATED
// Stores the full dataset, resets to page 1, renders.
// ============================================================

const onRecordsUpdated = (e) => {
  if (isPaginating) return;

  const { records } = e.detail;
  if (!records) return;

  currentDataset = records;
  totalPages = Math.ceil(records.length / PAGE_SIZE);
  currentPage = 1;

  if (totalPages <= 1) {
    isPaginating = true;
    renderControls(1, 1);
    renderAssets(currentDataset);
    isPaginating = false;
    return;
  }

  // Re-render with only page 1's slice
  goToPage(1);
};

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  document.addEventListener("records-updated", onRecordsUpdated);

  const prevBtn = document.querySelector(PREV_SELECTOR);
  const nextBtn = document.querySelector(NEXT_SELECTOR);
  if (prevBtn) prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goToPage(currentPage + 1));
};

// ============================================================
// INIT
// ============================================================

const initPagination = () => {
  if (initialized) return;
  initialized = true;

  setupEventListeners();
};

export { initPagination, goToPage };
