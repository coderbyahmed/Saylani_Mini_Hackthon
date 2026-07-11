// ============================================================
// SIDEBAR TOGGLE COMPONENT
// Responsible only for expanding / collapsing the sidebar.
// No dashboard, CRUD, Firebase, table, modal, theme, or
// notification logic lives here.
// Both pages (dashboard.html, records.html) share the same
// DOM structure, so this component works without modification.
// ============================================================

// ============================================================
// CSS CLASS NAMES
// Centralised so values are easy to update in one place.
// ============================================================
const SIDEBAR_SELECTOR     = ".sidebar";
const TOGGLE_SELECTOR      = ".sidebar-toggle";
const COLLAPSED_MODIFIER   = "sidebar--collapsed";
const COLLAPSED_STATE_CLASS = "sidebar-collapsed";


let isCollapsed = false;
let isInitialised = false;


let sidebarEl = null;
let toggleEl  = null;


const getIsCollapsed = () => isCollapsed;


const expandSidebar = () => {
  if (!isCollapsed) return;

  sidebarEl.classList.remove(COLLAPSED_MODIFIER);
  document.documentElement.classList.remove(COLLAPSED_STATE_CLASS);

  isCollapsed = false;
};


const collapseSidebar = () => {
  if (isCollapsed) return;

  sidebarEl.classList.add(COLLAPSED_MODIFIER);
  document.documentElement.classList.add(COLLAPSED_STATE_CLASS);

  isCollapsed = true;
};


const toggleSidebar = () => {
  if (isCollapsed) {
    expandSidebar();
  } else {
    collapseSidebar();
  }
};


const handleToggleClick = (event) => {
  event.preventDefault();
  toggleSidebar();
};


const initSidebarToggle = () => {

  // Prevent double initialisation
  if (isInitialised) return;

  // Cache DOM references
  sidebarEl = document.querySelector(SIDEBAR_SELECTOR);
  toggleEl  = document.querySelector(TOGGLE_SELECTOR);

  // Validate required elements exist
  if (!sidebarEl) {
    console.warn("SidebarToggle: sidebar element not found.");
    return;
  }

  if (!toggleEl) {
    console.warn("SidebarToggle: toggle button not found.");
    return;
  }

  isCollapsed = sidebarEl.classList.contains(COLLAPSED_MODIFIER);

  // Attach event listener
  toggleEl.addEventListener("click", handleToggleClick);

  isInitialised = true;
};

export { initSidebarToggle };
