/**
 * goals.js
 * ---
 * Handles savings goals management for Family Mount Olympus Bank
 */

// Goals manager for the Family Mount Olympus Bank application
const GoalsManager = {
    // Goal icons that will be available
    goalIcons: [
        { id: 'default', name: 'Treasure', emoji: '💰' },
        { id: 'toy', name: 'Toy', emoji: '🎮' },
        { id: 'book', name: 'Book', emoji: '📚' },
        { id: 'trip', name: 'Trip', emoji: '🚗' },
        { id: 'gift', name: 'Gift', emoji: '🎁' },
        { id: 'tech', name: 'Tech', emoji: '📱' },
        { id: 'clothes', name: 'Clothes', emoji: '👕' },
        { id: 'sports', name: 'Sports', emoji: '⚽' }
    ],
    
    /**
     * Initialize goals management handlers
     */
    init() {
        // Add goal button (child side)
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            this.showAddGoalModal();
        });
        
        // Add goal form
        document.getElementById('add-goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewGoal();
        });
        
        // Cancel add goal button
        document.getElementById('cancel-add-goal-btn').addEventListener('click', () => {
            this.hideAddGoalModal();
        });
    },
    
    /**
     * Show add goal modal
     */
    showAddGoalModal() {
        const modal = document.getElementById('add-goal-modal');
        modal.classList.add('active');
        
        // Clear form fields
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-amount').value = '';
        document.getElementById('selected-goal-icon').value = 'default';
        
        // Populate icon selections
        this.populateGoalIcons();
        
        // Focus name field
        document.getElementById('goal-name').focus();
    },
    
    /**
     * Populate goal icons in the selection container
     */
    populateGoalIcons() {
        const container = document.getElementById('goal-icons-selection');
        
        // Clear container
        container.innerHTML = '';
        
        // Add each icon
        this.goalIcons.forEach(icon => {
            const iconElement = document.createElement('div');
            iconElement.className = 'goal-icon-option';
            iconElement.dataset.iconId = icon.id;
            
            // Mark the default icon as selected
            if (icon.id === 'default') {
                iconElement.classList.add('selected');
            }
            
            iconElement.innerHTML = `
                <span title="${icon.name}">${icon.emoji}</span>
            `;
            
            // Add click event
            iconElement.addEventListener('click', () => {
                // Remove selected class from all icons
                document.querySelectorAll('.goal-icon-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Add selected class to clicked icon
                iconElement.classList.add('selected');
                
                // Update hidden input
                document.getElementById('selected-goal-icon').value = icon.id;
            });
            
            container.appendChild(iconElement);
        });
    },
    
    /**
     * Hide add goal modal
     */
    hideAddGoalModal() {
        const modal = document.getElementById('add-goal-modal');
        modal.classList.remove('active');
    },
    
    /**
     * Add a new goal
     */
    addNewGoal() {
        const name = document.getElementById('goal-name').value.trim();
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const iconId = document.getElementById('selected-goal-icon').value;
        
        // Validate inputs
        if (name === '') {
            UIManager.showToast('Please enter a quest name!', 'error');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            UIManager.showToast('Please enter a valid target amount!', 'error');
            return;
        }
        
        // Find selected icon
        const selectedIcon = this.goalIcons.find(icon => icon.id === iconId) || this.goalIcons[0];
        
        // Create new goal
        DataManager.addGoal({
            name: name,
            targetAmount: amount,
            iconId: selectedIcon.id,
            iconEmoji: selectedIcon.emoji
        });
        
        // Hide modal
        this.hideAddGoalModal();
        
        UIManager.showToast('New quest has begun! The gods are watching.', 'success');
        
        // Refresh goals
        UIManager.renderGoals();
    },
    
    /**
     * Delete a goal
     * @param {string} goalId - ID of the goal to delete
     */
    deleteGoal(goalId) {
        if (confirm('Are you sure you want to abandon this quest?')) {
            DataManager.deleteGoal(goalId);
            
            UIManager.showToast('Quest abandoned!', 'info');
            
            // Refresh goals
            UIManager.renderGoals();
        }
    },
    
    /**
     * Contribute to a goal
     * @param {string} goalId - ID of the goal to contribute to
     */
    contributeToGoal(goalId) {
        const goal = DataManager.getGoals().find(g => g.id === goalId);
        
        if (!goal) return;
        
        // Calculate remaining amount
        const remaining = goal.targetAmount - goal.currentAmount;
        
        // Prompt for contribution amount
        const amount = parseFloat(prompt(`How much would you like to contribute to "${goal.name}"? (Remaining: $${remaining.toFixed(2)})`));
        
        // Validate input
        if (isNaN(amount) || amount <= 0) {
            UIManager.showToast('Please enter a valid amount!', 'error');
            return;
        }
        
        // Check if amount is more than remaining
        if (amount > remaining) {
            UIManager.showToast(`You cannot contribute more than the remaining amount ($${remaining.toFixed(2)})!`, 'error');
            return;
        }
        
        // Check if user has enough balance
        const balance = DataManager.getBalance();
        if (amount > balance) {
            UIManager.showToast(`You don't have enough funds! Your balance is $${balance.toFixed(2)}.`, 'error');
            return;
        }
        
        // Contribute to goal
        const updatedGoal = DataManager.contributeToGoal(goalId, amount);
        
        if (updatedGoal) {
            UIManager.showToast(`Successfully contributed $${amount.toFixed(2)} to "${goal.name}"!`, 'success');
            
            // Check if goal is completed
            if (updatedGoal.completed) {
                setTimeout(() => {
                    this.showGoalCompletionCelebration(updatedGoal);
                }, 1000);
            }
            
            // Refresh UI
            UIManager.refreshAllData();
        } else {
            UIManager.showToast('Error contributing to goal!', 'error');
        }
    },
    
    /**
     * Show celebration overlay when a goal is completed
     * @param {Object} goal - The completed goal
     */
    showGoalCompletionCelebration(goal) {
        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-trophy"></div>
                <h2 class="celebration-title">Quest Complete!</h2>
                <p>Congratulations! You have completed your quest:</p>
                <h3>${goal.name}</h3>
                <p>You saved a total of:</p>
                <div class="balance-amount">$${goal.targetAmount.toFixed(2)}</div>
                <button id="celebration-close-btn" class="action-btn">Continue Your Journey</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Add close event
        overlay.querySelector('#celebration-close-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    },
    
    /**
     * Create a goal element for display
     * @param {Object} goal - Goal object
     * @param {boolean} isParentView - Whether this is for parent view
     * @returns {HTMLElement} Goal element
     */
    createGoalElement(goal, isParentView) {
        const element = document.createElement('div');
        element.className = 'goal-item';
        
        // Calculate progress percentage
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const formattedProgress = Math.min(100, progress).toFixed(0);
        const remaining = goal.targetAmount - goal.currentAmount;
        
        // Format dates
        const dateCreated = new Date(goal.dateCreated);
        const formattedDateCreated = dateCreated.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let dateCompletedHTML = '';
        if (goal.completed && goal.dateCompleted) {
            const dateCompleted = new Date(goal.dateCompleted);
            const formattedDateCompleted = dateCompleted.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            dateCompletedHTML = `<div class="goal-date-completed">Completed: ${formattedDateCompleted}</div>`;
        }
        
        // Set HTML content
        element.innerHTML = `
            <div class="goal-header">
                <div class="goal-icon">
                    <span>${goal.iconEmoji}</span>
                </div>
                <div class="goal-details">
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-date-created">Started: ${formattedDateCreated}</div>
                    ${dateCompletedHTML}
                </div>
            </div>
            
            <div class="goal-progress">
                <div class="goal-stats">
                    <div class="goal-current">$${goal.currentAmount.toFixed(2)}</div>
                    <div class="goal-target">$${goal.targetAmount.toFixed(2)}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${formattedProgress}%"></div>
                </div>
                <div class="goal-percentage">${formattedProgress}% Complete</div>
            </div>
            
            ${goal.completed ? `
                <div class="goal-actions">
                    <div class="completed-label">Quest Complete!</div>
                    ${isParentView ? '' : `
                        <button class="delete-btn" data-goal-id="${goal.id}">Remove</button>
                    `}
                </div>
            ` : `
                <div class="goal-actions">
                    ${isParentView ? '' : `
                        <button class="contribute-btn" data-goal-id="${goal.id}">Contribute</button>
                        <button class="delete-btn" data-goal-id="${goal.id}">Abandon</button>
                    `}
                </div>
            `}
        `;
        
        // Add event listeners (for child view only)
        if (!isParentView) {
            if (!goal.completed) {
                const contributeBtn = element.querySelector('.contribute-btn');
                if (contributeBtn) {
                    contributeBtn.addEventListener('click', () => {
                        this.contributeToGoal(goal.id);
                    });
                }
            }
            
            const deleteBtn = element.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.deleteGoal(goal.id);
                });
            }
        }
        
        return element;
    }
};

// Initialize goals manager on load
document.addEventListener('DOMContentLoaded', () => {
    GoalsManager.init();
}); 