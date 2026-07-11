// ============================================================
// ACTIVITY SERVICE
// Responsibility: Firestore layer for the Recent Activity feed.
// Logs activity documents and retrieves them ordered by time.
// No DOM access, no UI logic.
// ============================================================

import { db } from "../configuration/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_NAME = "activities";

// ============================================================
// PUBLIC — LOG ACTIVITY
// Writes a new activity document to Firestore.
// Returns { success, id } or throws on failure.
// ============================================================

const logActivity = async (type, title, description = "", metadata = {}) => {
  try {

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      type,
      title,
      description,
      metadata,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };

  } catch (error) {
    console.error("ActivityService: logActivity failed —", error.message);
    throw error;
  }
};

// ============================================================
// PUBLIC — FETCH ACTIVITIES
// Retrieves the most recent activities ordered by createdAt
// descending. Returns an array of { id, type, title,
// description, metadata, createdAt }.
// Throws on failure.
// ============================================================

const fetchActivities = async (max = 50) => {
  try {

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc"),
      firestoreLimit(max)
    );

    const snapshot = await getDocs(q);
    const activities = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: data.type || "unknown",
        title: data.title || "",
        description: data.description || "",
        metadata: data.metadata || {},
        createdAt: data.createdAt || null,
      });
    });

    return activities;

  } catch (error) {
    console.error("ActivityService: fetchActivities failed —", error.message);
    throw error;
  }
};

// ============================================================
// PUBLIC — DELETE ACTIVITY
// Deletes an activity document by ID.
// Returns { success } or throws on failure.
// ============================================================

const deleteActivity = async (activityId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, activityId));
    return { success: true };
  } catch (error) {
    console.error("ActivityService: deleteActivity failed —", error.message);
    throw error;
  }
};

// ============================================================
// PUBLIC — DELETE ALL ACTIVITIES
// Fetches every document ID from the collection and deletes
// them in batches of up to 500 (Firestore writeBatch limit).
// Returns { success, count } or throws on failure.
// ============================================================

const deleteAllActivities = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const ids = [];
    snapshot.forEach((d) => ids.push(d.id));

    if (ids.length === 0) return { success: true, count: 0 };

    // Delete in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = ids.slice(i, i + BATCH_SIZE);
      chunk.forEach((id) => {
        batch.delete(doc(db, COLLECTION_NAME, id));
      });
      await batch.commit();
    }

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("ActivityService: deleteAllActivities failed —", error.message);
    throw error;
  }
};

export { logActivity, fetchActivities, deleteActivity, deleteAllActivities };
