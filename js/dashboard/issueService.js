import { getIssues, addIssue, updateIssue, deleteIssue } from "./issueRepository.js";
import { uploadImage } from "./storageService.js";

const generateRandomString = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < length; i += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

const generateIssueId = () => `ISSUE-${generateRandomString(8)}`;

const fetchIssues = async () => getIssues();

const createIssue = async ({ assetId, assetName, reporterName, reporterEmail, issueTitle, issueDescription, priority, status, issueImageFile }) => {
    const issuePayload = {
        issueId: generateIssueId(),
        assetId,
        assetName,
        reporterName: reporterName || "",
        reporterEmail: reporterEmail || "",
        issueTitle,
        issueDescription,
        status: status || "Open",
        priority: priority || "Medium",
        assignedTo: null,
    };

    if (issueImageFile) {
        const uploadResult = await uploadImage(issueImageFile);
        issuePayload.issueImage = uploadResult.imageUrl;
    }

    return addIssue(issuePayload);
};

const updateIssueStatus = async (issueId, status) => updateIssue(issueId, { status });

const updateIssuePriority = async (issueId, priority) => updateIssue(issueId, { priority });

const assignIssue = async (issueId, assignedTo) => updateIssue(issueId, { assignedTo });

const removeIssue = async (issueId) => deleteIssue(issueId);

export {
    fetchIssues,
    createIssue,
    updateIssueStatus,
    updateIssuePriority,
    assignIssue,
    removeIssue,
};
