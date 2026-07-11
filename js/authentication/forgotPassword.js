// ============================================================
// FIREBASE
// ============================================================
import { auth } from "../configuration/firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { validateForgotPassword } from "../validations/forgotPasswordValidations.js";
import { showSuccessToast, showErrorToast, showWarningToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { checkUserExistsByEmail } from "./userService.js";
// ============================================================
// DOM REFERENCES
// ============================================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const submitButton = document.getElementById("submitButton");

// ============================================================
// HANDLE FORGOT PASSWORD
// ============================================================

const handleForgotPassword = async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();

    const validation = validateForgotPassword({
        email
    });

    if (!validation.success) {
        showWarningToast(validation.message, 5000);
        return;
    }

    // ========================================================
    // SHOW BUTTON LOADER
    // ========================================================

    showButtonLoader(submitButton);

    try {

        // 3. Firestore Check
        const user = await checkUserExistsByEmail(email);

        if (!user.exists) {
            showErrorToast("No account found with this email.", 5000);
            return;
        }

        if (user.provider === "google") {
            showErrorToast("This account uses Google Sign-In. Please login using Continue with Google.", 9000);
            return;
        }


        // ====================================================
        // SEND PASSWORD RESET EMAIL
        // ====================================================

        await sendPasswordResetEmail(auth, email);

        console.info("Password reset email sent.");

        forgotPasswordForm.reset();

        showSuccessToast("Password reset email sent successfully.", 5000);

        // Wait so user can read the toast

        setTimeout(() => {
            window.location.href = "./login.html";
        }, 5000);

    }

    catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/user-not-found":
                showErrorToast("No account found with this email.", 5000);
                break;

            case "auth/invalid-email":
                showErrorToast("Please enter a valid email address.", 4000);
                break;

            case "auth/network-request-failed":
                showErrorToast("Network error. Please check your internet connection.", 6000);
                break;

            case "auth/too-many-requests":
                showErrorToast("Too many requests. Please try again later.", 5000);
                break;

            default:
                showErrorToast("Something went wrong. Please try again.", 5000);
        }

    }

    finally {

        hideButtonLoader(submitButton);

    }

};

// ============================================================
// EVENT LISTENER
// ============================================================

forgotPasswordForm.addEventListener("submit", handleForgotPassword);
