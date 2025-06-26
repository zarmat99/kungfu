/**
 * Reward System - Handles belt progression and achievements
 * Manages the Kung Fu belt system with realistic goals and rewards
 */

class RewardSystem {
    constructor() {
        this.belts = [
            { name: 'white', color: '#ffffff', textColor: '#333333', title: 'White Belt', description: 'Beginning your journey' },
            { name: 'yellow', color: '#ffeb3b', textColor: '#333333', title: 'Yellow Belt', description: 'First steps mastered' },
            { name: 'orange', color: '#ff9800', textColor: '#ffffff', title: 'Orange Belt', description: 'Building foundation' },
            { name: 'green', color: '#4caf50', textColor: '#ffffff', title: 'Green Belt', description: 'Growing stronger' },
            { name: 'blue', color: '#2196f3', textColor: '#ffffff', title: 'Blue Belt', description: 'Advancing skills' },
            { name: 'brown', color: '#795548', textColor: '#ffffff', title: 'Brown Belt', description: 'Approaching mastery' },
            { name: 'black', color: '#212121', textColor: '#ffffff', title: 'Black Belt', description: 'True mastery achieved' }
        ];
        
        this.achievements = [
            { id: 'first-session', name: 'First Steps', description: 'Complete your first training session', icon: 'fas fa-baby' },
            { id: 'week-warrior', name: 'Week Warrior', description: 'Train every day for a week', icon: 'fas fa-fire' },
            { id: 'hour-master', name: 'Hour Master', description: 'Complete a 2+ hour training session', icon: 'fas fa-clock' },
            { id: 'variety-seeker', name: 'Variety Seeker', description: 'Try all training types', icon: 'fas fa-star' },
            { id: 'consistency-king', name: 'Consistency King', description: 'Train regularly for 30 days', icon: 'fas fa-crown' },
            { id: 'century-club', name: 'Century Club', description: 'Complete 100 hours of training', icon: 'fas fa-trophy' }
        ];
        
        this.bindEvents();
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Listen for belt unlock events
        window.addEventListener('beltUnlocked', (event) => {
            this.handleBeltUnlock(event.detail);
        });

        // Listen for session updates to check achievements
        window.addEventListener('sessionsUpdated', () => {
            this.checkAchievements();
        });
    }

    /**
     * Get current belt information
     */
    getCurrentBelt() {
        const beltSystem = storage.getBeltSystem();
        const currentBeltData = this.belts.find(belt => belt.name === beltSystem.currentBelt);
        return {
            ...currentBeltData,
            ...beltSystem
        };
    }

    /**
     * Get next belt information
     */
    getNextBelt() {
        const currentBelt = this.getCurrentBelt();
        const currentIndex = this.belts.findIndex(belt => belt.name === currentBelt.name);
        
        if (currentIndex < this.belts.length - 1) {
            return this.belts[currentIndex + 1];
        }
        
        return null; // Already at highest belt
    }

    /**
     * Get progress to next belt
     */
    getBeltProgress() {
        const nextBelt = this.getNextBelt();
        if (!nextBelt) {
            return { progress: 100, requirements: [] };
        }
        
        const requirements = storage.getBeltRequirements()[nextBelt.name];
        const stats = storage.getStats();
        
        let completedRequirements = 0;
        const requirementProgress = requirements.map(req => {
            const isCompleted = storage.checkRequirement(req, stats);
            if (isCompleted) completedRequirements++;
            
            return {
                ...req,
                completed: isCompleted,
                progress: this.getRequirementProgress(req, stats)
            };
        });
        
        const overallProgress = requirements.length > 0 ? 
            Math.round((completedRequirements / requirements.length) * 100) : 100;
        
        return {
            progress: overallProgress,
            requirements: requirementProgress,
            nextBelt: nextBelt
        };
    }

