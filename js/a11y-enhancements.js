/**
 * a11y-enhancements.js ---
 * Accessibility enhancements for Family Mount Olympus Bank
 */

const AccessibilityManager = {
    /**
     * Initialize accessibility enhancements
     */
    init() {
        try {
            console.log('Initializing accessibility enhancements...');
            
            // Add skip to content link
            this.addSkipToContentLink();
            
            // Enhance focus styles
            this.enhanceFocusStyles();
            
            // Add ARIA attributes
            this.addAriaAttributes();
            
            // Implement keyboard navigation
            this.setupKeyboardNavigation();
            
            // Add form labels and instructions
            this.enhanceFormAccessibility();
            
            // Set page title updates
            this.setupTitleUpdates();
            
            console.log('Accessibility enhancements initialized');
        } catch (error) {
            console.error('Error initializing accessibility enhancements:', error);
        }
    },
    
    /**
     * Add skip to content link for keyboard users
     */
    addSkipToContentLink() {
        try {
            // Create skip link
            const skipLink = document.createElement('a');
            skipLink.textContent = 'Skip to main content';
            skipLink.href = '#main-content';
            skipLink.className = 'skip-to-content';
            
            // Style the skip link to be visible only when focused
            skipLink.style.position = 'absolute';
            skipLink.style.top = '-40px';
            skipLink.style.left = '0';
            skipLink.style.padding = '8px 16px';
            skipLink.style.backgroundColor = '#3949ab';
            skipLink.style.color = 'white';
            skipLink.style.zIndex = '9999';
            skipLink.style.transition = 'top 0.3s';
            
            // Show skip link on focus
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '0';
            });
            
            // Hide skip link when blurred
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });
            
            // Add skip link to the beginning of the body
            document.body.insertBefore(skipLink, document.body.firstChild);
            
            // Add id to main content area if it doesn't exist
            const mainContent = document.querySelector('.dashboard-content') || 
                                document.querySelector('main') || 
                                document.querySelector('#app-container');
            
            if (mainContent && !mainContent.id) {
                mainContent.id = 'main-content';
                
                // Make it focusable but not part of tab order
                mainContent.tabIndex = -1;
            }
        } catch (error) {
            console.error('Error adding skip to content link:', error);
        }
    },
    
    /**
     * Enhance focus styles for better visibility
     */
    enhanceFocusStyles() {
        try {
            // Create and add a style element
            const style = document.createElement('style');
            style.textContent = `
                /* High visibility focus styles */
                :focus {
                    outline: 2px solid #ff9800 !important;
                    outline-offset: 2px !important;
                    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.5) !important;
                }
                
                /* Specific button focus styles */
                button:focus, 
                [role="button"]:focus {
                    outline: 2px solid #ff9800 !important;
                    outline-offset: 2px !important;
                    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.5) !important;
                }
                
                /* Remove focus for mouse users */
                :focus:not(:focus-visible) {
                    outline: none !important;
                    box-shadow: none !important;
                }
                
                /* Keep focus style for keyboard users */
                :focus-visible {
                    outline: 2px solid #ff9800 !important;
                    outline-offset: 2px !important;
                    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.5) !important;
                }
            `;
            
            document.head.appendChild(style);
        } catch (error) {
            console.error('Error enhancing focus styles:', error);
        }
    },
    
    /**
     * Add ARIA attributes to improve screen reader experience
     */
    addAriaAttributes() {
        try {
            // Set page landmark roles
            const header = document.querySelector('header');
            if (header) header.setAttribute('role', 'banner');
            
            const nav = document.querySelectorAll('nav, .dashboard-nav');
            nav.forEach(el => el.setAttribute('role', 'navigation'));
            
            const main = document.querySelector('#main-content');
            if (main) main.setAttribute('role', 'main');
            
            // Set tab lists and tabs
            const tabLists = document.querySelectorAll('.dashboard-nav');
            tabLists.forEach(tabList => {
                tabList.setAttribute('role', 'tablist');
                
                const tabs = tabList.querySelectorAll('a');
                tabs.forEach(tab => {
                    tab.setAttribute('role', 'tab');
                    
                    // Get ID of the tab content
                    const tabId = tab.dataset.tab;
                    if (tabId) {
                        const tabContentId = `${tabId}-tab`;
                        tab.setAttribute('aria-controls', tabContentId);
                        
                        // Set active state
                        const isActive = tab.classList.contains('active');
                        tab.setAttribute('aria-selected', isActive.toString());
                        
                        // Make tab content accessible
                        const tabContent = document.getElementById(tabContentId);
                        if (tabContent) {
                            tabContent.setAttribute('role', 'tabpanel');
                            tabContent.setAttribute('aria-labelledby', tab.id || `tab-${tabId}`);
                            
                            // Ensure tab has an ID for the aria-labelledby reference
                            if (!tab.id) {
                                tab.id = `tab-${tabId}`;
                            }
                        }
                    }
                });
            });
            
            // Enhance buttons with appropriate roles and labels
            const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([title])');
            unlabeledButtons.forEach(button => {
                if (!button.textContent.trim()) {
                    // Try to determine button purpose from class or context
                    if (button.classList.contains('close-btn') || button.classList.contains('close')) {
                        button.setAttribute('aria-label', 'Close');
                    } else if (button.classList.contains('approve-btn')) {
                        button.setAttribute('aria-label', 'Approve');
                    } else if (button.classList.contains('reject-btn')) {
                        button.setAttribute('aria-label', 'Reject');
                    } else if (button.classList.contains('add')) {
                        button.setAttribute('aria-label', 'Add');
                    } else if (button.classList.contains('edit')) {
                        button.setAttribute('aria-label', 'Edit');
                    } else if (button.classList.contains('delete')) {
                        button.setAttribute('aria-label', 'Delete');
                    }
                }
            });
            
            // Make loading indicators accessible
            const loadingIndicators = document.querySelectorAll('.loading-screen, .loader, .olympus-loader');
            loadingIndicators.forEach(loader => {
                loader.setAttribute('role', 'status');
                loader.setAttribute('aria-live', 'polite');
                
                // Add loading text if not already present
                if (!loader.textContent.trim().toLowerCase().includes('loading')) {
                    const loaderText = document.createElement('span');
                    loaderText.className = 'sr-only';
                    loaderText.textContent = 'Loading application...';
                    loader.appendChild(loaderText);
                }
            });
            
            // Make toast notifications accessible
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                toastContainer.setAttribute('aria-live', 'polite');
                toastContainer.setAttribute('role', 'status');
            }
        } catch (error) {
            console.error('Error adding ARIA attributes:', error);
        }
    },
    
    /**
     * Set up keyboard navigation for dashboard tabs
     */
    setupKeyboardNavigation() {
        try {
            // Enhance tab key navigation
            const tabGroups = document.querySelectorAll('.dashboard-nav');
            
            tabGroups.forEach(tabGroup => {
                const tabs = Array.from(tabGroup.querySelectorAll('a[role="tab"]'));
                
                tabs.forEach((tab, index) => {
                    tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
                    
                    // Add keyboard navigation
                    tab.addEventListener('keydown', (e) => {
                        let newIndex;
                        
                        switch (e.key) {
                            case 'ArrowRight':
                            case 'ArrowDown':
                                e.preventDefault();
                                newIndex = (index + 1) % tabs.length;
                                break;
                                
                            case 'ArrowLeft':
                            case 'ArrowUp':
                                e.preventDefault();
                                newIndex = (index - 1 + tabs.length) % tabs.length;
                                break;
                                
                            case 'Home':
                                e.preventDefault();
                                newIndex = 0;
                                break;
                                
                            case 'End':
                                e.preventDefault();
                                newIndex = tabs.length - 1;
                                break;
                                
                            default:
                                return;
                        }
                        
                        // Set focus to the new tab
                        tabs[newIndex].focus();
                        tabs[newIndex].click();
                        
                        // Update tabindex
                        tabs.forEach(t => t.setAttribute('tabindex', '-1'));
                        tabs[newIndex].setAttribute('tabindex', '0');
                    });
                });
            });
            
            // Make all interactive elements properly focusable
            document.querySelectorAll('.card, .transaction, .chore, .goal').forEach(item => {
                // Only add if the element doesn't already have interactive elements inside
                if (!item.querySelector('button, a, input, select, textarea')) {
                    item.tabIndex = 0;
                    item.setAttribute('role', 'button');
                    
                    // Add keyboard interaction if missing
                    if (!item.hasAttribute('aria-label') && item.textContent.trim()) {
                        // Create a descriptive label from content
                        const titleElement = item.querySelector('.title, .transaction-title, .chore-title, .goal-title');
                        if (titleElement) {
                            item.setAttribute('aria-label', titleElement.textContent.trim());
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up keyboard navigation:', error);
        }
    },
    
    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        try {
            // Find all form inputs without associated labels
            document.querySelectorAll('input, select, textarea').forEach(input => {
                // Skip inputs that already have labels
                if (input.id && document.querySelector(`label[for="${input.id}"]`)) {
                    return;
                }
                
                // Skip inputs with aria-label
                if (input.hasAttribute('aria-label')) {
                    return;
                }
                
                // Try to find a label-like element nearby
                const parent = input.parentElement;
                const labelCandidate = parent.querySelector('label:not([for]), .label, .input-label');
                
                if (labelCandidate && !input.hasAttribute('aria-label')) {
                    // Generate a unique ID if needed
                    if (!input.id) {
                        input.id = `input-${Math.random().toString(36).substring(2, 9)}`;
                    }
                    
                    // If it's a real label element but missing the for attribute
                    if (labelCandidate.tagName === 'LABEL' && !labelCandidate.hasAttribute('for')) {
                        labelCandidate.setAttribute('for', input.id);
                    } else {
                        // If it's not a label element, add aria-labelledby
                        if (!labelCandidate.id) {
                            labelCandidate.id = `label-${Math.random().toString(36).substring(2, 9)}`;
                        }
                        input.setAttribute('aria-labelledby', labelCandidate.id);
                    }
                } else {
                    // No label found, use placeholder as aria-label as last resort
                    if (input.placeholder && !input.hasAttribute('aria-label')) {
                        input.setAttribute('aria-label', input.placeholder);
                    }
                }
                
                // Add appropriate roles
                if (input.type === 'search') {
                    const searchContainer = input.closest('div');
                    if (searchContainer) {
                        searchContainer.setAttribute('role', 'search');
                    }
                }
                
                // Ensure required inputs are properly marked
                if (input.required && !input.hasAttribute('aria-required')) {
                    input.setAttribute('aria-required', 'true');
                }
                
                // Add descriptive error messages
                if (input.classList.contains('error') || input.classList.contains('invalid')) {
                    const errorMessage = parent.querySelector('.error-message, .validation-message');
                    if (errorMessage) {
                        if (!errorMessage.id) {
                            errorMessage.id = `error-${Math.random().toString(36).substring(2, 9)}`;
                        }
                        input.setAttribute('aria-invalid', 'true');
                        input.setAttribute('aria-errormessage', errorMessage.id);
                    }
                }
            });
            
            // Add form instructions
            document.querySelectorAll('form').forEach(form => {
                if (!form.getAttribute('aria-describedby')) {
                    // Find existing instructions or create them
                    let instructions = form.querySelector('.form-instructions, .instructions');
                    
                    if (!instructions) {
                        // Look for a title or heading that might describe the form
                        const formTitle = form.querySelector('h1, h2, h3, h4, .form-title, .title');
                        
                        if (formTitle && !formTitle.id) {
                            formTitle.id = `form-title-${Math.random().toString(36).substring(2, 9)}`;
                            form.setAttribute('aria-labelledby', formTitle.id);
                        }
                    } else {
                        if (!instructions.id) {
                            instructions.id = `form-instructions-${Math.random().toString(36).substring(2, 9)}`;
                        }
                        form.setAttribute('aria-describedby', instructions.id);
                    }
                }
            });
        } catch (error) {
            console.error('Error enhancing form accessibility:', error);
        }
    },
    
    /**
     * Set up page title updates for navigation
     */
    setupTitleUpdates() {
        try {
            // Store original title
            const originalTitle = document.title;
            
            // Update title when tabs change
            const allTabs = document.querySelectorAll('[role="tab"]');
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Determine which view we're in (parent/child)
                    let viewPrefix = '';
                    if (tab.closest('#parent-dashboard')) {
                        viewPrefix = 'Zeus • ';
                    } else if (tab.closest('#child-dashboard')) {
                        viewPrefix = 'Hermes • ';
                    }
                    
                    // Update the document title
                    const tabName = tab.textContent.trim();
                    document.title = `${viewPrefix}${tabName} - ${originalTitle}`;
                });
            });
            
            // Reset title when navigating away
            window.addEventListener('blur', () => {
                document.title = originalTitle;
            });
            
            window.addEventListener('focus', () => {
                // Find the active tab
                const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
                if (activeTab) {
                    // Simulate a click to update the title
                    activeTab.dispatchEvent(new Event('click'));
                } else {
                    document.title = originalTitle;
                }
            });
        } catch (error) {
            console.error('Error setting up title updates:', error);
        }
    }
};

// Initialize accessibility enhancements when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure the UI has initialized first
    setTimeout(() => {
        AccessibilityManager.init();
    }, 500);
});

// Add screen reader only style
(() => {
    const style = document.createElement('style');
    style.textContent = `
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
    `;
    document.head.appendChild(style);
})(); 