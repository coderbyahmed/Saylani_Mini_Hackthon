// ============================================================
// DELETE ASSET — UI CONTROLLER
// Responsibility: Open the Delete confirmation modal, handle
// the confirm action, and delete the document through
// dashboardService. No Firestore queries, no Cloudinary calls.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { deleteAsset, fetchAssetById } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const MODAL_SELECTOR = "#deleteRecordModal";
const CLOSE_BTN_SELECTOR = '[aria-label="Close delete confirmation modal"]';
const CONFIRM_BTN_SELECTOR = "#deleteConfirmBtn";
const TABLE_BODY_SELECTOR = "#recordsBody";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let isDeleting = false;
let selectedAssetId = null;

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
    cancelBtn: modal ? modal.querySelector('.modal-actions button[type="button"]') : null,
    confirmBtn: document.querySelector(CONFIRM_BTN_SELECTOR),
  };

  return refs;
};

// ============================================================
// PUBLIC — OPEN MODAL
// ============================================================

const openModal = (assetId) => {
  const { modal } = cacheDOMRefs();
  if (!modal || !assetId) return;

  selectedAssetId = assetId;
  isDeleting = false;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
};

// ============================================================
// PUBLIC — CLOSE MODAL
// ============================================================

const closeModal = () => {
  const { modal } = cacheDOMRefs();
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";
  selectedAssetId = null;
  isDeleting = false;
};

// ============================================================
// PRIVATE — HANDLE CONFIRM DELETE
// ============================================================

const handleConfirmDelete = async () => {
  if (isDeleting || !selectedAssetId) return;

  const { confirmBtn } = cacheDOMRefs();

  isDeleting = true;
  showButtonLoader(confirmBtn);

  try {
    let deletedName = "";
    try {
      const asset = await fetchAssetById(selectedAssetId);
      if (asset) deletedName = asset.assetName || "";
    } catch (_) { /* best effort */ }

    await deleteAsset(selectedAssetId);

    showSuccessToast("Asset deleted successfully.");
    closeModal();
    document.dispatchEvent(new CustomEvent("record-deleted", {
      detail: { name: deletedName }
    }));
    document.dispatchEvent(new CustomEvent("record-added"));
  } catch (error) {
    showErrorToast(error.message || "Failed to delete asset. Please try again.");
  } finally {
    isDeleting = false;
    hideButtonLoader(confirmBtn);
  }
};

// ============================================================
// PRIVATE — HANDLE DELETE BUTTON CLICK
// ============================================================

const handleDeleteClick = (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;

  const tr = btn.closest("tr");
  if (!tr) return;

  const assetId = tr.dataset.recordId;
  if (!assetId) return;

  openModal(assetId);
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  if (r.closeBtn) {
    r.closeBtn.addEventListener("click", closeModal);
  }

  if (r.cancelBtn) {
    r.cancelBtn.addEventListener("click", closeModal);
  }

  if (r.confirmBtn) {
    r.confirmBtn.addEventListener("click", handleConfirmDelete);
  }

  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal && !isDeleting) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isDeleting) {
      closeModal();
    }
  });

  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleDeleteClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initDeleteAsset = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal) return;

  setupEventListeners();
};

export { initDeleteAsset };
