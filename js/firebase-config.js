// firebase-config.js
// Firebase configuration and initialization for Family Mount Olympus Bank

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA7PrMHm-hPD6M-Q3R-q2GQsUKB5XSwxr4",
    authDomain: "family-olympus-bank.firebaseapp.com",
    projectId: "family-olympus-bank",
    storageBucket: "family-olympus-bank.appspot.com",
    messagingSenderId: "151590191683",
    appId: "1:151590191683:web:5624949d7c3c9dc7a48d33"
};

// Initialize Firebase when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Attempting to initialize Firebase...");
    
    // Small delay to ensure Firebase SDK is loaded
    setTimeout(function() {
        initializeFirebase();
    }, 500);
});

/**
 * Initialize Firebase and set up connection monitoring
 */
function initializeFirebase() {
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not found. Make sure it's properly loaded.");
            updateConnectionStatus(false);
            return;
        }
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } else {
            console.log("Firebase already initialized");
        }
        
        // Initialize Firestore
        const db = firebase.firestore();
        console.log("Firestore initialized");
        
        // Check connection status initially
        checkFirebaseConnection();
        
        // Set up sync button handlers
        setupSyncButtonHandlers();
        
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        updateConnectionStatus(false);
    }
}

/**
 * Check if Firebase is connected
 */
function checkFirebaseConnection() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.warn("Firebase not available for connection check");
        updateConnectionStatus(false);
        return Promise.resolve(false);
    }
    
    return new Promise((resolve) => {
        try {
            const db = firebase.firestore();
            const connectedRef = firebase.database().ref(".info/connected");
            
            connectedRef.on("value", (snap) => {
                const connected = snap.val() === true;
                console.log("Firebase connection status:", connected ? "ONLINE" : "OFFLINE");
                updateConnectionStatus(connected);
                resolve(connected);
            });
            
            // Set a timeout in case Firebase doesn't respond
            setTimeout(() => {
                console.warn("Firebase connection check timed out");
                updateConnectionStatus(false);
                resolve(false);
            }, 5000);
            
        } catch (error) {
            console.error("Error checking Firebase connection:", error);
            updateConnectionStatus(false);
            resolve(false);
        }
    });
}

/**
 * Update connection status indicators in the UI
 */
function updateConnectionStatus(isConnected) {
    // Update all connection status indicators
    const statusIndicators = document.querySelectorAll('.connection-status');
    
    statusIndicators.forEach(indicator => {
        if (isConnected) {
            indicator.classList.remove('offline');
            indicator.classList.add('online');
            indicator.innerHTML = '<i class="fa fa-wifi"></i> Online';
        } else {
            indicator.classList.remove('online');
            indicator.classList.add('offline');
            indicator.innerHTML = '<i class="fa fa-exclamation-triangle"></i> Offline';
        }
    });
    
    // Enable or disable sync buttons based on connection status
    const syncButtons = document.querySelectorAll('.sync-now-btn');
    syncButtons.forEach(button => {
        button.disabled = !isConnected;
        if (!isConnected) {
            button.setAttribute('title', 'Cannot sync while offline');
        } else {
            button.setAttribute('title', 'Sync data with cloud');
        }
    });
}

/**
 * Setup sync button handlers
 */
function setupSyncButtonHandlers() {
    // This is now handled in main.js for better separation of concerns
    console.log("Sync button handlers are set up in main.js");
}

// Expose functions globally
window.checkFirebaseConnection = checkFirebaseConnection;
window.updateConnectionStatus = updateConnectionStatus; 