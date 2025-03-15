// Transactions.js - Manages the transactions page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the transactions page
    initTransactionsPage();

    // Setup event listeners
    setupEventListeners();
});

// Main initialization function
async function initTransactionsPage() {
    try {
        // Show loading indicator
        setLoading(true);

        // Set default date range (last 30 days)
        setDefaultDateRange();
        
        // Fetch and populate accounts for filters
        await fetchAndPopulateAccounts();
        
        // Fetch and populate categories for filters
        await fetchAndPopulateCategories();
        
        // Fetch transactions (initial load)
        await fetchTransactions();
        
    } catch (error) {
        console.error('Error initializing transactions page:', error);
        showError('Failed to initialize transactions page. Please try again later.');
    } finally {
        // Hide loading indicator
        setLoading(false);
    }
}

// Setup all event listeners for the transactions page
function setupEventListeners() {
    // Add transaction button
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => showTransactionModal());
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => fetchTransactions());
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage('prev'));
        nextPageBtn.addEventListener('click', () => changePage('next'));
    }
    
    // Transaction modal
    const transactionModal = document.getElementById('transaction-modal');
    const closeModal = transactionModal?.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-transaction-btn');
    
    if (closeModal) {
        closeModal.addEventListener('click', hideTransactionModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideTransactionModal);
    }
    
    // Transaction form submission
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    
    // Transaction type selector
    const transactionTypeRadios = document.querySelectorAll('input[name="transaction-type"]');
    if (transactionTypeRadios.length) {
        transactionTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleTransactionTypeChange);
        });
    }
}

// Set default date range (last 30 days)
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startDateInput = document.getElementById('date-range-start');
    const endDateInput = document.getElementById('date-range-end');
    
    if (startDateInput && endDateInput) {
        startDateInput.valueAsDate = startDate;
        endDateInput.valueAsDate = endDate;
    }
}

// Fetch accounts from API and populate account dropdowns
async function fetchAndPopulateAccounts() {
    try {
        // In a real app, fetch accounts from API
        // const response = await fetch('/api/accounts');
        // const accounts = await response.json();
        
        // For mock purposes
        const accounts = getMockAccounts();
        
        populateAccountDropdowns(accounts);
        
    } catch (error) {
        console.error('Error fetching accounts:', error);
        showError('Failed to load accounts. Some features may be limited.');
    }
}

// Populate account dropdowns with fetched accounts
function populateAccountDropdowns(accounts) {
    const accountFilter = document.getElementById('account-filter');
    const transactionAccount = document.getElementById('transaction-account');
    const transferToAccount = document.getElementById('transaction-transfer-to');
    
    if (accountFilter) {
        accountFilter.innerHTML = '<option value="">All Accounts</option>';
        accounts.forEach(account => {
            accountFilter.innerHTML += `<option value="${account.id}">${account.name}</option>`;
        });
    }
    
    if (transactionAccount) {
        transactionAccount.innerHTML = '';
        accounts.forEach(account => {
            transactionAccount.innerHTML += `<option value="${account.id}">${account.name} (${formatCurrency(account.balance)})</option>`;
        });
    }
    
    if (transferToAccount) {
        transferToAccount.innerHTML = '';
        accounts.forEach(account => {
            transferToAccount.innerHTML += `<option value="${account.id}">${account.name} (${formatCurrency(account.balance)})</option>`;
        });
    }
}

// Fetch categories from API and populate category dropdowns
async function fetchAndPopulateCategories() {
    try {
        // In a real app, fetch categories from API
        // const response = await fetch('/api/categories');
        // const categories = await response.json();
        
        // For mock purposes
        const categories = getMockCategories();
        
        populateCategoryDropdowns(categories);
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        showError('Failed to load categories. Some features may be limited.');
    }
}

