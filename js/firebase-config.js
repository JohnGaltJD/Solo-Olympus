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

// Global references
let db;

// Initialize Firebase when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Firebase configuration initializing...");
    
    // 1. Initialize Firebase with retry logic
    initializeFirebaseWithRetry(3); // Try 3 times
    
    // 2. Setup cross-browser sync using localStorage for backup
    setupLocalStorageSync();
});

/**
 * Initialize Firebase with retry logic
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} attempt - Current attempt number
 */
function initializeFirebaseWithRetry(maxRetries, attempt = 1) {
    try {
        console.log(`Attempt ${attempt} to initialize Firebase...`);
        
        // Check if Firebase SDK is available
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded. Loading script dynamically...");
            loadFirebaseSDK(() => initializeFirebaseWithRetry(maxRetries, attempt));
            return;
        }
        
        // Check if already initialized
        if (firebase.apps && firebase.apps.length > 0) {
            console.log("Firebase already initialized, skipping initialization");
            db = firebase.firestore();
            
            // Setup sync button handlers
            setupSyncButtonHandlers();
            
            // Check connection status
            checkConnectionStatus();
            return;
        }
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
        
        // Initialize Firestore
        db = firebase.firestore();
        window.db = db; // Make globally available
        console.log("Firestore initialized");
        
        // Setup sync button handlers
        setupSyncButtonHandlers();
        
        // Check connection status
        checkConnectionStatus();
        
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        
        if (attempt < maxRetries) {
            console.log(`Retrying Firebase initialization in ${attempt * 2}s (attempt ${attempt + 1}/${maxRetries})...`);
            setTimeout(() => {
                initializeFirebaseWithRetry(maxRetries, attempt + 1);
            }, attempt * 2000);
        } else {
            console.error(`Failed to initialize Firebase after ${maxRetries} attempts.`);
            // Use browser online status as fallback
            updateConnectionStatus(navigator.onLine);
        }
    }
}

/**
 * Dynamically load Firebase SDK if not already loaded
 * @param {Function} callback - Function to call when loaded
 */
function loadFirebaseSDK(callback) {
    const scripts = [
        { src: "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js", id: "firebase-app" },
        { src: "https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js", id: "firebase-firestore" }
    ];
    
    let scriptsLoaded = 0;
    
    scripts.forEach(script => {
        // Check if script is already loaded
        if (document.getElementById(script.id)) {
            scriptsLoaded++;
            if (scriptsLoaded === scripts.length) {
                callback();
            }
            return;
        }
        
        // Create script element
        const scriptElement = document.createElement("script");
        scriptElement.src = script.src;
        scriptElement.id = script.id;
        scriptElement.async = true;
        
        // Add event listeners
        scriptElement.onload = () => {
            console.log(`Loaded ${script.id}`);
            scriptsLoaded++;
            if (scriptsLoaded === scripts.length) {
                callback();
            }
        };
        
        scriptElement.onerror = (error) => {
            console.error(`Failed to load ${script.id}:`, error);
        };
        
        // Append to head
        document.head.appendChild(scriptElement);
    });
}

/**
 * Regular check of connection status
 */
function checkConnectionStatus() {
    // First try to use Firestore connection status
    try {
        checkFirebaseConnection().then(isConnected => {
            updateConnectionStatus(isConnected);
            
            // Set up periodic check
            setInterval(() => {
                checkFirebaseConnection().then(isConnected => {
                    updateConnectionStatus(isConnected);
                });
            }, 30000); // Check every 30 seconds
        });
    } catch (error) {
        console.error("Error checking Firebase connection:", error);
        // Fallback to browser online status
        updateConnectionStatus(navigator.onLine);
        
        // Set up periodic check with navigator.onLine
        setInterval(() => {
            updateConnectionStatus(navigator.onLine);
        }, 30000); // Check every 30 seconds
    }
}

/**
 * Check if Firebase is connected
 * @returns {Promise<boolean>} Promise resolving to connection status
 */
