// ============================================================
// DASHBOARD VALIDATION
// Responsibility: Validate CRUD form data only.
// No DOM manipulation, no Firebase, no Toast, no Alerts.
// Returns { success, message } for every case.
// ============================================================

const VALID_GENDERS = ["male", "female", "other"];
const VALID_STATUSES = ["active", "inactive", "pending", "archived"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-()+]{7,20}$/;

const validateRecord = ({
  fullName,
  referenceName,
  email,
  phoneNumber,
  alternatePhoneNumber,
  gender,
  dateOfBirth,
  country,
  city,
  address,
  status,
} = {}) => {

  // ============================================================
  // FULL NAME
  // ============================================================
  if (!fullName || fullName.trim() === "") {
    return {
      success: false,
      message: "Full name is required."
    };
  }

  if (fullName.trim().length < 2) {
    return {
      success: false,
      message: "Full name must be at least 2 characters."
    };
  }

  // ============================================================
  // REFERENCE NAME (optional — no validation when empty)
  // ============================================================
  if (referenceName && referenceName.trim() !== "" && referenceName.trim().length < 2) {
    return {
      success: false,
      message: "Reference name must be at least 2 characters."
    };
  }

  // ============================================================
  // EMAIL
  // ============================================================
  if (!email || email.trim() === "") {
    return {
      success: false,
      message: "Email is required."
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      success: false,
      message: "Please enter a valid email address."
    };
  }

  // ============================================================
  // PHONE NUMBER
  // ============================================================
  if (!phoneNumber || phoneNumber.trim() === "") {
    return {
      success: false,
      message: "Phone number is required."
    };
  }

  if (!PHONE_REGEX.test(phoneNumber.trim())) {
    return {
      success: false,
      message: "Please enter a valid phone number."
    };
  }

  // ============================================================
  // ALTERNATE PHONE NUMBER (optional)
  // ============================================================
  if (alternatePhoneNumber && alternatePhoneNumber.trim() !== "" && !PHONE_REGEX.test(alternatePhoneNumber.trim())) {
    return {
      success: false,
      message: "Please enter a valid alternate phone number."
    };
  }

  // ============================================================
  // GENDER
  // ============================================================
  if (!gender || gender.trim() === "") {
    return {
      success: false,
      message: "Gender is required."
    };
  }

  if (!VALID_GENDERS.includes(gender.toLowerCase())) {
    return {
      success: false,
      message: "Please select a valid gender."
    };
  }

  // ============================================================
  // DATE OF BIRTH
  // ============================================================
  if (!dateOfBirth || dateOfBirth.trim() === "") {
    return {
      success: false,
      message: "Date of birth is required."
    };
  }

  const dobDate = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dobDate.getTime())) {
    return {
      success: false,
      message: "Please enter a valid date of birth."
    };
  }

  if (dobDate >= today) {
    return {
      success: false,
      message: "Date of birth must be in the past."
    };
  }

  // ============================================================
  // COUNTRY
  // ============================================================
  if (!country || country.trim() === "") {
    return {
      success: false,
      message: "Country is required."
    };
  }

  // ============================================================
  // CITY
  // ============================================================
  if (!city || city.trim() === "") {
    return {
      success: false,
      message: "City is required."
    };
  }

  // ============================================================
  // ADDRESS
  // ============================================================
  if (!address || address.trim() === "") {
    return {
      success: false,
      message: "Address is required."
    };
  }

  if (address.trim().length < 5) {
    return {
      success: false,
      message: "Address must be at least 5 characters."
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

export { validateRecord };
