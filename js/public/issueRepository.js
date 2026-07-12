import { db } from "../configuration/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const ISSUES_COLLECTION = "issues";

const addIssue = async (issuePayload) => {
    try {
        const issuesRef = collection(db, ISSUES_COLLECTION);
        const docRef = await addDoc(issuesRef, {
            ...issuePayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            id: docRef.id,
        };
    } catch (error) {
        console.error("IssueRepository: addIssue failed —", error.message);
        throw error;
    }
};

export { addIssue };
