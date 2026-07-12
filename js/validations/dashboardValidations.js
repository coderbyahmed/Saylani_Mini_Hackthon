// ============================================================
// DASHBOARD VALIDATION
// Responsibility: Validate CRUD form data only.
// No DOM manipulation, no Firebase, no Toast, no Alerts.
// Returns { success, message } for every case.
// ============================================================

const VALID_STATUSES = ["active", "inactive", "pending", "archived"];
const VALID_CATEGORIES = ["it equipment", "furniture", "vehicle", "tool", "other"];

const validateAsset = ({
  assetName,
  assetId,
  category,
  location,
  status,
  lastMaintenance,
} = {}) => {

  // ============================================================
  // ASSET NAME
  // ============================================================
  if (!assetName || assetName.trim() === "") {
    return {
      success: false,
      message: "Asset name is required."
    };
  }

  if (assetName.trim().length < 2) {
    return {
      success: false,
      message: "Asset name must be at least 2 characters."
    };
  }

  // ============================================================
  // CATEGORY
  // ============================================================
  if (!category || category.trim() === "") {
    return {
      success: false,
      message: "Category is required."
    };
  }

  if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
    return {
      success: false,
      message: "Please select a valid category."
    };
  }

  // ============================================================
  // LOCATION
  // ============================================================
  if (!location || location.trim() === "") {
    return {
      success: false,
      message: "Location is required."
    };
  }

  // ============================================================
  // STATUS
  // ============================================================
  if (!status || status.trim() === "") {
    return {
      success: false,
      message: "Status is required."
    };
  }

  if (!VALID_STATUSES.includes(status.toLowerCase())) {
    return {
      success: false,
      message: "Please select a valid status."
    };
  }

  // ============================================================
  // SUCCESS
  // ============================================================
  return {
    success: true,
    message: "Validation passed."
  };

};

export { validateAsset };
