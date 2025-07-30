/**
 * Session Manager - Handles all session-related operations
 * Provides business logic layer between UI and storage
 */

class SessionManager {
    constructor() {
        this.trainingTypes = [
            'Shaolin / Yiquan / Taijiquan',
            'tuishou / sanda',
            'teacher-free'
        ];
        
        this.currentEditingSession = null;
        this.filters = {
            type: 'all',
            search: '',
            startDate: '',
            endDate: ''
        };
        
        this.bindEvents();
    }

    /**
     * Bind global events
     */
    bindEvents() {
        // Listen for storage events
        window.addEventListener('storage', () => {
            this.refreshSessions();
        });

        // Listen for form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'session-form') {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });

        // Listen for filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('session-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Listen for search input
        document.addEventListener('input', (e) => {
            if (e.target.id === 'session-search') {
                this.handleSearchChange(e.target.value);
            }
        });
    }

    /**
     * Get all training types
     */
    getTrainingTypes() {
        return this.trainingTypes;
    }

    /**
     * Get training type weights for hour calculation
     */
    getTrainingTypeWeights() {
        return {
            'Shaolin / Yiquan / Taijiquan': 1.0,
            'tuishou / sanda': 1.0,
            'teacher-free': 0.5
        };
    }

    /**
     * Get training type info including weight and effectiveness
     */
    getTrainingTypeInfo(type) {
        const weights = this.getTrainingTypeWeights();
        const weight = weights[type] || 1.0;
        
        return {
            type: type,
            weight: weight,
            effectiveness: weight === 1.0 ? 'Full effectiveness' : `${Math.round(weight * 100)}% effectiveness`
        };
    }

    /**
     * Get all training types with their info
     */
    getTrainingTypesWithInfo() {
        return this.trainingTypes.map(type => this.getTrainingTypeInfo(type));
    }

    /**
     * Get sessions with current filters applied
     */
    getFilteredSessions() {
        return storage.filterSessions(this.filters);
    }

    /**
     * Get sessions for specific date
     */
    getSessionsForDate(date) {
        const sessions = storage.getAllSessions();
        return sessions.filter(session => session.date === date);
    }

    /**
     * Get sessions for current month
     */
    getSessionsForMonth(year, month) {
        const sessions = storage.getAllSessions();
        return sessions.filter(session => {
            // session.date is in 'YYYY-MM-DD' format
            const [y, m] = session.date.split('-');
            return Number(y) === year && Number(m) === month + 1;
        });
    }

    /**
     * Add new session
     */
    addSession(sessionData) {
        try {
            // Validate session data
            const validationResult = this.validateSessionData(sessionData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            // Process session data
            const processedData = this.processSessionData(sessionData);
            
            // Save to storage
            const newSession = storage.addSession(processedData);
            
            if (newSession) {
                this.showSuccessMessage('Training session added successfully!');
                this.refreshSessions();
                
                // Clear only the notes field, keeping other fields for quick re-entry
                const notesInput = document.querySelector('#session-form [name="notes"]');
                if (notesInput) {
                    notesInput.value = '';
                }
                
                return newSession;
            } else {
                throw new Error('Failed to save session');
            }
        } catch (error) {
            this.showErrorMessage(error.message);
            return null;
        }
    }

    /**
     * Update existing session
     */
    updateSession(id, sessionData) {
        try {
            // Validate session data
            const validationResult = this.validateSessionData(sessionData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            // Process session data
            const processedData = this.processSessionData(sessionData);
            
            // Update in storage
            const updatedSession = storage.updateSession(id, processedData);
            
            if (updatedSession) {
                this.showSuccessMessage('Training session updated successfully!');
                this.refreshSessions();
                this.clearForm();
                this.currentEditingSession = null;
                return updatedSession;
            } else {
                throw new Error('Failed to update session');
            }
        } catch (error) {
            this.showErrorMessage(error.message);
            return null;
        }
    }

    /**
     * Delete session
     */
    deleteSession(id) {
        if (confirm('Are you sure you want to delete this training session?')) {
            try {
                const success = storage.deleteSession(id);
                
                if (success) {
                    this.showSuccessMessage('Training session deleted successfully!');
                    this.refreshSessions();
                    return true;
                } else {
                    throw new Error('Failed to delete session');
                }
            } catch (error) {
                this.showErrorMessage(error.message);
                return false;
            }
        }
        return false;
    }

    /**
     * Start editing session
     */
    editSession(id) {
        const session = storage.getSessionById(id);
        if (session) {
            this.currentEditingSession = session;
            this.populateForm(session);
            this.switchToSessionForm();
        }
    }

    /**
     * Cancel editing
     */
    cancelEdit() {
        this.currentEditingSession = null;
        this.clearForm();
    }

    /**
     * Validate session data
     */
    validateSessionData(data) {
        const errors = [];

        // Validate date
        if (!data.date || !this.isValidDate(data.date)) {
            errors.push('Please select a valid date');
        }

        // Validate duration
        const duration = parseInt(data.duration);
        if (!duration || duration < 1 || duration > 480) { // Max 8 hours
            errors.push('Duration must be between 1 and 480 minutes');
        }

        // Validate training type
        if (!data.type || !this.trainingTypes.includes(data.type)) {
            errors.push('Please select a valid training type');
        }

        // Validate notes (optional but if provided, should be reasonable length)
        if (data.notes && data.notes.length > 1000) {
            errors.push('Notes must be less than 1000 characters');
        }

        return {
            isValid: errors.length === 0,
            message: errors.join('; ')
        };
    }

    /**
     * Process session data before saving
     */
    processSessionData(data) {
        return {
            date: data.date,
            duration: parseInt(data.duration),
            type: data.type.trim(),
            notes: data.notes ? data.notes.trim() : ''
        };
    }

    /**
     * Check if date is valid
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        
        // Check if date is valid and not in the future
        return date instanceof Date && 
               !isNaN(date) && 
               date <= now;
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(form) {
        const formData = new FormData(form);
        const sessionData = {
            date: formData.get('date'),
            duration: formData.get('duration'),
            type: formData.get('type'),
            notes: formData.get('notes')
        };

        if (this.currentEditingSession) {
            this.updateSession(this.currentEditingSession.id, sessionData);
        } else {
            this.addSession(sessionData);
        }
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(element) {
        const filterType = element.name;
        const filterValue = element.value;
        
        this.filters[filterType] = filterValue;
        this.refreshSessions();
    }

    /**
     * Handle search changes
     */
    handleSearchChange(searchTerm) {
        this.filters.search = searchTerm;
        // Debounce search to avoid too many calls
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.refreshSessions();
        }, 300);
    }

