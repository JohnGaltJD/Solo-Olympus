/**
 * app.js
 * ---
 * Main application logic for Family Mount Olympus Bank
 */

// UI Manager for the Family Mount Olympus Bank application
const UIManager = {
    // Track initialization state to prevent duplicate init
    isInitialized: false,
    
    // Track component loading states
    componentStates: {
        data: false,
        ui: false,
        auth: false
    },
    
    /**
     * Initialize application UI
     */
    init(forceReset = false) {
        // Prevent multiple initialization
        if (this.isInitialized && !forceReset) {
            console.log('UIManager already initialized.');
            return true;
        }
        
        try {
            console.log('Initializing UIManager...');
            
            // Initialize with performance monitoring if available
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('UIManager.init', () => this._initImpl(forceReset));
            } else {
                return this._initImpl(forceReset);
            }
        } catch (error) {
            console.error('Error initializing UIManager:', error);
            return false;
        }
    },
    
    /**
     * Implementation of initialization logic
     * @private
     * @param {boolean} forceReset - Whether to force a reset of data
     * @returns {boolean} Success status
     */
    _initImpl(forceReset) {
        try {
            // Initialize DataManager first
            if (!DataManager.init(forceReset)) {
                console.error('Failed to initialize DataManager.');
                return false;
            }
            
            // Initialize authentication handlers
            if (!this.initAuth()) {
                console.error('Failed to initialize authentication.');
                return false;
            }
            
            // Set up tab navigation
            this.initTabNavigation();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Load theme-specific CSS
            this.loadThemeCSS();
            
            // Ensure image assets
            this.ensureImageAssets();
            
            // Render initial data
            this.refreshAllData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Set initialized flag
            this.isInitialized = true;
            
            console.log('UIManager initialized successfully.');
            return true;
        } catch (error) {
            console.error('Error in UIManager initialization:', error);
            return false;
        }
    },
    
    /**
     * Initialize core application components with error handling
     */
    initCoreComponents() {
        try {
            // Initialize data first
            if (!this.componentStates.data) {
                if (!DataManager || typeof DataManager.init !== 'function') {
                    throw new Error('DataManager not available');
                }
                
                const dataInitSuccess = DataManager.init();
                if (!dataInitSuccess) {
                    throw new Error('Failed to initialize DataManager');
                }
                
                this.componentStates.data = true;
            }
            
            // Initialize UI components
            this.initTabNavigation();
            this.loadThemeCSS();
            this.ensureImageAssets();
            
            // Hide loading screen when app is ready
            this.hideLoadingScreen();
            
            // Initial data rendering
            this.refreshAllData();
            
            this.componentStates.ui = true;
            
            console.log('Core components initialized successfully');
        } catch (error) {
            console.error('Error initializing core components:', error);
            
            // Try to recover by using default data
            if (!this.componentStates.data && DataManager) {
                console.log('Attempting recovery with default data...');
                DataManager.init(true); // Force reset to defaults
                this.componentStates.data = true;
                
                // Complete initialization with default data
                this.initTabNavigation();
                this.loadThemeCSS();
                this.ensureImageAssets();
                this.hideLoadingScreen();
                this.refreshAllData();
                
                this.componentStates.ui = true;
                
                // Show recovery message to user
                this.showToast('Application recovered with default data', 'info');
            } else {
                // Critical failure
                this.showFatalError('Failed to initialize application components. Please refresh the page.');
            }
        }
    },
    
    /**
     * Set up application event listeners
     */
    initEventListeners() {
        try {
            // Set up resize handler for responsive adjustments
            window.addEventListener('resize', Utils.throttle(this.handleResize.bind(this), 150));
            this.handleResize();
            
            // Listen for online/offline events
            window.addEventListener('online', () => {
                this.showToast('Back online', 'success');
            });
            
            window.addEventListener('offline', () => {
                this.showToast('You are offline. Data will be saved locally.', 'info');
            });
            
            // Listen for storage events (for multi-tab support)
            window.addEventListener('storage', (event) => {
                if (event.key === 'olympusBank') {
                    this.refreshAllData();
                }
            });
            
            // Set up unload warning
            window.addEventListener('beforeunload', (event) => {
                // Check if there are any unsaved changes
                if (DataManager && DataManager.hasUnsavedChanges && DataManager.hasUnsavedChanges()) {
                    const message = 'You have unsaved changes. Are you sure you want to leave?';
                    event.returnValue = message;
                    return message;
                }
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    },
    
    /**
     * Initialize authentication handlers
     */
    initAuth() {
        try {
            if (!AuthManager || typeof AuthManager.init !== 'function') {
                console.error('AuthManager not available');
                return false;
            }
            
            // Initialize AuthManager
            AuthManager.init();
            
            // Restore previous auth state if it exists in localStorage
            const savedAuthState = localStorage.getItem('olympusBankAuthState');
            if (savedAuthState) {
                try {
                    const authState = JSON.parse(savedAuthState);
                    if (authState && authState.currentUser) {
                        AuthManager.currentUser = authState.currentUser;
                        console.log('Auth state restored:', AuthManager.currentUser);
                    }
                } catch (parseError) {
                    console.error('Error parsing saved auth state:', parseError);
                }
            }
            
            this.componentStates.auth = true;
            return true;
        } catch (error) {
            console.error('Error initializing authentication:', error);
            return false;
        }
    },
    
    /**
     * Show fatal error message when application can't recover
     * @param {string} message - Error message to display
     */
    showFatalError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            // Transform loading screen into error message
            const loader = loadingScreen.querySelector('.olympus-loader');
            if (loader) loader.style.display = 'none';
            
            const loadingContainer = loadingScreen.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.innerHTML = `
                    <div style="color: #d32f2f; font-size: 1.2rem; margin-bottom: 1rem;">
                        <strong>Error</strong>
                    </div>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; 
                    background-color: #3949ab; color: white; border: none; cursor: pointer; border-radius: 4px;">
                        Refresh Page
                    </button>
                `;
            }
        } else {
            // Create error message if loading screen doesn't exist
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.width = '100%';
            errorDiv.style.height = '100%';
            errorDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            errorDiv.style.display = 'flex';
            errorDiv.style.flexDirection = 'column';
            errorDiv.style.alignItems = 'center';
            errorDiv.style.justifyContent = 'center';
            errorDiv.style.zIndex = '9999';
            
            errorDiv.innerHTML = `
                <div style="background-color: white; padding: 2rem; border-radius: 8px; 
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); max-width: 90%; width: 400px; text-align: center;">
                    <div style="color: #d32f2f; font-size: 1.2rem; margin-bottom: 1rem;">
                        <strong>Error</strong>
                    </div>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; 
                    background-color: #3949ab; color: white; border: none; cursor: pointer; border-radius: 4px;">
                        Refresh Page
                    </button>
                </div>
            `;
            
            document.body.appendChild(errorDiv);
        }
    },
    
    /**
     * Initialize tab navigation for dashboards
     */
    initTabNavigation() {
        try {
            // Parent dashboard tabs
            const parentNavButtons = document.querySelectorAll('#parent-dashboard .dashboard-nav button.tab-btn');
            parentNavButtons.forEach(button => {
                Utils.safeEventListener(button, 'click', () => {
                    const tabId = button.getAttribute('data-tab');
                    if (tabId) {
                        this.switchParentTab(tabId);
                    }
                });
            });
            
            // Child dashboard tabs
            const childNavButtons = document.querySelectorAll('#child-dashboard .dashboard-nav button.tab-btn');
            childNavButtons.forEach(button => {
                Utils.safeEventListener(button, 'click', () => {
                    const tabId = button.getAttribute('data-tab');
                    if (tabId) {
                        this.switchChildTab(tabId);
                    }
                });
            });
        } catch (error) {
            console.error('Error initializing tab navigation:', error);
        }
    },
    
    /**
     * Load theme-specific CSS based on user role
     */
    loadThemeCSS() {
        try {
            const head = document.head;
            
            // Load parent CSS if not already loaded
            if (!document.querySelector('link[href="css/parent.css"]')) {
                const parentCSS = document.createElement('link');
                parentCSS.rel = 'stylesheet';
                parentCSS.href = 'css/parent.css';
                head.appendChild(parentCSS);
            }
            
            // Load child CSS if not already loaded
            if (!document.querySelector('link[href="css/child.css"]')) {
                const childCSS = document.createElement('link');
                childCSS.rel = 'stylesheet';
                childCSS.href = 'css/child.css';
                head.appendChild(childCSS);
            }
        } catch (error) {
            console.error('Error loading theme CSS:', error);
            // Non-critical error, can continue without custom themes
        }
    },
    
    /**
     * Ensure image assets are created
     * In a real application, this would create directories and images
     * In this browser-based version, we'll use placeholders
     */
    ensureImageAssets() {
        // This would normally create or check for required images
        // For this demo, we'll use emoji and CSS instead of actual image files
    },
    
    /**
     * Handles hiding the loading screen when application is ready
     */
    hideLoadingScreen() {
        try {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    if (loadingScreen && loadingScreen.parentNode) {
                        loadingScreen.style.display = 'none';
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error hiding loading screen:', error);
            // Non-critical error, can continue with visible loading screen
        }
    },
    
    /**
     * Handle window resize for responsive adjustments
     */
    handleResize() {
        try {
            const isMobile = window.innerWidth < 768;
            document.body.classList.toggle('mobile-view', isMobile);
            
            // Add any additional responsive adjustments here
        } catch (error) {
            console.error('Error handling resize:', error);
        }
    },
    
    /**
     * Switch to specified parent dashboard tab
     * @param {string} tabId - ID of the tab to switch to
     */
    switchParentTab(tabId) {
        try {
            if (window.PerfMonitor) {
                PerfMonitor.trackInteraction('switchParentTab');
            }
            
            // Prevent errors from invalid tabId
            if (!tabId) return;
            
            // Remove active class from all tab buttons
            document.querySelectorAll('#parent-dashboard .dashboard-nav button.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected tab button
            const tabButton = document.querySelector(`#parent-dashboard .dashboard-nav button.tab-btn[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.classList.add('active');
            }
            
            // Hide all tab content
            document.querySelectorAll('#parent-dashboard .dashboard-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            const tabContentId = `${tabId}-tab`;
            const tabContent = document.getElementById(tabContentId);
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.warn(`Tab content not found: ${tabContentId}`);
            }
        } catch (error) {
            console.error('Error switching parent tab:', error, { tabId });
        }
    },
    
    /**
     * Switch to specified child dashboard tab
     * @param {string} tabId - ID of the tab to switch to
     */
    switchChildTab(tabId) {
        try {
            if (window.PerfMonitor) {
                PerfMonitor.trackInteraction('switchChildTab');
            }
            
            // Prevent errors from invalid tabId
            if (!tabId) return;
            
            // Remove active class from all tab buttons
            document.querySelectorAll('#child-dashboard .dashboard-nav button.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected tab button
            const tabButton = document.querySelector(`#child-dashboard .dashboard-nav button.tab-btn[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.classList.add('active');
            }
            
            // Hide all tab content
            document.querySelectorAll('#child-dashboard .dashboard-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            const tabContentId = `${tabId}-tab`;
            const tabContent = document.getElementById(tabContentId);
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.warn(`Tab content not found: ${tabContentId}`);
            }
        } catch (error) {
            console.error('Error switching child tab:', error, { tabId });
        }
    },
    
    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', or 'info')
     */
    showToast(message, type = 'info') {
        try {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            // Add to container
            container.appendChild(toast);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    },
    
    /**
     * Update balance displays
     */
    updateBalanceDisplays() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('updateBalanceDisplays', () => {
                    const balance = DataManager.getBalance();
                    const formattedBalance = balance.toFixed(2);
                    
                    // Update parent display
                    const parentDisplay = document.getElementById('parent-balance-display');
                    if (parentDisplay) {
                        parentDisplay.textContent = formattedBalance;
                    }
                    
                    // Update child display
                    const childDisplay = document.getElementById('child-balance-display');
                    if (childDisplay) {
                        childDisplay.textContent = formattedBalance;
                    }
                    
                    return true;
                });
            } else {
                const balance = DataManager.getBalance();
                const formattedBalance = balance.toFixed(2);
                
                // Update parent display
                const parentDisplay = document.getElementById('parent-balance-display');
                if (parentDisplay) {
                    parentDisplay.textContent = formattedBalance;
                }
                
                // Update child display
                const childDisplay = document.getElementById('child-balance-display');
                if (childDisplay) {
                    childDisplay.textContent = formattedBalance;
                }
            }
        } catch (error) {
            console.error('Error updating balance displays:', error);
        }
    },
    
    /**
     * Render transaction history for both parent and child views
     */
    renderTransactions() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('renderTransactions', () => this._renderTransactionsImpl());
            } else {
                return this._renderTransactionsImpl();
            }
        } catch (error) {
            console.error('Error rendering transactions:', error);
        }
    },
    
    /**
     * Implementation of transaction rendering logic
     * @private
     */
    _renderTransactionsImpl() {
        try {
            console.log('Rendering transactions...');
            
            const transactions = DataManager.getTransactions();
            console.log('All transactions from DataManager:', transactions);
            
            // Parent transaction list (showing recent 5)
            const parentTransactionList = document.getElementById('parent-transaction-list');
            if (parentTransactionList) {
                parentTransactionList.innerHTML = '';
                
                if (!transactions || transactions.length === 0) {
                    parentTransactionList.innerHTML = '<div class="empty-state">No transactions yet.</div>';
                    console.log('No transactions to display in parent view');
                } else {
                    // Show only the 5 most recent transactions in parent view
                    const recentTransactions = transactions.slice(0, 5);
                    console.log('Recent transactions for parent view:', recentTransactions);
                    
                    recentTransactions.forEach(transaction => {
                        if (TransactionManager && typeof TransactionManager.createTransactionElement === 'function') {
                            const element = TransactionManager.createTransactionElement(transaction);
                            if (element) {
                                parentTransactionList.appendChild(element);
                            }
                        }
                    });
                    
                    // If no elements were appended, show empty state
                    if (!parentTransactionList.hasChildNodes()) {
                        parentTransactionList.innerHTML = '<div class="empty-state">No transactions yet.</div>';
                    }
                }
            }
            
            // Child recent transaction list (showing recent 3)
            const childRecentTransactions = document.getElementById('child-recent-transactions');
            if (childRecentTransactions) {
                childRecentTransactions.innerHTML = '';
                
                if (!transactions || transactions.length === 0) {
                    childRecentTransactions.innerHTML = '<div class="empty-state">No divine activities yet.</div>';
                } else {
                    // Show only the 3 most recent transactions in child dashboard
                    const recentTransactions = transactions.slice(0, 3);
                    recentTransactions.forEach(transaction => {
                        if (TransactionManager && typeof TransactionManager.createTransactionElement === 'function') {
                            const element = TransactionManager.createTransactionElement(transaction);
                            if (element) {
                                childRecentTransactions.appendChild(element);
                            }
                        }
                    });
                    
                    // If no elements were appended, show empty state
                    if (!childRecentTransactions.hasChildNodes()) {
                        childRecentTransactions.innerHTML = '<div class="empty-state">No divine activities yet.</div>';
                    }
                }
            }
            
            // Child transaction history (all transactions with filtering)
            const childTransactionHistory = document.getElementById('child-transaction-history');
            if (childTransactionHistory) {
                childTransactionHistory.innerHTML = '';
                
                if (!transactions || transactions.length === 0) {
                    childTransactionHistory.innerHTML = '<div class="empty-state">No transaction history yet.</div>';
                } else {
                    transactions.forEach(transaction => {
                        if (TransactionManager && typeof TransactionManager.createTransactionElement === 'function') {
                            const element = TransactionManager.createTransactionElement(transaction);
                            if (element) {
                                childTransactionHistory.appendChild(element);
                            }
                        }
                    });
                    
                    // If no elements were appended, show empty state
                    if (!childTransactionHistory.hasChildNodes()) {
                        childTransactionHistory.innerHTML = '<div class="empty-state">No transaction history yet.</div>';
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error in _renderTransactionsImpl:', error);
            return false;
        }
    },
    
    /**
     * Render pending transactions that need approval (parent view)
     */
    renderPendingTransactions() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('renderPendingTransactions', () => this._renderPendingTransactionsImpl());
            } else {
                return this._renderPendingTransactionsImpl();
            }
        } catch (error) {
            console.error('Error rendering pending transactions:', error);
        }
    },
    
    /**
     * Implementation of pending transaction rendering logic
     * @private
     */
    _renderPendingTransactionsImpl() {
        // Check for required components
        if (!DataManager || !Utils) {
            console.error('Required components missing for rendering pending transactions');
            return false;
        }
        
        const pendingTransactions = DataManager.getPendingTransactions();
        const pendingTransactionsList = document.getElementById('pending-transaction-list');
        
        // Clear current list
        if (!pendingTransactionsList) {
            console.warn('Pending transactions list element not found');
            return false;
        }
        
        pendingTransactionsList.innerHTML = '';
        
        if (!pendingTransactions || pendingTransactions.length === 0) {
            pendingTransactionsList.innerHTML = '<div class="empty-state">No pending transactions awaiting approval.</div>';
            return true;
        }
        
        // Create and append transaction elements
        pendingTransactions.forEach(transaction => {
            try {
                // Create transaction element
                const element = document.createElement('div');
                element.className = 'pending-transaction';
                
                // Determine transaction type for display
                const typeText = transaction.type === 'deposit' 
                    ? 'Deposit Request' 
                    : 'Withdrawal Request';
                
                // Format date safely
                let formattedDate = 'Unknown date';
                if (transaction.date) {
                    try {
                        const date = new Date(transaction.date);
                        formattedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    } catch (dateError) {
                        console.warn('Error formatting date:', dateError);
                    }
                }
                
                // Sanitize amount
                const amount = typeof transaction.amount === 'number' ? 
                    transaction.amount.toFixed(2) : '0.00';
                
                // Sanitize reason
                const reason = transaction.reason ? 
                    transaction.reason.replace(/[<>&"']/g, '') : 'No reason provided';
                
                // Set HTML content
                element.innerHTML = `
                    <div class="transaction-details">
                        <div class="transaction-title">${typeText}</div>
                        <div class="transaction-amount ${transaction.type === 'deposit' ? 'positive' : 'negative'}">
                            ${transaction.type === 'deposit' ? '+' : '-'}$${amount}
                        </div>
                        <div class="transaction-reason">"${reason}"</div>
                        <div class="transaction-date">Requested: ${formattedDate}</div>
                    </div>
                    <div class="approval-actions">
                        <button class="reject-btn" data-id="${transaction.id}">Reject</button>
                        <button class="approve-btn" data-id="${transaction.id}">Approve</button>
                    </div>
                `;
                
                // Add event listeners with proper error handling
                const approveBtn = element.querySelector('.approve-btn');
                if (approveBtn) {
                    Utils.safeEventListener(approveBtn, 'click', () => {
                        if (TransactionManager && typeof TransactionManager.approveTransaction === 'function') {
                            TransactionManager.approveTransaction(transaction.id);
                            this.refreshAllData();
                            this.showToast('Transaction approved!', 'success');
                        } else {
                            console.error('TransactionManager.approveTransaction is not available');
                            this.showToast('Could not approve transaction. Please try again.', 'error');
                        }
                    });
                }
                
                const rejectBtn = element.querySelector('.reject-btn');
                if (rejectBtn) {
                    Utils.safeEventListener(rejectBtn, 'click', () => {
                        if (TransactionManager && typeof TransactionManager.rejectTransaction === 'function') {
                            TransactionManager.rejectTransaction(transaction.id);
                            this.refreshAllData();
                            this.showToast('Transaction rejected', 'info');
                        } else {
                            console.error('TransactionManager.rejectTransaction is not available');
                            this.showToast('Could not reject transaction. Please try again.', 'error');
                        }
                    });
                }
                
                pendingTransactionsList.appendChild(element);
            } catch (transactionError) {
                console.error('Error rendering transaction:', transactionError, transaction);
            }
        });
        
        return true;
    },
    
    /**
     * Render chores for both parent and child views
     */
    renderChores() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('renderChores', () => this._renderChoresImpl());
            } else {
                return this._renderChoresImpl();
            }
        } catch (error) {
            console.error('Error rendering chores:', error);
        }
    },
    
    /**
     * Implementation of chore rendering logic
     * @private
     */
    _renderChoresImpl() {
        // Check if required components exist
        if (!DataManager || !ChoreManager) {
            console.error('Required components missing for rendering chores');
            return false;
        }
        
        const chores = DataManager.getChores();
        if (!chores) {
            console.error('Failed to get chores from DataManager');
            return false;
        }
        
        // Parent view - all chores
        const parentChoreList = document.getElementById('parent-chore-list');
        if (parentChoreList) parentChoreList.innerHTML = '';
        
        // Parent view - pending chores
        const pendingChoreList = document.getElementById('pending-chore-list');
        if (pendingChoreList) pendingChoreList.innerHTML = '';
        
        // Child view - assigned chores (not completed or pending)
        const childChoreList = document.getElementById('child-chore-list');
        if (childChoreList) childChoreList.innerHTML = '';
        
        // Child view - pending chores (waiting approval)
        const childPendingChores = document.getElementById('child-pending-chores');
        if (childPendingChores) childPendingChores.innerHTML = '';
        
        // Child view - completed chores
        const childCompletedChores = document.getElementById('child-completed-chores');
        if (childCompletedChores) childCompletedChores.innerHTML = '';
        
        if (chores.length === 0) {
            if (parentChoreList) parentChoreList.innerHTML = '<div class="empty-state">No labors assigned yet.</div>';
            if (childChoreList) childChoreList.innerHTML = '<div class="empty-state">No labors assigned yet.</div>';
        } else {
            // Filter and render chores for each list
            chores.forEach(chore => {
                try {
                    // Parent view - all chores that aren't pending
                    if (!chore.pending && parentChoreList) {
                        const element = ChoreManager.createParentChoreElement(chore);
                        if (element) parentChoreList.appendChild(element);
                    }
                    
                    // Parent view - pending chores
                    if (chore.pending && pendingChoreList) {
                        const element = ChoreManager.createParentChoreElement(chore);
                        if (element) pendingChoreList.appendChild(element);
                    }
                    
                    // Child view - assigned chores (not completed or pending)
                    if (!chore.completed && !chore.pending && childChoreList) {
                        const element = ChoreManager.createChildChoreElement(chore, 'assigned');
                        if (element) childChoreList.appendChild(element);
                    }
                    
                    // Child view - pending chores
                    if (chore.pending && childPendingChores) {
                        const element = ChoreManager.createChildChoreElement(chore, 'pending');
                        if (element) childPendingChores.appendChild(element);
                    }
                    
                    // Child view - completed chores
                    if (chore.completed && childCompletedChores) {
                        const element = ChoreManager.createChildChoreElement(chore, 'completed');
                        if (element) childCompletedChores.appendChild(element);
                    }
                } catch (choreError) {
                    console.error('Error rendering chore:', choreError, chore);
                }
            });
            
            // Show empty state if no chores in particular list
            if (pendingChoreList && !pendingChoreList.hasChildNodes()) {
                pendingChoreList.innerHTML = '<div class="empty-state">No labors awaiting approval.</div>';
            }
            
            if (childChoreList && !childChoreList.hasChildNodes()) {
                childChoreList.innerHTML = '<div class="empty-state">No labors assigned.</div>';
            }
            
            if (childPendingChores && !childPendingChores.hasChildNodes()) {
                childPendingChores.innerHTML = '<div class="empty-state">No labors pending approval.</div>';
            }
            
            if (childCompletedChores && !childCompletedChores.hasChildNodes()) {
                childCompletedChores.innerHTML = '<div class="empty-state">No completed labors.</div>';
            }
        }
        
        return true;
    },
    
    /**
     * Render savings goals for both parent and child views
     */
    renderGoals() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('renderGoals', () => this._renderGoalsImpl());
            } else {
                return this._renderGoalsImpl();
            }
        } catch (error) {
            console.error('Error rendering goals:', error);
        }
    },
    
    /**
     * Implementation of goals rendering logic
     * @private
     */
    _renderGoalsImpl() {
        // Check if required components exist
        if (!DataManager || !GoalsManager) {
            console.error('Required components missing for rendering goals');
            return false;
        }
        
        const goals = DataManager.getGoals();
        if (!goals) {
            console.error('Failed to get goals from DataManager');
            return false;
        }
        
        // Parent view
        const parentGoalsContainer = document.getElementById('parent-goals-container');
        if (parentGoalsContainer) parentGoalsContainer.innerHTML = '';
        
        // Child view
        const childGoalsContainer = document.getElementById('child-goals-container');
        if (childGoalsContainer) childGoalsContainer.innerHTML = '';
        
        if (goals.length === 0) {
            if (parentGoalsContainer) {
                parentGoalsContainer.innerHTML = '<div class="empty-state">No quests have been started yet.</div>';
            }
            if (childGoalsContainer) {
                childGoalsContainer.innerHTML = '<div class="empty-state">You haven\'t started any quests yet. Click "Begin New Quest" to start saving for something special!</div>';
            }
        } else {
            // Render each goal
            goals.forEach(goal => {
                try {
                    // Parent view (read-only)
                    if (parentGoalsContainer) {
                        const element = GoalsManager.createGoalElement(goal, true);
                        if (element) parentGoalsContainer.appendChild(element);
                    }
                    
                    // Child view (interactive)
                    if (childGoalsContainer) {
                        const element = GoalsManager.createGoalElement(goal, false);
                        if (element) childGoalsContainer.appendChild(element);
                    }
                } catch (goalError) {
                    console.error('Error rendering goal:', goalError, goal);
                }
            });
        }
        
        return true;
    },
    
    /**
     * Refresh all UI data displays
     */
    refreshAllData() {
        try {
            // Only refresh data if we're logged in
            if (!AuthManager || (!AuthManager.isParent() && !AuthManager.isChild())) {
                console.log('Not refreshing data - no user logged in');
                return;
            }
            
            this.updateBalanceDisplays();
            this.renderTransactions();
            this.renderPendingTransactions();
            this.renderChores();
            this.renderGoals();
            this.renderUnifiedApprovals();
        } catch (error) {
            console.error('Error refreshing all data:', error);
            this.showToast('Could not refresh all data. Some information may be out of date.', 'error');
        }
    },

    /**
     * Show modal for chore completion quantity
     * @param {string} choreId - ID of the chore being completed
     */
    showChoreCompletionModal(choreId) {
        try {
            // Find the chore
            const chore = DataManager.getChores().find(c => c.id === choreId);
            if (!chore) {
                this.showToast('Chore not found!', 'error');
                return;
            }
            
            // Create modal if it doesn't exist
            let modal = document.getElementById('chore-completion-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'chore-completion-modal';
                modal.className = 'modal';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                
                modalContent.innerHTML = `
                    <h3>Complete Labor</h3>
                    <form id="chore-completion-form">
                        <input type="hidden" id="completing-chore-id">
                        <div class="form-group">
                            <label for="chore-event-count">How many times did you complete this labor?</label>
                            <input type="number" id="chore-event-count" min="1" value="1" required>
                        </div>
                        <div class="modal-buttons">
                            <button type="button" id="cancel-completion-btn">Cancel</button>
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                `;
                
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                
                // Set up event listeners
                const completionForm = document.getElementById('chore-completion-form');
                if (completionForm) {
                    completionForm.addEventListener('submit', (event) => {
                        event.preventDefault();
                        const completingChoreId = document.getElementById('completing-chore-id').value;
                        const eventCount = parseInt(document.getElementById('chore-event-count').value, 10);
                        
                        if (ChoreManager && typeof ChoreManager.submitChoreCompletion === 'function') {
                            ChoreManager.submitChoreCompletion(completingChoreId, eventCount);
                            this.hideChoreCompletionModal();
                        } else {
                            console.error('ChoreManager.submitChoreCompletion is not available');
                            this.showToast('Could not submit completion. Please try again.', 'error');
                        }
                    });
                }
                
                const cancelBtn = document.getElementById('cancel-completion-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        this.hideChoreCompletionModal();
                    });
                }
            }
            
            // Set the chore ID in the form
            const choreIdInput = document.getElementById('completing-chore-id');
            if (choreIdInput) {
                choreIdInput.value = choreId;
            }
            
            // Reset the event count to 1
            const eventCountInput = document.getElementById('chore-event-count');
            if (eventCountInput) {
                eventCountInput.value = 1;
            }
            
            // Show the modal
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Error showing chore completion modal:', error);
            this.showToast('Could not open completion form. Please try again.', 'error');
        }
    },

    /**
     * Hide chore completion modal
     */
    hideChoreCompletionModal() {
        const modal = document.getElementById('chore-completion-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Render unified pending approvals (both transactions and chores)
     */
    renderUnifiedApprovals() {
        try {
            if (window.PerfMonitor) {
                return PerfMonitor.trackComponentRender('renderUnifiedApprovals', () => this._renderUnifiedApprovalsImpl());
            } else {
                return this._renderUnifiedApprovalsImpl();
            }
        } catch (error) {
            console.error('Error rendering unified approvals:', error);
        }
    },

    /**
     * Implementation of unified approvals rendering logic
     * @private
     */
    _renderUnifiedApprovalsImpl() {
        // Check for required components
        if (!DataManager) {
            console.error('Required components missing for rendering unified approvals');
            return false;
        }
        
        // Get all pending approvals (transactions and chores)
        const pendingApprovals = DataManager.getAllPendingApprovals();
        
        // Find container elements
        const pendingTransactionsList = document.getElementById('pending-transaction-list');
        const pendingChoreList = document.getElementById('pending-chore-list');
        const unifiedApprovalsList = document.getElementById('unified-approvals-list');
        
        // Clear all lists
        if (pendingTransactionsList) pendingTransactionsList.innerHTML = '';
        if (pendingChoreList) pendingChoreList.innerHTML = '';
        if (unifiedApprovalsList) unifiedApprovalsList.innerHTML = '';
        
        // If no pendingApprovals, show empty message
        if (!pendingApprovals || pendingApprovals.length === 0) {
            const emptyMessage = '<div class="empty-state">No pending requests awaiting approval.</div>';
            
            if (pendingTransactionsList) pendingTransactionsList.innerHTML = emptyMessage;
            if (pendingChoreList) pendingChoreList.innerHTML = emptyMessage;
            if (unifiedApprovalsList) unifiedApprovalsList.innerHTML = emptyMessage;
            
            return true;
        }
        
        // Process each pending approval
        pendingApprovals.forEach(approval => {
            try {
                let element;
                
                // Create element based on approval type
                if (approval.approvalType === 'transaction') {
                    element = this._createTransactionApprovalElement(approval);
                } else if (approval.approvalType === 'chore') {
                    element = this._createChoreApprovalElement(approval);
                } else {
                    console.warn(`Unknown approval type: ${approval.approvalType}`);
                    return; // Skip this iteration
                }
                
                if (!element) return; // Skip if no element was created
                
                // Add to unified list if available
                if (unifiedApprovalsList) {
                    unifiedApprovalsList.appendChild(element.cloneNode(true));
                }
                
                // Add to the specific list as well for backward compatibility
                if (approval.approvalType === 'transaction' && pendingTransactionsList) {
                    pendingTransactionsList.appendChild(element);
                } else if (approval.approvalType === 'chore' && pendingChoreList) {
                    pendingChoreList.appendChild(element);
                }
            } catch (approvalError) {
                console.error('Error rendering approval:', approvalError, approval);
            }
        });
        
        // Add event listeners to all approval elements
        this._addApprovalEventListeners(unifiedApprovalsList);
        this._addApprovalEventListeners(pendingTransactionsList);
        this._addApprovalEventListeners(pendingChoreList);
        
        return true;
    },

    /**
     * Create transaction approval element
     * @param {Object} transaction - Transaction object
     * @returns {HTMLElement} Transaction approval element
     * @private
     */
    _createTransactionApprovalElement(transaction) {
        try {
            console.log('Creating transaction approval element for:', transaction);
            
            const element = document.createElement('div');
            element.className = 'approval-item transaction-approval';
            element.dataset.id = transaction.id;
            element.dataset.type = 'transaction';
            
            // Format data for display
            const typeText = transaction.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request';
            const amount = parseFloat(transaction.amount).toFixed(2);
            const reason = transaction.reason || 'No reason provided';
            const formattedDate = Utils.formatDate(transaction.date) || 'Unknown date';
            
            console.log('Formatted transaction data:', { typeText, amount, reason, formattedDate });
            
            // Set HTML content
            element.innerHTML = `
                <div class="approval-details">
                    <div class="approval-title">${typeText}</div>
                    <div class="approval-amount ${transaction.type === 'deposit' ? 'positive' : 'negative'}">
                        ${transaction.type === 'deposit' ? '+' : '-'}$${amount}
                    </div>
                    <div class="approval-reason">"${reason}"</div>
                    <div class="approval-date">Requested: ${formattedDate}</div>
                </div>
                <div class="approval-actions">
                    <button class="reject-btn" data-id="${transaction.id}" data-type="transaction">Reject</button>
                    <button class="approve-btn" data-id="${transaction.id}" data-type="transaction">Approve</button>
                </div>
            `;
            
            return element;
        } catch (error) {
            console.error('Error creating transaction approval element:', error, transaction);
            return null;
        }
    },

    /**
     * Create chore approval element
     * @param {Object} chore - Chore object
     * @returns {HTMLElement} Chore approval element
     * @private
     */
    _createChoreApprovalElement(chore) {
        try {
            const element = document.createElement('div');
            element.className = 'approval-item chore-approval';
            element.dataset.id = chore.id;
            element.dataset.type = 'chore';
            
            // Format data for display
            const eventCount = chore.eventCount || 1;
            const totalValue = (parseFloat(chore.value) * eventCount).toFixed(2);
            const formattedDate = Utils.formatDate(chore.date) || 'Unknown date';
            
            // Set HTML content
            element.innerHTML = `
                <div class="approval-details">
                    <div class="approval-title">Labor Completion${eventCount > 1 ? ` (x${eventCount})` : ''}</div>
                    <div class="approval-chore-name">${chore.name}</div>
                    <div class="approval-amount positive">+$${totalValue}</div>
                    <div class="approval-date">Completed: ${formattedDate}</div>
                </div>
                <div class="approval-actions">
                    <button class="reject-btn" data-id="${chore.id}" data-type="chore">Reject</button>
                    <button class="approve-btn" data-id="${chore.id}" data-type="chore">Approve</button>
                </div>
            `;
            
            return element;
        } catch (error) {
            console.error('Error creating chore approval element:', error);
            return null;
        }
    },

    /**
     * Add event listeners to approval elements
     * @param {HTMLElement} container - Container element
     * @private
     */
    _addApprovalEventListeners(container) {
        if (!container) return;
        
        console.log('Adding approval event listeners to container:', container.id);
        
        // Find all approve buttons
        const approveButtons = container.querySelectorAll('.approve-btn');
        console.log(`Found ${approveButtons.length} approve buttons`);
        
        approveButtons.forEach(button => {
            const id = button.dataset.id;
            const type = button.dataset.type;
            console.log(`Setting up approve listener for: ${type} id=${id}`);
            
            Utils.safeEventListener(button, 'click', () => {
                if (!id || !type) {
                    console.error('Missing ID or type for approval button');
                    return;
                }
                
                if (type === 'transaction') {
                    if (TransactionManager && typeof TransactionManager.approveTransaction === 'function') {
                        TransactionManager.approveTransaction(id);
                    } else {
                        console.error('TransactionManager.approveTransaction is not available');
                        this.showToast('Could not approve transaction. Please try again.', 'error');
                    }
                } else if (type === 'chore') {
                    if (ChoreManager && typeof ChoreManager.approveChore === 'function') {
                        ChoreManager.approveChore(id);
                    } else {
                        console.error('ChoreManager.approveChore is not available');
                        this.showToast('Could not approve labor. Please try again.', 'error');
                    }
                }
            });
        });
        
        // Find all reject buttons
        const rejectButtons = container.querySelectorAll('.reject-btn');
        console.log(`Found ${rejectButtons.length} reject buttons`);
        
        rejectButtons.forEach(button => {
            const id = button.dataset.id;
            const type = button.dataset.type;
            console.log(`Setting up reject listener for: ${type} id=${id}`);
            
            Utils.safeEventListener(button, 'click', () => {
                if (!id || !type) {
                    console.error('Missing ID or type for reject button');
                    return;
                }
                
                if (type === 'transaction') {
                    if (TransactionManager && typeof TransactionManager.rejectTransaction === 'function') {
                        TransactionManager.rejectTransaction(id);
                    } else {
                        console.error('TransactionManager.rejectTransaction is not available');
                        this.showToast('Could not reject transaction. Please try again.', 'error');
                    }
                } else if (type === 'chore') {
                    if (ChoreManager && typeof ChoreManager.rejectChore === 'function') {
                        ChoreManager.rejectChore(id);
                    } else {
                        console.error('ChoreManager.rejectChore is not available');
                        this.showToast('Could not reject labor. Please try again.', 'error');
                    }
                }
            });
        });
    }
};

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for required components
        if (!UIManager || !DataManager) {
            throw new Error('Required application components not found');
        }
        
        // Initialize the application
        UIManager.init();
        
        // Log initialization success if in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Family Mount Olympus Bank initialized successfully');
        }
    } catch (error) {
        console.error('Fatal error during application initialization:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.width = '100%';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '9999';
        errorDiv.textContent = 'Failed to initialize application. Please refresh the page.';
        
        document.body.appendChild(errorDiv);
    }
}); 