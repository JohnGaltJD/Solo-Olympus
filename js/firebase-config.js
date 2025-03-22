// firebase-config.js
// Firebase configuration and initialization for Family Mount Olympus Bank

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyASylSKRaBpnpZUn8ji4mDaNLiq0ioxfao",
    authDomain: "mount-olympus-2415.firebaseapp.com",
    projectId: "mount-olympus-2415",
    storageBucket: "mount-olympus-2415.firebasestorage.app",
    messagingSenderId: "602539148372",
    appId: "1:602539148372:web:9d48c00bd2a41aaa75d9c1",
    measurementId: "G-4F6X3Y10J9",
    // Make sure we have the proper database URL
    databaseURL: "https://mount-olympus-2415-default-rtdb.firebaseio.com"
};

// Global references
let db;

// Initialize Firebase when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Firebase configuration initializing...");
    
    // Load required scripts
    const requiredScripts = [
        { id: "font-awesome", src: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css", isCSS: true },
        { id: "firebase-app", src: "https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js" },
        { id: "firebase-firestore", src: "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore-compat.js" }
    ];
    
    loadScripts(requiredScripts, () => {
        // Initialize Firebase with retry logic
        initializeFirebaseWithRetry(3); // Try 3 times
    });
    
    // Setup cross-browser sync using localStorage for backup
    setupLocalStorageSync();
});

/**
 * Load multiple scripts and call the callback when all are loaded
 */
function loadScripts(scripts, callback) {
    let loaded = 0;
    const total = scripts.length;
    
    function scriptLoaded() {
        loaded++;
        if (loaded === total) {
            callback();
        }
    }
    
    scripts.forEach(script => {
        if (document.getElementById(script.id)) {
            scriptLoaded();
            return;
        }
        
        const element = script.isCSS ? 
            document.createElement('link') : 
            document.createElement('script');
            
        if (script.isCSS) {
            element.rel = 'stylesheet';
            element.href = script.src;
        } else {
            element.src = script.src;
            element.async = true;
        }
        
        element.id = script.id;
        element.onload = scriptLoaded;
        element.onerror = (err) => {
            console.error(`Failed to load ${script.id}:`, err);
            scriptLoaded(); // Continue with other scripts
        };
        
        document.head.appendChild(element);
    });
    
    // If no scripts to load, call callback immediately
    if (total === 0) {
        callback();
    }
}

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
            console.error("Firebase SDK not loaded yet, waiting...");
            if (attempt < maxRetries) {
                setTimeout(() => {
                    initializeFirebaseWithRetry(maxRetries, attempt + 1);
                }, 1000);
            } else {
                console.error("Failed to load Firebase after multiple attempts");
                updateConnectionStatus(false);
            }
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
        console.log("Firebase not initialized, using browser online status");
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
            db.collection("olympus_connection_test").doc("test").set({ timestamp: Date.now() }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
        
        await connectionTest;
        console.log(`Firebase connection test passed in ${Date.now() - timestamp}ms`);
        return true;
    } catch (error) {
        console.warn("Firebase connection test failed:", error.message);
        
        // If it's a permission error, try accessing the database URL directly
        if (error.message && error.message.includes("permission")) {
            console.log("Detected permission error, checking if Firebase is reachable...");
            try {
                // Try to access the database URL to check if Firebase is reachable
                await fetch(`https://${firebaseConfig.projectId}.firebaseio.com/.json?shallow=true`, { 
                    method: 'GET',
                    mode: 'no-cors' // This works around CORS issues
                });
                console.log("Firebase is reachable but permissions need to be fixed");
                return true; // Firebase is reachable even if permissions aren't set correctly
            } catch (fetchError) {
                console.error("Firebase is not reachable:", fetchError);
                return false;
            }
        }
        
        return false;
    }
}

/**
 * Sets up localStorage sync between browser tabs as backup
 */
