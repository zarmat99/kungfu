/**
 * Simple Predictor - A reliable and straightforward prediction system
 * Provides basic next belt time estimation based on current training patterns
 */

class SimplePredictor {
    constructor() {
        this.bindEvents();
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Listen for session updates to recalculate predictions
        window.addEventListener('sessionsUpdated', () => {
            this.updatePredictions();
        });
    }

    /**
     * Get complete belt progression predictions
     */
    getAllBeltsPredictions() {
        const sessions = storage.getAllSessions();
        const stats = storage.getStats();
        const beltSystem = storage.getBeltSystem();
        const beltRequirements = storage.getBeltRequirements();

        const currentBelt = beltSystem.currentBelt;
        const currentHours = stats.totalHours || 0;

        // Calculate training averages
        const monthlyAverage = this.calculateMonthlyAverage(sessions);
        const weeklyAverage = this.calculateWeeklyAverage(sessions);

        // Get all belt names in order
        const beltNames = Object.keys(beltRequirements);
        const currentBeltIndex = beltNames.indexOf(currentBelt);

        if (currentBeltIndex === -1) {
            return {
                message: "Current belt not found in system",
                predictions: [],
                trainingStats: this.getTrainingStats(sessions)
            };
        }

        // Check if already at maximum level
        if (currentBeltIndex >= beltNames.length - 1) {
            return {
                message: "🏆 Congratulations! You have achieved the highest belt!",
                isComplete: true,
                predictions: [],
                trainingStats: this.getTrainingStats(sessions)
            };
        }

        if (monthlyAverage === 0) {
            return {
                message: "Start training regularly to see belt predictions",
                suggestion: "Try to train at least 2-3 times per week",
                predictions: [],
                trainingStats: this.getTrainingStats(sessions)
            };
        }

        // Calculate predictions for all remaining belts
        const predictions = [];
        let cumulativeMonths = 0;

        for (let i = currentBeltIndex + 1; i < beltNames.length; i++) {
            const beltName = beltNames[i];
            const requirements = beltRequirements[beltName];

            if (!requirements || requirements.length === 0) continue;

            const hoursReq = requirements.find(r => r.type === 'totalHours');
            if (!hoursReq) continue;

            const hoursNeeded = Math.max(0, hoursReq.value - currentHours);

            if (hoursNeeded === 0) {
                predictions.push({
                    belt: beltName,
                    beltTitle: this.getBeltTitle(beltName),
                    currentHours: Math.round(currentHours * 10) / 10,
                    requiredHours: hoursReq.value,
                    hoursNeeded: 0,
                    timeEstimate: "Ready now!",
                    estimatedDate: "Available for promotion",
                    monthsNeeded: 0,
                    isReady: true,
                    confidence: 100
                });
            } else {
                const monthsForThisBelt = Math.ceil(hoursNeeded / monthlyAverage);
                cumulativeMonths += monthsForThisBelt;

                // Calculate confidence (decreases over time)
                const confidence = this.calculateTimeBasedConfidence(sessions, monthlyAverage, cumulativeMonths);

                predictions.push({
                    belt: beltName,
                    beltTitle: this.getBeltTitle(beltName),
                    currentHours: Math.round(currentHours * 10) / 10,
                    requiredHours: hoursReq.value,
                    hoursNeeded: Math.round(hoursNeeded * 10) / 10,
                    timeEstimate: this.formatTimeEstimate(cumulativeMonths),
                    estimatedDate: this.getEstimatedDate(cumulativeMonths),
                    monthsNeeded: cumulativeMonths,
                    isReady: false,
                    confidence: Math.round(confidence)
                });
            }
        }

        return {
            currentBelt: {
                name: currentBelt,
                title: this.getBeltTitle(currentBelt),
                hours: Math.round(currentHours * 10) / 10
            },
            monthlyRate: Math.round(monthlyAverage * 10) / 10,
            weeklyRate: Math.round(weeklyAverage * 10) / 10,
            predictions,
            trainingStats: this.getTrainingStats(sessions),
            isComplete: false
        };
    }

    /**
     * Get simple next belt prediction (backward compatibility)
     */
    getNextBeltPrediction() {
        const allPredictions = this.getAllBeltsPredictions();

        if (allPredictions.isComplete) {
            return {
                message: "🏆 Congratulations! You have achieved the highest belt!",
                isComplete: true
            };
        }

        if (allPredictions.message && allPredictions.predictions.length === 0) {
            return {
                message: allPredictions.message,
                suggestion: allPredictions.suggestion,
                isComplete: false
            };
        }

        if (allPredictions.predictions.length === 0) {
            return {
                message: "No remaining belts to predict",
                isComplete: false
            };
        }

        // Return the next belt (first in predictions array)
        const nextBelt = allPredictions.predictions[0];

        return {
            nextBelt: nextBelt.beltTitle,
            currentHours: nextBelt.currentHours,
            requiredHours: nextBelt.requiredHours,
            hoursNeeded: nextBelt.hoursNeeded,
            monthlyRate: allPredictions.monthlyRate,
            timeEstimate: nextBelt.timeEstimate,
            estimatedDate: nextBelt.estimatedDate,
            confidence: nextBelt.confidence,
            monthsNeeded: nextBelt.monthsNeeded,
            isComplete: false,
            isReady: nextBelt.isReady
        };
    }

