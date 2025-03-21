/**
 * transactions.js
 * ---
 * Handles transaction management for Family Mount Olympus Bank
 */

// Transaction manager for the Family Mount Olympus Bank application
const TransactionManager = {
    /**
     * Initialize transaction handlers
     */
    init() {
        // Transaction request buttons (child side)
        document.getElementById('request-deposit-btn').addEventListener('click', () => {
            this.showTransactionModal('deposit');
        });
        
        document.getElementById('request-withdrawal-btn').addEventListener('click', () => {
            this.showTransactionModal('withdrawal');
        });
        
        // Transaction modal handlers
        document.getElementById('transaction-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTransactionRequest();
        });
        
        document.getElementById('cancel-transaction-btn').addEventListener('click', () => {
            this.hideTransactionModal();
        });
        
        // Transaction filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Apply filter
                this.filterTransactions(e.target.dataset.filter);
            });
        });
        
        // Balance update form (parent side)
        document.getElementById('reset-account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAccountBalance();
        });
        
        // Clear transactions button
        document.getElementById('clear-transactions-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
                this.clearTransactions();
            }
        });
        
        // Reset entire application button
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the entire application? This will delete ALL data including transactions, chores, and goals.')) {
                this.resetApplication();
            }
        });
    },
    
    /**
     * Show transaction request modal
     * @param {string} type - Type of transaction ('deposit' or 'withdrawal')
     */
    showTransactionModal(type) {
        const modal = document.getElementById('transaction-request-modal');
        const modalTitle = document.getElementById('transaction-modal-title');
        const transactionType = document.getElementById('transaction-type');
        
        // Set modal title based on transaction type
        if (type === 'deposit') {
            modalTitle.textContent = 'Request Funds from Zeus';
        } else {
            modalTitle.textContent = 'Request Withdrawal from Treasury';
        }
        
        // Set hidden transaction type field
        transactionType.value = type;
        
        // Clear form fields
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-reason').value = '';
        
        // Show modal
        modal.classList.add('active');
        
        // Focus amount field
        document.getElementById('transaction-amount').focus();
    },
    
    /**
     * Hide transaction request modal
     */
    hideTransactionModal() {
        const modal = document.getElementById('transaction-request-modal');
        modal.classList.remove('active');
    },
    
    /**
     * Submit a transaction request (from child)
     */
    submitTransactionRequest() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const reason = document.getElementById('transaction-reason').value.trim();
        
        // Debug logs
        console.log('Transaction request:', { type, amount, reason });
        
        // Validate inputs
        if (isNaN(amount) || amount <= 0) {
            UIManager.showToast('Please enter a valid amount!', 'error');
            return;
        }
        
        if (reason === '') {
            UIManager.showToast('Please provide a reason for your request!', 'error');
            return;
        }
        
        // Create transaction object
        const transactionRequest = {
            type: type,
            amount: amount,
            reason: reason
        };
        
        console.log('Adding pending transaction:', transactionRequest);
        
        // Create pending transaction
        const success = DataManager.addPendingTransaction(transactionRequest);
        
        console.log('Add pending transaction result:', success);
        
        // Hide modal
        this.hideTransactionModal();
        
        // Show success message
        const message = type === 'deposit' 
            ? 'Your deposit request has been sent to Zeus for approval!'
            : 'Your withdrawal request has been sent to Zeus for approval!';
            
        UIManager.showToast(message, 'success');
        
        // Refresh pending transactions
        UIManager.renderUnifiedApprovals();
        
        // Debug: Check pending transactions after adding
        console.log('Pending transactions after adding:', DataManager.getPendingTransactions());
        console.log('All pending approvals:', DataManager.getAllPendingApprovals());
    },
    
    /**
     * Approve a pending transaction (from parent)
     * @param {string} transactionId - ID of the transaction to approve
     */
    approveTransaction(transactionId) {
        console.log('Approving transaction:', transactionId);
        
        if (!transactionId) {
            console.error('Transaction ID is missing');
            UIManager.showToast('Cannot approve transaction: ID is missing', 'error');
            return;
        }
        
        try {
            if (DataManager.approvePendingTransaction(transactionId)) {
                UIManager.showToast('Transaction approved by Zeus!', 'success');
                
                // Refresh UI
                UIManager.refreshAllData();
            } else {
                console.error('Failed to approve transaction:', transactionId);
                UIManager.showToast('Error approving transaction!', 'error');
            }
        } catch (error) {
            console.error('Error in approveTransaction:', error);
            UIManager.showToast('Error approving transaction!', 'error');
        }
    },
    
    /**
     * Reject a pending transaction (from parent)
     * @param {string} transactionId - ID of the transaction to reject
     */
    rejectTransaction(transactionId) {
        console.log('Rejecting transaction:', transactionId);
        
        if (!transactionId) {
            console.error('Transaction ID is missing');
            UIManager.showToast('Cannot reject transaction: ID is missing', 'error');
            return;
        }
        
        try {
            if (DataManager.rejectPendingTransaction(transactionId)) {
                UIManager.showToast('Transaction rejected by Zeus!', 'info');
                
                // Refresh unified approvals
                UIManager.renderUnifiedApprovals();
            } else {
                console.error('Failed to reject transaction:', transactionId);
                UIManager.showToast('Error rejecting transaction!', 'error');
            }
        } catch (error) {
            console.error('Error in rejectTransaction:', error);
            UIManager.showToast('Error rejecting transaction!', 'error');
        }
    },
    
    /**
     * Filter transactions by type
     * @param {string} filter - Filter type ('all', 'deposits', 'withdrawals', 'chores')
     */
    filterTransactions(filter) {
        const transactions = DataManager.getTransactions();
        const transactionList = document.getElementById('child-transaction-history');
        
        // Clear current list
        transactionList.innerHTML = '';
        
        // Filter transactions
        let filteredTransactions = transactions;
        if (filter === 'deposits') {
            filteredTransactions = transactions.filter(t => t.type === 'deposit');
        } else if (filter === 'withdrawals') {
            filteredTransactions = transactions.filter(t => t.type === 'withdrawal');
        } else if (filter === 'chores') {
            filteredTransactions = transactions.filter(t => t.type === 'chore');
        }
        
        // Render filtered transactions
        if (filteredTransactions.length === 0) {
            transactionList.innerHTML = '<div class="empty-state">No transactions found.</div>';
        } else {
            filteredTransactions.forEach(transaction => {
                transactionList.appendChild(this.createTransactionElement(transaction));
            });
        }
    },
    
    /**
     * Create a transaction element for display
     * @param {Object} transaction - Transaction object
     * @returns {HTMLElement} Transaction element
     */
    createTransactionElement(transaction) {
        const element = document.createElement('div');
        element.className = 'transaction-item';
        
        // Determine if amount is positive or negative
        const isPositive = transaction.type === 'deposit' || transaction.type === 'chore';
        const amountClass = isPositive ? 'positive' : 'negative';
        const amountPrefix = isPositive ? '+' : '-';
        
        // Format date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create transaction badge
        let badgeHTML = '';
        if (AuthManager.isChild()) {
            badgeHTML = `<span class="transaction-badge ${transaction.type}">${this.getTransactionTypeName(transaction.type)}</span>`;
        }
        
        // Set HTML content
        element.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-title">${transaction.description} ${badgeHTML}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountPrefix}$${Math.abs(transaction.amount).toFixed(2)}</div>
        `;
        
        return element;
    },
    
    /**
     * Get a user-friendly name for a transaction type
     * @param {string} type - Transaction type
     * @returns {string} User-friendly type name
     */
    getTransactionTypeName(type) {
        switch (type) {
            case 'deposit':
                return 'Deposit';
            case 'withdrawal':
                return 'Withdrawal';
            case 'chore':
                return 'Labor';
            case 'goal':
                return 'Quest';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    },
    
    /**
     * Update account balance (from parent settings)
     */
    updateAccountBalance() {
        const newBalanceInput = document.getElementById('reset-balance');
        const newBalance = parseFloat(newBalanceInput.value);
        
        // Validate input
        if (isNaN(newBalance) || newBalance < 0) {
            UIManager.showToast('Please enter a valid balance!', 'error');
            return;
        }
        
        // Update balance
        DataManager.updateBalance(newBalance);
        
        // Clear input
        newBalanceInput.value = '';
        
        UIManager.showToast('Zeus has updated the divine treasury!', 'success');
        
        // Refresh UI
        UIManager.refreshAllData();
    },
    
    /**
     * Clear all transaction history
     */
    clearTransactions() {
        const data = DataManager.getData();
        data.transactions = [];
        DataManager.saveData(data);
        
        UIManager.showToast('All transaction history has been cleared by Zeus!', 'info');
        
        // Refresh UI
        UIManager.refreshAllData();
    },
    
    /**
     * Reset entire application to default state
     */
    resetApplication() {
        DataManager.resetApplication();
        
        UIManager.showToast('The divine treasury has been reset to its original state!', 'info');
        
        // Return to login screen
        AuthManager.logoutUser();
    }
};

// Initialize transaction manager on load
document.addEventListener('DOMContentLoaded', () => {
    TransactionManager.init();
}); 