/**
 * Storage Module - Backend Simulation using localStorage
 * Provides CRUD operations for all app data
 */

class Storage {
    constructor() {
        this.keys = {
            SESSIONS: 'kungfu_sessions',
            SETTINGS: 'kungfu_settings',
            BELTS: 'kungfu_belts',
            STATS: 'kungfu_stats'
        };
        this.initializeData();
    }

    /**
     * Initialize default data if not exists
     */
    initializeData() {
        // Initialize sessions if not exists
        if (!localStorage.getItem(this.keys.SESSIONS)) {
            this.setItem(this.keys.SESSIONS, []);
        }

        // Initialize settings
        if (!localStorage.getItem(this.keys.SETTINGS)) {
            const defaultSettings = {
                theme: 'light',
                notifications: true,
                language: 'en',
                firstLaunch: true
            };
            this.setItem(this.keys.SETTINGS, defaultSettings);
        }

        // Initialize belt system
        if (!localStorage.getItem(this.keys.BELTS)) {
            const beltSystem = {
                currentBelt: 'white',
                unlockedBelts: ['white'],
                totalHours: 0,
                weeklyConsistency: 0,
                trainingVariety: 0
            };
            this.setItem(this.keys.BELTS, beltSystem);
        }

        // Add some sample data if it's the first launch
        const settings = this.getItem(this.keys.SETTINGS);
        if (settings.firstLaunch) {
            this.seedSampleData();
            settings.firstLaunch = false;
            this.setItem(this.keys.SETTINGS, settings);
        }
    }

    /**
     * Seed sample data for demonstration
     */
    seedSampleData() {
        const sampleSessions = [
            {
                id: this.generateId(),
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 60,
                type: 'Forms',
                notes: 'Practiced Tiger style form, focused on balance and flow.',
                timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
            },
            {
                id: this.generateId(),
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 90,
                type: 'Sparring',
                notes: 'Great sparring session with advanced techniques.',
                timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
            },
            {
                id: this.generateId(),
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 45,
                type: 'Meditation',
                notes: 'Deep breathing exercises and mindfulness practice.',
                timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
            },
            {
                id: this.generateId(),
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 75,
                type: 'Weapons',
                notes: 'Staff training - learned new spinning techniques.',
                timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
            }
        ];

        this.setItem(this.keys.SESSIONS, sampleSessions);
    }

    /**
     * Generic storage methods
     */
    setItem(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Session CRUD operations
     */
    getAllSessions() {
        return this.getItem(this.keys.SESSIONS) || [];
    }

    getSessionById(id) {
        const sessions = this.getAllSessions();
        return sessions.find(session => session.id === id) || null;
    }

    addSession(sessionData) {
        const sessions = this.getAllSessions();
        const newSession = {
            id: this.generateId(),
            ...sessionData,
            timestamp: Date.now()
        };
        
        sessions.push(newSession);
        
        if (this.setItem(this.keys.SESSIONS, sessions)) {
            this.updateStats();
            return newSession;
        }
        return null;
    }

    updateSession(id, sessionData) {
        const sessions = this.getAllSessions();
        const index = sessions.findIndex(session => session.id === id);
        
        if (index !== -1) {
            sessions[index] = { ...sessions[index], ...sessionData };
            if (this.setItem(this.keys.SESSIONS, sessions)) {
                this.updateStats();
                return sessions[index];
            }
        }
        return null;
    }

    deleteSession(id) {
        const sessions = this.getAllSessions();
        const filteredSessions = sessions.filter(session => session.id !== id);
        
        if (this.setItem(this.keys.SESSIONS, filteredSessions)) {
            this.updateStats();
            return true;
        }
        return false;
    }

    /**
     * Filter and search sessions
     */
    filterSessions(filters = {}) {
        let sessions = this.getAllSessions();

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            sessions = sessions.filter(session => 
                session.type.toLowerCase() === filters.type.toLowerCase()
            );
        }

        // Filter by date range
        if (filters.startDate) {
            sessions = sessions.filter(session => 
                new Date(session.date) >= new Date(filters.startDate)
            );
        }
        
        if (filters.endDate) {
            sessions = sessions.filter(session => 
                new Date(session.date) <= new Date(filters.endDate)
            );
        }

        // Search in notes
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            sessions = sessions.filter(session =>
                session.notes.toLowerCase().includes(searchTerm) ||
                session.type.toLowerCase().includes(searchTerm)
            );
        }

        // Sort by date (newest first)
        sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

