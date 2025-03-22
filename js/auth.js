/**
 * auth.js
 * ---
 * Handles authentication for Family Mount Olympus Bank
 */

// Authentication manager for the Family Mount Olympus Bank application
const AuthManager = {
    /**
     * Current user role (null, 'parent', or 'child')
     */
    currentUser: null,
    
    /**
     * Initialize authentication handlers
     */
    init() {
        try {
            console.log("Initializing AuthManager...");
            
            // Parent login button
            const parentLoginBtn = document.getElementById('parent-login-btn');
            if (parentLoginBtn) {
                parentLoginBtn.addEventListener('click', () => {
                    this.showParentPasswordModal();
                });
            } else {
                console.log("Parent login button not found - likely using modernized UI");
            }
            
            // Child login button (no password needed)
            const childLoginBtn = document.getElementById('child-login-btn');
            if (childLoginBtn) {
                childLoginBtn.addEventListener('click', () => {
                    this.loginUser('child');
                });
            } else {
                console.log("Child login button not found - likely using modernized UI");
            }
            
            // Password modal handlers
            const submitPwBtn = document.getElementById('submit-password-btn');
            if (submitPwBtn) {
                submitPwBtn.addEventListener('click', () => {
                    this.verifyParentPassword();
                });
            }
            
            const cancelPwBtn = document.getElementById('cancel-password-btn');
            if (cancelPwBtn) {
                cancelPwBtn.addEventListener('click', () => {
                    this.hideParentPasswordModal();
                });
            }
            
            // Allow Enter key for password submission
            const parentPw = document.getElementById('parent-password');
            if (parentPw) {
                parentPw.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.verifyParentPassword();
                    }
                });
            }
            
            // Logout buttons - these might not exist on the login page
            const parentLogoutBtn = document.getElementById('parent-logout-btn');
            if (parentLogoutBtn) {
                parentLogoutBtn.addEventListener('click', () => {
                    this.logoutUser();
                });
            }
            
            const childLogoutBtn = document.getElementById('child-logout-btn');
            if (childLogoutBtn) {
                childLogoutBtn.addEventListener('click', () => {
                    this.logoutUser();
                });
            }
            
            // Password change form
            const changePwForm = document.getElementById('change-password-form');
            if (changePwForm) {
                changePwForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.changeParentPassword();
                });
            }
            
            // Family code button
            const setFamilyCodeBtn = document.getElementById('set-family-code-btn');
            if (setFamilyCodeBtn) {
                setFamilyCodeBtn.addEventListener('click', () => {
                    this.setFamilyCode();
                });
            }
            
            // Allow Enter key for family code submission
            const familyCodeInput = document.getElementById('family-code');
            if (familyCodeInput) {
                familyCodeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.setFamilyCode();
                    }
                });
                
                // Display current family code if available
                const currentFamilyId = localStorage.getItem('olympusBankFamilyId');
                if (currentFamilyId && currentFamilyId !== 'default-family') {
                    familyCodeInput.value = currentFamilyId;
                    
                    const statusElement = document.getElementById('family-code-status');
                    if (statusElement) {
                        statusElement.textContent = 'Using saved family code.';
                        statusElement.className = 'family-code-status success';
                    }
                }
            }
            
            // Restore previous auth state if it exists in localStorage
            const savedAuthState = localStorage.getItem('olympusBankAuthState');
            if (savedAuthState) {
                try {
                    const authState = JSON.parse(savedAuthState);
                    if (authState && authState.currentUser) {
                        this.currentUser = authState.currentUser;
                        console.log('Auth state restored:', this.currentUser);
                    }
                } catch (parseError) {
                    console.error('Error parsing saved auth state:', parseError);
                }
            }
            
            console.log("AuthManager initialized successfully");
            return true;
        } catch (error) {
            console.error('Error initializing authentication:', error);
            return false;
        }
    },
    
    /**
     * Show the parent password modal
     */
    showParentPasswordModal() {
        // Try both modern and legacy modal selectors
        const modal = document.getElementById('parent-password-modal');
        if (!modal) {
            console.error("Parent password modal not found");
            return;
        }
        
        // Check which UI we're using (modern or legacy)
        if (modal.classList.contains('active') !== undefined) {
            // Legacy UI
            modal.classList.add('active');
        } else {
            // Modern UI
            modal.classList.remove('hidden');
        }
        
        // Clear and focus password field
        const passwordInput = document.getElementById('parent-password') || 
                             document.getElementById('password-input');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    },
    
    /**
     * Hide the parent password modal
     */
    hideParentPasswordModal() {
        console.log("Hiding parent password modal");
        // Try both modern and legacy modal selectors
        const modal = document.getElementById('parent-password-modal');
        if (!modal) {
            console.error("Parent password modal not found");
            return;
        }
        
        // Check which UI we're using (modern or legacy)
        if (typeof modal.classList.contains === 'function' && 
            typeof modal.classList.remove === 'function') {
            
            if (modal.classList.contains('active')) {
                // Legacy UI
                modal.classList.remove('active');
            } else {
                // Modern UI
                modal.classList.add('hidden');
            }
        } else {
            console.error("Modal element exists but classList methods are unavailable");
        }
    },
    
    /**
     * Verify the entered parent password
     */
    verifyParentPassword(providedPassword = null) {
        // Get password from input element or use provided password
        let password = providedPassword;
        
        if (!password) {
            // Try both modern and legacy password input selectors
            const passwordInput = document.getElementById('parent-password') || 
                                 document.getElementById('password-input');
            
            if (!passwordInput) {
                console.error("Password input element not found");
                if (UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Authentication system error!', 'error');
                }
                return;
            }
            
            password = passwordInput.value.trim();
        }
        
        try {
            console.log("Verifying parent password...");
            
            // Check if UIManager is available
            if (!UIManager || typeof UIManager.showToast !== 'function') {
                console.error("UIManager.showToast is not available");
            }
            
            // Check if password is empty
            if (!password) {
                console.log("Password is empty");
                if (UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Password cannot be empty!', 'error');
                }
                // Focus password input if possible
                const passwordInput = document.getElementById('parent-password') || 
                                     document.getElementById('password-input');
                if (passwordInput) {
                    passwordInput.focus();
                }
                return;
            }
            
            // Check if DataManager is available
            if (!DataManager || typeof DataManager.verifyParentPassword !== 'function') {
                console.error("DataManager.verifyParentPassword is not available");
                if (UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Authentication system error!', 'error');
                }
                return;
            }
            
            console.log("Calling DataManager.verifyParentPassword");
            if (DataManager.verifyParentPassword(password)) {
                console.log("Password verification successful");
                // Ensure the hideParentPasswordModal method exists
                if (typeof this.hideParentPasswordModal === 'function') {
                    this.hideParentPasswordModal();
                } else {
                    console.log("hideParentPasswordModal function not available");
                    // Try direct DOM manipulation as fallback
                    const modal = document.getElementById('parent-password-modal');
                    if (modal) {
                        if (modal.classList.contains('active')) {
                            modal.classList.remove('active');
                        } else {
                            modal.classList.add('hidden');
                        }
                    }
                }
                this.loginUser('parent');
            } else {
                // Show error message
                console.log("Password verification failed");
                if (UIManager && typeof UIManager.showToast === 'function') {
                    UIManager.showToast('Incorrect password. Zeus does not recognize you!', 'error');
                }
                
                // Clear and focus password input if possible
                const passwordInput = document.getElementById('parent-password') || 
                                     document.getElementById('password-input');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error("Error during password verification:", error);
            if (UIManager && typeof UIManager.showToast === 'function') {
                UIManager.showToast('An error occurred during authentication.', 'error');
            }
        }
    },
    
    /**
     * Login user with the specified role
     * @param {string} role - User role ('parent' or 'child')
     */
    async loginUser(role) {
        try {
            console.log(`Logging in as ${role}...`);
            
            // First, check if another user is already logged in and log them out
            if (this.currentUser !== null && this.currentUser !== role) {
                console.log(`User already logged in as ${this.currentUser}, logging out before switching to ${role}`);
                
                // Hide all dashboards without animation
                document.getElementById('parent-dashboard').classList.remove('active-section');
                document.getElementById('child-dashboard').classList.remove('active-section');
                
                // Clear previous auth state
                this.currentUser = null;
            }
            
            this.currentUser = role;
            
            // Save auth state to localStorage
            localStorage.setItem('olympusBankAuthState', JSON.stringify({
                currentUser: role,
                timestamp: Date.now()
            }));
            
            console.log("Auth state saved to localStorage");
            
            // Hide login section
            document.getElementById('login-section').classList.remove('active-section');
            
            // Show appropriate dashboard
            if (role === 'parent') {
                console.log("Showing parent dashboard");
                document.getElementById('parent-dashboard').classList.add('active-section');
                UIManager.showToast('Welcome, Zeus! Master of Mount Olympus.', 'success');
                
                // Update Firebase status in parent dashboard
                const statusElement = document.getElementById('parent-firebase-status');
                if (statusElement) {
                    statusElement.textContent = 'Checking connection...';
                    statusElement.className = 'firebase-status connecting';
                }
            } else {
                console.log("Showing child dashboard");
                document.getElementById('child-dashboard').classList.add('active-section');
                UIManager.showToast('Welcome, Hermes! Guardian of Kaden\'s Treasury.', 'success');
                
                // Update Firebase status in child dashboard
                const statusElement = document.getElementById('child-firebase-status');
                if (statusElement) {
                    statusElement.textContent = 'Checking connection...';
                    statusElement.className = 'firebase-status connecting';
                }
            }
            
            // Refresh UI components
            console.log("Refreshing all data");
            UIManager.refreshAllData();
            
            // Check Firebase connection after login
            if (window.checkFirebaseConnection && typeof checkFirebaseConnection === 'function') {
                setTimeout(async () => {
                    try {
                        const isConnected = await checkFirebaseConnection();
                        
                        // Update the correct status element based on current role
                        const statusElement = document.getElementById(
                            role === 'parent' ? 'parent-firebase-status' : 'child-firebase-status'
                        );
                        
                        if (statusElement) {
                            if (isConnected) {
                                statusElement.textContent = 'Connected to cloud';
                                statusElement.className = 'firebase-status connected';
                            } else {
                                statusElement.textContent = 'Using local storage (offline)';
                                statusElement.className = 'firebase-status disconnected';
                            }
                        }
                    } catch (error) {
                        console.error('Error checking Firebase connection:', error);
                    }
                }, 2000); // Check after 2 seconds to give Firebase time to connect
            }
            
            return true;
        } catch (error) {
            console.error("Error during login process:", error);
            UIManager.showToast('An error occurred during login.', 'error');
            return false;
        }
    },
    
    /**
     * Logout the current user
     */
    logoutUser() {
        console.log("Logging out current user...");
        
        // Clear user role
        this.currentUser = null;
        
        // Remove auth state from localStorage
        localStorage.removeItem('olympusBankAuthState');
        
        // Hide all dashboard sections
        document.getElementById('parent-dashboard').classList.remove('active-section');
        document.getElementById('child-dashboard').classList.remove('active-section');
        
        // Redirect to login page
        window.location.href = 'login.html';
    },
    
    /**
     * Change the parent password
     */
    changeParentPassword() {
        const currentPassword = document.getElementById('current-password').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        
        // Verify current password
        if (!DataManager.verifyParentPassword(currentPassword)) {
            UIManager.showToast('Current password is incorrect!', 'error');
            return;
        }
        
        // Check new password
        if (newPassword === '') {
            UIManager.showToast('New password cannot be empty!', 'error');
            return;
        }
        
        // Confirm passwords match
        if (newPassword !== confirmPassword) {
            UIManager.showToast('New passwords do not match!', 'error');
            return;
        }
        
        // Update password
        DataManager.updateParentPassword(newPassword);
        
        // Clear form
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        UIManager.showToast('Zeus\'s divine password has been changed!', 'success');
    },
    
    /**
     * Check if the current user is a parent
     * @returns {boolean} Whether current user is a parent
     */
    isParent() {
        return this.currentUser === 'parent';
    },
    
    /**
     * Check if the current user is a child
     * @returns {boolean} Whether current user is a child
     */
    isChild() {
        return this.currentUser === 'child';
    },
    
    /**
     * Set the family code
     */
    async setFamilyCode() {
        const familyCodeInput = document.getElementById('family-code');
        const statusElement = document.getElementById('family-code-status');
        
        if (!familyCodeInput || !statusElement) return;
        
        const familyCode = familyCodeInput.value.trim();
        
        if (!familyCode) {
            statusElement.textContent = 'Please enter a family code.';
            statusElement.className = 'family-code-status error';
            return;
        }
        
        try {
            statusElement.textContent = 'Setting family code...';
            statusElement.className = 'family-code-status';
            
            // First check if this family code exists in Firebase
            let isExistingFamily = false;
            
            if (window.firebase && window.db) {
                try {
                    const docRef = db.collection('olympus_families').doc(familyCode.trim().toLowerCase());
                    const doc = await docRef.get();
                    isExistingFamily = doc.exists;
                    console.log(`Family code ${familyCode} exists in Firebase: ${isExistingFamily}`);
                } catch (error) {
                    console.warn('Error checking if family exists:', error);
                    // Continue anyway, DataManager will handle this
                }
            }
            
            // Check if Firebase Auth Manager is available
            if (window.FirebaseAuthManager && typeof FirebaseAuthManager.signInWithFamilyCode === 'function') {
                // Use Firebase Auth Manager to set family code
                const result = await FirebaseAuthManager.signInWithFamilyCode(familyCode);
                
                if (result) {
                    if (isExistingFamily) {
                        statusElement.textContent = 'Connected to existing family account! Your data will now sync across devices.';
                    } else {
                        statusElement.textContent = 'New family account created! Your data will now sync across devices.';
                    }
                    statusElement.className = 'family-code-status success';
                    
                    // Force refresh data
                    if (window.DataManager && typeof DataManager.init === 'function') {
                        await DataManager.init();
                    }
                    
                    // Refresh UI if needed
                    if (this.currentUser && window.UIManager && typeof UIManager.refreshAllData === 'function') {
                        UIManager.refreshAllData();
                    }
                } else {
                    statusElement.textContent = 'Failed to set family code. Please try again.';
                    statusElement.className = 'family-code-status error';
                }
            } else {
                // Fallback to simple localStorage
                localStorage.setItem('olympusBankFamilyId', familyCode);
                
                // Update DataManager family ID if available
                if (window.DataManager && typeof DataManager.setFamilyId === 'function') {
                    await DataManager.setFamilyId(familyCode);
                    
                    // Refresh UI if needed
                    if (this.currentUser && window.UIManager && typeof UIManager.refreshAllData === 'function') {
                        UIManager.refreshAllData();
                    }
                }
                
                if (isExistingFamily) {
                    statusElement.textContent = 'Connected to existing family account! Your data will now sync across devices.';
                } else {
                    statusElement.textContent = 'New family account created! Your data will now sync across devices.';
                }
                statusElement.className = 'family-code-status success';
            }
        } catch (error) {
            console.error('Error setting family code:', error);
            statusElement.textContent = 'An error occurred. Please try again.';
            statusElement.className = 'family-code-status error';
        }
    }
};

// Initialize authentication on load
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
}); 