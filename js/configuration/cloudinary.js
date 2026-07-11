// ============================================================
// CLOUDINARY CONFIGURATION
// Single source of truth for all Cloudinary settings.
// Other modules import these values instead of hardcoding
// strings.  Fill in the placeholders before using any upload
// functionality.
// ============================================================

// ============================================================
// CREDENTIALS
// Update these with your Cloudinary account values.
// ============================================================

const CLOUD_NAME = "xwvzjuev";
const UPLOAD_PRESET = "Saylani-Mini-hackthon";
const FOLDER_NAME = "student-management";

// ============================================================
// ENDPOINT
// Built automatically from CLOUD_NAME so it stays consistent
// across all upload calls.
// ============================================================

const UPLOAD_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export { CLOUD_NAME, UPLOAD_PRESET, FOLDER_NAME, UPLOAD_ENDPOINT };
