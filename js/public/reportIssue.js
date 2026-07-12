import { showErrorToast, showSuccessToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import { submitIssue } from "./issueService.js";
import { getCurrentAsset } from "./assetDetails.js";

const FORM_ID = "reportIssueForm";
const REPORTER_NAME = "reporterName";
const REPORTER_EMAIL = "reporterEmail";
const ISSUE_TITLE = "issueTitle";
const ISSUE_DESCRIPTION = "issueDescription";
const ISSUE_PHOTO = "issuePhoto";

const fieldMap = {
    reporterName: "reporterNameError",
    reporterEmail: "reporterEmailError",
    issueTitle: "issueTitleError",
    issueDescription: "issueDescriptionError",
};

const getInput = (id) => document.getElementById(id);
const getError = (id) => document.getElementById(id);

const clearErrors = () => {
    Object.values(fieldMap).forEach((errorId) => {
        const errorEl = getError(errorId);
        if (errorEl) {
            errorEl.textContent = "";
        }
    });
};

const setError = (fieldId, message) => {
    const errorEl = getError(fieldMap[fieldId]);
    if (errorEl) {
        errorEl.textContent = message;
    }
};

const isValidEmail = (value) => {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
};

const validateIssueForm = ({ reporterName, reporterEmail, issueTitle, issueDescription }) => {
    const errors = {};

    if (!reporterName || reporterName.trim().length < 2) {
        errors.reporterName = "Reporter name is required and must be at least 2 characters.";
    }

    if (!reporterEmail || reporterEmail.trim() === "") {
        errors.reporterEmail = "Reporter email is required.";
    } else if (!isValidEmail(reporterEmail)) {
        errors.reporterEmail = "Please enter a valid email address.";
    }

    if (!issueTitle || issueTitle.trim().length < 5) {
        errors.issueTitle = "Issue title is required and should be at least 5 characters.";
    }

    if (!issueDescription || issueDescription.trim().length < 15) {
        errors.issueDescription = "Issue description is required and should be at least 15 characters.";
    }

    return errors;
};

let isSubmitting = false;

const resetForm = (form) => {
    if (!form) return;
    form.reset();
    clearErrors();
};

const getSubmitButton = (form) => form.querySelector("button[type='submit']");

const handleSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const submitButton = getSubmitButton(form);

    const reporterName = getInput(REPORTER_NAME)?.value || "";
    const reporterEmail = getInput(REPORTER_EMAIL)?.value || "";
    const issueTitle = getInput(ISSUE_TITLE)?.value || "";
    const issueDescription = getInput(ISSUE_DESCRIPTION)?.value || "";
    const issuePhotoFile = getInput(ISSUE_PHOTO)?.files?.[0] || null;

    const errors = validateIssueForm({ reporterName, reporterEmail, issueTitle, issueDescription });

    if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        showErrorToast("Please fix the highlighted fields before submitting.");
        return;
    }

    const currentAsset = getCurrentAsset();

    if (!currentAsset) {
        showErrorToast("Asset information is unavailable. Please refresh the page.");
        return;
    }

    const issueData = {
        assetId: currentAsset.assetId,
        assetName: currentAsset.assetName,
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        issueTitle: issueTitle.trim(),
        issueDescription: issueDescription.trim(),
        issueImageFile: issuePhotoFile,
    };

    try {
        isSubmitting = true;
        showButtonLoader(submitButton);

        await submitIssue(issueData);

        showSuccessToast("Issue submitted successfully. Thank you for your report.");
        resetForm(form);
    } catch (error) {
        showErrorToast(error.message || "Failed to submit issue. Please try again.");
    } finally {
        hideButtonLoader(submitButton);
        isSubmitting = false;
    }
};

const initReportIssueForm = () => {
    const form = document.getElementById(FORM_ID);
    if (!form) return;

    form.addEventListener("submit", handleSubmit);
};

window.addEventListener("DOMContentLoaded", initReportIssueForm);

export { initReportIssueForm };
