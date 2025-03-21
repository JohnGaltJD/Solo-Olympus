/**
 * firebase-auth.js
 * ---
 * Handles Firebase authentication for Family Mount Olympus Bank
 */

const FirebaseAuthManager = {
    // Current family ID
    currentFamilyId: null,
    
    /**
     * Initialize Firebase authentication
     */
    init() {
        try {
            console.log('Initializing Firebase Auth Manager');
            
            // Check if Firebase is available
            if (!window.firebase || !firebase.auth) {
                console.warn('Firebase Auth not available');
                return false;
            }
            
            // Set up auth state change listener
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // User is signed in
                    console.log('User signed in:', user.uid);
                    this.currentFamilyId = user.uid;
                    
                    // Update DataManager family ID
                    if (DataManager && typeof DataManager.setFamilyId === 'function') {
                        DataManager.setFamilyId(user.uid);
                    }
                } else {
                    // User is signed out
                    console.log('User signed out');
                    this.currentFamilyId = null;
                }
            });
            
            // Check if we have a stored family ID to use for anonymous auth
            const storedFamilyId = localStorage.getItem('olympusBankFamilyId');
            if (storedFamilyId) {
                this.currentFamilyId = storedFamilyId;
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing Firebase Auth Manager:', error);
            return false;
        }
    },
    
    /**
     * Create or sign in with a family code
     * @param {string} familyCode - Family code to sign in with
     * @returns {Promise<string>} Family ID
     */
    async signInWithFamilyCode(familyCode) {
        try {
            if (!window.firebase || !firebase.auth) {
                console.warn('Firebase Auth not available');
                return null;
            }
            
            // For simplicity, we'll sign in anonymously and use the family code as the family ID
            // In a real app, you'd validate this against a database of valid family codes
            
            // Normalize the family code
            const normalizedCode = familyCode.trim().toLowerCase();
            
            // Update the family ID
            this.currentFamilyId = normalizedCode;
            
            // Store in localStorage
            localStorage.setItem('olympusBankFamilyId', normalizedCode);
            
            // Update DataManager family ID
            if (DataManager && typeof DataManager.setFamilyId === 'function') {
                await DataManager.setFamilyId(normalizedCode);
            }
            
            console.log('Signed in with family code:', normalizedCode);
            return normalizedCode;
        } catch (error) {
            console.error('Error signing in with family code:', error);
            return null;
        }
    },
    
    /**
     * Sign out
     * @returns {Promise<boolean>} Success status
     */
    async signOut() {
        try {
            if (!window.firebase || !firebase.auth) {
                console.warn('Firebase Auth not available');
                return false;
            }
            
            // Clear family ID
            this.currentFamilyId = null;
            
            // Clear from localStorage
            localStorage.removeItem('olympusBankFamilyId');
            
            // Sign out of Firebase
            await firebase.auth().signOut();
            
            console.log('Signed out successfully');
            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    },
    
    /**
     * Get current family ID
     * @returns {string} Family ID
     */
    getFamilyId() {
        return this.currentFamilyId || 'default-family';
    }
};

// Initialize Firebase Auth Manager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to ensure Firebase is ready
    setTimeout(() => {
        FirebaseAuthManager.init();
    }, 1000);
}); 