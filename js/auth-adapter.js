/**
 * auth-adapter.js
 * ---
 * This file serves as an adapter between the modern login UI and the
 * existing authentication system, ensuring backward compatibility.
 */

/**
 * Initialize the authentication adapter
 */
function initAuthAdapter() {
    console.log('Initializing auth adapter...');

    // Override key functions in the Auth module to work with the modern UI
    if (typeof AuthManager !== 'undefined') {
        // Override the loginUser function to use the modern UI flow
        AuthManager.loginUser = function(role) {
            console.log(`Auth adapter: Logging in as ${role}`);
            
            // Save auth state to localStorage
            const authState = {
                currentUser: role,
                timestamp: Date.now()
            };
            localStorage.setItem('olympusBankAuthState', JSON.stringify(authState));
            
            // Redirect to dashboard with role parameter
            window.location.href = `index.html?role=${role}`;
            
            return true;
        };
        
        console.log('Auth adapter: Successfully overrode AuthManager.loginUser');
    }
    
    // Set up direct login buttons on modern login page
    setupModernLoginButtons();
}

/**
 * Set up event listeners for modern login buttons
 */
function setupModernLoginButtons() {
    console.log('Setting up modern login buttons');
    
    // Parent (Zeus) login button
    const zeusLoginBtn = document.getElementById('zeus-login-btn');
    if (zeusLoginBtn) {
        zeusLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const familyCodeInput = document.getElementById('family-code-input');
            const passwordInput = document.getElementById('password-input');
            
            if (!familyCodeInput || !passwordInput) {
                showLoginError('Login inputs not found');
                return;
            }
            
            const familyCode = familyCodeInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!familyCode) {
                showLoginError('Please enter your family code');
                return;
            }
            
            if (!password) {
                showLoginError('Please enter your password');
                return;
            }
            
            console.log('Parent login attempt with family code:', familyCode);
            
            // Set the family ID in DataManager
            if (window.DataManager && typeof DataManager.setFamilyId === 'function') {
                DataManager.setFamilyId(familyCode);
            }
            
            // Verify parent password
            if (window.DataManager && typeof DataManager.verifyParentPassword === 'function') {
                DataManager.verifyParentPassword(password)
                    .then(isValid => {
                        if (isValid) {
                            console.log('Parent password verified successfully');
                            AuthManager.loginUser('parent');
                        } else {
                            showLoginError('Invalid password');
                        }
                    })
                    .catch(error => {
                        console.error('Error verifying parent password:', error);
                        showLoginError('Error during authentication');
                    });
            } else if (window.AuthManager && typeof AuthManager.verifyParentPassword === 'function') {
                AuthManager.verifyParentPassword(password);
            } else {
                showLoginError('Authentication system not available');
            }
        });
        
        console.log('Zeus login button handler attached');
    }
    
    // Child (Hermes) login button
    const hermesLoginBtn = document.getElementById('hermes-login-btn');
    if (hermesLoginBtn) {
        hermesLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const familyCodeInput = document.getElementById('family-code-input');
            const passwordInput = document.getElementById('password-input');
            
            if (!familyCodeInput || !passwordInput) {
                showLoginError('Login inputs not found');
                return;
            }
            
            const familyCode = familyCodeInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!familyCode) {
                showLoginError('Please enter your family code');
                return;
            }
            
            if (!password) {
                showLoginError('Please enter your password');
                return;
            }
            
            console.log('Child login attempt with family code:', familyCode);
            
            // Set the family ID in DataManager
            if (window.DataManager && typeof DataManager.setFamilyId === 'function') {
                DataManager.setFamilyId(familyCode);
            }
            
            // Verify child password
            if (window.DataManager && typeof DataManager.verifyChildPassword === 'function') {
                DataManager.verifyChildPassword(password)
                    .then(isValid => {
                        if (isValid) {
                            console.log('Child password verified successfully');
                            AuthManager.loginUser('child');
                        } else {
                            showLoginError('Invalid password');
                        }
                    })
                    .catch(error => {
                        console.error('Error verifying child password:', error);
                        showLoginError('Error during authentication');
                    });
            } else if (window.AuthManager && typeof AuthManager.verifyChildPassword === 'function') {
                AuthManager.verifyChildPassword(password);
            } else {
                showLoginError('Authentication system not available');
            }
        });
        
        console.log('Hermes login button handler attached');
    }
}

/**
 * Display an error message on the login page
 */
function showLoginError(message) {
    console.error('Login error:', message);
    
    // Try to use the existing toast notification system
    if (typeof showToast === 'function') {
        showToast(message, 'error');
        return;
    }
    
    // Fallback to a simple alert
    alert(message);
}

// Initialize the adapter when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth adapter: DOM content loaded');
    
    // Small delay to ensure the AuthManager is initialized
    setTimeout(initAuthAdapter, 100);
}); 