import { auth, db } from "../configuration/firebase.js";
import {
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { uploadImage } from "../dashboard/storageService.js";
import { showSuccessToast, showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";

const PROVIDER_LABELS = {
  password: "Email",
  google: "Google",
  github: "GitHub",
};

const USERS_COLLECTION = "users";

let profileRefs = null;
let editRefs = null;
let initialized = false;
let selectedImageFile = null;

const cacheProfileRefs = () => {
  if (profileRefs) return profileRefs;

  profileRefs = {
    modal: document.getElementById("profileModal"),
    closeBtns: document.querySelectorAll(".profile-modal-close"),
    editBtn: document.getElementById("editProfileBtn"),
    avatarSection: document.getElementById("profileAvatar"),
    avatarInitials: document.getElementById("profileAvatarInitials"),
    avatarImg: document.getElementById("profileAvatarImg"),
    fullName: document.getElementById("profileFullName"),
    email: document.getElementById("profileEmail"),
    provider: document.getElementById("profileProvider"),
    created: document.getElementById("profileCreated"),
  };

  return profileRefs;
};

const cacheEditRefs = () => {
  if (editRefs) return editRefs;

  editRefs = {
    modal: document.getElementById("editProfileModal"),
    closeBtns: document.querySelectorAll(".edit-profile-modal-close"),
    form: document.getElementById("editProfileForm"),
    saveBtn: document.getElementById("saveProfileBtn"),
    imageWrapper: document.getElementById("editProfileImageWrapper"),
    imageInput: document.getElementById("editProfileImageInput"),
    avatar: document.getElementById("editProfileAvatar"),
    avatarInitials: document.getElementById("editProfileAvatarInitials"),
    avatarImg: document.getElementById("editProfileAvatarImg"),
    overlay: document.getElementById("editProfileImageOverlay"),
    fullName: document.getElementById("editProfileFullName"),
    email: document.getElementById("editProfileEmail"),
    provider: document.getElementById("editProfileProvider"),
    created: document.getElementById("editProfileCreated"),
  };

  return editRefs;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
};

const openProfileModal = () => {
  const { modal } = cacheProfileRefs();
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeProfileModal = () => {
  const { modal } = cacheProfileRefs();
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
};

const openEditModal = () => {
  const r = cacheEditRefs();
  if (!r.modal) return;

  const user = auth.currentUser;
  if (!user) {
    showErrorToast("No authenticated user found.", 4000);
    return;
  }

  selectedImageFile = null;

  const displayName = user.displayName || "";
  const email = user.email || "";
  const photoURL = user.photoURL || null;

  if (photoURL) {
    if (r.avatarImg) { r.avatarImg.src = photoURL; r.avatarImg.hidden = false; }
    if (r.avatar) r.avatar.hidden = true;
  } else {
    if (r.avatar) r.avatar.hidden = false;
    if (r.avatarImg) r.avatarImg.hidden = true;
    if (r.avatarInitials) r.avatarInitials.textContent = getInitials(displayName);
  }

  r.fullName.value = displayName;
  r.email.value = email;

  getDoc(doc(db, USERS_COLLECTION, user.uid)).then((snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const rawProvider = data.provider || "password";
      r.provider.value = PROVIDER_LABELS[rawProvider] || rawProvider;
      r.created.value = formatDate(data.createdAt);
    } else {
      r.provider.value = PROVIDER_LABELS.password;
      r.created.value = "N/A";
    }
  }).catch(() => {
    r.provider.value = "—";
    r.created.value = "—";
  });

  r.modal.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeEditModal = () => {
  const r = cacheEditRefs();
  if (!r) return;
  if (r.modal) r.modal.hidden = true;
  document.body.style.overflow = "";
  selectedImageFile = null;
};

const renderProfile = ({ userRecord }) => {
  const r = cacheProfileRefs();

  const photoURL = userRecord?.photoURL || null;

  if (photoURL) {
    if (r.avatarImg) { r.avatarImg.src = photoURL; r.avatarImg.hidden = false; }
    if (r.avatarSection) r.avatarSection.hidden = true;
  } else {
    if (r.avatarSection) r.avatarSection.hidden = false;
    if (r.avatarImg) r.avatarImg.hidden = true;
    if (r.avatarInitials) r.avatarInitials.textContent = getInitials(userRecord?.fullName);
  }

  if (r.fullName) r.fullName.textContent = userRecord?.fullName || "—";
  if (r.email) r.email.textContent = userRecord?.email || "—";

  const rawProvider = userRecord?.provider || "password";
  if (r.provider) r.provider.textContent = PROVIDER_LABELS[rawProvider] || rawProvider;

  if (r.created) r.created.textContent = formatDate(userRecord?.createdAt);
};

const loadProfile = async () => {
  const user = auth.currentUser;

  if (!user) {
    showErrorToast("No authenticated user found.", 4000);
    return null;
  }

  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, user.uid));

    if (!docSnap.exists()) {
      showErrorToast("User profile not found in database.", 5000);
      return null;
    }

    return docSnap.data();
  } catch (error) {
    console.error("Error loading profile:", error);
    showErrorToast("Failed to load profile information.", 5000);
    return null;
  }
};

