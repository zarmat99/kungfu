/**
 * Router - Handles routing and dynamic component loading
 * Simple client-side routing system for single-page application
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
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
            title: 'Dashboard - Kung Fu Tracker',
            requiresAuth: false
        });

        this.routes.set('session-form', {
            path: '/add-session',
            component: 'session-form',
            title: 'Add Session - Kung Fu Tracker',
            requiresAuth: false
        });

        this.routes.set('session-list', {
            path: '/sessions',
            component: 'session-list',
            title: 'Training Sessions - Kung Fu Tracker',
            requiresAuth: false
        });

        this.routes.set('calendar', {
            path: '/calendar',
            component: 'calendar',
            title: 'Calendar - Kung Fu Tracker',
            requiresAuth: false
        });

        this.routes.set('stats', {
            path: '/statistics',
            component: 'stats',
            title: 'Statistics - Kung Fu Tracker',
            requiresAuth: false
        });

        this.routes.set('rewards', {
            path: '/belts',
            component: 'rewards',
            title: 'Belt System - Kung Fu Tracker',
            requiresAuth: false
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

        // Handle route navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigateTo(route);
            }
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

        // Check authentication if required
        if (route.requiresAuth && !this.isAuthenticated()) {
            return this.navigateTo('login');
        }

        try {
            // Show loading state
            this.showRouteLoading();

            // Add to history
            if (addToHistory) {
                this.addToHistory(routeName);
            }

            // Update browser URL and title
            this.updateBrowser(route, routeName);

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
    updateBrowser(route, routeName) {
        // Update page title
        document.title = route.title;

        // Update URL without page reload (skip for file:// protocol)
        if (window.location.protocol !== 'file:') {
            const url = window.location.origin + route.path;
            
            if (window.location.href !== url) {
                try {
                    window.history.pushState(
                        { route: routeName },
                        route.title,
                        route.path
                    );
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
            'dashboard': 'Track your Kung Fu training progress and achievements',
            'session-form': 'Add new training sessions to your Kung Fu journey',
            'session-list': 'View and manage all your training sessions',
            'calendar': 'Calendar view of your training schedule',
            'stats': 'Detailed statistics, charts, and future training predictions',
            'rewards': 'Track your belt progression and achievements'
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
     * Add route to history
     */
    addToHistory(routeName) {
        this.history.push({
            route: routeName,
            timestamp: Date.now()
        });

        // Keep history limited to last 50 entries
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
        }
    }

    /**
     * Go back in history
     */
    goBack() {
        if (this.history.length > 1) {
            // Remove current route
            this.history.pop();
            // Get previous route
            const previous = this.history[this.history.length - 1];
            this.navigateTo(previous.route, false);
        } else {
            this.navigateTo('dashboard', false);
        }
    }

    /**
     * Go forward in browser history
     */
    goForward() {
        window.history.forward();
    }

    /**
     * Refresh current route
     */
    refresh() {
        if (this.currentRoute) {
            this.navigateTo(this.currentRoute, false);
        }
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
            'calendar': 'calendar',
            'stats': 'stats',
            'belts': 'rewards'
        };

        return hashRoutes[hash] || null;
    }

    /**
     * Check if user is authenticated (placeholder)
     */
    isAuthenticated() {
        // For now, always return true as we don't have authentication
        return true;
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
     * Get current route information
     */
    getCurrentRoute() {
        return {
            name: this.currentRoute,
            data: this.routes.get(this.currentRoute),
            history: this.history
        };
    }

    /**
     * Get all available routes
     */
    getAllRoutes() {
        return Array.from(this.routes.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    /**
     * Check if route exists
     */
    routeExists(routeName) {
        return this.routes.has(routeName);
    }

    /**
     * Add new route dynamically
     */
    addRoute(name, routeData) {
        this.routes.set(name, routeData);
    }

    /**
     * Remove route
     */
    removeRoute(name) {
        this.routes.delete(name);
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
     * Generate URL for route
     */
    getRouteUrl(routeName) {
        const route = this.routes.get(routeName);
        return route ? route.path : '/';
    }

    /**
     * Build breadcrumb navigation
     */
    getBreadcrumbs() {
        const breadcrumbs = [];
        
        // Always start with dashboard
        if (this.currentRoute !== 'dashboard') {
            breadcrumbs.push({
                name: 'Dashboard',
                route: 'dashboard',
                url: this.getRouteUrl('dashboard')
            });
        }
        
        // Add current route if not dashboard
        if (this.currentRoute && this.currentRoute !== 'dashboard') {
            const currentRouteData = this.routes.get(this.currentRoute);
            if (currentRouteData) {
                breadcrumbs.push({
                    name: currentRouteData.title.split(' - ')[0],
                    route: this.currentRoute,
                    url: this.getRouteUrl(this.currentRoute),
                    current: true
                });
            }
        }
        
        return breadcrumbs;
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