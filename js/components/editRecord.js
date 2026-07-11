// ============================================================
// EDIT RECORD — UI CONTROLLER
// Responsibility: Open the Edit modal, load existing record
// data, handle image replacement, validate, and save updates
// through dashboardService. No Firestore queries, no
// Cloudinary calls, no validation rules.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { fetchRecordById, updateRecord } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const CLOSE_BTN_SELECTOR = '[aria-label="Close edit record modal"]';
const TABLE_BODY_SELECTOR = "#recordsBody";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let isFetching = false;
let isSubmitting = false;
let currentObjectUrl = null;
let selectedRecordId = null;
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
    fullName: document.getElementById("editFullName"),
    guardianName: document.getElementById("editGuardianName"),
    email: document.getElementById("editEmail"),
    phone: document.getElementById("editPhone"),
    altPhone: document.getElementById("editAltPhone"),
    gender: document.getElementById("editGender"),
    dob: document.getElementById("editDob"),
    country: document.getElementById("editCountry"),
    city: document.getElementById("editCity"),
    address: document.getElementById("editAddress"),
    status: document.getElementById("editStatus"),
  };

  return refs;
};

// ============================================================
// MODAL — OPEN
// ============================================================

const openModal = async (recordId) => {
  const { modal, editLoader, form } = cacheDOMRefs();
  if (!modal || !recordId || isFetching) return;

  selectedRecordId = recordId;
  hasImageChanged = false;

  // Show modal with loader visible, form hidden
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  if (editLoader) editLoader.hidden = false;
  if (form) form.hidden = true;

  isFetching = true;

  try {

    const record = await fetchRecordById(recordId);

    if (!record) {
      showErrorToast("Record not found. It may have been deleted.");
      closeModal();
      return;
    }

    // Loader done, show form
    if (editLoader) editLoader.hidden = true;
    if (form) form.hidden = false;

    populateForm(record);

  } catch (error) {

    showErrorToast(error.message || "Failed to load record.");
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
  selectedRecordId = null;
  hasImageChanged = false;
};

// ============================================================
// IMAGE PREVIEW
// ============================================================

const handleImageChange = () => {
  const { imageInput, imagePreview } = cacheDOMRefs();
  const file = imageInput?.files?.[0];

  if (!imagePreview) return;

  // Revoke previous object URL
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  // No file selected
  if (!file) {
    imagePreview.classList.remove("visible");
    imagePreview.removeAttribute("src");
    return;
  }

  // Validate file type
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
// PRIVATE — BUILD AVATAR INITIALS
// Returns an SVG data URI with the first letter of the name
// for the avatar fallback.
// ============================================================

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================
// FORM — POPULATE
// Fills every editable field with the existing record data.
// ============================================================

const populateForm = (record) => {
  const r = cacheDOMRefs();

  if (r.fullName) r.fullName.value = record.fullName || "";
  if (r.guardianName) r.guardianName.value = record.referenceName || "";
  if (r.email) r.email.value = record.email || "";
  if (r.phone) r.phone.value = record.phoneNumber || "";
  if (r.altPhone) r.altPhone.value = record.alternatePhoneNumber || "";
  if (r.gender) r.gender.value = record.gender || "";
  if (r.dob) r.dob.value = record.dateOfBirth || "";
  if (r.country) r.country.value = record.country || "";
  if (r.city) r.city.value = record.city || "";
  if (r.address) r.address.value = record.address || "";
  if (r.status) r.status.value = record.status || "";
  originalStatus = record.status || null;

  // Profile image — show existing Cloudinary URL if available
  if (r.imagePreview) {
    if (record.profileImageUrl) {
      r.imagePreview.src = record.profileImageUrl;
      r.imagePreview.classList.add("visible");
    } else {
      r.imagePreview.classList.remove("visible");
      r.imagePreview.removeAttribute("src");
    }
  }

  // Clear file input
  if (r.imageInput) {
    r.imageInput.value = "";
  }
};

// ============================================================
// FORM — GET DATA
// Returns a plain object matching the dashboardService schema.
// ============================================================

const getFormData = () => {
  const r = cacheDOMRefs();

  return {
    fullName: r.fullName.value.trim(),
    referenceName: r.guardianName.value.trim(),
    email: r.email.value.trim(),
    phoneNumber: r.phone.value.trim(),
    alternatePhoneNumber: r.altPhone.value.trim(),
    gender: r.gender.value,
    dateOfBirth: r.dob.value,
    country: r.country.value.trim(),
    city: r.city.value.trim(),
    address: r.address.value.trim(),
    status: r.status.value,
    profileImage: hasImageChanged ? (r.imageInput?.files?.[0] || null) : null,
  };
};

// ============================================================
// FORM — RESET
// ============================================================

const resetForm = () => {
  const r = cacheDOMRefs();

  r.form.reset();

  // Clear image preview
  if (r.imagePreview) {
    r.imagePreview.classList.remove("visible");
    r.imagePreview.removeAttribute("src");
  }

  // Revoke object URL
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

  if (isSubmitting || !selectedRecordId) return;

  const { submitBtn } = cacheDOMRefs();
  const recordData = getFormData();

  isSubmitting = true;
  showButtonLoader(submitBtn);

  try {

    await updateRecord(selectedRecordId, recordData);

    const name = recordData.fullName;
    const statusChanged = !!(originalStatus && recordData.status !== originalStatus);

    showSuccessToast("Record updated successfully.");
    resetForm();
    closeModal();
    document.dispatchEvent(new CustomEvent("record-updated", {
      detail: { name, statusChanged, newStatus: recordData.status, oldStatus: originalStatus }
    }));
    document.dispatchEvent(new CustomEvent("record-added", {
      detail: { name }
    }));

  } catch (error) {

    showErrorToast(error.message || "Failed to update record. Please try again.");

  } finally {

    isSubmitting = false;
    hideButtonLoader(submitBtn);

  }
};

// ============================================================
// PRIVATE — HANDLE EDIT BUTTON CLICK
// Uses event delegation on the table body.
// ============================================================

const handleEditClick = (e) => {
  const btn = e.target.closest(".edit-btn");
  if (!btn) return;

  const tr = btn.closest("tr");
  if (!tr) return;

  const recordId = tr.dataset.recordId;
  if (!recordId) return;

  openModal(recordId);
};

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const r = cacheDOMRefs();

  // Close buttons
  if (r.closeBtn) {
    r.closeBtn.addEventListener("click", closeModal);
  }

  if (r.cancelBtn) {
    r.cancelBtn.addEventListener("click", closeModal);
  }

  // Outside click
  if (r.modal) {
    r.modal.addEventListener("click", (e) => {
      if (e.target === r.modal) closeModal();
    });
  }

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isSubmitting && !isFetching) {
      closeModal();
    }
  });

  // Avatar click → file input
  if (r.avatarCircle) {
    r.avatarCircle.addEventListener("click", () => {
      r.imageInput?.click();
    });
  }

  // Image input
  if (r.imageInput) {
    r.imageInput.addEventListener("change", handleImageChange);
  }

  // Form submit
  if (r.form) {
    r.form.addEventListener("submit", handleSubmit);
  }

  // Delegate edit button clicks on the table body
  const tbody = document.querySelector(TABLE_BODY_SELECTOR);
  if (tbody) {
    tbody.addEventListener("click", handleEditClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initEditRecord = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal || !refs.form) return;

  setupEventListeners();
};

export { initEditRecord };
