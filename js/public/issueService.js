import { uploadImage } from "../dashboard/storageService.js";
import { addIssue } from "./issueRepository.js";

const generateRandomString = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < length; i += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

const generateIssueId = () => `ISSUE-${generateRandomString(8)}`;

const submitIssue = async ({ assetId, assetName, reporterName, reporterEmail, issueTitle, issueDescription, issueImageFile }) => {
    const issuePayload = {
        issueId: generateIssueId(),
        assetId,
        assetName,
        reporterName,
        reporterEmail,
        issueTitle,
        issueDescription,
        status: "Open",
        priority: "Medium",
        assignedTo: null,
    };

    if (issueImageFile) {
        const uploadResult = await uploadImage(issueImageFile);
        issuePayload.issueImage = uploadResult.imageUrl;
    }

    return addIssue(issuePayload);
};

export { submitIssue };
