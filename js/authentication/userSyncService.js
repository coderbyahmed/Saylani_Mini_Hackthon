import { db } from "../configuration/firebase.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ============================================================
// DEFAULT ROLE
// ============================================================

const DEFAULT_ROLE = "user";

// ============================================================
// SYNC USER DOCUMENT
//
// Ensures the Firestore `users/{uid}` document exists and
// reflects the latest profile data.  Calling code passes the
// raw Firebase Auth user object plus any extra fields (e.g.
// fullName from a sign‑up form).
//
// Rules:
//   1. If the doc does NOT exist → create it.
//   2. If the doc already exists → update login timestamps and
//      any fields that are missing or that the Auth provider
//      can supply (except photoURL — never overwrite a non‑empty
//      value with an empty one).
//   3. photoURL from Google/GitHub is stored on creation and
//      on subsequent syncs ONLY if the stored value is empty.
//      This protects future Cloudinary uploads.
// ============================================================

const syncUserDocument = async ({ user, provider = "password", extraData = {} }) => {

    try {

        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);

        const now = serverTimestamp();

        if (!snapshot.exists()) {

            // ——— NEW USER — write the full document ———

            const photoURL =
                extraData.photoURL ||
                (provider === "google" || provider === "github" ? user.photoURL || "" : "");

            await setDoc(userRef, {
                uid: user.uid,
                fullName: extraData.fullName || user.displayName || "",
                email: user.email || "",
                provider,
                photoURL,
                role: DEFAULT_ROLE,
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
            });

            return;

        }

        // ——— EXISTING USER — merge updates ———

        const existing = snapshot.data();

        // Determine photoURL:
        //   - Never overwrite a non‑empty stored URL (preserves Cloudinary uploads).
        //   - For social providers, fill in the URL ONLY if the stored value is empty.
        const newPhotoURL = (() => {
            if (existing.photoURL) return existing.photoURL;
            if (provider === "google" || provider === "github") {
                return user.photoURL || "";
            }
            return "";
        })();

        await setDoc(userRef, {
            uid: user.uid,
            fullName: existing.fullName || extraData.fullName || user.displayName || "",
            email: user.email || existing.email || "",
            provider: existing.provider || provider,
            photoURL: newPhotoURL,
            role: existing.role || DEFAULT_ROLE,
            updatedAt: now,
            lastLoginAt: now,
        }, { merge: true });

    } catch (error) {

        console.error("Error syncing user document:", error);
        throw error;

    }

};

export { syncUserDocument };
