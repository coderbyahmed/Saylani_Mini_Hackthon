// ============================================================
// THEME TOGGLE
// Responsibility:
// - Read saved theme from localStorage
// - Apply the saved theme on page load
// - Listen for Theme Toggle button clicks
// - Switch between Light and Dark themes
// - Update the toggle icon/state
// - Save the selected theme to localStorage
// ============================================================

const STORAGE_KEY = "dashboardTheme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

// ============================================================
// SVG ICONS
// ============================================================

const SUN_ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

const MOON_ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

// ============================================================
// SET THEME
// ============================================================

const setTheme = (theme) => {

  document.documentElement.setAttribute("data-theme", theme);

  localStorage.setItem(STORAGE_KEY, theme);

  const toggleBtn = document.querySelector(".theme-toggle");

  if (toggleBtn) {
    toggleBtn.innerHTML = theme === THEME_DARK ? SUN_ICON : MOON_ICON;
    toggleBtn.setAttribute(
      "aria-label",
      theme === THEME_DARK ? "Switch to light theme" : "Switch to dark theme"
    );
    toggleBtn.setAttribute(
      "title",
      theme === THEME_DARK ? "Switch to light theme" : "Switch to dark theme"
    );
  }

};

// ============================================================
// TOGGLE THEME
// ============================================================

const toggleTheme = () => {

  const current = document.documentElement.getAttribute("data-theme");
  const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;

  setTheme(next);

};

// ============================================================
// INIT THEME TOGGLE
// ============================================================

const initThemeToggle = () => {

  const toggleBtn = document.querySelector(".theme-toggle");

  if (!toggleBtn) {
    console.warn("Theme toggle button not found.");
    return;
  }

  // Read saved theme, default to light
  const saved = localStorage.getItem(STORAGE_KEY) || THEME_LIGHT;

  // Apply on page load
  setTheme(saved);

  // Listen for clicks
  toggleBtn.addEventListener("click", toggleTheme);

};

export { initThemeToggle };