    /**
     * Populate form with session data
     */
    populateForm(session) {
        const form = document.getElementById('session-form');
        if (form) {
            form.querySelector('[name="date"]').value = session.date;
            form.querySelector('[name="duration"]').value = session.duration;
            form.querySelector('[name="type"]').value = session.type;
            form.querySelector('[name="notes"]').value = session.notes || '';
            
            // Update form title
            const formTitle = form.querySelector('.form-title');
            if (formTitle) {
                formTitle.textContent = 'Edit Training Session';
            }
            
            // Update submit button
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Update Session';
            }
        }
    }

    /**
     * Clear form
     */
    clearForm() {
        const form = document.getElementById('session-form');
        if (form) {
            form.reset();
            
            // Reset form title
            const formTitle = form.querySelector('.form-title');
            if (formTitle) {
                formTitle.textContent = 'Add New Training Session';
            }
            
            // Reset submit button
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Add Session';
            }
        }
    }

    /**
     * Switch to session form view
     */
    switchToSessionForm() {
        if (window.router) {
            window.router.navigateTo('session-form');
        }
    }

    /**
     * Refresh sessions display
     */
    refreshSessions() {
        // Trigger custom event to update UI
        const event = new CustomEvent('sessionsUpdated', {
            detail: { sessions: this.getFilteredSessions() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        return storage.getStats();
    }

    /**
     * Get sessions grouped by date for calendar
     */
    getSessionsGroupedByDate() {
        const sessions = storage.getAllSessions();
        const grouped = {};
        
        sessions.forEach(session => {
            if (!grouped[session.date]) {
                grouped[session.date] = [];
            }
            grouped[session.date].push(session);
        });
        
        return grouped;
    }

    /**
     * Format duration for display
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) {
            return `${mins}min`;
        } else if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}min`;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Get relative date (e.g., "2 days ago")
     */
    getRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message with animation
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => messageEl.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Export sessions to JSON
     */
    exportSessions() {
        const data = storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kungfu-sessions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccessMessage('Sessions exported successfully!');
    }

    /**
     * Import sessions from JSON
     */
    importSessions(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (storage.importData(data)) {
                    this.showSuccessMessage('Sessions imported successfully!');
                    this.refreshSessions();
                } else {
                    throw new Error('Failed to import data');
                }
            } catch (error) {
                this.showErrorMessage('Invalid file format or corrupted data');
            }
        };
        reader.readAsText(file);
    }
}

// Create global session manager instance
window.sessionManager = new SessionManager(); 