/**
 * Competition Manager - Handles competition tracking operations
 * Supports competitions with multiple specialties and matches
 */

class CompetitionManager {
    constructor() {
        this.specialtyTypes = [
            'Taolu',
            'Sanda Light',
            'Tuishou (fixed step)',
            'Tuischou (moving step)'
        ];

        this.medalOptions = ['none', 'bronze', 'silver', 'gold'];
        this.matchResults = ['won', 'lost', 'draw'];

        this.currentEditingCompetition = null;
        this.filters = {
            specialty: 'all',
            medal: 'all',
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
        window.addEventListener('storage', () => {
            this.refreshCompetitions();
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'competition-form') {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('competition-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'competition-search') {
                this.handleSearchChange(e.target.value);
            }
        });

        document.addEventListener('click', (e) => {
            const competitionFormNav = e.target.closest('.nav-item[data-view="competition-form"]');
            if (competitionFormNav) {
                this.currentEditingCompetition = null;
            }

            const addSpecialtyBtn = e.target.closest('#add-specialty-btn');
            if (addSpecialtyBtn) {
                e.preventDefault();
                this.addSpecialtyBlock();
                return;
            }

            const removeSpecialtyBtn = e.target.closest('.remove-specialty-btn');
            if (removeSpecialtyBtn) {
                e.preventDefault();
                const specialtyBlock = removeSpecialtyBtn.closest('.specialty-block');
                this.removeSpecialtyBlock(specialtyBlock);
                return;
            }

            const addMatchBtn = e.target.closest('.add-match-btn');
            if (addMatchBtn) {
                e.preventDefault();
                const specialtyBlock = addMatchBtn.closest('.specialty-block');
                this.addMatchRow(specialtyBlock);
                return;
            }

            const removeMatchBtn = e.target.closest('.remove-match-btn');
            if (removeMatchBtn) {
                e.preventDefault();
                const matchRow = removeMatchBtn.closest('.match-row');
                this.removeMatchRow(matchRow);
                return;
            }

            const addRoundBtn = e.target.closest('.add-round-btn');
            if (addRoundBtn) {
                e.preventDefault();
                const matchRow = addRoundBtn.closest('.match-row');
                this.addRoundRow(matchRow);
                return;
            }

            const removeRoundBtn = e.target.closest('.remove-round-btn');
            if (removeRoundBtn) {
                e.preventDefault();
                const roundRow = removeRoundBtn.closest('.round-row');
                this.removeRoundRow(roundRow);
            }
        });
    }

    /**
     * Public metadata helpers
     */
    getSpecialtyTypes() {
        return [...this.specialtyTypes];
    }

    getMedalOptions() {
        return this.medalOptions.map(value => ({
            value,
            label: this.getMedalLabel(value)
        }));
    }

    getFilteredCompetitions() {
        return storage.filterCompetitions(this.filters);
    }

    /**
     * Form initialization
     */
    initializeForm() {
        const form = document.getElementById('competition-form');
        if (!form) {
            return;
        }

        const dateInput = form.querySelector('[name="date"]');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        if (this.currentEditingCompetition) {
            this.populateForm(form, this.currentEditingCompetition);
            return;
        }

        this.clearForm(false);
    }

    /**
     * Add a specialty form block
     */
    addSpecialtyBlock(specialtyData = null) {
        const container = document.getElementById('specialties-container');
        if (!container) {
            return;
        }

        const specialtyIndex = container.querySelectorAll('.specialty-block').length;
        container.insertAdjacentHTML(
            'beforeend',
            this.createSpecialtyBlockMarkup(specialtyIndex, specialtyData)
        );

        const specialtyBlock = container.lastElementChild;
        const initialMatches = Array.isArray(specialtyData?.matches)
            ? specialtyData.matches
            : [null];

        initialMatches.forEach(match => {
            this.addMatchRow(specialtyBlock, match);
        });

        this.renumberSpecialties();
    }

    /**
     * Remove specialty block
     */
    removeSpecialtyBlock(specialtyBlock) {
        if (!specialtyBlock) {
            return;
        }

        const container = document.getElementById('specialties-container');
        if (!container) {
            return;
        }

        specialtyBlock.remove();
        this.renumberSpecialties();
    }

    /**
     * Add a match row to a specialty
     */
    addMatchRow(specialtyBlock, matchData = null) {
        if (!specialtyBlock) {
            return;
        }

        const matchesContainer = specialtyBlock.querySelector('.specialty-matches');
        if (!matchesContainer) {
            return;
        }

        matchesContainer.insertAdjacentHTML('beforeend', this.createMatchRowMarkup(matchData));
        const matchRow = matchesContainer.lastElementChild;
        const initialRounds = Array.isArray(matchData?.rounds)
            ? matchData.rounds
            : [null];
        initialRounds.forEach(round => this.addRoundRow(matchRow, round));

        this.renumberMatches(specialtyBlock);
    }

    /**
     * Remove a match row
     */
    removeMatchRow(matchRow) {
        if (!matchRow) {
            return;
        }

        const specialtyBlock = matchRow.closest('.specialty-block');
        const matchesContainer = specialtyBlock?.querySelector('.specialty-matches');
        if (!matchesContainer) {
            return;
        }

        matchRow.remove();
        this.renumberMatches(specialtyBlock);
    }

    /**
     * Add a round row to a match
     */
    addRoundRow(matchRow, roundData = null) {
        if (!matchRow) {
            return;
        }

        const roundsContainer = matchRow.querySelector('.match-rounds');
        if (!roundsContainer) {
            return;
        }

        roundsContainer.insertAdjacentHTML('beforeend', this.createRoundRowMarkup(roundData));
        this.renumberRounds(matchRow);
    }

    /**
     * Remove a round row
     */
    removeRoundRow(roundRow) {
        if (!roundRow) {
            return;
        }

        const matchRow = roundRow.closest('.match-row');
        const roundsContainer = matchRow?.querySelector('.match-rounds');
        if (!roundsContainer) {
            return;
        }

        roundRow.remove();
        this.renumberRounds(matchRow);
    }

    /**
     * Handle form submit
     */
    handleFormSubmit(form) {
        const competitionData = this.collectFormData(form);

        if (this.currentEditingCompetition) {
            this.updateCompetition(this.currentEditingCompetition.id, competitionData);
        } else {
            this.addCompetition(competitionData);
        }
    }

    /**
     * Build form payload
     */
    collectFormData(form) {
        const specialties = Array.from(form.querySelectorAll('.specialty-block')).map(block => {
            const matches = Array.from(block.querySelectorAll('.match-row')).map(row => ({
                opponentName: row.querySelector('.opponent-name')?.value || '',
                result: row.querySelector('.match-result')?.value || '',
                notes: row.querySelector('.match-notes')?.value || '',
                rounds: Array.from(row.querySelectorAll('.round-row')).map(round => ({
                    myPoints: round.querySelector('.round-my-points')?.value || '',
                    opponentPoints: round.querySelector('.round-opponent-points')?.value || '',
                    notes: round.querySelector('.round-notes')?.value || ''
                }))
            }));

            return {
                specialty: block.querySelector('.specialty-name')?.value || '',
                medal: block.querySelector('.specialty-medal')?.value || 'none',
                notes: block.querySelector('.specialty-notes')?.value || '',
                matches
            };
        });

        return {
            date: form.querySelector('[name="date"]')?.value || '',
            location: form.querySelector('[name="location"]')?.value || '',
            competitionType: form.querySelector('[name="competitionType"]')?.value || '',
            notes: form.querySelector('[name="notes"]')?.value || '',
            specialties
        };
    }

    /**
     * Add competition
     */
    addCompetition(competitionData) {
        try {
            const processedData = this.processCompetitionData(competitionData);
            const newCompetition = storage.addCompetition(processedData);

            if (!newCompetition) {
                throw new Error('Failed to save competition');
            }

            this.showSuccessMessage('Competition added successfully!');
            this.currentEditingCompetition = null;
            this.refreshCompetitions();

            if (window.router) {
                window.router.navigateTo('competition-list');
            }

            return newCompetition;
        } catch (error) {
            this.showErrorMessage(error.message);
            return null;
        }
    }

    /**
     * Update competition
     */
    updateCompetition(id, competitionData) {
        try {
            const processedData = this.processCompetitionData(competitionData);
            const updatedCompetition = storage.updateCompetition(id, processedData);

            if (!updatedCompetition) {
                throw new Error('Failed to update competition');
            }

            this.showSuccessMessage('Competition updated successfully!');
            this.currentEditingCompetition = null;
            this.refreshCompetitions();

            if (window.router) {
                window.router.navigateTo('competition-list');
            }

            return updatedCompetition;
        } catch (error) {
            this.showErrorMessage(error.message);
            return null;
        }
    }

    /**
     * Delete competition
     */
    deleteCompetition(id) {
        if (!confirm('Are you sure you want to delete this competition?')) {
            return false;
        }

        try {
            const success = storage.deleteCompetition(id);

            if (!success) {
                throw new Error('Failed to delete competition');
            }

            this.showSuccessMessage('Competition deleted successfully!');
            this.refreshCompetitions();
            return true;
        } catch (error) {
            this.showErrorMessage(error.message);
            return false;
        }
    }

    /**
     * Begin competition editing flow
     */
    editCompetition(id) {
        const competition = storage.getCompetitionById(id);
        if (!competition) {
            this.showErrorMessage('Competition not found');
            return;
        }

        this.currentEditingCompetition = competition;

        if (window.router) {
            window.router.navigateTo('competition-form');
        }
    }

    /**
     * Cancel editing mode
     */
    cancelEdit() {
        this.currentEditingCompetition = null;
        this.clearForm();
    }

    /**
     * Fill form with competition data
     */
    populateForm(form, competition) {
        if (!form || !competition) {
            return;
        }

        form.querySelector('[name="date"]').value = competition.date || '';
        form.querySelector('[name="location"]').value = competition.location || '';
        const legacyType = competition.specialties?.[0]?.competitionType || '';
        form.querySelector('[name="competitionType"]').value = competition.competitionType || legacyType;
        form.querySelector('[name="notes"]').value = competition.notes || '';

        const specialtiesContainer = form.querySelector('#specialties-container');
        specialtiesContainer.innerHTML = '';

        if (Array.isArray(competition.specialties) && competition.specialties.length > 0) {
            competition.specialties.forEach(specialty => this.addSpecialtyBlock(specialty));
        } else {
            this.addSpecialtyBlock();
        }

        this.updateFormMode(form, true);
    }

    /**
     * Reset competition form to default state
     */
    clearForm(resetEditing = true) {
        const form = document.getElementById('competition-form');
        if (!form) {
            return;
        }

        form.reset();
        const dateInput = form.querySelector('[name="date"]');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        const specialtiesContainer = form.querySelector('#specialties-container');
        if (specialtiesContainer) {
            specialtiesContainer.innerHTML = '';
            this.addSpecialtyBlock();
        }

        this.updateFormMode(form, false);
        if (resetEditing) {
            this.currentEditingCompetition = null;
        }
    }

    /**
     * Normalize competition payload before save
     */
    processCompetitionData(data) {
        return {
            date: data.date || '',
            location: (data.location || '').trim(),
            competitionType: (data.competitionType || '').trim(),
            notes: (data.notes || '').trim(),
            specialties: (Array.isArray(data.specialties) ? data.specialties : []).map(specialty => ({
                specialty: specialty.specialty || '',
                medal: specialty.medal || 'none',
                notes: (specialty.notes || '').trim(),
                matches: (Array.isArray(specialty.matches) ? specialty.matches : []).map(match => ({
                    opponentName: (match.opponentName || '').trim(),
                    result: match.result || '',
                    notes: (match.notes || '').trim(),
                    rounds: (Array.isArray(match.rounds) ? match.rounds : [])
                        .filter(round =>
                            String(round.myPoints ?? '').trim() !== '' ||
                            String(round.opponentPoints ?? '').trim() !== '' ||
                            (round.notes && round.notes.trim())
                        )
                        .map(round => ({
                            myPoints: this.normalizeRoundScore(round.myPoints),
                            opponentPoints: this.normalizeRoundScore(round.opponentPoints),
                            notes: (round.notes || '').trim()
                        }))
                }))
            }))
        };
    }

    normalizeRoundScore(value) {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    /**
     * Competition filters
     */
    handleFilterChange(element) {
        const filterType = element.name;
        const filterValue = element.value;

        this.filters[filterType] = filterValue;
        this.refreshCompetitions();
    }

    handleSearchChange(searchTerm) {
        this.filters.search = searchTerm;
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.refreshCompetitions();
        }, 300);
    }

