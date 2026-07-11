import { db } from "../configuration/firebase.js";
import {
    doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { syncUserDocument } from "./userSyncService.js";

// ============================================================
// SAVE USER
// Delegates to syncUserDocument for consistent create/update
// logic.  Kept as a convenience wrapper so existing callers
// (signup.js, googleAuth.js) don't need to change signatures.
// ============================================================

const saveUser = async ({ uid, fullName, email, provider = "password", photoURL }) => {

    try {

        // Build a minimal user-like object for syncUserDocument
        const user = { uid, email, displayName: fullName, photoURL: photoURL || null };

        await syncUserDocument({
            user,
            provider,
            extraData: { fullName, photoURL },
        });

    } catch (error) {

        console.error("Error saving user:", error);

        throw error;

    }
};

// ============================================================
// CHECK USER BY EMAIL
// Returns user information from Firestore.
// ============================================================

const checkUserExistsByEmail = async (email) => {

    try {

        const usersRef = collection(db, "users");

        const queryRef = query(
            usersRef,
            where("email", "==", email)
        );

        const snapshot = await getDocs(queryRef);

        if (snapshot.empty) {
            return {
                exists: false
            };
        }

        const userData = snapshot.docs[0].data();

        return {
            exists: true,
            uid: userData.uid,
            fullName: userData.fullName,
            email: userData.email,
            provider: userData.provider
        };

    } catch (error) {

        console.error("Error checking user:", error);

        throw error;

    }

};

export { saveUser, checkUserExistsByEmail };