// Populate category dropdowns with fetched categories
function populateCategoryDropdowns(categories) {
    const categoryFilter = document.getElementById('category-filter');
    const transactionCategory = document.getElementById('transaction-category');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        // Group categories by type
        const expenseCategories = categories.filter(cat => cat.type === 'expense');
        const incomeCategories = categories.filter(cat => cat.type === 'income');
        
        // Add expense categories
        if (expenseCategories.length) {
            const expenseGroup = document.createElement('optgroup');
            expenseGroup.label = 'Expenses';
            
            expenseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                expenseGroup.appendChild(option);
            });
            
            categoryFilter.appendChild(expenseGroup);
        }
        
        // Add income categories
        if (incomeCategories.length) {
            const incomeGroup = document.createElement('optgroup');
            incomeGroup.label = 'Income';
            
            incomeCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                incomeGroup.appendChild(option);
            });
            
            categoryFilter.appendChild(incomeGroup);
        }
    }
    
    if (transactionCategory) {
        transactionCategory.innerHTML = '';
        
        // Group categories by type
        const expenseCategories = categories.filter(cat => cat.type === 'expense');
        const incomeCategories = categories.filter(cat => cat.type === 'income');
        
        // Add expense categories
        if (expenseCategories.length) {
            const expenseGroup = document.createElement('optgroup');
            expenseGroup.label = 'Expenses';
            
            expenseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                expenseGroup.appendChild(option);
            });
            
            transactionCategory.appendChild(expenseGroup);
        }
        
        // Add income categories
        if (incomeCategories.length) {
            const incomeGroup = document.createElement('optgroup');
            incomeGroup.label = 'Income';
            
            incomeCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                incomeGroup.appendChild(option);
            });
            
            transactionCategory.appendChild(incomeGroup);
        }
    }
}

