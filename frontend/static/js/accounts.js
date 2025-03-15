// Accounts.js - Accounts page functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Accounts script loaded');
    
    // Make sure we are on the accounts page
    if (!document.getElementById('accounts-container')) {
        console.log('Not on accounts page, exiting accounts script');
        return;
    }
    
    // Initialize the accounts page
    initAccountsPage();
});

async function initAccountsPage() {
    console.log('Initializing accounts page');
    
    try {
        // Show loading state
        showLoading(true);
        
        // Get accounts data
        const accounts = await fetchAccounts();
        console.log('Accounts data loaded:', accounts);
        
        // Render accounts list and summary
        renderAccounts(accounts);
        renderAccountSummary(accounts);
        
        // Render account type distribution chart
        renderAccountDistribution(accounts);
        
        // Set up events for account operations
        setupAccountEvents();
        
        // Hide loading state
        showLoading(false);
    } catch (error) {
        console.error('Error initializing accounts page:', error);
        showError('Failed to load accounts data. Please try again later.');
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

// Render accounts list
function renderAccounts(accounts) {
    const accountsListContainer = document.getElementById('accounts-table-body');
    
    if (!accountsListContainer) {
        console.error('Accounts table body container not found');
        return;
    }
    
    // Clear existing content
    accountsListContainer.innerHTML = '';
    
    if (!accounts || accounts.length === 0) {
        accountsListContainer.innerHTML = `
            <tr class="no-data-row">
                <td colspan="6" class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No accounts found. Add an account to get started!</p>
                    <button id="add-first-account-btn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Account
                    </button>
                </td>
            </tr>
        `;
        
        // Set up event for the add first account button
        const addFirstAccountBtn = document.getElementById('add-first-account-btn');
        if (addFirstAccountBtn) {
            addFirstAccountBtn.addEventListener('click', function() {
                showAddAccountModal();
            });
        }
        
        return;
    }
    
    // Add account rows to table
    accounts.forEach(account => {
        const accountRow = document.createElement('tr');
        accountRow.dataset.accountId = account.id;
        
        // Ensure account has all required properties
        const accountName = account.name || 'Unnamed Account';
        const accountType = account.type || 'Other';
        const accountBalance = parseFloat(account.balance) || 0;
        const accountCurrency = account.currency || 'USD';
        
        const balanceClass = accountBalance >= 0 ? 'positive' : 'negative';
        const accountTypeClass = accountType.toLowerCase();
        
        accountRow.innerHTML = `
            <td>${accountName}</td>
            <td><span class="account-type ${accountTypeClass}">${accountType}</span></td>
            <td class="${balanceClass}">${formatCurrency(accountBalance)}</td>
            <td>${accountCurrency}</td>
            <td><span class="status-pill active">Active</span></td>
            <td>
                <div class="account-actions">
                    <button class="action-btn view-transactions-btn" data-account-id="${account.id}" title="View Transactions">
                        <i class="fas fa-list"></i>
                    </button>
                    <button class="action-btn edit-account-btn" data-account-id="${account.id}" title="Edit Account">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete action-delete-btn" data-account-id="${account.id}" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        accountsListContainer.appendChild(accountRow);
    });
    
    // Set up action buttons for the newly added accounts
    setupAccountActionButtons();
}

// Render account summary data
function renderAccountSummary(accounts) {
    const totalBalanceElement = document.getElementById('total-balance');
    const totalAssetsElement = document.getElementById('total-assets');
    const totalLiabilitiesElement = document.getElementById('total-liabilities');
    const netWorthElement = document.getElementById('net-worth');
    
    if (!totalBalanceElement || !totalAssetsElement || !totalLiabilitiesElement || !netWorthElement) {
        console.error('One or more summary elements not found');
        return;
    }
    
    // Calculate totals
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    accounts.forEach(account => {
        if (account.balance >= 0) {
            totalAssets += account.balance;
        } else {
            totalLiabilities += Math.abs(account.balance);
        }
    });
    
    const netWorth = totalAssets - totalLiabilities;
    const totalBalance = totalAssets + totalLiabilities;
    
    // Update UI
    totalBalanceElement.textContent = formatCurrency(totalBalance);
    totalAssetsElement.textContent = formatCurrency(totalAssets);
    totalLiabilitiesElement.textContent = formatCurrency(totalLiabilities);
    
    netWorthElement.textContent = formatCurrency(netWorth);
    netWorthElement.classList.toggle('positive', netWorth >= 0);
    netWorthElement.classList.toggle('negative', netWorth < 0);
}

// Render account type distribution chart
function renderAccountDistribution(accounts) {
    const chartContainer = document.getElementById('accounts-distribution-chart');
    if (!chartContainer) {
        console.error('Account chart container not found');
        return;
    }
    
    // If there are no accounts, show a placeholder
    if (!accounts || accounts.length === 0) {
        chartContainer.innerHTML = `
            <div class="empty-chart-message">
                <i class="fas fa-chart-pie"></i>
                <p>Add accounts to see your distribution</p>
            </div>
        `;
        return;
    }
    
    // Ensure the container has the canvas and summary section
    if (!document.getElementById('account-type-chart')) {
        // Clear the container and add the chart canvas and summary section
        chartContainer.innerHTML = `
            <div class="chart-wrapper">
                <canvas id="account-type-chart"></canvas>
            </div>
            <div class="chart-summary"></div>
        `;
    }
    
    const chartCanvas = document.getElementById('account-type-chart');
    if (!chartCanvas) {
        console.error('Account type chart canvas not found');
        return;
    }
    
    // Process account data for the chart
    const accountTypes = {};
    let totalBalance = 0;
    
    // Group all accounts by type, regardless of balance
    accounts.forEach(account => {
        // Use proper type categories with consistent casing
        const type = (account.type || 'Other').charAt(0).toUpperCase() + (account.type || 'Other').slice(1).toLowerCase();
        
        // For chart purposes, we'll use absolute values of balances
        const balance = Math.abs(parseFloat(account.balance) || 0);
        
        // Aggregate by type
        accountTypes[type] = (accountTypes[type] || 0) + balance;
        totalBalance += balance;
    });
    
    // Prepare data for the chart
    const labels = Object.keys(accountTypes);
    const data = Object.values(accountTypes);
    const backgroundColors = generateAccountTypeColors(labels);
    
    // Destroy previous chart if it exists
    if (window.accountTypeChart) {
        window.accountTypeChart.destroy();
    }
    
    // Create the chart
    window.accountTypeChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false  // Hide legend since we'll show it in our custom summary
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalBalance) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Update the summary below the chart
    const summarySection = chartContainer.querySelector('.chart-summary');
    if (summarySection) {
        let summaryHTML = '';
        labels.forEach((label, index) => {
            const value = data[index];
            const percentage = ((value / totalBalance) * 100).toFixed(1);
            const color = backgroundColors[index];
            
            summaryHTML += `
                <div class="chart-summary-item">
                    <span class="color-indicator" style="background-color: ${color}"></span>
                    <span class="type-label">${label}:</span>
                    <span class="type-value">${formatCurrency(value)}</span>
                    <span class="type-percentage">(${percentage}%)</span>
                </div>
            `;
        });
        
        summarySection.innerHTML = summaryHTML;
    }
}

// Generate colors for account types
function generateAccountTypeColors(types) {
    const colorMap = {
        'checking': 'rgba(52, 152, 219, 0.8)',
        'savings': 'rgba(46, 204, 113, 0.8)',
        'credit': 'rgba(231, 76, 60, 0.8)',
        'investment': 'rgba(155, 89, 182, 0.8)',
        'loan': 'rgba(243, 156, 18, 0.8)',
        'other': 'rgba(149, 165, 166, 0.8)'
    };
    
    return types.map(type => {
        const key = type.toLowerCase();
        return colorMap[key] || colorMap['other'];
    });
}

// Set up account events
function setupAccountEvents() {
    console.log('Setting up account events');
    
    // Main Add account button
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', function() {
            showAddAccountModal();
        });
    }
    
    // Small Add account button
    const addAccountSmallBtn = document.getElementById('add-account-small-btn');
    if (addAccountSmallBtn) {
        addAccountSmallBtn.addEventListener('click', function() {
            showAddAccountModal();
        });
    }
    
    // Set up the main account form submission (the one we're actually showing)
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAccount();
        });
    }
    
    // Legacy form submission handlers (kept for backwards compatibility)
    const addAccountForm = document.getElementById('add-account-form');
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAccount();
        });
    }
    
    // Setup cancel button on account form
    const cancelAccountBtn = document.getElementById('cancel-account-btn');
    if (cancelAccountBtn) {
        cancelAccountBtn.addEventListener('click', function() {
            hideModal('account-modal');
        });
    }
    
    // Close buttons for modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });
    
    // Action buttons on accounts
    setupAccountActionButtons();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            event.target.classList.remove('show');
        }
    });
}

// Set up action buttons on account rows
function setupAccountActionButtons() {
    // View transactions
    const viewButtons = document.querySelectorAll('.view-transactions-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.dataset.accountId;
            window.location.href = `/transactions?account=${accountId}`;
        });
    });
    
    // Edit account
    const editButtons = document.querySelectorAll('.edit-account-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.dataset.accountId;
            showEditAccountModal(accountId);
        });
    });
    
    // Delete account
    const deleteButtons = document.querySelectorAll('.action-delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.dataset.accountId;
            if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
                deleteAccount(accountId);
            }
        });
    });
}

// Show add account modal
function showAddAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        // Update the modal title
        const modalTitle = document.getElementById('account-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Account';
        }
        
        // Reset form and hidden ID
        const form = document.getElementById('account-form');
        if (form) {
            form.reset();
        }
        
        // Clear any previous account ID
        const accountIdInput = document.getElementById('account-id');
        if (accountIdInput) {
            accountIdInput.value = '';
        }
        
        // Reset save button text
        const saveButton = document.getElementById('save-account-btn');
        if (saveButton) {
            saveButton.textContent = 'Save Account';
        }
        
        // Display the modal
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Show edit account modal
function showEditAccountModal(accountId) {
    const modal = document.getElementById('account-modal');
    if (modal) {
        // Update the modal title
        const modalTitle = document.getElementById('account-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Account';
        }
        
        // Fetch account details and fill the form
        const accounts = JSON.parse(localStorage.getItem('mockAccounts')) || getMockAccounts();
        const account = accounts.find(a => a.id.toString() === accountId.toString());
        
        if (account) {
            document.getElementById('account-id').value = account.id;
            document.getElementById('account-name').value = account.name;
            document.getElementById('account-type').value = account.type.toLowerCase();
            document.getElementById('account-balance').value = Math.abs(account.balance);
            document.getElementById('account-currency').value = account.currency || 'USD';
            document.getElementById('account-notes').value = account.notes || '';
            
            // Change the save button text to "Update Account"
            const saveButton = document.getElementById('save-account-btn');
            if (saveButton) {
                saveButton.textContent = 'Update Account';
            }
            
            // Display the modal
            modal.style.display = 'flex';
            modal.classList.add('show');
        } else {
            showError('Account not found');
        }
    }
}

// Hide a modal by ID
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Add or update an account
async function addAccount() {
    try {
        const accountForm = document.getElementById('account-form');
        if (!accountForm) {
            console.error('Account form not found');
            return;
        }
        
        const accountId = document.getElementById('account-id').value;
        const name = document.getElementById('account-name').value;
        const type = document.getElementById('account-type').value;
        const balance = parseFloat(document.getElementById('account-balance').value);
        const currency = document.getElementById('account-currency').value;
        const notes = document.getElementById('account-notes').value || '';
        
        if (!name || !type || isNaN(balance)) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Format account type with capitalized first letter
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        
        // Determine if this is an edit or a new account
        const isEdit = accountId && accountId.trim() !== '';
        
        // In development mode, add to mock data
        if (isDevelopment()) {
            const accounts = JSON.parse(localStorage.getItem('mockAccounts')) || getMockAccounts();
            
            if (isEdit) {
                // Update existing account
                const index = accounts.findIndex(a => a.id.toString() === accountId.toString());
                
                if (index !== -1) {
                    accounts[index] = {
                        ...accounts[index],
                        name,
                        type: formattedType,
                        balance: formattedType.toLowerCase() === 'credit' ? -Math.abs(balance) : balance,
                        currency: currency || 'USD',
                        notes
                    };
                } else {
                    showError('Account not found');
                    return;
                }
            } else {
                // Add new account
                const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
                
                const newAccount = {
                    id: newId,
                    name,
                    type: formattedType,
                    balance: formattedType.toLowerCase() === 'credit' ? -Math.abs(balance) : balance,
                    currency: currency || 'USD',
                    notes
                };
                
                accounts.push(newAccount);
            }
            
            // Save updated accounts to localStorage
            localStorage.setItem('mockAccounts', JSON.stringify(accounts));
            
            // Hide modal and refresh the accounts list
            const modal = document.getElementById('account-modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
            
            showSuccess(isEdit ? 'Account updated successfully' : 'Account added successfully');
            initAccountsPage();
            return;
        }
        
        // In production, send to API
        const endpoint = isEdit ? `/api/accounts/${accountId}` : '/api/accounts';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                type: formattedType,
                balance: formattedType.toLowerCase() === 'credit' ? -Math.abs(balance) : balance,
                currency: currency || 'USD',
                notes
            })
        });
        
        if (!response.ok) {
            throw new Error(isEdit ? 'Failed to update account' : 'Failed to add account');
        }
        
        // Hide modal and refresh the accounts list
        const modal = document.getElementById('account-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        
        showSuccess(isEdit ? 'Account updated successfully' : 'Account added successfully');
        initAccountsPage();
    } catch (error) {
        console.error('Error processing account:', error);
        showError(`Failed to ${document.getElementById('account-id').value ? 'update' : 'add'} account. Please try again.`);
    }
}

// Delete an account
async function deleteAccount(accountId) {
    try {
        console.log('Deleting account:', accountId);
        
        // In development mode, remove from mock data
        if (isDevelopment()) {
            const accounts = JSON.parse(localStorage.getItem('mockAccounts')) || getMockAccounts();
            const updatedAccounts = accounts.filter(a => a.id.toString() !== accountId.toString());
            
            localStorage.setItem('mockAccounts', JSON.stringify(updatedAccounts));
            
            showSuccess('Account deleted successfully');
            initAccountsPage();
            return;
        }
        
        // In production, send delete request to API
        const response = await fetch(`/api/accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete account');
        }
        
        showSuccess('Account deleted successfully');
        initAccountsPage();
    } catch (error) {
        console.error('Error deleting account:', error);
        showError('Failed to delete account. Please try again.');
    }
}

// Helper functions

// Get icon for account type
function getAccountTypeIcon(type) {
    switch (type.toLowerCase()) {
        case 'checking':
            return 'fas fa-wallet';
        case 'savings':
            return 'fas fa-piggy-bank';
        case 'credit':
            return 'fas fa-credit-card';
        case 'investment':
            return 'fas fa-chart-line';
        case 'loan':
            return 'fas fa-hand-holding-usd';
        default:
            return 'fas fa-money-bill-alt';
    }
}

// Show error message
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
    }
}

// Show success message
function showSuccess(message) {
    const successContainer = document.getElementById('success-container');
    const successMessage = document.getElementById('success-message');
    
    if (successContainer && successMessage) {
        successMessage.textContent = message;
        successContainer.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 5000);
    }
}

// Show/hide loading state
function showLoading(show) {
    const loadingIndicator = document.getElementById('accounts-loading');
    const accountsContent = document.getElementById('accounts-content');
    
    if (loadingIndicator && accountsContent) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
        accountsContent.style.display = show ? 'none' : 'block';
    } else {
        console.error('Loading indicator or accounts content elements not found');
    }
}

// Get mock account data
function getMockAccounts() {
    return [
        { id: 1, name: 'Checking Account', type: 'Checking', balance: 3500.75, currency: 'USD', notes: 'Primary checking account' },
        { id: 2, name: 'Savings Account', type: 'Savings', balance: 12500.50, currency: 'USD', notes: 'Emergency fund' },
        { id: 3, name: 'Credit Card', type: 'Credit', balance: -450.25, currency: 'USD', notes: 'Cashback rewards card' },
        { id: 4, name: 'Investment Account', type: 'Investment', balance: 28750.00, currency: 'USD', notes: 'Retirement fund' }
    ];
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
} 