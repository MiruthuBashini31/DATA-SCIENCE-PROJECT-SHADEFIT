// Dashboard Analytics and Charts
class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.setupDashboard();
        this.updateOverviewCards();
        this.createAnalysisChart();
        this.updateCategoryStats();
        this.generateInsights();
        this.updateActivityTimeline();
    }

    setupDashboard() {
        const periodSelect = document.getElementById('dashboard-period');
        const exportBtn = document.getElementById('export-dashboard');

        if (periodSelect) {
            periodSelect.addEventListener('change', () => this.updateDashboard());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDashboard());
        }
    }

    updateOverviewCards() {
        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        
        // Update total analyses
        const totalAnalyses = document.getElementById('total-analyses');
        if (totalAnalyses) {
            totalAnalyses.textContent = profile.analyses?.length || 0;
        }

        // Update wishlist count
        const totalWishlist = document.getElementById('total-wishlist');
        if (totalWishlist) {
            const wishlistCount = (profile.wishlist?.length || 0) + (profile.clothingWishlist?.length || 0);
            totalWishlist.textContent = wishlistCount;
        }

        // Update points
        const totalPoints = document.getElementById('total-points');
        if (totalPoints) {
            totalPoints.textContent = profile.points || 0;
        }

        // Update session time
        const sessionTime = document.getElementById('session-time');
        if (sessionTime) {
            const duration = localStorage.getItem('sessionDuration') || 0;
            const minutes = Math.floor(duration / 60000);
            sessionTime.textContent = `${minutes}m`;
        }
    }

    createAnalysisChart() {
        const canvas = document.getElementById('analysis-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        
        // Generate sample data for the last 7 days
        const data = this.generateAnalysisData(profile.analyses || []);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw chart
        this.drawLineChart(ctx, data, canvas.width, canvas.height);
    }

    generateAnalysisData(analyses) {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = analyses.filter(analysis => {
                const analysisDate = new Date(analysis.date).toISOString().split('T')[0];
                return analysisDate === dateStr;
            }).length;
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: count
            });
        }
        
        return last7Days;
    }

    drawLineChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Find max value
        const maxValue = Math.max(...data.map(d => d.count), 1);
        
        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            const y = height - padding - (point.count * chartHeight) / maxValue;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#667eea';
        data.forEach((point, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            const y = height - padding - (point.count * chartHeight) / maxValue;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        data.forEach((point, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            ctx.fillText(point.date, x, height - padding + 20);
        });
    }

    updateCategoryStats() {
        const container = document.getElementById('category-stats');
        if (!container) return;

        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        const categories = {
            'Skin Analysis': profile.analyses?.length || 0,
            'Beauty Products': profile.wishlist?.length || 0,
            'Clothing Items': profile.clothingWishlist?.length || 0,
            'Achievements': profile.achievements?.length || 0
        };

        container.innerHTML = Object.entries(categories).map(([category, count]) => `
            <div class="category-stat" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span style="font-weight: 500;">${category}</span>
                <span style="font-weight: 700; color: var(--accent-purple);">${count}</span>
            </div>
        `).join('');
    }

    generateInsights() {
        const personalInsights = document.getElementById('personal-insights');
        const dashboardRecommendations = document.getElementById('dashboard-recommendations');
        
        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        
        if (personalInsights) {
            const insights = this.getPersonalInsights(profile);
            personalInsights.innerHTML = insights.map(insight => `
                <div style="padding: 1rem; background: var(--input-bg); border-radius: 8px; margin-bottom: 0.5rem;">
                    <i class="fas fa-lightbulb" style="color: var(--warning-orange); margin-right: 0.5rem;"></i>
                    ${insight}
                </div>
            `).join('');
        }

        if (dashboardRecommendations) {
            const recommendations = this.getDashboardRecommendations(profile);
            dashboardRecommendations.innerHTML = recommendations.map(rec => `
                <div style="padding: 1rem; background: var(--input-bg); border-radius: 8px; margin-bottom: 0.5rem;">
                    <i class="fas fa-arrow-right" style="color: var(--success-green); margin-right: 0.5rem;"></i>
                    ${rec}
                </div>
            `).join('');
        }
    }

    getPersonalInsights(profile) {
        const insights = [];
        
        if (profile.analyses?.length > 0) {
            const latestAnalysis = profile.analyses[0];
            insights.push(`Your skin tone is ${latestAnalysis.category} with ${latestAnalysis.undertone} undertones`);
            
            const seasons = [...new Set(profile.analyses.map(a => a.season))];
            if (seasons.length > 1) {
                insights.push(`You've analyzed your skin across ${seasons.length} different seasons`);
            }
        }
        
        if (profile.wishlist?.length > 0) {
            insights.push(`You have ${profile.wishlist.length} beauty products in your wishlist`);
        }
        
        if (profile.points > 0) {
            insights.push(`You've earned ${profile.points} reward points from using the app`);
        }
        
        if (insights.length === 0) {
            insights.push('Complete your first skin analysis to see personalized insights');
        }
        
        return insights;
    }

    getDashboardRecommendations(profile) {
        const recommendations = [];
        
        if (!profile.analyses || profile.analyses.length === 0) {
            recommendations.push('Start with a skin tone analysis to get personalized recommendations');
        } else {
            if (profile.wishlist?.length < 3) {
                recommendations.push('Explore our product catalog and add items to your wishlist');
            }
            
            if (!profile.clothingWishlist || profile.clothingWishlist.length === 0) {
                recommendations.push('Check out clothing recommendations based on your skin tone');
            }
            
            const lastAnalysis = new Date(profile.analyses[0].date);
            const daysSince = Math.floor((Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSince > 30) {
                recommendations.push('Consider doing a new skin analysis - your tone may have changed');
            }
        }
        
        if (profile.points < 50) {
            recommendations.push('Keep using the app to earn more reward points and unlock achievements');
        }
        
        return recommendations;
    }

    updateActivityTimeline() {
        const timeline = document.getElementById('activity-timeline');
        if (!timeline) return;

        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        const activities = this.generateActivityTimeline(profile);

        if (activities.length === 0) {
            timeline.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent activity</p>';
            return;
        }

        timeline.innerHTML = activities.map(activity => `
            <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; background: var(--accent-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary);">${activity.title}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${activity.description}</div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${activity.time}</div>
            </div>
        `).join('');
    }

    generateActivityTimeline(profile) {
        const activities = [];
        
        // Add analysis activities
        if (profile.analyses) {
            profile.analyses.slice(0, 3).forEach(analysis => {
                activities.push({
                    icon: 'magic',
                    title: 'Skin Analysis Completed',
                    description: `${analysis.category} with ${analysis.undertone} undertone`,
                    time: this.getRelativeTime(analysis.date)
                });
            });
        }
        
        // Add achievement activities
        if (profile.achievements) {
            profile.achievements.slice(0, 2).forEach(achievement => {
                activities.push({
                    icon: 'trophy',
                    title: 'Achievement Unlocked',
                    description: achievement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    time: 'Recently'
                });
            });
        }
        
        // Sort by most recent
        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
    }

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return date.toLocaleDateString();
    }

    updateDashboard() {
        this.updateOverviewCards();
        this.createAnalysisChart();
        this.updateCategoryStats();
        this.generateInsights();
        this.updateActivityTimeline();
    }

    exportDashboard() {
        const profile = JSON.parse(localStorage.getItem('styleProfile')) || {};
        const dashboardData = {
            exportDate: new Date().toISOString(),
            totalAnalyses: profile.analyses?.length || 0,
            totalWishlistItems: (profile.wishlist?.length || 0) + (profile.clothingWishlist?.length || 0),
            totalPoints: profile.points || 0,
            achievements: profile.achievements || [],
            recentAnalyses: profile.analyses?.slice(0, 5) || []
        };

        const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beautymatch-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        if (window.app) {
            window.app.showNotification('Dashboard data exported successfully!', 'success');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard')) {
        window.dashboardManager = new DashboardManager();
    }
});