// Fetch transactions based on filters
async function fetchTransactions(page = 1) {
    try {
        setLoading(true);
        
        // Get filter values
        const accountFilter = document.getElementById('account-filter')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const startDate = document.getElementById('date-range-start')?.value || '';
        const endDate = document.getElementById('date-range-end')?.value || '';
        
        // In a real app, fetch transactions from API with filters
        // const response = await fetch(`/api/transactions?account=${accountFilter}&category=${categoryFilter}&start_date=${startDate}&end_date=${endDate}&page=${page}`);
        // const data = await response.json();
        
        // For mock purposes
        const data = getMockTransactionsData(accountFilter, categoryFilter, startDate, endDate, page);
        
        // Update transactions table
        renderTransactions(data.transactions);
        
        // Update pagination
        updatePagination(data.pagination);
        
        // Update summary
        updateTransactionsSummary(data.summary);
        
        // Show transactions content
        document.getElementById('transactions-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showError('Failed to load transactions. Please try again later.');
    } finally {
        setLoading(false);
    }
}

// Render transactions in the table
function renderTransactions(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    if (!tableBody) {
        console.error('Transactions table body not found');
        return;
    }
    
    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `
            <tr class="no-data">
                <td colspan="6" class="no-data-message">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No transactions found. Try adjusting your filters or add a new transaction.</p>
                    <button id="add-first-transaction-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Transaction
                    </button>
                </td>
            </tr>`;
            
        // Set up event for the add first transaction button
        const addFirstTransactionBtn = document.getElementById('add-first-transaction-btn');
        if (addFirstTransactionBtn) {
            addFirstTransactionBtn.addEventListener('click', function() {
                showTransactionModal();
            });
        }
        
        return;
    }
    
    let html = '';
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
        
        html += `
            <tr data-id="${transaction.id}">
                <td>${date}</td>
                <td>${transaction.description}</td>
                <td><span class="account-name">${transaction.account}</span></td>
                <td><span class="category-name">${transaction.category}</span></td>
                <td class="${amountClass}">${formatCurrency(transaction.amount)}</td>
                <td class="actions">
                    <button class="btn-icon edit-transaction" title="Edit Transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete btn-icon-delete" title="Delete Transaction">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to the edit and delete buttons
    const editButtons = tableBody.querySelectorAll('.edit-transaction');
    const deleteButtons = tableBody.querySelectorAll('.btn-icon-delete');
    
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = getTransactionIdFromButton(e.target);
            editTransaction(transactionId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = getTransactionIdFromButton(e.target);
            deleteTransaction(transactionId);
        });
    });
}

// Helper function to get transaction ID from button click
function getTransactionIdFromButton(target) {
    const row = target.closest('tr');
    return row ? row.dataset.id : null;
}

// Update pagination information and button states
function updatePagination(pagination) {
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        // Store current page in a data attribute for easier access
        pageInfo.dataset.currentPage = pagination.currentPage;
        pageInfo.dataset.totalPages = pagination.totalPages;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = pagination.currentPage <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = pagination.currentPage >= pagination.totalPages;
    }
}

// Change the current page
function changePage(direction) {
    const pageInfo = document.getElementById('page-info');
    if (!pageInfo) return;
    
    // Get page info from data attributes instead of parsing text
    const currentPage = parseInt(pageInfo.dataset.currentPage || 1);
    const totalPages = parseInt(pageInfo.dataset.totalPages || 1);
    
    let newPage = currentPage;
    
    if (direction === 'prev' && currentPage > 1) {
        newPage = currentPage - 1;
    } else if (direction === 'next' && currentPage < totalPages) {
        newPage = currentPage + 1;
    }
    
    if (newPage !== currentPage) {
        fetchTransactions(newPage);
    }
}

// Update the transactions summary section
function updateTransactionsSummary(summary) {
    document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(summary.totalExpenses);
    document.getElementById('net-change').textContent = formatCurrency(summary.netChange);
    document.getElementById('avg-transaction').textContent = formatCurrency(summary.avgTransaction);
    
    // Apply appropriate class to net change (positive or negative)
    const netChangeEl = document.getElementById('net-change');
    if (netChangeEl) {
        netChangeEl.className = summary.netChange >= 0 ? 'card-value positive' : 'card-value negative';
    }
}

// Show transaction modal for adding a new transaction
function showTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (!modal) {
        console.error('Transaction modal not found');
        return;
    }
    
    // Reset the form
    const form = document.getElementById('transaction-form');
    if (form) {
        form.reset();
    }
    
    // Set default values
    const dateInput = document.getElementById('transaction-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0]; // Today's date
    }
    
    // Set expense as default transaction type
    const expenseRadio = document.getElementById('transaction-type-expense');
    if (expenseRadio) {
        expenseRadio.checked = true;
    }
    
    // Update form appearance based on type selection
    handleTransactionTypeChange();
    
    // Set the modal title for adding
    const modalTitle = document.getElementById('transaction-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add Transaction';
    }
    
    // Display the modal
    modal.style.display = 'flex';
}

// Show modal for editing an existing transaction
function editTransaction(transactionId) {
    if (!transactionId) {
        console.error('No transaction ID provided for editing');
        return;
    }
    
    const transaction = getMockTransactionById(transactionId);
    if (!transaction) {
        showError('Transaction not found');
        return;
    }
    
    // Get modal elements
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('transaction-modal-title');
    const form = document.getElementById('transaction-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Required modal elements not found');
        return;
    }
    
    // Set modal title
    modalTitle.textContent = 'Edit Transaction';
    
    // Populate form with transaction data
    // Add a hidden field for transaction ID if it doesn't exist
    let transactionIdField = document.getElementById('transaction-id');
    if (!transactionIdField) {
        transactionIdField = document.createElement('input');
        transactionIdField.type = 'hidden';
        transactionIdField.id = 'transaction-id';
        form.appendChild(transactionIdField);
    }
    transactionIdField.value = transaction.id;
    
    // Set field values
    document.getElementById('transaction-date').value = transaction.date;
    document.getElementById('transaction-description').value = transaction.description;
    document.getElementById('transaction-amount').value = Math.abs(transaction.amount).toFixed(2);
    
    // Set transaction type
    if (transaction.amount > 0) {
        document.getElementById('transaction-type-income').checked = true;
    } else {
        document.getElementById('transaction-type-expense').checked = true;
    }
    
    // Account and category
    const accountSelect = document.getElementById('transaction-account');
    const categorySelect = document.getElementById('transaction-category');
    
    if (accountSelect) {
        // Find the option matching the account ID
        for (let i = 0; i < accountSelect.options.length; i++) {
            if (accountSelect.options[i].value == transaction.accountId) {
                accountSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    if (categorySelect) {
        // Find the option matching the category ID
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value == transaction.categoryId) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Update form appearance based on type selection
    handleTransactionTypeChange();
    
    // Show the modal
    modal.style.display = 'flex';
}

// Handle transaction type change
function handleTransactionTypeChange() {
    const transactionType = document.querySelector('input[name="transaction-type"]:checked')?.value;
    const transferToContainer = document.getElementById('transfer-to-container');
    const categoryContainer = document.getElementById('category-container');
    
    if (!transferToContainer || !categoryContainer) {
        console.error('Transaction type containers not found');
        return;
    }
    
    if (transactionType === 'transfer') {
        transferToContainer.style.display = 'block';
        categoryContainer.style.display = 'none';
        
        // Make transfer-to required only for transfers
        const transferToSelect = document.getElementById('transaction-transfer-to');
        if (transferToSelect) {
            transferToSelect.required = true;
        }
    } else {
        transferToContainer.style.display = 'none';
        categoryContainer.style.display = 'block';
        
        // Not required for non-transfers
        const transferToSelect = document.getElementById('transaction-transfer-to');
        if (transferToSelect) {
            transferToSelect.required = false;
        }
    }
}

// Handle form submission
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    try {
        // Get form values
        const transactionId = document.getElementById('transaction-id')?.value;
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const amountRaw = document.getElementById('transaction-amount').value;
        const amount = parseFloat(amountRaw);
        const type = document.querySelector('input[name="transaction-type"]:checked').value;
        const accountId = parseInt(document.getElementById('transaction-account').value);
        let categoryId = null;
        
        if (type === 'transfer') {
            const transferToId = document.getElementById('transaction-transfer-to').value;
            if (transferToId === accountId) {
                showError('Transfer source and destination accounts cannot be the same');
                return;
            }
            categoryId = 'transfer'; // Special category for transfers
        } else {
            categoryId = parseInt(document.getElementById('transaction-category').value);
        }
        
        // Validate inputs
        if (!date || !description || isNaN(amount) || amount <= 0 || !accountId) {
            showError('Please fill in all required fields with valid values');
            return;
        }
        
        // Adjust sign based on transaction type
        const finalAmount = type === 'expense' ? -amount : amount;
        
        // Find account and category details
        const accounts = getMockAccounts();
        const categories = getMockCategories();
        const account = accounts.find(a => a.id === accountId);
        const category = categories.find(c => c.id === categoryId) || { name: 'Transfer' };
        
        if (!account) {
            showError('Selected account not found');
            return;
        }
        
        // Create transaction object
        const transactionData = {
            id: transactionId ? parseInt(transactionId) : Date.now(), // Use timestamp as ID for new transactions
            date,
            description,
            amount: finalAmount,
            accountId,
            account: account.name,
            categoryId,
            category: category.name,
            notes: document.getElementById('transaction-notes')?.value || ''
        };
        
        // In development mode, save to localStorage
        if (isDevelopment()) {
            // Get existing mock transactions if any
            let mockTransactions = [];
            try {
                const savedTransactions = localStorage.getItem('mockTransactions');
                if (savedTransactions) {
                    mockTransactions = JSON.parse(savedTransactions);
                }
            } catch (err) {
                console.error('Error parsing stored transactions:', err);
            }
            
            if (transactionId) {
                // Update existing transaction
                const index = mockTransactions.findIndex(t => t.id.toString() === transactionId.toString());
                if (index !== -1) {
                    mockTransactions[index] = transactionData;
                } else {
                    // If not found, add as new
                    mockTransactions.push(transactionData);
                }
            } else {
                // Add new transaction
                mockTransactions.push(transactionData);
            }
            
            // Save back to localStorage
            localStorage.setItem('mockTransactions', JSON.stringify(mockTransactions));
            
            // Update account balance
            if (account) {
                account.balance += finalAmount;
                
                // Update accounts in localStorage
                const updatedAccounts = accounts.map(a => {
                    if (a.id === accountId) {
                        return { ...a, balance: a.balance + finalAmount };
                    }
                    return a;
                });
                
                localStorage.setItem('mockAccounts', JSON.stringify(updatedAccounts));
            }
        } else {
            // In production, send to API
            if (transactionId) {
                // Update existing transaction
                console.log('Updating transaction:', transactionId, transactionData);
                // await fetch(`/api/transactions/${transactionId}`, {
                //   method: 'PUT',
                //   headers: {
                //     'Authorization': `Bearer ${getAuthToken()}`,
                //     'Content-Type': 'application/json'
                //   },
                //   body: JSON.stringify(transactionData)
                // });
            } else {
                // Add new transaction
                console.log('Adding new transaction:', transactionData);
                // await fetch('/api/transactions', {
                //   method: 'POST',
                //   headers: {
                //     'Authorization': `Bearer ${getAuthToken()}`,
                //     'Content-Type': 'application/json'
                //   },
                //   body: JSON.stringify(transactionData)
                // });
            }
        }
        
        // Show success message
        showSuccess(`Transaction ${transactionId ? 'updated' : 'added'} successfully`);
        
        // Hide modal
        hideTransactionModal();
        
        // Refresh transactions list and accounts data
        await fetchAndPopulateAccounts(); // Refresh account data
        fetchTransactions(); // Refresh transactions list
    } catch (error) {
        console.error('Error submitting transaction:', error);
        showError('Failed to save transaction. Please try again.');
    }
}

// Hide transaction modal
function hideTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset the form
        const form = document.getElementById('transaction-form');
        if (form) {
            form.reset();
        }
        
        // Remove any temporary hidden fields
        const transactionIdField = document.getElementById('transaction-id');
        if (transactionIdField) {
            transactionIdField.remove();
        }
    }
}

// Edit transaction
function editTransaction(transactionId) {
    // Show transaction modal with transaction data
    showTransactionModal(transactionId);
}

// Delete transaction
function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }
    
    try {
        // In a real app, delete transaction from API
        // await deleteTransactionFromAPI(transactionId);
        
        // For mock purposes
        console.log('Deleting transaction:', transactionId);
        
        // Show success message
        showSuccess('Transaction deleted successfully');
        
        // Refresh transactions list
        fetchTransactions();
        
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Failed to delete transaction. Please try again later.');
    }
}

// Set loading state
function setLoading(isLoading) {
    const loader = document.getElementById('transactions-loading');
    const content = document.getElementById('transactions-content');
    
    if (!loader || !content) {
        console.error('Loading indicator or content elements not found!');
        return;
    }
    
    loader.style.display = isLoading ? 'flex' : 'none';
    content.style.display = isLoading ? 'none' : 'block';
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        console.error('Error container not found!');
        return;
    }
    
    const errorMessageEl = document.getElementById('error-message');
    if (errorMessageEl) {
        errorMessageEl.textContent = message;
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
    if (!successContainer) {
        console.error('Success container not found!');
        return;
    }
    
    const successMessageEl = document.getElementById('success-message');
    if (successMessageEl) {
        successMessageEl.textContent = message;
        successContainer.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 3000);
    }
}

// Format currency
function formatCurrency(amount) {
    return '$' + Math.abs(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Mock data functions for development purposes
function getMockAccounts() {
    // Try to get accounts from localStorage first (shared across all pages)
    const cachedAccounts = localStorage.getItem('mockAccounts');
    if (cachedAccounts) {
        try {
            return JSON.parse(cachedAccounts);
        } catch (e) {
            console.error('Error parsing cached accounts:', e);
        }
    }
    
    // Fallback to default accounts if nothing in localStorage
    return [
        { id: 1, name: 'Checking Account', balance: 2547.32 },
        { id: 2, name: 'Savings Account', balance: 15280.65 },
        { id: 3, name: 'Credit Card', balance: -423.18 },
        { id: 4, name: 'Investment Account', balance: 8432.50 }
    ];
}

function getMockCategories() {
    return [
        // Expense categories
        { id: 1, name: 'Housing', type: 'expense' },
        { id: 2, name: 'Groceries', type: 'expense' },
        { id: 3, name: 'Dining Out', type: 'expense' },
        { id: 4, name: 'Transportation', type: 'expense' },
        { id: 5, name: 'Utilities', type: 'expense' },
        { id: 6, name: 'Entertainment', type: 'expense' },
        { id: 7, name: 'Healthcare', type: 'expense' },
        { id: 8, name: 'Shopping', type: 'expense' },
        { id: 9, name: 'Personal Care', type: 'expense' },
        { id: 10, name: 'Education', type: 'expense' },
        { id: 11, name: 'Travel', type: 'expense' },
        { id: 12, name: 'Gifts & Donations', type: 'expense' },
        { id: 13, name: 'Insurance', type: 'expense' },
        { id: 14, name: 'Taxes', type: 'expense' },
        { id: 15, name: 'Miscellaneous', type: 'expense' },
        
        // Income categories
        { id: 101, name: 'Salary', type: 'income' },
        { id: 102, name: 'Freelance', type: 'income' },
        { id: 103, name: 'Investments', type: 'income' },
        { id: 104, name: 'Gifts', type: 'income' },
        { id: 105, name: 'Refunds', type: 'income' },
        { id: 106, name: 'Other Income', type: 'income' }
    ];
}

function getMockTransactionsData(accountFilter = '', categoryFilter = '', startDate = '', endDate = '', page = 1) {
    let allTransactions = [];
    
    // Try to get transactions from localStorage first
    try {
        const savedTransactions = localStorage.getItem('mockTransactions');
        if (savedTransactions) {
            allTransactions = JSON.parse(savedTransactions);
        }
    } catch (err) {
        console.error('Error parsing stored transactions:', err);
    }
    
    // If no transactions in localStorage, generate sample data
    if (!allTransactions || allTransactions.length === 0) {
        // Generate 50 mock transactions
        const accounts = getMockAccounts();
        const categories = getMockCategories();
        
        // Create dates for last 60 days
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 60; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date.toISOString().substring(0, 10)); // Format as YYYY-MM-DD
        }
        
        // Transactions data
        for (let i = 1; i <= 50; i++) {
            const isIncome = Math.random() > 0.7; // 30% chance of income
            const amount = isIncome ? 
                (Math.random() * 1000 + 500).toFixed(2) : 
                -(Math.random() * 200 + 10).toFixed(2);
                
            const accountIndex = Math.floor(Math.random() * accounts.length);
            const account = accounts[accountIndex];
            
            // Select appropriate category based on transaction type
            let category;
            if (isIncome) {
                const incomeCategories = categories.filter(cat => cat.type === 'income');
                const categoryIndex = Math.floor(Math.random() * incomeCategories.length);
                category = incomeCategories[categoryIndex];
            } else {
                const expenseCategories = categories.filter(cat => cat.type === 'expense');
                const categoryIndex = Math.floor(Math.random() * expenseCategories.length);
                category = expenseCategories[categoryIndex];
            }
            
            const dateIndex = Math.floor(Math.random() * dates.length);
            const date = dates[dateIndex];
            
            // Transaction descriptions based on categories
            let description;
            if (isIncome) {
                if (category.name === 'Salary') {
                    description = 'Monthly Salary';
                } else if (category.name === 'Freelance') {
                    description = 'Freelance Project Payment';
                } else if (category.name === 'Investments') {
                    description = 'Dividend Payment';
                } else {
                    description = `${category.name} Income`;
                }
            } else {
                if (category.name === 'Housing') {
                    description = 'Rent Payment';
                } else if (category.name === 'Groceries') {
                    description = 'Grocery Shopping';
                } else if (category.name === 'Dining Out') {
                    description = 'Restaurant Payment';
                } else if (category.name === 'Transportation') {
                    description = 'Gas Station';
                } else if (category.name === 'Utilities') {
                    description = 'Electric Bill';
                } else if (category.name === 'Entertainment') {
                    description = 'Movie Tickets';
                } else {
                    description = `${category.name} Expense`;
                }
            }
            
            allTransactions.push({
                id: i,
                date: date,
                description: description,
                amount: parseFloat(amount),
                account: account.name,
                accountId: account.id,
                category: category.name,
                categoryId: category.id,
                notes: ''
            });
        }
        
        // Save generated transactions to localStorage
        localStorage.setItem('mockTransactions', JSON.stringify(allTransactions));
    }
    
    // Apply filters
    let filteredTransactions = [...allTransactions];
    
    if (accountFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.accountId == accountFilter);
    }
    
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.categoryId == categoryFilter);
    }
    
    if (startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
    }
    
    if (endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const itemsPerPage = 10;
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPage = Math.min(page, totalPages) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Calculate summary
    const totalIncome = filteredTransactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
    const totalExpenses = filteredTransactions.reduce((sum, t) => t.amount < 0 ? sum + t.amount : sum, 0);
    const netChange = totalIncome + totalExpenses;
    const avgTransaction = totalItems > 0 ? (totalIncome + totalExpenses) / totalItems : 0;
    
    return {
        transactions: paginatedTransactions,
        pagination: {
            currentPage,
            totalPages,
            totalItems
        },
        summary: {
            totalIncome,
            totalExpenses,
            netChange,
            avgTransaction
        }
    };
}

function getMockTransactionById(id) {
    try {
        const savedTransactions = localStorage.getItem('mockTransactions');
        if (savedTransactions) {
            const transactions = JSON.parse(savedTransactions);
            return transactions.find(t => t.id.toString() === id.toString());
        }
    } catch (err) {
        console.error('Error getting transaction by ID:', err);
    }
    
    // Fallback to generated mock data if nothing in localStorage
    const mockData = getMockTransactionsData();
    return mockData.transactions.find(t => t.id.toString() === id.toString());
}

// Use isDevelopment from main.js instead of redefining it
// function isDevelopment() {
//     return true;
// } 