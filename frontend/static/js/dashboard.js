// Dashboard.js - Handles the dashboard UI and data visualization

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');
    
    // Make sure we are on the dashboard page
    if (!document.getElementById('dashboard-container')) {
        console.log('Not on dashboard page, exiting dashboard script');
        return;
    }
    
    // Clear any existing error messages first
    hideError();
    
    // Initialize the dashboard
    initDashboard();
});

// Hide error message 
function hideError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

async function initDashboard() {
    console.log('Initializing dashboard');
    
    // Show loading state
    showLoading(true);
    
    try {
        // Get dashboard data - try to fetch components individually to allow partial success
        let accounts = [];
        let recentTransactions = [];
        let criticalError = false;
        
        try {
            accounts = await fetchAccounts();
            console.log('Accounts data loaded:', accounts);
            renderAccountsOverview(accounts);
        } catch (accountError) {
            console.error('Error loading accounts:', accountError);
            // Only mark as critical if we're in production
            if (!isDevelopment()) {
                criticalError = true;
            }
        }
        
        try {
            recentTransactions = await fetchRecentTransactions();
            console.log('Transactions data loaded:', recentTransactions);
            renderRecentTransactions(recentTransactions);
        } catch (transactionError) {
            console.error('Error loading transactions:', transactionError);
        }
        
        try {
            renderSpendingChart(recentTransactions);
        } catch (chartError) {
            console.error('Error rendering spending chart:', chartError);
        }
        
        try {
            renderBudgetProgress();
        } catch (budgetError) {
            console.error('Error rendering budget progress:', budgetError);
        }
        
        // Set up dashboard event listeners
        setupDashboardEvents();
        
        // Only show error message for critical failures in production
        if (criticalError && !isDevelopment()) {
            setTimeout(() => {
                showError('Could not load some dashboard data. You may need to refresh.');
            }, 500); // Delay error message to prevent it appearing then immediately disappearing
        }
        
    } catch (error) {
        console.error('Critical error initializing dashboard:', error);
        // Only show error in production mode
        if (!isDevelopment()) {
            setTimeout(() => {
                showError('Failed to load dashboard data. Please try again later.');
            }, 500);
        }
    } finally {
        // Always hide the loading indicator and show content
        showLoading(false);
    }
}

