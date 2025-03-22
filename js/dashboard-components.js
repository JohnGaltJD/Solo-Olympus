/**
 * dashboard-components.js
 * ---
 * This file contains component-based functions for the Mount Olympus Treasury dashboard UI.
 * These functions create and return DOM elements for various dashboard components,
 * adapting the React-based design into vanilla JavaScript.
 */

/**
 * Creates a dashboard header component with title, subtitle, and optional user controls
 * @param {Object} options - Configuration options for the header
 * @param {string} options.title - Main header title
 * @param {string} options.subtitle - Subtitle or description
 * @param {boolean} options.showSync - Whether to show the sync button
 * @param {Function} options.onSyncClick - Callback function for sync button click
 * @returns {HTMLElement} The header DOM element
 */
function createDashboardHeader(options = {}) {
    const { 
        title = 'Mount Olympus Treasury', 
        subtitle = 'Manage your divine finances',
        showSync = true,
        onSyncClick = () => console.log('Sync clicked')
    } = options;

    // Create header container
    const header = document.createElement('header');
    header.className = 'bg-blue-900 text-white p-4 shadow-md';
    
    // Create wrapper for header content
    const headerContent = document.createElement('div');
    headerContent.className = 'container mx-auto flex items-center justify-between';
    
    // Create title section
    const titleSection = document.createElement('div');
    
    // Add main title
    const titleElement = document.createElement('h1');
    titleElement.className = 'text-xl sm:text-2xl font-cinzel font-bold';
    titleElement.textContent = title;
    
    // Add subtitle
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'text-sm text-blue-200';
    subtitleElement.textContent = subtitle;
    
    // Append title elements
    titleSection.appendChild(titleElement);
    titleSection.appendChild(subtitleElement);
    
    // Create actions section
    const actionsSection = document.createElement('div');
    actionsSection.className = 'flex items-center gap-2';
    
    // Add sync button if enabled
    if (showSync) {
        const syncButton = document.createElement('button');
        syncButton.className = 'bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-3 py-1 rounded flex items-center text-sm';
        syncButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
        `;
        syncButton.addEventListener('click', onSyncClick);
        actionsSection.appendChild(syncButton);
    }
    
    // Assemble header
    headerContent.appendChild(titleSection);
    headerContent.appendChild(actionsSection);
    header.appendChild(headerContent);
    
    return header;
}

/**
 * Creates a navigation component for the dashboard with tabs
 * @param {Object} options - Configuration options for the navigation
 * @param {string} options.activeTab - ID of the currently active tab
 * @param {Array} options.tabs - Array of tab objects with id, label, and icon properties
 * @param {Function} options.onTabChange - Callback function when a tab is selected
 * @param {string} options.role - User role ('parent' or 'child')
 * @returns {HTMLElement} The navigation DOM element
 */
function createDashboardNavigation(options = {}) {
    const { 
        activeTab = 'overview',
        tabs = [],
        onTabChange = (tabId) => console.log(`Tab changed to ${tabId}`),
        role = 'parent'
    } = options;
    
    // Use default tabs if none provided
    const defaultTabs = role === 'parent' ? [
        { id: 'overview', label: 'Overview', icon: 'chart-bar' },
        { id: 'chores', label: 'Chores', icon: 'clipboard-list' },
        { id: 'approvals', label: 'Approvals', icon: 'check-circle' },
        { id: 'goals', label: 'Goals', icon: 'flag' },
        { id: 'settings', label: 'Settings', icon: 'cog' }
    ] : [
        { id: 'overview', label: 'My Account', icon: 'cash' },
        { id: 'chores', label: 'Labors', icon: 'clipboard-list' },
        { id: 'goals', label: 'Quests', icon: 'flag' }
    ];
    
    const tabsToUse = tabs.length > 0 ? tabs : defaultTabs;
    
    // Create navigation container
    const nav = document.createElement('nav');
    nav.className = 'bg-white shadow-md';
    
    // Create tab list
    const tabList = document.createElement('div');
    tabList.className = 'container mx-auto flex overflow-x-auto scrollbar-hide';
    tabList.setAttribute('role', 'tablist');
    
    // Create tabs
    tabsToUse.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.className = `px-4 py-3 text-sm font-medium flex items-center justify-center whitespace-nowrap flex-1 border-b-2 transition-colors ${
            activeTab === tab.id 
                ? 'border-yellow-400 text-blue-900' 
                : 'border-transparent text-gray-500 hover:text-blue-800 hover:border-blue-200'
        }`;
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-selected', activeTab === tab.id ? 'true' : 'false');
        tabButton.setAttribute('data-tab-id', tab.id);
        
        // Add icon based on tab type
        let iconSvg = '';
        switch(tab.icon) {
            case 'chart-bar':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>';
                break;
            case 'clipboard-list':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" /></svg>';
                break;
            case 'check-circle':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>';
                break;
            case 'flag':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" /></svg>';
                break;
            case 'cog':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>';
                break;
            case 'cash':
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>';
                break;
            default:
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>';
        }
        
        tabButton.innerHTML = `${iconSvg} ${tab.label}`;
        
        // Add click event handler
        tabButton.addEventListener('click', () => {
            // Update active tab UI
            document.querySelectorAll('[role="tab"]').forEach(t => {
                t.classList.remove('border-yellow-400', 'text-blue-900');
                t.classList.add('border-transparent', 'text-gray-500');
                t.setAttribute('aria-selected', 'false');
            });
            
            tabButton.classList.remove('border-transparent', 'text-gray-500');
            tabButton.classList.add('border-yellow-400', 'text-blue-900');
            tabButton.setAttribute('aria-selected', 'true');
            
            // Call the change handler
            onTabChange(tab.id);
        });
        
        tabList.appendChild(tabButton);
    });
    
    nav.appendChild(tabList);
    return nav;
}

/**
 * Creates a card container for dashboard content
 * @param {Object} options - Configuration options for the card
 * @param {string} options.title - Card title
 * @param {boolean} options.hasBorder - Whether to add a border
 * @param {string} options.padding - Amount of padding
 * @param {HTMLElement|string} options.content - Card content (HTML element or string)
 * @returns {HTMLElement} The card DOM element
 */
function createDashboardCard(options = {}) {
    const { 
        title = '', 
        hasBorder = true,
        padding = 'p-4',
        content = null
    } = options;
    
    // Create card container
    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow-md ${padding} ${hasBorder ? 'border border-gray-200' : ''}`;
    
    // Add title if provided
    if (title) {
        const cardTitle = document.createElement('h3');
        cardTitle.className = 'text-lg font-medium text-blue-900 mb-4 font-cinzel';
        cardTitle.textContent = title;
        card.appendChild(cardTitle);
    }
    
    // Add content
    if (content) {
        if (typeof content === 'string') {
            card.insertAdjacentHTML('beforeend', content);
        } else {
            card.appendChild(content);
        }
    }
    
    return card;
}

/**
 * Creates an account overview card with balance and actions
 * @param {Object} options - Configuration options
 * @param {number} options.balance - Account balance
 * @param {string} options.currency - Currency symbol
 * @param {Function} options.onTransactionClick - Callback for transaction button
 * @returns {HTMLElement} The account overview card element
 */
function createAccountOverview(options = {}) {
    const { 
        balance = 0, 
        currency = '$',
        onTransactionClick = () => console.log('Transaction button clicked')
    } = options;
    
    // Create content container
    const container = document.createElement('div');
    
    // Add balance section
    const balanceSection = document.createElement('div');
    balanceSection.className = 'text-center mb-6';
    
    const balanceLabel = document.createElement('p');
    balanceLabel.className = 'text-sm text-gray-500 mb-1';
    balanceLabel.textContent = 'Current Balance';
    
    const balanceAmount = document.createElement('div');
    balanceAmount.className = 'text-3xl md:text-4xl font-bold text-blue-900';
    balanceAmount.textContent = `${currency}${balance.toFixed(2)}`;
    
    balanceSection.appendChild(balanceLabel);
    balanceSection.appendChild(balanceAmount);
    container.appendChild(balanceSection);
    
    // Add action buttons
    const actionsSection = document.createElement('div');
    actionsSection.className = 'grid grid-cols-2 gap-3';
    
    // Add deposit button
    const depositButton = document.createElement('button');
    depositButton.className = 'bg-blue-900 hover:bg-blue-800 text-white py-2 px-4 rounded shadow-sm flex items-center justify-center';
    depositButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        Deposit
    `;
    depositButton.addEventListener('click', () => onTransactionClick('deposit'));
    
    // Add withdrawal button
    const withdrawButton = document.createElement('button');
    withdrawButton.className = 'bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow-sm flex items-center justify-center';
    withdrawButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
        </svg>
        Withdraw
    `;
    withdrawButton.addEventListener('click', () => onTransactionClick('withdraw'));
    
    actionsSection.appendChild(depositButton);
    actionsSection.appendChild(withdrawButton);
    container.appendChild(actionsSection);
    
    // Create the final card using the card component
    return createDashboardCard({
        title: 'Account Overview',
        content: container
    });
}

/**
 * Creates a transaction history component
 * @param {Object} options - Configuration options
 * @param {Array} options.transactions - Array of transaction objects
 * @param {number} options.limit - Maximum number of transactions to display
 * @returns {HTMLElement} The transaction history component
 */
function createTransactionHistory(options = {}) {
    const { 
        transactions = [],
        limit = 5
    } = options;
    
    // Create content container
    const container = document.createElement('div');
    
    // Add transactions list
    const transactionsList = document.createElement('div');
    transactionsList.className = 'space-y-3';
    
    if (transactions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center text-gray-500 py-4';
        emptyState.textContent = 'No transactions yet';
        transactionsList.appendChild(emptyState);
    } else {
        // Display limited number of transactions
        const displayTransactions = transactions.slice(0, limit);
        
        displayTransactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors';
            
            // Left side with icon and description
            const leftSide = document.createElement('div');
            leftSide.className = 'flex items-center';
            
            // Icon based on transaction type
            const iconContainer = document.createElement('div');
            const isDeposit = transaction.type === 'deposit' || parseFloat(transaction.amount) > 0;
            iconContainer.className = `w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`;
            
            iconContainer.innerHTML = isDeposit 
                ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" /></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" /></svg>';
            
            // Transaction details
            const details = document.createElement('div');
            
            const description = document.createElement('div');
            description.className = 'text-sm font-medium text-gray-900';
            description.textContent = transaction.description || (isDeposit ? 'Deposit' : 'Withdrawal');
            
            const date = document.createElement('div');
            date.className = 'text-xs text-gray-500';
            // Format date if available or use placeholder
            const dateText = transaction.date 
                ? new Date(transaction.date).toLocaleDateString()
                : 'No date';
            date.textContent = dateText;
            
            details.appendChild(description);
            details.appendChild(date);
            
            leftSide.appendChild(iconContainer);
            leftSide.appendChild(details);
            
            // Right side with amount
            const rightSide = document.createElement('div');
            const amount = document.createElement('span');
            amount.className = `font-medium ${isDeposit ? 'text-green-600' : 'text-red-600'}`;
            
            // Format the amount with sign and decimal places
            const amountValue = parseFloat(transaction.amount);
            amount.textContent = `${isDeposit ? '+' : '-'}$${Math.abs(amountValue).toFixed(2)}`;
            
            rightSide.appendChild(amount);
            
            // Assemble transaction item
            transactionItem.appendChild(leftSide);
            transactionItem.appendChild(rightSide);
            
            transactionsList.appendChild(transactionItem);
        });
    }
    
    // Add "View All" link if there are more transactions than the limit
    if (transactions.length > limit) {
        const viewAllContainer = document.createElement('div');
        viewAllContainer.className = 'text-center mt-4';
        
        const viewAllLink = document.createElement('button');
        viewAllLink.className = 'text-blue-600 hover:text-blue-800 text-sm font-medium';
        viewAllLink.textContent = 'View All Transactions';
        viewAllLink.addEventListener('click', () => {
            // Navigate to transactions tab or view, this would be implemented based on app structure
            console.log('View all transactions clicked');
        });
        
        viewAllContainer.appendChild(viewAllLink);
        container.appendChild(transactionsList);
        container.appendChild(viewAllContainer);
    } else {
        container.appendChild(transactionsList);
    }
    
    // Create the final card using the card component
    return createDashboardCard({
        title: 'Recent Transactions',
        content: container
    });
}

// Export components for use in other files
window.DashboardComponents = {
    createDashboardHeader,
    createDashboardNavigation,
    createDashboardCard,
    createAccountOverview,
    createTransactionHistory
}; 