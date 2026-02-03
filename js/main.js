/**
 * Main Application Entry Point
 * Initializes all modules and starts the Kung Fu Tracker application
 */

class KungFuTracker {
    constructor() {
        this.isInitialized = false;
        this.modules = {
            storage: null,
            sessionManager: null,
            chartManager: null,
            rewardSystem: null,
            simplePredictor: null,
            uiManager: null,
            router: null
        };
        
        this.startTime = Date.now();
        this.bindGlobalEvents();
    }

    /**
     * Bind global application events
     */
    bindGlobalEvents() {
        // Handle DOM content loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Handle window load
        window.addEventListener('load', () => this.onWindowLoad());

        // Handle before unload
        window.addEventListener('beforeunload', (e) => this.onBeforeUnload(e));

        // Handle visibility change
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());

        // Handle errors
        window.addEventListener('error', (e) => this.onError(e));
        window.addEventListener('unhandledrejection', (e) => this.onUnhandledRejection(e));

        // Handle online/offline
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🥋 Initializing Kung Fu Tracker...');
            
            // Check browser compatibility
            if (!this.checkBrowserCompatibility()) {
                return this.showCompatibilityError();
            }

            // Initialize modules in order of dependency
            await this.initializeModules();

            // Load user settings
            await this.loadUserSettings();

            // Initialize UI
            await this.initializeUI();

            // Start the application
            await this.startApplication();

            // Mark as initialized
            this.isInitialized = true;
            
            const loadTime = Date.now() - this.startTime;
            console.log(`✅ Kung Fu Tracker initialized successfully in ${loadTime}ms`);
            
