// Firebase Configuration (Compat Mode for file:// support)
// This script relies on firebase-app-compat.js being loaded before it.

const firebaseConfig = {
    apiKey: "AIzaSyBzFG9qdWATWWDSC9azZukUSBho5Bl5dWU",
    authDomain: "wf-world-dp.firebaseapp.com",
    projectId: "wf-world-dp",
    storageBucket: "wf-world-dp.firebasestorage.app",
    messagingSenderId: "1004889333300",
    appId: "1:1004889333300:web:ca7ccaea985a0968b73461",
    measurementId: "G-KHLHVC2V7N"
};

// Initialize Firebase
// Check if already initialized to avoid errors on reload/nav
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
