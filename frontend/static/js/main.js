// Main.js - Global application functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main script loaded');
    
    // Handle navigation links
    setupNavigation();
    
    // Set up user menu dropdown toggle
    setupUserMenu();
    
    // Handle page-specific initialization based on URL
    initializePageByUrl();
});

// Set up navigation link handling
function setupNavigation() {
    console.log('Setting up navigation');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.main-nav a');
    
    // Add click handler to each link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // If the link has data-force-reload attribute or Ctrl/Cmd key is pressed, let the browser handle it
            if (this.getAttribute('data-force-reload') === 'true' || e.ctrlKey || e.metaKey) {
                console.log('Allowing browser to handle navigation to:', this.href);
                return; // Let the browser handle the navigation
            }
            
            // Otherwise, prevent default and handle navigation manually
            e.preventDefault();
            
            const targetUrl = this.getAttribute('href');
            console.log('Handling navigation to:', targetUrl);
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // For now, just redirect to force a page reload
            window.location.href = targetUrl;
        });
    });
}

// Set up user menu dropdown
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (userMenu && dropdownMenu) {
        // Toggle dropdown on click
        userMenu.addEventListener('click', function(e) {
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            e.stopPropagation();
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            dropdownMenu.style.display = 'none';
        });
        
        // Prevent closing when clicking on dropdown menu items
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// Initialize page based on URL
function initializePageByUrl() {
    const path = window.location.pathname;
    console.log('Initializing page for path:', path);
    
    // Set active navigation link based on current path
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (path === linkPath || (linkPath !== '/' && path.startsWith(linkPath))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Global utility functions
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function isAuthenticated() {
    return !!getAuthToken();
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
}

// Helper function to determine if running in development mode
// For our budget tracker app, we'll use mock data when API requests fail
function isDevelopment() {
    // Check if we're running on localhost or 127.0.0.1
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Add global event listener for logout button
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Format currency values
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Sample data - in a real app, this would come from your API
    const sampleData = {
        balance: 2450.75,
        income: 3500.00,
        expenses: 1049.25,
        transactions: [
            { id: 1, date: '2025-03-10', description: 'Groceries', amount: -128.45, category: 'Food' },
            { id: 2, date: '2025-03-09', description: 'Salary', amount: 3500.00, category: 'Income' },
            { id: 3, date: '2025-03-08', description: 'Restaurant', amount: -75.80, category: 'Dining' },
            { id: 4, date: '2025-03-07', description: 'Electricity Bill', amount: -95.00, category: 'Utilities' },
            { id: 5, date: '2025-03-05', description: 'Gas Station', amount: -45.00, category: 'Transportation' }
        ]
    };
    
    // Only run these functions on the main dashboard
    if (document.getElementById('summary-cards')) {
        // Render summary cards
        renderSummaryCards(sampleData);
        
        // Render transactions
        renderTransactions(sampleData.transactions);
        
        // Initialize charts (placeholder for now)
        initCharts();
    }
});

function renderSummaryCards(data) {
    const summaryContainer = document.getElementById('summary-cards');
    if (!summaryContainer) return;
    
    // Clear current content
    summaryContainer.innerHTML = '';
    
    // Create and append cards
    const cards = [
        { title: 'Current Balance', value: formatCurrency(data.balance), color: '#3498db' },
        { title: 'Monthly Income', value: formatCurrency(data.income), color: '#2ecc71' },
        { title: 'Monthly Expenses', value: formatCurrency(data.expenses), color: '#e74c3c' }
    ];
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'summary-card';
        cardElement.style.borderLeft = `4px solid ${card.color}`;
        cardElement.innerHTML = `
            <h3>${card.title}</h3>
            <p class="card-value">${card.value}</p>
        `;
        summaryContainer.appendChild(cardElement);
    });
    
    // Add some styling to the cards
    const style = document.createElement('style');
    style.textContent = `
        .summary-card {
            padding: 1.5rem;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .card-value {
            font-size: 1.8rem;
            font-weight: bold;
            margin-top: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}

function renderTransactions(transactions) {
    const transactionsContainer = document.getElementById('transactions-list');
    if (!transactionsContainer) return;
    
    // Clear current content
    transactionsContainer.innerHTML = '';
    
    // Create table
    const table = document.createElement('table');
    table.className = 'transactions-table';
    
    // Add table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Add transactions rows
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Set class based on transaction type
        row.className = transaction.amount >= 0 ? 'income' : 'expense';
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td class="amount">${formatCurrency(transaction.amount)}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    transactionsContainer.appendChild(table);
}

function initCharts() {
    const chartContainer = document.getElementById('expense-chart');
    if (!chartContainer) return;
    
    // Sample data for chart
    const data = {
        labels: ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Other'],
        datasets: [{
            label: 'Expenses by Category',
            data: [500, 350, 200, 180, 120, 150],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ]
        }]
    };
    
    // Create chart
    new Chart(chartContainer, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'right'
            }
        }
    });
}