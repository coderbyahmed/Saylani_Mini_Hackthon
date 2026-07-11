import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyAAWYKcep6j5U1EhJw3eRWAtiYcXqa8aps",
    authDomain: "saylani-hackathon-5b39a.firebaseapp.com",
    projectId: "saylani-hackathon-5b39a",
    storageBucket: "saylani-hackathon-5b39a.firebasestorage.app",
    messagingSenderId: "538239183657",
    appId: "1:538239183657:web:6af2c0c4940fc60405a538",
    measurementId: "G-QP77XX467M"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

