class LeadScorer {
    constructor() {
        this.form = document.getElementById('leadForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.submitBtn = document.getElementById('submitBtn');
        this.scoreNumber = document.getElementById('scoreNumber');
        this.scoreCategory = document.getElementById('scoreCategory');
        this.classBadge = document.getElementById('classBadge');
        this.classConfidence = document.getElementById('classConfidence');
        this.insightsList = document.getElementById('insightsList');
        this.resultTime = document.getElementById('resultTime');
        this.scoreFill = document.querySelector('.score-fill');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reset button
        document.querySelector('.reset-btn')?.addEventListener('click', () => this.resetForm());
        
        // Schedule button
        document.getElementById('scheduleBtn').addEventListener('click', () => {
            this.showNotification('Opening calendar...', 'info');
        });
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showNotification('Report ready for download', 'success');
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Show loading
        this.submitBtn.classList.add('loading');
        
        // Get values
        const budget = parseInt(document.getElementById('budget').value);
        const urgency = document.getElementById('urgency').value;
        const clarity = document.getElementById('clarity').value;
        const industry = document.getElementById('industry').value;
        
        // Simulate processing
        await this.simulateProcessing();
        
        // Calculate score
        const result = this.calculateScore(budget, urgency, clarity, industry);
        
        // Display results
        this.displayResults(result);
        
        // Hide loading
        this.submitBtn.classList.remove('loading');
        
        // Show results section
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    simulateProcessing() {
        return new Promise(resolve => setTimeout(resolve, 600));
    }

    calculateScore(budget, urgency, clarity, industry) {
        let score = 0;
        let insights = [];

        // Budget scoring
        if (budget >= 100000) {
            score += 40;
            insights.push('Enterprise budget - high potential');
        } else if (budget >= 50000) {
            score += 35;
            insights.push('Mid-market budget - strong fit');
        } else if (budget >= 10000) {
            score += 25;
            insights.push('SMB budget - value focused');
        } else if (budget >= 5000) {
            score += 15;
            insights.push('Startup budget - needs nurturing');
        } else {
            score += 5;
            insights.push('Small budget - consider entry package');
        }

        // Urgency scoring
        switch(urgency) {
            case 'critical':
                score += 25;
                insights.push('Critical urgency - immediate action needed');
                break;
            case 'high':
                score += 20;
                insights.push('High urgency - fast follow-up required');
                break;
            case 'medium':
                score += 12;
                insights.push('Medium urgency - schedule within week');
                break;
            case 'low':
                score += 5;
                insights.push('Low urgency - nurture approach');
                break;
        }

        // Clarity scoring
        switch(clarity) {
            case 'crystal':
                score += 20;
                insights.push('Crystal clear requirements - proposal ready');
                break;
            case 'clear':
                score += 16;
                insights.push('Clear requirements - minimal discovery');
                break;
            case 'moderate':
                score += 10;
                insights.push('Moderate clarity - discovery needed');
                break;
            case 'vague':
                score += 4;
                insights.push('Vague requirements - needs qualification');
                break;
        }

        // Industry scoring
        switch(industry) {
            case 'perfect':
                score += 20;
                insights.push('Perfect industry fit - ideal client');
                break;
            case 'true':
                score += 15;
                insights.push('Good industry fit - relevant experience');
                break;
            case 'partial':
                score += 8;
                insights.push('Partial fit - highlight versatility');
                break;
            case 'false':
                score += 2;
                insights.push('Different industry - focus on value');
                break;
        }

        // Ensure score is within bounds
        score = Math.min(100, Math.max(0, score));

        // Determine category
        let category, color, confidence;
        if (score >= 80) {
            category = 'Hot Lead';
            color = '#0066ff';
            confidence = 98;
        } else if (score >= 60) {
            category = 'Warm Lead';
            color = '#00c853';
            confidence = 92;
        } else if (score >= 40) {
            category = 'Interesting';
            color = '#ffc107';
            confidence = 85;
        } else if (score >= 20) {
            category = 'Cool Lead';
            color = '#ff6b6b';
            confidence = 78;
        } else {
            category = 'Cold Lead';
            color = '#888';
            confidence = 70;
        }

        return {
            score,
            category,
            color,
            confidence,
            insights: insights.slice(0, 3) // Show top 3 insights
        };
    }

    displayResults(result) {
        // Animate score
        this.animateScore(0, result.score);
        
        // Update score circle
        const circumference = 2 * Math.PI * 54;
        const offset = circumference * (1 - result.score / 100);
        this.scoreFill.style.strokeDashoffset = offset;
        
        // Update category
        this.scoreCategory.textContent = result.category;
        this.classBadge.textContent = result.category;
        this.classBadge.style.background = `rgba(${this.hexToRgb(result.color)}, 0.1)`;
        this.classBadge.style.color = result.color;
        
        // Update confidence
        this.classConfidence.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>${result.confidence}% Confidence</span>
        `;
        
        // Update insights
        this.insightsList.innerHTML = result.insights
            .map(insight => `<p>${insight}</p>`)
            .join('');
        
        // Update time
        const now = new Date();
        this.resultTime.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    animateScore(start, end) {
        const duration = 800;
        const step = 16;
        const increment = (end - start) / (duration / step);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                this.scoreNumber.textContent = Math.round(end);
                clearInterval(timer);
            } else {
                this.scoreNumber.textContent = Math.round(current);
            }
        }, step);
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00c853' : '#0066ff'};
            color: white;
            padding: 12px 24px;
            border-radius: 100px;
            font-size: 0.95rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    resetForm() {
        this.form.reset();
        this.resultsSection.style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new LeadScorer();
});
