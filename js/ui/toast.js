// ============================================================
// TOAST NOTIFICATION UTILITY
// Reusable across the entire project — Signup, Login,
// Dashboard, CRUD, and any future page.
// No HTML markup required. Pure JS + CSS.
// ============================================================

// ============================================================
// TOAST TYPES CONFIG
// Maps each type to its CSS modifier, title, and timeout.
// ============================================================
const TOAST_TYPES = {
  success: { modifier: "toast--success", title: "Success" },
  error  : { modifier: "toast--error",   title: "Error" },
  warning: { modifier: "toast--warning", title: "Warning" },
  info   : { modifier: "toast--info",    title: "Information" }
};

// ============================================================
// DEFAULT OPTIONS
// ============================================================
const DEFAULT_DURATION = 7000;

// ============================================================
// TOAST CONTAINER
// Created once and reused for all toast notifications.
// ============================================================
let container = null;

const getContainer = () => {
  if (!container) {
    container = document.querySelector(".toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  }

  return container;
};

// ============================================================
// CREATE TOAST ELEMENT
// Builds the full toast DOM structure from a config object.
// ============================================================
const createToastElement = ({ type, title, message }) => {
  const config = TOAST_TYPES[type];

  const toast = document.createElement("div");
  toast.className = `toast ${config.modifier}`;

  const titleEl = document.createElement("p");
  titleEl.className = "toast__title";
  titleEl.textContent = title;

  const messageEl = document.createElement("p");
  messageEl.className = "toast__message";
  messageEl.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast__close";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.type = "button";

  const progress = document.createElement("div");
  progress.className = "toast__progress";

  toast.appendChild(titleEl);
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);
  toast.appendChild(progress);

  return { toast, closeBtn, progress };
};

// ============================================================
// REMOVE TOAST
// Plays the exit animation, then removes the element from DOM.
// ============================================================
const removeToast = (toast) => {
  if (!toast || toast.classList.contains("removing")) return;

  toast.classList.add("removing");

  toast.addEventListener("animationend", () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, { once: true });
};

// ============================================================
// SHOW TOAST (internal)
// Core function called by all public helpers.
// ============================================================
const showToast = (type, message, duration = DEFAULT_DURATION) => {

  duration = Number(duration) || DEFAULT_DURATION;
   
  const config = TOAST_TYPES[type];

  if (!config) return;

  const containerEl = getContainer();
  const { toast, closeBtn } = createToastElement({
    type,
    title: config.title,
    message
  });

  let timer = setTimeout(() => {
    removeToast(toast);
    timer = null;
  }, duration);

  closeBtn.addEventListener("click", () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    removeToast(toast);
  });

  containerEl.appendChild(toast);
};

// ============================================================
// PUBLIC API
// ============================================================

const showSuccessToast = (message, duration) => {
  showToast("success", message, duration);
};

const showErrorToast = (message, duration) => {
  showToast("error", message, duration);
};

const showWarningToast = (message, duration) => {
  showToast("warning", message, duration);
};

const showInfoToast = (message, duration) => {
  showToast("info", message, duration);
};

export {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast
};
