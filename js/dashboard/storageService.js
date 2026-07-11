// ============================================================
// STORAGE SERVICE
// Responsibility: Upload images to Cloudinary.
// No Firestore, no DOM, no modal logic, no toasts.
// ============================================================

import { UPLOAD_PRESET, FOLDER_NAME, UPLOAD_ENDPOINT } from "../configuration/cloudinary.js";

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ============================================================
// PRIVATE — VALIDATE IMAGE
// Throws on invalid input. Returns true when valid.
// ============================================================

const validateImage = (file) => {

  if (!file) {
    throw new Error("No file provided.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 5 MB limit.");
  }

  return true;

};

// ============================================================
// PRIVATE — UPLOAD TO CLOUDINARY
// ============================================================

const uploadToCloudinary = async (file) => {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", FOLDER_NAME);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}.`);
  }

  return response.json();

};

// ============================================================
// PUBLIC — UPLOAD IMAGE
// Validates the file then uploads to Cloudinary.
// Returns a clean result object on success.
// Throws a descriptive Error on failure.
// ============================================================

const uploadImage = async (file) => {

  try {

    validateImage(file);

    const result = await uploadToCloudinary(file);

    return {
      imageUrl: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };

  } catch (error) {

    console.error("StorageService: upload failed —", error.message);

    throw error;

  }

};

export { uploadImage };
