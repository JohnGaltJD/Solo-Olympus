// Settings Tab Functionality
document.getElementById('clear-transactions-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
        DataManager.clearTransactions();
        updateUI();
    }
});

document.getElementById('force-sync-btn').addEventListener('click', function() {
    if (confirm('This will sync data from the cloud to this device. Any unsaved changes on this device might be overwritten. Continue?')) {
        // Show loading indicator
        const button = this;
        const originalText = button.textContent;
        button.textContent = "Syncing...";
        button.disabled = true;
        
        // Force sync from Firebase
        DataManager.forceSyncFromFirebase()
            .then(() => {
                // Update UI after sync
                updateUI();
                alert('Cloud sync complete. Your data is now up to date.');
            })
            .catch(error => {
                console.error('Sync failed:', error);
                alert('Sync failed: ' + error.message);
            })
            .finally(() => {
                // Restore button state
                button.textContent = originalText;
                button.disabled = false;
            });
    }
});

document.getElementById('reset-all-btn').addEventListener('click', function() {
    // ... existing code ...
});

// Run initial setup tasks on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, running initial setup tasks");
    
    // Initialize buttons
    initSyncButtons();
    
    // Check connection status immediately
    if (window.checkFirebaseConnection) {
        console.log("Running immediate connection check on page load");
        window.checkFirebaseConnection().then(status => {
            console.log("Initial connection status:", status ? "ONLINE" : "OFFLINE");
        });
    } else {
        console.warn("No connection check function available");
    }
    
    // Set up Firebase connection status check interval
    if (window.checkFirebaseConnection) {
        // Check every 30 seconds
        setInterval(function() {
            console.log("Running periodic connection check");
            window.checkFirebaseConnection();
        }, 30000);
    }
});

/**
 * Initialize sync buttons functionality
 */
function initSyncButtons() {
    // Get all sync buttons by their specific IDs
    const syncButtons = [
        document.getElementById('parent-sync-btn'),
        document.getElementById('child-sync-btn'),
        document.getElementById('force-cloud-sync-btn'),
        document.getElementById('force-sync-btn')
    ];
    
    // Filter out any null elements (buttons that don't exist)
    const validButtons = syncButtons.filter(button => button !== null);
    
    validButtons.forEach(button => {
        // Remove any existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add click handler
        newButton.addEventListener('click', function(event) {
            // Prevent default
            event.preventDefault();
            
            // Show loading state
            const syncIcon = this.querySelector('.fa-refresh, .fa-cloud-download');
            if (syncIcon) {
                syncIcon.classList.add('fa-spin');
            }
            this.disabled = true;
            
            console.log(`Sync button clicked: ${this.id}`);
            
            // Call DataManager's sync method
            if (window.DataManager && typeof DataManager.manualSync === 'function') {
                DataManager.manualSync()
                    .then(result => {
                        // Success - handled in DataManager.manualSync
                        console.log("Sync completed successfully");
                    })
                    .catch(error => {
                        // Error - should be handled in DataManager.manualSync
                        console.error("Sync failed:", error);
                    })
                    .finally(() => {
                        // Reset button state
                        if (syncIcon) {
                            syncIcon.classList.remove('fa-spin');
                        }
                        this.disabled = false;
                    });
            } else {
                console.error("DataManager.manualSync is not available");
                if (syncIcon) {
                    syncIcon.classList.remove('fa-spin');
                }
                this.disabled = false;
                alert('Sync function not available. Please reload the page and try again.');
            }
        });
    });
    
    console.log("Sync buttons initialized:", validButtons.length);
} 