    /**
     * Calculate weekly training average (last 8 weeks)
     */
    calculateWeeklyAverage(sessions) {
        if (sessions.length === 0) return 0;

        const now = new Date();
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 weeks

        const recentSessions = sessions.filter(session =>
            new Date(session.date) >= eightWeeksAgo
        );

        if (recentSessions.length === 0) {
            // Fallback to all sessions if no recent data
            const totalHours = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
            const firstSession = new Date(sessions[0].date);
            const weeksSpan = Math.max(1, (now - firstSession) / (1000 * 60 * 60 * 24 * 7));
            return totalHours / weeksSpan;
        }

        const totalHours = recentSessions.reduce((sum, session) => sum + session.duration / 60, 0);
        return totalHours / 8; // 8 weeks
    }

    /**
     * Calculate monthly training average (last 3 months)
     */
    calculateMonthlyAverage(sessions) {
        if (sessions.length === 0) return 0;

        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentSessions = sessions.filter(session =>
            new Date(session.date) >= threeMonthsAgo
        );

        if (recentSessions.length === 0) {
            // Fallback to all sessions if no recent data
            const totalHours = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
            const firstSession = new Date(sessions[0].date);
            const monthsSpan = Math.max(1, (now - firstSession) / (1000 * 60 * 60 * 24 * 30.44));
            return totalHours / monthsSpan;
        }

        const totalHours = recentSessions.reduce((sum, session) => sum + session.duration / 60, 0);
        return totalHours / 3; // 3 months
    }

    /**
     * Calculate prediction confidence
     */
    calculateConfidence(sessions, monthlyAverage) {
        if (sessions.length < 3) return 30; // Low confidence with little data

        // Base confidence on data quantity and consistency
        let confidence = Math.min(85, sessions.length * 5); // More sessions = more confidence

        // Adjust for training regularity
        const last30Days = this.getSessionsInPeriod(sessions, 30);
        const last60Days = this.getSessionsInPeriod(sessions, 60);

        if (last30Days.length >= 4) confidence += 10; // Regular recent training
        if (last60Days.length >= 8) confidence += 5;  // Sustained training

        // Adjust for consistent monthly rate
        if (monthlyAverage > 0) {
            const last1Month = this.getSessionsInPeriod(sessions, 30);
            const last2Month = this.getSessionsInPeriod(sessions, 60);

            const recent1MonthHours = last1Month.reduce((sum, s) => sum + s.duration / 60, 0);
            const recent2MonthHours = last2Month.reduce((sum, s) => sum + s.duration / 60, 0) / 2;

            if (recent2MonthHours > 0) {
                const consistency = 1 - Math.abs(recent1MonthHours - recent2MonthHours) / recent2MonthHours;
                confidence = confidence * (0.7 + consistency * 0.3); // Adjust for consistency
            }
        }

        return Math.round(Math.max(20, Math.min(90, confidence)));
    }

    /**
     * Get sessions within a specific period (days ago)
     */
    getSessionsInPeriod(sessions, days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return sessions.filter(session => new Date(session.date) >= cutoffDate);
    }

    /**
     * Format time estimate in human-readable format
     */
    formatTimeEstimate(months) {
        if (months === 0) return 'Ready now!';
        if (months === 1) return '1 month';
        if (months < 12) return `${months} months`;

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (remainingMonths === 0) {
            return years === 1 ? '1 year' : `${years} years`;
        } else {
            return `${years}y ${remainingMonths}m`;
        }
    }

