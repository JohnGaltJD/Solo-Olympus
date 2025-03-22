/**
 * auth-adapter.js
 * ---
 * Adapter that bridges the modernized UI with the legacy authentication system
 */

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth adapter initialized');
    
    // Store the original methods for later use
    const originalLoginUser = AuthManager.loginUser;
    const originalVerifyPassword = AuthManager.verifyParentPassword;
    
    // Override the AuthManager.loginUser method to handle the new UI
    AuthManager.loginUser = function(userType) {
        console.log('Auth adapter: logging in as', userType);
        
        // Get the family code from the modern UI
        const familyCodeInput = document.getElementById('family-code-input');
        if (!familyCodeInput) {
            console.error('Family code input not found');
            UIManager.showToast('Family code input not found', 'error');
            return;
        }
        
        // Set the family code in DataManager
        const familyCode = familyCodeInput.value.trim();
        if (!familyCode) {
            UIManager.showToast('Please enter your family code', 'error');
            return;
        }
        
        // Set family code
        if (window.DataManager && typeof DataManager.setFamilyId === 'function') {
            DataManager.setFamilyId(familyCode);
        }
        
        // Call the original method
        originalLoginUser(userType);
    };
    
    // Override the AuthManager.verifyParentPassword method to handle the new UI
    AuthManager.verifyParentPassword = function(password) {
        console.log('Auth adapter: verifying parent password');
        console.log('Password present:', !!password);
        
        if (!password) {
            UIManager.showToast('Please enter your password', 'error');
            return;
        }
        
        try {
            // Call the original method
            originalVerifyPassword(password);
        } catch (error) {
            console.error('Error in verifyParentPassword:', error);
            UIManager.showToast('Authentication error', 'error');
        }
    };
    
    // Add event listeners for the modern UI elements
    
    // Parent login button
    const zeusLoginBtn = document.getElementById('zeus-login-btn');
    if (zeusLoginBtn) {
        console.log('Auth adapter: Zeus login button found');
        zeusLoginBtn.addEventListener('click', function() {
            console.log('Zeus login button clicked');
            // Style is handled in login.html
            
            // Focus the family code input if empty
            const familyCodeInput = document.getElementById('family-code-input');
            if (familyCodeInput && !familyCodeInput.value.trim()) {
                familyCodeInput.focus();
            }
        });
    }
    
    // Parent password form submission
    const parentPasswordForm = document.getElementById('parent-password-form');
    if (parentPasswordForm) {
        console.log('Auth adapter: Parent password form found');
        parentPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Parent password form submitted');
            
            // Get inputs
            const familyCodeInput = document.getElementById('family-code-input');
            const passwordInput = document.getElementById('password-input');
            
            if (!familyCodeInput || !passwordInput) {
                UIManager.showToast('Login inputs not found', 'error');
                return;
            }
            
            const familyCode = familyCodeInput.value.trim();
            const password = passwordInput.value.trim();
            
            console.log('Family code present:', !!familyCode);
            console.log('Password present:', !!password);
            
            if (!familyCode) {
                UIManager.showToast('Please enter your family code', 'error');
                const parentPasswordModal = document.getElementById('parent-password-modal');
                if (parentPasswordModal) {
                    parentPasswordModal.classList.add('hidden');
                }
                familyCodeInput.focus();
                return;
            }
            
            if (!password) {
                UIManager.showToast('Please enter your password', 'error');
                return;
            }
            
            // Update the legacy password field for the original auth system
            const legacyParentPw = document.getElementById('parent-password');
            if (legacyParentPw) {
                legacyParentPw.value = password;
            }
            
            // Set family code
            if (window.DataManager && typeof DataManager.setFamilyId === 'function') {
                DataManager.setFamilyId(familyCode);
            }
            
            // Add loading state to button
            const submitBtn = document.getElementById('submit-password-btn');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="loader mx-auto"></div>';
                
                // Attempt to verify password
                try {
                    console.log('Calling verifyParentPassword with password length:', password.length);
                    setTimeout(() => {
                        AuthManager.verifyParentPassword(password);
                    }, 100);
                } catch (error) {
                    console.error('Error verifying parent password:', error);
                    UIManager.showToast('Authentication error', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }
    
    // Child login button
    const hermesLoginBtn = document.getElementById('hermes-login-btn');
    if (hermesLoginBtn) {
        console.log('Auth adapter: Hermes login button found');
        hermesLoginBtn.addEventListener('click', function() {
            console.log('Hermes login button clicked');
            
            // Add selected styling
            hermesLoginBtn.classList.add('border-yellow-400', 'border-2');
            if (zeusLoginBtn) {
                zeusLoginBtn.classList.remove('border-yellow-400', 'border-2');
            }
            
            // Get family code
            const familyCodeInput = document.getElementById('family-code-input');
            if (!familyCodeInput) {
                UIManager.showToast('Family code input not found', 'error');
                return;
            }
            
            const familyCode = familyCodeInput.value.trim();
            if (!familyCode) {
                UIManager.showToast('Please enter your family code', 'error');
                familyCodeInput.focus();
                return;
            }
            
            // Add loading state
            hermesLoginBtn.disabled = true;
            const originalContent = hermesLoginBtn.innerHTML;
            hermesLoginBtn.innerHTML = hermesLoginBtn.innerHTML.replace(
                /<span.*?<\/span>/g, 
                '<div class="loader mx-auto"></div>'
            );
            
            // Set default child password in the legacy form for compatibility
            const childPasswordInput = document.getElementById('child-password');
            if (childPasswordInput) {
                childPasswordInput.value = 'childpassword';
            }
            
            // Login as child after a short delay to show the loading state
            setTimeout(() => {
                try {
                    AuthManager.loginUser('child');
                } catch (error) {
                    console.error('Error logging in as child:', error);
                    UIManager.showToast('Login error', 'error');
                    hermesLoginBtn.disabled = false;
                    hermesLoginBtn.innerHTML = originalContent;
                }
            }, 800);
        });
    }
}); 