// ============================================================
// DASHBOARD RECENT ACTIVITY — UI CONTROLLER
// Responsibility: Log, fetch, and render the Recent Activity
// table. Defines activity type config (icon, colour, label)
// and handles in-module pagination.
// No business logic, no Firestore queries of its own beyond
// the initial fetch and event-driven logs.
// ============================================================

import { logActivity, fetchActivities, deleteActivity, deleteAllActivities } from "../dashboard/activityService.js";
import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;

const TABLE_SELECTOR = "#activityTable";
const BODY_SELECTOR = "#activityBody";
const LOADER_SELECTOR = "#activityLoader";
const EMPTY_SELECTOR = "#activityEmpty";
const PAGINATION_SELECTOR = "#activityPagination";
const PREV_SELECTOR = "#activityPrev";
const NEXT_SELECTOR = "#activityNext";
const PAGE_LIST_SELECTOR = "#activityPageList";
const DELETE_ALL_BTN_SELECTOR = "#deleteAllActivitiesBtn";

// ============================================================
// ACTIVITY TYPE CONFIG
// Maps each activity type to its icon (Font Awesome class),
// CSS modifier (for icon colour), and display label.
// Add new types here — no other code changes needed.
// ============================================================

const ACTIVITY_CONFIG = {
  record_added:      { icon: "fa-plus",              modifier: "create",  label: "Record Added" },
  record_updated:    { icon: "fa-pen",               modifier: "update",  label: "Record Updated" },
  record_deleted:    { icon: "fa-trash-can",         modifier: "delete",  label: "Record Deleted" },
  status_changed:    { icon: "fa-arrow-right-arrow-left", modifier: "update", label: "Status Changed" },
  profile_updated:   { icon: "fa-user-pen",          modifier: "update",  label: "Profile Updated" },
  password_changed:  { icon: "fa-key",               modifier: "archive", label: "Password Changed" },
};

const DEFAULT_CONFIG = { icon: "fa-circle", modifier: "archive", label: "Activity" };

// ============================================================
// STATE
// ============================================================

let initialized = false;
let allActivities = [];
let currentPage = 1;
let _skipNextRecordAdded = false;
let selectedActivityId = null;
let isDeleting = false;
let isDeleteAllMode = false;

