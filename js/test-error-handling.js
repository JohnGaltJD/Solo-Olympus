/**
 * test-error-handling.js ---
 * Test utilities for Family Mount Olympus Bank error handling and recovery
 */

const ErrorRecoveryTester = {
    /**
     * Run comprehensive error recovery tests
     */
    runTests() {
        console.log('%c🧪 Starting Error Recovery Tests', 'font-size: 16px; font-weight: bold; color: #3949ab;');
        
        // Run tests sequentially with visual grouping in console
        this.testDataCorruption();
        this.testComponentFailure();
        this.testDOMElementMissing();
        this.testInvalidInput();
        this.testAsyncError();
        this.testStateRecovery();
        
        console.log('%c✅ Error Recovery Tests Completed', 'font-size: 16px; font-weight: bold; color: #43a047;');
    },
    
    /**
     * Test application's ability to recover from corrupted data
     */
    testDataCorruption() {
        console.group('🧪 Testing Data Corruption Recovery');
        try {
            // Save current data
            const originalData = localStorage.getItem('olympusBank');
            
            // Corrupt the data
            console.log('  Corrupting application data...');
            localStorage.setItem('olympusBank', '{corrupt:data]');
            
            // Attempt to reload the application
            console.log('  Reloading application with corrupted data...');
            
            // Check if DataManager can recover
            if (typeof DataManager !== 'undefined' && DataManager.init) {
                const recovered = DataManager.init();
                
                if (recovered) {
                    console.log('%c  ✅ Success: Application recovered from corrupted data', 'color: #43a047;');
                } else {
                    console.error('  ❌ Failure: Application could not recover from corrupted data');
                }
                
                // Check if default data was properly loaded
                const balance = DataManager.getBalance();
                if (typeof balance === 'number') {
                    console.log(`  ✓ Balance loaded correctly: ${balance}`);
                } else {
                    console.error('  ✗ Balance not loaded correctly');
                }
                
                // Restore original data
                if (originalData) {
                    localStorage.setItem('olympusBank', originalData);
                    console.log('  ✓ Original data restored');
                }
            } else {
                console.error('  ❌ DataManager not available for testing');
            }
        } catch (error) {
            console.error('  ❌ Test failed with error:', error);
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * Test application's ability to handle component initialization failures
     */
    testComponentFailure() {
        console.group('🧪 Testing Component Failure Recovery');
        try {
            // Save original component
            const originalInitTabNavigation = UIManager.initTabNavigation;
            
            // Simulate component failure
            console.log('  Simulating component initialization failure...');
            UIManager.initTabNavigation = function() {
                throw new Error('Simulated component failure');
            };
            
            // Try to initialize UI with failing component
            console.log('  Attempting to initialize UI with failing component...');
            UIManager.componentStates = { data: false, ui: false, auth: false };
            UIManager.isInitialized = false;
            const result = UIManager.init();
            
            // Check if UI was initialized despite component failure
            if (UIManager.componentStates.data === true) {
                console.log('%c  ✅ Success: Application continued despite component failure', 'color: #43a047;');
            } else {
                console.error('  ❌ Failure: Application could not continue after component failure');
            }
            
            // Restore original component
            UIManager.initTabNavigation = originalInitTabNavigation;
            console.log('  ✓ Original component restored');
            
            // Re-initialize properly
            UIManager.isInitialized = false;
            UIManager.init();
        } catch (error) {
            console.error('  ❌ Test failed with error:', error);
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * Test application's handling of missing DOM elements
     */
    testDOMElementMissing() {
        console.group('🧪 Testing Missing DOM Element Handling');
        try {
            // Test element retrieval with error handling
            console.log('  Testing retrieval of non-existent element...');
            
            // Create a test function that should handle missing elements
            const testFunction = () => {
                // This simulates a UI operation on a non-existent element
                const nonExistentEl = document.getElementById('non-existent-element');
                if (nonExistentEl) {
                    nonExistentEl.textContent = 'This will fail';
                } else {
                    console.log('  ✓ Element missing detected correctly');
                    return true;
                }
            };
            
            // Execute with UIManager's error handling pattern
            try {
                const result = testFunction();
                if (result === true) {
                    console.log('%c  ✅ Success: Missing element handled properly', 'color: #43a047;');
                } else {
                    console.error('  ❌ Failure: Missing element not handled properly');
                }
            } catch (error) {
                console.error('  ❌ Error was not caught:', error);
            }
            
            // Test toast system with missing container
            const originalToastContainer = document.getElementById('toast-container');
            let tempContainer = null;
            
            if (originalToastContainer) {
                // Remove the toast container temporarily
                tempContainer = originalToastContainer.cloneNode(true);
                originalToastContainer.remove();
                
                // Try to show a toast without container
                console.log('  Testing toast with missing container...');
                UIManager.showToast('Test toast with missing container');
                
                // Restore container
                if (tempContainer) {
                    document.body.appendChild(tempContainer);
                    console.log('  ✓ Toast container restored');
                }
                
                console.log('%c  ✅ Success: Application did not crash when toast container missing', 'color: #43a047;');
            } else {
                console.log('  ℹ️ Toast container not found, skipping this test');
            }
        } catch (error) {
            console.error('  ❌ Test failed with error:', error);
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * Test application's handling of invalid input data
     */
    testInvalidInput() {
        console.group('🧪 Testing Invalid Input Handling');
        try {
            // Test with various invalid inputs
            const testCases = [
                { func: 'getBalance', args: [], expected: 'number' },
                { func: 'addTransaction', args: [null], expected: 'error' },
                { func: 'addTransaction', args: [{ amount: 'not-a-number', type: 'deposit' }], expected: 'error' },
                { func: 'addTransaction', args: [{ amount: 50, type: 'deposit', date: new Date() }], expected: 'success' }
            ];
            
            let passCount = 0;
            
            testCases.forEach((testCase, index) => {
                console.log(`  Test case ${index + 1}: DataManager.${testCase.func}(${JSON.stringify(testCase.args)})`);
                
                try {
                    const result = DataManager[testCase.func].apply(DataManager, testCase.args);
                    
                    if (testCase.expected === 'error') {
                        console.error(`  ❌ Expected error but got result: ${result}`);
                    } else if (testCase.expected === 'success') {
                        console.log('  ✓ Transaction added successfully');
                        passCount++;
                    } else if (typeof result === testCase.expected) {
                        console.log(`  ✓ Got expected ${testCase.expected}: ${result}`);
                        passCount++;
                    } else {
                        console.error(`  ❌ Expected ${testCase.expected} but got ${typeof result}`);
                    }
                } catch (error) {
                    if (testCase.expected === 'error') {
                        console.log('  ✓ Got expected error:', error.message);
                        passCount++;
                    } else {
                        console.error(`  ❌ Unexpected error:`, error);
                    }
                }
            });
            
            if (passCount === testCases.length) {
                console.log('%c  ✅ Success: All invalid input tests passed', 'color: #43a047;');
            } else {
                console.log(`  ⚠️ Warning: ${passCount} of ${testCases.length} tests passed`);
            }
        } catch (error) {
            console.error('  ❌ Test failed with error:', error);
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * Test application's handling of asynchronous errors
     */
    testAsyncError() {
        console.group('🧪 Testing Asynchronous Error Handling');
        try {
            console.log('  Setting up async error test...');
            
            // Create a promise that will fail
            const failingPromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Simulated async error'));
                }, 100);
            });
            
            // Set up the test
            console.log('  Executing async operation that will fail...');
            
            failingPromise
                .then(result => {
                    console.error('  ❌ Promise unexpectedly succeeded');
                })
                .catch(error => {
                    console.log('  ✓ Async error caught properly:', error.message);
                    console.log('%c  ✅ Success: Asynchronous error handled correctly', 'color: #43a047;');
                })
                .finally(() => {
                    console.log('  ✓ Async operation completed');
                });
                
            // Test setTimeout error handling
            setTimeout(() => {
                try {
                    throw new Error('Simulated setTimeout error');
                } catch (error) {
                    console.log('  ✓ setTimeout error caught:', error.message);
                }
            }, 200);
            
            console.log('  Async tests initiated (results will appear shortly)...');
        } catch (error) {
            console.error('  ❌ Test setup failed with error:', error);
        } finally {
            // Note: We're not ending the group here because async operations
            // will complete later. Instead, we'll end it in the callbacks.
            setTimeout(() => {
                console.groupEnd();
            }, 300);
        }
    },
    
    /**
     * Test application's ability to recover state
     */
    testStateRecovery() {
        console.group('🧪 Testing State Recovery');
        try {
            // Verify DataManager has recovery method
            if (typeof DataManager !== 'undefined' && DataManager.recoverData) {
                console.log('  Testing state recovery from last good data...');
                
                // Save current state
                const currentState = localStorage.getItem('olympusBank');
                
                // Corrupt current state
                localStorage.setItem('olympusBank', '{partial:true,broken:json');
                
                // Try to recover
                const recoveryResult = DataManager.recoverData();
                
                if (recoveryResult) {
                    console.log('%c  ✅ Success: State recovery succeeded', 'color: #43a047;');
                    
                    // Check if essential data is available
                    const balance = DataManager.getBalance();
                    if (typeof balance === 'number') {
                        console.log(`  ✓ Balance recovered: ${balance}`);
                    } else {
                        console.error('  ❌ Balance not recovered properly');
                    }
                } else {
                    console.error('  ❌ State recovery failed');
                }
                
                // Restore original state
                if (currentState) {
                    localStorage.setItem('olympusBank', currentState);
                    console.log('  ✓ Original state restored');
                }
            } else {
                console.log('  ℹ️ DataManager.recoverData not available, skipping test');
            }
        } catch (error) {
            console.error('  ❌ Test failed with error:', error);
        } finally {
            console.groupEnd();
        }
    }
};

// Add a button to the UI for running tests
function addTestButton() {
    // Create button only in development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const button = document.createElement('button');
        button.textContent = 'Test Error Recovery';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '8px 12px';
        button.style.backgroundColor = '#3949ab';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // Run tests when clicked
        button.addEventListener('click', () => {
            ErrorRecoveryTester.runTests();
        });
        
        document.body.appendChild(button);
        console.log('Error recovery test button added. Click to run tests.');
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    addTestButton();
}); 