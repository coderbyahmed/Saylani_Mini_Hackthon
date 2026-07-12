import { db } from "../configuration/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const ISSUES_COLLECTION = "issues";

const getIssues = async () => {
    try {
        const issuesRef = query(collection(db, ISSUES_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(issuesRef);

        return snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
        }));
    } catch (error) {
        console.error("IssueRepository: getIssues failed —", error.message);
        throw error;
    }
};

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

const updateIssue = async (issueId, updates) => {
    try {
        await updateDoc(doc(db, ISSUES_COLLECTION, issueId), {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error("IssueRepository: updateIssue failed —", error.message);
        throw error;
    }
};

const deleteIssue = async (issueId) => {
    try {
        await deleteDoc(doc(db, ISSUES_COLLECTION, issueId));
        return { success: true };
    } catch (error) {
        console.error("IssueRepository: deleteIssue failed —", error.message);
        throw error;
    }
};

export { getIssues, addIssue, updateIssue, deleteIssue };