// Fetch accounts data
async function fetchAccounts() {
    console.log('Fetching accounts');
    
    try {
        const token = getAuthToken();
        
        // If no token is available, user is not logged in
        if (!token) {
            console.warn('No auth token found, redirecting to login');
            window.location.href = '/login';
            return [];
        }
        
        // In development mode with isDevelopment() true, use mock data
        if (isDevelopment()) {
            console.log('Using mock account data in development mode');
            // Get cached mock accounts from localStorage if available
            const cachedAccounts = localStorage.getItem('mockAccounts');
            if (cachedAccounts) {
                return JSON.parse(cachedAccounts);
            }
            return getMockAccounts();
        }
        
        // Make API request with auth token
        const response = await fetch('/api/accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // If unauthorized, redirect to login
            if (response.status === 401) {
                console.warn('Unauthorized, redirecting to login');
                window.location.href = '/login';
                return [];
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Account data received:', data);
        
        // Normalize the data format
        let accounts = data.accounts || [];
        
        // Map backend field names to frontend expected format if needed
        accounts = accounts.map(account => ({
            id: account.id,
            name: account.name,
            type: account.type || account.account_type, // Handle both formats
            balance: account.balance,
            institution: account.institution || "Unknown"
        }));
        
        return accounts;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        
        // If we're in development mode, return mock data
        if (isDevelopment()) {
            console.log('Using mock account data due to error');
            return getMockAccounts();
        }
        
        // Show error to user
        showError(`Failed to load accounts: ${error.message}`);
        return [];
    }
}

// Fetch recent transactions
async function fetchRecentTransactions() {
    console.log('Fetching recent transactions');
    
    try {
        // Always use mock data in development mode to prevent loading issues
        if (isDevelopment()) {
            console.log('Using mock transaction data in development mode');
            return getMockTransactions();
        }
        
        const response = await fetch('/api/transactions/recent', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.transactions;
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        
        // If we're in development mode, return mock data
        if (isDevelopment()) {
            console.log('Using mock transaction data due to error');
            return getMockTransactions();
        }
        
        throw error;
    }
}

// API request functions

async function fetchSpendingByCategory(period = 'month') {
    console.log('Fetching spending by category...');
    try {
        const response = await fetch(`/api/analysis/spending?period=${period}`, {
            headers: getAuthHeaders()
        });
        
        console.log('Spending API response:', response.status);
        
        if (!response.ok) {
            // If API returns 404, return empty data instead of error
            if (response.status === 404) {
                console.log('No spending data available');
                return { categories: [], amounts: [] };
            }
            
            // In development, use mock data when API fails
            if (isDevelopment()) {
                console.warn('Using mock spending data due to API error');
                return getMockSpendingData();
            }
            
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `HTTP error ${response.status}`;
            } catch (e) {
                errorText = `HTTP error ${response.status}`;
            }
            throw new Error(`Failed to fetch spending: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Spending data received:', data);
        return data;
    } catch (error) {
        console.error('Error in fetchSpendingByCategory:', error);
        // In development, use mock data when exception occurs
        if (isDevelopment()) {
            console.warn('Using mock spending data due to exception');
            return getMockSpendingData();
        }
        throw error;
    }
}

async function fetchMonthlyTrends(months = 6) {
    console.log('Fetching monthly trends...');
    try {
        const response = await fetch(`/api/analysis/monthly-trends?months=${months}`, {
            headers: getAuthHeaders()
        });
        
        console.log('Trends API response:', response.status);
        
        if (!response.ok) {
            // If API returns 404, return empty data instead of error
            if (response.status === 404) {
                console.log('No trends data available');
                return { months: [], income: [], expenses: [] };
            }
            
            // In development, use mock data when API fails
            if (isDevelopment()) {
                console.warn('Using mock trends data due to API error');
                return getMockTrendsData();
            }
            
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `HTTP error ${response.status}`;
            } catch (e) {
                errorText = `HTTP error ${response.status}`;
            }
            throw new Error(`Failed to fetch trends: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Trends data received:', data);
        return data;
    } catch (error) {
        console.error('Error in fetchMonthlyTrends:', error);
        // In development, use mock data when exception occurs
        if (isDevelopment()) {
            console.warn('Using mock trends data due to exception');
            return getMockTrendsData();
        }
        throw error;
    }
}

async function fetchRecommendations() {
    console.log('Fetching recommendations...');
    try {
        const response = await fetch('/api/analysis/recommendations', {
            headers: getAuthHeaders()
        });
        
        console.log('Recommendations API response:', response.status);
        
        if (!response.ok) {
            // If API returns 404, return empty data instead of error
            if (response.status === 404) {
                console.log('No recommendations available');
                return [];
            }
            
            // In development, use mock data when API fails
            if (isDevelopment()) {
                console.warn('Using mock recommendations data due to API error');
                return getMockRecommendations();
            }
            
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `HTTP error ${response.status}`;
            } catch (e) {
                errorText = `HTTP error ${response.status}`;
            }
            throw new Error(`Failed to fetch recommendations: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Recommendations data received:', data);
        return data;
    } catch (error) {
        console.error('Error in fetchRecommendations:', error);
        // In development or production, use mock data for recommendations
        // since they're not critical for the app to function
        console.warn('Using mock recommendations data due to exception');
        return getMockRecommendations();
    }
}

// Rendering functions

function renderAccountsOverview(accounts) {
    const overviewContainer = document.getElementById('accounts-overview');
    
    if (!overviewContainer) {
        console.error('Accounts overview container not found');
        return;
    }
    
    // Clear any existing content
    overviewContainer.innerHTML = '';
    
    // If no accounts, show empty state
    if (!accounts || accounts.length === 0) {
        overviewContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-wallet"></i>
                <p>No accounts found. Add an account to get started!</p>
                <a href="/accounts" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Account
                </a>
            </div>
        `;
        return;
    }
    
    // Calculate totals
    const totals = {
        totalAssets: 0,
        totalDebt: 0,
        netWorth: 0
    };
    
    accounts.forEach(account => {
        if (account.type === 'Credit' || parseFloat(account.balance) < 0) {
            totals.totalDebt += Math.abs(parseFloat(account.balance < 0 ? account.balance : 0));
        } else {
            totals.totalAssets += parseFloat(account.balance > 0 ? account.balance : 0);
        }
    });
    
    // Calculate net worth
    totals.netWorth = totals.totalAssets - totals.totalDebt;
    
    // Create and append account summary
    const summaryHTML = `
        <div class="account-summary">
            <div class="summary-card assets">
                <h3>Total Assets</h3>
                <p>${formatCurrency(totals.totalAssets)}</p>
            </div>
            <div class="summary-card debt">
                <h3>Total Debt</h3>
                <p>${formatCurrency(totals.totalDebt)}</p>
            </div>
            <div class="summary-card net-worth">
                <h3>Net Worth</h3>
                <p>${formatCurrency(totals.netWorth)}</p>
            </div>
        </div>
    `;
    
    // Create account list preview (show only first 3)
    const previewAccounts = accounts.slice(0, 3);
    
    let accountsListHTML = '<div class="accounts-list-preview">';
    previewAccounts.forEach(account => {
        const balanceClass = parseFloat(account.balance) >= 0 ? 'positive' : 'negative';
        accountsListHTML += `
            <div class="account-item">
                <div class="account-details">
                    <h4>${account.name}</h4>
                    <p>${account.institution}</p>
                </div>
                <div class="account-balance ${balanceClass}">
                    ${formatCurrency(account.balance)}
                </div>
            </div>
        `;
    });
    
    // Add "View All" link if there are more than 3 accounts
    if (accounts.length > 3) {
        accountsListHTML += `
            <div class="view-all">
                <a href="/accounts" class="btn btn-outline">View All Accounts (${accounts.length})</a>
            </div>
        `;
    }
    
    accountsListHTML += '</div>';
    
    // Append everything to the container
    overviewContainer.innerHTML = summaryHTML + accountsListHTML;
}

function renderRecentTransactions(transactions) {
    const transactionsContainer = document.getElementById('recent-transactions');
    
    if (!transactionsContainer) {
        console.error('Transactions container not found');
        return;
    }
    
    // Clear any existing content
    transactionsContainer.innerHTML = '';
    
    // If no transactions, show empty state
    if (!transactions || transactions.length === 0) {
        transactionsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-exchange-alt"></i>
                <p>No recent transactions found.</p>
                <a href="/transactions" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Transaction
                </a>
            </div>
        `;
        return;
    }
    
    // Create transactions list (show only first 5)
    const recentTransactions = transactions.slice(0, 5);
    
    let transactionsListHTML = '<div class="transactions-list">';
    recentTransactions.forEach(transaction => {
        const amountClass = parseFloat(transaction.amount) >= 0 ? 'positive' : 'negative';
        transactionsListHTML += `
            <div class="transaction-item">
                <div class="transaction-details">
                    <h4>${transaction.description}</h4>
                    <p>${formatDate(transaction.date)} · ${transaction.category || 'Uncategorized'}</p>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    });
    
    // Add "View All" link if there are transactions
    if (transactions.length > 0) {
        transactionsListHTML += `
            <div class="view-all">
                <a href="/transactions" class="btn btn-outline">View All Transactions</a>
            </div>
        `;
    }
    
    transactionsListHTML += '</div>';
    
    // Append everything to the container
    transactionsContainer.innerHTML = transactionsListHTML;
}

function renderSpendingChart(transactions) {
    const chartContainer = document.getElementById('spending-chart');
    
    if (!chartContainer) {
        console.error('Spending chart container not found');
        return;
    }
    
    // If no transactions, show empty state
    if (!transactions || transactions.length === 0) {
        chartContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-chart-pie"></i>
                <p>No spending data available yet.</p>
            </div>
        `;
        return;
    }
    
    // Process transactions data to get spending by category
    const categories = {};
    transactions.forEach(transaction => {
        // Only include expenses (negative amounts)
        if (parseFloat(transaction.amount) < 0) {
            const category = transaction.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += Math.abs(parseFloat(transaction.amount));
        }
    });
    
    // If no spending categories, show empty state
    if (Object.keys(categories).length === 0) {
        chartContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-chart-pie"></i>
                <p>No spending data available yet.</p>
            </div>
        `;
        return;
    }
    
    // Prepare data for Chart.js
    const chartData = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
                '#FF9F40', '#7D7D7D', '#C9CBCF', '#7CB9E8'
            ]
        }]
    };
    
    // Create canvas for chart
    chartContainer.innerHTML = '<canvas id="expense-chart"></canvas>';
    const canvas = document.getElementById('expense-chart');
    
    // Create chart
    new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'right'
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const value = data.datasets[0].data[tooltipItem.index];
                        return formatCurrency(value);
                    }
                }
            }
        }
    });
}

