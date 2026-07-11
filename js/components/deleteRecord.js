// ============================================================
// DELETE RECORD — UI CONTROLLER
// Responsibility: Open the Delete confirmation modal, handle
// the confirm action, and delete the document through
// dashboardService. No Firestore queries, no Cloudinary calls.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { deleteRecord as deleteRecordService } from "../dashboard/dashboardService.js";
import { fetchRecordById } from "../dashboard/dashboardService.js";

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
let selectedRecordId = null;

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

const openModal = (recordId) => {
  const { modal } = cacheDOMRefs();
  if (!modal || !recordId) return;

  selectedRecordId = recordId;
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
  selectedRecordId = null;
  isDeleting = false;
};

// ============================================================
// PRIVATE — HANDLE CONFIRM DELETE
// ============================================================

const handleConfirmDelete = async () => {
  if (isDeleting || !selectedRecordId) return;

  const { confirmBtn } = cacheDOMRefs();

  isDeleting = true;
  showButtonLoader(confirmBtn);

  try {

    // Fetch record to get the name for activity logging
    let deletedName = "";
    try {
      const record = await fetchRecordById(selectedRecordId);
      if (record) deletedName = record.fullName || "";
    } catch (_) { /* best effort */ }

    await deleteRecordService(selectedRecordId);

    showSuccessToast("Record deleted successfully.");
    closeModal();
    document.dispatchEvent(new CustomEvent("record-deleted", {
      detail: { name: deletedName }
    }));
    document.dispatchEvent(new CustomEvent("record-added"));

  } catch (error) {

    showErrorToast(error.message || "Failed to delete record. Please try again.");

  } finally {

    isDeleting = false;
    hideButtonLoader(confirmBtn);

  }
};

// ============================================================
// PRIVATE — HANDLE DELETE BUTTON CLICK
// Uses event delegation on the table body.
// ============================================================

const handleDeleteClick = (e) => {
  const btn = e.target.closest(".delete-btn");
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

  // Close via Cancel button
  if (r.cancelBtn) {
    r.cancelBtn.addEventListener("click", closeModal);
  }

  // Confirm delete
  if (r.confirmBtn) {
    r.confirmBtn.addEventListener("click", handleConfirmDelete);
  }

  // Outside click on backdrop
  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal && !isDeleting) closeModal();
    });
  }

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isDeleting) {
      closeModal();
    }
  });

  // Delegate delete button clicks on the table body
  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleDeleteClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initDeleteRecord = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal) return;

  setupEventListeners();
};

export { initDeleteRecord };
