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
import { initAddRecord } from "../components/addRecord.js";
import { initRecordsTable } from "../components/recordsTable.js";
import { initViewRecord } from "../components/viewRecord.js";
import { initEditRecord } from "../components/editRecord.js";
import { initDeleteRecord } from "../components/deleteRecord.js";
import { initRecordsFilter } from "../components/recordsFilter.js";
import { initExportRecord } from "../components/exportRecord.js";
import { initPagination } from "../components/pagination.js";
import { initDashboardCard } from "../components/dashboardCard.js";
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

    // 6. Profile Dropdown
    initProfileDropdown();

    // 7. Add Record
    initAddRecord();

    // 8. Records Table
    initRecordsTable();

    // 9. View Record
    initViewRecord();

    // 10. Edit Record
    initEditRecord();

    // 11. Delete Record
    initDeleteRecord();

    // 12. Records Filter (search, status, sort, refresh)
    initRecordsFilter();

    // 13. Records Export
    initExportRecord();

    // 14. Search
    // initializeSearch();

    // 14. Filters (replaced by dedicated recordsFilter component)
    // initializeFilters();

    // 14. Pagination
    initPagination();

    // 14. CRUD Modals (replaced by dedicated components)
    // initializeAddModal();
    // initializeEditModal();
    // initializeViewModal();
    // initializeDeleteModal();

    // 15. Dashboard Cards
    initDashboardCard();

    // 16. Recent Activity
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
