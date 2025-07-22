/**
 * Chart Manager - Handles all chart and statistics visualization
 * Uses Chart.js for interactive charts and graphs
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: '#d32f2f',
            secondary: '#ff5722',
            tertiary: '#ff9800',
            success: '#4caf50',
            info: '#2196f3',
            warning: '#ff9800',
            danger: '#f44336'
        };
        
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        };
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.createTrainingHoursChart();
        this.createTrainingTypesChart();
        this.createProgressChart();
        this.createConsistencyChart();
    }

    /**
     * Create training hours chart (line chart)
     */
    createTrainingHoursChart() {
        const canvas = document.getElementById('training-hours-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getTrainingHoursData();

        if (this.charts.trainingHours) {
            this.charts.trainingHours.destroy();
        }

        this.charts.trainingHours = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Weekly Hours',
                    data: data.weeklyHours,
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Monthly Hours',
                    data: data.monthlyHours,
                    borderColor: this.chartColors.secondary,
                    backgroundColor: this.chartColors.secondary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.secondary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create training types distribution chart (doughnut chart)
     */
    createTrainingTypesChart() {
        const canvas = document.getElementById('training-types-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getTrainingTypesData();

        if (this.charts.trainingTypes) {
            this.charts.trainingTypes.destroy();
        }

        this.charts.trainingTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        this.chartColors.primary,
                        this.chartColors.secondary,
                        this.chartColors.tertiary,
                        this.chartColors.success,
                        this.chartColors.info,
                        this.chartColors.warning,
                        this.chartColors.danger,
                        '#9c27b0'
                    ],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 5,
                    hoverOffset: 10
                }]
            },
            options: {
                ...this.chartOptions,
                cutout: '60%',
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${this.formatDuration(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create progress over time chart (bar chart)
     */
    createProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getProgressData();

        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        this.charts.progress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sessions',
                    data: data.sessions,
                    backgroundColor: this.chartColors.primary + '80',
                    borderColor: this.chartColors.primary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }, {
                    label: 'Hours',
                    data: data.hours,
                    backgroundColor: this.chartColors.secondary + '80',
                    borderColor: this.chartColors.secondary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    yAxisID: 'y1'
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sessions'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create consistency chart (heatmap-style)
     */
    createConsistencyChart() {
        const canvas = document.getElementById('consistency-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getConsistencyData();

        if (this.charts.consistency) {
            this.charts.consistency.destroy();
        }

        this.charts.consistency = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Training Days',
                    data: data.points,
                    backgroundColor: (ctx) => {
                        const value = ctx.parsed.y;
                        const alpha = Math.min(value / 3, 1); // Max 3 sessions per day
                        return `rgba(211, 47, 47, ${alpha})`;
                    },
                    borderColor: this.chartColors.primary,
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM DD'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'Sessions'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                return new Date(context[0].parsed.x).toLocaleDateString();
                            },
                            label: (context) => {
                                return `${context.parsed.y} session${context.parsed.y !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Get training hours data for chart
     */
    getTrainingHoursData() {
        const sessions = storage.getAllSessions();
        const weeks = {};
        const months = {};
        
        // Group sessions by week and month
        sessions.forEach(session => {
            const date = new Date(session.date);
            const weekKey = this.getWeekKey(date);
            const monthKey = this.getMonthKey(date);
            
            weeks[weekKey] = (weeks[weekKey] || 0) + session.duration / 60;
            months[monthKey] = (months[monthKey] || 0) + session.duration / 60;
        });
        
        // Get last 12 weeks/months
        const labels = [];
        const weeklyHours = [];
        const monthlyHours = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            
            const weekKey = this.getWeekKey(date);
            const monthKey = this.getMonthKey(date);
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            weeklyHours.push(weeks[weekKey] || 0);
            monthlyHours.push(months[monthKey] || 0);
        }
        
        return { labels, weeklyHours, monthlyHours };
    }

    /**
     * Get training types data for chart
     */
    getTrainingTypesData() {
        const stats = storage.getStats();
        const distribution = stats.typeDistribution || {};
        
        const labels = Object.keys(distribution);
        const values = Object.values(distribution);
        
        return { labels, values };
    }

    /**
     * Get progress data for chart
     */
    getProgressData() {
        const sessions = storage.getAllSessions();
        const monthlyData = {};
        
        sessions.forEach(session => {
            const monthKey = this.getMonthKey(new Date(session.date));
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { sessions: 0, hours: 0 };
            }
            monthlyData[monthKey].sessions++;
            monthlyData[monthKey].hours += session.duration / 60;
        });
        
        const sortedKeys = Object.keys(monthlyData).sort();
        const labels = sortedKeys.map(key => {
            const [year, month] = key.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        const sessionsData = sortedKeys.map(key => monthlyData[key].sessions);
        const hoursData = sortedKeys.map(key => monthlyData[key].hours);
        
        return { labels, sessions: sessionsData, hours: hoursData };
    }

    /**
     * Get consistency data for chart
     */
    getConsistencyData() {
        const sessions = storage.getAllSessions();
        const dailyData = {};
        
        sessions.forEach(session => {
            const date = session.date;
            dailyData[date] = (dailyData[date] || 0) + 1;
        });
        
        const points = Object.entries(dailyData).map(([date, count]) => ({
            x: new Date(date).getTime(),
            y: count
        }));
        
        return { points };
    }

    /**
     * Update all charts with latest data
     */
    updateCharts() {
        Object.keys(this.charts).forEach(chartKey => {
            this.updateChart(chartKey);
        });
    }

    /**
     * Update specific chart
     */
    updateChart(chartType) {
        const chart = this.charts[chartType];
        if (!chart) return;

        let newData;
        switch (chartType) {
            case 'trainingHours':
                newData = this.getTrainingHoursData();
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.weeklyHours;
                chart.data.datasets[1].data = newData.monthlyHours;
                break;
            case 'trainingTypes':
                newData = this.getTrainingTypesData();
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.values;
                break;
            case 'progress':
                newData = this.getProgressData();
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.sessions;
                chart.data.datasets[1].data = newData.hours;
                break;
            case 'consistency':
                newData = this.getConsistencyData();
                chart.data.datasets[0].data = newData.points;
                break;
        }
        
        chart.update('active');
    }

    /**
     * Destroy chart
     */
    destroyChart(chartType) {
        if (this.charts[chartType]) {
            this.charts[chartType].destroy();
            delete this.charts[chartType];
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartType => {
            this.destroyChart(chartType);
        });
    }

    /**
     * Get week key for grouping
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-W${weekNumber}`;
    }

    /**
     * Get month key for grouping
     */
    getMonthKey(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    /**
     * Format duration for display
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        
        if (hours === 0) {
            return `${mins}min`;
        } else if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}min`;
        }
    }

    /**
     * Export chart as image
     */
    exportChart(chartType, filename) {
        const chart = this.charts[chartType];
        if (!chart) return;

        const link = document.createElement('a');
        link.download = filename || `${chartType}-chart.png`;
        link.href = chart.toBase64Image();
        link.click();
    }

    /**
     * Get chart statistics summary
     */
    getChartStats() {
        const stats = storage.getStats();
        return {
            totalHours: stats.totalHours,
            totalSessions: stats.totalSessions,
            weeklyAverage: stats.weeklyHours,
            monthlyAverage: stats.monthlyHours,
            mostPopularType: this.getMostPopularTrainingType(stats.typeDistribution),
            consistency: this.getConsistencyScore()
        };
    }

    /**
     * Get most popular training type
     */
    getMostPopularTrainingType(distribution) {
        if (!distribution || Object.keys(distribution).length === 0) {
            return 'None';
        }
        
        return Object.entries(distribution)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    /**
     * Calculate consistency score (0-100)
     */
    getConsistencyScore() {
        const sessions = storage.getAllSessions();
        if (sessions.length === 0) return 0;
        
        const last30Days = sessions.filter(session => {
            const sessionDate = new Date(session.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return sessionDate >= thirtyDaysAgo;
        });
        
        const uniqueDays = new Set(last30Days.map(session => session.date)).size;
        return Math.round((uniqueDays / 30) * 100);
    }
}

// Listen for sessions updates to refresh charts
window.addEventListener('sessionsUpdated', () => {
    if (window.chartManager) {
        window.chartManager.updateCharts();
    }
});

// Create global chart manager instance
window.chartManager = new ChartManager(); 