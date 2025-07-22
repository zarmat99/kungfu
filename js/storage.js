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

        // Initialize stats
        if (!localStorage.getItem(this.keys.STATS)) {
            const emptyStats = {
                totalSessions: 0,
                totalHours: 0,
                weeklyHours: 0,
                monthlyHours: 0,
                typeDistribution: {},
                lastUpdated: Date.now()
            };
            this.setItem(this.keys.STATS, emptyStats);
        }
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
        const belts = Object.keys(this.getBeltRequirements()); // Get belts directly from requirements definition
        
        let progressed = true;
        while(progressed) {
            progressed = false;
            const currentBeltIndex = belts.indexOf(beltSystem.currentBelt);
        
            if (currentBeltIndex < belts.length - 1) {
                const nextBelt = belts[currentBeltIndex + 1];
                const nextRequirements = this.getBeltRequirements()[nextBelt];
            
                if (nextRequirements && nextRequirements.length > 0) {
                    // Check if ALL requirements for the next belt are met
                    const canProgress = nextRequirements.every(req => this.checkRequirement(req, stats));
            
                    if (canProgress && !beltSystem.unlockedBelts.includes(nextBelt)) {
                        beltSystem.currentBelt = nextBelt;
                        beltSystem.unlockedBelts.push(nextBelt);
                        this.triggerBeltUnlock(nextBelt);
                        progressed = true; // Set to true to check for the next level
                    }
                }
            }
        }
        
        beltSystem.totalHours = stats.totalHours;
        this.setItem(this.keys.BELTS, beltSystem);
    }

    getBeltRequirements() {
        return {
            'white': [],
            'yellow': [
                { type: 'totalHours', value: 60, label: '60 ore di allenamento' }
            ],
            'orange': [
                { type: 'totalHours', value: 130, label: '130 ore di allenamento' }
            ],
            'green': [
                { type: 'totalHours', value: 220, label: '220 ore di allenamento' }
            ],
            'blue': [
                { type: 'totalHours', value: 320, label: '320 ore di allenamento' }
            ],
            'brown': [
                { type: 'totalHours', value: 450, label: '450 ore di allenamento' }
            ],
            'black-1duan': [
                { type: 'totalHours', value: 600, label: '600 ore di allenamento' }
            ],
            'black-2duan': [
                { type: 'totalHours', value: 800, label: '800 ore di allenamento' }
            ],
            'black-3duan': [
                { type: 'totalHours', value: 1000, label: '1000 ore di allenamento' }
            ],
            'black-4duan': [
                { type: 'totalHours', value: 1250, label: '1250 ore di allenamento' }
            ],
            'black-5duan': [
                { type: 'totalHours', value: 1500, label: '1500 ore di allenamento' }
            ],
            'black-6duan': [
                { type: 'totalHours', value: 1750, label: '1750 ore di allenamento' }
            ],
            'black-7duan': [
                { type: 'totalHours', value: 2000, label: '2000 ore di allenamento' }
            ],
            'black-8duan': [
                { type: 'totalHours', value: 2250, label: '2250 ore di allenamento' }
            ],
            'black-9duan': [
                { type: 'totalHours', value: 2500, label: '2500 ore di allenamento' }
            ]
        };
    }

    checkRequirement(requirement, stats) {
        switch (requirement.type) {
            case 'totalHours':
                return (stats.totalHours || 0) >= requirement.value;
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

    getSessionsInLastDays(days) {
        const sessions = this.getAllSessions();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return sessions.filter(s => new Date(s.date) >= cutoffDate).length;
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
        const data = {};
        
        // Export all the main storage keys
        Object.values(this.keys).forEach(key => {
            const value = this.getItem(key);
            if (value !== null) {
                data[key] = value;
            }
        });
        
        // Export achievements
        const achievements = localStorage.getItem('unlocked_achievements');
        if (achievements) {
            data['unlocked_achievements'] = JSON.parse(achievements);
        }
        
        return data;
    }

    importData(data) {
        try {
            // Basic validation
            if (!data || typeof data !== 'object' || !data['kungfu_sessions'] || !data['kungfu_stats']) {
                console.error('Invalid data structure for import');
                return false;
            }

            // Clear existing data before import
            this.clearAllData(false); // don't add seed data

            for (const key in data) {
                if (Object.hasOwnProperty.call(data, key)) {
                    this.setItem(key, data[key]);
                }
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData(addSeedData = false) {
        // Clear all kungfu-related data from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kungfu-')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Force clear specific keys to ensure they're gone
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear achievements specifically
        localStorage.removeItem('unlocked_achievements');

        // Reinitialize the belt system to ensure it starts fresh
        const beltSystem = {
            currentBelt: 'white',
            unlockedBelts: ['white'],
            totalHours: 0,
            weeklyConsistency: 0,
            trainingVariety: 0
        };
        this.setItem(this.keys.BELTS, beltSystem);

        // Initialize empty stats
        const emptyStats = {
            totalSessions: 0,
            totalHours: 0,
            weeklyHours: 0,
            monthlyHours: 0,
            typeDistribution: {},
            lastUpdated: Date.now()
        };
        this.setItem(this.keys.STATS, emptyStats);

        // Initialize empty sessions array
        this.setItem(this.keys.SESSIONS, []);

        // Reset settings to default
        const defaultSettings = {
            theme: 'light',
            notifications: true,
            language: 'en',
            firstLaunch: false
        };
        this.setItem(this.keys.SETTINGS, defaultSettings);

        if (addSeedData) {
        }
    }
}

// Create global storage instance
window.storage = new Storage(); 