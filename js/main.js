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