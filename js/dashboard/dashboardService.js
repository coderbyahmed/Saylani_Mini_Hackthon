// ============================================================
// DASHBOARD SERVICE
// Responsibility: Business layer between UI and Firebase.
// Coordinates validation, image upload, and Firestore writes.
// No DOM access, no modal logic, no toasts.
// ============================================================

import { db } from "../configuration/firebase.js";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  writeBatch,
  where,
  limit as firestoreLimit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { uploadImage } from "./storageService.js";
import { validateRecord } from "../validations/dashboardValidations.js";

// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_NAME = "recordData";
const NOTIFICATIONS_COLLECTION = "notifications";
const MAX_NOTIFICATIONS = 5;

// ============================================================
// NOTIFICATIONS
// ============================================================

const createNotification = async (type, title, message) => {
  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    type,
    title,
    message,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  await maintainNotificationLimit();
};

const getNotifications = async () => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy("createdAt", "desc"),
    firestoreLimit(MAX_NOTIFICATIONS)
  );

  const snapshot = await getDocs(q);
  const notifications = [];

  snapshot.forEach((d) => {
    const data = d.data();
    notifications.push({
      id: d.id,
      type: data.type || "unknown",
      title: data.title || "",
      message: data.message || "",
      isRead: data.isRead === true,
      createdAt: data.createdAt || null,
    });
  });

  return notifications;
};

const markAllNotificationsAsRead = async () => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("isRead", "==", false),
    firestoreLimit(MAX_NOTIFICATIONS)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.forEach((d) => {
    batch.update(doc(db, NOTIFICATIONS_COLLECTION, d.id), { isRead: true });
  });
  await batch.commit();
};

const maintainNotificationLimit = async () => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  if (snapshot.size <= MAX_NOTIFICATIONS) return;

  const batch = writeBatch(db);
  let count = 0;
  snapshot.forEach((d) => {
    count++;
    if (count > MAX_NOTIFICATIONS) {
      batch.delete(doc(db, NOTIFICATIONS_COLLECTION, d.id));
    }
  });
  await batch.commit();
};

// ============================================================
// PRIVATE — BUILD DOCUMENT
// Constructs the clean Firestore document from validated data
// and optional Cloudinary result.
// ============================================================

const buildDocument = (data, cloudinaryResult = null) => {

  const doc = {
    fullName: data.fullName,
    referenceName: data.referenceName || "",
    email: data.email,
    phoneNumber: data.phoneNumber,
    city: data.city,
    country: data.country,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    status: data.status,
    alternatePhoneNumber: data.alternatePhoneNumber || "",
    profileImageUrl: cloudinaryResult ? cloudinaryResult.imageUrl : "",
    profileImagePublicId: cloudinaryResult ? cloudinaryResult.publicId : "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return doc;

};

// ============================================================
// PUBLIC — ADD RECORD
// Validates form data, uploads image if present, saves to
// Firestore. Throws on failure. Returns { success, id }.
// ============================================================

const addRecord = async (recordData) => {

  try {

    const { profileImage, ...fields } = recordData;

    // --------------------------------------------------
    // 1. Validate
    // --------------------------------------------------

    const validation = validateRecord(fields);

    if (!validation.success) {
      throw new Error(validation.message);
    }

    // --------------------------------------------------
    // 2. Upload image (if provided)
    // --------------------------------------------------

    let cloudinaryResult = null;

    if (profileImage) {
      cloudinaryResult = await uploadImage(profileImage);
    }

    // --------------------------------------------------
    // 3. Build and save document
    // --------------------------------------------------

    const docData = buildDocument(fields, cloudinaryResult);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    return {
      success: true,
      id: docRef.id,
    };

  } catch (error) {

    console.error("DashboardService: addRecord failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — FETCH RECORDS
// Retrieves all documents from the records collection ordered
// by createdAt descending. Returns an array of { id, ...data }.
// Throws on failure.
// ============================================================

const fetchRecords = async () => {

  try {

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const records = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        ...data,
      });
    });

    return records;

  } catch (error) {

    console.error("DashboardService: fetchRecords failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — FETCH RECORD BY ID
// Retrieves a single document from the records collection.
// Returns { id, ...data } or null if not found.
// Throws on failure.
// ============================================================

const fetchRecordById = async (recordId) => {

  try {

    const docRef = doc(db, COLLECTION_NAME, recordId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };

  } catch (error) {

    console.error("DashboardService: fetchRecordById failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — UPDATE RECORD
// Validates form data, uploads new image if changed, updates
// the Firestore document. Preserves createdAt.
// Returns { success } or throws on failure.
// ============================================================

const updateRecord = async (recordId, recordData) => {

  try {

    const { profileImage, ...fields } = recordData;

    // --------------------------------------------------
    // 1. Validate
    // --------------------------------------------------

    const validation = validateRecord(fields);

    if (!validation.success) {
      throw new Error(validation.message);
    }

    // --------------------------------------------------
    // 2. Build update payload
    // --------------------------------------------------

    const updatePayload = {
      ...fields,
      updatedAt: serverTimestamp(),
    };

    // --------------------------------------------------
    // 3. Upload new image (if changed)
    // --------------------------------------------------

    if (profileImage) {
      const cloudinaryResult = await uploadImage(profileImage);
      updatePayload.profileImageUrl = cloudinaryResult.imageUrl;
      updatePayload.profileImagePublicId = cloudinaryResult.publicId;
    }

    // --------------------------------------------------
    // 4. Update Firestore
    // --------------------------------------------------

    await updateDoc(doc(db, COLLECTION_NAME, recordId), updatePayload);

    return {
      success: true,
    };

  } catch (error) {

    console.error("DashboardService: updateRecord failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — DELETE RECORD
// Permanently deletes the Firestore document matching the
// given record ID. Does NOT delete Cloudinary images.
// Returns { success } or throws on failure.
// ============================================================

const deleteRecord = async (recordId) => {

  try {

    await deleteDoc(doc(db, COLLECTION_NAME, recordId));

    return {
      success: true,
    };

  } catch (error) {

    console.error("DashboardService: deleteRecord failed —", error.message);

    throw error;

  }

};

export {
  addRecord,
  fetchRecords,
  fetchRecordById,
  updateRecord,
  deleteRecord,
  createNotification,
  getNotifications,
  markAllNotificationsAsRead,
  maintainNotificationLimit,
};
