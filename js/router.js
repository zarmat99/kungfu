/**
 * Router - Handles routing and dynamic component loading
 * Simple client-side routing system for single-page application
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.setupRoutes();
        this.bindEvents();
    }

    /**
     * Setup application routes
     */
    setupRoutes() {
        this.routes.set('dashboard', {
            path: '/',
            component: 'dashboard',
            title: 'Dashboard - Kung Fu Tracker'
        });

        this.routes.set('session-form', {
            path: '/add-session',
            component: 'session-form',
            title: 'Add Session - Kung Fu Tracker'
        });

        this.routes.set('session-list', {
            path: '/sessions',
            component: 'session-list',
            title: 'Training Sessions - Kung Fu Tracker'
        });

        this.routes.set('competition-form', {
            path: '/add-competition',
            component: 'competition-form',
            title: 'Add Competition - Kung Fu Tracker'
        });

        this.routes.set('competition-list', {
            path: '/competitions',
            component: 'competition-list',
            title: 'Competitions - Kung Fu Tracker'
        });

        this.routes.set('calendar', {
            path: '/calendar',
            component: 'calendar',
            title: 'Calendar - Kung Fu Tracker'
        });

        this.routes.set('stats', {
            path: '/statistics',
            component: 'stats',
            title: 'Statistics - Kung Fu Tracker'
        });

        this.routes.set('rewards', {
            path: '/belts',
            component: 'rewards',
            title: 'Belt System - Kung Fu Tracker'
        });

        this.routes.set('settings', {
            path: '/settings',
            component: 'settings',
            title: 'Settings - Kung Fu Tracker'
        });
    }

    /**
     * Bind router events
     */
    bindEvents() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.navigateTo(e.state.route, false);
            }
        });

        // Handle hash changes for fallback
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

    }

    /**
     * Navigate to a specific route
     */
    async navigateTo(routeName, addToHistory = true) {
        const route = this.routes.get(routeName);
        
        if (!route) {
            console.error(`Route "${routeName}" not found`);
            return this.navigateTo('dashboard');
        }

        try {
            // Show loading state
            this.showRouteLoading();

            // Update browser URL and title
            this.updateBrowser(route, routeName, addToHistory);

            // Load and render component
            await this.loadComponent(route.component);

            // Update current route
            this.currentRoute = routeName;

            // Hide loading state
            this.hideRouteLoading();

            // Trigger route change event
            this.triggerRouteChange(routeName, route);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showRouteError(error.message);
        }
    }

    /**
     * Load component for route
     */
    async loadComponent(componentName) {
        if (window.uiManager) {
            await window.uiManager.renderView(componentName);
        } else {
            throw new Error('UI Manager not available');
        }
    }

    /**
     * Update browser URL and title
     */
    updateBrowser(route, routeName, addToHistory = true) {
        // Update page title
        document.title = route.title;

        // Update URL without page reload (skip for file:// protocol)
        if (window.location.protocol !== 'file:') {
            if (window.location.pathname !== route.path) {
                try {
                    if (addToHistory) {
                        window.history.pushState(
                            { route: routeName },
                            route.title,
                            route.path
                        );
                    } else {
                        window.history.replaceState(
                            { route: routeName },
                            route.title,
                            route.path
                        );
                    }
                } catch (error) {
                    console.warn('History API not available:', error.message);
                }
            }
        }

        // Update meta description
        this.updateMetaDescription(routeName);
    }

    /**
     * Update meta description based on route
     */
    updateMetaDescription(routeName) {
        const descriptions = {
            'dashboard': 'Track your Kung Fu training progress',
            'session-form': 'Add new training sessions to your Kung Fu journey',
            'session-list': 'View and manage all your training sessions',
            'competition-form': 'Add competitions with specialties, matches, and medal outcomes',
            'competition-list': 'View and manage your competitions and match results',
            'calendar': 'Calendar view of your training schedule',
            'stats': 'Detailed statistics, charts, and future training predictions',
            'rewards': 'Track your belt progression',
            'settings': 'Manage your app settings and data'
        };

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        
        metaDesc.content = descriptions[routeName] || 'Kung Fu Training Tracker';
    }

    /**
     * Handle hash change for fallback routing
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1);
        const routeName = this.getRouteFromHash(hash);
        
        if (routeName && routeName !== this.currentRoute) {
            this.navigateTo(routeName, false);
        }
    }

    /**
     * Get route name from hash
     */
    getRouteFromHash(hash) {
        const hashRoutes = {
            '': 'dashboard',
            'dashboard': 'dashboard',
            'add': 'session-form',
            'sessions': 'session-list',
            'add-competition': 'competition-form',
            'competitions': 'competition-list',
            'calendar': 'calendar',
            'stats': 'stats',
            'belts': 'rewards',
            'settings': 'settings'
        };

        return hashRoutes[hash] || null;
    }

    /**
     * Show loading state during route transition
     */
    showRouteLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.add('route-loading');
        }
    }

    /**
     * Hide loading state
     */
    hideRouteLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('route-loading');
        }
    }

    /**
     * Show route error
     */
    showRouteError(message) {
        console.error('Route error:', message);
        
        if (window.uiManager) {
            window.uiManager.showErrorScreen(`Navigation Error: ${message}`);
        }
    }

    /**
     * Trigger route change event
     */
    triggerRouteChange(routeName, routeData) {
        const event = new CustomEvent('routeChanged', {
            detail: {
                route: routeName,
                data: routeData,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Initialize router
     */
    init() {
        // Determine initial route
        const path = window.location.pathname;
        const hash = window.location.hash.slice(1);
        
        let initialRoute = 'dashboard';
        
        // Check if path matches any route
        for (const [name, data] of this.routes) {
            if (data.path === path) {
                initialRoute = name;
                break;
            }
        }
        
        // Fallback to hash if no path match
        if (initialRoute === 'dashboard' && hash) {
            const hashRoute = this.getRouteFromHash(hash);
            if (hashRoute) {
                initialRoute = hashRoute;
            }
        }
        
        // Navigate to initial route
        this.navigateTo(initialRoute, true);
    }

    /**
     * Preload route components
     */
    async preloadRoutes(routeNames) {
        const promises = routeNames.map(async (routeName) => {
            const route = this.routes.get(routeName);
            if (route && window.uiManager) {
                try {
                    await window.uiManager.loadComponent(route.component);
                } catch (error) {
                    console.warn(`Failed to preload route ${routeName}:`, error);
                }
            }
        });
        
        await Promise.allSettled(promises);
    }
}

// Listen for route changes to update analytics, etc.
window.addEventListener('routeChanged', (e) => {
    console.log('Route changed to:', e.detail.route);
    
    // Update analytics if available
    if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
            page_path: e.detail.data.path
        });
    }
});

// Create global router instance
window.router = new Router(); 
