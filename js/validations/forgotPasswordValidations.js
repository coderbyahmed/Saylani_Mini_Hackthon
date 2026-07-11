// ============================================================
// FORGOT PASSWORD VALIDATION
// Responsibility: Validate forgot password form data only.
// No DOM manipulation, no Firebase, no Toast, no Alerts.
// Returns { success, message } for every case.
// ============================================================

const validateForgotPassword = ({

    email,

    // Optional fields (kept for future use)

    // username,
    // phone,
    // role

} = {}) => {

    // ============================================================
    // EMAIL VALIDATION
    // ============================================================

    if (!email || email.trim() === "") {
        return {
            success: false,
            message: "Email is required."
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address."
        };
    }

    // ============================================================
    // OPTIONAL FIELD VALIDATION BLOCKS
    // Uncomment the corresponding block when the HTML field
    // is enabled. No other changes needed.
    // ============================================================

    // ============================================================
    // OPTIONAL FIELD — USERNAME
    // ============================================================

    // if (!username || username.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Username is required."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — PHONE NUMBER
    // ============================================================

    // if (!phone || phone.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Phone number is required."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — ROLE
    // ============================================================

    // if (!role || role.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Role is required."
    //     };
    // }

    // ============================================================
    // SUCCESS
    // ============================================================

    return {
        success: true,
        message: "Validation passed."
    };

};

export { validateForgotPassword };