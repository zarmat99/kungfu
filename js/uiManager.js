/**
 * UI Manager - Handles dynamic UI rendering and component management
 * Manages the rendering of all components and their interactions
 */

class UIManager {
    constructor() {
        this.currentView = 'dashboard';
        this.components = {};
        this.competitionStatsSpecialtyFilter = 'all';
        this.bindEvents();
    }

    /**
     * Bind global UI events
     */
    bindEvents() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                this.handleNavigation(navItem);
                return;
            }

            const editButton = e.target.closest('.session-edit');
            if (editButton) {
                this.handleSessionEdit(editButton);
                return;
            }

            const deleteButton = e.target.closest('.session-delete');
            if (deleteButton) {
                this.handleSessionDelete(deleteButton);
                return;
            }

            const competitionEditButton = e.target.closest('.competition-edit');
            if (competitionEditButton) {
                this.handleCompetitionEdit(competitionEditButton);
                return;
            }

            const competitionDeleteButton = e.target.closest('.competition-delete');
            if (competitionDeleteButton) {
                this.handleCompetitionDelete(competitionDeleteButton);
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
            const periodButton = e.target.closest('.period-btn');
            if (periodButton) {
                this.handlePeriodSelection(periodButton);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'competition-stats-specialty-filter') {
                this.competitionStatsSpecialtyFilter = e.target.value || 'all';
                this.updateCompetitionStatistics();
            }
        });

        // Handle modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideModal();
            }
        });

        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Listen for sessions updates
        window.addEventListener('sessionsUpdated', (e) => {
            this.updateSessionsList(e.detail?.sessions);
            if (this.currentView === 'dashboard') {
                this.updateDashboard();
            }
            if (this.currentView === 'calendar') {
                this.updateCalendarDisplay();
            }
        });

        // Listen for competitions updates
        window.addEventListener('competitionsUpdated', (e) => {
            this.updateCompetitionsList(e.detail?.competitions);
            if (this.currentView === 'stats') {
                this.updateCompetitionStatistics();
            }
            if (this.currentView === 'dashboard') {
                this.updateDashboard();
            }
            if (this.currentView === 'calendar') {
                this.updateCalendarDisplay();
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

        // Listen for prediction updates only once
        window.addEventListener('simplePredictionsUpdated', () => {
            if (this.currentView === 'stats') {
                this.updateTrainingStatistics();
                this.updateBeltPredictions();
                this.updateSimplePredictions();
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
            'competition-form',
            'competition-list',
            'calendar',
            'stats',
            'rewards',
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
            case 'competition-form':
                return this.createCompetitionFormComponent();
            case 'competition-list':
                return this.createCompetitionListComponent();
            case 'calendar':
                return this.createCalendarComponent();
            case 'stats':
                return this.createStatsComponent();
            case 'rewards':
                return this.createRewardsComponent();
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
                        <div class="nav-item" data-view="competition-form">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Competition</span>
                        </div>
                        <div class="nav-item" data-view="competition-list">
                            <i class="fas fa-trophy"></i>
                            <span>Competitions</span>
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
        const trainingTypes = sessionManager.getTrainingTypesWithInfo();
        const typeOptions = trainingTypes.map(typeInfo => 
            `<option value="${typeInfo.type}" data-weight="${typeInfo.weight}">${typeInfo.type} (${typeInfo.effectiveness})</option>`
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
                                       min="1" required placeholder="60">
                                <div id="effective-hours-display" class="effective-hours-info" style="display: none;">
                                    <small>Effective training hours: <span id="effective-hours-value">0</span></small>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="session-type" class="form-label">Training Type</label>
                                <select id="session-type" name="type" class="form-select" required>
                                    <option value="">Select training type...</option>
                                    ${typeOptions}
                                </select>
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
                                ${sessionManager.getTrainingTypesWithInfo().map(typeInfo => 
                                    `<option value="${typeInfo.type}">${typeInfo.type} (${typeInfo.effectiveness})</option>`
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
     * Create competition form component
     */
    createCompetitionFormComponent() {
        return `
            <div class="competition-form-container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="form-title">Add New Competition</h2>
                    </div>
                    <div class="card-body">
                        <form id="competition-form" class="competition-form">
                            <div class="competition-main-fields">
                                <div class="form-group">
                                    <label for="competition-date" class="form-label">Competition Date</label>
                                    <input type="date" id="competition-date" name="date" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label for="competition-location" class="form-label">Location</label>
                                    <input type="text" id="competition-location" name="location" class="form-input" placeholder="City, venue, country...">
                                </div>
                                <div class="form-group">
                                    <label for="competition-type" class="form-label">Competition Type</label>
                                    <input type="text" id="competition-type" name="competitionType" class="form-input" placeholder="Regional, National, Open...">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="competition-notes" class="form-label">Competition Notes (optional)</label>
                                <textarea id="competition-notes" name="notes" class="form-textarea" placeholder="General notes about this competition..."></textarea>
                            </div>

                            <div id="specialties-container" class="specialties-container"></div>

                            <div class="form-actions add-specialty-actions">
                                <button type="button" id="add-specialty-btn" class="btn btn-secondary">
                                    <i class="fas fa-plus"></i>
                                    Add Specialty
                                </button>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i>
                                    <span class="competition-submit-text">Add Competition</span>
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.competitionManager.cancelEdit()">
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
     * Create competition list component
     */
    createCompetitionListComponent() {
        const specialtyOptions = window.competitionManager.getSpecialtyTypes().map(type =>
            `<option value="${type}">${type}</option>`
        ).join('');

        const medalOptions = window.competitionManager.getMedalOptions().map(option =>
            `<option value="${option.value}">${option.label}</option>`
        ).join('');

        return `
            <div class="competition-list-container">
                <div class="filters-container">
                    <div class="filters-row">
                        <div class="search-box">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" id="competition-search" class="form-input" placeholder="Search by location, specialty, opponent...">
                        </div>
                        <div class="form-group">
                            <select name="specialty" class="form-select competition-filter">
                                <option value="all">All Specialties</option>
                                ${specialtyOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <select name="medal" class="form-select competition-filter">
                                <option value="all">All Medals</option>
                                ${medalOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="date" name="startDate" class="form-input competition-filter" placeholder="Start Date">
                        </div>
                        <div class="form-group">
                            <input type="date" name="endDate" class="form-input competition-filter" placeholder="End Date">
                        </div>
                    </div>
                </div>
                <div id="competitions-container" class="competitions-grid">
                    <!-- Competitions will be rendered here -->
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
     * Create stats component
     */
    createStatsComponent() {
        return `
            <div class="stats-section">
                <div class="view-header">
                    <h1><i class="fas fa-chart-bar"></i> Statistics</h1>
                    <p>Comprehensive training analytics and insights</p>
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

                <!-- Training Statistics -->
                <div class="card">
                    <div class="card-header">
                        <h2><i class="fas fa-chart-line"></i> Training Statistics</h2>
                    </div>
                    <div class="card-body" id="training-statistics">
                        <!-- Training statistics will be loaded here -->
                    </div>
                </div>

                <!-- Competition Statistics -->
                <div class="card">
                    <div class="card-header">
                        <h2><i class="fas fa-trophy"></i> Competition Statistics</h2>
                    </div>
                    <div class="card-body" id="competition-statistics">
                        <!-- Competition statistics will be loaded here -->
                    </div>
                </div>

                <!-- Belt Progression Predictions -->
                <div class="card">
                    <div class="card-header">
                        <h2><i class="fas fa-crystal-ball"></i> Belt Progression Forecast</h2>
                    </div>
                    <div class="card-body" id="belt-predictions">
                        <!-- Belt predictions will be loaded here -->
                    </div>
                </div>

                <!-- Simple Predictions Section (backward compatibility) -->
                <div class="card" style="display: none;">
                    <div class="card-header">
                        <h2><i class="fas fa-crystal-ball"></i> Next Belt Prediction</h2>
                    </div>
                    <div class="card-body" id="simple-predictions">
                        <!-- Simple prediction will be loaded here -->
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
                        <p>Permanently delete all your sessions and progress. This cannot be undone.</p>
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
            case 'competition-form':
                contentDiv.innerHTML = this.components['competition-form'];
                break;
            case 'competition-list':
                contentDiv.innerHTML = this.components['competition-list'];
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

                    <div class="recent-competitions card">
                        <div class="card-header">
                            <h3>Recent Competitions</h3>
                            <a href="#" class="nav-item" data-view="competition-list">View All</a>
                        </div>
                        <div class="card-body" id="dashboard-recent-competitions">
                            <!-- Recent competitions will be rendered here -->
                        </div>
                    </div>

                    <div class="dashboard-medals card">
                        <div class="card-header">
                            <h3>Medals</h3>
                            <a href="#" class="nav-item" data-view="stats">View Details</a>
                        </div>
                        <div class="card-body" id="dashboard-medals">
                            <!-- Medal summary will be rendered here -->
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
            case 'competition-form':
                this.initializeCompetitionForm();
                break;
            case 'competition-list':
                this.updateCompetitionsList();
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
        
        // Add event listeners for effective hours calculation
        this.setupEffectiveHoursCalculation();
    }

    /**
     * Initialize competition form
     */
    initializeCompetitionForm() {
        if (window.competitionManager) {
            window.competitionManager.initializeForm();
        }
    }

    /**
     * Setup effective hours calculation display
     */
    setupEffectiveHoursCalculation() {
        const typeSelect = document.getElementById('session-type');
        const durationInput = document.getElementById('session-duration');
        const effectiveDisplay = document.getElementById('effective-hours-display');
        const effectiveValue = document.getElementById('effective-hours-value');
        
        if (!typeSelect || !durationInput || !effectiveDisplay || !effectiveValue) return;
        
        const updateEffectiveHours = () => {
            const selectedOption = typeSelect.options[typeSelect.selectedIndex];
            const duration = parseInt(durationInput.value) || 0;
            
            if (selectedOption && duration > 0) {
                const weight = parseFloat(selectedOption.dataset.weight) || 1.0;
                const effectiveMinutes = duration * weight;
                const effectiveHours = (effectiveMinutes / 60).toFixed(2);
                
                effectiveValue.textContent = `${effectiveHours}h`;
                effectiveDisplay.style.display = 'block';
                
                // Add visual styling based on effectiveness
                if (weight < 1.0) {
                    effectiveDisplay.className = 'effective-hours-info reduced-effectiveness';
                } else {
                    effectiveDisplay.className = 'effective-hours-info full-effectiveness';
                }
            } else {
                effectiveDisplay.style.display = 'none';
            }
        };
        
        typeSelect.addEventListener('change', updateEffectiveHours);
        durationInput.addEventListener('input', updateEffectiveHours);
        
        // Initial calculation
        updateEffectiveHours();
    }

    /**
     * Update sessions list
     */
    updateSessionsList(sessions) {
        const container = document.getElementById('sessions-container');
        if (!container) {
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
        return `
            <div class="session-card animate-fadeIn">
                <div class="session-header">
                    <div class="session-date">${sessionManager.formatDate(session.date)}</div>
                    <div class="session-duration">${sessionManager.formatDuration(session.duration)}</div>
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
     * Update competitions list
     */
    updateCompetitionsList(competitions) {
        const container = document.getElementById('competitions-container');
        if (!container) {
            return;
        }

        const competitionsToShow = competitions || (window.competitionManager ? window.competitionManager.getFilteredCompetitions() : []);

        if (competitionsToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Competitions Found</h3>
                    <p>Add your first competition with specialties, match results, and medal outcomes.</p>
                    <button class="btn btn-primary nav-item" data-view="competition-form">
                        <i class="fas fa-plus"></i>
                        Add Your First Competition
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = competitionsToShow.map(competition =>
            this.createCompetitionCard(competition)
        ).join('');
    }

    /**
     * Create competition card HTML
     */
    createCompetitionCard(competition) {
        const specialties = Array.isArray(competition.specialties) ? competition.specialties : [];
        const totalMatches = specialties.reduce((sum, specialty) =>
            sum + (Array.isArray(specialty.matches) ? specialty.matches.length : 0), 0
        );
        const totalRounds = specialties.reduce((sum, specialty) => {
            const matches = Array.isArray(specialty.matches) ? specialty.matches : [];
            return sum + matches.reduce((matchSum, match) => {
                const rounds = Array.isArray(match.rounds) ? match.rounds : [];
                return matchSum + rounds.length;
            }, 0);
        }, 0);

        const formatDate = window.competitionManager?.formatDate
            ? window.competitionManager.formatDate.bind(window.competitionManager)
            : (date) => new Date(date).toLocaleDateString();

        const getMedalLabel = window.competitionManager?.getMedalLabel
            ? window.competitionManager.getMedalLabel.bind(window.competitionManager)
            : (medal) => medal;

        const getMatchResultLabel = window.competitionManager?.getMatchResultLabel
            ? window.competitionManager.getMatchResultLabel.bind(window.competitionManager)
            : (result) => result;

        return `
            <div class="competition-card animate-fadeIn" data-competition-id="${competition.id}">
                <div class="competition-header">
                    <div class="session-date">${formatDate(competition.date)}</div>
                    <div class="competition-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${competition.location}</span>
                    </div>
                </div>

                <div class="competition-meta">
                    <span class="competition-meta-item">
                        <i class="fas fa-flag-checkered"></i>
                        ${competition.competitionType || competition.specialties?.[0]?.competitionType || 'N/A'}
                    </span>
                    <span class="competition-meta-item">
                        <i class="fas fa-layer-group"></i>
                        ${specialties.length} specialties
                    </span>
                    <span class="competition-meta-item">
                        <i class="fas fa-fist-raised"></i>
                        ${totalMatches} matches
                    </span>
                    <span class="competition-meta-item">
                        <i class="fas fa-stopwatch"></i>
                        ${totalRounds} rounds
                    </span>
                </div>

                <div class="competition-specialties-list">
                    ${specialties.map(specialty => {
                        const medal = specialty.medal || 'none';
                        const matches = Array.isArray(specialty.matches) ? specialty.matches : [];
                        return `
                            <div class="competition-specialty-item">
                                <div class="competition-specialty-header">
                                    <span class="session-type">${specialty.specialty}</span>
                                    <span class="medal-badge medal-${medal}">${getMedalLabel(medal)}</span>
                                </div>
                                ${specialty.notes ? `<div class="competition-specialty-notes">${specialty.notes}</div>` : ''}
                                ${matches.length > 0 ? `
                                    <ul class="competition-match-list">
                                        ${matches.map(match => `
                                            <li>
                                                <strong>${match.opponentName}</strong>
                                                <span class="match-result-chip ${match.result}">${getMatchResultLabel(match.result)}</span>
                                                ${Array.isArray(match.rounds) && match.rounds.length > 0 ? `
                                                    <div class="competition-rounds-summary">
                                                        ${match.rounds.map((round, roundIndex) => `
                                                            <span class="round-score-chip">
                                                                R${roundIndex + 1}: ${round.myPoints ?? '-'}-${round.opponentPoints ?? '-'}
                                                            </span>
                                                        `).join('')}
                                                    </div>
                                                ` : ''}
                                                ${match.notes ? `<div class="competition-match-notes">${match.notes}</div>` : ''}
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : `
                                    <div class="competition-empty-note">
                                        <i class="fas fa-info-circle"></i>
                                        <span>No match/round details recorded.</span>
                                    </div>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>

                ${competition.notes ? `<div class="competition-notes">${competition.notes}</div>` : ''}

                <div class="session-actions competition-actions">
                    <button class="btn btn-icon competition-edit" data-competition-id="${competition.id}" title="Edit Competition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon competition-delete" data-competition-id="${competition.id}" title="Delete Competition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle competition edit
     */
    handleCompetitionEdit(target) {
        const competitionId = target.closest('[data-competition-id]').dataset.competitionId;
        if (window.competitionManager) {
            window.competitionManager.editCompetition(competitionId);
        }
    }

    /**
     * Handle competition delete
     */
    handleCompetitionDelete(target) {
        const competitionId = target.closest('[data-competition-id]').dataset.competitionId;
        if (window.competitionManager) {
            window.competitionManager.deleteCompetition(competitionId);
        }
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
        const competitions = storage.getAllCompetitions().filter(competition => {
            if (!competition?.date) {
                return false;
            }

            const [compYear, compMonth] = String(competition.date).split('-');
            return Number(compYear) === year && Number(compMonth) === month + 1;
        });
        
        // Create session map for quick lookup
        const sessionMap = {};
        sessions.forEach(session => {
            sessionMap[session.date] = (sessionMap[session.date] || 0) + 1;
        });

        const competitionMap = {};
        competitions.forEach(competition => {
            competitionMap[competition.date] = (competitionMap[competition.date] || 0) + 1;
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
            const sessionCount = sessionMap[dateStr] || 0;
            const competitionCount = competitionMap[dateStr] || 0;
            const hasSession = sessionCount > 0;
            const hasCompetition = competitionCount > 0;
            const titleParts = [];
            if (hasSession) {
                titleParts.push(`${sessionCount} session${sessionCount === 1 ? '' : 's'}`);
            }
            if (hasCompetition) {
                titleParts.push(`${competitionCount} competition${competitionCount === 1 ? '' : 's'}`);
            }
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasSession) classes += ' has-session';
            if (hasCompetition) classes += ' has-competition';
            const titleAttr = titleParts.length > 0 ? ` title="${titleParts.join(' | ')}"` : '';
            
            html += `
                <div class="${classes}" data-date="${dateStr}"${titleAttr}>
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
     * Initialize stats
     */
    initializeStats() {
        if (window.chartManager) {
            chartManager.initializeCharts();
        }
        this.updateStatsDisplay();

        // Initialize all statistics and predictions
        this.updateTrainingStatistics();
        this.updateCompetitionStatistics();
        this.updateBeltPredictions();
        this.updateSimplePredictions(); // Keep for backward compatibility
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
            if (window.router) {
                window.router.navigateTo(viewName);
            } else {
                this.renderView(viewName);
            }
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
     * Update simple predictions display
     */
    updateSimplePredictions() {
        const container = document.getElementById('simple-predictions');
        if (!container) return;

        const prediction = simplePredictor.getNextBeltPrediction();
        const insights = simplePredictor.getTrainingInsights();

        let html = '';

        if (prediction.isComplete) {
            html = `
                <div class="prediction-complete">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h3>${prediction.message}</h3>
                </div>
            `;
        } else if (prediction.message && !prediction.nextBelt) {
            html = `
                <div class="prediction-empty">
                    <i class="fas fa-chart-line" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>${prediction.message}</h3>
                    ${prediction.suggestion ? `<p style="color: var(--text-secondary);">${prediction.suggestion}</p>` : ''}
                </div>
            `;
        } else if (prediction.isReady) {
            html = `
                <div class="prediction-ready">
                    <i class="fas fa-star" style="font-size: 2.5rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h3>${prediction.message}</h3>
                    <div class="belt-info" style="margin-top: 1rem;">
                        <p><strong>Next Belt:</strong> ${prediction.nextBelt}</p>
                        <p><strong>Training Hours:</strong> ${prediction.currentHours} / ${prediction.requiredHours}</p>
                    </div>
                </div>
            `;
        } else {
            const confidenceColor = prediction.confidence > 70 ? 'var(--success-dark)' :
                                   prediction.confidence > 50 ? 'var(--warning-dark)' : 'var(--error-dark)';

            html = `
                <div class="prediction-result">
                    <div class="prediction-header">
                        <h3><i class="fas fa-crystal-ball"></i> Next Belt: ${prediction.nextBelt}</h3>
                    </div>

                    <div class="prediction-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                        <div class="detail-item">
                            <strong>Time Estimate</strong>
                            <p style="font-size: 1.2rem; color: var(--accent-primary);">${prediction.timeEstimate}</p>
                            <small>${prediction.estimatedDate}</small>
                        </div>

                        <div class="detail-item">
                            <strong>Progress</strong>
                            <p>${prediction.currentHours} / ${prediction.requiredHours} hours</p>
                            <small>${prediction.hoursNeeded} hours remaining</small>
                        </div>

                        <div class="detail-item">
                            <strong>Training Rate</strong>
                            <p>${prediction.monthlyRate} hours/month</p>
                            <small>Based on recent activity</small>
                        </div>

                        <div class="detail-item">
                            <strong>Confidence</strong>
                            <p style="color: ${confidenceColor};">${prediction.confidence}%</p>
                            <small>${prediction.confidence > 70 ? 'High' : prediction.confidence > 50 ? 'Medium' : 'Low'} reliability</small>
                        </div>
                    </div>
                </div>
            `;
        }

        // Add insights if available
        if (insights.insights && insights.insights.length > 0) {
            html += `
                <div class="training-insights" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                    <h4><i class="fas fa-lightbulb"></i> Training Insights</h4>
                    <div class="insights-list">
            `;

            insights.insights.forEach(insight => {
                html += `
                    <div class="insight-item" style="display: flex; align-items: flex-start; gap: 0.75rem; margin: 0.75rem 0; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <i class="${insight.icon}" style="color: var(--accent-primary); margin-top: 0.2rem;"></i>
                        <div>
                            <strong>${insight.title}</strong>
                            <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary);">${insight.message}</p>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Update training statistics display
     */
    updateTrainingStatistics() {
        const container = document.getElementById('training-statistics');
        if (!container) return;

        const allPredictions = simplePredictor.getAllBeltsPredictions();
        const stats = allPredictions.trainingStats;

        if (!stats || stats.totalSessions === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No Training Data Yet</h3>
                    <p>Start logging your training sessions to see detailed statistics!</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="statistics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <!-- Overall Statistics -->
                <div class="stat-section">
                    <h4><i class="fas fa-chart-bar"></i> Overall Training</h4>
                    <div class="stat-items">
                        <div class="stat-item">
                            <strong>Total Sessions:</strong> ${stats.totalSessions}
                        </div>
                        <div class="stat-item">
                            <strong>Total Hours:</strong> ${stats.totalHours}h
                        </div>
                        <div class="stat-item">
                            <strong>Average Session:</strong> ${stats.averageSessionLength}h
                        </div>
                    </div>
                </div>

                <!-- Training Averages -->
                <div class="stat-section">
                    <h4><i class="fas fa-calendar-alt"></i> Training Averages</h4>
                    <div class="stat-items">
                        <div class="stat-item">
                            <strong>Weekly Average:</strong> ${stats.weeklyAverage}h/week
                        </div>
                        <div class="stat-item">
                            <strong>Monthly Average:</strong> ${stats.monthlyAverage}h/month
                        </div>
                        <div class="stat-item">
                            <strong>Current Rate:</strong> ${allPredictions.monthlyRate}h/month
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="stat-section">
                    <h4><i class="fas fa-clock"></i> Recent Activity (Last 30 Days)</h4>
                    <div class="stat-items">
                        <div class="stat-item">
                            <strong>Sessions:</strong> ${stats.last30DaysInfo.sessions}
                        </div>
                        <div class="stat-item">
                            <strong>Training Hours:</strong> ${stats.last30DaysInfo.hours}h
                        </div>
                        <div class="stat-item">
                            <strong>Sessions/Week:</strong> ${stats.last30DaysInfo.averagePerWeek}
                        </div>
                    </div>
                </div>

                <!-- This Week -->
                <div class="stat-section">
                    <h4><i class="fas fa-calendar-week"></i> Last 7 Days</h4>
                    <div class="stat-items">
                        <div class="stat-item">
                            <strong>Sessions:</strong> ${stats.last7DaysInfo.sessions}
                        </div>
                        <div class="stat-item">
                            <strong>Training Hours:</strong> ${stats.last7DaysInfo.hours}h
                        </div>
                        <div class="stat-item">
                            <strong>Sessions/Day:</strong> ${stats.last7DaysInfo.averagePerDay}
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Update competition statistics display
     */
    updateCompetitionStatistics() {
        const container = document.getElementById('competition-statistics');
        if (!container) return;

        const competitions = (storage.getAllCompetitions() || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (competitions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No Competition Data Yet</h3>
                    <p>Add competitions to see medal, match, and round analytics.</p>
                </div>
            `;
            return;
        }

        const getSpecialtyName = (specialty) => (
            specialty?.specialty ||
            specialty?.speciality ||
            specialty?.type ||
            specialty?.name ||
            ''
        ).trim();

        const managerSpecialties = window.competitionManager?.getSpecialtyTypes
            ? window.competitionManager.getSpecialtyTypes()
            : [];

        const specialtiesFromData = Array.from(new Set(
            competitions.flatMap(competition =>
                (Array.isArray(competition.specialties) ? competition.specialties : [])
                    .map(specialty => getSpecialtyName(specialty))
                    .filter(Boolean)
            )
        ));

        const extraSpecialties = specialtiesFromData
            .filter(specialty => !managerSpecialties.includes(specialty))
            .sort((a, b) => a.localeCompare(b));

        const availableSpecialties = [...managerSpecialties, ...extraSpecialties];

        if (
            this.competitionStatsSpecialtyFilter !== 'all' &&
            !availableSpecialties.includes(this.competitionStatsSpecialtyFilter)
        ) {
            this.competitionStatsSpecialtyFilter = 'all';
        }

        const selectedSpecialty = this.competitionStatsSpecialtyFilter || 'all';
        const competitionsInScope = selectedSpecialty === 'all'
            ? competitions
            : competitions.filter(competition =>
                (Array.isArray(competition.specialties) ? competition.specialties : [])
                    .some(specialty => getSpecialtyName(specialty) === selectedSpecialty)
            );

        const summary = {
            totalCompetitions: competitionsInScope.length,
            totalSpecialties: 0,
            totalMatches: 0,
            totalRounds: 0
        };

        const medalCounts = { gold: 0, silver: 0, bronze: 0, none: 0 };
        const resultCounts = { won: 0, lost: 0, draw: 0 };

        competitionsInScope.forEach(competition => {
            const specialties = (Array.isArray(competition.specialties) ? competition.specialties : [])
                .filter(specialty =>
                    selectedSpecialty === 'all' ||
                    getSpecialtyName(specialty) === selectedSpecialty
                );

            summary.totalSpecialties += specialties.length;

            specialties.forEach(specialty => {
                const medal = specialty.medal || 'none';
                if (Object.prototype.hasOwnProperty.call(medalCounts, medal)) {
                    medalCounts[medal] += 1;
                } else {
                    medalCounts.none += 1;
                }

                const matches = Array.isArray(specialty.matches) ? specialty.matches : [];
                summary.totalMatches += matches.length;

                matches.forEach(match => {
                    const result = match.result;
                    if (Object.prototype.hasOwnProperty.call(resultCounts, result)) {
                        resultCounts[result] += 1;
                    }

                    const rounds = Array.isArray(match.rounds) ? match.rounds : [];
                    summary.totalRounds += rounds.length;
                });
            });
        });

        const decidedMatches = resultCounts.won + resultCounts.lost + resultCounts.draw;
        const winRate = decidedMatches > 0 ? ((resultCounts.won / decidedMatches) * 100).toFixed(1) : '0.0';
        const avgMatchesPerCompetition = summary.totalCompetitions > 0
            ? (summary.totalMatches / summary.totalCompetitions).toFixed(1)
            : '0.0';
        const avgRoundsPerMatch = summary.totalMatches > 0
            ? (summary.totalRounds / summary.totalMatches).toFixed(1)
            : '0.0';

        const recentCompetitions = competitionsInScope.slice(0, 3);
        const filterOptions = availableSpecialties.map(specialty =>
            `<option value="${specialty}" ${selectedSpecialty === specialty ? 'selected' : ''}>${specialty}</option>`
        ).join('');
        const scopeLabel = selectedSpecialty === 'all' ? 'All Specialties' : selectedSpecialty;

        container.innerHTML = `
            <div class="competition-stats-toolbar">
                <div class="form-group">
                    <label for="competition-stats-specialty-filter" class="form-label">Specialty Scope</label>
                    <select id="competition-stats-specialty-filter" class="form-select">
                        <option value="all" ${selectedSpecialty === 'all' ? 'selected' : ''}>All specialties (total)</option>
                        ${filterOptions}
                    </select>
                </div>
            </div>

            ${competitionsInScope.length === 0 ? `
                <div class="empty-state" style="text-align: center; padding: 1.5rem;">
                    <i class="fas fa-filter" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 0.75rem;"></i>
                    <h3>No data for selected specialty</h3>
                    <p>Try switching to total or select another specialty.</p>
                </div>
            ` : `
                <div class="statistics-grid competition-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    <div class="stat-section">
                        <h4><i class="fas fa-trophy"></i> Competition Overview (${scopeLabel})</h4>
                        <div class="stat-items">
                            <div class="stat-item"><strong>Total Competitions:</strong> ${summary.totalCompetitions}</div>
                            <div class="stat-item"><strong>Total Specialties:</strong> ${summary.totalSpecialties}</div>
                            <div class="stat-item"><strong>Total Matches:</strong> ${summary.totalMatches}</div>
                            <div class="stat-item"><strong>Total Rounds:</strong> ${summary.totalRounds}</div>
                        </div>
                    </div>

                    <div class="stat-section">
                        <h4><i class="fas fa-fist-raised"></i> Match Results</h4>
                        <div class="stat-items">
                            <div class="stat-item"><strong>Won:</strong> ${resultCounts.won}</div>
                            <div class="stat-item"><strong>Lost:</strong> ${resultCounts.lost}</div>
                            <div class="stat-item"><strong>Draw:</strong> ${resultCounts.draw}</div>
                            <div class="stat-item"><strong>Win Rate:</strong> ${winRate}%</div>
                            <div class="stat-item"><strong>Avg Rounds/Match:</strong> ${avgRoundsPerMatch}</div>
                        </div>
                    </div>

                    <div class="stat-section">
                        <h4><i class="fas fa-medal"></i> Medal Breakdown</h4>
                        <div class="stat-items">
                            <div class="stat-item"><strong>Gold:</strong> ${medalCounts.gold}</div>
                            <div class="stat-item"><strong>Silver:</strong> ${medalCounts.silver}</div>
                            <div class="stat-item"><strong>Bronze:</strong> ${medalCounts.bronze}</div>
                            <div class="stat-item"><strong>No Medal:</strong> ${medalCounts.none}</div>
                            <div class="stat-item"><strong>Avg Matches/Competition:</strong> ${avgMatchesPerCompetition}</div>
                        </div>
                    </div>
                </div>

                <div class="competition-stats-recent">
                    <h4><i class="fas fa-clock"></i> Most Recent Competitions</h4>
                    <ul>
                        ${recentCompetitions.map(competition => {
                            const dateLabel = window.competitionManager?.formatDate
                                ? window.competitionManager.formatDate(competition.date)
                                : competition.date;
                            const specialtiesCount = (Array.isArray(competition.specialties) ? competition.specialties : [])
                                .filter(specialty =>
                                    selectedSpecialty === 'all' ||
                                    getSpecialtyName(specialty) === selectedSpecialty
                                ).length;
                            return `<li><strong>${dateLabel}</strong> - ${competition.location || 'Unknown location'} (${specialtiesCount} specialties)</li>`;
                        }).join('')}
                    </ul>
                </div>
            `}
        `;
    }

    /**
     * Update belt predictions display
     */
    updateBeltPredictions() {
        const container = document.getElementById('belt-predictions');
        if (!container) return;

        const allPredictions = simplePredictor.getAllBeltsPredictions();

        if (allPredictions.isComplete) {
            container.innerHTML = `
                <div class="prediction-complete" style="text-align: center; padding: 3rem 1rem;">
                    <i class="fas fa-trophy" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h3>${allPredictions.message}</h3>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">You have mastered all belt levels!</p>
                </div>
            `;
            return;
        }

        if (allPredictions.message && allPredictions.predictions.length === 0) {
            container.innerHTML = `
                <div class="prediction-empty" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-chart-line" style="font-size: 2.5rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>${allPredictions.message}</h3>
                    ${allPredictions.suggestion ? `<p style="color: var(--text-secondary); margin-top: 1rem;">${allPredictions.suggestion}</p>` : ''}
                </div>
            `;
            return;
        }

        let html = `
            <div class="current-belt-summary" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border-left: 4px solid var(--accent-primary);">
                <h3><i class="fas fa-medal"></i> Current: ${allPredictions.currentBelt.title}</h3>
                <p><strong>Training Hours:</strong> ${allPredictions.currentBelt.hours}h</p>
                <p><strong>Monthly Rate:</strong> ${allPredictions.monthlyRate}h/month | <strong>Weekly Rate:</strong> ${allPredictions.weeklyRate}h/week</p>
            </div>
        `;

        if (allPredictions.predictions && allPredictions.predictions.length > 0) {
            html += `
                <div class="predictions-list">
                    <h4><i class="fas fa-list"></i> Remaining Belt Progression (${allPredictions.predictions.length} belts)</h4>
                    <div class="belt-predictions-grid" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
            `;

            // Group predictions by timeframe for better visualization
            const shortTerm = allPredictions.predictions.filter(p => p.monthsNeeded <= 12);
            const mediumTerm = allPredictions.predictions.filter(p => p.monthsNeeded > 12 && p.monthsNeeded <= 36);
            const longTerm = allPredictions.predictions.filter(p => p.monthsNeeded > 36);

            if (shortTerm.length > 0) {
                html += `<div class="prediction-group">
                    <h5 style="color: var(--success-dark); margin-bottom: 0.5rem;"><i class="fas fa-rocket"></i> Short Term (Next 12 months)</h5>
                    <div class="predictions-subgrid">`;

                shortTerm.forEach(prediction => {
                    html += this.renderBeltPredictionItem(prediction, 'short-term');
                });

                html += `</div></div>`;
            }

            if (mediumTerm.length > 0) {
                html += `<div class="prediction-group">
                    <h5 style="color: var(--warning-dark); margin-bottom: 0.5rem;"><i class="fas fa-calendar-alt"></i> Medium Term (1-3 years)</h5>
                    <div class="predictions-subgrid">`;

                mediumTerm.forEach(prediction => {
                    html += this.renderBeltPredictionItem(prediction, 'medium-term');
                });

                html += `</div></div>`;
            }

            if (longTerm.length > 0) {
                html += `<div class="prediction-group">
                    <h5 style="color: var(--text-secondary); margin-bottom: 0.5rem;"><i class="fas fa-mountain"></i> Long Term (3+ years)</h5>
                    <div class="predictions-subgrid">`;

                longTerm.forEach(prediction => {
                    html += this.renderBeltPredictionItem(prediction, 'long-term');
                });

                html += `</div></div>`;
            }

            html += `</div></div>`;

            // Add note for long-term predictions
            if (longTerm.length > 0) {
                html += `
                    <div class="long-term-note" style="background: var(--warning-light); border: 1px solid var(--warning-border); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
                        <i class="fas fa-info-circle" style="color: var(--warning-primary); margin-top: 0.2rem; flex-shrink: 0;"></i>
                        <div>
                            <strong>Long-term Predictions Note:</strong>
                            <p style="margin: 0.25rem 0 0 0; color: var(--warning-dark); font-size: 0.9rem;">
                                Predictions beyond 3 years are estimates based on current training patterns.
                                Actual progress may vary with changes in training intensity and life circumstances.
                            </p>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;
    }

    /**
     * Render individual belt prediction item
     */
    renderBeltPredictionItem(prediction, timeframe) {
        const confidenceColor = prediction.confidence > 70 ? 'var(--success-dark)' :
                               prediction.confidence > 50 ? 'var(--warning-dark)' : 'var(--error-dark)';

        const isBlackBelt = prediction.belt.includes('black');
        const itemClass = `belt-prediction-item ${timeframe} ${isBlackBelt ? 'black-belt' : 'colored-belt'}`;

        return `
            <div class="${itemClass}" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                border: 1px solid var(--border-light);
                transition: all var(--transition-normal);
                ${isBlackBelt ? 'background: linear-gradient(135deg, #1a1a1a, #333); color: white;' : ''}
            ">
                <div class="belt-info">
                    <h4 style="margin: 0 0 0.25rem 0;">${prediction.beltTitle}</h4>
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.8;">
                        ${prediction.hoursNeeded}h needed (${prediction.requiredHours}h total)
                    </p>
                </div>
                <div class="prediction-details" style="text-align: right;">
                    <div style="font-weight: 600; color: var(--accent-primary); font-size: 1.1rem;">
                        ${prediction.timeEstimate}
                    </div>
                    <div style="font-size: 0.8rem; opacity: 0.7; margin: 0.25rem 0;">
                        ${prediction.estimatedDate}
                    </div>
                    <div style="
                        padding: 0.25rem 0.5rem;
                        border-radius: var(--radius-sm);
                        font-size: 0.8rem;
                        font-weight: 600;
                        color: ${confidenceColor};
                        background: ${confidenceColor}20;
                    ">
                        ${prediction.confidence}% confidence
                    </div>
                </div>
            </div>
        `;
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

        // Update recent competitions
        this.updateRecentCompetitions();

        // Update medals summary
        this.updateDashboardMedals();
        
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
        
        container.innerHTML = sessions.map(session => `
            <div class="session-summary">
                <div class="session-info">
                    <strong>${session.type}</strong>
                    <span class="session-duration">${sessionManager.formatDuration(session.duration)}</span>
                </div>
                <div class="session-date">${sessionManager.getRelativeDate(session.date)}</div>
            </div>
        `).join('');
    }

    /**
     * Update recent competitions on dashboard
     */
    updateRecentCompetitions() {
        const competitions = storage.getAllCompetitions()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        const container = document.getElementById('dashboard-recent-competitions');
        if (!container) return;

        if (competitions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No competitions yet. Add your first event!</p>
                </div>
            `;
            return;
        }

        const formatCompetitionDate = window.competitionManager?.formatDate
            ? window.competitionManager.formatDate.bind(window.competitionManager)
            : (dateString) => dateString;

        container.innerHTML = competitions.map(competition => {
            const competitionType = competition.competitionType || competition.specialties?.[0]?.competitionType || 'N/A';
            const location = competition.location || 'Unknown location';
            const dateLabel = formatCompetitionDate(competition.date);

            return `
                <div class="session-summary">
                    <div class="session-info">
                        <strong>${location}</strong>
                        <span class="session-duration">${competitionType}</span>
                    </div>
                    <div class="session-date">${dateLabel}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update medal summary on dashboard
     */
    updateDashboardMedals() {
        const competitions = storage.getAllCompetitions();
        const container = document.getElementById('dashboard-medals');
        if (!container) return;

        const medalCounts = { gold: 0, silver: 0, bronze: 0, none: 0 };
        let totalSpecialties = 0;

        competitions.forEach(competition => {
            const specialties = Array.isArray(competition.specialties) ? competition.specialties : [];
            totalSpecialties += specialties.length;

            specialties.forEach(specialty => {
                const medal = (specialty.medal || 'none').toLowerCase();
                if (Object.prototype.hasOwnProperty.call(medalCounts, medal)) {
                    medalCounts[medal] += 1;
                } else {
                    medalCounts.none += 1;
                }
            });
        });

        if (totalSpecialties === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-medal"></i>
                    <p>No medal data yet.</p>
                </div>
            `;
            return;
        }

        const medalRows = [
            { key: 'gold', label: 'Gold', className: 'medal-gold' },
            { key: 'silver', label: 'Silver', className: 'medal-silver' },
            { key: 'bronze', label: 'Bronze', className: 'medal-bronze' },
            { key: 'none', label: 'No Medal', className: 'medal-none' }
        ];

        container.innerHTML = medalRows.map(row => `
            <div class="session-summary">
                <div class="session-info">
                    <span class="medal-badge ${row.className}">${row.label}</span>
                </div>
                <div class="session-date dashboard-medal-count">${medalCounts[row.key]}</div>
            </div>
        `).join('');
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
            `<p>This will permanently delete all your training data, including sessions and progress. This action cannot be undone.</p>
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
