// Dashboard.js - Handles the dashboard UI and data visualization

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    if (!document.getElementById('dashboard-container')) return;
    
    // Initialize the dashboard
    initDashboard();
});

async function initDashboard() {
    // Set loading states
    document.querySelectorAll('.loading-indicator').forEach(el => {
        el.style.display = 'flex';
    });
    
    try {
        // Load all required data in parallel
        const [accountsData, transactionsData, spendingData, trendData] = await Promise.all([
            fetchAccounts(),
            fetchRecentTransactions(),
            fetchSpendingByCategory(),
            fetchMonthlyTrends()
        ]);
        
        // Render different sections
        renderAccountSummary(accountsData);
        renderRecentTransactions(transactionsData);
        renderSpendingChart(spendingData);
        renderTrendChart(trendData);
        
        // Load recommendations
        const recommendationsData = await fetchRecommendations();
        renderRecommendations(recommendationsData);
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data. Please try again later.');
    } finally {
        // Hide loading indicators
        document.querySelectorAll('.loading-indicator').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// API request functions

async function fetchAccounts() {
    const response = await fetch('/api/accounts', {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch accounts');
    }
    
    return await response.json();
}

async function fetchRecentTransactions(limit = 5) {
    const response = await fetch(`/api/transactions?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }
    
    return await response.json();
}

async function fetchSpendingByCategory() {
    // Get data for the current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    
    const response = await fetch(`/api/analysis/spending-by-category?start_date=${startDate}&end_date=${endDate}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch spending data');
    }
    
    return await response.json();
}

async function fetchMonthlyTrends(months = 6) {
    const response = await fetch(`/api/analysis/monthly-trends?months=${months}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch trend data');
    }
    
    return await response.json();
}

async function fetchRecommendations() {
    const response = await fetch('/api/analysis/recommendations/spending', {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
    }
    
    return await response.json();
}

// Rendering functions

function renderAccountSummary(accounts) {
    const accountsContainer = document.getElementById('accounts-summary');
    if (!accountsContainer) return;
    
    accountsContainer.innerHTML = '';
    
    let totalBalance = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    accounts.forEach(account => {
        // Create account card
        const accountCard = document.createElement('div');
        accountCard.className = 'account-card';
        
        // Determine if this is an asset or liability account
        const isAsset = account.balance >= 0;
        
        // Update totals
        totalBalance += account.balance;
        if (isAsset) {
            totalAssets += account.balance;
        } else {
            totalLiabilities += Math.abs(account.balance);
        }
        
        // Set card content
        accountCard.innerHTML = `
            <h3>${account.name}</h3>
            <p class="account-type">${account.account_type}</p>
            <p class="account-balance ${isAsset ? 'positive' : 'negative'}">
                ${formatCurrency(account.balance)}
            </p>
        `;
        
        accountsContainer.appendChild(accountCard);
    });
    
    // Update summary totals
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('total-assets').textContent = formatCurrency(totalAssets);
    document.getElementById('total-liabilities').textContent = formatCurrency(totalLiabilities);
}

function renderRecentTransactions(transactions) {
    const transactionsContainer = document.getElementById('recent-transactions-list');
    if (!transactionsContainer) return;
    
    transactionsContainer.innerHTML = '';
    
    if (!transactions.length) {
        transactionsContainer.innerHTML = '<p class="no-data">No recent transactions found.</p>';
        return;
    }
    
    transactions.forEach(transaction => {
        const transactionRow = document.createElement('div');
        transactionRow.className = 'transaction-row';
        
        const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
        const transactionType = transaction.transaction_type;
        
        transactionRow.innerHTML = `
            <div class="transaction-date">
                ${formatDate(transaction.transaction_date)}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-category">${transaction.category_name || 'Uncategorized'}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${formatCurrency(transaction.amount)}
            </div>
        `;
        
        transactionsContainer.appendChild(transactionRow);
    });
    
    // Add link to view all transactions
    const viewAllLink = document.createElement('a');
    viewAllLink.href = '/transactions';
    viewAllLink.className = 'view-all-link';
    viewAllLink.textContent = 'View all transactions →';
    transactionsContainer.appendChild(viewAllLink);
}

function renderSpendingChart(spendingData) {
    const chartContainer = document.getElementById('spending-chart');
    if (!chartContainer) return;
    
    if (!spendingData.categories || !spendingData.categories.length) {
        chartContainer.innerHTML = '<p class="no-data">No spending data available for this period.</p>';
        return;
    }
    
    // Prepare data for chart
    const categories = spendingData.categories.slice(0, 7); // Top 7 categories
    const chartData = {
        labels: categories.map(cat => cat.category),
        datasets: [{
            data: categories.map(cat => cat.total_amount),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7D7D7D'
            ]
        }]
    };
    
    // Create canvas for chart
    chartContainer.innerHTML = '<canvas id="spending-doughnut-chart"></canvas>';
    const ctx = document.getElementById('spending-doughnut-chart').getContext('2d');
    
    // Create the chart
    new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'right',
                labels: {
                    padding: 20,
                    boxWidth: 15
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const value = data.datasets[0].data[tooltipItem.index];
                        return data.labels[tooltipItem.index] + ': ' + formatCurrency(value);
                    }
                }
            }
        }
    });
    
    // Add percentage info below chart
    const percentageList = document.createElement('div');
    percentageList.className = 'percentage-list';
    
    categories.forEach(category => {
        const percentageItem = document.createElement('div');
        percentageItem.className = 'percentage-item';
        percentageItem.innerHTML = `
            <span class="category-name">${category.category}</span>
            <span class="category-percentage">${category.percentage.toFixed(1)}%</span>
        `;
        percentageList.appendChild(percentageItem);
    });
    
    chartContainer.appendChild(percentageList);
}

function renderTrendChart(trendData) {
    const chartContainer = document.getElementById('trend-chart');
    if (!chartContainer) return;
    
    if (!trendData.trends || !trendData.trends.length) {
        chartContainer.innerHTML = '<p class="no-data">No trend data available yet.</p>';
        return;
    }
    
    // Prepare data for chart
    const labels = trendData.trends.map(item => formatMonth(item.month));
    const data = trendData.trends.map(item => item.total_amount);
    
    // Create canvas for chart
    chartContainer.innerHTML = '<canvas id="monthly-trend-chart"></canvas>';
    const ctx = document.getElementById('monthly-trend-chart').getContext('2d');
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data,
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return 'Spending: ' + formatCurrency(tooltipItem.yLabel);
                    }
                }
            }
        }
    });
}

function renderRecommendations(recommendationsData) {
    const container = document.getElementById('recommendations-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (recommendationsData.status !== 'success' || !recommendationsData.recommendations.length) {
        container.innerHTML = '<p class="no-data">No recommendations available yet. Continue tracking your expenses for personalized insights.</p>';
        return;
    }
    
    recommendationsData.recommendations.forEach(recommendation => {
        const recommendationCard = document.createElement('div');
        recommendationCard.className = 'recommendation-card';
        
        let iconClass;
        switch (recommendation.type) {
            case 'high_spending':
                iconClass = 'fa-chart-pie';
                break;
            case 'increasing_trend':
                iconClass = 'fa-chart-line';
                break;
            default:
                iconClass = 'fa-lightbulb';
        }
        
        recommendationCard.innerHTML = `
            <div class="recommendation-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="recommendation-content">
                <h4>${recommendation.category}</h4>
                <p>${recommendation.message}</p>
                <p class="recommendation-action">${recommendation.action}</p>
            </div>
        `;
        
        container.appendChild(recommendationCard);
    });
}

// Utility functions

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function showError(message) {
    const errorContainer = document.getElementById('error-container') || createErrorContainer();
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.className = 'error-container';
    document.body.appendChild(container);
    return container;
}