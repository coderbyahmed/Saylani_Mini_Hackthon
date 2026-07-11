// ============================================================
// DROPDOWN COMPONENT
// Manages profile/notification dropdown open/close behaviour
// and renders the authenticated user's info in the header.
// ============================================================

import { auth, db } from "../configuration/firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { handleLogout } from "./sidebarLogout.js";

// ============================================================
// SELECTORS & STATE
// ============================================================

const USERS_COLLECTION = "users";
const PROFILE_MENU_SELECTOR = ".profile-menu";
const PROFILE_TRIGGER_SELECTOR = ".profile-trigger";
const PROFILE_DROPDOWN_SELECTOR = ".profile-dropdown";
const NOTIFICATION_WRAPPER_SELECTOR = ".notification-wrapper";
const NOTIFICATION_TRIGGER_SELECTOR = ".notification-trigger";
const NOTIFICATION_DROPDOWN_SELECTOR = ".notification-dropdown";
const ACTIVE_CLASS = "active";
const EXPANDED_ATTRIBUTE = "aria-expanded";

let isInitialised = false;
let profileMenuEl = null;
let profileTriggerEl = null;
let profileDropdownEl = null;
let notificationWrapperEl = null;
let notificationTriggerEl = null;
let notificationDropdownEl = null;

// ============================================================
// HEADER PROFILE RENDER
// ============================================================

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
};

const renderHeaderProfile = async () => {
  const headerAvatar = document.getElementById("headerAvatar");
  const headerAvatarImg = document.getElementById("headerAvatarImg");
  const headerProfileName = document.getElementById("headerProfileName");
  if (!headerAvatar || !headerAvatarImg || !headerProfileName) return;

  const user = auth.currentUser;
  if (!user) return;

  let fullName = null;
  let photoURL = null;

  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    if (snap.exists()) {
      const data = snap.data();
      fullName = data.fullName || null;
      photoURL = data.photoURL || null;
    }
  } catch (err) {
    console.error("Error loading user profile for header:", err);
  }

  if (!fullName) fullName = user.displayName || null;
  if (!photoURL) photoURL = user.photoURL || null;
  if (!fullName && user.email) fullName = user.email.split("@")[0];

  if (photoURL) {
    headerAvatarImg.src = photoURL;
    headerAvatarImg.onerror = () => {
      headerAvatarImg.hidden = true;
      headerAvatar.hidden = false;
      headerAvatar.textContent = getInitials(fullName);
    };
    headerAvatarImg.hidden = false;
    headerAvatar.hidden = true;
  } else {
    headerAvatar.hidden = false;
    headerAvatarImg.hidden = true;
    headerAvatar.textContent = getInitials(fullName);
  }

  headerProfileName.textContent = fullName || "User";
};

// ============================================================
// OPEN / CLOSE HELPERS
// ============================================================

const closeAllDropdowns = () => {
    if (profileDropdownEl) {
        profileDropdownEl.classList.remove(ACTIVE_CLASS);
    }

    if (profileTriggerEl) {
        profileTriggerEl.setAttribute(EXPANDED_ATTRIBUTE, "false");
    }

    if (notificationDropdownEl) {
        notificationDropdownEl.classList.remove(ACTIVE_CLASS);
    }

    if (notificationTriggerEl) {
        notificationTriggerEl.setAttribute(EXPANDED_ATTRIBUTE, "false");
    }
};

const toggleProfileDropdown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!profileDropdownEl || !profileTriggerEl) return;

    const isOpen = profileDropdownEl.classList.contains(ACTIVE_CLASS);

    closeAllDropdowns();

    if (!isOpen) {
        profileDropdownEl.classList.add(ACTIVE_CLASS);
        profileTriggerEl.setAttribute(EXPANDED_ATTRIBUTE, "true");
    }
};

const toggleNotificationDropdown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!notificationDropdownEl || !notificationTriggerEl) return;

    const isOpen = notificationDropdownEl.classList.contains(ACTIVE_CLASS);

    closeAllDropdowns();

    if (!isOpen) {
        notificationDropdownEl.classList.add(ACTIVE_CLASS);
        notificationTriggerEl.setAttribute(EXPANDED_ATTRIBUTE, "true");
    }
};

// ============================================================
// EVENT HANDLERS
// ============================================================

const handleDocumentClick = (event) => {
    const target = event.target;

    const clickedInsideProfile = profileMenuEl?.contains(target);
    const clickedInsideNotification = notificationWrapperEl?.contains(target);

    if (!clickedInsideProfile && !clickedInsideNotification) {
        closeAllDropdowns();
    }
};

const handleKeydown = (event) => {
    if (event.key === "Escape") {
        closeAllDropdowns();
    }
};

// ============================================================
// INITIALISATION
// ============================================================

const initProfileDropdown = () => {
    if (isInitialised) return;

    profileMenuEl = document.querySelector(PROFILE_MENU_SELECTOR);
    profileTriggerEl = document.querySelector(PROFILE_TRIGGER_SELECTOR);
    profileDropdownEl = document.querySelector(PROFILE_DROPDOWN_SELECTOR);
    notificationWrapperEl = document.querySelector(NOTIFICATION_WRAPPER_SELECTOR);
    notificationTriggerEl = document.querySelector(NOTIFICATION_TRIGGER_SELECTOR);
    notificationDropdownEl = document.querySelector(NOTIFICATION_DROPDOWN_SELECTOR);

    if (!profileMenuEl || !profileTriggerEl || !profileDropdownEl) {
        console.warn("ProfileDropdown: profile dropdown elements not found.");
    }

    if (!notificationWrapperEl || !notificationTriggerEl || !notificationDropdownEl) {
        console.warn("ProfileDropdown: notification dropdown elements not found.");
    }

    if (profileTriggerEl && profileDropdownEl) {
        profileTriggerEl.addEventListener("click", toggleProfileDropdown);
    }

    if (notificationTriggerEl && notificationDropdownEl) {
        notificationTriggerEl.addEventListener("click", toggleNotificationDropdown);
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);

    // Load user into header once auth is ready
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
            renderHeaderProfile();
            unsub();
        }
    });

    // Wire dropdown Logout link to the shared logout handler
    const logoutMenuItems = profileDropdownEl?.querySelectorAll('a[role="menuitem"]');
    if (logoutMenuItems) {
      const logoutLink = logoutMenuItems[logoutMenuItems.length - 1];
      if (logoutLink && logoutLink.textContent.trim() === "Logout") {
        logoutLink.addEventListener("click", (e) => {
          e.preventDefault();
          handleLogout();
        });
      }
    }

    // Re-render when profile is updated from Edit Profile
    document.addEventListener("profile-updated", renderHeaderProfile);

    isInitialised = true;
};

export { initProfileDropdown };