function renderBudgetProgress() {
    const budgetContainer = document.getElementById('budget-progress');
    
    if (!budgetContainer) {
        console.error('Budget progress container not found');
        return;
    }
    
    // For mock data, always show simple progress
    const mockBudgetData = {
        totalBudget: 2500,
        totalSpent: 1750,
        categories: [
            { name: 'Housing', budgeted: 1000, spent: 1000, percentage: 100 },
            { name: 'Food', budgeted: 500, spent: 350, percentage: 70 },
            { name: 'Transportation', budgeted: 300, spent: 200, percentage: 67 },
            { name: 'Utilities', budgeted: 200, spent: 150, percentage: 75 }
        ]
    };
    
    const totalPercentage = (mockBudgetData.totalSpent / mockBudgetData.totalBudget) * 100;
    
    // Create budget overview
    let budgetHTML = `
        <div class="budget-overview">
            <div class="budget-header">
                <div class="budget-title">
                    <h3>Current Month Budget</h3>
                    <p>${formatCurrency(mockBudgetData.totalSpent)} of ${formatCurrency(mockBudgetData.totalBudget)}</p>
                </div>
                <a href="/budgets" class="btn btn-sm btn-outline">View Budget</a>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${totalPercentage}%"></div>
            </div>
        </div>
        <div class="budget-categories">
    `;
    
    // Add top categories
    mockBudgetData.categories.forEach(category => {
        const progressClass = category.percentage > 90 ? 'danger' : 
                             category.percentage > 75 ? 'warning' : 'good';
        
        budgetHTML += `
            <div class="budget-category">
                <div class="category-header">
                    <h4>${category.name}</h4>
                    <p>${formatCurrency(category.spent)} of ${formatCurrency(category.budgeted)}</p>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${category.percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    budgetHTML += '</div>';
    
    // Append everything to the container
    budgetContainer.innerHTML = budgetHTML;
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
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } else {
        // Fallback if error container doesn't exist
        console.error('Error:', message);
        alert(`Error: ${message}`);
    }
}

function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.className = 'error-container';
    document.body.appendChild(container);
    return container;
}

// Add mock data handlers after the API request functions

function getMockAccounts() {
    return [
        { id: 1, name: 'Checking Account', type: 'Checking', balance: 3500.75, institution: 'Bank of America' },
        { id: 2, name: 'Savings Account', type: 'Savings', balance: 12500.50, institution: 'Chase' },
        { id: 3, name: 'Credit Card', type: 'Credit', balance: -450.25, institution: 'Citi' },
        { id: 4, name: 'Investment Account', type: 'Investment', balance: 28750.00, institution: 'Vanguard' }
    ];
}

function getMockTransactions() {
    return [
        { id: 1, date: '2025-03-15', description: 'Grocery Store', amount: -125.65, category: 'Food', account_id: 1 },
        { id: 2, date: '2025-03-14', description: 'Salary Deposit', amount: 3500.00, category: 'Income', account_id: 1 },
        { id: 3, date: '2025-03-12', description: 'Restaurant', amount: -85.20, category: 'Dining Out', account_id: 3 },
        { id: 4, date: '2025-03-10', description: 'Electric Bill', amount: -145.30, category: 'Utilities', account_id: 1 },
        { id: 5, date: '2025-03-08', description: 'Transfer to Savings', amount: -500.00, category: 'Transfer', account_id: 1 },
        { id: 6, date: '2025-03-08', description: 'Transfer from Checking', amount: 500.00, category: 'Transfer', account_id: 2 }
    ];
}

function getMockSpendingData() {
    console.log('Using mock spending data');
    return {
        categories: ['Groceries', 'Dining', 'Transportation', 'Utilities', 'Entertainment'],
        amounts: [350.42, 215.80, 180.25, 145.99, 95.50]
    };
}

function getMockTrendsData() {
    console.log('Using mock trends data');
    const months = [];
    const income = [];
    const expenses = [];
    
    // Generate last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(month.toLocaleString('default', { month: 'short' }));
        
        // Generate random income and expenses that make sense
        const monthIncome = 3000 + Math.floor(Math.random() * 500);
        income.push(monthIncome);
        
        const monthExpenses = 2000 + Math.floor(Math.random() * 800);
        expenses.push(monthExpenses);
    }
    
    return { months, income, expenses };
}

function getMockRecommendations() {
    console.log('Using mock recommendations data');
    return [
        {
            id: 'mock-rec1',
            title: 'Reduce dining expenses',
            description: 'Your dining expenses are 15% higher than last month. Consider cooking at home more often.',
            impact: 'medium',
            category: 'spending'
        },
        {
            id: 'mock-rec2',
            title: 'Save for emergency fund',
            description: 'You don\'t have an emergency fund. Consider setting aside 3-6 months of expenses.',
            impact: 'high',
            category: 'savings'
        },
        {
            id: 'mock-rec3',
            title: 'Add your recurring bills',
            description: 'Track your recurring bills to better forecast your monthly expenses.',
            impact: 'low',
            category: 'tracking'
        }
    ];
}

// Helper function to determine if running in development mode
function isDevelopment() {
    // Check if window.location.hostname is localhost or 127.0.0.1
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Show/hide loading state
function showLoading(show) {
    const loadingIndicator = document.getElementById('dashboard-loading');
    const dashboardContent = document.getElementById('dashboard-content');
    
    if (loadingIndicator && dashboardContent) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
        dashboardContent.style.display = show ? 'none' : 'block';
    }
}