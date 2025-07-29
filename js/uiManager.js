/**
 * UI Manager - Handles dynamic UI rendering and component management
 * Manages the rendering of all components and their interactions
 */

class UIManager {
    constructor() {
        this.currentView = 'dashboard';
        this.components = {};
        this.animationQueue = [];
        this.bindEvents();
    }

    /**
     * Bind global UI events
     */
    bindEvents() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-item')) {
                this.handleNavigation(e.target);
            }
            
            if (e.target.classList.contains('session-edit')) {
                this.handleSessionEdit(e.target);
            }
            
            if (e.target.classList.contains('session-delete')) {
                this.handleSessionDelete(e.target);
            }
        });

        // Handle theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // Handle period selector for training hours chart
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('period-btn')) {
                this.handlePeriodSelection(e.target);
            }
        });

        // Handle modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Handle filter changes and search
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('session-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'session-search') {
                this.handleSearchChange(e.target.value);
            }
        });

        // Listen for sessions updates
        window.addEventListener('sessionsUpdated', (e) => {
            this.updateSessionsList(e.detail?.sessions);
            if (this.currentView === 'dashboard') {
                this.updateDashboard();
            }
        });

        // Listen for belt unlocks
        window.addEventListener('beltUnlocked', () => {
            if(this.currentView === 'rewards') {
            this.updateBeltDisplay();
            }
            if(this.currentView === 'dashboard') {
                this.updateDashboardBeltProgress();
                this.updateDashboard();
            }
        });

        // Listen for prediction updates
        window.addEventListener('predictionsUpdated', () => {
            if (this.currentView === 'stats') {
                this.updatePredictionsDisplay();
            }
        });
    }

    /**
     * Initialize the application UI
     */
    async init() {
        this.showLoadingScreen();
        
        try {
            await this.loadComponents();
            await this.renderInitialView();
            this.hideLoadingScreen();
            this.addPageTransitions();
        } catch (error) {
            console.error('Failed to initialize UI:', error);
            this.showErrorScreen(error.message);
        }
    }

    /**
     * Load all HTML components
     */
    async loadComponents() {
        const componentNames = [
            'header',
            'session-form',
            'session-list',
            'calendar',
            'stats',
            'rewards',
            'achievements',
            'settings'
        ];

        const loadPromises = componentNames.map(name => this.loadComponent(name));
        await Promise.all(loadPromises);
    }

    /**
     * Load individual component
     */
    async loadComponent(name) {
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            // Use inline components for file:// protocol to avoid CORS issues
            this.components[name] = this.createInlineComponent(name);
            return;
        }
        
        try {
            const response = await fetch(`components/${name}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${name} component`);
            }
            const html = await response.text();
            this.components[name] = html;
        } catch (error) {
            console.warn(`Component ${name} not found, creating inline`);
            this.components[name] = this.createInlineComponent(name);
        }
    }

    /**
     * Create inline component when HTML file is not available
     */
    createInlineComponent(name) {
        switch (name) {
            case 'header':
                return this.createHeaderComponent();
            case 'session-form':
                return this.createSessionFormComponent();
            case 'session-list':
                return this.createSessionListComponent();
            case 'calendar':
                return this.createCalendarComponent();
            case 'stats':
                return this.createStatsComponent();
            case 'rewards':
                return this.createRewardsComponent();
            case 'achievements':
                return this.createAchievementsComponent();
            case 'settings':
                return this.createSettingsComponent();
            default:
                return '<div>Component not found</div>';
        }
    }

    /**
     * Create header component
     */
    createHeaderComponent() {
        return `
            <header class="header">
                <div class="header-content">
                    <div class="logo">
                        <i class="fas fa-fist-raised"></i>
                        <span>Kung Fu Tracker</span>
                    </div>
                    <nav class="nav">
                        <div class="nav-item active" data-view="dashboard">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </div>
                        <div class="nav-item" data-view="session-form">
                            <i class="fas fa-plus"></i>
                            <span>Add Session</span>
                        </div>
                        <div class="nav-item" data-view="session-list">
                            <i class="fas fa-list"></i>
                            <span>Sessions</span>
                        </div>
                        <div class="nav-item" data-view="calendar">
                            <i class="fas fa-calendar"></i>
                            <span>Calendar</span>
                        </div>
                        <div class="nav-item" data-view="stats">
                            <i class="fas fa-chart-bar"></i>
                            <span>Statistics</span>
                        </div>
                        <div class="nav-item" data-view="rewards">
                            <i class="fas fa-trophy"></i>
                            <span>Belts</span>
                        </div>
                        <div class="nav-item" data-view="achievements">
                            <i class="fas fa-medal"></i>
                            <span>Achievements</span>
                        </div>
                        <div class="nav-item" data-view="settings">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </div>
                    </nav>
                </div>
            </header>
            <button class="theme-toggle" title="Toggle Theme">
                <i class="fas fa-sun"></i>
            </button>
        `;
    }

    /**
     * Create session form component
     */
    createSessionFormComponent() {
        const trainingTypes = sessionManager.getTrainingTypes();
        const typeOptions = trainingTypes.map(type => 
            `<option value="${type}">${type}</option>`
        ).join('');

        return `
            <div class="session-form-container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="form-title">Add New Training Session</h2>
                    </div>
                    <div class="card-body">
                        <form id="session-form" class="session-form">
                            <div class="form-group">
                                <label for="session-date" class="form-label">Date</label>
                                <input type="date" id="session-date" name="date" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="session-duration" class="form-label">Duration (minutes)</label>
                                <input type="number" id="session-duration" name="duration" class="form-input" 
                                       min="1" max="480" required placeholder="60">
                            </div>
                            
                            <div class="form-group">
                                <label for="session-type" class="form-label">Training Type</label>
                                <select id="session-type" name="type" class="form-select" required>
                                    <option value="">Select training type...</option>
                                    ${typeOptions}
                                </select>
                                <div id="training-effectiveness-info" class="training-effectiveness-info" style="display: none;">
                                    <div class="effectiveness-badge">
                                        <span class="effectiveness-label">Effectiveness:</span>
                                        <span id="effectiveness-percentage" class="effectiveness-percentage">100%</span>
                                    </div>
                                    <div class="effectiveness-description">
                                        <span id="effectiveness-description-text">Full effectiveness</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="session-notes" class="form-label">Notes (optional)</label>
                                <textarea id="session-notes" name="notes" class="form-textarea" 
                                          placeholder="Describe your training session, techniques practiced, insights gained..."></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i>
                                    Add Session
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="sessionManager.cancelEdit()">
                                    <i class="fas fa-times"></i>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create session list component
     */
    createSessionListComponent() {
        return `
            <div class="session-list-container">
                <div class="filters-container">
                    <div class="filters-row">
                        <div class="search-box">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" id="session-search" class="form-input" placeholder="Search sessions...">
                        </div>
                        <div class="form-group">
                            <select name="type" class="form-select session-filter">
                                <option value="all">All Types</option>
                                ${sessionManager.getTrainingTypes().map(type => 
                                    `<option value="${type}">${type}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="date" name="startDate" class="form-input session-filter" placeholder="Start Date">
                        </div>
                        <div class="form-group">
                            <input type="date" name="endDate" class="form-input session-filter" placeholder="End Date">
                        </div>
                    </div>
                </div>
                <div id="sessions-container" class="sessions-grid">
                    <!-- Sessions will be rendered here -->
                </div>
            </div>
        `;
    }

    /**
     * Create calendar component
     */
    createCalendarComponent() {
        return `
            <div class="calendar-section">
                <div class="calendar-container">
                    <div class="calendar-header">
                        <h2 id="calendar-title"></h2>
                        <div class="calendar-nav">
                            <button class="btn btn-icon" id="prev-month">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="btn btn-icon" id="next-month">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="calendar-grid" id="calendar-grid">
                        <!-- Calendar will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create stats component (now includes predictions)
     */
    createStatsComponent() {
        return `
            <div class="stats-section">
                <div class="view-header">
                    <h1><i class="fas fa-chart-bar"></i> Statistics & Predictions</h1>
                    <p>Comprehensive training analytics and future progress forecasts</p>
                </div>
                
                <!-- Charts Section -->
                <div class="charts-grid grid grid-2">
                    <div class="chart-wrapper">
                        <div class="chart-header">
                            <h3 class="chart-title">Training Hours & Sessions Over Time</h3>
                            <div class="chart-controls">
                                <div class="period-selector">
                                    <button class="period-btn" data-period="daily">Daily</button>
                                    <button class="period-btn active" data-period="weekly">Weekly</button>
                                    <button class="period-btn" data-period="monthly">Monthly</button>
                                    <button class="period-btn" data-period="yearly">Yearly</button>
                                </div>
                                <div class="chart-info">
                                    <i class="fas fa-info-circle" title="Swipe left/right on chart to adjust time range"></i>
                                </div>
                            </div>
                        </div>
                        <canvas id="training-hours-chart" class="chart-canvas"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">Training Types Distribution</h3>
                        <canvas id="training-types-chart" class="chart-canvas"></canvas>
                    </div>
                </div>

                <!-- Predictions Section -->
                <div class="predictions-container">
                    <div class="section-header">
                        <h2><i class="fas fa-crystal-ball"></i> Training Predictions</h2>
                        <p>Forecast your future training progress and belt achievements</p>
                    </div>
                    
                    <!-- Prediction Summary Cards -->
                    <div class="predictions-summary grid grid-3">
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <i class="fas fa-calendar-week"></i>
                                <h3>Next Week</h3>
                            </div>
                            <div class="prediction-value" id="weekly-prediction">0 hours</div>
                            <div class="prediction-confidence" id="weekly-confidence">0% confidence</div>
                        </div>
                        
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <i class="fas fa-calendar-alt"></i>
                                <h3>Next Month</h3>
                            </div>
                            <div class="prediction-value" id="monthly-prediction">0 hours</div>
                            <div class="prediction-confidence" id="monthly-confidence">0% confidence</div>
                        </div>
                        
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <i class="fas fa-calendar"></i>
                                <h3>Next Year</h3>
                            </div>
                            <div class="prediction-value" id="yearly-prediction">0 hours</div>
                            <div class="prediction-confidence" id="yearly-confidence">0% confidence</div>
                        </div>
                    </div>

                    <!-- Belt Progression Predictions -->
                    <div class="card">
                        <div class="card-header">
                            <h2><i class="fas fa-trophy"></i> Belt Progression Forecast</h2>
                        </div>
                        <div class="card-body" id="belt-progression-predictions">
                            <!-- Belt predictions will be loaded here -->
                        </div>
                    </div>

                    <!-- Training Milestones -->
                    <div class="card">
                        <div class="card-header">
                            <h2><i class="fas fa-flag-checkered"></i> Upcoming Milestones</h2>
                        </div>
                        <div class="card-body" id="milestone-predictions">
                            <!-- Milestone predictions will be loaded here -->
                        </div>
                    </div>

                    <!-- Training Trends & Analysis -->
                    <div class="predictions-analysis grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h2><i class="fas fa-chart-line"></i> Training Trends</h2>
                            </div>
                            <div class="card-body" id="training-trends">
                                <!-- Trend analysis will be loaded here -->
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h2><i class="fas fa-lightbulb"></i> Recommendations</h2>
                            </div>
                            <div class="card-body" id="training-recommendations">
                                <!-- Recommendations will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Weekly Pattern Analysis -->
                    <div class="card">
                        <div class="card-header">
                            <h2><i class="fas fa-calendar-week"></i> Weekly Training Pattern</h2>
                        </div>
                        <div class="card-body" id="weekly-pattern">
                            <!-- Weekly pattern analysis will be loaded here -->
                        </div>
                    </div>

                    <!-- Prediction Settings -->
                    <div class="card">
                        <div class="card-header">
                            <h2><i class="fas fa-cog"></i> Prediction Settings</h2>
                        </div>
                        <div class="card-body">
                            <div class="prediction-settings">
                                <div class="setting-group">
                                    <label for="prediction-model">Prediction Model:</label>
                                    <select id="prediction-model" class="form-control">
                                        <option value="adaptive">Adaptive (Recommended)</option>
                                        <option value="linear">Linear</option>
                                        <option value="seasonal">Seasonal</option>
                                        <option value="exponential">Exponential</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary" onclick="uiManager.updatePredictionsDisplay()">
                                    <i class="fas fa-sync"></i> Update Predictions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }



    /**
     * Create rewards component
     */
    createRewardsComponent() {
        return `
            <div class="view" id="rewards-view">
                <div class="main-header">
                    <h1 class="view-title">Belt Progression</h1>
                    <p class="view-subtitle">Your journey through the ranks of Kung Fu, measured in dedication and time.</p>
                    </div>
                    
                <div class="current-belt-overview card">
                    <div class="belt-progress-top-section">
                        <div id="current-belt-main-display" class="current-belt-display">
                            <!-- Current belt icon loads here -->
                        </div>
                        <div class="current-belt-progress">
                            <div class="progress-info">
                                <span>Progress to next sash</span>
                                <span id="progress-percentage">0%</span>
                            </div>
                            <div id="belt-progress-bar" class="progress-bar">
                                <div id="belt-progress-fill" class="progress-fill"></div>
                            </div>
                            <div id="progress-hours-display" class="progress-hours">0 / 0 hours</div>
                        </div>
                    </div>
                    <div id="current-belt-characteristics" class="characteristics-container">
                        <!-- Characteristics will be loaded here -->
                    </div>
                    </div>
                    
                <div class="all-belts-container">
                    <h2 class="container-title">All Sashes</h2>
                    <div class="sash-grid" id="sash-grid">
                        <!-- All sashes will be dynamically rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create achievements component
     */
    createAchievementsComponent() {
        return `
            <div class="view" id="achievements-view">
                <div class="main-header">
                    <h1 class="view-title">Achievements</h1>
                    <p class="view-subtitle">Your collection of unlocked badges and martial arts honors</p>
                </div>
                <div class="achievements-grid" id="achievements-grid">
                    <!-- Achievements will be dynamically loaded here -->
                </div>
            </div>
        `;
    }

    /**
     * Create settings component
     */
    createSettingsComponent() {
        return `
            <div class="view" id="settings-view">
                <div class="main-header">
                    <h1 class="view-title">Settings</h1>
                    <p class="view-subtitle">Manage your application data and preferences.</p>
                </div>
                <div class="settings-container">
                    <div class="setting-card card">
                        <h3>Data Management</h3>
                        <p>Export your training data to a file, or import it to restore your progress.</p>
                        <div class="form-actions">
                            <button class="btn btn-primary" id="export-data-btn"><i class="fas fa-download"></i> Export Data</button>
                            <button class="btn btn-secondary" id="import-data-btn"><i class="fas fa-upload"></i> Import Data</button>
                            <input type="file" id="import-file-input" style="display: none;" accept="application/json">
                        </div>
                    </div>
                    <div class="setting-card card">
                        <h3>Danger Zone</h3>
                        <p>Permanently delete all your sessions, progress, and achievements. This cannot be undone.</p>
                        <div class="form-actions">
                            <button class="btn btn-error" id="clear-data-btn"><i class="fas fa-exclamation-triangle"></i> Clear All Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render initial view
     */
    async renderInitialView() {
        await this.renderView('dashboard');
        this.initializeComponents();
    }

    /**
     * Render specific view
     */
    async renderView(viewName) {
        const app = document.getElementById('app');
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content page-enter';
        
        // Add header
        mainContent.innerHTML = this.components.header;
        
        // Add view-specific content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'view-content';
        
        switch (viewName) {
            case 'dashboard':
                contentDiv.innerHTML = this.createDashboard();
                break;
            case 'session-form':
                contentDiv.innerHTML = this.components['session-form'];
                break;
            case 'session-list':
                contentDiv.innerHTML = this.components['session-list'];
                break;
            case 'calendar':
                contentDiv.innerHTML = this.components.calendar;
                break;
            case 'stats':
                contentDiv.innerHTML = this.components.stats;
                break;
            case 'rewards':
                contentDiv.innerHTML = this.components.rewards;
                break;
            case 'achievements':
                contentDiv.innerHTML = this.components.achievements;
                break;
            case 'settings':
                contentDiv.innerHTML = this.components.settings;
                break;
        }
        
        mainContent.appendChild(contentDiv);
        
        // Clear and add new content
        app.innerHTML = '';
        app.appendChild(mainContent);
        
        // Trigger enter animation
        setTimeout(() => {
            mainContent.classList.remove('page-enter');
            mainContent.classList.add('page-enter-active');
        }, 50);
        
        this.currentView = viewName;
        this.updateNavigation();
        this.initializeViewComponents(viewName);
    }

    /**
     * Create dashboard view
     */
    createDashboard() {
        return `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>Training Dashboard</h1>
                    <p id="dashboard-greeting">Welcome back, warrior!</p>
                </div>
                
                <div class="dashboard-stats grid grid-3">
                    <div class="stats-card hover-lift">
                        <i class="fas fa-clock stats-icon"></i>
                        <div class="stats-value" id="dash-total-hours">0</div>
                        <div class="stats-label">Total Hours</div>
                    </div>
                    <div class="stats-card hover-lift">
                        <i class="fas fa-calendar-check stats-icon"></i>
                        <div class="stats-value" id="dash-total-sessions">0</div>
                        <div class="stats-label">Total Sessions</div>
                    </div>
                    <div class="stats-card hover-lift">
                        <i class="fas fa-trophy stats-icon"></i>
                        <div class="stats-value" id="dash-current-belt">White</div>
                        <div class="stats-label">Current Belt</div>
                    </div>
                </div>
                
                <div class="dashboard-content grid grid-2">
                    <div class="recent-sessions card">
                        <div class="card-header">
                            <h3>Recent Sessions</h3>
                            <a href="#" class="nav-item" data-view="session-list">View All</a>
                        </div>
                        <div class="card-body" id="recent-sessions">
                            <!-- Recent sessions will be rendered here -->
                        </div>
                    </div>
                    
                    <div class="belt-progress card">
                        <div class="card-header">
                            <h3>Belt Progress</h3>
                            <a href="#" class="nav-item" data-view="rewards">View Details</a>
                        </div>
                        <div class="card-body" id="dashboard-belt-progress">
                            <!-- Belt progress will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize view-specific components
     */
    initializeViewComponents(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'session-form':
                this.initializeSessionForm();
                break;
            case 'session-list':
                this.updateSessionsList();
                break;
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'stats':
                this.initializeStats();
                break;
            case 'rewards':
                this.updateBeltDisplay();
                break;
            case 'achievements':
                this.updateAchievements();
                break;
            case 'settings':
                this.initializeSettings();
                break;
        }
    }

    /**
     * Initialize session form
     */
    initializeSessionForm() {
        const dateInput = document.getElementById('session-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Update sessions list
     */
    updateSessionsList(sessions) {
        const container = document.getElementById('sessions-container');
        if (!container) {
            // Retry after a short delay to ensure DOM is ready
            setTimeout(() => this.updateSessionsList(sessions), 100);
            return;
        }

        const sessionsToShow = sessions || (sessionManager ? sessionManager.getFilteredSessions() : []);
        
        if (sessionsToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <h3>No Training Sessions Found</h3>
                    <p>Start your Kung Fu journey by adding your first training session!</p>
                    <button class="btn btn-primary nav-item" data-view="session-form">
                        <i class="fas fa-plus"></i>
                        Add Your First Session
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = sessionsToShow.map(session => 
            this.createSessionCard(session)
        ).join('');
    }

    /**
     * Create session card HTML
     */
    createSessionCard(session) {
        const weight = sessionManager.getTrainingTypeWeight(session.type);
        const effectiveDuration = Math.round(session.duration * weight);
        const durationDisplay = weight < 1.0 
            ? `${sessionManager.formatDuration(session.duration)} → ${sessionManager.formatDuration(effectiveDuration)} effective`
            : sessionManager.formatDuration(session.duration);
        
        return `
            <div class="session-card animate-fadeIn">
                <div class="session-header">
                    <div class="session-date">${sessionManager.formatDate(session.date)}</div>
                    <div class="session-duration ${weight < 1.0 ? 'reduced-effectiveness' : ''}">${durationDisplay}</div>
                </div>
                <div class="session-type">${session.type}</div>
                <div class="session-notes">${session.notes || 'No notes provided'}</div>
                <div class="session-actions">
                    <button class="btn btn-icon session-edit" data-session-id="${session.id}" title="Edit Session">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon session-delete" data-session-id="${session.id}" title="Delete Session">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle session edit
     */
    handleSessionEdit(target) {
        const sessionId = target.closest('[data-session-id]').dataset.sessionId;
        sessionManager.editSession(sessionId);
    }

    /**
     * Handle session delete
     */
    handleSessionDelete(target) {
        const sessionId = target.closest('[data-session-id]').dataset.sessionId;
        sessionManager.deleteSession(sessionId);
    }

    /**
     * Initialize calendar
     */
    initializeCalendar() {
        this.renderCalendar();
        this.bindCalendarEvents();
    }

    /**
     * Render calendar
     */
    renderCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        this.currentCalendarDate = { year, month };
        this.updateCalendarDisplay();
    }

    /**
     * Update calendar display
     */
    updateCalendarDisplay() {
        const { year, month } = this.currentCalendarDate;
        const date = new Date(year, month);
        
        // Update title
        const titleElement = document.getElementById('calendar-title');
        if (titleElement) {
            titleElement.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }

        // Update grid
        const gridElement = document.getElementById('calendar-grid');
        if (gridElement) {
            gridElement.innerHTML = this.generateCalendarGrid(year, month);
        }
    }

    /**
     * Generate calendar grid
     */
    generateCalendarGrid(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        const sessions = sessionManager.getSessionsForMonth(year, month);
        
        // Create session map for quick lookup
        const sessionMap = {};
        sessions.forEach(session => {
            sessionMap[session.date] = (sessionMap[session.date] || 0) + 1;
        });

        let html = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Add empty cells for days before month starts
        const startDay = firstDay.getDay();
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            // Generate date in local YYYY-MM-DD format
            const dateStr = currentDate.getFullYear() + '-' +
                String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(currentDate.getDate()).padStart(2, '0');
            const isToday = currentDate.toDateString() === today.toDateString();
            const hasSession = sessionMap[dateStr];
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasSession) classes += ' has-session';
            
            html += `
                <div class="${classes}" data-date="${dateStr}">
                    ${day}
                </div>
            `;
        }

        return html;
    }

    /**
     * Bind calendar events
     */
    bindCalendarEvents() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentCalendarDate.month--;
                if (this.currentCalendarDate.month < 0) {
                    this.currentCalendarDate.month = 11;
                    this.currentCalendarDate.year--;
                }
                this.updateCalendarDisplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentCalendarDate.month++;
                if (this.currentCalendarDate.month > 11) {
                    this.currentCalendarDate.month = 0;
                    this.currentCalendarDate.year++;
                }
                this.updateCalendarDisplay();
            });
        }
    }

    /**
     * Initialize stats (now includes predictions)
     */
    initializeStats() {
        if (window.chartManager) {
            chartManager.initializeCharts();
        }
        this.updateStatsDisplay();
        
        // Initialize predictions functionality
        this.updatePredictionsDisplay();
        
        // Bind prediction model change event
        const modelSelect = document.getElementById('prediction-model');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                statisticsPredictor.setPredictionModel(e.target.value);
                this.updatePredictionsDisplay();
            });
        }
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const stats = storage.getStats();

        if (window.chartManager) {
            chartManager.updateCharts(stats);
        }
    }

    /**
     * Update belt display on rewards page
     */
    updateBeltDisplay() {
        const stats = storage.getStats();
        const currentBelt = rewardSystem.getCurrentBelt();
        const beltProgress = rewardSystem.getBeltProgress();
        const allBelts = rewardSystem.getAllBelts();
        
        // Update main progress display
        const currentBeltDisplay = document.getElementById('current-belt-main-display');
        if (currentBeltDisplay) {
            currentBeltDisplay.innerHTML = `
                <div class="sash-badge">${currentBelt.badge}</div>
                <div class="sash-details">
                    <div class="sash-title">${currentBelt.title.replace(currentBelt.badge, '').trim()}</div>
                    <div class="sash-level">${currentBelt.level}</div>
                </div>
            `;
        }

        const progressFill = document.getElementById('belt-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${beltProgress.progress}%`;
        }
        
        const progressPercentage = document.getElementById('progress-percentage');
        if (progressPercentage) {
            progressPercentage.textContent = `${beltProgress.progress}%`;
        }
        
        const progressHours = document.getElementById('progress-hours-display');
        if (progressHours && beltProgress.nextBelt) {
            const nextBeltReqs = storage.getBeltRequirements()[beltProgress.nextBelt.name];
            const hoursReq = nextBeltReqs.find(r => r.type === 'totalHours');
            if (hoursReq) {
                progressHours.textContent = `${Math.floor(stats.totalHours || 0)} / ${hoursReq.value} hours`;
            }
        } else if (progressHours) {
             progressHours.textContent = "All sashes earned! Mastery achieved!";
        }

        // Add characteristics for the current belt
        const characteristicsContainer = document.getElementById('current-belt-characteristics');
        if (characteristicsContainer) {
            if (currentBelt.characteristics && currentBelt.characteristics.length > 0) {
                characteristicsContainer.innerHTML = `
                    <h4 class="container-title">Key Characteristics of this Rank</h4>
                    <ul class="characteristics-list">
                        ${currentBelt.characteristics.map(char => `<li><i class="fas fa-check-circle"></i> ${char}</li>`).join('')}
                    </ul>
                `;
            } else {
                characteristicsContainer.innerHTML = ''; // Clear if no characteristics
            }
        }

        // Update sash grid
        const sashGrid = document.getElementById('sash-grid');
        if (sashGrid) {
            sashGrid.innerHTML = allBelts.map(belt => {
                const reqs = storage.getBeltRequirements()[belt.name];
                const hoursReq = reqs && reqs.length > 0 ? reqs.find(r => r.type === 'totalHours') : null;
                
                return `
                    <div class="sash-card ${belt.unlocked ? 'unlocked' : 'locked'}">
                        <div class="sash-badge small">${belt.badge}</div>
                        <div class="sash-details">
                            <div class="sash-title">${belt.title.replace(belt.badge, '').trim()}</div>
                            ${!belt.unlocked && hoursReq ? 
                                `<div class="sash-requirement">
                                    <i class="fas fa-clock"></i>
                                    <span>${hoursReq.value} hours</span>
                                </div>` : ''
                            }
                            ${belt.unlocked ? `<div class="sash-unlocked-badge"><i class="fas fa-check"></i> Unlocked</div>` : ''}
                        </div>
            </div>
        `;
            }).join('');
        }
    }

    /**
     * Initialize components on first load
     */
    initializeComponents() {
        // Set today's date as default for session form
        const dateInput = document.getElementById('session-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Handle navigation
     */
    handleNavigation(navItem) {
        const viewName = navItem.dataset.view;
        if (viewName && viewName !== this.currentView) {
            this.renderView(viewName);
        }
    }

    /**
     * Handle period selection for training hours chart
     */
    handlePeriodSelection(button) {
        const period = button.dataset.period;
        
        // Update active button
        const allButtons = document.querySelectorAll('.period-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update chart period
        if (window.chartManager) {
            window.chartManager.changePeriodType(period);
        }
    }

    /**
     * Update navigation active state
     */
    updateNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === this.currentView) {
                item.classList.add('active');
            }
        });
    }



    /**
     * Update predictions display
     */
    updatePredictionsDisplay() {
        const predictions = statisticsPredictor.getPredictions();
        
        // Update summary cards
        this.updatePredictionSummary(predictions);
        
        // Update belt progression
        this.updateBeltProgressionPredictions(predictions.beltProgression);
        
        // Update milestones
        this.updateMilestonePredictions(predictions.milestones);
        
        // Update trends
        this.updateTrainingTrends(predictions.trends);
        
        // Update recommendations
        this.updateTrainingRecommendations(predictions.recommendations);
        
        // Update weekly pattern
        this.updateWeeklyPattern(predictions);
    }

    /**
     * Update prediction summary cards
     */
    updatePredictionSummary(predictions) {
        // Weekly prediction
        const weeklyElement = document.getElementById('weekly-prediction');
        const weeklyConfidenceElement = document.getElementById('weekly-confidence');
        if (weeklyElement && weeklyConfidenceElement) {
            weeklyElement.textContent = `${predictions.weeklyPrediction.hours} hours`;
            weeklyConfidenceElement.textContent = `${predictions.weeklyPrediction.confidence}% confidence`;
        }
        
        // Monthly prediction
        const monthlyElement = document.getElementById('monthly-prediction');
        const monthlyConfidenceElement = document.getElementById('monthly-confidence');
        if (monthlyElement && monthlyConfidenceElement) {
            monthlyElement.textContent = `${predictions.monthlyPrediction.hours} hours`;
            monthlyConfidenceElement.textContent = `${predictions.monthlyPrediction.confidence}% confidence`;
        }
        
        // Yearly prediction
        const yearlyElement = document.getElementById('yearly-prediction');
        const yearlyConfidenceElement = document.getElementById('yearly-confidence');
        if (yearlyElement && yearlyConfidenceElement) {
            yearlyElement.textContent = `${predictions.yearlyPrediction.hours} hours`;
            yearlyConfidenceElement.textContent = `${predictions.yearlyPrediction.confidence}% confidence`;
        }
    }

    /**
     * Update belt progression predictions
     */
    updateBeltProgressionPredictions(beltProgression) {
        const container = document.getElementById('belt-progression-predictions');
        if (!container) return;
        
        if (beltProgression.message) {
            container.innerHTML = `<p class="text-center">${beltProgression.message}</p>`;
            return;
        }
        
        if (!beltProgression.predictions || beltProgression.predictions.length === 0) {
            container.innerHTML = `<p class="text-center">No belt progressions predicted with current training rate.</p>`;
            return;
        }
        
        let html = `
            <div class="current-belt-info">
                <h3>Current: ${beltProgression.currentBelt.title}</h3>
                <p>Training Hours: ${beltProgression.currentBelt.hours}</p>
                <p>Monthly Rate: ${beltProgression.monthlyRate} hours/month</p>
                <p class="prediction-summary">Showing progression for all ${beltProgression.predictions.length} remaining belts</p>
            </div>
            <div class="belt-predictions">
        `;
        
        let currentGroup = '';
        beltProgression.predictions.forEach((prediction, index) => {
            // Add group headers for visual organization
            const isBlackBelt = prediction.belt.startsWith('black-');
            const newGroup = isBlackBelt ? 'Black Belt Degrees' : 'Colored Belts';
            
            if (newGroup !== currentGroup) {
                if (index > 0) html += '</div>'; // Close previous group
                html += `<div class="belt-group">
                    <h3 class="belt-group-title">${newGroup}</h3>
                    <div class="belt-group-items">`;
                currentGroup = newGroup;
            }
            
            const confidenceClass = prediction.confidence > 70 ? 'high' : prediction.confidence > 40 ? 'medium' : 'low';
            const beltClass = isBlackBelt ? 'black-belt' : 'colored-belt';
            
            html += `
                <div class="belt-prediction-item ${beltClass}">
                    <div class="belt-info">
                        <h4>${prediction.beltTitle}</h4>
                        <p class="hours-needed">${prediction.hoursNeeded} more hours needed (${prediction.hoursRequired} total)</p>
                    </div>
                    <div class="time-estimate">
                        <span class="estimate">${prediction.timeEstimate}</span>
                        <span class="date">${prediction.estimatedDate || ''}</span>
                        <div class="confidence confidence-${confidenceClass}">
                            ${prediction.confidence}% confidence
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (beltProgression.predictions.length > 0) {
            html += '</div></div>'; // Close last group
            
            // Add note for long-term predictions
            const lastPrediction = beltProgression.predictions[beltProgression.predictions.length - 1];
            if (lastPrediction && lastPrediction.months > 60) {
                html += `
                    <div class="long-term-note">
                        <i class="fas fa-info-circle"></i>
                        <p>Long-term predictions (beyond 5 years) are estimates based on current training patterns. 
                        Actual progress may vary with changes in training intensity, life circumstances, and personal goals.</p>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Update milestone predictions
     */
    updateMilestonePredictions(milestones) {
        const container = document.getElementById('milestone-predictions');
        if (!container) return;
        
        if (!milestones || milestones.length === 0) {
            container.innerHTML = `<p class="text-center">No upcoming milestones to predict.</p>`;
            return;
        }
        
        let html = '<div class="milestone-list">';
        milestones.forEach(milestone => {
            const confidenceClass = milestone.confidence > 70 ? 'high' : milestone.confidence > 40 ? 'medium' : 'low';
            html += `
                <div class="milestone-item">
                    <div class="milestone-icon">${milestone.emoji}</div>
                    <div class="milestone-info">
                        <h4>${milestone.name}</h4>
                        <p>${milestone.hoursNeeded} hours needed (${milestone.hours} total)</p>
                    </div>
                    <div class="milestone-estimate">
                        <span class="time">${milestone.timeEstimate}</span>
                        <span class="date">${milestone.estimatedDate}</span>
                        <div class="confidence confidence-${confidenceClass}">
                            ${milestone.confidence}% confidence
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Update training trends
     */
    updateTrainingTrends(trends) {
        const container = document.getElementById('training-trends');
        if (!container) return;
        
        const html = `
            <div class="trends-overview">
                <div class="trend-item">
                    <h4><i class="fas fa-chart-line"></i> Overall Trend</h4>
                    <p class="trend-direction trend-${trends.overall.direction}">
                        <i class="fas fa-arrow-${trends.overall.direction === 'up' ? 'up' : trends.overall.direction === 'down' ? 'down' : 'right'}"></i>
                        ${trends.overall.description}
                    </p>
                    <span class="trend-rate">${trends.overall.rate}% change</span>
                </div>
                
                <div class="trend-item">
                    <h4><i class="fas fa-clock"></i> Consistency</h4>
                    <p>Score: ${trends.consistency.score}/100 (${trends.consistency.level})</p>
                    <span class="trend-status trend-${trends.consistency.trend.toLowerCase().replace(' ', '-')}">${trends.consistency.trend}</span>
                </div>
                
                <div class="trend-item">
                    <h4><i class="fas fa-calendar-check"></i> Frequency</h4>
                    <p>Current: ${trends.frequency.current.toFixed(1)} sessions/week</p>
                    <p>Target: ${trends.frequency.target} sessions/week</p>
                    <span class="trend-status trend-${trends.frequency.status.toLowerCase().replace(' ', '-')}">${trends.frequency.status}</span>
                </div>
                
                <div class="trend-item">
                    <h4><i class="fas fa-leaf"></i> Seasonal Pattern</h4>
                    <p>Best: ${trends.seasonal.bestMonth.month} (${trends.seasonal.bestMonth.hours}h)</p>
                    <p>Variation: ${trends.seasonal.variation.variation}%</p>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Update training recommendations
     */
    updateTrainingRecommendations(recommendations) {
        const container = document.getElementById('training-recommendations');
        if (!container) return;
        
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `<p class="text-center">Great job! No specific recommendations at this time.</p>`;
            return;
        }
        
        let html = '<div class="recommendations-list">';
        recommendations.forEach(rec => {
            const priorityClass = `priority-${rec.priority}`;
            const priorityIcon = rec.priority === 'high' ? 'exclamation-triangle' : 
                                rec.priority === 'medium' ? 'info-circle' : 'lightbulb';
            
            html += `
                <div class="recommendation-item ${priorityClass}">
                    <div class="rec-header">
                        <i class="fas fa-${priorityIcon}"></i>
                        <h4>${rec.title}</h4>
                        <span class="priority-badge">${rec.priority}</span>
                    </div>
                    <p class="rec-description">${rec.description}</p>
                    <p class="rec-action"><strong>Action:</strong> ${rec.action}</p>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Update weekly pattern display
     */
    updateWeeklyPattern(predictions) {
        const container = document.getElementById('weekly-pattern');
        if (!container) return;
        
        if (!predictions || !predictions.trends || !predictions.trends.overall) {
            container.innerHTML = `<p>Insufficient data for weekly pattern analysis.</p>`;
            return;
        }
        
        // Get weekly pattern from predictions (this would need to be added to the predictor)
        const sessions = storage.getAllSessions();
        if (sessions.length === 0) {
            container.innerHTML = `<p>No training data available for pattern analysis.</p>`;
            return;
        }
        
        // Calculate weekly pattern
        const weeklyPattern = statisticsPredictor.analyzeTrainingPattern(sessions).weeklyPattern;
        
        let html = '<div class="weekly-pattern-chart">';
        weeklyPattern.forEach(day => {
            const percentage = day.percentage;
            const height = Math.max(5, percentage * 2); // Min height of 5px
            
            html += `
                <div class="day-column">
                    <div class="day-bar" style="height: ${height}px" title="${day.sessionCount} sessions (${percentage}%)"></div>
                    <div class="day-label">${day.day.substring(0, 3)}</div>
                    <div class="day-stats">
                        <small>${day.sessionCount} sessions</small>
                        <small>${day.averageHours.toFixed(1)}h avg</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    /**
     * Update predictions (called from UI)
     */
    updatePredictions() {
        if (this.currentView === 'stats') {
            this.updatePredictionsDisplay();
        }
    }

    /**
     * Update dashboard
     */
    updateDashboard() {
        const stats = storage.getStats();
        const beltSystem = storage.getBeltSystem();
        
        // Update stats
        this.updateElement('dash-total-hours', Math.floor(stats.totalHours || 0));
        this.updateElement('dash-total-sessions', stats.totalSessions || 0);
        this.updateElement('dash-current-belt', beltSystem.currentBelt || 'White');
        
        // Update recent sessions
        this.updateRecentSessions();
        
        // Update belt progress
        this.updateDashboardBeltProgress();
        
        // Update greeting
        this.updateGreeting();
    }

    /**
     * Update recent sessions on dashboard
     */
    updateRecentSessions() {
        const sessions = storage.getAllSessions()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
        
        const container = document.getElementById('recent-sessions');
        if (!container) return;
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <p>No training sessions yet. Start your journey!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sessions.map(session => {
            const weight = sessionManager.getTrainingTypeWeight(session.type);
            const effectiveDuration = Math.round(session.duration * weight);
            const durationDisplay = weight < 1.0 
                ? `${sessionManager.formatDuration(session.duration)} → ${sessionManager.formatDuration(effectiveDuration)} effective`
                : sessionManager.formatDuration(session.duration);
            
            return `
                <div class="session-summary">
                    <div class="session-info">
                        <strong>${session.type}</strong>
                        <span class="session-duration ${weight < 1.0 ? 'reduced-effectiveness' : ''}">${durationDisplay}</span>
                    </div>
                    <div class="session-date">${sessionManager.getRelativeDate(session.date)}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update dashboard belt progress
     */
    updateDashboardBeltProgress() {
        const container = document.getElementById('dashboard-belt-progress');
        if (!container) return;
        
        const progress = rewardSystem.getBeltProgress();
        const stats = storage.getStats();

        if (!progress.nextBelt) {
        container.innerHTML = `
            <div class="progress-info">
                    <span>Mastery Achieved!</span>
                </div>
                <div class="motivation-message">You have earned the highest sash!</div>
            `;
            return;
        }

        const nextBeltReqs = storage.getBeltRequirements()[progress.nextBelt.name];
        const hoursReq = nextBeltReqs.find(r => r.type === 'totalHours');

        container.innerHTML = `
            <div class="progress-info">
                <span>Next: ${progress.nextBelt.title}</span>
                <span>${Math.floor(stats.totalHours)} / ${hoursReq.value} hrs</span>
            </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progress}%"></div>
                </div>
            <div class="motivation-message">${rewardSystem.getMotivationalMessage()}</div>
        `;
    }

    /**
     * Update greeting message
     */
    updateGreeting() {
        const greetingElement = document.getElementById('dashboard-greeting');
        if (!greetingElement) return;
        
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = "Good morning, warrior!";
        } else if (hour < 18) {
            greeting = "Good afternoon, martial artist!";
        } else {
            greeting = "Good evening, master!";
        }
        
        greetingElement.textContent = greeting;
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Show error screen
     */
    showErrorScreen(message) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="error-screen">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        storage.updateSetting('theme', newTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    /**
     * Update element content with animation
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element && element.textContent !== content.toString()) {
            element.classList.add('animate-pulse');
            element.textContent = content;
            setTimeout(() => {
                element.classList.remove('animate-pulse');
            }, 1000);
        }
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(target) {
        // Delegate to sessionManager
        if (window.sessionManager) {
            sessionManager.handleFilterChange(target);
        }
    }

    /**
     * Handle search changes
     */
    handleSearchChange(searchTerm) {
        // Delegate to sessionManager
        if (window.sessionManager) {
            sessionManager.handleSearchChange(searchTerm);
        }
    }

    /**
     * Add page transition effects
     */
    addPageTransitions() {
        // Add staggered animations to cards
        document.querySelectorAll('.card, .stats-card').forEach((card, index) => {
            card.classList.add(`stagger-${Math.min(index + 1, 5)}`);
            card.classList.add('animate-fadeIn');
        });
    }

    /**
     * Update achievements display
     */
    updateAchievements() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        // 1. Get standard achievements
        const unlockedAchievements = rewardSystem.getUnlockedAchievements();
        const lockedAchievements = rewardSystem.getLockedAchievements();
        const allAchievements = [...unlockedAchievements, ...lockedAchievements];

        // Group standard achievements by category
        const categories = allAchievements.reduce((acc, achievement) => {
            const category = achievement.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(achievement);
            return acc;
        }, {});

        // 2. Get sashes and add them as a new "Sashes" category
        const allSashes = rewardSystem.getAllBelts();
        categories['Sashes'] = allSashes.map(sash => ({
            id: sash.name,
            name: sash.title,
            description: sash.description,
            icon: sash.badge, // Use the badge property from the belt definition
            unlocked: sash.unlocked
        }));
        
        // Define the order for a logical layout
        const categoryOrder = ['Sashes', 'Cumulative Hours', 'Consistency Rewards', 'Session Milestones'];

        let html = '';

        // 3. Render all categories in the specified order
        for (const categoryName of categoryOrder) {
            if (categories[categoryName]) {
                const achievementsInCategory = categories[categoryName];
                html += `<h2 class="achievements-category-title">${categoryName}</h2>`;

                achievementsInCategory.forEach(achievement => {
                    const isUnlocked = achievement.unlocked !== undefined 
                        ? achievement.unlocked 
                        : unlockedAchievements.some(a => a.id === achievement.id);
                    
                    html += `
                        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                            <div class="achievement-card-icon">
                                ${isUnlocked ? achievement.icon : '<i class="fas fa-lock"></i>'}
                            </div>
                            <div class="achievement-card-content">
                                <h3 class="achievement-card-title">${achievement.name}</h3>
                                <p class="achievement-card-description">${achievement.description}</p>
                            </div>
                        </div>
                    `;
                });
            }
        }

        grid.innerHTML = html;
    }

    /**
     * Initialize settings page events
     */
    initializeSettings() {
        const exportBtn = document.getElementById('export-data-btn');
        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-file-input');
        const clearBtn = document.getElementById('clear-data-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportData());
        }

        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => this.handleImportData(e));
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearData());
        }
    }

    /**
     * Handle data export
     */
    handleExportData() {
        const data = storage.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kungfu_tracker_settings.json';
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!', 'success');
    }

    /**
     * Handle data import
     */
    handleImportData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (storage.importData(data)) {
                    this.showMessage('Data imported successfully! The app will now reload.', 'success');
                    // Reload the app to reflect changes
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    this.showMessage('Failed to import data. Please check the file format.', 'error');
                }
            } catch (error) {
                this.showMessage('Invalid JSON file. Please check the file and try again.', 'error');
                console.error('Error parsing imported file:', error);
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Handle clearing all data
     */
    handleClearData() {
        this.showModal(
            'Are you sure?',
            `<p>This will permanently delete all your training data, including sessions, progress, and achievements. This action cannot be undone.</p>
             <p><strong>Are you sure you want to proceed?</strong></p>`,
            () => {
                storage.clearAllData();
                this.showMessage('All data has been cleared. The app will now reload.', 'success');
                setTimeout(() => window.location.reload(), 2000);
            }
        );
    }

    /**
     * Shows a confirmation modal
     * @param {string} title - The title of the modal
     * @param {string} message - The HTML content of the modal body
     * @param {function} onConfirm - The callback function to execute on confirmation
     */
    showModal(title, message, onConfirm) {
        let modal = document.getElementById('confirmation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirmation-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content card">
                    <h2 id="modal-title"></h2>
                    <div id="modal-body"></div>
                    <div class="modal-actions form-actions">
                        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                        <button class="btn btn-error" id="modal-confirm-btn">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('modal-cancel-btn').addEventListener('click', () => this.hideModal());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = message;
        
        const confirmBtn = document.getElementById('modal-confirm-btn');
        // Clone and replace the button to remove old event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal();
        });

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    /**
     * Hides the confirmation modal
     */
    hideModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.classList.remove('visible');
            // Allow animation to finish before hiding
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Shows a temporary message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'.
     */
    showMessage(message, type = 'success') {
        const messageContainer = document.createElement('div');
        messageContainer.className = `toast-message ${type}`;
        messageContainer.textContent = message;

        document.body.appendChild(messageContainer);

        // Animate in
        setTimeout(() => {
            messageContainer.classList.add('visible');
        }, 10);

        // Animate out and remove after a delay
        setTimeout(() => {
            messageContainer.classList.remove('visible');
            messageContainer.addEventListener('transitionend', () => {
                if (messageContainer.parentNode) {
                    messageContainer.parentNode.removeChild(messageContainer);
                }
            }, { once: true });
        }, 3000); // Message visible for 3 seconds
    }

    // Additional methods will be added for specific UI components...
}

// Create global UI manager instance
window.uiManager = new UIManager(); 