// ============================================================
// SIGNUP
// Responsibility:
// - Read form data
// - Validate form
// - Create Firebase Authentication user
// - Show toast notifications
// - Redirect user after successful signup
// ============================================================

import { auth } from "../configuration/firebase.js";
import { createUserWithEmailAndPassword }
    from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { validateSignup } from "../validations/signupValidations.js";
import { showSuccessToast, showErrorToast, showWarningToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import initializePasswordToggle from "../utils/passwordToggle.js";
import { signInWithGoogle } from "./googleAuth.js";
import { signInWithGithub } from "./googleAuth.js";
import { saveUser } from "./userService.js";
import { createNotification } from "../dashboard/dashboardService.js";


// ============================================================
// DOM REFERENCES
// ============================================================

const signupForm = document.getElementById("signupForm");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const googleSignupBtn = document.getElementById("googleSignupBtn");
const githubSignupBtn = document.getElementById("githubSignupBtn");

// ============================================================
// OPTIONAL DOM REFERENCES
// Uncomment whenever the corresponding HTML field is enabled.
// ============================================================

// const phoneInput = document.getElementById("phone");
// const profileImageInput = document.getElementById("profileImage");
// const genderInput = document.getElementById("gender");
// const dobInput = document.getElementById("dob");
// const cnicInput = document.getElementById("cnic");
// const addressInput = document.getElementById("address");
// const cityInput = document.getElementById("city");
// const roleInput = document.getElementById("role");


// ============================================================
// HANDLE SIGNUP
// ============================================================

const handleSignup = async (event) => {

    event.preventDefault();

    // ========================================================
    // GET FORM VALUES
    // ========================================================

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();


    // ========================================================
    // VALIDATE FORM
    // ========================================================

    const validation = validateSignup({
        fullName,
        email,
        password,
        confirmPassword,

        // Future Fields

        // phone,
        // profileImage,
        // gender,
        // dob,
        // cnic,
        // address,
        // city,
        // role
    });

    if (!validation.success) {
        showWarningToast(validation.message, 5000);
        return;
    }

    // ========================================================
    // CREATE FIREBASE USER
    // ========================================================

    const submitBtn = signupForm.querySelector("button[type='submit']");
    showButtonLoader(submitBtn);

    try {

        const response = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = response.user;

        await saveUser({
            uid: user.uid,
            fullName,
            email,
            provider: "password",
            photoURL: "",
        });

        console.info("User Created:", user);

        signupForm.reset();

        showSuccessToast("Account created successfully.", 2500);

        createNotification("signup", "Account Created", "Your account has been created successfully.").catch(() => {});

        // Wait so user can see the toast
        setTimeout(() => {
            window.location.href = "./login.html";
        }, 2500);

    }

    catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/email-already-in-use":
                showErrorToast("This email is already registered.", 5000);
                break;

            case "auth/invalid-email":
                showErrorToast("Please enter a valid email address.", 5000);
                break;

            case "auth/weak-password":
                showErrorToast("Password should be at least 6 characters.", 5000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Network error. Please check your internet connection.");
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
// HANDLE GOOGLE SIGNUP
// ============================================================

const handleGoogleSignup = async () => {

    showButtonLoader(googleSignupBtn);

    try {

        const user = await signInWithGoogle();

        await saveUser({
            uid: user.uid,
            fullName: user.displayName,
            email: user.email,
            provider: "google",
            photoURL: user.photoURL || "",
        });

        console.info("Google User:", user);

        showSuccessToast("Signed in with Google successfully.", 5000);

        createNotification("signup", "Account Created", "Your account has been created successfully.").catch(() => {});

        // Wait so user can see the toast
        // TODO: Replace "./dashboard.html" with the actual dashboard path once the route is ready
        setTimeout(() => {
            window.location.href = "../../pages/dashboard/dashboard.html";
        }, 5000);

    }

    catch (error) {

        console.error("Error during Google signup:", error);

        switch (error.code) {

            case "auth/account-exists-with-different-credential":
                showErrorToast("This email is already registered. Please log in instead.", 8000);
                break;

            case "auth/popup-closed-by-user":
                showWarningToast("Google sign in was cancelled.", 5000);
                break;

            case "auth/popup-blocked":
                showErrorToast("Popup was blocked by your browser.", 5000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Please check your internet connection.", 5000);
                break;

            default:
                showErrorToast("Google sign in failed. Please try again.", 5000);
        }

    }

    finally {
        hideButtonLoader(googleSignupBtn);
    }

};

// ============================================================
// HANDLE GITHUB SIGNUP
// ============================================================

const handleGithubSignup = async () => {

    showButtonLoader(githubSignupBtn);

    try {

        const user = await signInWithGithub();

        await saveUser({
            uid: user.uid,
            fullName: user.displayName,
            email: user.email,
            provider: "github",
            photoURL: user.photoURL || "",
        });

        console.info("GitHub User:", user);

        showSuccessToast("Signed in with GitHub successfully.", 5000);

        createNotification("signup", "Account Created", "Your account has been created successfully.").catch(() => {});

        setTimeout(() => {
            window.location.href = "../../pages/dashboard/dashboard.html";
        }, 5000);

    }

    catch (error) {

        console.error("Error during GitHub signup:", error);

        switch (error.code) {

            case "auth/account-exists-with-different-credential":
                showErrorToast("This email is already registered. Please log in instead.", 8000);
                break;

            case "auth/popup-closed-by-user":
                showWarningToast("GitHub sign in was cancelled.", 5000);
                break;

            case "auth/popup-blocked":
                showErrorToast("Popup was blocked by your browser.", 5000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Please check your internet connection.", 5000);
                break;

            default:
                showErrorToast("GitHub sign in failed. Please try again.", 5000);
        }

    }

    finally {
        hideButtonLoader(githubSignupBtn);
    }

};


// ============================================================
// PASSWORD TOGGLE
// ============================================================

initializePasswordToggle();


// ============================================================
// EVENT LISTENER
// ============================================================

signupForm.addEventListener("submit", handleSignup);
googleSignupBtn.addEventListener("click", handleGoogleSignup);
githubSignupBtn.addEventListener("click", handleGithubSignup);
