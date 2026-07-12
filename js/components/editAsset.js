// ============================================================
// EDIT ASSET — UI CONTROLLER
// Responsibility: Open the Edit modal, load existing asset
// data, handle image replacement, validate, and save updates
// through dashboardService. No Firestore queries, no Cloudinary
// calls, no validation rules.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { fetchAssetById, updateAsset } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const CLOSE_BTN_SELECTOR = '[aria-label="Close edit asset modal"]';
const TABLE_BODY_SELECTOR = "#recordsBody";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let isFetching = false;
let isSubmitting = false;
let currentObjectUrl = null;
let selectedAssetId = null;
let hasImageChanged = false;
let originalStatus = null;

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  const modal = document.getElementById("editRecordModal");
  const form = document.getElementById("editRecordForm");

  refs = {
    modal,
    form,
    editLoader: document.getElementById("editLoader"),
    closeBtn: modal ? modal.querySelector(CLOSE_BTN_SELECTOR) : null,
    cancelBtn: form ? form.querySelector('.modal-actions button[type="button"]') : null,
    submitBtn: form ? form.querySelector('button[type="submit"]') : null,
    imageInput: document.getElementById("editRecordImage"),
    imagePreview: document.getElementById("editRecordImagePreview"),
    avatarCircle: document.getElementById("editRecordAvatar"),
    assetName: document.getElementById("editAssetName"),
    assetId: document.getElementById("editAssetId"),
    category: document.getElementById("editCategory"),
    location: document.getElementById("editLocation"),
    lastMaintenance: document.getElementById("editLastMaintenance"),
    status: document.getElementById("editStatus"),
  };

  return refs;
};

// ============================================================
// MODAL — OPEN
// ============================================================

const openModal = async (assetId) => {
  const { modal, editLoader, form } = cacheDOMRefs();
  if (!modal || !assetId || isFetching) return;

  selectedAssetId = assetId;
  hasImageChanged = false;

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  if (editLoader) editLoader.hidden = false;
  if (form) form.hidden = true;

  isFetching = true;

  try {
    const asset = await fetchAssetById(assetId);

    if (!asset) {
      showErrorToast("Asset not found. It may have been deleted.");
      closeModal();
      return;
    }

    if (editLoader) editLoader.hidden = true;
    if (form) form.hidden = false;

    populateForm(asset);
  } catch (error) {
    showErrorToast(error.message || "Failed to load asset.");
    closeModal();
  } finally {
    isFetching = false;
  }
};

// ============================================================
// MODAL — CLOSE
// ============================================================

const closeModal = () => {
  const { modal } = cacheDOMRefs();
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";
  selectedAssetId = null;
  hasImageChanged = false;
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
  hasImageChanged = true;
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
// FORM — POPULATE
// Fills every editable field with the existing asset data.
// ============================================================

const populateForm = (asset) => {
  const r = cacheDOMRefs();

  if (r.assetName) r.assetName.value = asset.assetName || "";
  if (r.assetId) r.assetId.value = asset.assetId || "";
  if (r.category) r.category.value = asset.category || "";
  if (r.location) r.location.value = asset.location || "";
  if (r.lastMaintenance) r.lastMaintenance.value = asset.lastMaintenance || "";
  if (r.status) r.status.value = asset.status || "";
  originalStatus = asset.status || null;

  if (r.imagePreview) {
    if (asset.assetImageUrl) {
      r.imagePreview.src = asset.assetImageUrl;
      r.imagePreview.classList.add("visible");
    } else {
      r.imagePreview.classList.remove("visible");
      r.imagePreview.removeAttribute("src");
    }
  }

  if (r.imageInput) {
    r.imageInput.value = "";
  }
};

// ============================================================
// FORM — GET DATA
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
    assetImage: hasImageChanged ? (r.imageInput?.files?.[0] || null) : null,
  };
};

// ============================================================
// FORM — RESET
// ============================================================

const resetForm = () => {
  const r = cacheDOMRefs();

  if (r.form) r.form.reset();

  if (r.imagePreview) {
    r.imagePreview.classList.remove("visible");
    r.imagePreview.removeAttribute("src");
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  hasImageChanged = false;
};

// ============================================================
// HANDLE FORM SUBMIT
// ============================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting || !selectedAssetId) return;

  const { submitBtn } = cacheDOMRefs();
  const assetData = getFormData();

  isSubmitting = true;
  showButtonLoader(submitBtn);

  try {
    await updateAsset(selectedAssetId, assetData);

    const name = assetData.assetName;
    const statusChanged = !!(originalStatus && assetData.status !== originalStatus);

    showSuccessToast("Asset updated successfully.");
    resetForm();
    closeModal();
    document.dispatchEvent(new CustomEvent("record-updated", {
      detail: { name, statusChanged, newStatus: assetData.status, oldStatus: originalStatus }
    }));
    document.dispatchEvent(new CustomEvent("record-added", {
      detail: { name }
    }));
  } catch (error) {
    showErrorToast(error.message || "Failed to update asset. Please try again.");
  } finally {
    isSubmitting = false;
    hideButtonLoader(submitBtn);
  }
};

// ============================================================
// PRIVATE — HANDLE EDIT BUTTON CLICK
// ============================================================

const handleEditClick = (e) => {
  const btn = e.target.closest(".edit-btn");
  if (!btn) return;

  const tr = btn.closest("tr");
  if (!tr) return;

  const assetId = tr.dataset.recordId;
  if (!assetId) return;

  openModal(assetId);
};

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

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
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isSubmitting && !isFetching) {
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

  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleEditClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initEditAsset = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal || !refs.form) return;

  setupEventListeners();
};

export { initEditAsset };