    refreshCompetitions() {
        const event = new CustomEvent('competitionsUpdated', {
            detail: { competitions: this.getFilteredCompetitions() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Utility formatting
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

    getMedalLabel(medal) {
        const labels = {
            none: 'No Medal',
            bronze: 'Bronze',
            silver: 'Silver',
            gold: 'Gold'
        };
        return labels[medal] || 'No Medal';
    }

    getMatchResultLabel(result) {
        const labels = {
            won: 'Won',
            lost: 'Lost',
            draw: 'Draw'
        };
        return labels[result] || result;
    }

    /**
     * Form UI helpers
     */
    createSpecialtyBlockMarkup(index, specialtyData = null) {
        const specialtyOptions = this.specialtyTypes.map(type =>
            `<option value="${type}" ${specialtyData?.specialty === type ? 'selected' : ''}>${type}</option>`
        ).join('');

        const medalOptions = this.getMedalOptions().map(option =>
            `<option value="${option.value}" ${specialtyData?.medal === option.value ? 'selected' : ''}>${option.label}</option>`
        ).join('');

        return `
            <div class="specialty-block card">
                <div class="specialty-header">
                    <h3 class="specialty-title">Specialty ${index + 1}</h3>
                    <button type="button" class="btn btn-secondary btn-sm remove-specialty-btn">
                        <i class="fas fa-trash"></i>
                        Remove Specialty
                    </button>
                </div>
                <div class="specialty-fields">
                    <div class="form-group">
                        <label class="form-label">Specialty</label>
                        <select class="form-select specialty-name">
                            <option value="">Select specialty...</option>
                            ${specialtyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Medal Result</label>
                        <select class="form-select specialty-medal">
                            ${medalOptions}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Specialty Notes (optional)</label>
                    <textarea class="form-textarea specialty-notes" placeholder="Performance notes, judging details...">${specialtyData?.notes || ''}</textarea>
                </div>
                <div class="specialty-matches"></div>
                <button type="button" class="btn btn-secondary btn-sm add-match-btn">
                    <i class="fas fa-plus"></i>
                    Add Match
                </button>
            </div>
        `;
    }

    createMatchRowMarkup(matchData = null) {
        const resultOptions = this.matchResults.map(result =>
            `<option value="${result}" ${matchData?.result === result ? 'selected' : ''}>${this.getMatchResultLabel(result)}</option>`
        ).join('');

        return `
            <div class="match-row">
                <div class="match-row-header">
                    <h4 class="match-title">Match</h4>
                    <button type="button" class="btn btn-icon btn-secondary remove-match-btn" title="Remove Match">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="match-row-fields">
                    <div class="form-group">
                        <label class="form-label">Opponent Name</label>
                        <input type="text" class="form-input opponent-name" placeholder="Opponent name" value="${matchData?.opponentName || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Match Result</label>
                        <select class="form-select match-result">
                            <option value="">Select result...</option>
                            ${resultOptions}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Match Notes (optional)</label>
                    <textarea class="form-textarea match-notes" placeholder="Score, key moments, decisions...">${matchData?.notes || ''}</textarea>
                </div>
                <div class="match-rounds-section">
                    <div class="match-rounds-header">
                        <h5 class="rounds-title">Rounds</h5>
                        <button type="button" class="btn btn-secondary btn-sm add-round-btn">
                            <i class="fas fa-plus"></i>
                            Add Round
                        </button>
                    </div>
                    <div class="match-rounds"></div>
                </div>
            </div>
        `;
    }

    createRoundRowMarkup(roundData = null) {
        return `
            <div class="round-row">
                <div class="round-row-header">
                    <h6 class="round-title">Round</h6>
                    <button type="button" class="btn btn-icon btn-secondary remove-round-btn" title="Remove Round">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="round-row-fields">
                    <div class="form-group">
                        <label class="form-label">Your Points</label>
                        <input type="number" class="form-input round-my-points" step="1" value="${roundData?.myPoints ?? ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Opponent Points</label>
                        <input type="number" class="form-input round-opponent-points" step="1" value="${roundData?.opponentPoints ?? ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Round Notes (optional)</label>
                    <textarea class="form-textarea round-notes" placeholder="Round-specific notes...">${roundData?.notes || ''}</textarea>
                </div>
            </div>
        `;
    }

    updateFormMode(form, isEditMode) {
        const titleElement = form.querySelector('.form-title');
        const submitBtnText = form.querySelector('.competition-submit-text');

        if (titleElement) {
            titleElement.textContent = isEditMode ? 'Edit Competition' : 'Add New Competition';
        }

        if (submitBtnText) {
            submitBtnText.textContent = isEditMode ? 'Update Competition' : 'Add Competition';
        }
    }

    renumberSpecialties() {
        document.querySelectorAll('#specialties-container .specialty-block').forEach((block, index) => {
            const title = block.querySelector('.specialty-title');
            if (title) {
                title.textContent = `Specialty ${index + 1}`;
            }
            this.renumberMatches(block);
        });
    }

    renumberMatches(specialtyBlock) {
        specialtyBlock.querySelectorAll('.match-row').forEach((row, index) => {
            const title = row.querySelector('.match-title');
            if (title) {
                title.textContent = `Match ${index + 1}`;
            }
            this.renumberRounds(row);
        });
    }

    renumberRounds(matchRow) {
        matchRow.querySelectorAll('.round-row').forEach((row, index) => {
            const title = row.querySelector('.round-title');
            if (title) {
                title.textContent = `Round ${index + 1}`;
            }
        });
    }

    /**
     * Toast helpers
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(messageEl);
        setTimeout(() => messageEl.classList.add('show'), 100);

        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}

// Create global competition manager instance
window.competitionManager = new CompetitionManager();
