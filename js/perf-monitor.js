// perf-monitor.js
// Performance monitoring utility for Family Mount Olympus Bank

const PerfMonitor = {
    // Store performance metrics
    metrics: {
        pageLoad: null,
        resourcesLoad: null,
        domInteractive: null,
        domComplete: null,
        firstPaint: null,
        firstContentfulPaint: null,
        componentTimings: {},
        interactionTimings: {}
    },
    
    // Collect and report detailed timings in development
    debug: false,
    
    /**
     * Initialize performance monitoring
     */
    init() {
        // Only run in browser environment
        if (typeof window === 'undefined' || typeof performance === 'undefined') return;
        
        // Check if we're in development mode
        this.debug = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.search.includes('debug=true');
        
        // Set up page load performance monitoring
        this.monitorPageLoad();
        
        // Set up interaction performance monitoring
        this.monitorInteractions();
        
        // Only log metrics if in debug mode
        if (this.debug) {
            window.addEventListener('load', () => {
                setTimeout(() => this.logMetrics(), 1000);
            });
        }
    },
    
    /**
     * Monitor page load performance metrics
     */
    monitorPageLoad() {
        // Capture navigation timing metrics when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageNavigation = perfData.navigationStart;
                
                this.metrics.pageLoad = perfData.loadEventEnd - pageNavigation;
                this.metrics.domInteractive = perfData.domInteractive - pageNavigation;
                this.metrics.domComplete = perfData.domComplete - pageNavigation;
                this.metrics.resourcesLoad = perfData.loadEventEnd - perfData.domContentLoadedEventEnd;
                
                // Get paint timings
                const paintMetrics = performance.getEntriesByType('paint');
                paintMetrics.forEach(metric => {
                    if (metric.name === 'first-paint') {
                        this.metrics.firstPaint = metric.startTime;
                    }
                    if (metric.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = metric.startTime;
                    }
                });
                
                // Log slow page loads for all users
                if (this.metrics.pageLoad > 3000) {
                    console.warn('Page load performance warning: Total load time exceeded 3 seconds');
                    this.reportPerformanceIssue('slow-page-load', this.metrics);
                }
            }, 0);
        });
    },
    
    /**
     * Monitor user interactions performance
     */
    monitorInteractions() {
        // Track specific interaction performance
        const trackedElements = [
            { selector: '#parent-login-btn', name: 'parent-login' },
            { selector: '#child-login-btn', name: 'child-login' },
            { selector: '.dashboard-nav a', name: 'tab-switch' },
            { selector: '#add-chore-btn', name: 'add-chore' },
            { selector: '#add-goal-btn', name: 'add-goal' }
        ];
        
        // Set up interaction monitoring after DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            trackedElements.forEach(element => {
                const elements = document.querySelectorAll(element.selector);
                elements.forEach(el => {
                    el.addEventListener('click', () => this.trackInteraction(element.name));
                });
            });
        });
    },
    
    /**
     * Track the performance of a specific interaction
     * @param {string} interactionName - Name of the interaction
     */
    trackInteraction(interactionName) {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure time until next frame render
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Store the interaction timing
                if (!this.metrics.interactionTimings[interactionName]) {
                    this.metrics.interactionTimings[interactionName] = [];
                }
                
                this.metrics.interactionTimings[interactionName].push(duration);
                
                // Log slow interactions for all users
                if (duration > 100) {
                    console.warn(`Interaction performance warning: ${interactionName} took ${duration.toFixed(2)}ms`);
                }
                
                // Only log detailed metrics if in debug mode
                if (this.debug) {
                    console.log(`Interaction timing - ${interactionName}: ${duration.toFixed(2)}ms`);
                }
            });
        });
    },
    
    /**
     * Track component rendering performance
     * @param {string} componentName - Name of the component
     * @param {function} callback - The rendering function to measure
     * @returns {*} - The result of the callback function
     */
    trackComponentRender(componentName, callback) {
        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Store the component timing
        if (!this.metrics.componentTimings[componentName]) {
            this.metrics.componentTimings[componentName] = [];
        }
        
        this.metrics.componentTimings[componentName].push(duration);
        
        // Log slow renders for all users
        if (duration > 50) {
            console.warn(`Component render warning: ${componentName} took ${duration.toFixed(2)}ms`);
        }
        
        // Only log detailed metrics if in debug mode
        if (this.debug) {
            console.log(`Component timing - ${componentName}: ${duration.toFixed(2)}ms`);
        }
        
        return result;
    },
    
    /**
     * Log all performance metrics to console
     */
    logMetrics() {
        console.group('Performance Metrics');
        console.log('Page Load Time:', this.formatTime(this.metrics.pageLoad));
        console.log('DOM Interactive:', this.formatTime(this.metrics.domInteractive));
        console.log('DOM Complete:', this.formatTime(this.metrics.domComplete));
        console.log('Resources Load Time:', this.formatTime(this.metrics.resourcesLoad));
        console.log('First Paint:', this.formatTime(this.metrics.firstPaint));
        console.log('First Contentful Paint:', this.formatTime(this.metrics.firstContentfulPaint));
        
        console.group('Component Render Timings');
        Object.keys(this.metrics.componentTimings).forEach(component => {
            const timings = this.metrics.componentTimings[component];
            const average = timings.reduce((sum, time) => sum + time, 0) / timings.length;
            console.log(`${component}: ${average.toFixed(2)}ms (${timings.length} renders)`);
        });
        console.groupEnd();
        
        console.group('Interaction Timings');
        Object.keys(this.metrics.interactionTimings).forEach(interaction => {
            const timings = this.metrics.interactionTimings[interaction];
            const average = timings.reduce((sum, time) => sum + time, 0) / timings.length;
            console.log(`${interaction}: ${average.toFixed(2)}ms (${timings.length} interactions)`);
        });
        console.groupEnd();
        
        console.groupEnd();
    },
    
    /**
     * Format time value in milliseconds or seconds
     * @param {number} timeInMs - Time in milliseconds
     * @returns {string} - Formatted time string
     */
    formatTime(timeInMs) {
        if (timeInMs === null || timeInMs === undefined) return 'Not available';
        return timeInMs > 1000 ? `${(timeInMs / 1000).toFixed(2)}s` : `${timeInMs.toFixed(2)}ms`;
    },
    
    /**
     * Report performance issues for analytics
     * @param {string} issueType - Type of performance issue
     * @param {object} data - Performance data to report
     */
    reportPerformanceIssue(issueType, data) {
        // In a real app, this would send data to an analytics endpoint
        // For now, just log to console
        if (this.debug) {
            console.warn(`Performance issue reported: ${issueType}`, data);
        }
        
        // Could be implemented to send data to server
        // Example: fetch('/api/perf-report', { method: 'POST', body: JSON.stringify({ issueType, data }) });
    }
};

// Initialize performance monitoring
PerfMonitor.init(); 