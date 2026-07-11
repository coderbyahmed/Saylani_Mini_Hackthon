// ============================================================
// SIDEBAR LOGOUT COMPONENT
// Handles only the logout flow:
// - Listens for clicks on the sidebar logout button
// - Shows a SweetAlert2 confirmation modal with loader
// - Signs the user out of Firebase Authentication
// - Enforces a minimum loader duration of 3 seconds for a
//   smooth, professional feel
// - Sets a session flag so the login page can display a
//   success toast after redirect
// - Redirects to login.html on success
// No dashboard, CRUD, table, or other logic lives here.
// ============================================================

import { auth } from "../configuration/firebase.js";
import { signOut }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { showErrorToast } from "../ui/toast.js";
import { createNotification } from "../dashboard/dashboardService.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";


// ============================================================
// CONSTANTS
// ============================================================
const LOGOUT_SELECTOR = ".logout-button";
const LOGIN_PAGE = "../auth/login.html";
const LOGOUT_FLAG = "logoutSuccess";
const MIN_LOADER_DURATION = 3000;

// ============================================================
// STATE
// Prevents duplicate initialisation.
// ============================================================
let isInitialised = false;

// ============================================================
// HANDLE LOGOUT
// Opens the SweetAlert2 confirmation dialog.
// Uses the built-in showLoaderOnConfirm / preConfirm pattern
// so SweetAlert manages its own loading state natively.
//
// Inside preConfirm:
//   1. Record the start timestamp.
//   2. Execute Firebase signOut.
//   3. Calculate elapsed time.
//   4. If less than MIN_LOADER_DURATION has passed, wait for
//      the remaining time so the loader is visible for at
//      least 3 seconds.
//   5. On success, resolve so the modal closes.
//   6. On error, throw so Swal shows the error and stays open.
//
// After preConfirm resolves and the modal closes, set the
// session flag and redirect. The login page reads the flag and
// displays the toast.
// ============================================================
const handleLogout = async () => {

  // ==========================================================
  // SWEETALERT2 CONFIRMATION
  // ==========================================================

  const result = await Swal.fire({
    title: "Logout Confirmation",
    text: "Are you sure you want to logout from your account?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Logout",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    showLoaderOnConfirm: true,
    preConfirm: async () => {

      // Record when the user clicked confirm
      const startTime = Date.now();

      try {

        // Create notification while user is still authenticated
        await createNotification("logout", "Logged Out", "You logged out successfully.");

        // Attempt Firebase sign-out
        await signOut(auth);

        // Calculate how long signOut took
        const elapsed = Date.now() - startTime;

        // Ensure the loader is visible for at least the
        // minimum duration for a polished feel
        const remaining = MIN_LOADER_DURATION - elapsed;

        if (remaining > 0) {

          await new Promise((resolve) => setTimeout(resolve, remaining));

        }

      } catch (error) {

        console.error("Logout failed:", error);

        // Swal displays this error and keeps the modal open
        throw new Error("Logout failed. Please try again.");

      }

    },
    allowOutsideClick: () => !Swal.isLoading(),
    customClass: {
      popup: "swal-logout-popup",
      confirmButton: "swal-logout-confirm",
      cancelButton: "swal-logout-cancel"
    }
  });

  // ==========================================================
  // HANDLE RESULT
  // If the user cancelled, exit early.
  // Otherwise the loader has completed and the modal is closed.
  // Set the session flag for the login page and redirect.
  // ==========================================================

  if (!result.isConfirmed) return;

  // Set flag so login page can display the logout toast
  sessionStorage.setItem(LOGOUT_FLAG, "true");

  // Redirect to login
  window.location.href = LOGIN_PAGE;

};

// ============================================================
// INIT SIDEBAR LOGOUT
// Must be called once per page that includes the sidebar.
// - Validates that the logout button exists.
// - Attaches the click listener.
// - Prevents duplicate initialisation.
// ============================================================
const initSidebarLogout = () => {

  // Prevent double initialisation
  if (isInitialised) return;

  // Find the logout button in the DOM
  const logoutButton = document.querySelector(LOGOUT_SELECTOR);

  // Validate the element exists
  if (!logoutButton) {
    console.warn("SidebarLogout: logout button not found.");
    return;
  }

  // Attach the click handler
  logoutButton.addEventListener("click", handleLogout);

  isInitialised = true;
};

// ============================================================
// PUBLIC API
// Only the init function is exposed. Pages import and call it
// individually — no auto-execution.
// ============================================================
export { initSidebarLogout, handleLogout };
