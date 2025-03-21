// browser-check.js
// Checks for browser compatibility and displays warnings if needed

const BrowserCheck = {
    // Minimum required browser versions
    minVersions: {
        chrome: 70,
        firefox: 63,
        safari: 12,
        edge: 18,
        opera: 57,
        samsung: 10,
        ie: Infinity // IE not supported
    },

    // Features required for the application
    requiredFeatures: [
        { name: 'localStorage', test: () => typeof localStorage !== 'undefined' },
        { name: 'fetch API', test: () => typeof fetch !== 'undefined' },
        { name: 'Promises', test: () => typeof Promise !== 'undefined' },
        { name: 'CSS Grid', test: () => {
            const testEl = document.createElement('div');
            return typeof testEl.style.grid !== 'undefined' || 
                   typeof testEl.style.gridArea !== 'undefined' ||
                   typeof testEl.style.gridTemplate !== 'undefined';
        }},
        { name: 'Flexbox', test: () => {
            const testEl = document.createElement('div');
            return typeof testEl.style.flex !== 'undefined' || 
                   typeof testEl.style.flexBasis !== 'undefined';
        }}
    ],

    /**
     * Initializes browser compatibility checks
     */
    init() {
        // Check if running in a browser environment
        if (typeof window === 'undefined') return;
        
        // Run checks when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runChecks());
        } else {
            this.runChecks();
        }
    },

    /**
     * Run browser compatibility checks
     */
    runChecks() {
        // Collect warnings
        const warnings = [];
        
        // Check browser version
        const browser = this.detectBrowser();
        const version = this.getBrowserVersion(browser);
        
        if (browser && version) {
            const minVersion = this.minVersions[browser];
            if (minVersion && version < minVersion) {
                warnings.push(`Your ${browser} browser (version ${version}) is outdated. Please update to version ${minVersion} or newer.`);
            }
        }
        
        // Check for required features
        const missingFeatures = this.requiredFeatures.filter(feature => !feature.test());
        if (missingFeatures.length > 0) {
            const featureNames = missingFeatures.map(f => f.name).join(', ');
            warnings.push(`Your browser is missing required features: ${featureNames}`);
        }
        
        // Display warnings if any
        if (warnings.length > 0) {
            this.displayWarning(warnings);
        }
    },

    /**
     * Detects the current browser
     * @returns {string|null} Browser name or null if unknown
     */
    detectBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg/') > -1) return 'edge';
        if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('samsung') > -1) return 'samsung';
        if (userAgent.indexOf('opr') > -1 || userAgent.indexOf('opera') > -1) return 'opera';
        if (userAgent.indexOf('chrome') > -1) return 'chrome';
        if (userAgent.indexOf('safari') > -1) return 'safari';
        if (userAgent.indexOf('firefox') > -1) return 'firefox';
        if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) return 'ie';
        
        return null;
    },

    /**
     * Gets the browser version
     * @param {string} browser Browser name
     * @returns {number|null} Browser version or null if unknown
     */
    getBrowserVersion(browser) {
        const userAgent = navigator.userAgent.toLowerCase();
        let match;
        
        switch (browser) {
            case 'chrome':
                match = userAgent.match(/chrome\/(\d+)/);
                break;
            case 'firefox':
                match = userAgent.match(/firefox\/(\d+)/);
                break;
            case 'safari':
                match = userAgent.match(/version\/(\d+)/);
                break;
            case 'edge':
                match = userAgent.match(/edge\/(\d+)/) || userAgent.match(/edg\/(\d+)/);
                break;
            case 'opera':
                match = userAgent.match(/(?:opr|opera)\/(\d+)/);
                break;
            case 'samsung':
                match = userAgent.match(/samsungbrowser\/(\d+)/);
                break;
            case 'ie':
                match = userAgent.match(/(?:msie |rv:)(\d+)/);
                break;
        }
        
        return match && match[1] ? parseInt(match[1], 10) : null;
    },

    /**
     * Displays compatibility warnings to the user
     * @param {string[]} warnings Array of warning messages
     */
    displayWarning(warnings) {
        // Create or get warning container
        let warningContainer = document.getElementById('browser-warning');
        
        if (!warningContainer) {
            warningContainer = document.createElement('div');
            warningContainer.id = 'browser-warning';
            warningContainer.style.position = 'fixed';
            warningContainer.style.top = '0';
            warningContainer.style.left = '0';
            warningContainer.style.right = '0';
            warningContainer.style.backgroundColor = '#fff3cd';
            warningContainer.style.color = '#856404';
            warningContainer.style.padding = '10px';
            warningContainer.style.textAlign = 'center';
            warningContainer.style.fontFamily = 'Arial, sans-serif';
            warningContainer.style.fontSize = '14px';
            warningContainer.style.zIndex = '9999';
            warningContainer.style.borderBottom = '1px solid #ffeeba';
            warningContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.float = 'right';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '0 5px';
            closeBtn.style.marginLeft = '10px';
            closeBtn.style.color = '#856404';
            closeBtn.onclick = () => {
                warningContainer.style.display = 'none';
                // Remember the user's choice for this session
                sessionStorage.setItem('browser-warning-dismissed', 'true');
            };
            
            warningContainer.appendChild(closeBtn);
            document.body.insertBefore(warningContainer, document.body.firstChild);
        }
        
        // Don't show warning if user dismissed it
        if (sessionStorage.getItem('browser-warning-dismissed') === 'true') {
            warningContainer.style.display = 'none';
            return;
        }
        
        // Create warning message
        const content = document.createElement('div');
        
        // Add warning icon
        const icon = document.createElement('span');
        icon.innerHTML = '⚠️ ';
        icon.style.marginRight = '5px';
        content.appendChild(icon);
        
        // Add warning text
        const text = document.createElement('span');
        text.textContent = 'Browser Compatibility Warning: ';
        text.style.fontWeight = 'bold';
        content.appendChild(text);
        
        // Add each warning as a paragraph
        warnings.forEach((warning, index) => {
            if (index > 0) content.appendChild(document.createElement('br'));
            content.appendChild(document.createTextNode(warning));
        });
        
        // Add suggestion text
        const suggestion = document.createElement('p');
        suggestion.textContent = 'For the best experience, please use the latest version of Chrome, Firefox, Safari, or Edge.';
        suggestion.style.marginTop = '5px';
        suggestion.style.marginBottom = '0';
        content.appendChild(suggestion);
        
        // Clear and update the warning container
        warningContainer.innerHTML = '';
        warningContainer.appendChild(closeBtn);
        warningContainer.appendChild(content);
    }
};

// Initialize browser checks
BrowserCheck.init(); 