        return sessions;
    }

    /**
     * Statistics calculations
     */
    updateStats() {
        const sessions = this.getAllSessions();
        const stats = this.calculateStats(sessions);
        this.setItem(this.keys.STATS, stats);
        this.updateBeltProgress(stats);
    }

    calculateStats(sessions) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Total stats
        const totalSessions = sessions.length;
        const totalHours = sessions.reduce((sum, session) => sum + session.duration, 0) / 60;

        // Weekly stats
        const weeklySessions = sessions.filter(session => 
            new Date(session.date) >= oneWeekAgo
        );
        const weeklyHours = weeklySessions.reduce((sum, session) => sum + session.duration, 0) / 60;

        // Monthly stats
        const monthlySessions = sessions.filter(session => 
            new Date(session.date) >= oneMonthAgo
        );
        const monthlyHours = monthlySessions.reduce((sum, session) => sum + session.duration, 0) / 60;

        // Training types distribution
        const typeDistribution = {};
        sessions.forEach(session => {
            typeDistribution[session.type] = (typeDistribution[session.type] || 0) + session.duration;
        });

        return {
            totalSessions,
            totalHours,
            weeklyHours,
            monthlyHours,
            averageSessionLength: totalSessions ? (totalHours * 60) / totalSessions : 0,
            typeDistribution,
            lastUpdated: Date.now()
        };
    }

    getStats() {
        return this.getItem(this.keys.STATS) || this.calculateStats(this.getAllSessions());
    }

    /**
     * Belt system methods
     */
    getBeltSystem() {
        return this.getItem(this.keys.BELTS);
    }

    updateBeltProgress(stats) {
        const beltSystem = this.getBeltSystem();
        const belts = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
        
        // Calculate progress based on requirements
        const requirements = this.getBeltRequirements();
        const currentBeltIndex = belts.indexOf(beltSystem.currentBelt);
        
        // Check if eligible for next belt
        if (currentBeltIndex < belts.length - 1) {
            const nextBelt = belts[currentBeltIndex + 1];
            const nextRequirements = requirements[nextBelt];
            
            let canProgress = true;
            for (const req of nextRequirements) {
                if (!this.checkRequirement(req, stats)) {
                    canProgress = false;
                    break;
                }
            }
            
            if (canProgress && !beltSystem.unlockedBelts.includes(nextBelt)) {
                beltSystem.currentBelt = nextBelt;
                beltSystem.unlockedBelts.push(nextBelt);
                this.setItem(this.keys.BELTS, beltSystem);
                
                // Trigger belt unlock event
                this.triggerBeltUnlock(nextBelt);
            }
        }
        
        // Update belt system stats
        beltSystem.totalHours = stats.totalHours;
        beltSystem.weeklyConsistency = this.calculateWeeklyConsistency();
        beltSystem.trainingVariety = Object.keys(stats.typeDistribution).length;
        
        this.setItem(this.keys.BELTS, beltSystem);
    }

    getBeltRequirements() {
        return {
            white: [], // Starting belt
            yellow: [
                { type: 'totalHours', value: 5, label: 'Complete 5 hours of training' },
                { type: 'totalSessions', value: 3, label: 'Complete 3 training sessions' }
            ],
            orange: [
                { type: 'totalHours', value: 15, label: 'Complete 15 hours of training' },
                { type: 'weeklyConsistency', value: 2, label: 'Train 2 times per week for 2 weeks' },
                { type: 'trainingVariety', value: 2, label: 'Try at least 2 different training types' }
            ],
            green: [
                { type: 'totalHours', value: 35, label: 'Complete 35 hours of training' },
                { type: 'weeklyConsistency', value: 4, label: 'Maintain weekly consistency' },
                { type: 'trainingVariety', value: 3, label: 'Master 3 different training types' }
            ],
            blue: [
                { type: 'totalHours', value: 70, label: 'Complete 70 hours of training' },
                { type: 'weeklyConsistency', value: 8, label: 'Show long-term dedication' },
                { type: 'trainingVariety', value: 4, label: 'Excel in 4 training types' }
            ],
            brown: [
                { type: 'totalHours', value: 150, label: 'Complete 150 hours of training' },
                { type: 'weeklyConsistency', value: 16, label: 'Demonstrate mastery through consistency' },
                { type: 'trainingVariety', value: 5, label: 'Master all major training types' }
            ],
            black: [
                { type: 'totalHours', value: 300, label: 'Complete 300 hours of training' },
                { type: 'weeklyConsistency', value: 32, label: 'Achieve true mastery' },
                { type: 'trainingVariety', value: 6, label: 'Become a complete martial artist' }
            ]
        };
    }

    checkRequirement(requirement, stats) {
        switch (requirement.type) {
            case 'totalHours':
                return stats.totalHours >= requirement.value;
            case 'totalSessions':
                return stats.totalSessions >= requirement.value;
            case 'weeklyConsistency':
                return this.calculateWeeklyConsistency() >= requirement.value;
            case 'trainingVariety':
                return Object.keys(stats.typeDistribution).length >= requirement.value;
            default:
                return false;
        }
    }

    calculateWeeklyConsistency() {
        const sessions = this.getAllSessions();
        const weeks = {};
        
        sessions.forEach(session => {
            const date = new Date(session.date);
            const weekKey = this.getWeekKey(date);
            weeks[weekKey] = (weeks[weekKey] || 0) + 1;
        });
        
        return Object.values(weeks).filter(count => count >= 2).length;
    }

    getWeekKey(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    }

    triggerBeltUnlock(belt) {
        // Create custom event for belt unlock
        const event = new CustomEvent('beltUnlocked', {
            detail: { belt, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Settings methods
     */
    getSettings() {
        return this.getItem(this.keys.SETTINGS);
    }

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.setItem(this.keys.SETTINGS, settings);
    }

    /**
     * Utility methods
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        return {
            sessions: this.getAllSessions(),
            settings: this.getSettings(),
            belts: this.getBeltSystem(),
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.sessions) this.setItem(this.keys.SESSIONS, data.sessions);
            if (data.settings) this.setItem(this.keys.SETTINGS, data.settings);
            if (data.belts) this.setItem(this.keys.BELTS, data.belts);
            if (data.stats) this.setItem(this.keys.STATS, data.stats);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        Object.values(this.keys).forEach(key => {
            this.removeItem(key);
        });
        this.initializeData();
    }
}

// Create global storage instance
window.storage = new Storage(); 