// ============================================================
// ADD RECORD — UI CONTROLLER
// Responsibility: Connect the Add Record modal/form with
// dashboardService. No business logic, no Firestore, no
// Cloudinary calls, no validation rules.
// ============================================================

import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { addRecord } from "../dashboard/dashboardService.js";

// ============================================================
// CONSTANTS
// ============================================================

const ADD_BTN_SELECTOR = "#addRecordBtn";
const CLOSE_BTN_SELECTOR = '[aria-label="Close add record modal"]';

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
    fullName: document.getElementById("addFullName"),
    guardianName: document.getElementById("addGuardianName"),
    email: document.getElementById("addEmail"),
    phone: document.getElementById("addPhone"),
    altPhone: document.getElementById("addAltPhone"),
    gender: document.getElementById("addGender"),
    dob: document.getElementById("addDob"),
    country: document.getElementById("addCountry"),
    city: document.getElementById("addCity"),
    address: document.getElementById("addAddress"),
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
// IMAGE PREVIEW
// ============================================================

const handleImageChange = () => {
  const { imageInput, imagePreview } = cacheDOMRefs();
  const file = imageInput?.files?.[0];

  if (!imagePreview) return;

  // Revoke previous object URL to avoid memory leaks
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  // No file selected → restore default placeholder
  if (!file) {
    imagePreview.classList.remove("visible");
    imagePreview.removeAttribute("src");
    return;
  }

  // Validate file is an image before previewing
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
    profileImage: r.imageInput?.files?.[0] || null,
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
};

// ============================================================
// HANDLE FORM SUBMIT
// ============================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting) return;

  const { submitBtn } = cacheDOMRefs();
  const recordData = getFormData();

  isSubmitting = true;
  showButtonLoader(submitBtn);

  try {

    await addRecord(recordData);

    showSuccessToast("Record added successfully.");
    resetForm();
    closeModal();
    document.dispatchEvent(new CustomEvent("record-added", {
      detail: { name: recordData.fullName }
    }));

  } catch (error) {

    showErrorToast(error.message || "Failed to add record. Please try again.");

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

  // Open
  if (r.addBtn) {
    r.addBtn.addEventListener("click", openModal);
  }

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
    if (e.key === "Escape" && r.modal && !r.modal.hidden && !isSubmitting) {
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
};

// ============================================================
// INIT
// ============================================================

const initAddRecord = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.modal || !refs.form) return;

  setupEventListeners();
};

export { initAddRecord };