const handleProfileClick = async (e) => {
  e.preventDefault();

  openProfileModal();

  const userRecord = await loadProfile();

  if (userRecord) {
    renderProfile({ userRecord });
  }
};

const handleEditProfileImage = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    showErrorToast("Invalid file type. Only JPEG, PNG, and WebP are allowed.", 4000);
    e.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showErrorToast("File size exceeds the 5 MB limit.", 4000);
    e.target.value = "";
    return;
  }

  selectedImageFile = file;

  const r = cacheEditRefs();
  const reader = new FileReader();

  reader.onload = (ev) => {
    if (r.avatarImg) { r.avatarImg.src = ev.target.result; r.avatarImg.hidden = false; }
    if (r.avatar) r.avatar.hidden = true;
  };

  reader.readAsDataURL(file);
};

const refreshProfileModal = async () => {
  const userRecord = await loadProfile();
  if (userRecord) {
    renderProfile({ userRecord });
  }
};

const handleSaveProfile = async (e) => {
  e.preventDefault();

  const r = cacheEditRefs();
  const saveBtn = r.saveBtn;

  const fullName = r.fullName.value.trim();
  if (!fullName) {
    showErrorToast("Full name is required.", 3000);
    return;
  }

  showButtonLoader(saveBtn);

  try {
    const user = auth.currentUser;
    if (!user) {
      showErrorToast("No authenticated user found.", 4000);
      hideButtonLoader(saveBtn);
      return;
    }

    let photoURL = user.photoURL || "";

    if (selectedImageFile) {
      const result = await uploadImage(selectedImageFile);
      photoURL = result.imageUrl;
    }

    await updateProfile(user, {
      displayName: fullName,
      ...(photoURL ? { photoURL } : {}),
    });

    const updateData = {
      fullName,
      updatedAt: serverTimestamp(),
    };

    if (selectedImageFile) {
      updateData.photoURL = photoURL;
    }

    await updateDoc(doc(db, USERS_COLLECTION, user.uid), updateData);

    hideButtonLoader(saveBtn);

    closeEditModal();

    await refreshProfileModal();

    document.dispatchEvent(new CustomEvent("profile-updated"));

    showSuccessToast("Profile updated successfully.", 3000);
  } catch (error) {
    console.error("Error saving profile:", error);
    hideButtonLoader(saveBtn);
    showErrorToast("Failed to save profile. Please try again.", 5000);
  }
};

const handleEditBtnClick = (e) => {
  e.preventDefault();
  closeProfileModal();
  openEditModal();
};

const setupEventListeners = () => {
  const pr = cacheProfileRefs();
  const er = cacheEditRefs();

  if (pr.modal) {
    pr.closeBtns.forEach((btn) => {
      btn.addEventListener("click", closeProfileModal);
    });

    pr.modal.addEventListener("click", (e) => {
      if (e.target === pr.modal) closeProfileModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (pr.modal && !pr.modal.hidden) closeProfileModal();
        if (er.modal && !er.modal.hidden) closeEditModal();
      }
    });

    if (pr.editBtn) {
      pr.editBtn.addEventListener("click", handleEditBtnClick);
    }
  }

  if (er.modal) {
    er.closeBtns.forEach((btn) => {
      btn.addEventListener("click", closeEditModal);
    });

    er.modal.addEventListener("click", (e) => {
      if (e.target === er.modal) closeEditModal();
    });

    if (er.imageWrapper) {
      er.imageWrapper.addEventListener("click", () => {
        er.imageInput.click();
      });
    }

    if (er.imageInput) {
      er.imageInput.addEventListener("change", handleEditProfileImage);
    }

    if (er.form) {
      er.form.addEventListener("submit", handleSaveProfile);
    }
  }
};

const initMyProfile = () => {
  if (initialized) return;
  initialized = true;

  cacheProfileRefs();
  cacheEditRefs();

  if (!profileRefs.modal) {
    return;
  }

  const profileLink = document.querySelector('.profile-dropdown a[role="menuitem"]');

  if (!profileLink) {
    console.warn("My Profile link not found in the profile dropdown.");
    return;
  }

  profileLink.addEventListener("click", handleProfileClick);

  setupEventListeners();
};

export { initMyProfile };