    /**
     * Get progress for individual requirement
     */
    getRequirementProgress(requirement, stats) {
        let current = 0;
        let target = requirement.value;
        
        switch (requirement.type) {
            case 'totalHours':
                current = stats.totalHours || 0;
                break;
            case 'totalSessions':
                current = stats.totalSessions || 0;
                break;
            case 'weeklyConsistency':
                current = storage.calculateWeeklyConsistency();
                break;
            case 'trainingVariety':
                current = Object.keys(stats.typeDistribution || {}).length;
                break;
            default:
                current = 0;
        }
        
        return Math.min(Math.round((current / target) * 100), 100);
    }

    /**
     * Handle belt unlock
     */
    handleBeltUnlock(detail) {
        const belt = this.belts.find(b => b.name === detail.belt);
        if (belt) {
            this.showBeltUnlockAnimation(belt);
            this.playBeltUnlockSound();
            this.createConfetti();
        }
    }

    /**
     * Show belt unlock animation
     */
    showBeltUnlockAnimation(belt) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'belt-unlock-overlay';
        overlay.innerHTML = `
            <div class="belt-unlock-content">
                <div class="belt-unlock-animation">
                    <div class="belt-icon belt-${belt.name} animate-belt-unlock">
                        ${belt.title}
                    </div>
                    <h2 class="belt-unlock-title">Belt Unlocked!</h2>
                    <p class="belt-unlock-description">${belt.description}</p>
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continue Training
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 10000);
    }

    /**
     * Play belt unlock sound
     */
    playBeltUnlockSound() {
        // Create audio context for sound effect
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    /**
     * Create confetti effect
     */
    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 5000);
    }

    /**
     * Check and award achievements
     */
    checkAchievements() {
        const stats = storage.getStats();
        const sessions = storage.getAllSessions();
        
        this.achievements.forEach(achievement => {
            if (!this.isAchievementUnlocked(achievement.id)) {
                if (this.checkAchievementCondition(achievement, stats, sessions)) {
                    this.unlockAchievement(achievement);
                }
            }
        });
    }

    /**
     * Check if achievement is already unlocked
     */
    isAchievementUnlocked(achievementId) {
        const unlockedAchievements = storage.getItem('unlocked_achievements') || [];
        return unlockedAchievements.includes(achievementId);
    }

    /**
     * Check achievement condition
     */
    checkAchievementCondition(achievement, stats, sessions) {
        switch (achievement.id) {
            case 'first-session':
                return stats.totalSessions >= 1;
                
            case 'week-warrior':
                return this.checkWeeklyStreak(sessions) >= 7;
                
            case 'hour-master':
                return sessions.some(session => session.duration >= 120);
                
            case 'variety-seeker':
                const types = Object.keys(stats.typeDistribution || {});
                return types.length >= 6; // Assuming 6+ different types
                
            case 'consistency-king':
                return this.checkConsistencyStreak(sessions) >= 30;
                
            case 'century-club':
                return stats.totalHours >= 100;
                
            default:
                return false;
        }
    }

    /**
     * Check weekly training streak
     */
    checkWeeklyStreak(sessions) {
        const today = new Date();
        let currentStreak = 0;
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            if (sessions.some(session => session.date === dateStr)) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        return currentStreak;
    }

    /**
     * Check consistency streak (training at least every 3 days)
     */
    checkConsistencyStreak(sessions) {
        const today = new Date();
        let streak = 0;
        let lastTrainingDate = null;
        
        const sortedSessions = sessions
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        for (const session of sortedSessions) {
            const sessionDate = new Date(session.date);
            
            if (!lastTrainingDate) {
                lastTrainingDate = sessionDate;
                streak = 1;
            } else {
                const daysDiff = Math.floor((lastTrainingDate - sessionDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff <= 3) {
                    streak++;
                    lastTrainingDate = sessionDate;
                } else {
                    break;
                }
            }
        }
        
        return streak;
    }

    /**
     * Unlock achievement
     */
    unlockAchievement(achievement) {
        const unlockedAchievements = storage.getItem('unlocked_achievements') || [];
        unlockedAchievements.push(achievement.id);
        storage.setItem('unlocked_achievements', unlockedAchievements);
        
        this.showAchievementUnlock(achievement);
    }

    /**
     * Show achievement unlock notification
     */
    showAchievementUnlock(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <i class="${achievement.icon} achievement-icon"></i>
                <div class="achievement-text">
                    <h4>Achievement Unlocked!</h4>
                    <p><strong>${achievement.name}</strong></p>
                    <p>${achievement.description}</p>
                </div>
                <button class="achievement-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        const unlockedIds = storage.getItem('unlocked_achievements') || [];
        return this.achievements.filter(achievement => 
            unlockedIds.includes(achievement.id)
        );
    }

    /**
     * Get locked achievements
     */
    getLockedAchievements() {
        const unlockedIds = storage.getItem('unlocked_achievements') || [];
        return this.achievements.filter(achievement => 
            !unlockedIds.includes(achievement.id)
        );
    }

    /**
     * Get all belts with unlock status
     */
    getAllBelts() {
        const beltSystem = storage.getBeltSystem();
        return this.belts.map(belt => ({
            ...belt,
            unlocked: beltSystem.unlockedBelts.includes(belt.name),
            current: belt.name === beltSystem.currentBelt
        }));
    }

    /**
     * Get belt requirements for display
     */
    getBeltRequirementsDisplay(beltName) {
        const requirements = storage.getBeltRequirements()[beltName] || [];
        const stats = storage.getStats();
        
        return requirements.map(req => ({
            ...req,
            completed: storage.checkRequirement(req, stats),
            progress: this.getRequirementProgress(req, stats),
            displayValue: this.formatRequirementValue(req, stats)
        }));
    }

    /**
     * Format requirement value for display
     */
    formatRequirementValue(requirement, stats) {
        let current = 0;
        let target = requirement.value;
        
        switch (requirement.type) {
            case 'totalHours':
                current = Math.floor(stats.totalHours || 0);
                return `${current}/${target} hours`;
            case 'totalSessions':
                current = stats.totalSessions || 0;
                return `${current}/${target} sessions`;
            case 'weeklyConsistency':
                current = storage.calculateWeeklyConsistency();
                return `${current}/${target} weeks`;
            case 'trainingVariety':
                current = Object.keys(stats.typeDistribution || {}).length;
                return `${current}/${target} types`;
            default:
                return `${current}/${target}`;
        }
    }

    /**
     * Get motivational message based on progress
     */
    getMotivationalMessage() {
        const beltProgress = this.getBeltProgress();
        const currentBelt = this.getCurrentBelt();
        
        if (beltProgress.progress === 100) {
            if (currentBelt.name === 'black') {
                return "🥋 You have achieved mastery! Continue your journey as a black belt.";
            } else {
                return "🌟 You're ready for your next belt! Keep training to unlock it.";
            }
        } else if (beltProgress.progress >= 75) {
            return "🔥 You're so close to your next belt! Push through!";
        } else if (beltProgress.progress >= 50) {
            return "💪 Great progress! You're halfway to your next belt.";
        } else if (beltProgress.progress >= 25) {
            return "⭐ Good start! Keep building your skills.";
        } else {
            return "🌱 Every master was once a beginner. Keep training!";
        }
    }

    /**
     * Get weekly motivation
     */
    getWeeklyMotivation() {
        const stats = storage.getStats();
        const weeklyHours = stats.weeklyHours || 0;
        
        if (weeklyHours >= 5) {
            return "🏆 Excellent weekly training! You're on fire!";
        } else if (weeklyHours >= 3) {
            return "👍 Great week of training! Keep it up!";
        } else if (weeklyHours >= 1) {
            return "📈 Good start this week! Can you do more?";
        } else {
            return "🎯 Time to start your training week strong!";
        }
    }
}

// Create global reward system instance
window.rewardSystem = new RewardSystem(); 