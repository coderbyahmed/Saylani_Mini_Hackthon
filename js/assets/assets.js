// ============================================================
// ASSETS — MAIN CONTROLLER (ENTRY POINT)
// Coordinates and initialises all asset management components.
// ============================================================

import { initSidebarToggle } from "../components/sidebarToggle.js";
import { initSidebarLogout } from "../components/sidebarLogout.js";
import { initThemeToggle } from "../components/themeToggle.js";
import { initMyProfile } from "../components/myProfile.js";
import { initChangePassword } from "../components/changePassword.js";
import { initProfileDropdown } from "../components/profileDropdown.js";
import { initDashboardNotification } from "../components/dashboardNotification.js";
import { initAssetsTable } from "../components/assetsTable.js";
import { initAssetsFilter } from "../components/assetsFilter.js";
import { initAddAsset } from "../components/addAsset.js";
import { initEditAsset } from "../components/editAsset.js";
import { initViewAsset } from "../components/viewAsset.js";
import { initDeleteAsset } from "../components/deleteAsset.js";
import { initExportAsset } from "../components/exportAsset.js";

const initAssets = () => {
  try {
    initSidebarToggle();
    initSidebarLogout();
    initThemeToggle();
    initMyProfile();
    initChangePassword();
    initDashboardNotification();
    initProfileDropdown();
    initAssetsTable();
    initAssetsFilter();
    initAddAsset();
    initEditAsset();
    initViewAsset();
    initDeleteAsset();
    initExportAsset();
  } catch (error) {
    console.error("Error initializing assets page:", error);
  }
};

document.addEventListener("DOMContentLoaded", initAssets);
