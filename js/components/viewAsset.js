// ============================================================
// VIEW ASSET — UI CONTROLLER
// Responsibility: Open the View Asset modal, fetch the
// selected asset from Firestore, and populate all fields.
// No business logic, no Firestore queries, no Cloudinary.
// ============================================================

import { showErrorToast } from "../ui/toast.js";
import { fetchAssetById } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const MODAL_SELECTOR = "#viewRecordModal";
const CLOSE_BTN_SELECTOR = '[aria-label="Close view asset modal"]';
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
    assetId: document.getElementById("viewAssetId"),
    category: document.getElementById("viewCategory"),
    location: document.getElementById("viewLocation"),
    lastMaintenance: document.getElementById("viewLastMaintenance"),
    createdDate: document.getElementById("viewCreatedDate"),
    updatedDate: document.getElementById("viewUpdatedDate"),
  };

  return refs;
};

// ============================================================
// PRIVATE — FORMAT TIMESTAMP
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
// ============================================================

const setText = (el, value) => {
  if (el) el.textContent = value || "—";
};

// ============================================================
// PRIVATE — POPULATE FIELDS
// ============================================================

const populateFields = (asset) => {
  const r = refs;
  if (!r) return;

  const initials = getInitials(asset.assetName);

  if (asset.assetImageUrl) {
    if (r.avatarInitials) r.avatarInitials.hidden = true;
    if (r.avatarImg) {
      r.avatarImg.hidden = false;
      r.avatarImg.src = asset.assetImageUrl;
      r.avatarImg.alt = asset.assetName || "";
    }
  } else {
    if (r.avatarInitials) {
      r.avatarInitials.hidden = false;
      r.avatarInitials.textContent = initials;
    }
    if (r.avatarImg) r.avatarImg.hidden = true;
  }

  setText(r.profileName, asset.assetName);

  if (r.profileBadge) {
    r.profileBadge.className = getBadgeClass(asset.status);
    r.profileBadge.textContent = asset.status || "—";
  }

  setText(r.assetId, asset.assetId);
  setText(r.category, asset.category);
  setText(r.location, asset.location);
  setText(r.lastMaintenance, asset.lastMaintenance);
  setText(r.createdDate, formatDate(asset.createdAt));
  setText(r.updatedDate, formatDate(asset.updatedAt));
};

// ============================================================
// PRIVATE — SHOW LOADING
// ============================================================

const showLoading = () => {
  const { loader, content } = cacheDOMRefs();
  if (loader) loader.hidden = false;
  if (content) content.hidden = true;
};

// ============================================================
// PRIVATE — HIDE LOADING
// ============================================================

const hideLoading = () => {
  const { loader, content } = cacheDOMRefs();
  if (loader) loader.hidden = true;
  if (content) content.hidden = false;
};

// ============================================================
// PUBLIC — OPEN MODAL
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

    const asset = await fetchAssetById(recordId);

    if (!asset) {
      showErrorToast("Asset not found. It may have been deleted.");
      closeModal();
      return;
    }

    populateFields(asset);
    hideLoading();

  } catch (error) {

    showErrorToast(error.message || "Failed to load asset.");
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

  showLoading();
};

// ============================================================
// PRIVATE — HANDLE VIEW BUTTON CLICK
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

  if (r.closeBtn) {
    r.closeBtn.addEventListener("click", closeModal);
  }

  if (r.closeFooterBtn) {
    r.closeFooterBtn.addEventListener("click", closeModal);
  }

  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden) {
      closeModal();
    }
  });

  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleViewClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initViewAsset = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal) return;

  showLoading();

  setupEventListeners();
};

export { initViewAsset };
