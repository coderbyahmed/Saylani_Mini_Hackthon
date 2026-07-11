// ============================================================
// VIEW RECORD — UI CONTROLLER
// Responsibility: Open the View Record modal, fetch the
// selected record from Firestore, and populate all fields.
// No business logic, no Firestore queries, no Cloudinary.
// ============================================================

import { showErrorToast } from "../ui/toast.js";
import { fetchRecordById } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const MODAL_SELECTOR = "#viewRecordModal";
const CLOSE_BTN_SELECTOR = '[aria-label="Close view record modal"]';
const CONTENT_SELECTOR = "#viewRecordContent";
const LOADER_SELECTOR = "#viewLoader";
const CLOSE_FOOTER_SELECTOR = "#viewCloseBtn";
const TABLE_BODY_SELECTOR = "#recordsBody";

// ============================================================
// STATE
// ============================================================

let initialized = false;

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  const modal = document.querySelector(MODAL_SELECTOR);

  refs = {
    modal,
    closeBtn: modal ? modal.querySelector(CLOSE_BTN_SELECTOR) : null,
    closeFooterBtn: document.querySelector(CLOSE_FOOTER_SELECTOR),
    content: document.querySelector(CONTENT_SELECTOR),
    loader: document.querySelector(LOADER_SELECTOR),
    avatarInitials: document.getElementById("viewAvatarInitials"),
    avatarImg: document.getElementById("viewAvatarImg"),
    profileName: document.getElementById("viewProfileName"),
    profileBadge: document.getElementById("viewProfileBadge"),
    fullName: document.getElementById("viewFullName"),
    referenceName: document.getElementById("viewReferenceName"),
    email: document.getElementById("viewEmail"),
    phone: document.getElementById("viewPhone"),
    altPhone: document.getElementById("viewAltPhone"),
    gender: document.getElementById("viewGender"),
    dob: document.getElementById("viewDob"),
    country: document.getElementById("viewCountry"),
    city: document.getElementById("viewCity"),
    address: document.getElementById("viewAddress"),
    status: document.getElementById("viewStatus"),
    createdDate: document.getElementById("viewCreatedDate"),
    updatedDate: document.getElementById("viewUpdatedDate"),
  };

  return refs;
};

// ============================================================
// PRIVATE — FORMAT TIMESTAMP
// Reuses the same pattern as recordsTable.js.
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
// ============================================================

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================
// PRIVATE — GET BADGE CLASS
// Mirrors the logic in recordsTable.js.
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
// PRIVATE — SET TEXT
// Safely sets textContent on a cached element.
// ============================================================

const setText = (el, value) => {
  if (el) el.textContent = value || "—";
};

// ============================================================
// PRIVATE — POPULATE FIELDS
// Fills every field inside the modal with record data.
// ============================================================

const populateFields = (record) => {
  const r = refs;
  if (!r) return;

  // Profile section
  const initials = getInitials(record.fullName);

  if (record.profileImageUrl) {
    if (r.avatarInitials) r.avatarInitials.hidden = true;
    if (r.avatarImg) {
      r.avatarImg.hidden = false;
      r.avatarImg.src = record.profileImageUrl;
      r.avatarImg.alt = record.fullName || "";
    }
  } else {
    if (r.avatarInitials) {
      r.avatarInitials.hidden = false;
      r.avatarInitials.textContent = initials;
    }
    if (r.avatarImg) r.avatarImg.hidden = true;
  }

  setText(r.profileName, record.fullName);

  // Profile status badge
  if (r.profileBadge) {
    r.profileBadge.className = getBadgeClass(record.status);
    r.profileBadge.textContent = record.status || "—";
  }

  // Information fields
  setText(r.fullName, record.fullName);
  setText(r.referenceName, record.referenceName);
  setText(r.email, record.email);
  setText(r.phone, record.phoneNumber);
  setText(r.altPhone, record.alternatePhoneNumber);
  setText(r.gender, record.gender);
  setText(r.dob, record.dateOfBirth);
  setText(r.country, record.country);
  setText(r.city, record.city);
  setText(r.address, record.address);

  // Status in info grid — renders as a badge
  if (r.status) {
    r.status.className = getBadgeClass(record.status);
    r.status.textContent = record.status || "—";
  }

  // Dates
  setText(r.createdDate, formatDate(record.createdAt));
  setText(r.updatedDate, formatDate(record.updatedAt));
};

// ============================================================
// PRIVATE — SHOW LOADING
// Shows the spinner, hides the content.
// ============================================================

const showLoading = () => {
  const { loader, content } = cacheDOMRefs();
  if (loader) loader.hidden = false;
  if (content) content.hidden = true;
};

// ============================================================
// PRIVATE — HIDE LOADING
// Hides the spinner, shows the content.
// ============================================================

const hideLoading = () => {
  const { loader, content } = cacheDOMRefs();
  if (loader) loader.hidden = true;
  if (content) content.hidden = false;
};

// ============================================================
// PUBLIC — OPEN MODAL
// Fetches the record by ID and populates the modal.
// ============================================================

const openModal = async (recordId) => {
  const { modal } = cacheDOMRefs();
  if (!modal || !recordId) return;

  showLoading();

  if (modal.hidden !== false) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  try {

    const record = await fetchRecordById(recordId);

    if (!record) {
      showErrorToast("Record not found. It may have been deleted.");
      closeModal();
      return;
    }

    populateFields(record);
    hideLoading();

  } catch (error) {

    showErrorToast(error.message || "Failed to load record.");
    closeModal();

  }
};

// ============================================================
// PUBLIC — CLOSE MODAL
// ============================================================

const closeModal = () => {
  const { modal } = cacheDOMRefs();
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";

  // Reset loader state for next open
  showLoading();
};

// ============================================================
// PRIVATE — HANDLE VIEW BUTTON CLICK
// Uses event delegation on the table body to determine
// which record was clicked and open its detail modal.
// ============================================================

const handleViewClick = (e) => {
  const btn = e.target.closest(".view-btn");
  if (!btn) return;

  const tr = btn.closest("tr");
  if (!tr) return;

  const recordId = tr.dataset.recordId;
  if (!recordId) return;

  openModal(recordId);
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  // Close via × button
  if (r.closeBtn) {
    r.closeBtn.addEventListener("click", closeModal);
  }

  // Close via footer button
  if (r.closeFooterBtn) {
    r.closeFooterBtn.addEventListener("click", closeModal);
  }

  // Outside click on backdrop
  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal) closeModal();
    });
  }

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden) {
      closeModal();
    }
  });

  // Delegate view button clicks on the table body
  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleViewClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initViewRecord = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal) return;

  // Start with loader visible, content hidden
  showLoading();

  setupEventListeners();
};

export { initViewRecord };
