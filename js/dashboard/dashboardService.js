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
import { validateAsset } from "../validations/dashboardValidations.js";

// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_NAME = "recordData";
const NOTIFICATIONS_COLLECTION = "notifications";
const MAX_NOTIFICATIONS = 5;

// ============================================================
// PRIVATE — GENERATE ASSET ID
// Auto-generates an asset ID like "AST-A1B2C3"
// ============================================================

const generateAssetId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "AST-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

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
    assetName: data.assetName,
    assetId: data.assetId || "",
    category: data.category || "",
    location: data.location || "",
    status: data.status,
    lastMaintenance: data.lastMaintenance || "",
    assetImageUrl: cloudinaryResult ? cloudinaryResult.imageUrl : "",
    assetImagePublicId: cloudinaryResult ? cloudinaryResult.publicId : "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return doc;

};

// ============================================================
// PUBLIC — ADD ASSET
// Validates form data, uploads image if present, saves to
// Firestore. Throws on failure. Returns { success, id }.
// ============================================================

const addAsset = async (assetData) => {

  try {

    const { assetImage, ...fields } = assetData;

    if (!fields.assetId || fields.assetId.trim() === "") {
      fields.assetId = generateAssetId();
    }

    // --------------------------------------------------
    // 1. Validate
    // --------------------------------------------------

    const validation = validateAsset(fields);

    if (!validation.success) {
      throw new Error(validation.message);
    }

    // --------------------------------------------------
    // 2. Upload image (if provided)
    // --------------------------------------------------

    let cloudinaryResult = null;

    if (assetImage) {
      cloudinaryResult = await uploadImage(assetImage);
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

    console.error("DashboardService: addAsset failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — FETCH ASSETS
// Retrieves all documents from the assets collection ordered
// by createdAt descending. Returns an array of { id, ...data }.
// Throws on failure.
// ============================================================

const fetchAssets = async () => {

  try {

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const assets = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      assets.push({
        id: doc.id,
        ...data,
      });
    });

    return assets;

  } catch (error) {

    console.error("DashboardService: fetchAssets failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — FETCH ASSET BY ID
// Retrieves a single document from the assets collection.
// Returns { id, ...data } or null if not found.
// Throws on failure.
// ============================================================

const fetchAssetById = async (assetId) => {

  try {

    const docRef = doc(db, COLLECTION_NAME, assetId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };

  } catch (error) {

    console.error("DashboardService: fetchAssetById failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — UPDATE ASSET
// Validates form data, uploads new image if changed, updates
// the Firestore document. Preserves createdAt.
// Returns { success } or throws on failure.
// ============================================================

const updateAsset = async (assetId, assetData) => {

  try {

    const { assetImage, ...fields } = assetData;

    // --------------------------------------------------
    // 1. Validate
    // --------------------------------------------------

    const validation = validateAsset(fields);

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

    if (assetImage) {
      const cloudinaryResult = await uploadImage(assetImage);
      updatePayload.assetImageUrl = cloudinaryResult.imageUrl;
      updatePayload.assetImagePublicId = cloudinaryResult.publicId;
    }

    // --------------------------------------------------
    // 4. Update Firestore
    // --------------------------------------------------

    await updateDoc(doc(db, COLLECTION_NAME, assetId), updatePayload);

    return {
      success: true,
    };

  } catch (error) {

    console.error("DashboardService: updateAsset failed —", error.message);

    throw error;

  }

};

// ============================================================
// PUBLIC — DELETE ASSET
// Permanently deletes the Firestore document matching the
// given asset ID. Does NOT delete Cloudinary images.
// Returns { success } or throws on failure.
// ============================================================

const deleteAsset = async (assetId) => {

  try {

    await deleteDoc(doc(db, COLLECTION_NAME, assetId));

    return {
      success: true,
    };

  } catch (error) {

    console.error("DashboardService: deleteAsset failed —", error.message);

    throw error;

  }

};

export {
  addAsset,
  fetchAssets,
  fetchAssetById,
  updateAsset,
  deleteAsset,
  createNotification,
  getNotifications,
  markAllNotificationsAsRead,
  maintainNotificationLimit,
};