async function checkFirebaseConnection() {
    // If Firebase isn't initialized, return navigator.onLine
    if (!firebase || !firebase.firestore) {
        return navigator.onLine;
    }
    
    try {
        // Try a small query to check connection
        console.log("Testing Firebase connection...");
        const timestamp = Date.now();
        
        // Get a reference to the Firestore database
        const db = firebase.firestore();
        
        // Try to get data with timeout
        const connectionTest = Promise.race([
            db.collection("connection_test").doc("test").get(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
        
        await connectionTest;
        console.log(`Firebase connection test passed in ${Date.now() - timestamp}ms`);
        return true;
    } catch (error) {
        console.warn("Firebase connection test failed:", error);
        return false;
    }
}

/**
 * Sets up localStorage sync between browser tabs as backup
 */
function setupLocalStorageSync() {
    console.log("Setting up localStorage sync between browser tabs as backup");
    
    // Create a function to trigger updates in other tabs
    window.triggerCrossBrowserSync = function() {
        // Use a timestamp to trigger the storage event in other tabs
        localStorage.setItem('olympusBankSync', Date.now().toString());
        console.log("Cross-browser sync triggered");
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', function(e) {
        // Only respond to our sync signal
        if (e.key === 'olympusBankSync') {
            console.log("Received sync signal from another tab");
            
            // Reload data from localStorage
            try {
                if (window.DataManager && typeof DataManager.loadFromLocalStorage === 'function') {
                    DataManager.loadFromLocalStorage();
                    console.log("Data reloaded from localStorage");
                    
                    // Update UI if UIManager exists
                    if (window.UIManager) {
                        if (typeof UIManager.refreshAllData === 'function') {
                            UIManager.refreshAllData();
                        } else if (typeof UIManager.updateUI === 'function') {
                            UIManager.updateUI();
                        }
                    }
                    
                    // Show toast if available
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        UIManager.showToast("Data synchronized from another window", "info");
                    }
                }
            } catch (error) {
                console.error("Error syncing from another tab:", error);
            }
        }
    });
}

/**
 * Updates all connection status indicators in the UI
 * @param {boolean} isOnline - Whether the connection is online
 */
function updateConnectionStatus(isOnline) {
    console.log("Setting connection status:", isOnline ? "ONLINE" : "OFFLINE");
    
    // Update all connection status indicators
    const connectionStatusElements = document.querySelectorAll('.connection-status');
    connectionStatusElements.forEach(element => {
        if (isOnline) {
            element.classList.remove('offline');
            element.classList.add('online');
            element.innerHTML = '<i class="fas fa-wifi"></i> Online';
        } else {
            element.classList.remove('online');
            element.classList.add('offline');
            element.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
        }
    });
    
    // Enable or disable sync buttons based on connection status
    const syncButtons = [
        document.getElementById('parent-sync-btn'),
        document.getElementById('child-sync-btn'),
        document.getElementById('force-cloud-sync-btn'),
        document.getElementById('force-sync-btn')
    ].filter(btn => btn !== null);
    
    syncButtons.forEach(button => {
        if (isOnline) {
            button.disabled = false;
            button.classList.remove('disabled');
        } else {
            // Allow local sync even when offline
            button.disabled = false;
            button.classList.remove('disabled');
            // Update tooltip
            button.setAttribute('title', 'Local sync only (offline mode)');
        }
    });
    
    // Expose connection status globally
    window.isFirebaseConnected = isOnline;
}

/**
 * Setup sync button event handlers
 */
function setupSyncButtonHandlers() {
    const syncButtons = [
        document.getElementById('parent-sync-btn'),
        document.getElementById('child-sync-btn'),
        document.getElementById('force-cloud-sync-btn'),
        document.getElementById('force-sync-btn')
    ].filter(btn => btn !== null);
    
    console.log(`Setting up ${syncButtons.length} sync button handlers`);
    
    syncButtons.forEach(button => {
        // Remove any existing click handlers
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add click handler to the new button
        newButton.addEventListener('click', handleSyncButtonClick);
    });
}

/**
 * Handle sync button click
 * @param {Event} event - Click event
 */
function handleSyncButtonClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
    button.disabled = true;
    
    console.log("Sync button clicked, triggering manual sync");
    
    // Call DataManager.manualSync or forceSyncFromFirebase if available
    if (window.DataManager) {
        const syncMethod = (window.isFirebaseConnected && typeof DataManager.forceSyncFromFirebase === 'function') 
            ? DataManager.forceSyncFromFirebase 
            : DataManager.manualSync;
        
        // Display different message based on connection status
        if (window.UIManager && typeof UIManager.showToast === 'function') {
            if (window.isFirebaseConnected) {
                UIManager.showToast("Syncing with cloud...", "info");
            } else {
                UIManager.showToast("Local sync only (offline mode)", "warning");
            }
        }
        
        syncMethod.call(DataManager)
            .then(() => {
                console.log("Sync completed successfully via button");
                // Reset button after sync
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }, 500);
            })
            .catch(error => {
                console.error("Error in sync via button:", error);
                // Reset button and show error
                button.innerHTML = originalHTML;
                button.disabled = false;
                
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast("Sync failed: " + error.message, "error");
                } else {
                    alert("Sync failed: " + error.message);
                }
            });
    } else {
        console.error("DataManager not available");
        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;
        
        alert("Sync function not available");
    }
}

// Expose functions globally
window.db = db;
window.checkFirebaseConnection = checkFirebaseConnection;
window.updateConnectionStatus = updateConnectionStatus; 