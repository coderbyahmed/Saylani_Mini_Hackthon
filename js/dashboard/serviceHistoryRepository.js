import { db } from "../configuration/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    serverTimestamp,
    query,
    orderBy,
    where,
    limit as firestoreLimit,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const SERVICE_HISTORY_COLLECTION = "serviceHistory";

const addServiceHistoryEntry = async (entry) => {
    try {
        const docRef = await addDoc(collection(db, SERVICE_HISTORY_COLLECTION), {
            ...entry,
            createdAt: serverTimestamp(),
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("ServiceHistoryRepository: addEntry failed —", error.message);
        throw error;
    }
};

const getServiceHistoryByIssue = async (issueId) => {
    try {
        const q = query(
            collection(db, SERVICE_HISTORY_COLLECTION),
            where("issueId", "==", issueId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
        }));
    } catch (error) {
        console.error("ServiceHistoryRepository: getByIssue failed —", error.message);
        throw error;
    }
};

const getServiceHistoryByAsset = async (assetId) => {
    try {
        const q = query(
            collection(db, SERVICE_HISTORY_COLLECTION),
            where("assetId", "==", assetId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
        }));
    } catch (error) {
        console.error("ServiceHistoryRepository: getByAsset failed —", error.message);
        throw error;
    }
};

const getAllServiceHistory = async (max = 50) => {
    try {
        const q = query(
            collection(db, SERVICE_HISTORY_COLLECTION),
            orderBy("createdAt", "desc"),
            firestoreLimit(max)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
        }));
    } catch (error) {
        console.error("ServiceHistoryRepository: getAll failed —", error.message);
        throw error;
    }
};

export {
    addServiceHistoryEntry,
    getServiceHistoryByIssue,
    getServiceHistoryByAsset,
    getAllServiceHistory,
};
