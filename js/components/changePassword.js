import { auth } from "../configuration/firebase.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { showSuccessToast, showErrorToast } from "../ui/toast.js";

let cachedRefs = null;
let initialized = false;
let changePasswordLink = null;

const getRefs = () => {
  if (cachedRefs) return cachedRefs;

  cachedRefs = {
    modal: document.getElementById("changePasswordModal"),
    closeBtns: document.querySelectorAll(".change-password-modal-close"),
    form: document.getElementById("changePasswordForm"),
    saveBtn: document.getElementById("savePasswordBtn"),
    currentPassword: document.getElementById("currentPassword"),
    newPassword: document.getElementById("newPassword"),
    pwToggles: null,
  };

  return cachedRefs;
};

const togglePasswordVisibility = (btn, input) => {
  const isVisible = btn.classList.contains("eye-toggle--visible");
  if (isVisible) {
    input.type = "password";
    btn.classList.remove("eye-toggle--visible");
  } else {
    input.type = "text";
    btn.classList.add("eye-toggle--visible");
  }
};

const openModal = () => {
  const r = getRefs();
  if (!r.modal) return;
  r.modal.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  const r = getRefs();
  if (!r.modal) return;
  r.modal.hidden = true;
  document.body.style.overflow = "";
};

const clearFields = () => {
  const r = getRefs();
  if (r.currentPassword) r.currentPassword.value = "";
  if (r.newPassword) r.newPassword.value = "";
};

const getFirebaseErrorMessage = (error) => {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Current password is incorrect.";
    case "auth/weak-password":
      return "New password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "Something went wrong. Please try again.";
  }
};

const handleSavePassword = async (e) => {
  e.preventDefault();

  const r = getRefs();
  const currentPw = r.currentPassword?.value?.trim();
  const newPw = r.newPassword?.value?.trim();

  if (!currentPw || !newPw) {
    showErrorToast("Both password fields are required.", 4000);
    return;
  }

  if (newPw.length < 6) {
    showErrorToast("Password must be at least 6 characters.", 4000);
    return;
  }

  const user = auth.currentUser;
  if (!user?.email) {
    showErrorToast("No authenticated user found.", 4000);
    return;
  }

  showButtonLoader(r.saveBtn);

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPw);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPw);

    hideButtonLoader(r.saveBtn);
    closeModal();
    clearFields();
    showSuccessToast("Password updated successfully.", 3000);
  } catch (error) {
    hideButtonLoader(r.saveBtn);
    showErrorToast(getFirebaseErrorMessage(error), 5000);
  }
};

const getProviderLabels = () => {
  const user = auth.currentUser;
  if (!user?.providerData) return [];
  return user.providerData.map((p) => p.providerId);
};

const handleLinkClick = async (e) => {
  e.preventDefault();

  if (!changePasswordLink) return;

  showButtonLoader(changePasswordLink);
  await new Promise((r) => setTimeout(r, 300));

  const providers = getProviderLabels();
  const hasPasswordProvider = providers.includes("password");

  hideButtonLoader(changePasswordLink);

  if (hasPasswordProvider) {
    openModal();
    return;
  }

  if (providers.includes("google.com")) {
    showErrorToast("Your account is signed in with Google. Please change your password from your Google Account.", 6000);
    return;
  }

  if (providers.includes("github.com")) {
    showErrorToast("Your account is signed in with GitHub. Please change your password from your GitHub Account.", 6000);
    return;
  }

  showErrorToast("Password change is not available for your authentication method.", 5000);
};

const setupEventListeners = () => {
  const r = getRefs();

  if (!r.modal) return;

  r.closeBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  r.modal.addEventListener("click", (e) => {
    if (e.target === r.modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && r.modal && !r.modal.hidden) {
      closeModal();
    }
  });

  if (r.form) {
    r.form.addEventListener("submit", handleSavePassword);
  }

  const pwToggles = r.modal.querySelectorAll(".eye-toggle");
  pwToggles.forEach((btn) => {
    const wrapper = btn.closest(".password-wrapper");
    const input = wrapper?.querySelector(".form-input");
    if (input) {
      btn.addEventListener("click", () => togglePasswordVisibility(btn, input));
    }
  });
};

const initChangePassword = () => {
  if (initialized) return;
  initialized = true;

  getRefs();

  if (!cachedRefs.modal) {
    console.warn("ChangePassword: modal element not found.");
    return;
  }

  const menuLinks = document.querySelectorAll('.profile-dropdown a[role="menuitem"]');
  changePasswordLink = menuLinks[1];

  if (!changePasswordLink) {
    console.warn("ChangePassword: Change Password link not found in dropdown.");
    return;
  }

  changePasswordLink.addEventListener("click", handleLinkClick);

  setupEventListeners();
};

export { initChangePassword };
