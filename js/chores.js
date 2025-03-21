/**
 * chores.js
 * ---
 * Handles chore management for Family Mount Olympus Bank
 */

// Chore manager for the Family Mount Olympus Bank application
const ChoreManager = {
    /**
     * Initialize chore functionality
     */
    init() {
        // Set up chore form submission
        const addChoreForm = document.getElementById('add-chore-form');
        if (addChoreForm) {
            addChoreForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.addChore();
            });
        }
        
        // Set up modal toggle
        const addChoreBtn = document.getElementById('add-chore-btn');
        const cancelAddChoreBtn = document.getElementById('cancel-add-chore-btn');
        const addChoreModal = document.getElementById('add-chore-modal');
        
        if (addChoreBtn && addChoreModal) {
            addChoreBtn.addEventListener('click', () => {
                addChoreModal.style.display = 'flex';
            });
        }
        
        if (cancelAddChoreBtn && addChoreModal) {
            cancelAddChoreBtn.addEventListener('click', () => {
                addChoreModal.style.display = 'none';
                document.getElementById('add-chore-form').reset();
            });
        }
    },
    
    /**
     * Get human-readable frequency text
     * @param {string} frequency - Frequency value
     * @returns {string} Human-readable frequency text
     */
    getFrequencyText(frequency) {
        switch (frequency) {
            case 'occurrence':
                return 'per occurrence';
            case 'day':
                return 'per day';
            case 'week':
                return 'per week';
            default:
                return '';
        }
    },
    
    /**
     * Add a new chore
     */
    addChore() {
        const name = document.getElementById('chore-name').value.trim();
        const value = parseFloat(document.getElementById('chore-value').value);
        const frequency = document.getElementById('chore-frequency').value;
        
        // Validate inputs
        if (name === '') {
            UIManager.showToast('Please enter a chore name!', 'error');
            return;
        }
        
        if (isNaN(value) || value <= 0) {
            UIManager.showToast('Please enter a valid reward value!', 'error');
            return;
        }
        
        // Add chore
        const newChore = {
            id: Utils.generateId(),
            name: name,
            value: value,
            frequency: frequency,
            completed: false,
            pending: false
        };
        
        if (DataManager.addChore(newChore)) {
            // Hide modal
            document.getElementById('add-chore-modal').style.display = 'none';
            
            // Reset form
            document.getElementById('add-chore-form').reset();
            
            // Show success message
            UIManager.showToast('New labor assigned to Hermes!', 'success');
            
            // Refresh chore lists
            UIManager.renderChores();
        } else {
            UIManager.showToast('Error adding new labor!', 'error');
        }
    },
    
    /**
     * Mark a chore as completed (from child)
     * @param {string} choreId - ID of the chore to mark complete
     */
    completeChore(choreId) {
        // Get the quantity of events completed
        UIManager.showChoreCompletionModal(choreId);
    },
    
    /**
     * Submit chore completion with event count
     * @param {string} choreId - ID of the chore
     * @param {number} eventCount - Number of events completed
     */
    submitChoreCompletion(choreId, eventCount) {
        if (!choreId || eventCount < 1) {
            UIManager.showToast('Please specify how many times you completed this labor!', 'error');
            return;
        }
        
        DataManager.completeChore(choreId, eventCount);
        UIManager.showToast('Labor completed! Awaiting Zeus\'s approval.', 'success');
        UIManager.renderChores();
        UIManager.renderUnifiedApprovals();
    },
    
    /**
     * Approve a completed chore (from parent)
     * @param {string} choreId - ID of the chore to approve
     */
    approveChore(choreId) {
        if (DataManager.approveChore(choreId)) {
            UIManager.showToast('Labor approved by Zeus! Payment sent to treasury.', 'success');
            
            // Refresh UI - DataManager will automatically reset the chore status
            UIManager.refreshAllData();
        } else {
            UIManager.showToast('Error approving labor!', 'error');
        }
    },
    
    /**
     * Reject a pending chore (from parent)
     * @param {string} choreId - ID of the chore to reject
     */
    rejectChore(choreId) {
        if (DataManager.rejectChore(choreId)) {
            UIManager.showToast('Labor rejected by Zeus!', 'info');
            
            // Refresh chore lists and approvals
            UIManager.renderChores();
            UIManager.renderUnifiedApprovals();
        } else {
            UIManager.showToast('Error rejecting labor!', 'error');
        }
    },
    
    /**
     * Delete a chore
     * @param {string} choreId - ID of the chore to delete
     */
    deleteChore(choreId) {
        if (DataManager.deleteChore(choreId)) {
            UIManager.showToast('Labor removed by Zeus!', 'success');
            
            // Refresh chore lists
            UIManager.renderChores();
        } else {
            UIManager.showToast('Error deleting labor!', 'error');
        }
    },
    
    /**
     * Reset a completed chore
     * @param {string} choreId - ID of the chore to reset
     */
    resetChore(choreId) {
        if (DataManager.resetChore(choreId)) {
            UIManager.showToast('Labor reset by Zeus!', 'success');
            
            // Refresh chore lists
            UIManager.renderChores();
        } else {
            UIManager.showToast('Error resetting labor!', 'error');
        }
    },
    
    /**
     * Create a chore element for the parent view
     * @param {Object} chore - Chore object
     * @returns {HTMLElement} Chore element
     */
    createParentChoreElement(chore) {
        const element = document.createElement('div');
        element.className = 'chore-item';
        
        // Add pending-approval class if needed
        if (chore.pending) {
            element.classList.add('pending-approval');
        }
        
        // Create status indicator for completed/pending chores
        let statusHTML = '';
        if (chore.completed) {
            statusHTML = '<span class="completed-label">Completed</span>';
        } else if (chore.pending) {
            const eventCount = chore.eventCount || 1;
            statusHTML = `<span class="pending-label">Pending Approval (x${eventCount})</span>`;
        }
        
        // Format value with frequency
        const frequencyText = this.getFrequencyText(chore.frequency);
        
        // Set HTML content
        element.innerHTML = `
            <div class="chore-details">
                <div class="chore-name">${chore.name} ${statusHTML}</div>
                <div class="chore-value">$${chore.value.toFixed(2)} <span class="chore-frequency">(${frequencyText})</span></div>
                ${chore.pending ? `<div class="chore-event-count">Events: ${chore.eventCount || 1}</div>` : ''}
            </div>
            <div class="chore-actions">
                ${chore.pending ? `
                    <button class="approve-btn" data-chore-id="${chore.id}">Approve</button>
                    <button class="reject-btn" data-chore-id="${chore.id}">Reject</button>
                ` : chore.completed ? `
                    <button class="reset-btn" data-chore-id="${chore.id}">Reset</button>
                ` : `
                    <button class="delete-btn" data-chore-id="${chore.id}">Delete</button>
                `}
            </div>
        `;
        
        // Add event listeners
        if (chore.pending) {
            element.querySelector('.approve-btn').addEventListener('click', () => {
                this.approveChore(chore.id);
            });
            
            element.querySelector('.reject-btn').addEventListener('click', () => {
                this.rejectChore(chore.id);
            });
        } else if (chore.completed) {
            element.querySelector('.reset-btn').addEventListener('click', () => {
                this.resetChore(chore.id);
            });
        } else {
            element.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteChore(chore.id);
            });
        }
        
        return element;
    },
    
    /**
     * Create a chore element for the child view
     * @param {Object} chore - Chore object
     * @param {string} listType - Type of list ('assigned', 'pending', 'completed')
     * @returns {HTMLElement} Chore element
     */
    createChildChoreElement(chore, listType) {
        const element = document.createElement('div');
        element.className = 'chore-item';
        
        // Format value with frequency
        const frequencyText = this.getFrequencyText(chore.frequency);
        
        // Display event count for pending chores
        const eventCountDisplay = chore.pending && chore.eventCount > 1 
            ? `<div class="chore-event-count">Events: ${chore.eventCount}</div>` 
            : '';
        
        // Set HTML content
        element.innerHTML = `
            <div class="chore-details">
                <div class="chore-name">${chore.name}</div>
                <div class="chore-value">$${chore.value.toFixed(2)} <span class="chore-frequency">(${frequencyText})</span></div>
                ${eventCountDisplay}
            </div>
            ${listType === 'assigned' ? `
                <div class="chore-actions">
                    <button class="complete-chore-btn" data-chore-id="${chore.id}">Complete</button>
                </div>
            ` : listType === 'pending' ? `
                <div class="chore-status">
                    <span class="pending-label">Waiting for Zeus</span>
                </div>
            ` : `
                <div class="chore-status">
                    <span class="completed-label">Completed</span>
                </div>
            `}
        `;
        
        // Add event listener for complete button
        if (listType === 'assigned') {
            element.querySelector('.complete-chore-btn').addEventListener('click', () => {
                this.completeChore(chore.id);
            });
        }
        
        return element;
    }
};

// Initialize chore manager on load
document.addEventListener('DOMContentLoaded', () => {
    ChoreManager.init();
}); 