// ============================================================
// PRIVATE — FORMAT RELATIVE TIME
// Converts a Firestore Timestamp, Date, or string to a
// human-readable relative time string.
// ============================================================

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  let date;

  if (typeof timestamp === "object" && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (typeof timestamp === "object" && typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "";
  }

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

// ============================================================
// PRIVATE — GET ACTIVITY CONFIG
// Returns the icon, modifier, and label for a given type.
// Falls back to a default for unknown types.
// ============================================================

const getActivityConfig = (type) => ACTIVITY_CONFIG[type] || DEFAULT_CONFIG;

// ============================================================
// PRIVATE — BUILD ROW
// Creates a single <tr> from an activity object.
// ============================================================

const buildRow = (activity) => {
  const config = getActivityConfig(activity.type);
  const time = formatRelativeTime(activity.createdAt);

  const tr = document.createElement("tr");
  tr.dataset.activityId = activity.id;

  tr.innerHTML = `
    <td>
      <div class="activity-cell">
        <span class="activity-icon activity-icon--${config.modifier}" aria-hidden="true">
          <i class="fa-solid ${config.icon}"></i>
        </span>
        <span>${activity.title || config.label}</span>
      </div>
    </td>
    <td>${activity.description || ""}</td>
    <td class="td-activity-time">${time}</td>
    <td>
      <button type="button" class="activity-delete-btn" aria-label="Delete activity">Delete</button>
    </td>
  `;

  return tr;
};

// ============================================================
// PRIVATE — RENDER TABLE
// Clears tbody and appends rows for the given page slice.
// Handles empty state.
// ============================================================

const renderTable = (activities) => {
  const table = document.querySelector(TABLE_SELECTOR);
  const tbody = document.querySelector(BODY_SELECTOR);
  const loader = document.querySelector(LOADER_SELECTOR);
  const empty = document.querySelector(EMPTY_SELECTOR);
  const deleteAllBtn = document.querySelector(DELETE_ALL_BTN_SELECTOR);

  if (!tbody) return;

  tbody.innerHTML = "";

  if (activities.length === 0) {
    if (table) table.hidden = true;
    if (loader) loader.hidden = true;
    if (empty) empty.hidden = false;
    if (deleteAllBtn) deleteAllBtn.hidden = true;
    return;
  }

  activities.forEach((activity) => {
    tbody.appendChild(buildRow(activity));
  });

  if (table) table.hidden = false;
  if (loader) loader.hidden = true;
  if (empty) empty.hidden = true;
  if (deleteAllBtn) deleteAllBtn.hidden = false;
};

// ============================================================
// PRIVATE — RENDER PAGINATION CONTROLS
// Builds Previous / page numbers / Next inside the existing
// nav element. Handles single-page hiding and edge cases.
// ============================================================

const renderPagination = (page, total) => {
  const nav = document.querySelector(PAGINATION_SELECTOR);
  const prevBtn = document.querySelector(PREV_SELECTOR);
  const nextBtn = document.querySelector(NEXT_SELECTOR);
  const list = document.querySelector(PAGE_LIST_SELECTOR);

  if (!nav || !prevBtn || !nextBtn || !list) return;

  if (total <= 1) {
    nav.hidden = true;
    return;
  }

  nav.hidden = false;

  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= total;

  // Build page numbers
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

  // Attach click handlers to Prev / Next
  prevBtn.onclick = () => goToPage(currentPage - 1);
  nextBtn.onclick = () => goToPage(currentPage + 1);
};

// ============================================================
// PUBLIC — GO TO PAGE
// Slices the current dataset and re-renders table + controls.
// ============================================================

const goToPage = (page) => {
  const totalPages = Math.ceil(allActivities.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;

  currentPage = page;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = allActivities.slice(start, end);

  renderTable(slice);
  renderPagination(currentPage, totalPages);
};

// ============================================================
// PRIVATE — REFRESH ACTIVITIES
// Fetches the latest activities from Firestore and re-renders
// the table and pagination from page 1.
// ============================================================

const refreshActivities = async () => {
  try {
    allActivities = await fetchActivities(50);
  } catch (error) {
    console.error("DashboardRecentActivity: refresh failed —", error.message);
    allActivities = [];
  }

  currentPage = 1;
  const totalPages = Math.ceil(allActivities.length / PAGE_SIZE);
  const slice = allActivities.slice(0, PAGE_SIZE);

  renderTable(slice);
  renderPagination(1, totalPages);
};

// ============================================================
// PRIVATE — HANDLE RECORD ADDED
// Logs a 'record_added' activity and refreshes.
// Only fires when _skipNextRecordAdded is false (i.e. the
// event did not originate from an edit operation).
// ============================================================

const handleRecordAdded = async (e) => {
  const name = (e && e.detail && e.detail.name) || "";
  const description = name ? `${name} was added to the system.` : "";
  try {
    await logActivity("record_added", "Record Added", description);
  } catch (error) {
    console.error("DashboardRecentActivity: log record_added failed —", error.message);
  }

  await refreshActivities();
};

// ============================================================
// PRIVATE — HANDLE RECORD UPDATED
// Logs a 'record_updated' activity and refreshes.
// ============================================================

const handleRecordUpdated = async (e) => {
  const name = (e && e.detail && e.detail.name) || "";

  if (e && e.detail && e.detail.statusChanged) {
    const statusDesc = `${name}'s status changed to ${e.detail.newStatus}.`;
    try {
      await logActivity("status_changed", "Status Changed", statusDesc);
    } catch (error) {
      console.error("DashboardRecentActivity: log status_changed failed —", error.message);
    }
  } else {
    const description = name ? `${name}'s record was updated.` : "";
    try {
      await logActivity("record_updated", "Record Updated", description);
    } catch (error) {
      console.error("DashboardRecentActivity: log record_updated failed —", error.message);
    }
  }

  await refreshActivities();
};

// ============================================================
// PRIVATE — HANDLE RECORD DELETED
// Logs a 'record_deleted' activity and refreshes.
// ============================================================

const handleRecordDeleted = async (e) => {
  const name = (e && e.detail && e.detail.name) || "";
  const description = name ? `${name} was removed from the system.` : "";
  try {
    await logActivity("record_deleted", "Record Deleted", description);
  } catch (error) {
    console.error("DashboardRecentActivity: log record_deleted failed —", error.message);
  }

  await refreshActivities();
};

// ============================================================
// PRIVATE — DELETE ACTIVITY MODAL (single & bulk)
// ============================================================

const DELETE_MODAL_SELECTOR = "#deleteActivityModal";

const getDeleteModalRefs = () => {
  const modal = document.querySelector(DELETE_MODAL_SELECTOR);
  if (!modal) return null;
  return {
    modal,
    closeBtn: modal.querySelector('.modal-header [aria-label="Close delete activity modal"]'),
    cancelBtn: modal.querySelector(".modal-actions button[type='button']"),
    confirmBtn: modal.querySelector(".modal-actions .danger-button"),
    titleEl: modal.querySelector("#delete-activity-modal-title"),
    messageEl: modal.querySelector(".delete-confirmation p"),
  };
};

const setModalSingleDelete = () => {
  const refs = getDeleteModalRefs();
  if (!refs) return;
  if (refs.titleEl) refs.titleEl.textContent = "Delete Activity";
  if (refs.messageEl) refs.messageEl.textContent = "Are you sure you want to delete this activity? This action cannot be undone.";
  if (refs.confirmBtn) refs.confirmBtn.textContent = "Delete Activity";
};

const setModalDeleteAll = () => {
  const refs = getDeleteModalRefs();
  if (!refs) return;
  if (refs.titleEl) refs.titleEl.textContent = "Delete All Activities";
  if (refs.messageEl) refs.messageEl.textContent = "Are you sure you want to delete all recent activities? This action cannot be undone.";
  if (refs.confirmBtn) refs.confirmBtn.textContent = "Delete All";
};

const openDeleteModal = (activityId) => {
  const refs = getDeleteModalRefs();
  if (!refs || !activityId) return;
  isDeleteAllMode = false;
  setModalSingleDelete();
  selectedActivityId = activityId;
  isDeleting = false;
  refs.modal.hidden = false;
  document.body.style.overflow = "hidden";
};

const openDeleteAllModal = () => {
  const refs = getDeleteModalRefs();
  if (!refs) return;
  isDeleteAllMode = true;
  setModalDeleteAll();
  selectedActivityId = null;
  isDeleting = false;
  refs.modal.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeDeleteModal = () => {
  const refs = getDeleteModalRefs();
  if (!refs) return;
  refs.modal.hidden = true;
  document.body.style.overflow = "";
  selectedActivityId = null;
  isDeleting = false;
  isDeleteAllMode = false;
};

const handleConfirmDeleteActivity = async () => {
  if (isDeleting) return;
  if (isDeleteAllMode) {
    await handleConfirmDeleteAll();
    return;
  }
  if (!selectedActivityId) return;

  const refs = getDeleteModalRefs();
  if (!refs) return;

  isDeleting = true;
  showButtonLoader(refs.confirmBtn);

  try {
    await deleteActivity(selectedActivityId);
    showSuccessToast("Activity deleted successfully.");
    closeDeleteModal();
    await refreshActivities();
  } catch (error) {
    showErrorToast(error.message || "Failed to delete activity.");
  } finally {
    isDeleting = false;
    hideButtonLoader(refs.confirmBtn);
  }
};

const handleConfirmDeleteAll = async () => {
  const refs = getDeleteModalRefs();
  if (!refs) return;

  isDeleting = true;
  showButtonLoader(refs.confirmBtn);

  try {
    const result = await deleteAllActivities();
    showSuccessToast(`All activities deleted${result.count > 0 ? ` (${result.count} removed)` : "."}`);
    closeDeleteModal();
    await refreshActivities();
  } catch (error) {
    showErrorToast(error.message || "Failed to delete all activities.");
  } finally {
    isDeleting = false;
    hideButtonLoader(refs.confirmBtn);
  }
};

const handleActivityDeleteClick = (e) => {
  const btn = e.target.closest(".activity-delete-btn");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const activityId = tr.dataset.activityId;
  if (!activityId) return;
  openDeleteModal(activityId);
};

const handleDeleteAllClick = () => {
  openDeleteAllModal();
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// Hooks into existing custom events dispatched by the CRUD
// modules. Uses a synchronous flag to deduplicate the
// record-added event that editRecord fires after
// record-updated.
// ============================================================

const setupEventListeners = () => {
  document.addEventListener("record-updated", (e) => {
    _skipNextRecordAdded = true;
    handleRecordUpdated(e);
  });

  document.addEventListener("record-deleted", (e) => {
    _skipNextRecordAdded = true;
    handleRecordDeleted(e);
  });

  document.addEventListener("record-added", (e) => {
    if (_skipNextRecordAdded) {
      _skipNextRecordAdded = false;
      return;
    }
    handleRecordAdded(e);
  });

  // Delete modal event delegation
  document.addEventListener("click", handleActivityDeleteClick);

  // Delete All button
  const deleteAllBtn = document.querySelector(DELETE_ALL_BTN_SELECTOR);
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", handleDeleteAllClick);
  }

  const refs = getDeleteModalRefs();
  if (refs) {
    if (refs.closeBtn) refs.closeBtn.addEventListener("click", closeDeleteModal);
    if (refs.cancelBtn) refs.cancelBtn.addEventListener("click", closeDeleteModal);
    if (refs.confirmBtn) refs.confirmBtn.addEventListener("click", handleConfirmDeleteActivity);
    if (refs.modal) {
      refs.modal.addEventListener("click", (e) => {
        if (e.target === refs.modal && !isDeleting) closeDeleteModal();
      });
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const refs2 = getDeleteModalRefs();
      if (refs2 && refs2.modal && !refs2.modal.hidden && !isDeleting) {
        closeDeleteModal();
      }
    }
  });
};

// ============================================================
// INIT
// ============================================================

const initDashboardRecentActivity = () => {
  if (initialized) return;
  initialized = true;

  refreshActivities();
  setupEventListeners();
};

export { initDashboardRecentActivity };
