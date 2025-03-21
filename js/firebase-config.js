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
        
        // Set an interval to periodically check connection
        setInterval(function() {
            console.log("Running scheduled Firebase connection check");
            checkFirebaseConnection();
        }, 30000); // Check every 30 seconds
        
        // Also run a connection check immediately after init
        setTimeout(function() {
            console.log("Running initial connection check after initialization");
            checkFirebaseConnection();
        }, 2000);
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
    console.log("Checking Firebase connection status...");
    
    if (typeof firebase === 'undefined') {
        console.warn("Firebase not available for connection check");
        updateConnectionStatus(false);
        return Promise.resolve(false);
    }
    
    // Log what Firebase modules are available
    console.log("Firebase modules available:", {
        app: !!firebase.app,
        firestore: !!firebase.firestore,
        auth: !!firebase.auth,
        database: !!firebase.database
    });
    
    return new Promise((resolve) => {
        try {
            // First, try using the Realtime Database .info/connected reference
            if (firebase.database) {
                console.log("Using Realtime Database for connection check");
                
                const connectedRef = firebase.database().ref(".info/connected");
                connectedRef.on("value", (snap) => {
                    const connected = snap.val() === true;
                    console.log("Realtime Database connection status:", connected ? "ONLINE" : "OFFLINE");
                    updateConnectionStatus(connected);
                    resolve(connected);
                });
                
                // Set a timeout for the Realtime Database check
                setTimeout(() => {
                    console.log("Realtime Database connection check ongoing...");
                }, 2000);
            } else {
                console.warn("Firebase Realtime Database not available, falling back to Firestore");
                fallbackFirestoreCheck(resolve);
            }
            
            // Set an overall timeout
            setTimeout(() => {
                console.warn("Firebase connection check timed out, falling back to Firestore ping");
                fallbackFirestoreCheck(resolve);
            }, 5000);
            
        } catch (error) {
            console.error("Error in primary connection check:", error);
            fallbackFirestoreCheck(resolve);
        }
    });
}

/**
 * Fallback method to check connection using Firestore
 */
function fallbackFirestoreCheck(resolveCallback) {
    try {
        if (!firebase.firestore) {
            console.warn("Firestore not available for fallback connection check");
            updateConnectionStatus(false);
            if (resolveCallback) resolveCallback(false);
            return;
        }
        
        console.log("Using Firestore ping for connection check");
        const db = firebase.firestore();
        const timestamp = Date.now().toString();
        
        // Try to write to a test document
        db.collection('_connection_test').doc(timestamp)
            .set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() })
            .then(() => {
                console.log("Firestore connection test successful");
                updateConnectionStatus(true);
                if (resolveCallback) resolveCallback(true);
                
                // Clean up the test document
                setTimeout(() => {
                    db.collection('_connection_test').doc(timestamp).delete()
                        .catch(err => console.log("Cleanup error:", err));
                }, 5000);
            })
            .catch((error) => {
                console.error("Firestore connection test failed:", error);
                // Try navigator.onLine as last resort
                const isOnline = navigator.onLine;
                console.log("Navigator.onLine status:", isOnline ? "ONLINE" : "OFFLINE");
                updateConnectionStatus(isOnline);
                if (resolveCallback) resolveCallback(isOnline);
            });
    } catch (error) {
        console.error("Error in fallback connection check:", error);
        updateConnectionStatus(false);
        if (resolveCallback) resolveCallback(false);
    }
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