import { auth } from "../configuration/firebase.js";
import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// ============================================================
// PROVIDER INSTANCES
// ============================================================

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// ============================================================
// PROVIDER SETTINGS
// ============================================================

googleProvider.setCustomParameters({
    prompt: "select_account",
});

githubProvider.setCustomParameters({
    prompt: "select_account",
});

// ============================================================
// SHARED POPUP SIGN-IN
// Opens a provider authentication popup and returns the
// authenticated user. Throws on failure.
// ============================================================

const signInWithProvider = async (provider) => {
    const result = await signInWithPopup(auth, provider);
    return result.user;
};

// ============================================================
// SIGN IN WITH GOOGLE
// ============================================================

const signInWithGoogle = async () => {
    try {
        return await signInWithProvider(googleProvider);
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

// ============================================================
// SIGN IN WITH GITHUB
// ============================================================

const signInWithGithub = async () => {
    try {
        return await signInWithProvider(githubProvider);
    } catch (error) {
        console.error("Error signing in with GitHub:", error);
        throw error;
    }
};

export { signInWithGoogle, signInWithGithub };