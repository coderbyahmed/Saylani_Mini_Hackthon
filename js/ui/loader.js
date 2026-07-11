// ============================================================
// LOADER UTILITY
// Fullscreen overlay + button loading states.
// Reusable across all pages — Signup, Login, Dashboard, CRUD,
// Firebase requests, file uploads, and future features.
// Uses CSS classes from loader.css. No external dependencies.
// ============================================================

// ============================================================
// HELPER — CREATE INLINE SPINNER ELEMENT
// Builds a small spinning ring for button loaders.
// Uses inline styles so no external CSS is needed.
// ============================================================
const createInlineSpinner = () => {
  const spinner = document.createElement("span");
  spinner.setAttribute("aria-hidden", "true");

  const size = "16px";
  const border = "2px";

  spinner.style.display = "inline-block";
  spinner.style.width = size;
  spinner.style.height = size;
  spinner.style.border = `${border} solid rgba(255, 255, 255, 0.3)`;
  spinner.style.borderTopColor = "#fff";
  spinner.style.borderRadius = "50%";
  spinner.style.animation = "loader-inline-spin 0.6s linear infinite";
  spinner.style.marginRight = "8px";
  spinner.style.verticalAlign = "middle";
  spinner.style.flexShrink = "0";

  // Inject keyframes once if not already present
  if (!createInlineSpinner.keyframesInjected) {
    const styleId = "loader-inline-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent =
        "@keyframes loader-inline-spin {" +
        "  from { transform: rotate(0deg); }" +
        "  to   { transform: rotate(360deg); }" +
        "}";
      document.head.appendChild(style);
    }
    createInlineSpinner.keyframesInjected = true;
  }

  return spinner;
};

// ============================================================
// FULLSCREEN LOADER
// ============================================================

// Cache the loader element so it is only created once.
let loaderEl = null;

// ============================================================
// GET LOADER
// Returns the fullscreen loader overlay.
// Creates it lazily on first call and appends to body.
// ============================================================
const getLoader = () => {
  if (!loaderEl) {
    loaderEl = document.querySelector(".loader");

    if (!loaderEl) {
      loaderEl = document.createElement("div");
      loaderEl.className = "loader";

      const spinner = document.createElement("div");
      spinner.className = "loader__spinner";

      const text = document.createElement("p");
      text.className = "loader__text";
      text.textContent = "Loading...";

      loaderEl.appendChild(spinner);
      loaderEl.appendChild(text);
      document.body.appendChild(loaderEl);
    }
  }

  return loaderEl;
};

// ============================================================
// SHOW LOADER
// Displays the fullscreen loading overlay.
// ============================================================
const showLoader = () => {
  const el = getLoader();
  el.classList.add("loader--active");
};

// ============================================================
// HIDE LOADER
// Hides the fullscreen loading overlay.
// ============================================================
const hideLoader = () => {
  if (loaderEl) {
    loaderEl.classList.remove("loader--active");
  }
};

// ============================================================
// BUTTON LOADER
// ============================================================

// ============================================================
// SHOW BUTTON LOADER
// Disables the button, stores its original content, and
// replaces it with an inline spinner + "Loading..." text.
// Accepts a button element or a valid CSS selector string.
// ============================================================
const showButtonLoader = (button) => {
  const btn = resolveButton(button);
  if (!btn) return;

  // Prevent double-wrapping
  if (btn.dataset.loaderOriginal !== undefined) return;

  // Store original content and disable
  btn.dataset.loaderOriginal = btn.innerHTML;
  btn.disabled = true;

  // Build loading content: inline spinner + text
  const spinner = createInlineSpinner();
  const text = document.createTextNode("Loading...");

  btn.innerHTML = "";
  btn.appendChild(spinner);
  btn.appendChild(text);
};

// ============================================================
// HIDE BUTTON LOADER
// Restores the button's original content and re-enables it.
// Accepts a button element or a valid CSS selector string.
// ============================================================
const hideButtonLoader = (button) => {
  const btn = resolveButton(button);
  if (!btn) return;

  const original = btn.dataset.loaderOriginal;
  if (original === undefined) return;

  btn.innerHTML = original;
  btn.disabled = false;
  delete btn.dataset.loaderOriginal;
};

// ============================================================
// HELPER — RESOLVE BUTTON
// Accepts either a DOM element or a CSS selector string.
// Returns the element or null if not found / invalid.
// ============================================================
const resolveButton = (button) => {
  if (!button) return null;

  if (typeof button === "string") {
    return document.querySelector(button);
  }

  if (button instanceof HTMLElement) {
    return button;
  }

  return null;
};

// ============================================================
// PUBLIC API
// ============================================================

export {
  showLoader,
  hideLoader,
  showButtonLoader,
  hideButtonLoader
};
