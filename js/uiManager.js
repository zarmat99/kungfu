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
            this.updateBeltDisplay();
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
            'rewards'
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
                    </nav>
                </div>
            </header>
            <button class="theme-toggle" title="Toggle Theme">
                <i class="fas fa-moon"></i>
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
     * Create stats component
     */
    createStatsComponent() {
        return `
            <div class="stats-section">
                <div class="stats-overview grid grid-4">
                    <div class="stats-card">
                        <i class="fas fa-clock stats-icon"></i>
                        <div class="stats-value" id="total-hours">0</div>
                        <div class="stats-label">Total Hours</div>
                    </div>
                    <div class="stats-card">
                        <i class="fas fa-calendar-check stats-icon"></i>
                        <div class="stats-value" id="total-sessions">0</div>
                        <div class="stats-label">Total Sessions</div>
                    </div>
                    <div class="stats-card">
                        <i class="fas fa-fire stats-icon"></i>
                        <div class="stats-value" id="weekly-hours">0</div>
                        <div class="stats-label">This Week</div>
                    </div>
                    <div class="stats-card">
                        <i class="fas fa-chart-line stats-icon"></i>
                        <div class="stats-value" id="average-session">0</div>
                        <div class="stats-label">Avg Session</div>
                    </div>
                </div>
                
                <div class="charts-grid grid grid-2">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">Training Hours Over Time</h3>
                        <canvas id="training-hours-chart" class="chart-canvas"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">Training Types Distribution</h3>
                        <canvas id="training-types-chart" class="chart-canvas"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">Monthly Progress</h3>
                        <canvas id="progress-chart" class="chart-canvas"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">Training Consistency</h3>
                        <canvas id="consistency-chart" class="chart-canvas"></canvas>
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
            <div class="rewards-section">
                <div class="belt-container">
                    <div class="current-belt">
                        <h2>Current Belt</h2>
                        <div id="current-belt-display"></div>
                        <div id="motivational-message"></div>
                    </div>
                    
                    <div class="belt-progress-container">
                        <h3>Progress to Next Belt</h3>
                        <div class="belt-progress-bar">
                            <div class="belt-progress-fill" id="belt-progress-fill"></div>
                        </div>
                        <div id="progress-percentage">0%</div>
                    </div>
                    
                    <div class="belt-requirements" id="belt-requirements">
                        <!-- Requirements will be rendered here -->
                    </div>
                </div>
                
                <div class="achievements-section">
                    <h2>Achievements</h2>
                    <div class="achievements-grid grid grid-3" id="achievements-grid">
                        <!-- Achievements will be rendered here -->
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
                
                <div class="dashboard-stats grid grid-4">
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
                        <i class="fas fa-fire stats-icon"></i>
                        <div class="stats-value" id="dash-weekly-hours">0</div>
                        <div class="stats-label">This Week</div>
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
            const dateStr = currentDate.toISOString().split('T')[0];
            const isToday = currentDate.toDateString() === today.toDateString();
            const hasSession = sessionMap[dateStr];
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasSession) classes += ' has-session';
            
            html += `
                <div class="${classes}" data-date="${dateStr}">
                    ${day}
                    ${hasSession ? `<span class="session-count">${hasSession}</span>` : ''}
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
        this.updateStatsDisplay();
        // Charts will be initialized by chartManager
        if (window.chartManager) {
            setTimeout(() => {
                window.chartManager.initializeCharts();
            }, 100);
        }
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const stats = storage.getStats();
        
        this.updateElement('total-hours', Math.floor(stats.totalHours || 0));
        this.updateElement('total-sessions', stats.totalSessions || 0);
        this.updateElement('weekly-hours', Math.floor(stats.weeklyHours || 0));
        this.updateElement('average-session', Math.floor(stats.averageSessionLength || 0) + 'min');
    }

    /**
     * Update belt display
     */
    updateBeltDisplay() {
        const currentBelt = rewardSystem.getCurrentBelt();
        const progress = rewardSystem.getBeltProgress();
        
        // Update current belt display
        const currentBeltElement = document.getElementById('current-belt-display');
        if (currentBeltElement) {
            currentBeltElement.innerHTML = `
                <div class="belt-icon belt-${currentBelt.name}">
                    ${currentBelt.title}
                </div>
            `;
        }

        // Update motivational message
        const messageElement = document.getElementById('motivational-message');
        if (messageElement) {
            messageElement.textContent = rewardSystem.getMotivationalMessage();
        }

        // Update progress
        const progressFill = document.getElementById('belt-progress-fill');
        const progressText = document.getElementById('progress-percentage');
        
        if (progressFill) {
            progressFill.style.width = progress.progress + '%';
        }
        
        if (progressText) {
            progressText.textContent = progress.progress + '% to next belt';
        }

        // Update requirements
        this.updateBeltRequirements(progress);
    }

    /**
     * Update belt requirements display
     */
    updateBeltRequirements(progress) {
        const container = document.getElementById('belt-requirements');
        if (!container || !progress.requirements) return;

        container.innerHTML = `
            <h4>Requirements for ${progress.nextBelt?.title || 'Next Belt'}</h4>
            <div class="requirements-list">
                ${progress.requirements.map(req => `
                    <div class="requirement-item ${req.completed ? 'completed' : ''}">
                        <i class="fas fa-${req.completed ? 'check-circle' : 'circle'} requirement-icon"></i>
                        <div class="requirement-content">
                            <div class="requirement-label">${req.label}</div>
                            <div class="requirement-progress">${req.progress || 0}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Initialize components after initial render
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
     * Update dashboard
     */
    updateDashboard() {
        const stats = storage.getStats();
        const beltSystem = storage.getBeltSystem();
        
        // Update stats
        this.updateElement('dash-total-hours', Math.floor(stats.totalHours || 0));
        this.updateElement('dash-total-sessions', stats.totalSessions || 0);
        this.updateElement('dash-weekly-hours', Math.floor(stats.weeklyHours || 0));
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
     * Update dashboard belt progress
     */
    updateDashboardBeltProgress() {
        const progress = rewardSystem.getBeltProgress();
        const container = document.getElementById('dashboard-belt-progress');
        if (!container) return;
        
        container.innerHTML = `
            <div class="progress-info">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progress}%"></div>
                </div>
                <div class="progress-text">${progress.progress}% to next belt</div>
            </div>
            <div class="motivation-message">
                ${rewardSystem.getMotivationalMessage()}
            </div>
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

    // Additional methods will be added for specific UI components...
}

// Create global UI manager instance
window.uiManager = new UIManager(); 