function setupLocalStorageSync() {
    console.log("Setting up localStorage sync between browser tabs as backup");
    
    // Get the family ID for sync key
    const familyId = localStorage.getItem('olympusBankFamilyId') || 'default-family';
    console.log("Using family ID for sync:", familyId);
    
    // Create unique keys for this family
    const SYNC_KEY = `olympusBankSync_${familyId}`;
    const DATA_KEY = `olympusBank_${familyId}`;
    
    // Save the standard data key for backward compatibility
    localStorage.setItem('olympusBank', localStorage.getItem(DATA_KEY) || '{}');
    
    // Create a function to trigger updates in other tabs
    window.triggerCrossBrowserSync = function() {
        try {
            // Include a data snapshot and timestamp
            const syncData = {
                timestamp: Date.now(),
                lastSyncedData: localStorage.getItem(DATA_KEY) || localStorage.getItem('olympusBank')
            };
            
            // Ensure we have data to sync
            if (!syncData.lastSyncedData || syncData.lastSyncedData === '{}') {
                console.warn("No data to sync - aborting cross-browser sync");
                return false;
            }
            
            // Store the sync data to trigger storage event in other tabs
            localStorage.setItem(SYNC_KEY, JSON.stringify(syncData));
            console.log("Cross-browser sync triggered with data snapshot");
            
            // Force a delay to ensure storage event fires in other tabs
            setTimeout(() => {
                // Remove and reset to ensure future events trigger
                localStorage.removeItem(SYNC_KEY);
                setTimeout(() => {
                    localStorage.setItem(`${SYNC_KEY}_ready`, Date.now().toString());
                }, 100);
            }, 100);
            
            return true;
        } catch (error) {
            console.error("Error triggering cross-browser sync:", error);
            return false;
        }
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', function(e) {
        // Only respond to our sync signal
        if (e.key === SYNC_KEY) {
            console.log("Received sync signal from another tab with key:", e.key);
            
            try {
                // Parse the sync data including the data snapshot
                const syncData = JSON.parse(e.newValue);
                
                if (syncData && syncData.lastSyncedData) {
                    console.log("Received data snapshot from another tab, timestamp:", new Date(syncData.timestamp).toISOString());
                    
                    // Store the received data in localStorage for this family
                    localStorage.setItem(DATA_KEY, syncData.lastSyncedData);
                    
                    // Also update the standard key for backward compatibility
                    localStorage.setItem('olympusBank', syncData.lastSyncedData);
                    
                    // Reload data from localStorage with a slight delay to ensure data is saved
                    setTimeout(() => {
                        if (window.DataManager && typeof DataManager.loadFromLocalStorage === 'function') {
                            DataManager.loadFromLocalStorage();
                            console.log("Data reloaded from another tab's snapshot");
                            
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
                    }, 200);
                } else {
                    console.warn("Received sync signal without data snapshot");
                    // Fallback to the old method of just reloading from localStorage
                    if (window.DataManager && typeof DataManager.loadFromLocalStorage === 'function') {
                        DataManager.loadFromLocalStorage();
                    }
                }
            } catch (error) {
                console.error("Error processing sync data from another tab:", error);
                // Attempt basic localStorage reload as fallback
                if (window.DataManager && typeof DataManager.loadFromLocalStorage === 'function') {
                    DataManager.loadFromLocalStorage();
                }
            }
        }
    });
    
    // Initialize with existing data if available
    const existingData = localStorage.getItem('olympusBank');
    if (existingData && existingData !== '{}') {
        localStorage.setItem(DATA_KEY, existingData);
    }
    
    console.log("LocalStorage sync setup complete");
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
    
    console.log("Sync button clicked, checking DataManager availability...");
    
    // Add a small delay to ensure DataManager is fully initialized
    setTimeout(() => {
        try {
            // Detailed log to diagnose the issue
            console.log("DataManager exists:", !!window.DataManager);
            console.log("manualSync exists:", window.DataManager && typeof window.DataManager.manualSync === 'function');
            
            // Call DataManager.manualSync or forceSyncFromFirebase if available
            if (window.DataManager) {
                if (typeof window.DataManager.manualSync === 'function') {
                    console.log("Calling DataManager.manualSync...");
                    
                    // Display different message based on connection status
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        if (window.isFirebaseConnected) {
                            UIManager.showToast("Syncing with cloud...", "info");
                        } else {
                            UIManager.showToast("Local sync only (offline mode)", "warning");
                        }
                    }
                    
                    window.DataManager.manualSync()
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
                    console.error("DataManager.manualSync is not a function");
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                    alert("Sync function is defined incorrectly. Please reload the page and try again.");
                }
            } else {
                console.error("DataManager is not available");
                button.innerHTML = originalHTML;
                button.disabled = false;
                alert("Sync function not available. Please reload the page and try again.");
            }
        } catch (error) {
            console.error("Error during sync attempt:", error);
            button.innerHTML = originalHTML;
            button.disabled = false;
            alert("Error during sync: " + error.message);
        }
    }, 500); // Short delay to ensure everything is loaded
}

// Expose functions globally
window.db = db;
window.checkFirebaseConnection = checkFirebaseConnection;
window.updateConnectionStatus = updateConnectionStatus; 