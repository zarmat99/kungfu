/**
 * Statistics Predictor - Predicts future training hours and belt progression
 * Analyzes training patterns to forecast future achievements
 */

class StatisticsPredictor {
    constructor() {
        this.predictionModels = {
            linear: 'linear',
            exponential: 'exponential',
            seasonal: 'seasonal',
            adaptive: 'adaptive'
        };
        
        this.currentModel = this.predictionModels.adaptive;
        this.confidenceThreshold = 0.7;
        
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
     * Get comprehensive training predictions
     */
    getPredictions(timeframe = 'monthly') {
        const sessions = storage.getAllSessions();
        const stats = storage.getStats();
        const beltSystem = storage.getBeltSystem();
        
        if (sessions.length < 3) {
            return this.getMinimalPredictions(timeframe);
        }

        const trainingPattern = this.analyzeTrainingPattern(sessions);
        const weeklyAverage = this.calculateWeeklyAverage(sessions);
        const monthlyAverage = this.calculateMonthlyAverage(sessions);
        
        return {
            // Basic predictions
            weeklyPrediction: this.predictWeeklyHours(trainingPattern, weeklyAverage),
            monthlyPrediction: this.predictMonthlyHours(trainingPattern, monthlyAverage),
            yearlyPrediction: this.predictYearlyHours(trainingPattern, monthlyAverage),
            
            // Belt progression predictions
            beltProgression: this.predictBeltProgression(trainingPattern, stats, beltSystem),
            
            // Milestone predictions
            milestones: this.predictMilestones(trainingPattern, stats),
            
            // Trend analysis
            trends: this.analyzeTrends(sessions, trainingPattern),
            
            // Confidence metrics
            confidence: this.calculatePredictionConfidence(trainingPattern, sessions),
            
            // Recommendations
            recommendations: this.generateRecommendations(trainingPattern, stats, beltSystem)
        };
    }

    /**
     * Analyze training pattern from historical data
     */
    analyzeTrainingPattern(sessions) {
        const sortedSessions = sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        const now = new Date();
        
        // Calculate different time period averages
        const last7Days = this.getSessionsInPeriod(sortedSessions, 7);
        const last30Days = this.getSessionsInPeriod(sortedSessions, 30);
        const last90Days = this.getSessionsInPeriod(sortedSessions, 90);
        const last365Days = this.getSessionsInPeriod(sortedSessions, 365);
        
        // Calculate weekly patterns (which days of week are most active)
        const weeklyPattern = this.calculateWeeklyPattern(sessions);
        
        // Calculate consistency metrics
        const consistency = this.calculateConsistency(sessions);
        
        // Calculate growth trend
        const growthTrend = this.calculateGrowthTrend(sessions);
        
        // Calculate seasonal patterns
        const seasonalPattern = this.calculateSeasonalPattern(sessions);
        
        return {
            recent: {
                last7Days: this.summarizePeriod(last7Days),
                last30Days: this.summarizePeriod(last30Days),
                last90Days: this.summarizePeriod(last90Days),
                last365Days: this.summarizePeriod(last365Days)
            },
            weeklyPattern,
            consistency,
            growthTrend,
            seasonalPattern,
            totalDataPoints: sessions.length,
            dataSpan: sessions.length > 0 ? 
                Math.ceil((now - new Date(sortedSessions[0].date)) / (1000 * 60 * 60 * 24)) : 0
        };
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
     * Summarize a period of sessions
     */
    summarizePeriod(sessions) {
        if (sessions.length === 0) {
            return { totalHours: 0, totalSessions: 0, averageSession: 0, frequency: 0 };
        }
        
        const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
        const totalHours = totalMinutes / 60;
        const averageSession = totalMinutes / sessions.length / 60;
        
        return {
            totalHours,
            totalSessions: sessions.length,
            averageSession,
            frequency: sessions.length / 7 // sessions per week
        };
    }

    /**
     * Calculate weekly training pattern
     */
    calculateWeeklyPattern(sessions) {
        const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
        const dayHours = [0, 0, 0, 0, 0, 0, 0];
        
        sessions.forEach(session => {
            const dayOfWeek = new Date(session.date).getDay();
            dayCount[dayOfWeek]++;
            dayHours[dayOfWeek] += session.duration / 60;
        });
        
        const totalSessions = sessions.length;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return dayNames.map((day, index) => ({
            day,
            percentage: totalSessions > 0 ? Math.round((dayCount[index] / totalSessions) * 100) : 0,
            averageHours: dayCount[index] > 0 ? dayHours[index] / dayCount[index] : 0,
            sessionCount: dayCount[index]
        }));
    }

    /**
     * Calculate training consistency score
     */
    calculateConsistency(sessions) {
        if (sessions.length < 7) return { score: 0, level: 'Insufficient Data' };
        
        const last30Days = this.getSessionsInPeriod(sessions, 30);
        const last90Days = this.getSessionsInPeriod(sessions, 90);
        
        // Calculate gap between sessions
        const sortedSessions = sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        const gaps = [];
        
        for (let i = 1; i < sortedSessions.length; i++) {
            const gap = (new Date(sortedSessions[i].date) - new Date(sortedSessions[i-1].date)) / (1000 * 60 * 60 * 24);
            gaps.push(gap);
        }
        
        const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        const gapVariance = gaps.reduce((sum, gap) => sum + Math.pow(gap - averageGap, 2), 0) / gaps.length;
        
        // Score based on frequency and regularity
        const frequencyScore = Math.min(last30Days.length * 3.33, 100); // Ideal: 3 sessions per week
        const regularityScore = Math.max(0, 100 - (gapVariance / averageGap) * 10);
        
        const overallScore = (frequencyScore + regularityScore) / 2;
        
        let level = 'Beginner';
        if (overallScore >= 80) level = 'Excellent';
        else if (overallScore >= 60) level = 'Good';
        else if (overallScore >= 40) level = 'Fair';
        else if (overallScore >= 20) level = 'Inconsistent';
        
        return {
            score: Math.round(overallScore),
            level,
            frequencyScore: Math.round(frequencyScore),
            regularityScore: Math.round(regularityScore),
            averageGap: Math.round(averageGap),
            last30DaySessions: last30Days.length
        };
    }

    /**
     * Calculate growth trend
     */
    calculateGrowthTrend(sessions) {
        if (sessions.length < 6) return { trend: 'stable', rate: 0, direction: 'unknown' };
        
        const sortedSessions = sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        const midPoint = Math.floor(sortedSessions.length / 2);
        
        const firstHalf = sortedSessions.slice(0, midPoint);
        const secondHalf = sortedSessions.slice(midPoint);
        
        const firstHalfAvg = this.summarizePeriod(firstHalf).frequency;
        const secondHalfAvg = this.summarizePeriod(secondHalf).frequency;
        
        const growthRate = secondHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
        
        let trend = 'stable';
        let direction = 'stable';
        
        if (growthRate > 20) {
            trend = 'increasing';
            direction = 'up';
        } else if (growthRate < -20) {
            trend = 'decreasing';
            direction = 'down';
        }
        
        return {
            trend,
            direction,
            rate: Math.round(growthRate),
            firstHalfAvg: Math.round(firstHalfAvg * 10) / 10,
            secondHalfAvg: Math.round(secondHalfAvg * 10) / 10
        };
    }

    /**
     * Calculate seasonal patterns
     */
    calculateSeasonalPattern(sessions) {
        const monthlyData = {};
        
        sessions.forEach(session => {
            const month = new Date(session.date).getMonth();
            if (!monthlyData[month]) {
                monthlyData[month] = { sessions: 0, hours: 0 };
            }
            monthlyData[month].sessions++;
            monthlyData[month].hours += session.duration / 60;
        });
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        return monthNames.map((month, index) => ({
            month,
            sessions: monthlyData[index] ? monthlyData[index].sessions : 0,
            hours: monthlyData[index] ? Math.round(monthlyData[index].hours * 10) / 10 : 0
        }));
    }

    /**
     * Calculate weekly average
     */
    calculateWeeklyAverage(sessions) {
        const last8Weeks = this.getSessionsInPeriod(sessions, 56); // 8 weeks
        const totalHours = last8Weeks.reduce((sum, session) => sum + session.duration / 60, 0);
        return totalHours / 8;
    }

    /**
     * Calculate monthly average
     */
    calculateMonthlyAverage(sessions) {
        const last3Months = this.getSessionsInPeriod(sessions, 90); // 3 months
        const totalHours = last3Months.reduce((sum, session) => sum + session.duration / 60, 0);
        return totalHours / 3;
    }

    /**
     * Predict weekly hours
     */
    predictWeeklyHours(trainingPattern, currentWeeklyAverage) {
        const recentTrend = trainingPattern.recent.last30Days.frequency;
        const growthRate = trainingPattern.growthTrend.rate / 100;
        
        let prediction = currentWeeklyAverage;
        
        if (this.currentModel === this.predictionModels.adaptive) {
            // Adaptive model considers recent trend and growth
            const trendWeight = 0.6;
            const historyWeight = 0.4;
            
            prediction = (recentTrend * trendWeight) + (currentWeeklyAverage * historyWeight);
            
            // Apply growth trend
            if (Math.abs(growthRate) > 0.1) {
                prediction *= (1 + growthRate * 0.5); // Moderate the growth rate
            }
        }
        
        return {
            hours: Math.max(0, Math.round(prediction * 10) / 10),
            confidence: this.calculatePredictionConfidence(trainingPattern).weekly,
            model: this.currentModel,
            factors: {
                recentTrend: Math.round(recentTrend * 10) / 10,
                historicalAverage: Math.round(currentWeeklyAverage * 10) / 10,
                growthRate: Math.round(growthRate * 100) + '%'
            }
        };
    }

    /**
     * Predict monthly hours
     */
    predictMonthlyHours(trainingPattern, currentMonthlyAverage) {
        const weeklyPrediction = this.predictWeeklyHours(trainingPattern, currentMonthlyAverage / 4.33);
        const monthlyHours = weeklyPrediction.hours * 4.33;
        
        // Apply seasonal adjustments
        const currentMonth = new Date().getMonth();
        const seasonalData = trainingPattern.seasonalPattern[currentMonth];
        const yearlyAverage = trainingPattern.seasonalPattern.reduce((sum, month) => sum + month.hours, 0) / 12;
        
        let seasonalAdjustment = 1;
        if (yearlyAverage > 0) {
            seasonalAdjustment = seasonalData.hours / yearlyAverage;
            seasonalAdjustment = Math.max(0.5, Math.min(1.5, seasonalAdjustment)); // Cap adjustment
        }
        
        return {
            hours: Math.max(0, Math.round(monthlyHours * seasonalAdjustment * 10) / 10),
            confidence: this.calculatePredictionConfidence(trainingPattern).monthly,
            model: this.currentModel,
            factors: {
                weeklyBased: Math.round(monthlyHours * 10) / 10,
                seasonalAdjustment: Math.round(seasonalAdjustment * 100) + '%',
                currentMonth: new Date().toLocaleString('default', { month: 'long' })
            }
        };
    }

    /**
     * Predict yearly hours
     */
    predictYearlyHours(trainingPattern, currentMonthlyAverage) {
        const monthlyPrediction = this.predictMonthlyHours(trainingPattern, currentMonthlyAverage);
        const yearlyHours = monthlyPrediction.hours * 12;
        
        // Apply long-term trend
        const longTermGrowth = trainingPattern.growthTrend.rate / 100;
        const adjustedYearlyHours = yearlyHours * (1 + longTermGrowth * 0.3); // Conservative long-term growth
        
        return {
            hours: Math.max(0, Math.round(adjustedYearlyHours * 10) / 10),
            confidence: this.calculatePredictionConfidence(trainingPattern).yearly,
            model: this.currentModel,
            factors: {
                monthlyBased: Math.round(yearlyHours * 10) / 10,
                longTermGrowth: Math.round(longTermGrowth * 100) + '%',
                adjusted: Math.round(adjustedYearlyHours * 10) / 10
            }
        };
    }

    /**
     * Predict belt progression
     */
    predictBeltProgression(trainingPattern, stats, beltSystem) {
        const beltRequirements = storage.getBeltRequirements();
        const currentBelt = beltSystem.currentBelt;
        const currentHours = stats.totalHours || 0;
        
        const belts = Object.keys(beltRequirements);
        const currentBeltIndex = belts.indexOf(currentBelt);
        
        if (currentBeltIndex === -1 || currentBeltIndex >= belts.length - 1) {
            return { message: 'Maximum belt achieved!', predictions: [] };
        }
        
        const monthlyPrediction = this.predictMonthlyHours(trainingPattern, this.calculateMonthlyAverage(storage.getAllSessions()));
        const predictedMonthlyHours = monthlyPrediction.hours;
        
        const predictions = [];
        let monthsFromNow = 0;
        
        // Predict next 3 belt progressions
        for (let i = currentBeltIndex + 1; i < Math.min(belts.length, currentBeltIndex + 4); i++) {
            const beltName = belts[i];
            const requirements = beltRequirements[beltName];
            
            if (requirements.length === 0) continue;
            
            const hourRequirement = requirements.find(req => req.type === 'totalHours');
            if (!hourRequirement) continue;
            
            // Calculate hours needed from current position (cumulative)
            const hoursNeeded = hourRequirement.value - currentHours;
            
            if (hoursNeeded <= 0) {
                predictions.push({
                    belt: beltName,
                    beltTitle: this.getBeltTitle(beltName),
                    hoursRequired: hourRequirement.value,
                    hoursNeeded: 0,
                    timeEstimate: 'Ready now!',
                    months: 0,
                    confidence: 100
                });
            } else if (predictedMonthlyHours > 0) {
                const monthsNeeded = Math.ceil(hoursNeeded / predictedMonthlyHours);
                monthsFromNow += monthsNeeded;
                
                predictions.push({
                    belt: beltName,
                    beltTitle: this.getBeltTitle(beltName),
                    hoursRequired: hourRequirement.value,
                    hoursNeeded: Math.round(hoursNeeded * 10) / 10,
                    timeEstimate: this.formatTimeEstimate(monthsNeeded),
                    months: monthsNeeded,
                    estimatedDate: this.getEstimatedDate(monthsNeeded),
                    confidence: Math.max(20, 90 - (monthsNeeded * 5)) // Decreasing confidence over time
                });
            }
        }
        
        return {
            currentBelt: {
                name: currentBelt,
                title: this.getBeltTitle(currentBelt),
                hours: Math.round(currentHours * 10) / 10
            },
            monthlyRate: Math.round(predictedMonthlyHours * 10) / 10,
            predictions,
            confidence: monthlyPrediction.confidence
        };
    }

    /**
     * Predict training milestones
     */
    predictMilestones(trainingPattern, stats) {
        const currentHours = stats.totalHours || 0;
        const monthlyPrediction = this.predictMonthlyHours(trainingPattern, this.calculateMonthlyAverage(storage.getAllSessions()));
        const predictedMonthlyHours = monthlyPrediction.hours;
        
        const milestones = [
            { hours: 100, name: '100 Hour Milestone', emoji: '💯' },
            { hours: 250, name: 'Quarter Thousand', emoji: '🎯' },
            { hours: 500, name: 'Half Millennium', emoji: '🏆' },
            { hours: 750, name: 'Three Quarter Mark', emoji: '⭐' },
            { hours: 1000, name: 'One Thousand Hours', emoji: '🥇' },
            { hours: 1500, name: 'Master Level', emoji: '🧘‍♂️' },
            { hours: 2000, name: 'Grand Master', emoji: '👑' },
            { hours: 2500, name: 'Legendary', emoji: '🐉' }
        ];
        
        const predictions = milestones
            .filter(milestone => milestone.hours > currentHours)
            .slice(0, 5) // Next 5 milestones
            .map(milestone => {
                const hoursNeeded = milestone.hours - currentHours;
                const monthsNeeded = predictedMonthlyHours > 0 ? Math.ceil(hoursNeeded / predictedMonthlyHours) : 0;
                
                return {
                    ...milestone,
                    hoursNeeded: Math.round(hoursNeeded * 10) / 10,
                    timeEstimate: this.formatTimeEstimate(monthsNeeded),
                    months: monthsNeeded,
                    estimatedDate: this.getEstimatedDate(monthsNeeded),
                    confidence: Math.max(20, 90 - (monthsNeeded * 3))
                };
            });
        
        return predictions;
    }

    /**
     * Analyze trends
     */
    analyzeTrends(sessions, trainingPattern) {
        return {
            overall: {
                direction: trainingPattern.growthTrend.direction,
                rate: trainingPattern.growthTrend.rate,
                description: this.getTrendDescription(trainingPattern.growthTrend)
            },
            consistency: {
                score: trainingPattern.consistency.score,
                level: trainingPattern.consistency.level,
                trend: trainingPattern.consistency.score > 60 ? 'Good' : 'Needs Improvement'
            },
            frequency: {
                current: trainingPattern.recent.last30Days.frequency,
                target: 3, // 3 sessions per week ideal
                status: trainingPattern.recent.last30Days.frequency >= 3 ? 'On Track' : 'Below Target'
            },
            seasonal: {
                bestMonth: this.getBestMonth(trainingPattern.seasonalPattern),
                worstMonth: this.getWorstMonth(trainingPattern.seasonalPattern),
                variation: this.getSeasonalVariation(trainingPattern.seasonalPattern)
            }
        };
    }

    /**
     * Calculate prediction confidence
     */
    calculatePredictionConfidence(trainingPattern, sessions = null) {
        const dataPoints = trainingPattern.totalDataPoints;
        const dataSpan = trainingPattern.dataSpan;
        const consistency = trainingPattern.consistency.score;
        
        // Base confidence on data quantity and quality
        let baseConfidence = Math.min(90, dataPoints * 5); // More data = more confidence
        
        // Adjust for data span
        if (dataSpan < 30) baseConfidence *= 0.7; // Less than a month
        else if (dataSpan < 90) baseConfidence *= 0.85; // Less than 3 months
        
        // Adjust for consistency
        baseConfidence *= (consistency / 100);
        
        return {
            overall: Math.round(baseConfidence),
            weekly: Math.round(Math.min(baseConfidence * 1.1, 95)), // Slightly higher for short term
            monthly: Math.round(baseConfidence),
            yearly: Math.round(baseConfidence * 0.8), // Lower for long term
            factors: {
                dataPoints,
                dataSpan,
                consistency
            }
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(trainingPattern, stats, beltSystem) {
        const recommendations = [];
        const consistency = trainingPattern.consistency;
        const growthTrend = trainingPattern.growthTrend;
        const weeklyPattern = trainingPattern.weeklyPattern;
        
        // Consistency recommendations
        if (consistency.score < 40) {
            recommendations.push({
                type: 'consistency',
                priority: 'high',
                title: 'Improve Training Consistency',
                description: 'Try to maintain a regular training schedule. Aim for at least 2-3 sessions per week.',
                action: 'Set a weekly training schedule and stick to it'
            });
        }
        
        // Frequency recommendations
        const currentFrequency = trainingPattern.recent.last30Days.frequency;
        if (currentFrequency < 2) {
            recommendations.push({
                type: 'frequency',
                priority: 'high',
                title: 'Increase Training Frequency',
                description: 'You\'re training less than 2 times per week. Consider adding more sessions.',
                action: 'Add one more training session per week'
            });
        }
        
        // Growth trend recommendations
        if (growthTrend.direction === 'down') {
            recommendations.push({
                type: 'motivation',
                priority: 'medium',
                title: 'Reverse Declining Trend',
                description: 'Your training frequency has been decreasing. Let\'s get back on track!',
                action: 'Set a goal to match your previous training level'
            });
        }
        
        // Weekly pattern recommendations
        const activeDays = weeklyPattern.filter(day => day.sessionCount > 0).length;
        if (activeDays < 3) {
            recommendations.push({
                type: 'schedule',
                priority: 'medium',
                title: 'Spread Training Across More Days',
                description: 'Training on more days can improve consistency and reduce fatigue.',
                action: 'Try to train on at least 3 different days per week'
            });
        }
        
        // Belt progression recommendations
        const beltProgress = rewardSystem.getBeltProgress();
        if (beltProgress.progress > 80) {
            recommendations.push({
                type: 'achievement',
                priority: 'low',
                title: 'Next Belt Within Reach',
                description: 'You\'re very close to your next belt! Keep up the great work.',
                action: 'Maintain current training pace to achieve your next belt soon'
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Get minimal predictions for users with insufficient data
     */
    getMinimalPredictions(timeframe) {
        return {
            weeklyPrediction: { hours: 0, confidence: 0, model: 'insufficient_data' },
            monthlyPrediction: { hours: 0, confidence: 0, model: 'insufficient_data' },
            yearlyPrediction: { hours: 0, confidence: 0, model: 'insufficient_data' },
            beltProgression: { message: 'Need more training data for predictions', predictions: [] },
            milestones: [],
            trends: { overall: { direction: 'unknown', description: 'Insufficient data' } },
            confidence: { overall: 0 },
            recommendations: [{
                type: 'data',
                priority: 'high',
                title: 'Start Training Consistently',
                description: 'Record at least 3-5 training sessions to get meaningful predictions.',
                action: 'Begin regular training and log your sessions'
            }]
        };
    }

    /**
     * Helper methods
     */
    getBeltTitle(beltName) {
        const belt = rewardSystem.belts.find(b => b.name === beltName);
        return belt ? belt.title : beltName;
    }

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

    getEstimatedDate(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }

    getTrendDescription(growthTrend) {
        if (growthTrend.rate > 20) return 'Rapidly increasing training frequency';
        if (growthTrend.rate > 0) return 'Gradually increasing training frequency';
        if (growthTrend.rate < -20) return 'Significantly decreasing training frequency';
        if (growthTrend.rate < 0) return 'Slightly decreasing training frequency';
        return 'Stable training frequency';
    }

    getBestMonth(seasonalPattern) {
        return seasonalPattern.reduce((best, current) => 
            current.hours > best.hours ? current : best
        );
    }

    getWorstMonth(seasonalPattern) {
        return seasonalPattern.reduce((worst, current) => 
            current.hours < worst.hours ? current : worst
        );
    }

    getSeasonalVariation(seasonalPattern) {
        const hours = seasonalPattern.map(month => month.hours);
        const max = Math.max(...hours);
        const min = Math.min(...hours);
        const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length;
        
        return {
            max,
            min,
            average: Math.round(avg * 10) / 10,
            variation: max > 0 ? Math.round(((max - min) / max) * 100) : 0
        };
    }

    /**
     * Update predictions (called when sessions are updated)
     */
    updatePredictions() {
        // Trigger event for UI updates
        const event = new CustomEvent('predictionsUpdated', {
            detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Export predictions data
     */
    exportPredictions() {
        const predictions = this.getPredictions();
        return {
            ...predictions,
            generatedAt: new Date().toISOString(),
            model: this.currentModel,
            version: '1.0'
        };
    }

    /**
     * Set prediction model
     */
    setPredictionModel(model) {
        if (Object.values(this.predictionModels).includes(model)) {
            this.currentModel = model;
            this.updatePredictions();
        }
    }
}

// Create global statistics predictor instance
window.statisticsPredictor = new StatisticsPredictor();