// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASylSKRaBpnpZUn8ji4mDaNLiq0ioxfao",
  authDomain: "mount-olympus-2415.firebaseapp.com",
  projectId: "mount-olympus-2415",
  storageBucket: "mount-olympus-2415.firebasestorage.app",
  messagingSenderId: "602539148372",
  appId: "1:602539148372:web:9d48c00bd2a41aaa75d9c1",
  measurementId: "G-4F6X3Y10J9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

/**
 * Check Firebase connection status
 * @returns {Promise<boolean>} Connection status
 */
async function checkFirebaseConnection() {
    try {
        if (!window.firebase || !db) {
            console.warn('Firebase not initialized');
            return false;
        }
        
        // Attempt a simple database operation
        const testDocRef = db.collection('connection_test').doc('test');
        await testDocRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        
        // If we get here, the connection is working
        console.log('Firebase connection is working');
        
        // Update status in UI if element exists
        const statusElement = document.getElementById('firebase-status');
        if (statusElement) {
            statusElement.textContent = 'Connected to cloud';
            statusElement.className = 'firebase-status connected';
        }
        
        return true;
    } catch (error) {
        console.error('Firebase connection check failed:', error);
        
        // Update status in UI if element exists
        const statusElement = document.getElementById('firebase-status');
        if (statusElement) {
            statusElement.textContent = 'Using local storage (offline)';
            statusElement.className = 'firebase-status disconnected';
        }
        
        return false;
    }
} 