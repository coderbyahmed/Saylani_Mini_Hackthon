// ============================================================
// SIGNUP VALIDATION
// Responsibility: Validate signup form data only.
// No DOM manipulation, no Firebase, no Toast, no Alerts.
// Returns { success, message } for every case.
// ============================================================

const validateSignup = ({
    fullName,
    email,
    password,
    confirmPassword,
    // Optional fields (kept for future use)
    // phone,
    // profileImage,
    // gender,
    // dob,
    // cnic,
    // address,
    // city,
    // role
} = {}) => {

    // ============================================================
    // FULL NAME VALIDATION
    // ============================================================
    if (!fullName || fullName.trim() === "") {
        return {
            success: false,
            message: "Full name is required."
        };
    }

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
    // PASSWORD VALIDATION
    // ============================================================
    if (!password || password.trim() === "") {
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

    // ============================================================
    // CONFIRM PASSWORD VALIDATION
    // ============================================================
    if (!confirmPassword || confirmPassword.trim() === "") {
        return {
            success: false,
            message: "Confirm password is required."
        };
    }

    if (password !== confirmPassword) {
        return {
            success: false,
            message: "Passwords do not match."
        };
    }

    // ============================================================
    // OPTIONAL FIELD VALIDATION BLOCKS
    // Uncomment the corresponding block when the HTML field
    // is enabled. No other changes needed.
    // ============================================================

    // ============================================================
    // OPTIONAL FIELD — PHONE NUMBER
    // ============================================================
    // if (!phone || phone.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Phone number is required."
    //     };
    // }
    
    // const phoneRegex = /^((\+92|0)3[0-9]{2}[-\s]?[0-9]{7})$/;
    
    // if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    //     return {
    //         success: false,
    //         message: "Please enter a valid Pakistani phone number (e.g. 03XX-XXXXXXX)."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — PROFILE IMAGE
    // ============================================================
    // if (!profileImage) {
    //     return {
    //         success: false,
    //         message: "Profile image is required."
    //     };
    // }
    //
    // const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    // const maxFileSize = 2 * 1024 * 1024; // 2 MB
    //
    // if (!allowedImageTypes.includes(profileImage.type)) {
    //     return {
    //         success: false,
    //         message: "Profile image must be a JPEG, PNG, WebP, or GIF file."
    //     };
    // }
    //
    // if (profileImage.size > maxFileSize) {
    //     return {
    //         success: false,
    //         message: "Profile image must be less than 2 MB."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — GENDER
    // ============================================================
    // if (!gender || gender.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Gender is required."
    //     };
    // }
    //
    // const validGenders = ["male", "female", "other"];
    //
    // if (!validGenders.includes(gender.toLowerCase())) {
    //     return {
    //         success: false,
    //         message: "Please select a valid gender."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — DATE OF BIRTH
    // ============================================================
    // if (!dob || dob.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Date of birth is required."
    //     };
    // }
    //
    // const dobDate = new Date(dob);
    // const today = new Date();
    // const minAge = 12;
    // const age = today.getFullYear() - dobDate.getFullYear();
    //
    // if (isNaN(dobDate.getTime())) {
    //     return {
    //         success: false,
    //         message: "Please enter a valid date of birth."
    //     };
    // }
    //
    // if (age < minAge) {
    //     return {
    //         success: false,
    //         message: "You must be at least 12 years old."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — CNIC
    // ============================================================
    // if (!cnic || cnic.trim() === "") {
    //     return {
    //         success: false,
    //         message: "CNIC is required."
    //     };
    // }
    //
    // const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    //
    // if (!cnicRegex.test(cnic.trim())) {
    //     return {
    //         success: false,
    //         message: "CNIC must match the format XXXXX-XXXXXXX-X."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — ADDRESS
    // ============================================================
    // if (!address || address.trim() === "") {
    //     return {
    //         success: false,
    //         message: "Address is required."
    //     };
    // }
    //
    // if (address.trim().length < 10) {
    //     return {
    //         success: false,
    //         message: "Address must be at least 10 characters."
    //     };
    // }

    // ============================================================
    // OPTIONAL FIELD — CITY
    // ============================================================
    // if (!city || city.trim() === "") {
    //     return {
    //         success: false,
    //         message: "City is required."
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
    //
    // const validRoles = ["student", "teacher", "admin"];
    //
    // if (!validRoles.includes(role.toLowerCase())) {
    //     return {
    //         success: false,
    //         message: "Please select a valid role."
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

export { validateSignup };


