// ============================================================
// ADD ASSET — UI CONTROLLER
// Responsibility: Connect the Add Asset modal/form with
// dashboardService. No business logic, no Firestore, no
// Cloudinary calls, no validation rules.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { addAsset } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const ADD_BTN_SELECTOR = "#addRecordBtn";
const CLOSE_BTN_SELECTOR = '[aria-label="Close add asset modal"]';

// ============================================================
// STATE
// ============================================================

let initialized = false;
let isSubmitting = false;
let currentObjectUrl = null;

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  const modal = document.getElementById("addRecordModal");
  const form = document.getElementById("addRecordForm");

  refs = {
    modal,
    form,
    addBtn: document.querySelector(ADD_BTN_SELECTOR),
    closeBtn: modal ? modal.querySelector(CLOSE_BTN_SELECTOR) : null,
    cancelBtn: form ? form.querySelector('.modal-actions button[type="button"]') : null,
    submitBtn: form ? form.querySelector('button[type="submit"]') : null,
    imageInput: document.getElementById("addRecordImage"),
    imagePreview: document.getElementById("addRecordImagePreview"),
    avatarCircle: document.getElementById("addRecordAvatar"),
    assetName: document.getElementById("addAssetName"),
    assetId: document.getElementById("addAssetId"),
    category: document.getElementById("addCategory"),
    location: document.getElementById("addLocation"),
    lastMaintenance: document.getElementById("addLastMaintenance"),
    status: document.getElementById("addStatus"),
  };

  return refs;
};

// ============================================================
// MODAL — OPEN
// ============================================================

const openModal = () => {
  const { modal } = cacheDOMRefs();
  if (!modal) return;

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  generateAssetId();
};

// ============================================================
// MODAL — CLOSE
// ============================================================

const closeModal = () => {
  const { modal } = cacheDOMRefs();
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";
};

// ============================================================
// GENERATE ASSET ID
// Auto-generates an asset ID like "AST-A1B2C3"
// ============================================================

const generateAssetId = () => {
  const { assetId } = cacheDOMRefs();
  if (!assetId) return;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "AST-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  assetId.value = id;
};

// ============================================================
// IMAGE PREVIEW
// ============================================================

const handleImageChange = () => {
  const { imageInput, imagePreview } = cacheDOMRefs();
  const file = imageInput?.files?.[0];

  if (!imagePreview) return;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  if (!file) {
    imagePreview.classList.remove("visible");
    imagePreview.removeAttribute("src");
    return;
  }

  if (!file.type.startsWith("image/")) {
    imageInput.value = "";
    showErrorToast("Please select a valid image file.");
    return;
  }

  currentObjectUrl = URL.createObjectURL(file);

  imagePreview.src = currentObjectUrl;
  imagePreview.classList.add("visible");
};

// ============================================================
// FORM — GET DATA
// Returns a plain object matching the dashboardService schema.
// ============================================================

const getFormData = () => {
  const r = cacheDOMRefs();

  return {
    assetName: r.assetName.value.trim(),
    assetId: r.assetId.value.trim(),
    category: r.category.value,
    location: r.location.value.trim(),
    lastMaintenance: r.lastMaintenance.value,
    status: r.status.value,
    assetImage: r.imageInput?.files?.[0] || null,
  };
};

// ============================================================
// FORM — RESET
// ============================================================

const resetForm = () => {
  const r = cacheDOMRefs();

  r.form.reset();

  if (r.imagePreview) {
    r.imagePreview.classList.remove("visible");
    r.imagePreview.removeAttribute("src");
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
};

// ============================================================
// HANDLE FORM SUBMIT
// ============================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting) return;

  const { submitBtn } = cacheDOMRefs();
  const assetData = getFormData();

  isSubmitting = true;
  showButtonLoader(submitBtn);

  try {

    await addAsset(assetData);

    showSuccessToast("Asset added successfully.");
    resetForm();
    closeModal();
    document.dispatchEvent(new CustomEvent("record-added", {
      detail: { name: assetData.assetName }
    }));

  } catch (error) {

    showErrorToast(error.message || "Failed to add asset. Please try again.");

  } finally {

    isSubmitting = false;
    hideButtonLoader(submitBtn);

  }
};

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  if (r.addBtn) {
    r.addBtn.addEventListener("click", openModal);
  }

  if (r.closeBtn) {
    r.closeBtn.addEventListener("click", closeModal);
  }

  if (r.cancelBtn) {
    r.cancelBtn.addEventListener("click", closeModal);
  }

  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isSubmitting) {
      closeModal();
    }
  });

  if (r.avatarCircle) {
    r.avatarCircle.addEventListener("click", () => {
      r.imageInput?.click();
    });
  }

  if (r.imageInput) {
    r.imageInput.addEventListener("change", handleImageChange);
  }

  if (r.form) {
    r.form.addEventListener("submit", handleSubmit);
  }
};

// ============================================================
// INIT
// ============================================================

const initAddAsset = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal || !refs.form) return;

  setupEventListeners();
};

export { initAddAsset };
