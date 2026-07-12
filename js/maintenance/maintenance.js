// ============================================================
// MAINTENANCE — MAIN CONTROLLER (ENTRY POINT)
// Coordinates and initialises all maintenance/analytics components.
// ============================================================

import { initSidebarToggle } from "../components/sidebarToggle.js";
import { initSidebarLogout } from "../components/sidebarLogout.js";
import { initThemeToggle } from "../components/themeToggle.js";
import { initMyProfile } from "../components/myProfile.js";
import { initChangePassword } from "../components/changePassword.js";
import { initProfileDropdown } from "../components/profileDropdown.js";
import { initDashboardNotification } from "../components/dashboardNotification.js";
import { initDashboardAnalytics } from "../components/dashboardAnalytics.js";

const initMaintenance = () => {
  try {
    initSidebarToggle();
    initSidebarLogout();
    initThemeToggle();
    initMyProfile();
    initChangePassword();
    initDashboardNotification();
    initProfileDropdown();
    initDashboardAnalytics();
  } catch (error) {
    console.error("Error initializing maintenance page:", error);
  }
};

document.addEventListener("DOMContentLoaded", initMaintenance);