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
            
            // Set family ID - in a real app, this would be based on authentication
            this.familyId = localStorage.getItem('olympusBankFamilyId') || 'default-family';
            
            if (forceReset) {
                console.log('Force reset requested, using default data');
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                await this.saveData();
            } else {
                // Restore data from Firebase or localStorage
                await this.restoreData(useFirebase);
            }
            
            // Set up real-time Firebase listener if Firebase is available
            if (useFirebase) {
                this.setupFirebaseListener();
            }
            
            // Schedule interest calculations
            this.scheduleInterestCalculation();
            
            console.log('DataManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing DataManager:', error);
            return false;
        }
    },
    
    /**
     * Set up real-time Firebase listener for cross-device synchronization
     */
    setupFirebaseListener() {
        try {
            console.log('Setting up Firebase real-time listener for family:', this.familyId);
            
            // Clean up any existing listener
            if (this.firebaseListener) {
                this.firebaseListener();
                this.firebaseListener = null;
            }
            
            // Setup real-time listener
            const docRef = db.collection('families').doc(this.familyId);
            this.firebaseListener = docRef.onSnapshot(snapshot => {
                if (snapshot.exists) {
                    console.log('Received real-time update from Firebase');
                    const firestoreData = snapshot.data();
                    
                    // Only update if we're not in the middle of saving
                    if (!this._isSaving) {
                        console.log('Updating local data from Firebase real-time update');
                        
                        // Validate and migrate data
                        if (this.validateDataStructure(firestoreData)) {
                            const migratedData = this.migrateData(firestoreData);
                            
                            // Update local data
                            this.data = migratedData;
                            
                            // Store as last known good data
                            this.lastGoodData = JSON.parse(JSON.stringify(this.data));
                            
                            // Update UI if UIManager is available
                            if (window.UIManager && typeof UIManager.refreshAllData === 'function') {
                                console.log('Refreshing UI after Firebase update');
                                UIManager.refreshAllData();
                            }
                        } else {
                            console.warn('Invalid data structure received from Firebase');
                        }
                    } else {
                        console.log('Ignoring Firebase update as we are currently saving');
                    }
                } else {
                    console.log('No data exists in Firebase for this family ID');
                }
            }, error => {
                console.error('Error in Firebase real-time listener:', error);
            });
            
            console.log('Firebase listener setup complete');
            return true;
        } catch (error) {
            console.error('Error setting up Firebase listener:', error);
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
                    const docRef = db.collection('families').doc(this.familyId);
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
            
            // Store to localStorage for backwards compatibility
            localStorage.setItem('olympusBank', JSON.stringify(this.data));
            
            // Also store family ID
            localStorage.setItem('olympusBankFamilyId', this.familyId);
            
            // Store to Firebase if available
            const useFirebase = (window.firebase && window.db) || forceFirebase;
            if (useFirebase) {
                try {
                    await db.collection('families').doc(this.familyId).set(this.data);
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
            
            console.log(`Changing family ID from ${this.familyId} to ${familyId}`);
            
            // Clean up existing Firebase listener
            if (this.firebaseListener) {
                this.firebaseListener();
                this.firebaseListener = null;
            }
            
            // Store old family ID in case we need to revert
            const oldFamilyId = this.familyId;
            
            // Update family ID
            this.familyId = familyId;
            localStorage.setItem('olympusBankFamilyId', this.familyId);
            
            // Check if Firebase is available
            const useFirebase = window.firebase && window.db;
            
            // First check if data exists for this family ID in Firebase
            let existingDataFound = false;
            
            if (useFirebase) {
                try {
                    console.log(`Checking if data exists for family ID: ${familyId}`);
                    const docRef = db.collection('families').doc(familyId);
                    const doc = await docRef.get();
                    
                    if (doc.exists) {
                        console.log('Found existing data for this family code!');
                        const firestoreData = doc.data();
                        
                        // Validate the data structure
                        if (this.validateDataStructure(firestoreData)) {
                            console.log('Existing data is valid - will load it');
                            existingDataFound = true;
                        } else {
                            console.warn('Found data for this family code, but it has invalid structure');
                        }
                    } else {
                        console.log('No existing data found for this family code. Will create new data.');
                    }
                } catch (error) {
                    console.error('Error checking for existing data:', error);
                }
            }
            
            if (existingDataFound) {
                // If data exists, restore it
                await this.restoreData(useFirebase);
                console.log('Restored existing data for family code');
                
                // Show success message if UIManager is available
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Connected to existing family account!', 'success');
                }
            } else {
                // If no data exists for this family ID, we have two options:
                // 1. Create new data (if this is genuinely a new family)
                // 2. There's an error/typo in the family code
                
                // For now, we'll assume it's a new family code and create new data
                console.log('Creating new data for this family code');
                
                // Initialize with default data
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                
                // Save the default data to this family ID
                await this.saveData(true); // Force save to Firebase if available
                
                // Show notification if UIManager is available
                if (window.UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('New family account created!', 'success');
                }
            }
            
            // Set up new Firebase listener
            if (useFirebase) {
                this.setupFirebaseListener();
            }
            
            return true;
        } catch (error) {
            console.error('Error setting family ID:', error);
            return false;
        }
    }
};

// Initialize DataManager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
}); 