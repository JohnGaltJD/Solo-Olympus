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
    // Get all sync buttons
    const syncButtons = document.querySelectorAll('.sync-now-btn');
    
    syncButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Show loading state
            const syncIcon = this.querySelector('.fa-refresh');
            if (syncIcon) {
                syncIcon.classList.add('fa-spin');
            }
            this.disabled = true;
            
            // Call DataManager's sync method
            DataManager.manualSync()
                .then(result => {
                    // Success
                    console.log("Sync completed successfully");
                    // Use UIManager if available
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        UIManager.showToast('Sync completed successfully!', 'success');
                    } else {
                        alert('Sync completed successfully!');
                    }
                })
                .catch(error => {
                    // Error
                    console.error("Sync failed:", error);
                    // Use UIManager if available
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        UIManager.showToast('Sync failed: ' + error.message, 'error');
                    } else {
                        alert('Sync failed: ' + error.message);
                    }
                })
                .finally(() => {
                    // Reset button state
                    if (syncIcon) {
                        syncIcon.classList.remove('fa-spin');
                    }
                    this.disabled = false;
                    
                    // Update connection status
                    if (window.updateConnectionStatus) {
                        window.updateConnectionStatus();
                    }
                });
        });
    });
} 