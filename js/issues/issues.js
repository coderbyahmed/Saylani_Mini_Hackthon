// ============================================================
// ISSUES — MAIN CONTROLLER (ENTRY POINT)
// Coordinates and initialises all issue management components.
// ============================================================

import { initSidebarToggle } from "../components/sidebarToggle.js";
import { initSidebarLogout } from "../components/sidebarLogout.js";
import { initThemeToggle } from "../components/themeToggle.js";
import { initMyProfile } from "../components/myProfile.js";
import { initChangePassword } from "../components/changePassword.js";
import { initProfileDropdown } from "../components/profileDropdown.js";
import { initDashboardNotification } from "../components/dashboardNotification.js";
import { initIssueManagement } from "../components/issueManagement.js";

const initIssues = () => {
  try {
    initSidebarToggle();
    initSidebarLogout();
    initThemeToggle();
    initMyProfile();
    initChangePassword();
    initDashboardNotification();
    initProfileDropdown();
    initIssueManagement();
  } catch (error) {
    console.error("Error initializing issue management page:", error);
  }
};

document.addEventListener("DOMContentLoaded", initIssues);