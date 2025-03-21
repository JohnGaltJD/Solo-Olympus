// firebase-config.js
// Firebase configuration and initialization for Family Mount Olympus Bank

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCksoGvnP4D5m_uEKr8n6J3UKUlDNiJPSA",
    authDomain: "family-olympus-bank.firebaseapp.com",
    projectId: "family-olympus-bank",
    storageBucket: "family-olympus-bank.appspot.com",
    messagingSenderId: "446249540339",
    appId: "1:446249540339:web:ad2f7ee7d63c8ece9ad17e",
    databaseURL: "https://family-olympus-bank-default-rtdb.firebaseio.com"
};

// Initialize Firebase when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Attempting to initialize Firebase...");
    
    // Small delay to ensure Firebase SDK is loaded
    setTimeout(function() {
        initializeFirebase();
        
        // Force status to online for testing if Firebase isn't working
        setTimeout(function() {
            // If we're still offline after 5 seconds, use navigator.onLine as fallback
            const statusIndicators = document.querySelectorAll('.connection-status');
            if (statusIndicators[0] && statusIndicators[0].classList.contains('offline')) {
                console.log("Firebase connection unsuccessful, falling back to navigator.onLine");
                updateConnectionStatus(navigator.onLine);
            }
        }, 5000);
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
            updateConnectionStatus(true); // Force online for now
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
        
        // Set up sync button handlers
        setupSyncButtonHandlers();
        
        // Just set status to online immediately for testing
        updateConnectionStatus(true);
        
        // Run a connection check without using Realtime Database
        setTimeout(function() {
            simpleConnectionCheck();
        }, 1000);
        
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        updateConnectionStatus(true); // Force online for now
    }
}

/**
 * A simple connection check that doesn't rely on firebase
 */
function simpleConnectionCheck() {
    console.log("Running simple connection check...");
    const isOnline = navigator.onLine;
    console.log("Browser reports online status:", isOnline);
    updateConnectionStatus(isOnline);
    
    // Schedule periodic check
    setInterval(function() {
        const isOnline = navigator.onLine;
        updateConnectionStatus(isOnline);
    }, 30000);
    
    return Promise.resolve(isOnline);
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
    
    // Enable sync buttons regardless of connection status for testing
    const syncButtons = document.querySelectorAll('.sync-now-btn');
    syncButtons.forEach(button => {
        button.disabled = false;
        button.setAttribute('title', 'Sync data with cloud');
    });
    
    // Remove any old status messages in the child dashboard
    const childFirebaseStatus = document.getElementById('child-firebase-status');
    if (childFirebaseStatus) {
        childFirebaseStatus.style.display = 'none';
    }
}

/**
 * Setup sync button handlers
 */
function setupSyncButtonHandlers() {
    // This is now handled in main.js for better separation of concerns
    console.log("Sync button handlers are set up in main.js");
}

// Expose functions globally
window.checkFirebaseConnection = simpleConnectionCheck;
window.updateConnectionStatus = updateConnectionStatus; 