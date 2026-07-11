// ============================================================
// AUTH CHECK
// Responsibility:
// - Check authentication state
// - Allow only authenticated users
// - Redirect unauthenticated users to login
// - Export current user helper
// ============================================================


// ============================================================
// FIREBASE
// ============================================================

import { auth } from "../configuration/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// ============================================================
// AUTH GUARD
// Redirects to login if no authenticated user is found.
// ============================================================

const protectRoute = () => {

    onAuthStateChanged(auth, (user) => {

        if (!user) {

            window.location.href = "../../pages/authentication/login.html";

        }

    });

};


// ============================================================
// CURRENT USER
// Returns the currently authenticated Firebase user, or null.
// ============================================================

const getCurrentUser = () => {

    return auth.currentUser;

};


// ============================================================
// EXPORTS
// ============================================================

export {
    protectRoute,
    getCurrentUser
};