    /**
     * Get estimated completion date
     */
    getEstimatedDate(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Update predictions (called when sessions are updated)
     */
    updatePredictions() {
        // Trigger event for UI updates
        const event = new CustomEvent('simplePredictionsUpdated', {
            detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get training insights
     */
    getTrainingInsights() {
        const sessions = storage.getAllSessions();

        if (sessions.length === 0) {
            return {
                message: "Start logging training sessions to get insights!"
            };
        }

        const monthlyAverage = this.calculateMonthlyAverage(sessions);
        const last30Days = this.getSessionsInPeriod(sessions, 30);
        const totalHours = sessions.reduce((sum, s) => sum + s.duration / 60, 0);

        const insights = [];

        // Training frequency insight
        const sessionsPerWeek = (last30Days.length / 4.33);
        if (sessionsPerWeek < 2) {
            insights.push({
                icon: "fas fa-calendar-plus",
                title: "Increase Training Frequency",
                message: `You're training ${sessionsPerWeek.toFixed(1)} times per week. Try to aim for 2-3 sessions weekly.`
            });
        } else if (sessionsPerWeek >= 3) {
            insights.push({
                icon: "fas fa-fire",
                title: "Great Consistency!",
                message: `You're training ${sessionsPerWeek.toFixed(1)} times per week. Keep up the excellent work!`
            });
        }

        // Monthly progression insight
        if (monthlyAverage > 0) {
            if (monthlyAverage >= 12) {
                insights.push({
                    icon: "fas fa-rocket",
                    title: "Excellent Progress",
                    message: `${monthlyAverage.toFixed(1)} hours/month is excellent for steady belt progression.`
                });
            } else if (monthlyAverage >= 6) {
                insights.push({
                    icon: "fas fa-thumbs-up",
                    title: "Good Progress",
                    message: `${monthlyAverage.toFixed(1)} hours/month is good. Consider adding one more session weekly.`
                });
            } else {
                insights.push({
                    icon: "fas fa-chart-line",
                    title: "Room for Growth",
                    message: `${monthlyAverage.toFixed(1)} hours/month. Small increases can make a big difference!`
                });
            }
        }

        return { insights };
    }

    /**
     * Get comprehensive training statistics
     */
    getTrainingStats(sessions) {
        if (sessions.length === 0) {
            return {
                weeklyAverage: 0,
                monthlyAverage: 0,
                totalSessions: 0,
                totalHours: 0,
                averageSessionLength: 0,
                last30DaysInfo: {
                    sessions: 0,
                    hours: 0,
                    averagePerWeek: 0
                },
                last7DaysInfo: {
                    sessions: 0,
                    hours: 0,
                    averagePerDay: 0
                }
            };
        }

        const weeklyAverage = this.calculateWeeklyAverage(sessions);
        const monthlyAverage = this.calculateMonthlyAverage(sessions);
        const totalHours = sessions.reduce((sum, s) => sum + s.duration / 60, 0);
        const averageSessionLength = totalHours / sessions.length;

        // Last 30 days stats
        const last30Days = this.getSessionsInPeriod(sessions, 30);
        const last30DaysHours = last30Days.reduce((sum, s) => sum + s.duration / 60, 0);

        // Last 7 days stats
        const last7Days = this.getSessionsInPeriod(sessions, 7);
        const last7DaysHours = last7Days.reduce((sum, s) => sum + s.duration / 60, 0);

        return {
            weeklyAverage: Math.round(weeklyAverage * 10) / 10,
            monthlyAverage: Math.round(monthlyAverage * 10) / 10,
            totalSessions: sessions.length,
            totalHours: Math.round(totalHours * 10) / 10,
            averageSessionLength: Math.round(averageSessionLength * 10) / 10,
            last30DaysInfo: {
                sessions: last30Days.length,
                hours: Math.round(last30DaysHours * 10) / 10,
                averagePerWeek: Math.round((last30Days.length / 4.33) * 10) / 10
            },
            last7DaysInfo: {
                sessions: last7Days.length,
                hours: Math.round(last7DaysHours * 10) / 10,
                averagePerDay: Math.round((last7Days.length / 7) * 10) / 10
            }
        };
    }

    /**
     * Calculate time-based confidence that decreases over longer predictions
     */
    calculateTimeBasedConfidence(sessions, monthlyAverage, cumulativeMonths) {
        const baseConfidence = this.calculateConfidence(sessions, monthlyAverage);

        // Reduce confidence based on time distance
        let timeAdjustment = 1;
        if (cumulativeMonths <= 6) {
            timeAdjustment = 1; // No reduction for 6 months or less
        } else if (cumulativeMonths <= 12) {
            timeAdjustment = 0.9; // 10% reduction for 6-12 months
        } else if (cumulativeMonths <= 24) {
            timeAdjustment = 0.8; // 20% reduction for 1-2 years
        } else if (cumulativeMonths <= 36) {
            timeAdjustment = 0.7; // 30% reduction for 2-3 years
        } else {
            timeAdjustment = 0.6; // 40% reduction for 3+ years
        }

        return Math.max(15, baseConfidence * timeAdjustment);
    }

    /**
     * Get belt title from belt name
     */
    getBeltTitle(beltName) {
        const beltTitles = {
            'white': 'White Belt',
            'yellow': 'Yellow Belt',
            'orange': 'Orange Belt',
            'green': 'Green Belt',
            'blue': 'Blue Belt',
            'brown': 'Brown Belt',
            'black-1duan': 'Black Belt 1° Dan',
            'black-2duan': 'Black Belt 2° Dan',
            'black-3duan': 'Black Belt 3° Dan',
            'black-4duan': 'Black Belt 4° Dan',
            'black-5duan': 'Black Belt 5° Dan',
            'black-6duan': 'Black Belt 6° Dan',
            'black-7duan': 'Black Belt 7° Dan',
            'black-8duan': 'Black Belt 8° Dan',
            'black-9duan': 'Black Belt 9° Dan'
        };

        return beltTitles[beltName] || beltName;
    }
}

// Create global simple predictor instance
window.simplePredictor = new SimplePredictor();