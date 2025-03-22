/**
 * dashboard-adapter.js
 * ---
 * This file serves as an adapter between the modern dashboard components and the 
 * existing data management code, ensuring backward compatibility.
 */

/**
 * Initialize the dashboard adapter
 */
function initDashboardAdapter() {
    console.log('Initializing dashboard adapter...');

    // Add missing methods to DataManager if they don't exist
    if (typeof DataManager !== 'undefined') {
        // Add getRecentTransactions method if it doesn't exist
        if (!DataManager.getRecentTransactions) {
            DataManager.getRecentTransactions = function(limit = 5) {
                console.log(`Getting recent transactions (limit: ${limit})`);
                // Check if we can get transactions from the existing methods
                if (DataManager.getTransactions) {
                    const allTransactions = DataManager.getTransactions();
                    // Sort by date (newest first) and limit
                    return allTransactions
                        .sort((a, b) => {
                            const dateA = a.date ? new Date(a.date) : new Date(0);
                            const dateB = b.date ? new Date(b.date) : new Date(0);
                            return dateB - dateA;
                        })
                        .slice(0, limit);
                }
                // Fallback to empty array if no transactions method exists
                return [];
            };
        }

        // Add getChores method if it doesn't exist
        if (!DataManager.getChores) {
            DataManager.getChores = function() {
                console.log('Getting chores from adapter');
                // Try to access chores from the data structure
                if (DataManager.getData && typeof DataManager.getData === 'function') {
                    const data = DataManager.getData();
                    return data.chores || [];
                }
                return [];
            };
        }

        // Add getBalance method if it doesn't exist
        if (!DataManager.getBalance) {
            DataManager.getBalance = function() {
                console.log('Getting balance from adapter');
                if (DataManager.getData && typeof DataManager.getData === 'function') {
                    const data = DataManager.getData();
                    return data.balance || 0;
                }
                return 0;
            };
        }

        // Add getPendingApprovals method if it doesn't exist
        if (!DataManager.getPendingApprovals) {
            DataManager.getPendingApprovals = function() {
                console.log('Getting pending approvals from adapter');
                // Check if we can get the data using existing methods
                if (DataManager.getAllPendingApprovals && typeof DataManager.getAllPendingApprovals === 'function') {
                    return DataManager.getAllPendingApprovals();
                }
                // Fallback to empty array
                return [];
            };
        }

        // Add getSavingsGoals method if it doesn't exist
        if (!DataManager.getSavingsGoals) {
            DataManager.getSavingsGoals = function() {
                console.log('Getting savings goals from adapter');
                if (DataManager.getData && typeof DataManager.getData === 'function') {
                    const data = DataManager.getData();
                    return data.goals || [];
                }
                return [];
            };
        }
    }

    // Create a bridge for the Firebase functionality
    window.FirebaseBridge = {
        forceSyncToCloud: function() {
            console.log('Bridge: Forcing sync to cloud');
            if (typeof Firebase !== 'undefined' && Firebase._forceSyncToFirebase) {
                return Firebase._forceSyncToFirebase();
            } else if (DataManager && DataManager._forceSyncToFirebase) {
                return DataManager._forceSyncToFirebase();
            }
            console.warn('Force sync not available');
            return Promise.resolve(false);
        },
        
        isConnected: function() {
            if (typeof Firebase !== 'undefined') {
                return Firebase.isConnected && Firebase.isConnected();
            }
            return false;
        }
    };
}

// Initialize the adapter when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard adapter: DOM content loaded');
    initDashboardAdapter();
}); 