// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD8wILouYWK-Dr8xDMUjADNXi_aIz1y59o",
    authDomain: "personal-finance-2c9b3.firebaseapp.com",
    projectId: "personal-finance-2c9b3",
    storageBucket: "personal-finance-2c9b3.firebasestorage.app",
    messagingSenderId: "46769198986",
    appId: "1:46769198986:web:8ae4dd7d13e9debeb29a73",
    measurementId: "G-KBMCXLPEWN"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence');
    }
});

export default app;
