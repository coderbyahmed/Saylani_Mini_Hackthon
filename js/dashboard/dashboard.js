// ============================================================
// DASHBOARD — MAIN CONTROLLER (ENTRY POINT)
// Coordinates and initialises all dashboard components.
// No business logic, UI logic, or Firebase code lives here.
// ============================================================

// ============================================================
// SIDEBAR COMPONENTS
// ============================================================
import { initSidebarToggle } from "../components/sidebarToggle.js";
import { initSidebarLogout } from "../components/sidebarLogout.js";

// ============================================================
// UI COMPONENTS
// ============================================================
import { initThemeToggle } from "../components/themeToggle.js";
import { initMyProfile } from "../components/myProfile.js";
import { initChangePassword } from "../components/changePassword.js";
import { initProfileDropdown } from "../components/profileDropdown.js";
import { initDashboardStats } from "../components/dashboardStats.js";
import { initDashboardRecentActivity } from "../components/dashboardRecentActivity.js";
import { initDashboardNotification } from "../components/dashboardNotification.js";

// ============================================================
// INITIALISE ALL COMPONENTS
// Called once when the DOM is fully loaded.
// Components are started in a logical order so that layout-
// critical modules (e.g. sidebar toggle) are ready before
// data-driven modules (e.g. statistics).
// ============================================================
const initDashboard = () => {

  try {

    // 1. Sidebar Toggle
    initSidebarToggle();

    // 2. Sidebar Logout
    initSidebarLogout();

    // 3. Theme Toggle
    initThemeToggle();

    // 4. My Profile
    initMyProfile();

    // 5. Change Password
    initChangePassword();

    // 6. Notification Dropdown
    initDashboardNotification();

    // 7. Profile Dropdown
    initProfileDropdown();

    // 8. Dashboard Stats (Overview Cards)
    initDashboardStats();

    // 9. Recent Activity
    initDashboardRecentActivity();

  } catch (error) {
    console.error("Error initializing dashboard components:", error);
  }

};

// ============================================================
// DOM CONTENT LOADED
// Ensures all DOM nodes exist before any component tries to
// query them.
// ============================================================
document.addEventListener("DOMContentLoaded", initDashboard);
