// utils.js ---
// Utility functions for Family Mount Olympus Bank

const Utils = {
    /**
     * Format currency value with $ symbol and fixed to 2 decimal places
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '$0.00';
        }
        return '$' + amount.toFixed(2);
    },
    
    /**
     * Format date to a readable string
     * @param {Date|string} date - Date object or date string
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    },
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID string
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    /**
     * Safely parse JSON with error handling
     * @param {string} jsonString - JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @returns {*} Parsed object or fallback value
     */
    safeJsonParse(jsonString, fallback = {}) {
        if (!jsonString) return fallback;
        
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return fallback;
        }
    },
    
    /**
     * Safely stringify to JSON with error handling
     * @param {*} data - Data to stringify
     * @returns {string} JSON string or empty string if error
     */
    safeJsonStringify(data) {
        try {
            return JSON.stringify(data);
        } catch (error) {
            console.error('Error stringifying to JSON:', error);
            return '';
        }
    },
    
    /**
     * Validate transaction data
     * @param {object} transaction - Transaction data to validate
     * @returns {object} Validation result {valid: boolean, errors: array}
     */
    validateTransaction(transaction) {
        const errors = [];
        
        console.log('Validating transaction:', transaction);
        
        if (!transaction) {
            return { valid: false, errors: ['Transaction is required'] };
        }
        
        if (!transaction.type || !['deposit', 'withdrawal', 'chore', 'goal', 'interest'].includes(transaction.type)) {
            errors.push('Invalid transaction type');
        }
        
        if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
            errors.push('Amount must be a positive number');
        }
        
        // For deposit and withdrawal types, ensure they have a reason
        if ((transaction.type === 'deposit' || transaction.type === 'withdrawal') && !transaction.reason) {
            errors.push('Reason is required for deposit and withdrawal transactions');
        }
        
        // Auto-generate description if missing
        if (!transaction.description) {
            if (transaction.type === 'deposit') {
                transaction.description = `Deposit: ${transaction.reason || 'No reason provided'}`;
            } else if (transaction.type === 'withdrawal') {
                transaction.description = `Withdrawal: ${transaction.reason || 'No reason provided'}`;
            }
        }
        
        const result = {
            valid: errors.length === 0,
            errors
        };
        
        console.log('Transaction validation result:', result);
        return result;
    },
    
    /**
     * Validate chore data
     * @param {object} chore - Chore data to validate
     * @returns {object} Validation result {valid: boolean, errors: array}
     */
    validateChore(chore) {
        const errors = [];
        
        if (!chore) {
            return { valid: false, errors: ['Chore is required'] };
        }
        
        if (!chore.name || chore.name.trim() === '') {
            errors.push('Chore name is required');
        }
        
        if (typeof chore.value !== 'number' || chore.value <= 0) {
            errors.push('Value must be a positive number');
        }
        
        if (!chore.frequency || !['occurrence', 'day', 'week'].includes(chore.frequency)) {
            errors.push('Invalid frequency');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Validate goal data
     * @param {object} goal - Goal data to validate
     * @returns {object} Validation result {valid: boolean, errors: array}
     */
    validateGoal(goal) {
        const errors = [];
        
        if (!goal) {
            return { valid: false, errors: ['Goal is required'] };
        }
        
        if (!goal.name || goal.name.trim() === '') {
            errors.push('Goal name is required');
        }
        
        if (typeof goal.targetAmount !== 'number' || goal.targetAmount <= 0) {
            errors.push('Target amount must be a positive number');
        }
        
        if (typeof goal.currentAmount !== 'number' || goal.currentAmount < 0) {
            errors.push('Current amount must be a non-negative number');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Show error message in form with validation errors
     * @param {string} formId - ID of the form
     * @param {array} errors - List of error messages
     */
    showFormErrors(formId, errors) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Clear any existing error messages
        const existingErrors = form.querySelector('.form-errors');
        if (existingErrors) {
            existingErrors.remove();
        }
        
        if (!errors || errors.length === 0) return;
        
        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'form-errors';
        errorContainer.style.color = '#d32f2f';
        errorContainer.style.marginBottom = '15px';
        errorContainer.style.padding = '10px';
        errorContainer.style.backgroundColor = '#ffebee';
        errorContainer.style.borderRadius = '4px';
        
        // Add error title
        const errorTitle = document.createElement('div');
        errorTitle.textContent = 'Please correct the following:';
        errorTitle.style.fontWeight = 'bold';
        errorTitle.style.marginBottom = '5px';
        errorContainer.appendChild(errorTitle);
        
        // Add error list
        const errorList = document.createElement('ul');
        errorList.style.paddingLeft = '20px';
        
        errors.forEach(error => {
            const errorItem = document.createElement('li');
            errorItem.textContent = error;
            errorList.appendChild(errorItem);
        });
        
        errorContainer.appendChild(errorList);
        
        // Add to form
        const firstChild = form.firstChild;
        form.insertBefore(errorContainer, firstChild);
    },
    
    /**
     * Debounce function to limit rate of execution
     * @param {function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Check if browser is in offline mode
     * @returns {boolean} True if browser is offline
     */
    isOffline() {
        return !navigator.onLine;
    },
    
    /**
     * Add event listener with automatic removal when element is destroyed
     * @param {HTMLElement} element - DOM element to attach listener to
     * @param {string} eventType - Event type (e.g., 'click')
     * @param {function} callback - Event handler function
     */
    safeEventListener(element, eventType, callback) {
        if (!element || !eventType || !callback) return;
        
        // Use WeakMap to avoid memory leaks
        if (!this._eventHandlers) {
            this._eventHandlers = new WeakMap();
        }
        
        // Store handlers for this element
        let handlers = this._eventHandlers.get(element);
        if (!handlers) {
            handlers = {};
            this._eventHandlers.set(element, handlers);
        }
        
        // Add handler
        element.addEventListener(eventType, callback);
        
        // Store reference to original handler
        if (!handlers[eventType]) {
            handlers[eventType] = [];
        }
        handlers[eventType].push(callback);
        
        // Return function to remove listener
        return () => {
            element.removeEventListener(eventType, callback);
            const index = handlers[eventType].indexOf(callback);
            if (index !== -1) {
                handlers[eventType].splice(index, 1);
            }
        };
    },
    
    /**
     * Create a throttled function that only invokes func at most once per wait period
     * @param {function} func - Function to throttle
     * @param {number} wait - Throttle period in milliseconds
     * @returns {function} Throttled function
     */
    throttle(func, wait = 300) {
        let inThrottle;
        let lastFunc;
        let lastTime;
        
        return function() {
            const context = this;
            const args = arguments;
            
            if (!inThrottle) {
                func.apply(context, args);
                lastTime = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if (Date.now() - lastTime >= wait) {
                        func.apply(context, args);
                        lastTime = Date.now();
                    }
                }, Math.max(wait - (Date.now() - lastTime), 0));
            }
        };
    }
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// Make the utilities globally available
window.Utils = Utils; 