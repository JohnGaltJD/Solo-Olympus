// firebase-config.js
// Firebase configuration and initialization for Family Mount Olympus Bank

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyASylSKRaBpnpZUn8ji4mDaNLiq0ioxfao",
  authDomain: "mount-olympus-2415.firebaseapp.com",
  projectId: "mount-olympus-2415",
  storageBucket: "mount-olympus-2415.firebasestorage.app",
  messagingSenderId: "602539148372",
  appId: "1:602539148372:web:9d48c00bd2a41aaa75d9c1",
  measurementId: "G-4F6X3Y10J9"
};

// Reference to Firestore database (global)
let db = null;

// Last known connection status
let lastConnectionStatus = false;

/**
 * Check Firebase connection and update connection indicator
 */
function checkFirebaseConnection() {
    try {
        // Get connection indicator element
        const connectionIndicator = document.getElementById('connection-status');
        const connectionTooltip = document.getElementById('connection-tooltip');
        
        // If Firebase is not initialized, show disconnected
        if (!firebase || !db) {
            if (connectionIndicator) {
                connectionIndicator.textContent = '⚠️ Offline';
                connectionIndicator.style.backgroundColor = '#ff5252';
                
                if (connectionTooltip) {
                    connectionTooltip.textContent = 'Firebase not connected. Data will only be saved locally on this device.';
                }
            }
            return false;
        }
        
        // Attempt to check connection by reading a test document
        db.collection('connection_test').doc('test').get()
            .then(() => {
                // Connection successful
                if (connectionIndicator) {
                    connectionIndicator.textContent = '✓ Online';
                    connectionIndicator.style.backgroundColor = '#4caf50';
                    
                    if (connectionTooltip) {
                        connectionTooltip.textContent = 'Connected to Firebase. Data will sync across all devices.';
                    }
                }
                
                // If we were offline before, refresh UI to sync data
                if (lastConnectionStatus === false) {
                    console.log('Connection restored - refreshing data');
                    if (UIManager && typeof UIManager.refreshAllData === 'function') {
                        UIManager.refreshAllData();
                        
                        // Show sync notification
                        if (UIManager && typeof UIManager.showToast === 'function') {
                            UIManager.showToast('Connection restored. Data synchronized!', 'success');
                        }
                    }
                }
                
                lastConnectionStatus = true;
                return true;
            })
            .catch(error => {
                // Connection failed
                console.warn('Firebase connection check failed:', error);
                if (connectionIndicator) {
                    connectionIndicator.textContent = '⚠️ Offline';
                    connectionIndicator.style.backgroundColor = '#ff5252';
                    
                    if (connectionTooltip) {
                        connectionTooltip.textContent = 'Cannot connect to Firebase. Changes will be saved locally only. Try refreshing the page.';
                    }
                }
                
                lastConnectionStatus = false;
                return false;
            });
    } catch (error) {
        console.error('Error checking Firebase connection:', error);
        return false;
    }
}

// Initialize Firebase if available
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Attempting to initialize Firebase...');
        
        // Check if Firebase is available
        if (typeof firebase !== 'undefined') {
            console.log('Firebase SDK found, initializing with config...');
            
            try {
                // Initialize Firebase with config
                firebase.initializeApp(firebaseConfig);
                
                // Initialize Firestore
                db = firebase.firestore();
                
                console.log('Firebase initialized successfully');
                console.log('Firestore database reference created');
                
                // Add connection status indicator to the UI
                addConnectionStatusIndicator();
                
                // Check connection status
                checkFirebaseConnection();
                
                // Check if firebase auth is available
                if (firebase.auth) {
                    console.log('Firebase Auth is available');
                } else {
                    console.warn('Firebase Auth is not available');
                }
                
                // Set up periodic connection check every 30 seconds
                setInterval(checkFirebaseConnection, 30000);
            } catch (initError) {
                console.error('Error during Firebase initialization:', initError);
            }
        } else {
            console.warn('Firebase SDK is not available - running in local storage mode');
            // Debug why Firebase is not available
            console.log('window.firebase =', typeof window.firebase);
            console.log('All loaded scripts:', Array.from(document.getElementsByTagName('script')).map(s => s.src));
        }
    } catch (error) {
        console.error('Critical error initializing Firebase:', error);
    }
});

/**
 * Add connection status indicator to the UI
 */
function addConnectionStatusIndicator() {
    // Create connection status elements if they don't exist
    if (!document.getElementById('connection-status')) {
        // Create container
        const container = document.createElement('div');
        container.id = 'connection-status-container';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '1000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        
        // Create status indicator
        const indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.textContent = '⌛ Connecting...';
        indicator.style.padding = '5px 10px';
        indicator.style.backgroundColor = '#ffc107';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '14px';
        indicator.style.fontWeight = 'bold';
        indicator.style.cursor = 'pointer';
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'connection-tooltip';
        tooltip.textContent = 'Checking connection to Firebase...';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.marginBottom = '8px';
        tooltip.style.display = 'none';
        tooltip.style.maxWidth = '250px';
        tooltip.style.textAlign = 'center';
        
        // Add refresh button
        const refreshButton = document.createElement('button');
        refreshButton.id = 'sync-button';
        refreshButton.textContent = '↻ Sync Now';
        refreshButton.style.marginTop = '5px';
        refreshButton.style.padding = '5px 10px';
        refreshButton.style.backgroundColor = '#2196F3';
        refreshButton.style.color = 'white';
        refreshButton.style.border = 'none';
        refreshButton.style.borderRadius = '4px';
        refreshButton.style.cursor = 'pointer';
        refreshButton.style.fontWeight = 'bold';
        refreshButton.style.transition = 'background-color 0.3s';
        refreshButton.style.display = 'none'; // Hidden by default
        
        // Hover effects
        refreshButton.addEventListener('mouseover', () => {
            refreshButton.style.backgroundColor = '#0b7dda';
        });
        
        refreshButton.addEventListener('mouseout', () => {
            refreshButton.style.backgroundColor = '#2196F3';
        });
        
        // Add click event to the refresh button
        refreshButton.addEventListener('click', () => {
            if (UIManager && typeof UIManager.refreshAllData === 'function') {
                refreshButton.textContent = '⌛ Syncing...';
                refreshButton.disabled = true;
                
                // Check connection first
                checkFirebaseConnection();
                
                // Refresh all data
                UIManager.refreshAllData();
                
                // Show toast notification
                if (UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Data synchronized successfully!', 'success');
                }
                
                // Reset button after 1 second
                setTimeout(() => {
                    refreshButton.textContent = '↻ Sync Now';
                    refreshButton.disabled = false;
                    refreshButton.style.display = 'none';
                }, 1000);
            }
        });
        
        // Toggle tooltip on hover
        indicator.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        
        indicator.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        
        // Click on indicator shows sync button
        indicator.addEventListener('click', () => {
            if (refreshButton.style.display === 'none') {
                refreshButton.style.display = 'block';
            } else {
                refreshButton.style.display = 'none';
            }
        });
        
        // Add elements to container
        container.appendChild(tooltip);
        container.appendChild(indicator);
        container.appendChild(refreshButton);
        
        // Add container to document
        document.body.appendChild(container);
    }
} 