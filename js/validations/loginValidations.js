// ============================================================
// LOGIN VALIDATION
// Responsibility:
// - Validate login form data
// - Return validation status and message
// - Easily extendable for future login fields
// ============================================================

const validateLogin = ({

    email,
    password,

    // ========================================================
    // FUTURE FIELDS
    // Uncomment whenever these fields are added to the login form.
    // ========================================================

    // rememberMe,
    // role,
    // teacherId,
    // studentId,
    // adminId,
    // phone,
    // otp,
    // captcha

}) => {

    // ========================================================
    // EMAIL VALIDATION
    // ========================================================

    if (!email) {
        return {
            success: false,
            message: "Email is required."
        };
    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address."
        };
    }

    // ========================================================
    // PASSWORD VALIDATION
    // ========================================================

    if (!password) {
        return {
            success: false,
            message: "Password is required."
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: "Password must be at least 6 characters."
        };
    }

    // ========================================================
    // FUTURE VALIDATIONS
    // Uncomment whenever the corresponding field is enabled.
    // ========================================================

    /*
    if (!teacherId) {
        return {
            success: false,
            message: "Teacher ID is required."
        };
    }

    if (!studentId) {
        return {
            success: false,
            message: "Student ID is required."
        };
    }

    if (!adminId) {
        return {
            success: false,
            message: "Admin ID is required."
        };
    }

    if (!otp) {
        return {
            success: false,
            message: "OTP is required."
        };
    }

    if (!captcha) {
        return {
            success: false,
            message: "Please verify the captcha."
        };
    }
    */

    // ========================================================
    // SUCCESS
    // ========================================================

    return {
        success: true,
        message: "Validation passed."
    };

};

// ============================================================
// EXPORT
// ============================================================

export { validateLogin };