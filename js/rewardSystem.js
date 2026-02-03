/**
 * Reward System - Handles belt progression
 * Manages the Kung Fu belt system with realistic goals and rewards
 */

class RewardSystem {
    constructor() {
        this.belts = [
            // White Sash
            { 
                name: 'white', title: 'White', level: 'Novice', badge: '🌱',
                description: 'You have started your journey.', 
                characteristics: [
                    "Basic Stances (Horse, Bow, Cat)",
                    "Fundamental Strikes and Blocks",
                    "Basic Kicks (Front, Side, Roundhouse)",
                    "Understanding of Classroom Etiquette"
                ]
            },
            // Yellow Sash
            { 
                name: 'yellow', title: 'Yellow', level: 'Foundation', badge: '🧱',
                description: 'You are building your foundation.', 
                characteristics: [
                    "Improved Stance Stability and Transitions",
                    "Introduction to Basic Forms (e.g., Xiao Hong Quan)",
                    "Combination of Basic Kicks and Punches",
                    "Developing Physical Conditioning and Flexibility"
                ]
            },
            // Orange Sash
            { 
                name: 'orange', title: 'Orange', level: 'Practitioner', badge: '🔗',
                description: 'You begin to understand the structure.',
                characteristics: [
                    "Learning Intermediate Forms",
                    "Increased Speed and Power in Techniques",
                    "Introduction to Sparring Concepts",
                    "Focus on Breath Control (Qi)"
                ]
            },
            // Green Sash
            { 
                name: 'green', title: 'Green', level: 'Progress', badge: '🌿',
                description: 'You move your body with awareness.',
                characteristics: [
                    "Introduction to a Basic Weapon (e.g., Staff or Nunchaku)",
                    "More Complex Forms and Sequences",
                    "Application of Techniques in Light Sparring",
                    "Developing a Sense of Timing and Distance"
                ]
            },
            // Blue Sash
            { 
                name: 'blue', title: 'Blue', level: 'Fighter', badge: '🌊',
                description: 'You begin to master your style.',
                characteristics: [
                    "Proficiency with an Intermediate Weapon",
                    "Advanced Forms with Acrobatic Movements",
                    "Effective Sparring with Strategy",
                    "Mental Calmness and Focus Under Pressure"
                ]
            },
            // Brown Sash
            { 
                name: 'brown', title: 'Brown', level: 'Expert', badge: '⛰️',
                description: 'Maturity, precision, control.',
                characteristics: [
                    "Mastery of Multiple Weapons",
                    "Deep Understanding of a Primary Style's Philosophy",
                    "Ability to Generate Power from the Core (Dantian)",
                    "Beginning to Assist in Teaching Junior Students"
                ]
            },
            // 1st Duan Black Sash
            { 
                name: 'black-1duan', title: 'Black (1st Duan)', level: 'Emerging Master', badge: '🏆', duan: 1,
                description: 'You have completed the first circle.',
                characteristics: [
                    "Comprehensive Knowledge of All Novice/Intermediate Forms",
                    "Mastery of a Primary Weapon (e.g., Broadsword, Spear)",
                    "Effective Self-Defense Applications",
                    "Deep Embodiment of Martial Virtue (Wude)"
                ]
            },
            { name: 'black-2duan', title: '2nd Duan', level: 'Intermediate Master', badge: '🧑‍🏫', duan: 2, description: 'You deepen your style and teaching.' },
            { name: 'black-3duan', title: '3rd Duan', level: 'Senior Master', badge: '💎', duan: 3, description: 'You refine technique and transmission.' },
            { name: 'black-4duan', title: '4th Duan', level: 'Senior Master', badge: '🧭', duan: 4, description: 'Your practice guides others.' },
            { name: 'black-5duan', title: '5th Duan', level: "Master of Excellence", badge: '⭐', duan: 5, description: 'A point of reference for the school.' },
            { name: 'black-6duan', title: '6th Duan', level: 'Guardian Master', badge: '🛡️', duan: 6, description: 'You transmit tradition and spirit.' },
            { name: 'black-7duan', title: '7th Duan', level: 'Grand Master', badge: '👑', duan: 7, description: 'Master among masters.' },
            { name: 'black-8duan', title: '8th Duan', level: 'Supreme Grand Master', badge: '⚜️', duan: 8, description: 'Authoritative voice of Kung Fu.' },
            { name: 'black-9duan', title: '9th Duan', level: 'Temple Patriarch', badge: '🏛️', duan: 9, description: 'The path becomes living teaching.' }
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
            return { progress: 100, requirements: [], nextBelt: null };
        }
        
        const requirements = storage.getBeltRequirements()[nextBelt.name];
        const stats = storage.getStats();
        
        if (!requirements || requirements.length === 0) {
            return { progress: 100, requirements: requirements, nextBelt: nextBelt };
        }

        const totalHoursReq = requirements.find(r => r.type === 'totalHours');
        if (!totalHoursReq) {
            // If next belt has no hour requirement, consider it 100% complete
            return { progress: 100, requirements: requirements, nextBelt: nextBelt };
        }

        const currentBelt = this.getCurrentBelt();
        const currentBeltReqs = storage.getBeltRequirements()[currentBelt.name];
        const currentBeltHours = currentBeltReqs.length > 0 ? (currentBeltReqs.find(r => r.type === 'totalHours')?.value || 0) : 0;

        const currentHours = stats.totalHours || 0;
        const targetHours = totalHoursReq.value;
        
        const progressSinceLastBelt = currentHours - currentBeltHours;
        const requiredForNextBelt = targetHours - currentBeltHours;
        
        const progressPercentage = requiredForNextBelt > 0 
            ? Math.min(Math.round((progressSinceLastBelt / requiredForNextBelt) * 100), 100)
            : 100;
            
            return {
            progress: progressPercentage,
            requirements: requirements.map(req => ({
                ...req,
                completed: storage.checkRequirement(req, stats),
                progress: this.getRequirementProgress(req, stats)
            })),
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
            case 'basicTechniques':
                current = Math.min(stats.totalSessions || 0, target);
                break;
            case 'minimumAge':
                current = target; // Always satisfied for simulation
                break;
            case 'teachingHours':
                const teachingRatio = 0.1;
                current = (stats.totalHours || 0) * teachingRatio;
                break;
            case 'yearsInArt':
                const avgHoursPerYear = 50;
                current = (stats.totalHours || 0) / avgHoursPerYear;
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
        
        const animalText = belt.animal ? `<p class="belt-animal">🐾 ${belt.animal} Style Unlocked</p>` : '';
        const isBlackBelt = belt.name && belt.name.includes('black');
        const unlockTitle = isBlackBelt ? 'Dan Rank Achieved!' : 'Sash Unlocked!';
        
        overlay.innerHTML = `
            <div class="belt-unlock-content">
                <div class="belt-unlock-animation">
                    <div class="belt-icon belt-${belt.name} animate-belt-unlock">
                        ${belt.title}
                    </div>
                    <h2 class="belt-unlock-title">${unlockTitle}</h2>
                    <p class="belt-level">${belt.level}</p>
                    ${animalText}
                    <p class="belt-unlock-description">${belt.description}</p>
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continue Journey (继续修行)
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
                return `${current}/${target} styles`;
            case 'basicTechniques':
                current = Math.min(stats.totalSessions || 0, target);
                return current >= target ? '✓ Learned' : 'In Progress';
            case 'minimumAge':
                return '✓ Eligible';
            case 'teachingHours':
                const teachingRatio = 0.1;
                current = Math.floor((stats.totalHours || 0) * teachingRatio);
                return `${current}/${target} hours`;
            case 'yearsInArt':
                const avgHoursPerYear = 50;
                current = Math.floor((stats.totalHours || 0) / avgHoursPerYear);
                return `${current}/${target} years`;
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
            if (currentBelt.name && currentBelt.name.includes('black')) {
                const danLevel = currentBelt.duan || 1;
                if (danLevel >= 9) {
                    return "🐉 Grandmaster level achieved! Your legend continues to grow.";
                } else if (danLevel >= 7) {
                    return "🥋 True mastery reached! Continue perfecting your art.";
                } else if (danLevel >= 5) {
                    return "🎌 Teaching master! Share your wisdom with others.";
                } else {
                    return "⚫ Black sash earned! Your journey into mastery begins.";
                }
            } else {
                return "🌟 Ready for your next sash! 准备好迎接下一条腰带!";
            }
        } else if (beltProgress.progress >= 75) {
            return "🔥 So close to your next level! Push through like a tiger! 坚持到底!";
        } else if (beltProgress.progress >= 50) {
            return "💪 Excellent progress! Flow like water toward your goal. 如水般前进!";
        } else if (beltProgress.progress >= 25) {
            return "⭐ Building strong foundation! Growing like bamboo. 竹节节高!";
        } else {
            return "🌱 The journey of a thousand li begins with one step. 千里之行始于足下!";
        }
    }


}

// Create global reward system instance
window.rewardSystem = new RewardSystem(); 
