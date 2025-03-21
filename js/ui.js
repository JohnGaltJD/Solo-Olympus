// ui.js ---
// Handles UI animations, transitions, and visual enhancements for Family Mount Olympus Bank

const UIEffects = {
    // Animation settings
    animationDurations: {
        short: 300,
        medium: 500,
        long: 800
    },

    // Initialize all UI effects
    init() {
        this.initButtonEffects();
        this.initCardHoverEffects();
        this.initModalAnimations();
        this.initScrollEffects();
        this.initThemeEffects();
        
        console.log('UI Effects initialized');
    },

    // Add button hover and click effects
    initButtonEffects() {
        const buttons = document.querySelectorAll('button, .btn');
        
        buttons.forEach(button => {
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
                button.style.transition = 'transform 0.2s ease-in-out';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
            
            // Add click effect
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 200);
            });
        });
    },

    // Add hover effects to cards
    initCardHoverEffects() {
        const cards = document.querySelectorAll('.card, .chore-item, .transaction-item, .goal-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            });
        });
    },

    // Add animations to modals
    initModalAnimations() {
        // Handle modal open animations
        const modalOpenButtons = document.querySelectorAll('[data-modal]');
        
        modalOpenButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                
                if (modal) {
                    // Set initial state
                    modal.style.opacity = '0';
                    modal.style.transform = 'translateY(-20px)';
                    
                    // Trigger animation
                    setTimeout(() => {
                        modal.style.opacity = '1';
                        modal.style.transform = 'translateY(0)';
                        modal.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    }, 10);
                }
            });
        });
        
        // Handle modal close animations
        const modalCloseButtons = document.querySelectorAll('.modal-close, .cancel-btn');
        
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                
                if (modal) {
                    // Trigger animation
                    modal.style.opacity = '0';
                    modal.style.transform = 'translateY(-20px)';
                    modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    
                    // Hide modal after animation completes
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    },

    // Add scroll effects
    initScrollEffects() {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            
            // Parallax effect for header background
            const headerBg = document.querySelector('.header-bg');
            if (headerBg) {
                headerBg.style.transform = `translateY(${scrollPosition * 0.3}px)`;
            }
            
            // Fade in elements as they scroll into view
            const fadeElements = document.querySelectorAll('.fade-in-element');
            fadeElements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenHeight = window.innerHeight;
                
                if (elementPosition < screenHeight * 0.8) {
                    element.classList.add('visible');
                }
            });
        });
    },

    // Add theme-specific visual effects
    initThemeEffects() {
        // Add subtle lightning effect for Zeus theme elements
        const zeusElements = document.querySelectorAll('.zeus-element');
        zeusElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.createLightningEffect(element);
            });
        });
        
        // Add water ripple effect for Poseidon theme elements
        const poseidonElements = document.querySelectorAll('.poseidon-element');
        poseidonElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.createWaterRippleEffect(element);
            });
        });
        
        // Add golden glow effect for financial elements
        const goldElements = document.querySelectorAll('.balance, .deposit-btn, .goal-amount');
        goldElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)';
                element.style.transition = 'text-shadow 0.3s ease';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.textShadow = 'none';
            });
        });
    },

    // Create lightning effect for Zeus-themed elements
    createLightningEffect(element) {
        const lightning = document.createElement('div');
        lightning.classList.add('lightning-effect');
        
        // Random positioning for the lightning
        const x = Math.random() * element.offsetWidth;
        const y = Math.random() * element.offsetHeight;
        
        lightning.style.left = `${x}px`;
        lightning.style.top = `${y}px`;
        
        element.appendChild(lightning);
        
        // Remove after animation completes
        setTimeout(() => {
            lightning.remove();
        }, 1000);
    },

    // Create water ripple effect for Poseidon-themed elements
    createWaterRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.classList.add('water-ripple');
        
        // Random positioning for the ripple
        const x = Math.random() * element.offsetWidth;
        const y = Math.random() * element.offsetHeight;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        // Remove after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 1500);
    },

    // Add toast notification with animation
    showAnimatedToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.textContent = message;
        
        // Add icon based on type
        const icon = document.createElement('span');
        icon.classList.add('toast-icon');
        
        switch(type) {
            case 'success':
                icon.textContent = '✓';
                break;
            case 'error':
                icon.textContent = '✗';
                break;
            case 'warning':
                icon.textContent = '⚠';
                break;
            default:
                icon.textContent = 'ℹ';
        }
        
        toast.prepend(icon);
        
        // Add to document
        const toastContainer = document.querySelector('.toast-container') || (() => {
            const container = document.createElement('div');
            container.classList.add('toast-container');
            document.body.appendChild(container);
            return container;
        })();
        
        toastContainer.appendChild(toast);
        
        // Animate entrance
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
            toast.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        }, 10);
        
        // Animate exit after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            
            // Remove element after animation completes
            setTimeout(() => {
                toast.remove();
                
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 500);
        }, duration);
    },

    // Add confetti celebration effect
    showConfetti() {
        const colors = ['#FFD700', '#4169E1', '#8A2BE2', '#FF4500', '#32CD32'];
        const confettiCount = 200;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            // Random styling
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
};

// Initialize UI effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UIEffects.init();
}); 