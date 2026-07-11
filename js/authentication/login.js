// ============================================================
// LOGIN
// Responsibility:
// - Read form data
// - Validate form
// - Sign in with Firebase Authentication
// - Show toast notifications
// - Redirect user after successful login
// ============================================================

import { auth } from "../configuration/firebase.js";
import { signInWithEmailAndPassword }
    from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { showSuccessToast, showErrorToast, showWarningToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import initializePasswordToggle from "../utils/passwordToggle.js";
import { signInWithGoogle } from "./googleAuth.js";
import { signInWithGithub } from "./googleAuth.js";
import { validateLogin } from "../validations/loginValidations.js";
import { syncUserDocument } from "./userSyncService.js";
import { createNotification } from "../dashboard/dashboardService.js";
// ============================================================
// DOM REFERENCES
// ============================================================

const loginForm = document.querySelector("#loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const googleLoginBtn = document.querySelector("#googleLoginBtn");
const githubLoginBtn = document.querySelector("#githubLoginBtn");
const loginSubmitBtn = document.querySelector("#loginBtn");


// ============================================================
// OPTIONAL DOM REFERENCES
// Uncomment whenever the corresponding HTML field is enabled.
// ============================================================


// const usernameInput = document.getElementById("username");
// const phoneInput = document.getElementById("phone");
// const cnicInput = document.getElementById("cnic");
// const roleInput = document.getElementById("role");

// ============================================================
// HANDLE LOGIN
// ============================================================

const handleLogin = async (event) => {

    event.preventDefault();

    // ========================================================
    // GET FORM VALUES
    // ========================================================

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // ========================================================
    // VALIDATE FORM
    // ========================================================

    const validation = validateLogin({

        email,
        password,

        // Future Fields

        // role,
        // teacherId,
        // studentId,
        // adminId,
        // phone,
        // otp,
        // captcha

    });

    if (!validation.success) {
        showWarningToast(validation.message, 5000);
        return;
    }

    // ========================================================
    // SHOW BUTTON LOADER
    // ========================================================

    const submitBtn = loginForm.querySelector("button[type='submit']");
    showButtonLoader(submitBtn);

    try {

        // ====================================================
        // FIREBASE LOGIN
        // ====================================================

        const response = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.info("User Logged In:", response.user);

        // ====================================================
        // SYNC FIRESTORE
        // ====================================================

        await syncUserDocument({
            user: response.user,
            provider: "password",
        });

        // ====================================================
        // SUCCESS
        // ====================================================

        showSuccessToast("Login successful.", 2000);

        createNotification("login", "Login Successful", "You logged in successfully.").catch(() => {});

        setTimeout(() => {
            // TODO: Replace with actual dashboard path
            window.location.href = "../dashboard/dashboard.html";
        }, 2000);

    }

    catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/invalid-credential":
                showErrorToast("Invalid email or password.", 4000);
                break;

            case "auth/invalid-email":
                showErrorToast("Please enter a valid email address.", 4000);
                break;

            case "auth/user-disabled":
                showErrorToast("This account has been disabled.", 4000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Please check your internet connection.", 5000);
                break;

            case "auth/too-many-requests":
                showErrorToast("Too many attempts. Please try again later.", 5000);
                break;

            default:
                showErrorToast("Something went wrong. Please try again.", 5000);
        }

    }

    finally {

        hideButtonLoader(submitBtn);

    }

};

// ============================================================
// HANDLE GOOGLE LOGIN
// ============================================================

const handleGoogleLogin = async () => {

    showButtonLoader(googleLoginBtn);

    try {

        const user = await signInWithGoogle();

        console.info("Google User:", user);

        // ====================================================
        // SYNC FIRESTORE
        // ====================================================

        await syncUserDocument({
            user,
            provider: "google",
        });

        showSuccessToast("Login successful.", 3000);

        createNotification("login", "Login Successful", "You logged in successfully.").catch(() => {});

        setTimeout(() => {
            // TODO: Replace with actual dashboard path
            window.location.href = "../../pages/dashboard/dashboard.html";
        }, 3000);

    }

    catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/popup-closed-by-user":
                showWarningToast("Google sign in was cancelled.", 4000);
                break;

            case "auth/popup-blocked":
                showErrorToast("Popup was blocked by your browser.", 4000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Please check your internet connection.", 4000);
                break;

            default:
                showErrorToast("Google sign in failed. Please try again.", 5000);
        }

    }

    finally {

        hideButtonLoader(googleLoginBtn);

    }

};

// ============================================================
// HANDLE GITHUB LOGIN
// ============================================================

const handleGithubLogin = async () => {

    showButtonLoader(githubLoginBtn);

    try {

        const user = await signInWithGithub();

        console.info("GitHub User:", user);

        await syncUserDocument({
            user,
            provider: "github",
        });

        showSuccessToast("Login successful.", 3000);

        createNotification("login", "Login Successful", "You logged in successfully.").catch(() => {});

        setTimeout(() => {
            window.location.href = "../../pages/dashboard/dashboard.html";
        }, 3000);

    }

    catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/popup-closed-by-user":
                showWarningToast("GitHub sign in was cancelled.", 4000);
                break;

            case "auth/popup-blocked":
                showErrorToast("Popup was blocked by your browser.", 4000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Please check your internet connection.", 4000);
                break;

            default:
                showErrorToast("GitHub sign in failed. Please try again.", 5000);
        }

    }

    finally {

        hideButtonLoader(githubLoginBtn);

    }

};


// ============================================================
// LOGOUT SUCCESS TOAST
// If the user was redirected here after a successful logout,
// display a brief success toast and clear the flag so it
// never appears again on subsequent visits.
// ============================================================

const LOGOUT_FLAG = "logoutSuccess";

if (sessionStorage.getItem(LOGOUT_FLAG) === "true") {

  showSuccessToast("Logged out successfully.", 3000);

  sessionStorage.removeItem(LOGOUT_FLAG);

}

// ============================================================
// PASSWORD TOGGLE
// ============================================================

initializePasswordToggle();

// ============================================================
// EVENT LISTENERS
// ============================================================

loginForm.addEventListener("submit", handleLogin);

googleLoginBtn.addEventListener("click", handleGoogleLogin);

githubLoginBtn.addEventListener("click", handleGithubLogin);
