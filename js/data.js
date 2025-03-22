/**
 * data.js
 * ---
 * Handles data persistence and management for Family Mount Olympus Bank
 */

// Data manager for the Family Mount Olympus Bank application
const DataManager = {
    // Default initial data
    defaultData: {
        balance: 385.80,
        transactions: [],
        chores: [
            { id: 'chore-1', name: 'Help with laundry', value: 1.00, frequency: 'occurrence', completed: false, pending: false },
            { id: 'chore-2', name: 'Fold laundry', value: 2.00, frequency: 'occurrence', completed: false, pending: false },
            { id: 'chore-3', name: 'Help dad with boxmore', value: 2.00, frequency: 'occurrence', completed: false, pending: false },
            { id: 'chore-4', name: 'Trash in/out', value: 0.50, frequency: 'occurrence', completed: false, pending: false },
            { id: 'chore-5', name: 'Finish all school work', value: 2.00, frequency: 'week', completed: false, pending: false },
            { id: 'chore-6', name: 'Dishes to sink without reminder', value: 0.25, frequency: 'day', completed: false, pending: false },
            { id: 'chore-7', name: 'Water plants', value: 2.00, frequency: 'week', completed: false, pending: false }
        ],
        pendingTransactions: [],
        goals: [],
        settings: {
            parentPassword: 'olympus',
            interestRate: 0.10, // 10% per year
            lastInterestPaid: null
        }
    },
    
    // Actual application data
    data: null,
    
    // Last known good data for recovery
    lastGoodData: null,
    
    // Data version for migrations
    dataVersion: 1,
    
    // Family ID for multi-device support (default for backward compatibility)
    familyId: 'default-family',
    
    // Firebase database listener
    firebaseListener: null,
    
    /**
     * Initialize the data manager
     * @param {boolean} forceReset - Whether to force a reset to default data
     * @returns {Promise<boolean>} Success status
     */
    async init(forceReset = false) {
        try {
            console.log('Initializing DataManager...');
            
            // Check if Firebase is available
            const useFirebase = window.firebase && window.db;
            console.log('Firebase available:', useFirebase);
            
            // Set family ID - in a real app, this would be based on authentication
            this.familyId = localStorage.getItem('olympusBankFamilyId') || 'default-family';
            console.log('Using family ID:', this.familyId);
            
            if (forceReset) {
                console.log('Force reset requested, using default data');
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                await this.saveData();
            } else {
                // If Firebase is available, prioritize Firebase data over localStorage
                if (useFirebase) {
                    console.log('Prioritizing Firebase data over localStorage');
                    await this.forceSyncFromFirebase();
                } else {
                    // If Firebase is not available, fall back to regular data loading
                    await this.restoreData(useFirebase);
                }
            }
            
            // Set up real-time Firebase listener if Firebase is available
            if (useFirebase) {
                this.setupFirebaseListener();
            }
            
            // Schedule interest calculations
            this.scheduleInterestCalculation();
            
            // Set up automatic sync every 30 seconds
            this._setupAutoSync();
            
            console.log('DataManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing DataManager:', error);
            return false;
        }
    },
    
    /**
     * Set up automatic sync between browser tabs
     * @private
     */
    _setupAutoSync: function() {
        console.log("Setting up automatic sync between browser tabs");
        
        // Perform initial sync after 5 seconds
        setTimeout(() => {
            console.log("Performing initial auto-sync");
            this.manualSync().catch(error => {
                console.error("Error during initial auto-sync:", error);
            });
        }, 5000);
        
        // Set up periodic sync every 30 seconds
        setInterval(() => {
            console.log("Performing periodic auto-sync");
            this.manualSync().catch(error => {
                console.error("Error during periodic auto-sync:", error);
            });
        }, 30000);
        
        // Also sync when tab becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log("Tab became visible, performing auto-sync");
                this.manualSync().catch(error => {
                    console.error("Error during visibility change auto-sync:", error);
                });
            }
        });
        
        console.log("Automatic sync setup complete");
    },
    
    /**
     * Set up real-time Firebase listener for cross-device synchronization
     */
    setupFirebaseListener() {
        try {
            console.log('[FIREBASE LISTENER] Setting up real-time listener for family:', this.familyId);
            
            // Clean up any existing listener
            if (this.firebaseListener) {
                console.log('[FIREBASE LISTENER] Removing existing listener');
                this.firebaseListener();
                this.firebaseListener = null;
            }
            
            if (!window.firebase || !window.db) {
                console.warn('[FIREBASE LISTENER] Firebase or db not available, cannot set up listener');
                this.updateConnectionStatus(false);
                return false;
            }
            
            // Check connection first
            this.checkFirebaseConnection().then(isConnected => {
                if (!isConnected) {
                    console.warn('[FIREBASE LISTENER] Firebase connection test failed, not setting up listener');
                    return;
                }
                
                // Setup real-time listener
                const docRef = db.collection('olympus_families').doc(this.familyId);
                console.log('[FIREBASE LISTENER] Creating listener for document:', `olympus_families/${this.familyId}`);
                
                this.firebaseListener = docRef.onSnapshot(
                    snapshot => {
                        console.log('[FIREBASE LISTENER] Received snapshot event', snapshot.exists ? 'document exists' : 'document does not exist');
                        
                        // Update connection status to online since we received data
                        this.updateConnectionStatus(true);
                        
                        if (snapshot.exists) {
                            console.log('[FIREBASE LISTENER] Received real-time update from Firebase');
                            const firestoreData = snapshot.data();
                            console.log('[FIREBASE LISTENER] Raw data:', JSON.stringify(firestoreData).substring(0, 100) + '...');
                            
                            // Only update if we're not in the middle of saving
                            if (!this._isSaving) {
                                console.log('[FIREBASE LISTENER] Updating local data from Firebase real-time update');
                                
                                // Validate and migrate data
                                if (this.validateDataStructure(firestoreData)) {
                                    const migratedData = this.migrateData(firestoreData);
                                    
                                    // Check if data is different from current data
                                    const currentDataStr = JSON.stringify(this.data);
                                    const newDataStr = JSON.stringify(migratedData);
                                    
                                    if (currentDataStr !== newDataStr) {
                                        console.log('[FIREBASE LISTENER] Data has changed, updating UI');
                                        
                                        // Update local data
                                        this.data = migratedData;
                                        
                                        // Store as last known good data
                                        this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                                        
                                        // Update localStorage for backup
                                        localStorage.setItem('olympusBank', JSON.stringify(this.data));
                                        
                                        // Update UI if UIManager is available
                                        if (window.UIManager && typeof UIManager.refreshAllData === 'function') {
                                            console.log('[FIREBASE LISTENER] Refreshing UI after Firebase update');
                                            UIManager.refreshAllData();
                                            
                                            // Show toast notification about data sync
                                            if (window.UIManager && typeof UIManager.showToast === 'function') {
                                                UIManager.showToast('Data synchronized from cloud!', 'success');
                                            }
                                        }
                                    } else {
                                        console.log('[FIREBASE LISTENER] Data unchanged, no UI update needed');
                                    }
                                } else {
                                    console.warn('[FIREBASE LISTENER] Invalid data structure received from Firebase');
                                }
                            } else {
                                console.log('[FIREBASE LISTENER] Ignoring Firebase update as we are currently saving');
                            }
                        } else {
                            console.log('[FIREBASE LISTENER] No data exists in Firebase for this family ID');
                        }
                    }, 
                    error => {
                        console.error('[FIREBASE LISTENER] Error in Firebase real-time listener:', error);
                        this.updateConnectionStatus(false);
                    }
                );
                
                console.log('[FIREBASE LISTENER] Listener setup complete');
            });
            
            return true;
        } catch (error) {
            console.error('[FIREBASE LISTENER] Error setting up Firebase listener:', error);
            this.updateConnectionStatus(false);
            return false;
        }
    },
    
    // Flag to prevent update loops when saving
    _isSaving: false,
    
    /**
     * Restore data from Firebase or localStorage
     * @param {boolean} useFirebase - Whether to use Firebase for storage
     * @returns {Promise<boolean>} Success status
     */
    async restoreData(useFirebase = false) {
        try {
            let dataLoaded = false;
            
            // Try to load from Firebase first if available
            if (useFirebase) {
                console.log('Attempting to restore data from Firebase');
                try {
                    const docRef = db.collection('olympus_families').doc(this.familyId);
                    const doc = await docRef.get();
                    
                    if (doc.exists) {
                        console.log('Found saved data in Firebase');
                        const firestoreData = doc.data();
                        
                        // Validate the data structure
                        if (this.validateDataStructure(firestoreData)) {
                            console.log('Firebase data structure is valid');
                            
                            // Apply any necessary migrations
                            const migratedData = this.migrateData(firestoreData);
                            
                            // Use the migrated data
                            this.data = migratedData;
                            
                            // Store as last known good data
                            this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                            
                            console.log('Data successfully restored from Firebase');
                            dataLoaded = true;
                        } else {
                            console.warn('Invalid data structure in Firebase, will try localStorage');
                        }
                    } else {
                        console.log('No saved data found in Firebase, will try localStorage');
                    }
                } catch (firebaseError) {
                    console.error('Error retrieving data from Firebase:', firebaseError);
                    console.log('Will attempt to use localStorage as fallback');
                }
            }
            
            // If Firebase failed or is not available, try localStorage
            if (!dataLoaded) {
                console.log('Attempting to restore data from localStorage');
                
                // Try to load from localStorage
                const savedData = localStorage.getItem('olympusBank');
                
                if (savedData) {
                    console.log('Found saved data in localStorage');
                    try {
                        const parsedData = JSON.parse(savedData);
                        
                        // Validate the data structure
                        if (this.validateDataStructure(parsedData)) {
                            console.log('Saved data structure is valid');
                            
                            // Apply any necessary migrations
                            const migratedData = this.migrateData(parsedData);
                            
                            // Use the migrated data
                            this.data = migratedData;
                            
                            // Store as last known good data
                            this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                            
                            console.log('Data successfully restored from localStorage');
                            dataLoaded = true;
                            
                            // If Firebase is available, sync localStorage data to Firebase
                            if (useFirebase) {
                                console.log('Syncing localStorage data to Firebase');
                                await this.saveData(true); // Force save to Firebase
                            }
                        } else {
                            console.warn('Invalid data structure in localStorage, using default data');
                        }
                    } catch (parseError) {
                        console.error('Error parsing saved data:', parseError);
                    }
                } else {
                    console.log('No saved data found in localStorage, using default data');
                }
            }
            
            // If no data was loaded, use default data
            if (!dataLoaded) {
                console.log('Initializing with default data');
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                
                // Set initial interest paid date if not set
                if (!this.data.settings.lastInterestPaid) {
                    this.data.settings.lastInterestPaid = new Date().toISOString();
                }
                
                // Store last good data
                this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                
                // Save to storage
                await this.saveData();
                
                console.log('Default data saved to storage');
            }
            
            return true;
        } catch (error) {
            console.error('Error restoring data:', error);
            
            // Emergency fallback to default data
            console.log('Emergency fallback to default data');
            this.data = JSON.parse(JSON.stringify(this.defaultData));
            
            return false;
        }
    },
    
    /**
     * Save data to Firebase and localStorage
     * @param {boolean} forceFirebase - Whether to force saving to Firebase 
     * @returns {Promise<boolean>} Success status
     */
    async saveData(forceFirebase = false) {
        try {
            if (!this.data) return false;
            
            // Set saving flag to prevent update loops
            this._isSaving = true;
            
            // Set data version
            this.data.dataVersion = this.dataVersion;
            
            // Get the family ID for storage
            const familyId = this.familyId || localStorage.getItem('olympusBankFamilyId') || 'default-family';
            
            // Create family-specific storage key
            const familyStorageKey = `olympusBank_${familyId}`;
            
            // Store to localStorage with both keys
            localStorage.setItem(familyStorageKey, JSON.stringify(this.data));
            localStorage.setItem('olympusBank', JSON.stringify(this.data)); // For backward compatibility
            
            // Also store family ID
            localStorage.setItem('olympusBankFamilyId', familyId);
            
            // Trigger cross-browser sync if it exists
            if (window.triggerCrossBrowserSync && typeof window.triggerCrossBrowserSync === 'function') {
                console.log("Triggering cross-browser sync after save");
                window.triggerCrossBrowserSync();
            }
            
            // Store to Firebase if available
            const useFirebase = (window.firebase && window.db) || forceFirebase;
            if (useFirebase) {
                try {
                    await db.collection('olympus_families').doc(this.familyId).set(this.data);
                    console.log('Data saved to Firebase successfully');
                } catch (firebaseError) {
                    console.error('Error saving to Firebase:', firebaseError);
                    // Firebase save failed, but localStorage succeeded
                    this._isSaving = false;
                    return true;
                }
            }
            
            console.log('Data saved successfully');
            
            // Update last good data after successful save
            this.lastGoodData = JSON.parse(JSON.stringify(this.data));
            
            // Clear saving flag
            this._isSaving = false;
            
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            this._isSaving = false;
            return false;
        }
    },
    
    /**
     * Validate data structure for integrity
     * @param {Object} data - Data to validate
     * @returns {boolean} Is valid
     */
    validateDataStructure(data) {
        try {
            console.log('Validating data structure');
            
            // Check if data is an object
            if (!data || typeof data !== 'object') {
                console.warn('Data is not an object');
                return false;
            }
            
            // Check for required properties
            const requiredProps = ['balance', 'transactions', 'chores', 'pendingTransactions', 'settings'];
            for (const prop of requiredProps) {
                if (!data.hasOwnProperty(prop)) {
                    console.warn(`Missing required property: ${prop}`);
                    return false;
                }
            }
            
            // Check settings object
            if (!data.settings || typeof data.settings !== 'object') {
                console.warn('Settings is not an object');
                return false;
            }
            
            // Check for parent password
            if (!data.settings.hasOwnProperty('parentPassword')) {
                console.warn('Missing parent password in settings');
                return false;
            }
            
            console.log('Data structure validation successful');
            return true;
        } catch (error) {
            console.error('Error validating data structure:', error);
            return false;
        }
    },
    
    /**
     * Apply data migrations if needed
     * @param {Object} data - Data to migrate
     * @returns {Object} Migrated data
     */
    migrateData(data) {
        // In a real application, we would have migration logic here
        // For this project, we'll just return the data as is
        return data;
    },
    
    /**
     * Reset data to default values
     * @returns {boolean} Success status
     */
    resetData() {
        try {
            this.data = JSON.parse(JSON.stringify(this.defaultData));
            return this.saveData();
        } catch (error) {
            console.error('Error resetting data:', error);
            return false;
        }
    },
    
    /**
     * Recover data from last known good state
     * @returns {boolean} Success status
     */
    recoverData() {
        try {
            if (!this.lastGoodData) return false;
            
            this.data = JSON.parse(JSON.stringify(this.lastGoodData));
            return this.saveData();
        } catch (error) {
            console.error('Error recovering data:', error);
            return false;
        }
    },
    
    /**
     * Get account balance
     * @returns {number} Account balance
     */
    getBalance() {
        if (!this.data) return 0;
        return this.data.balance;
    },
    
    /**
     * Set account balance
     * @param {number} amount - New balance amount
     * @returns {boolean} Success status
     */
    setBalance(amount) {
        try {
            if (!this.data) return false;
            
            if (typeof amount !== 'number' || isNaN(amount)) {
                console.error('Invalid balance amount');
                return false;
            }
            
            this.data.balance = parseFloat(amount.toFixed(2));
            return this.saveData();
        } catch (error) {
            console.error('Error setting balance:', error);
            return false;
        }
    },
    
    /**
     * Add a transaction
     * @param {object} transaction - Transaction object
     * @returns {boolean} Success status
     */
    addTransaction(transaction) {
        try {
            if (!this.data) return false;
            
            // Validate transaction
            const validation = Utils.validateTransaction(transaction);
            if (!validation.valid) {
                console.error('Invalid transaction:', validation.errors);
                return false;
            }
            
            // Add ID and timestamp if not present
            if (!transaction.id) {
                transaction.id = Utils.generateId();
            }
            
            if (!transaction.date) {
                transaction.date = new Date().toISOString();
            }
            
            // Add transaction to the beginning of the array
            this.data.transactions.unshift(transaction);
            
            // Update balance for immediate transactions
            if (!transaction.pending) {
                const amount = transaction.amount || 0;
                if (transaction.type === 'deposit' || transaction.type === 'chore' || transaction.type === 'interest') {
                    this.data.balance += amount;
                } else if (transaction.type === 'withdrawal') {
                    this.data.balance -= amount;
                }
                
                // Ensure balance has at most 2 decimal places
                this.data.balance = parseFloat(this.data.balance.toFixed(2));
            }
            
            return this.saveData();
        } catch (error) {
            console.error('Error adding transaction:', error);
            return false;
        }
    },
    
    /**
     * Get all transactions
     * @param {number} limit - Maximum number of transactions to return
     * @param {string} type - Filter by transaction type
     * @returns {array} Array of transactions
     */
    getTransactions(limit = 0, type = '') {
        if (!this.data) return [];
        
        try {
            // Get a filtered copy of transactions
            let transactions = JSON.parse(JSON.stringify(this.data.transactions));
            
            // Filter by type if specified
            if (type) {
                transactions = transactions.filter(t => t.type === type);
            }
            
            // Apply limit if specified
            if (limit > 0 && transactions.length > limit) {
                transactions = transactions.slice(0, limit);
            }
            
            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },
    
    /**
     * Add a pending transaction request
     * @param {object} transaction - Transaction object
     * @returns {boolean} Success status
     */
    addPendingTransaction(transaction) {
        try {
            if (!this.data) return false;
            
            // Add description if it's missing
            if (!transaction.description) {
                if (transaction.type === 'deposit') {
                    transaction.description = `Deposit: ${transaction.reason || 'No reason provided'}`;
                } else if (transaction.type === 'withdrawal') {
                    transaction.description = `Withdrawal: ${transaction.reason || 'No reason provided'}`;
                }
            }
            
            // Validate transaction
            const validation = Utils.validateTransaction(transaction);
            if (!validation.valid) {
                console.error('Invalid pending transaction:', validation.errors);
                return false;
            }
            
            // Add ID and timestamp if not present
            if (!transaction.id) {
                transaction.id = Utils.generateId();
            }
            
            if (!transaction.date) {
                transaction.date = new Date().toISOString();
            }
            
            // Mark as pending
            transaction.pending = true;
            
            // Add to pending transactions
            this.data.pendingTransactions.unshift(transaction);
            
            console.log('Successfully added pending transaction:', transaction);
            console.log('All pending transactions:', this.data.pendingTransactions);
            
            return this.saveData();
        } catch (error) {
            console.error('Error adding pending transaction:', error);
            return false;
        }
    },
    
    /**
     * Get all pending transactions
     * @returns {array} Array of pending transactions
     */
    getPendingTransactions() {
        if (!this.data) return [];
        
        try {
            // Return a copy to prevent accidental modification
            return JSON.parse(JSON.stringify(this.data.pendingTransactions));
        } catch (error) {
            console.error('Error getting pending transactions:', error);
            return [];
        }
    },
    
    /**
     * Get all pending approvals (both transactions and chores)
     * @returns {array} Array of pending approvals
     */
    getAllPendingApprovals() {
        if (!this.data) return [];
        
        try {
            console.log('Getting all pending approvals');
            console.log('Raw pending transactions:', this.data.pendingTransactions);
            
            // Get pending transactions
            const pendingTransactions = this.data.pendingTransactions.map(t => ({
                ...t,
                approvalType: 'transaction'
            }));
            
            console.log('Processed pending transactions:', pendingTransactions);
            
            // Get pending chores
            const pendingChores = this.data.chores
                .filter(c => c.pending)
                .map(c => ({
                    id: c.id,
                    type: 'chore',
                    name: c.name,
                    value: c.value,
                    eventCount: c.eventCount || 1,
                    date: c.completedDate,
                    approvalType: 'chore'
                }));
            
            console.log('Pending chores:', pendingChores);
            
            // Combine and sort by date (newest first)
            const allPending = [...pendingTransactions, ...pendingChores].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            console.log('All combined pending approvals:', allPending);
            
            return allPending;
        } catch (error) {
            console.error('Error getting all pending approvals:', error);
            return [];
        }
    },
    
    /**
     * Approve a pending transaction
     * @param {string} transactionId - ID of the transaction to approve
     * @returns {boolean} Success status
     */
    approvePendingTransaction(transactionId) {
        try {
            if (!this.data) return false;
            
            // Find the pending transaction
            const index = this.data.pendingTransactions.findIndex(t => t.id === transactionId);
            if (index === -1) {
                console.warn(`Pending transaction with ID ${transactionId} not found.`);
                return false;
            }
            
            // Get the transaction
            const transaction = { ...this.data.pendingTransactions[index] };
            
            // Remove pending flag
            transaction.pending = false;
            
            // Add approval date
            transaction.approvedDate = new Date().toISOString();
            
            // Remove from pending transactions
            this.data.pendingTransactions.splice(index, 1);
            
            // Add to regular transactions
            this.data.transactions.unshift(transaction);
            
            // Update balance
            const amount = transaction.amount || 0;
            if (transaction.type === 'deposit') {
                this.data.balance += amount;
            } else if (transaction.type === 'withdrawal') {
                this.data.balance -= amount;
            }
            
            // Ensure balance has at most 2 decimal places
            this.data.balance = parseFloat(this.data.balance.toFixed(2));
            
            return this.saveData();
        } catch (error) {
            console.error('Error approving pending transaction:', error);
            return false;
        }
    },
    
    /**
     * Reject a pending transaction
     * @param {string} transactionId - ID of the transaction to reject
     * @returns {boolean} Success status
     */
    rejectPendingTransaction(transactionId) {
        try {
            if (!this.data) return false;
            
            // Find the pending transaction
            const index = this.data.pendingTransactions.findIndex(t => t.id === transactionId);
            if (index === -1) {
                console.warn(`Pending transaction with ID ${transactionId} not found.`);
                return false;
            }
            
            // Remove from pending transactions
            this.data.pendingTransactions.splice(index, 1);
            
            return this.saveData();
        } catch (error) {
            console.error('Error rejecting pending transaction:', error);
            return false;
        }
    },
    
    /**
     * Add a chore
     * @param {object} chore - Chore object
     * @returns {boolean} Success status
     */
    addChore(chore) {
        try {
            if (!this.data) return false;
            
            // Validate chore
            const validation = Utils.validateChore(chore);
            if (!validation.valid) {
                console.error('Invalid chore:', validation.errors);
                return false;
            }
            
            // Add ID if not present
            if (!chore.id) {
                chore.id = Utils.generateId();
            }
            
            // Set initial states if not present
            chore.completed = chore.completed || false;
            chore.pending = chore.pending || false;
            
            // Add chore
            this.data.chores.push(chore);
            
            return this.saveData();
        } catch (error) {
            console.error('Error adding chore:', error);
            return false;
        }
    },
    
    /**
     * Get all chores
     * @returns {array} Array of chores
     */
    getChores() {
        if (!this.data) return [];
        
        try {
            // Return a copy to prevent accidental modification
            return JSON.parse(JSON.stringify(this.data.chores));
        } catch (error) {
            console.error('Error getting chores:', error);
            return [];
        }
    },
    
    /**
     * Mark a chore as completed (pending approval)
     * @param {string} choreId - ID of the chore to complete
     * @param {number} eventCount - Number of events completed
     * @returns {boolean} Success status
     */
    completeChore(choreId, eventCount = 1) {
        try {
            if (!this.data) return false;
            
            // Find the chore
            const chore = this.data.chores.find(c => c.id === choreId);
            if (!chore) {
                console.warn(`Chore with ID ${choreId} not found.`);
                return false;
            }
            
            // Mark as pending approval
            chore.pending = true;
            chore.completedDate = new Date().toISOString();
            chore.eventCount = eventCount;
            
            return this.saveData();
        } catch (error) {
            console.error('Error completing chore:', error);
            return false;
        }
    },
    
    /**
     * Approve a completed chore
     * @param {string} choreId - ID of the chore to approve
     * @returns {boolean} Success status
     */
    approveChore(choreId) {
        try {
            if (!this.data) return false;
            
            // Find the chore
            const chore = this.data.chores.find(c => c.id === choreId);
            if (!chore) {
                console.warn(`Chore with ID ${choreId} not found.`);
                return false;
            }
            
            // Check if the chore is pending approval
            if (!chore.pending) {
                console.warn(`Chore with ID ${choreId} is not pending approval.`);
                return false;
            }
            
            // Get event count
            const eventCount = chore.eventCount || 1;
            
            // Calculate total value
            const totalValue = chore.value * eventCount;
            
            // Create a transaction for the chore reward
            const choreTransaction = {
                id: Utils.generateId(),
                type: 'chore',
                amount: totalValue,
                description: `Completed ${chore.name}${eventCount > 1 ? ` (x${eventCount})` : ''}`,
                date: new Date().toISOString(),
                choreId: chore.id
            };
            
            // Add the transaction
            this.data.transactions.unshift(choreTransaction);
            
            // Update balance
            this.data.balance += totalValue;
            
            // Ensure balance has at most 2 decimal places
            this.data.balance = parseFloat(this.data.balance.toFixed(2));
            
            // Automatically reset the chore status for the next cycle
            chore.completed = false;
            chore.pending = false;
            delete chore.completedDate;
            delete chore.eventCount;
            
            return this.saveData();
        } catch (error) {
            console.error('Error approving chore:', error);
            return false;
        }
    },
    
    /**
     * Reject a completed chore
     * @param {string} choreId - ID of the chore to reject
     * @returns {boolean} Success status
     */
    rejectChore(choreId) {
        try {
            if (!this.data) return false;
            
            // Find the chore
            const chore = this.data.chores.find(c => c.id === choreId);
            if (!chore) {
                console.warn(`Chore with ID ${choreId} not found.`);
                return false;
            }
            
            // Reset pending status
            chore.pending = false;
            delete chore.completedDate;
            delete chore.eventCount;
            
            return this.saveData();
        } catch (error) {
            console.error('Error rejecting chore:', error);
            return false;
        }
    },
    
    /**
     * Delete a chore
     * @param {string} choreId - ID of the chore to delete
     * @returns {boolean} Success status
     */
    deleteChore(choreId) {
        try {
            if (!this.data) return false;
            
            // Find the chore index
            const index = this.data.chores.findIndex(c => c.id === choreId);
            if (index === -1) {
                console.warn(`Chore with ID ${choreId} not found.`);
                return false;
            }
            
            // Remove the chore
            this.data.chores.splice(index, 1);
            
            return this.saveData();
        } catch (error) {
            console.error('Error deleting chore:', error);
            return false;
        }
    },
    
    /**
     * Reset a completed chore (for recurring chores)
     * @param {string} choreId - ID of the chore to reset
     * @returns {boolean} Success status
     */
    resetChore(choreId) {
        try {
            if (!this.data) return false;
            
            // Find the chore
            const chore = this.data.chores.find(c => c.id === choreId);
            if (!chore) {
                console.warn(`Chore with ID ${choreId} not found.`);
                return false;
            }
            
            // Reset completion and pending status
            chore.completed = false;
            chore.pending = false;
            delete chore.completedDate;
            delete chore.approvedDate;
            delete chore.eventCount;
            
            return this.saveData();
        } catch (error) {
            console.error('Error resetting chore:', error);
            return false;
        }
    },
    
    /**
     * Add a savings goal
     * @param {object} goal - Goal object
     * @returns {boolean} Success status
     */
    addGoal(goal) {
        try {
            if (!this.data) return false;
            
            // Validate goal
            const validation = Utils.validateGoal(goal);
            if (!validation.valid) {
                console.error('Invalid goal:', validation.errors);
                return false;
            }
            
            // Add ID if not present
            if (!goal.id) {
                goal.id = Utils.generateId();
            }
            
            // Ensure currentAmount is set
            if (typeof goal.currentAmount !== 'number') {
                goal.currentAmount = 0;
            }
            
            // Set initial completed state
            goal.completed = false;
            
            // Add creation date
            goal.createdDate = new Date().toISOString();
            
            // Add goal
            this.data.goals.push(goal);
            
            return this.saveData();
        } catch (error) {
            console.error('Error adding goal:', error);
            return false;
        }
    },
    
    /**
     * Get all savings goals
     * @returns {array} Array of goals
     */
    getGoals() {
        if (!this.data) return [];
        
        try {
            // Return a copy to prevent accidental modification
            return JSON.parse(JSON.stringify(this.data.goals));
        } catch (error) {
            console.error('Error getting goals:', error);
            return [];
        }
    },
    
    /**
     * Contribute to a savings goal
     * @param {string} goalId - ID of the goal
     * @param {number} amount - Amount to contribute
     * @returns {boolean} Success status
     */
    contributeToGoal(goalId, amount) {
        try {
            if (!this.data) return false;
            
            // Validate amount
            if (typeof amount !== 'number' || amount <= 0) {
                console.error('Invalid contribution amount.');
                return false;
            }
            
            // Check if we have enough balance
            if (this.data.balance < amount) {
                console.warn('Insufficient balance for goal contribution.');
                return false;
            }
            
            // Find the goal
            const goal = this.data.goals.find(g => g.id === goalId);
            if (!goal) {
                console.warn(`Goal with ID ${goalId} not found.`);
                return false;
            }
            
            // Update goal amount
            goal.currentAmount += amount;
            
            // Ensure amount has at most 2 decimal places
            goal.currentAmount = parseFloat(goal.currentAmount.toFixed(2));
            
            // Check if goal is completed
            if (goal.currentAmount >= goal.targetAmount) {
                goal.completed = true;
                goal.completedDate = new Date().toISOString();
            }
            
            // Create a transaction for the contribution
            const goalTransaction = {
                id: Utils.generateId(),
                type: 'goal',
                amount: amount,
                description: `Contribution to goal: ${goal.name}`,
                date: new Date().toISOString(),
                goalId: goal.id
            };
            
            // Add the transaction
            this.data.transactions.unshift(goalTransaction);
            
            // Update balance
            this.data.balance -= amount;
            
            // Ensure balance has at most 2 decimal places
            this.data.balance = parseFloat(this.data.balance.toFixed(2));
            
            return this.saveData();
        } catch (error) {
            console.error('Error contributing to goal:', error);
            return false;
        }
    },
    
    /**
     * Delete a goal
     * @param {string} goalId - ID of the goal to delete
     * @returns {boolean} Success status
     */
    deleteGoal(goalId) {
        try {
            if (!this.data) return false;
            
            // Find the goal index
            const index = this.data.goals.findIndex(g => g.id === goalId);
            if (index === -1) {
                console.warn(`Goal with ID ${goalId} not found.`);
                return false;
            }
            
            // Get the goal
            const goal = this.data.goals[index];
            
            // If goal has funds, return them to balance
            if (goal.currentAmount > 0) {
                // Create a transaction for returning funds
                const returnTransaction = {
                    id: Utils.generateId(),
                    type: 'goal',
                    amount: goal.currentAmount,
                    description: `Returned funds from deleted goal: ${goal.name}`,
                    date: new Date().toISOString()
                };
                
                // Add the transaction
                this.data.transactions.unshift(returnTransaction);
                
                // Update balance
                this.data.balance += goal.currentAmount;
                
                // Ensure balance has at most 2 decimal places
                this.data.balance = parseFloat(this.data.balance.toFixed(2));
            }
            
            // Remove the goal
            this.data.goals.splice(index, 1);
            
            return this.saveData();
        } catch (error) {
            console.error('Error deleting goal:', error);
            return false;
        }
    },
    
    /**
     * Change parent password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {boolean} Success status
     */
    changeParentPassword(currentPassword, newPassword) {
        try {
            if (!this.data) return false;
            
            // Verify current password
            if (this.data.settings.parentPassword !== currentPassword) {
                console.warn('Incorrect current password.');
                return false;
            }
            
            // Update password
            this.data.settings.parentPassword = newPassword;
            
            return this.saveData();
        } catch (error) {
            console.error('Error changing parent password:', error);
            return false;
        }
    },
    
    /**
     * Verify parent password
     * @param {string} password - Password to verify
     * @returns {boolean} Is valid
     */
    verifyParentPassword(password) {
        try {
            console.log('Verifying parent password, data exists:', !!this.data);
            
            if (!this.data) {
                console.error('Data is null in verifyParentPassword');
                return false;
            }
            
            console.log('Stored parent password exists:', !!this.data.settings.parentPassword);
            
            // Make sure we have the settings object
            if (!this.data.settings || typeof this.data.settings.parentPassword !== 'string') {
                console.error('Invalid settings structure in verifyParentPassword');
                return false;
            }
            
            const result = this.data.settings.parentPassword === password;
            console.log('Password verification result:', result);
            return result;
        } catch (error) {
            console.error('Error verifying parent password:', error);
            return false;
        }
    },
    
    /**
     * Clear all transactions while keeping the balance
     * @returns {boolean} Success status
     */
    clearTransactions() {
        try {
            if (!this.data) return false;
            
            // Confirm current balance
            const currentBalance = this.data.balance;
            
            // Clear transactions
            this.data.transactions = [];
            
            // Add a record of the clearing
            const clearingRecord = {
                id: Utils.generateId(),
                type: 'system',
                amount: 0,
                description: 'Transaction history cleared by Zeus',
                date: new Date().toISOString()
            };
            
            this.data.transactions.push(clearingRecord);
            
            // Ensure balance is maintained
            this.data.balance = currentBalance;
            
            return this.saveData();
        } catch (error) {
            console.error('Error clearing transactions:', error);
            return false;
        }
    },
    
    /**
     * Export data to JSON
     * @returns {string} JSON string of data
     */
    exportData() {
        try {
            if (!this.data) return '';
            
            return JSON.stringify(this.data);
        } catch (error) {
            console.error('Error exporting data:', error);
            return '';
        }
    },
    
    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string of data
     * @returns {boolean} Success status
     */
    importData(jsonData) {
        try {
            // Parse the data
            const parsedData = JSON.parse(jsonData);
            
            // Validate data structure
            if (this.validateDataStructure(parsedData)) {
                // Apply any necessary migrations
                const migratedData = this.migrateData(parsedData);
                
                // Store data
                this.data = migratedData;
                
                // Store last good data
                this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                
                // Save to localStorage
                return this.saveData();
            } else {
                console.error('Invalid data structure in import');
                return false;
            }
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },
    
    /**
     * Schedule interest calculation
     */
    scheduleInterestCalculation() {
        try {
            // Check interest on startup and then check daily
            this.calculateInterest();
            
            // Set up interval to check daily (every 24 hours)
            setInterval(() => {
                this.calculateInterest();
            }, 24 * 60 * 60 * 1000);
        } catch (error) {
            console.error('Error scheduling interest calculation:', error);
        }
    },
    
    /**
     * Calculate and add monthly interest if due
     * @returns {boolean} Whether interest was added
     */
    calculateInterest() {
        try {
            if (!this.data) return false;
            
            // Get last interest payment date
            const lastInterestPaid = this.data.settings.lastInterestPaid
                ? new Date(this.data.settings.lastInterestPaid)
                : null;
            
            // If no previous interest payment, set current date and return
            if (!lastInterestPaid) {
                this.data.settings.lastInterestPaid = new Date().toISOString();
                this.saveData();
                return false;
            }
            
            const now = new Date();
            
            // Check if a month has passed since last interest payment
            // We'll define a month as 30 days for simplicity
            const daysSinceLastInterest = Math.floor((now - lastInterestPaid) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastInterest >= 30) {
                // Calculate monthly interest (annual rate / 12)
                const monthlyRate = this.data.settings.interestRate / 12;
                const interestAmount = this.data.balance * monthlyRate;
                
                // Only add interest if it's at least 1 cent
                if (interestAmount >= 0.01) {
                    const roundedInterest = parseFloat(interestAmount.toFixed(2));
                    
                    // Create interest transaction
                    const interestTransaction = {
                        id: Utils.generateId(),
                        type: 'interest',
                        amount: roundedInterest,
                        description: 'Monthly interest (10% annual)',
                        date: now.toISOString()
                    };
                    
                    // Add the transaction
                    this.data.transactions.unshift(interestTransaction);
                    
                    // Update balance
                    this.data.balance += roundedInterest;
                    
                    // Ensure balance has at most 2 decimal places
                    this.data.balance = parseFloat(this.data.balance.toFixed(2));
                }
                
                // Update last interest payment date
                this.data.settings.lastInterestPaid = now.toISOString();
                
                this.saveData();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error calculating interest:', error);
            return false;
        }
    },
    
    /**
     * Set family ID and reload data
     * @param {string} familyId - New family ID
     * @returns {Promise<boolean>} Success status
     */
    async setFamilyId(familyId) {
        try {
            if (!familyId) return false;
            
            console.log(`[DATA SYNC] Changing family ID from ${this.familyId} to ${familyId}`);
            
            // Clean up existing Firebase listener
            if (this.firebaseListener) {
                this.firebaseListener();
                this.firebaseListener = null;
                console.log('[DATA SYNC] Cleaned up previous Firebase listener');
            }
            
            // Store old family ID in case we need to revert
            const oldFamilyId = this.familyId;
            
            // Update family ID
            this.familyId = familyId;
            localStorage.setItem('olympusBankFamilyId', this.familyId);
            console.log('[DATA SYNC] Updated family ID in localStorage');
            
            // Check if Firebase is available
            const useFirebase = window.firebase && window.db;
            console.log('[DATA SYNC] Firebase available:', useFirebase);
            
            // First check if data exists for this family ID in Firebase
            let existingDataFound = false;
            
            if (useFirebase) {
                try {
                    console.log(`[DATA SYNC] Checking if data exists for family ID: ${familyId}`);
                    const docRef = db.collection('olympus_families').doc(familyId);
                    const doc = await docRef.get();
                    
                    if (doc.exists) {
                        console.log('[DATA SYNC] Found existing data for this family code!');
                        console.log('[DATA SYNC] Data:', doc.data());
                        const firestoreData = doc.data();
                        
                        // Validate the data structure
                        if (this.validateDataStructure(firestoreData)) {
                            console.log('[DATA SYNC] Existing data is valid - will load it');
                            existingDataFound = true;
                            
                            // Immediately update our data with the Firebase data
                            this.data = this.migrateData(firestoreData);
                            this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                            
                            // Force UI refresh if UIManager is available
                            if (window.UIManager && typeof UIManager.refreshAllData === 'function') {
                                console.log('[DATA SYNC] Refreshing UI with Firebase data');
                                UIManager.refreshAllData();
                            }
                        } else {
                            console.warn('[DATA SYNC] Found data for this family code, but it has invalid structure');
                        }
                    } else {
                        console.log('[DATA SYNC] No existing data found for this family code. Will create new data.');
                    }
                } catch (error) {
                    console.error('[DATA SYNC] Error checking for existing data:', error);
                }
            }
            
            if (existingDataFound) {
                // Even though we've already loaded the data, call restoreData to ensure everything is properly initialized
                console.log('[DATA SYNC] Already loaded Firebase data, but calling restoreData for full initialization');
                await this.restoreData(useFirebase);
                console.log('[DATA SYNC] Restored existing data for family code');
                
                // Show success message if UIManager is available
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Connected to existing family account!', 'success');
                }
            } else {
                // If no data exists for this family ID, we'll create new data
                console.log('[DATA SYNC] Creating new data for this family code');
                
                // Initialize with default data
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                
                // Save the default data to this family ID
                console.log('[DATA SYNC] Saving default data to Firebase');
                await this.saveData(true); // Force save to Firebase if available
                
                // Show notification if UIManager is available
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('New family account created!', 'success');
                }
            }
            
            // Set up new Firebase listener
            if (useFirebase) {
                console.log('[DATA SYNC] Setting up Firebase listener for real-time updates');
                this.setupFirebaseListener();
            }
            
            return true;
        } catch (error) {
            console.error('[DATA SYNC] Error setting family ID:', error);
            return false;
        }
    },
    
    /**
     * Forcibly syncs data from Firebase, prioritizing cloud data over local
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async forceSyncFromFirebase() {
        console.log("Force syncing from Firebase...");
        
        // Show toast if UI manager is available
        if (window.UIManager && typeof UIManager.showToast === 'function') {
            UIManager.showToast("Syncing with cloud...", "info");
        }
        
        try {
            // Check if Firebase is available
            if (!window.firebase || !window.db) {
                console.error("Firebase not available");
                throw new Error("Firebase not available");
            }
            
            // Check connection first
            const isConnected = await this.checkFirebaseConnection();
            if (!isConnected) {
                console.error("Firebase connection test failed");
                throw new Error("Not connected to Firebase");
            }
            
            // Get data from Firebase
            console.log(`Getting data from Firebase for family: ${this.familyId}`);
            const docRef = window.db.collection('olympus_families').doc(this.familyId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                // Get and validate data from Firebase
                const firebaseData = doc.data();
                console.log("Received data from Firebase:", Object.keys(firebaseData));
                
                // Validate data structure
                if (!this.validateDataStructure(firebaseData)) {
                    console.error("Invalid data structure from Firebase");
                    throw new Error("Invalid data structure from Firebase");
                }
                
                // Migrate data if needed
                const migratedData = this.migrateData(firebaseData);
                
                // Compare with local data to see if there's any difference
                const currentDataStr = JSON.stringify(this.data);
                const newDataStr = JSON.stringify(migratedData);
                
                if (currentDataStr !== newDataStr) {
                    console.log("Firebase data differs from local data, updating...");
                    
                    // Set the data and update localStorage
                    this.data = migratedData;
                    localStorage.setItem('olympusBank', JSON.stringify(this.data));
                    
                    // Store as last known good data
                    this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                    
                    // Update UI if UIManager is available
                    if (window.UIManager && typeof UIManager.refreshAllData === 'function') {
                        console.log("Refreshing UI with data from Firebase");
                        UIManager.refreshAllData();
                        
                        // Show toast
                        if (window.UIManager && typeof UIManager.showToast === 'function') {
                            UIManager.showToast("Data synchronized from cloud", "success");
                        }
                    }
                    
                    console.log("Force sync from Firebase completed successfully with update");
                    return true;
                } else {
                    console.log("Firebase data matches local data, no update needed");
                    
                    // Show toast
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        UIManager.showToast("Already in sync with cloud", "info");
                    }
                    
                    return true;
                }
            } else {
                console.log(`No data exists in Firebase for family ${this.familyId}`);
                
                // If no data in Firebase but we have local data, push it to Firebase
                if (this.data && Object.keys(this.data).length > 0) {
                    console.log("Pushing local data to Firebase");
                    await docRef.set(this.data);
                    
                    // Show toast
                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                        UIManager.showToast("Initialized cloud data with local data", "success");
                    }
                    
                    return true;
                } else {
                    console.error("No data in Firebase or locally");
                    throw new Error("No data found");
                }
            }
        } catch (error) {
            console.error("Error during force sync from Firebase:", error);
            
            // Show toast
            if (window.UIManager && typeof UIManager.showToast === 'function') {
                UIManager.showToast(`Sync failed: ${error.message}`, "error");
            }
            
            // Try to fall back to localStorage if we have no data
            if (!this.data || Object.keys(this.data).length === 0) {
                console.log("Falling back to localStorage due to Firebase error");
                this.loadFromLocalStorage();
            }
            
            return false;
        }
    },
    
    /**
     * Load data from localStorage
     * @returns {boolean} Success status
     */
    loadFromLocalStorage() {
        try {
            console.log("Loading data from localStorage");
            
            // Get the family ID for localized storage
            const familyId = this.familyId || localStorage.getItem('olympusBankFamilyId') || 'default-family';
            console.log("Looking for data for family ID:", familyId);
            
            // Check family-specific data first, then fall back to standard key
            const familyStorageKey = `olympusBank_${familyId}`;
            let storedData = localStorage.getItem(familyStorageKey);
            
            if (!storedData) {
                console.log("No family-specific data found, checking standard key");
                storedData = localStorage.getItem('olympusBank');
                
                // If found data in standard key, save it to the family-specific key
                if (storedData) {
                    console.log("Found data in standard key, copying to family-specific key");
                    localStorage.setItem(familyStorageKey, storedData);
                }
            } else {
                console.log("Found family-specific data");
            }
            
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData);
                    
                    // Validate data structure
                    if (this.validateDataStructure(parsedData)) {
                        console.log("Valid data loaded from localStorage");
                        
                        // Migrate data if needed
                        const migratedData = this.migrateData(parsedData);
                        
                        // Only update if different from current data
                        const currentDataStr = JSON.stringify(this.data || {});
                        const newDataStr = JSON.stringify(migratedData);
                        
                        if (currentDataStr !== newDataStr) {
                            console.log("Data has changed, updating memory and UI");
                            this.data = migratedData;
                            
                            // Update display directly for immediate feedback
                            this._updateDisplayValues();
                            
                            // Update UI if needed
                            if (window.UIManager && typeof UIManager.refreshAllData === 'function') {
                                console.log("Refreshing UI after loading from localStorage");
                                UIManager.refreshAllData();
                            }
                            
                            // Make sure data is saved back to localStorage to ensure consistency
                            localStorage.setItem(familyStorageKey, JSON.stringify(this.data));
                            localStorage.setItem('olympusBank', JSON.stringify(this.data));
                            
                            // Show toast message if available
                            if (window.UIManager && typeof UIManager.showToast === 'function') {
                                UIManager.showToast("Data synchronized", "success");
                            }
                        } else {
                            console.log("Data unchanged, no update needed");
                        }
                        
                        return true;
                    } else {
                        console.warn("Invalid data structure in localStorage");
                        return false;
                    }
                } catch (parseError) {
                    console.error("Error parsing data from localStorage:", parseError);
                    return false;
                }
            } else {
                console.warn("No data found in localStorage");
                return false;
            }
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
            return false;
        }
    },
    
    /**
     * Check Firebase connection and update status
     * @returns {Promise<boolean>} Connection status
     */
    async checkFirebaseConnection() {
        // Use the global connection check method if available
        if (window.checkFirebaseConnection) {
            return window.checkFirebaseConnection();
        }
        
        // Fallback to our own implementation
        try {
            // First check if Firebase is available
            if (!window.firebase || !firebase.firestore) {
                console.warn('[CONNECTION] Firebase not available');
                this.updateConnectionStatus(false);
                return false;
            }
            
            // Try to access Firestore
            try {
                // Perform a simple database operation to check connectivity
                const testRef = firebase.firestore().collection('_connection_test').doc('test');
                await testRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                
                console.log('[CONNECTION] Successfully connected to Firebase');
                this.updateConnectionStatus(true);
                return true;
            } catch (firebaseError) {
                console.error('[CONNECTION] Firebase connection test failed:', firebaseError);
                this.updateConnectionStatus(false);
                return false;
            }
        } catch (error) {
            console.error('[CONNECTION] Error checking Firebase connection:', error);
            this.updateConnectionStatus(false);
            return false;
        }
    },
    
    /**
     * Update connection status indicator
     * @param {boolean} isOnline - Whether the app is connected to Firebase
     */
    updateConnectionStatus(isOnline) {
        // Use the global connection status update method if available
        if (window.updateConnectionStatus) {
            window.updateConnectionStatus(isOnline);
            return true;
        }
        
        // Fallback to our own implementation
        try {
            // Update the connection status in localStorage for persistence
            localStorage.setItem('olympusBankConnectionStatus', isOnline ? 'online' : 'offline');
            
            // Update the connection status indicators in the UI
            const statusIndicators = document.querySelectorAll('.connection-status');
            
            statusIndicators.forEach(indicator => {
                if (isOnline) {
                    indicator.innerHTML = '<i class="fa fa-wifi"></i> Online';
                    indicator.classList.remove('offline');
                    indicator.classList.add('online');
                } else {
                    indicator.innerHTML = '<i class="fa fa-exclamation-triangle"></i> Offline';
                    indicator.classList.remove('online');
                    indicator.classList.add('offline');
                }
            });
            
            // Enable or disable sync buttons based on connection status
            const syncButtons = document.querySelectorAll('.sync-now-btn');
            syncButtons.forEach(button => {
                button.disabled = !isOnline;
                if (!isOnline) {
                    button.setAttribute('title', 'Cannot sync while offline');
                } else {
                    button.setAttribute('title', 'Sync data with cloud');
                }
            });
            
            return true;
        } catch (error) {
            console.error('[CONNECTION] Error updating connection status:', error);
            return false;
        }
    },

    /**
     * Manually syncs data between browser windows and with Firebase if available
     * Returns a promise that resolves when sync is complete
     * @returns {Promise<boolean>} - Promise resolving to true if sync successful, false otherwise
     */
    manualSync: function() {
        console.log("Manual sync initiated");
        
        // Show toast if UI manager is available
        if (window.UIManager && typeof UIManager.showToast === 'function') {
            UIManager.showToast("Syncing data...", "info");
        }
        
        return new Promise((resolve, reject) => {
            try {
                console.log("In manualSync: Performing sync operation");
                
                // Get the family ID for storage
                const familyId = this.familyId || localStorage.getItem('olympusBankFamilyId') || 'default-family';
                const familyStorageKey = `olympusBank_${familyId}`;
                
                // First, save our current in-memory data to localStorage using family-specific keys
                localStorage.setItem(familyStorageKey, JSON.stringify(this.data));
                localStorage.setItem('olympusBank', JSON.stringify(this.data)); // For backward compatibility
                console.log("Current data saved to localStorage");
                
                // First try local sync which is more reliable
                this._performLocalSync()
                    .then(localSuccess => {
                        // If we're connected to Firebase, try cloud sync as well
                        if (window.isFirebaseConnected && window.firebase && window.db) {
                            console.log("Local sync complete, now attempting cloud sync");
                            
                            // Push data to Firebase first
                            this.saveData(true)
                                .then(() => {
                                    // Then try to fetch the latest data from Firebase
                                    if (typeof this.forceSyncFromFirebase === 'function') {
                                        return this.forceSyncFromFirebase()
                                            .then(cloudSuccess => {
                                                if (cloudSuccess) {
                                                    console.log("Cloud sync successful");
                                                    
                                                    // Ensure we have the latest data in localStorage
                                                    localStorage.setItem(familyStorageKey, JSON.stringify(this.data));
                                                    localStorage.setItem('olympusBank', JSON.stringify(this.data));
                                                    
                                                    // Signal other tabs to sync
                                                    this._triggerSyncToOtherTabs();
                                                    
                                                    // Show success notification
                                                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                                                        UIManager.showToast("Data synchronized with cloud", "success");
                                                    }
                                                } else {
                                                    console.log("Cloud sync failed, but local sync was successful");
                                                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                                                        UIManager.showToast("Local sync successful, but cloud sync failed", "warning");
                                                    }
                                                }
                                                
                                                resolve(true); // Local sync was successful anyway
                                            });
                                    } else {
                                        console.log("forceSyncFromFirebase not available, but local sync was successful");
                                        resolve(true);
                                    }
                                })
                                .catch(error => {
                                    console.error("Error during cloud sync:", error);
                                    // Local sync was successful, so still resolve as success
                                    if (window.UIManager && typeof UIManager.showToast === 'function') {
                                        UIManager.showToast("Local sync successful, but cloud sync failed", "warning");
                                    }
                                    resolve(true);
                                });
                        } else {
                            console.log("Firebase not connected, but local sync was successful");
                            if (window.UIManager && typeof UIManager.showToast === 'function') {
                                UIManager.showToast("Local sync completed", "success");
                            }
                            resolve(true);
                        }
                    })
                    .catch(error => {
                        console.error("Error during local sync:", error);
                        reject(error);
                    });
            } catch (error) {
                console.error("Error in manual sync:", error);
                // Show error toast if UI manager is available
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast("Sync error: " + error.message, "error");
                }
                reject(error);
            }
        });
    },

    /**
     * Helper method to trigger sync to other tabs
     * @private
     */
    _triggerSyncToOtherTabs: function() {
        if (window.triggerCrossBrowserSync) {
            console.log("Triggering sync to other browser tabs");
            window.triggerCrossBrowserSync();
            return true;
        } else {
            console.warn("triggerCrossBrowserSync not available");
            return false;
        }
    },

    /**
     * Performs a local sync between browser tabs
     * @private
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    _performLocalSync: function() {
        return new Promise((resolve, reject) => {
            try {
                console.log("Performing local sync between browser tabs");
                
                // First, check if there's newer data in localStorage
                const localStorageData = localStorage.getItem('olympusBank');
                
                if (localStorageData) {
                    try {
                        const parsedData = JSON.parse(localStorageData);
                        
                        if (this.validateDataStructure(parsedData)) {
                            console.log("Valid data found in localStorage");
                            
                            // Check if local storage data is newer or different
                            const needsUpdate = this._compareDataVersions(parsedData, this.data);
                            
                            if (needsUpdate) {
                                console.log("LocalStorage data is different, updating memory data");
                                this.data = this.migrateData(parsedData);
                                
                                // Update UI
                                this._updateDisplayValues();
                                
                                if (window.UIManager && typeof UIManager.showToast === 'function') {
                                    UIManager.showToast("Updated with latest data from local storage", "success");
                                }
                            } else {
                                console.log("Memory data is current, updating localStorage");
                                
                                // Make sure localStorage has our current data
                                localStorage.setItem('olympusBank', JSON.stringify(this.data));
                            }
                        } else {
                            console.warn("Invalid data in localStorage, using memory data");
                            localStorage.setItem('olympusBank', JSON.stringify(this.data));
                        }
                    } catch (parseError) {
                        console.error("Error parsing localStorage data:", parseError);
                        // Ensure localStorage has our current data
                        localStorage.setItem('olympusBank', JSON.stringify(this.data));
                    }
                } else {
                    console.log("No data in localStorage, saving current data");
                    localStorage.setItem('olympusBank', JSON.stringify(this.data));
                }
                
                // Signal other tabs to sync with our data
                this._triggerSyncToOtherTabs();
                
                // Update UI
                this._updateDisplayValues();
                
                // Show success notification
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast("Local sync completed", "success");
                }
                
                resolve(true);
            } catch (error) {
                console.error("Error during local sync:", error);
                
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast("Local sync failed: " + error.message, "error");
                }
                
                reject(error);
            }
        });
    },
    
    /**
     * Compare two data versions to determine which is newer or if they differ
     * @param {Object} data1 - First data object
     * @param {Object} data2 - Second data object
     * @returns {boolean} - True if data1 is different from data2
     * @private
     */
    _compareDataVersions: function(data1, data2) {
        // Simple comparison - just check if they're different
        // In a real app, you might want to use timestamps or version numbers
        return JSON.stringify(data1) !== JSON.stringify(data2);
    },

    /**
     * Update display values directly to ensure sync works immediately
     * @private
     */
    _updateDisplayValues: function() {
        try {
            console.log("Updating display values");
            
            // Update all balance displays on the page
            const balanceDisplays = document.querySelectorAll('[data-balance-display]');
            if (balanceDisplays.length > 0) {
                balanceDisplays.forEach(display => {
                    display.textContent = this.data.balance.toFixed(2);
                });
            } else {
                // Fallback to specific IDs
                const balanceElements = [
                    document.getElementById('parent-balance-display'),
                    document.getElementById('child-balance-display'),
                    document.getElementById('balance-display')
                ];
                
                balanceElements.forEach(element => {
                    if (element) {
                        element.textContent = this.data.balance.toFixed(2);
                    }
                });
            }
            
            // Refresh transaction lists
            this._refreshTransactionLists();
            
            // If UIManager exists and has a refresh method, use it for a complete refresh
            if (window.UIManager) {
                if (typeof window.UIManager.refreshAllData === 'function') {
                    window.UIManager.refreshAllData();
                }
            }
            
            console.log("Display values updated successfully");
        } catch (error) {
            console.error("Error updating display values:", error);
        }
    },

    /**
     * Refresh transaction lists in UI
     * @private
     */
    _refreshTransactionLists: function() {
        const parentTransactionList = document.getElementById('parent-transaction-list');
        const childRecentTransactions = document.getElementById('child-recent-transactions');
        const childTransactionHistory = document.getElementById('child-transaction-history');
        
        if (parentTransactionList) {
            this._populateTransactionList(parentTransactionList, this.data.transactions.slice(0, 5));
        }
        
        if (childRecentTransactions) {
            this._populateTransactionList(childRecentTransactions, this.data.transactions.slice(0, 3));
        }
        
        if (childTransactionHistory) {
            this._populateTransactionList(childTransactionHistory, this.data.transactions);
        }
    },

    /**
     * Populate a transaction list element with transaction data
     * @private
     */
    _populateTransactionList: function(listElement, transactions) {
        if (!listElement) return;
        
        // Clear existing content
        listElement.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            listElement.innerHTML = '<div class="empty-list">No transactions to display</div>';
            return;
        }
        
        // Create transaction elements
        transactions.forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.classList.add('transaction-item');
            transactionEl.classList.add(transaction.amount > 0 ? 'deposit' : 'withdrawal');
            
            const date = new Date(transaction.date);
            const formattedDate = `${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
            
            transactionEl.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${transaction.amount > 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </div>
            `;
            
            listElement.appendChild(transactionEl);
        });
    },
};

// Initialize DataManager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
});

// At the end of the file, add this line
window.DataManager = DataManager; 