            // Trigger initialization complete event
            this.triggerInitComplete();

        } catch (error) {
            console.error('💥 Failed to initialize Kung Fu Tracker:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Check browser compatibility
     */
    checkBrowserCompatibility() {
        const requiredFeatures = {
            'localStorage': () => typeof(Storage) !== 'undefined',
            'Promise': () => typeof Promise !== 'undefined',
            'fetch': () => typeof fetch !== 'undefined',
            'CustomEvent': () => typeof CustomEvent !== 'undefined',
            'classList': () => 'classList' in document.createElement('div'),
            'addEventListener': () => 'addEventListener' in window
        };

        const unsupportedFeatures = [];
        
        for (const [feature, check] of Object.entries(requiredFeatures)) {
            if (!check()) {
                unsupportedFeatures.push(feature);
            }
        }

        if (unsupportedFeatures.length > 0) {
            console.error('Unsupported browser features:', unsupportedFeatures);
            return false;
        }

        return true;
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');

        // Modules are already initialized as global instances
        // Just reference them here
        this.modules.storage = window.storage;
        this.modules.sessionManager = window.sessionManager;
        this.modules.chartManager = window.chartManager;
        this.modules.rewardSystem = window.rewardSystem;
        this.modules.simplePredictor = window.simplePredictor;
        this.modules.uiManager = window.uiManager;
        this.modules.router = window.router;

        // Verify all modules are available
        const missingModules = Object.entries(this.modules)
            .filter(([name, module]) => !module)
            .map(([name]) => name);

        if (missingModules.length > 0) {
            throw new Error(`Missing modules: ${missingModules.join(', ')}`);
        }

        console.log('✅ All modules initialized');
    }

    /**
     * Load user settings and apply theme
     */
    async loadUserSettings() {
        console.log('⚙️ Loading user settings...');
        
        const settings = this.modules.storage.getSettings();
        
        // Apply theme
        if (settings.theme && settings.theme !== 'light') {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }

        // Apply other settings
        if (settings.language) {
            document.documentElement.setAttribute('lang', settings.language);
        }

        console.log('✅ User settings loaded');
    }

    /**
     * Initialize UI
     */
    async initializeUI() {
        console.log('🎨 Initializing UI...');
        
        await this.modules.uiManager.init();
        
        console.log('✅ UI initialized');
    }

    /**
     * Start the application
     */
    async startApplication() {
        console.log('🚀 Starting application...');
        
        // Initialize router
        this.modules.router.init();
        
        // Initialize charts
        this.modules.chartManager.initializeCharts();
        
        // Setup periodic updates
        this.setupPeriodicUpdates();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('✅ Application started');
    }

    /**
     * Setup periodic updates
     */
    setupPeriodicUpdates() {
        // Update stats every 5 minutes
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.modules.storage.updateStats();
            }
        }, 5 * 60 * 1000);

    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in form inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Handle Ctrl/Cmd + key shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.modules.router.navigateTo('dashboard');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.modules.router.navigateTo('session-form');
                        break;
                    case 's':
                        e.preventDefault();
                        this.modules.router.navigateTo('session-list');
                        break;
                    case 'c':
                        e.preventDefault();
                        this.modules.router.navigateTo('calendar');
                        break;
                    case 't':
                        e.preventDefault();
                        this.modules.router.navigateTo('stats');
                        break;
                    case 'b':
                        e.preventDefault();
                        this.modules.router.navigateTo('rewards');
                        break;
                }
            }

            // Handle single key shortcuts
            switch (e.key) {
                case '?':
                    e.preventDefault();
                    this.showKeyboardShortcuts();
                    break;
            }
        });
    }

    /**
     * Show keyboard shortcuts modal
     */
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+H', description: 'Go to Dashboard' },
            { key: 'Ctrl+N', description: 'Add New Session' },
            { key: 'Ctrl+S', description: 'View Sessions' },
            { key: 'Ctrl+C', description: 'View Calendar' },
            { key: 'Ctrl+T', description: 'View Statistics' },
            { key: 'Ctrl+B', description: 'View Belts' },
            { key: '?', description: 'Show this help' }
        ];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-list">
                        ${shortcuts.map(shortcut => `
                            <div class="shortcut-item">
                                <kbd>${shortcut.key}</kbd>
                                <span>${shortcut.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Handle window load event
     */
    onWindowLoad() {
        console.log('🎯 Window fully loaded');
        
        // Hide loading screen if still visible
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }

        // Preload critical routes
        if (this.modules.router) {
            this.modules.router.preloadRoutes(['session-form', 'session-list']);
        }
    }

    /**
     * Handle before unload event
     */
    onBeforeUnload(e) {
        // Don't show confirmation for now
        // Could be used to warn about unsaved changes
        return undefined;
    }

    /**
     * Handle visibility change
     */
    onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('👀 App became visible');
            // Refresh data when app becomes visible
            if (this.isInitialized) {
                this.modules.sessionManager.refreshSessions();
                this.modules.chartManager.updateCharts();
            }
        } else {
            console.log('😴 App became hidden');
        }
    }

    /**
     * Handle JavaScript errors
     */
    onError(e) {
        console.error('💥 JavaScript Error:', e.error);
        
        // Log error details
        const errorInfo = {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Save error to localStorage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push(errorInfo);
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            localStorage.setItem('app_errors', JSON.stringify(errors));
        } catch (storageError) {
            console.error('Failed to save error to localStorage:', storageError);
        }
    }

    /**
     * Handle unhandled promise rejections
     */
    onUnhandledRejection(e) {
        console.error('💥 Unhandled Promise Rejection:', e.reason);
        
        // Prevent the default behavior
        e.preventDefault();
    }

    /**
     * Handle online event
     */
    onOnline() {
        console.log('🌐 App is online');
        this.showConnectionStatus('You are back online!', 'success');
    }

    /**
     * Handle offline event
     */
    onOffline() {
        console.log('📱 App is offline');
        this.showConnectionStatus('You are offline. Data will be saved locally.', 'warning');
    }

    /**
     * Show connection status message
     */
    showConnectionStatus(message, type) {
        const notification = document.createElement('div');
        notification.className = `connection-status ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'wifi' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show browser compatibility error
     */
    showCompatibilityError() {
        document.body.innerHTML = `
            <div class="compatibility-error">
                <h1>Browser Not Supported</h1>
                <p>Your browser doesn't support all the features required by Kung Fu Tracker.</p>
                <p>Please update your browser or try using:</p>
                <ul>
                    <li>Chrome 60+</li>
                    <li>Firefox 55+</li>
                    <li>Safari 12+</li>
                    <li>Edge 79+</li>
                </ul>
            </div>
        `;
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="init-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Failed to Start Application</h2>
                    <p>Something went wrong during initialization.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.message}\n${error.stack}</pre>
                    </details>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Trigger initialization complete event
     */
    triggerInitComplete() {
        const event = new CustomEvent('appInitialized', {
            detail: {
                timestamp: Date.now(),
                loadTime: Date.now() - this.startTime,
                modules: Object.keys(this.modules)
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Get application info
     */
    getAppInfo() {
        return {
            name: 'Kung Fu Tracker',
            version: '1.0.0',
            initialized: this.isInitialized,
            loadTime: Date.now() - this.startTime,
            modules: Object.keys(this.modules),
            userAgent: navigator.userAgent,
            storage: this.modules.storage?.getStats(),
            settings: this.modules.storage?.getSettings()
        };
    }

    /**
     * Export application data
     */
    exportAppData() {
        if (!this.modules.storage) return null;
        
        return {
            appInfo: this.getAppInfo(),
            data: this.modules.storage.exportData(),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Reset application data
     */
    resetAppData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            this.modules.storage.clearAllData();
            location.reload();
        }
    }
}

// Additional CSS for application-specific styles
const appStyles = `
    .compatibility-error,
    .init-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        text-align: center;
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .compatibility-error h1,
    .init-error h2 {
        color: var(--error);
        margin-bottom: 1rem;
    }
    
    .compatibility-error ul {
        list-style: disc;
        text-align: left;
        margin: 1rem 0;
    }
    
    .init-error details {
        margin: 1rem 0;
        text-align: left;
    }
    
    .init-error pre {
        background: var(--bg-tertiary);
        padding: 1rem;
        border-radius: var(--radius-md);
        font-size: 0.8rem;
        overflow: auto;
        max-width: 60ch;
    }
    
    .connection-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 10000;
    }
    
    .connection-status.show {
        transform: translateX(0);
    }
    
    .connection-status.success {
        border-left: 4px solid var(--success);
    }
    
    .connection-status.warning {
        border-left: 4px solid var(--warning);
    }
    
    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .shortcut-item {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .shortcut-item kbd {
        background: var(--bg-tertiary);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-family: monospace;
        font-size: 0.8rem;
        min-width: 80px;
        text-align: center;
    }
    
    .route-loading {
        opacity: 0.7;
        pointer-events: none;
    }
`;

// Inject application styles
const styleSheet = document.createElement('style');
styleSheet.textContent = appStyles;
document.head.appendChild(styleSheet);

// Create and start the application
const app = new KungFuTracker();

// Make app available globally for debugging
window.app = app;

// Log when app is fully initialized
window.addEventListener('appInitialized', (e) => {
    console.log('🎉 Kung Fu Tracker is ready!', e.detail);
});

console.log('🥋 Kung Fu Tracker loaded and ready to initialize...'); 
