// Budgets.js - Budgets page functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Budgets script loaded');
    
    // Make sure we are on the budgets page
    if (!document.getElementById('budgets-container')) {
        console.log('Not on budgets page, exiting budgets script');
        return;
    }
    
    // Initialize the budgets page
    initBudgetsPage();
});

async function initBudgetsPage() {
    console.log('Initializing budgets page');
    
    try {
        // Show loading state
        setLoading(true);
        
        // Get budgets data
        const [categories, currentBudget] = await Promise.all([
            fetchCategories(),
            fetchCurrentBudget()
        ]);
        
        console.log('Budgets data loaded:', { categories, currentBudget });
        
        // Update budget selector with available budgets
        updateBudgetSelector();
        
        // Render budgets components
        renderBudgetOverview(currentBudget);
        renderBudgetCategories(categories, currentBudget);
        renderBudgetChart(categories, currentBudget);
        
        // Set up events for budget operations
        setupBudgetEvents();
        
        // Hide loading state
        setLoading(false);
        
        // Show success message
        showSuccess('Budget data loaded successfully!');
    } catch (error) {
        console.error('Error initializing budgets page:', error);
        showError('Failed to load budgets data. Please try again later.');
        
        // Hide loading and show content even if there's an error
        // This allows users to see the error message
        setLoading(false);
        
        // Try to render any partial data that might be available
        const mockCategories = getMockCategories();
        const mockBudget = getMockBudget();
        
        // Update budget selector with available budgets
        updateBudgetSelector();
        
        renderBudgetOverview(mockBudget);
        renderBudgetCategories(mockCategories, mockBudget);
        renderBudgetChart(mockCategories, mockBudget);
        
        // Set up events for budget operations
        setupBudgetEvents();
    }
}

// FETCH FUNCTIONS

async function fetchCategories() {
    console.log('Fetching categories');
    
    try {
        // Always use mock data in development mode to prevent loading issues
        if (isDevelopment()) {
            console.log('Using mock categories data in development mode');
            return getMockCategories();
        }
        
        const response = await fetch('/api/categories', {
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
        return data.categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        
        // If we're in development mode, return mock data
        if (isDevelopment()) {
            console.log('Using mock categories data due to error');
            return getMockCategories();
        }
        
        throw error;
    }
}

async function fetchCurrentBudget() {
    console.log('Fetching current budget');
    
    try {
        // Always use mock data in development mode to prevent loading issues
        if (isDevelopment()) {
            console.log('Using mock budget data in development mode');
            return getMockBudget();
        }
        
        const response = await fetch('/api/budgets/current', {
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
        return data.budget;
    } catch (error) {
        console.error('Error fetching current budget:', error);
        
        // If we're in development mode, return mock data
        if (isDevelopment()) {
            console.log('Using mock budget data due to error');
            return getMockBudget();
        }
        
        throw error;
    }
}

// RENDER FUNCTIONS

function renderBudgetOverview(budget) {
    const overviewContainer = document.querySelector('.current-budget-overview');
    const totalBudgetElement = document.getElementById('total-budget');
    const totalSpentElement = document.getElementById('total-spent');
    const remainingBudgetElement = document.getElementById('remaining-budget');
    const budgetProgressElement = document.getElementById('budget-progress');
    
    if (!overviewContainer) {
        console.error('Budget overview container not found');
        return;
    }
    
    const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const remainingAmount = totalBudgeted - totalSpent;
    const percentSpent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    // Update budget values
    if (totalBudgetElement) {
        totalBudgetElement.textContent = formatCurrency(totalBudgeted);
    }
    
    if (totalSpentElement) {
        totalSpentElement.textContent = formatCurrency(totalSpent);
        totalSpentElement.className = 'card-value ' + (totalSpent > totalBudgeted ? 'negative' : '');
    }
    
    if (remainingBudgetElement) {
        remainingBudgetElement.textContent = formatCurrency(remainingAmount);
        remainingBudgetElement.className = 'card-value ' + (remainingAmount < 0 ? 'negative' : 'positive');
    }
    
    // Update progress bar
    if (budgetProgressElement) {
        const progressBar = budgetProgressElement.querySelector('.progress-bar');
        const progressText = budgetProgressElement.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = Math.min(percentSpent, 100) + '%';
            
            // Set color based on percentage
            if (percentSpent > 100) {
                progressBar.className = 'progress-bar over-budget';
            } else if (percentSpent > 80) {
                progressBar.className = 'progress-bar warning';
            } else {
                progressBar.className = 'progress-bar good';
            }
        }
        
        if (progressText) {
            progressText.textContent = percentSpent.toFixed(1) + '%';
        }
    }
}

function renderBudgetCategories(categories, budget) {
    const categoriesContainer = document.getElementById('categories-list');
    
    if (!categoriesContainer) {
        console.error('Budget categories container not found');
        return;
    }
    
    // Clear the loading placeholder and any existing content
    categoriesContainer.innerHTML = '';
    
    if (!budget.categories || budget.categories.length === 0) {
        categoriesContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-folder-open"></i>
                <p>No budget categories found. Add categories to your budget to get started!</p>
                <button id="add-category-btn" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Category
                </button>
            </div>
        `;
        
        return;
    }
    
    // Sort categories by amount (highest to lowest)
    const sortedCategories = [...budget.categories].sort((a, b) => b.amount - a.amount);
    
    // Create category cards
    const categoryCards = document.createElement('div');
    categoryCards.className = 'category-cards';
    
    sortedCategories.forEach(budgetCategory => {
        // Make sure we have the category_id (convert from id if necessary)
        const categoryId = budgetCategory.category_id || budgetCategory.id;
        
        const category = categories.find(c => c.id == categoryId) || { name: 'Unknown', icon: 'question-circle' };
        
        const percentSpent = budgetCategory.amount > 0 ? (budgetCategory.spent / budgetCategory.amount) * 100 : 0;
        const statusClass = percentSpent > 100 ? 'over-budget' : (percentSpent > 80 ? 'warning' : 'good');
        
        const categoryCard = document.createElement('div');
        categoryCard.className = `category-card ${statusClass}`;
        categoryCard.dataset.categoryId = categoryId;
        
        categoryCard.innerHTML = `
            <div class="category-header">
                <div class="category-icon">
                    <i class="fas fa-${category.icon || 'tag'}"></i>
                </div>
                <div class="category-details">
                    <h3>${category.name}</h3>
                    <div class="category-budget">
                        <span class="spent">${formatCurrency(budgetCategory.spent || 0)}</span>
                        <span class="separator">/</span>
                        <span class="amount">${formatCurrency(budgetCategory.amount || 0)}</span>
                    </div>
                </div>
            </div>
            <div class="category-progress" style="margin-bottom: 10px;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentSpent, 100)}%;"></div>
                </div>
                <div class="progress-label">
                    <span>${percentSpent.toFixed(1)}%</span>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn btn-sm btn-secondary edit-category-btn" data-category-id="${categoryId}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        
        categoryCards.appendChild(categoryCard);
    });
    
    // Add "Add Category" button
    const addButton = document.createElement('div');
    addButton.className = 'add-category-button';
    addButton.innerHTML = `
        <button id="add-category-btn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Category
        </button>
    `;
    
    // Create a container to hold both the category cards and add button
    const containerDiv = document.createElement('div');
    containerDiv.appendChild(categoryCards);
    containerDiv.appendChild(addButton);
    
    categoriesContainer.appendChild(containerDiv);
    
    // Add event listeners
    setupCategoryCardEvents(categories, budget);
}

function renderBudgetChart(categories, budget) {
    const chartContainer = document.getElementById('budget-chart-container');
    const chartCanvas = document.getElementById('budget-chart');
    
    if (!chartContainer || !chartCanvas) {
        console.error('Budget chart container or canvas not found');
        return;
    }
    
    if (!budget.categories || budget.categories.length === 0) {
        chartContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-chart-pie"></i>
                <p>Add budget categories to see a visual breakdown of your budget.</p>
            </div>
        `;
        return;
    }
    
    // Prepare chart data
    const chartLabels = [];
    const budgetedAmounts = [];
    const actualAmounts = [];
    
    // Get top 5 categories by budget amount
    const topCategories = [...budget.categories]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    
    topCategories.forEach(budgetCategory => {
        const category = categories.find(c => c.id === budgetCategory.category_id) || { name: 'Unknown' };
        chartLabels.push(category.name);
        budgetedAmounts.push(budgetCategory.amount);
        actualAmounts.push(budgetCategory.spent);
    });
    
    // Create chart
    if (window.budgetChart) {
        window.budgetChart.destroy();
    }
    
    window.budgetChart = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Budgeted',
                    data: budgetedAmounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Actual',
                    data: actualAmounts,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// EVENTS

function setupBudgetEvents() {
    // Create Budget button
    const createBudgetBtn = document.getElementById('create-budget-btn');
    if (createBudgetBtn) {
        createBudgetBtn.addEventListener('click', function() {
            // Get categories for the budget modal
            const categories = getMockCategories();
            showCreateBudgetModal(categories);
        });
    }
    
    // Add Category button (in the categories section)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'add-category-btn' || 
            (e.target.parentElement && e.target.parentElement.id === 'add-category-btn')) {
            // Get all data needed for the modal
            const categories = getMockCategories();
            const budget = getMockBudget();
            showAddCategoryModal(categories, budget);
        }
    });
    
    // Manage Categories button
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', function() {
            // Get categories for the manage categories modal
            const categories = getMockCategories();
            showManageCategoriesModal(categories);
        });
    }
    
    // Budget Period Select
    const budgetPeriodSelect = document.getElementById('budget-period-select');
    if (budgetPeriodSelect) {
        budgetPeriodSelect.addEventListener('change', function() {
            const period = this.value;
            updateBudgetPeriod(period);
        });
    }
    
    // Chart Period Buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.dataset.period;
            updateChartPeriod(period);
            
            // Update active class
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Setup modal actions
    setupBudgetModalEvents();
}

function setupCategoryCardEvents(categories, budget) {
    // Edit category buttons
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.dataset.categoryId;
            showEditCategoryModal(categoryId, categories, budget);
        });
    });
}

function setupBudgetModalEvents() {
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            hideModal(modalId);
        });
    });
    
    // Budget form submission
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBudgetFormSubmit();
        });
    }
    
    // Add category to budget form button
    const addCategoryToFormBtn = document.querySelector('#budget-modal #add-category-btn');
    if (addCategoryToFormBtn) {
        addCategoryToFormBtn.addEventListener('click', function() {
            addCategoryToBudgetForm();
        });
    }
    
    // Cancel budget button
    const cancelBudgetBtn = document.getElementById('cancel-budget-btn');
    if (cancelBudgetBtn) {
        cancelBudgetBtn.addEventListener('click', function() {
            hideModal('budget-modal');
        });
    }
    
    // Add new category in manage categories modal
    const addNewCategoryBtn = document.getElementById('add-new-category-btn');
    if (addNewCategoryBtn) {
        addNewCategoryBtn.addEventListener('click', function() {
            addNewCategory();
        });
    }
    
    // Close categories modal
    const closeCategoriesBtn = document.getElementById('close-categories-btn');
    if (closeCategoriesBtn) {
        closeCategoriesBtn.addEventListener('click', function() {
            hideModal('categories-modal');
        });
    }
}

// Modal handlers

function showCreateBudgetModal(categories) {
    // Reset form
    const form = document.getElementById('budget-form');
    form.reset();
    
    // Set modal title
    document.getElementById('budget-modal-title').textContent = 'Create New Budget';
    
    // Set default month to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('budget-month').value = `${year}-${month}`;
    
    // Clear existing categories
    const categoriesContainer = document.getElementById('budget-categories-container');
    categoriesContainer.innerHTML = '';
    
    // Add a budget name field if it doesn't exist
    if (!document.getElementById('budget-name-field')) {
        const budgetNameField = document.createElement('div');
        budgetNameField.className = 'form-group';
        budgetNameField.id = 'budget-name-field';
        
        budgetNameField.innerHTML = `
            <label for="budget-name">Budget Name</label>
            <input type="text" id="budget-name" placeholder="Enter budget name" required>
        `;
        
        // Insert the name field before the month field
        const monthField = document.querySelector('#budget-form .form-group');
        form.insertBefore(budgetNameField, monthField);
    } else {
        // Just clear the value if the field already exists
        document.getElementById('budget-name').value = '';
    }
    
    // Add category fields for each category
    categories.forEach(category => {
        addCategoryField(category);
    });
    
    // Show the modal
    document.getElementById('budget-modal').style.display = 'block';
}

function addCategoryField(category, amount = 0) {
    const categoriesContainer = document.getElementById('budget-categories-container');
    
    const categoryField = document.createElement('div');
    categoryField.className = 'form-group category-field';
    categoryField.setAttribute('data-category-id', category.id);
    
    categoryField.innerHTML = `
        <label>${category.name}</label>
        <div class="category-input">
            <input type="number" class="category-amount" value="${amount}" min="0" step="0.01">
            <button type="button" class="btn btn-icon remove-category" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    categoriesContainer.appendChild(categoryField);
    
    // Add event listener to remove button
    const removeBtn = categoryField.querySelector('.remove-category');
    removeBtn.addEventListener('click', function() {
        categoryField.remove();
        updateBudgetTotal();
    });
    
    // Add event listener to update total when amount changes
    const amountInput = categoryField.querySelector('.category-amount');
    amountInput.addEventListener('input', updateBudgetTotal);
    
    // Update the total budget amount
    updateBudgetTotal();
}

function addCategoryToBudgetForm() {
    // Get all categories
    const categories = getMockCategories();
    
    // Get IDs of categories already in the form
    const existingCategoryIds = Array.from(
        document.querySelectorAll('#budget-categories-container .category-field')
    ).map(el => el.getAttribute('data-category-id'));
    
    // Filter out categories already in the form
    const availableCategories = categories.filter(cat => !existingCategoryIds.includes(cat.id));
    
    if (availableCategories.length === 0) {
        alert('All categories have already been added to the budget.');
        return;
    }
    
    // For simplicity, add the first available category
    // In a real app, you might show a dropdown to select from available categories
    addCategoryField(availableCategories[0]);
}

function updateBudgetTotal() {
    const amountInputs = document.querySelectorAll('#budget-categories-container .category-amount');
    let total = 0;
    
    amountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        total += amount;
    });
    
    document.getElementById('budget-total').textContent = formatCurrency(total);
}

function handleBudgetFormSubmit() {
    // Get selected month
    const month = document.getElementById('budget-month').value;
    
    // Get budget name
    const budgetName = document.getElementById('budget-name').value.trim() || `Budget for ${month}`;
    
    // Get category amounts
    const categoryFields = document.querySelectorAll('#budget-categories-container .category-field');
    const categories = Array.from(categoryFields).map(field => {
        return {
            category_id: field.getAttribute('data-category-id'),
            amount: parseFloat(field.querySelector('.category-amount').value) || 0,
            spent: 0 // Initialize spent to 0 for new budgets
        };
    });
    
    // Prepare budget data
    const budgetData = {
        name: budgetName,
        month,
        categories
    };
    
    console.log('Saving budget:', budgetData);
    
    // Save the budget (in this demo version, save to localStorage)
    saveBudgetToLocalStorage(budgetData);
    
    // Hide the modal
    document.getElementById('budget-modal').style.display = 'none';
    showSuccess('Budget saved successfully!');
    
    // Reload budget data and update selector
    updateBudgetSelector();
    updateBudgetPeriod(budgetData.id);
}

// Function to save budget to localStorage
function saveBudgetToLocalStorage(budgetData) {
    try {
        // Get existing budgets or initialize empty array
        let budgets = [];
        try {
            const savedBudgets = localStorage.getItem('budgets');
            if (savedBudgets) {
                budgets = JSON.parse(savedBudgets);
            }
        } catch (e) {
            console.error('Error parsing saved budgets:', e);
        }
        
        // Generate a unique ID if this is a new budget
        if (!budgetData.id) {
            budgetData.id = 'budget-' + Date.now();
        }
        
        // Make sure the categories have the correct structure
        if (budgetData.categories) {
            budgetData.categories = budgetData.categories.map(category => {
                // Ensure we have category_id (not just id) for consistency
                return {
                    category_id: category.category_id || category.id,
                    amount: category.amount || 0,
                    spent: category.spent || 0
                };
            });
        }
        
        // If this is an edit of an existing budget, find and replace it
        const existingIndex = budgets.findIndex(b => b.id === budgetData.id);
        if (existingIndex >= 0) {
            budgets[existingIndex] = budgetData;
        } else {
            // Otherwise add as a new budget
            budgets.push(budgetData);
        }
        
        // Save back to localStorage
        localStorage.setItem('budgets', JSON.stringify(budgets));
        
        // If this is set as the current budget, save that reference too
        localStorage.setItem('currentBudgetId', budgetData.id);
        
        return true;
    } catch (e) {
        console.error('Error saving budget to localStorage:', e);
        return false;
    }
}

function showManageCategoriesModal(categories) {
    // Get categories list element
    const categoryList = document.getElementById('category-list');
    
    // Clear existing items
    categoryList.innerHTML = '';
    
    // Add each category
    categories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'category-item';
        listItem.setAttribute('data-category-id', category.id);
        
        listItem.innerHTML = `
            <span class="category-name">${category.name}</span>
            <button class="btn btn-icon delete-category" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        categoryList.appendChild(listItem);
        
        // Add event listener to delete button
        const deleteBtn = listItem.querySelector('.delete-category');
        deleteBtn.addEventListener('click', function() {
            deleteCategory(category.id);
        });
    });
    
    // Show the modal
    document.getElementById('categories-modal').style.display = 'block';
}

function addNewCategory() {
    const nameInput = document.getElementById('new-category-name');
    const categoryName = nameInput.value.trim();
    
    if (!categoryName) {
        alert('Please enter a category name.');
        return;
    }
    
    console.log('Adding new category:', categoryName);
    
    // In a real app, you would submit this to your API
    // For this demo, we'll just add it to the list
    const categoryId = 'cat-' + Date.now();
    const newCategory = { id: categoryId, name: categoryName };
    
    // Add to the list
    const categoryList = document.getElementById('category-list');
    const listItem = document.createElement('li');
    listItem.className = 'category-item';
    listItem.setAttribute('data-category-id', categoryId);
    
    listItem.innerHTML = `
        <span class="category-name">${categoryName}</span>
        <button class="btn btn-icon delete-category" title="Delete">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    categoryList.appendChild(listItem);
    
    // Add event listener to delete button
    const deleteBtn = listItem.querySelector('.delete-category');
    deleteBtn.addEventListener('click', function() {
        deleteCategory(categoryId);
    });
    
    // Clear the input
    nameInput.value = '';
    
    showSuccess('Category added successfully!');
}

function deleteCategory(categoryId) {
    const confirmDelete = confirm('Are you sure you want to delete this category? This will also remove it from any budgets it\'s associated with.');
    
    if (!confirmDelete) {
        return;
    }
    
    console.log('Deleting category:', categoryId);
    
    // In a real app, you would submit this to your API
    // For this demo, we'll just remove it from the list
    const categoryItem = document.querySelector(`.category-item[data-category-id="${categoryId}"]`);
    if (categoryItem) {
        categoryItem.remove();
    }
    
    showSuccess('Category deleted successfully!');
}

function editCategoryBudget(categoryId) {
    // In a real app, you would open a modal or form to edit the category budget
    // For this demo, we'll just show an alert
    alert('Edit category budget functionality would go here. Category ID: ' + categoryId);
}

// Show edit category modal
function showEditCategoryModal(categoryId, categories, budget) {
    const categoryBudget = budget.categories.find(cat => cat.category_id == categoryId);
    const category = categories.find(cat => cat.id == categoryId);
    
    if (!categoryBudget || !category) {
        showError('Category not found');
        return;
    }
    
    const modal = document.getElementById('budget-modal');
    if (!modal) {
        console.error('Budget modal not found');
        return;
    }
    
    // Set modal title
    document.getElementById('budget-modal-title').textContent = `Edit ${category.name} Budget`;
    
    // Get the budget form and clear it
    const form = document.getElementById('budget-form');
    form.reset();
    
    // Set current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('budget-month').value = `${year}-${month}`;
    
    // Clear the categories container
    const categoriesContainer = document.getElementById('budget-categories-container');
    categoriesContainer.innerHTML = '';
    
    // Add just this category to edit
    addCategoryField(category, categoryBudget.amount);
    
    // Store the category ID in a hidden input for reference when saving
    let categoryIdInput = document.getElementById('edit-category-id');
    if (!categoryIdInput) {
        categoryIdInput = document.createElement('input');
        categoryIdInput.type = 'hidden';
        categoryIdInput.id = 'edit-category-id';
        form.appendChild(categoryIdInput);
    }
    categoryIdInput.value = categoryId;
    
    // Store the budget ID in a hidden input
    let budgetIdInput = document.getElementById('edit-budget-id');
    if (!budgetIdInput) {
        budgetIdInput = document.createElement('input');
        budgetIdInput.type = 'hidden';
        budgetIdInput.id = 'edit-budget-id';
        form.appendChild(budgetIdInput);
    }
    budgetIdInput.value = budget.id;
    
    // Add a budget name field (or update existing one)
    if (!document.getElementById('budget-name-field')) {
        const budgetNameField = document.createElement('div');
        budgetNameField.className = 'form-group';
        budgetNameField.id = 'budget-name-field';
        
        budgetNameField.innerHTML = `
            <label for="budget-name">Budget Name</label>
            <input type="text" id="budget-name" value="${budget.name || ''}" placeholder="Enter budget name" required>
        `;
        
        // Insert the name field before the month field
        const monthField = document.querySelector('#budget-form .form-group');
        form.insertBefore(budgetNameField, monthField);
    } else {
        // Just update the value if the field already exists
        document.getElementById('budget-name').value = budget.name || '';
    }
    
    // Add custom event handler for this form to handle category budget updates
    form.onsubmit = function(e) {
        e.preventDefault();
        handleEditCategorySubmit(categoryId, budget);
    };
    
    // Show the modal
    modal.style.display = 'block';
}

// Handle the edit category form submission
function handleEditCategorySubmit(categoryId, originalBudget) {
    // Get budget name and month
    const budgetName = document.getElementById('budget-name').value.trim() || originalBudget.name;
    const month = document.getElementById('budget-month').value;
    
    // Get updated amount for this category
    const categoryField = document.querySelector('.category-field');
    const updatedAmount = parseFloat(categoryField.querySelector('.category-amount').value) || 0;
    
    // Create a copy of the original budget
    const updatedBudget = JSON.parse(JSON.stringify(originalBudget));
    
    // Update the budget name and any other details
    updatedBudget.name = budgetName;
    updatedBudget.month = month;
    
    // Find and update the specific category
    const categoryIndex = updatedBudget.categories.findIndex(cat => cat.category_id == categoryId);
    if (categoryIndex >= 0) {
        updatedBudget.categories[categoryIndex].amount = updatedAmount;
    }
    
    console.log('Updating budget category:', { budgetId: updatedBudget.id, categoryId, amount: updatedAmount });
    
    // Save the updated budget
    saveBudgetToLocalStorage(updatedBudget);
    
    // Hide the modal
    document.getElementById('budget-modal').style.display = 'none';
    
    // Show a success message
    showSuccess('Category budget updated successfully!');
    
    // Reload budget data
    updateBudgetSelector();
    updateBudgetPeriod(updatedBudget.id);
}

// Add Category to Budget Modal
function showAddCategoryModal(categories, budget) {
    const modal = document.getElementById('budget-modal');
    if (!modal) {
        console.error('Budget modal not found');
        return;
    }
    
    // Set modal title
    document.getElementById('budget-modal-title').textContent = 'Add Category to Budget';
    
    // Get the budget form and clear it
    const form = document.getElementById('budget-form');
    form.reset();
    
    // Set current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('budget-month').value = `${year}-${month}`;
    
    // Clear the categories container
    const categoriesContainer = document.getElementById('budget-categories-container');
    categoriesContainer.innerHTML = '';
    
    // Get all categories
    const allCategories = categories || getMockCategories();
    
    // Get categories already in the budget
    const budgetCategoryIds = budget ? budget.categories.map(cat => cat.category_id) : [];
    
    // Filter to categories not yet in the budget
    const availableCategories = allCategories.filter(cat => !budgetCategoryIds.includes(cat.id));
    
    if (availableCategories.length === 0) {
        showError('All categories have already been added to this budget');
        return;
    }
    
    // Add the first available category as a starting point
    addCategoryField(availableCategories[0], 0);
    
    // Show the modal
    modal.style.display = 'block';
}

// UTILITIES

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function setLoading(isLoading) {
    const loadingIndicator = document.getElementById('budgets-loading');
    const budgetsContent = document.getElementById('budgets-content');
    
    if (!loadingIndicator || !budgetsContent) {
        console.error('Loading indicator or budgets content elements not found!');
        return;
    }
    
    loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    budgetsContent.style.display = isLoading ? 'none' : 'block';
    
    // Hide error and success containers when showing loading
    if (isLoading) {
        const errorContainer = document.getElementById('error-container');
        const successContainer = document.getElementById('success-container');
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        
        if (successContainer) {
            successContainer.style.display = 'none';
        }
    }
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        console.error('Error container not found!');
        return;
    }
    
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    errorContainer.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successContainer = document.getElementById('success-container');
    if (!successContainer) {
        // Fallback to toast notification
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show then hide
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
        return;
    }
    
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.textContent = message;
    }
    
    successContainer.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successContainer.style.display = 'none';
    }, 3000);
}

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// MOCK DATA

function getMockCategories() {
    return [
        { id: 1, name: 'Housing', icon: 'home' },
        { id: 2, name: 'Food', icon: 'utensils' },
        { id: 3, name: 'Transportation', icon: 'car' },
        { id: 4, name: 'Entertainment', icon: 'film' },
        { id: 5, name: 'Shopping', icon: 'shopping-cart' },
        { id: 6, name: 'Healthcare', icon: 'medkit' },
        { id: 7, name: 'Education', icon: 'graduation-cap' }
    ];
}

function getMockBudget() {
    // Try to get from localStorage first
    try {
        const currentBudgetId = localStorage.getItem('currentBudgetId');
        const savedBudgets = localStorage.getItem('budgets');
        
        if (savedBudgets && currentBudgetId) {
            const budgets = JSON.parse(savedBudgets);
            const currentBudget = budgets.find(b => b.id === currentBudgetId);
            
            if (currentBudget) {
                return currentBudget;
            }
        }
    } catch (e) {
        console.error('Error getting saved budget:', e);
    }
    
    // Fall back to default mock budget if nothing in localStorage
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    return {
        id: 'default-budget',
        name: `${month} ${year} Budget`,
        period: `${month} ${year}`,
        categories: [
            { category_id: 1, amount: 1200.00, spent: 1150.00 },
            { category_id: 2, amount: 500.00, spent: 425.75 },
            { category_id: 3, amount: 300.00, spent: 285.50 },
            { category_id: 4, amount: 200.00, spent: 180.25 },
            { category_id: 5, amount: 150.00, spent: 175.30 },
            { category_id: 6, amount: 100.00, spent: 45.00 },
            { category_id: 7, amount: 200.00, spent: 315.60 }
        ]
    };
}

function getMockChartData(period) {
    // Generate mock chart data based on period
    if (period === 'monthly') {
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            budgetAmounts: [2000, 2100, 2200, 2300, 2400, 2500],
            spentAmounts: [1900, 2050, 2150, 2250, 2300, 2400]
        };
    } else if (period === 'quarterly') {
        return {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            budgetAmounts: [6500, 7000, 7200, 7500],
            spentAmounts: [6200, 6800, 7000, 7300]
        };
    } else if (period === 'yearly') {
        return {
            labels: ['2022', '2023', '2024', '2025'],
            budgetAmounts: [24000, 26000, 28000, 30000],
            spentAmounts: [23500, 25500, 27200, 29000]
        };
    }
    
    // Default to monthly
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        budgetAmounts: [2000, 2100, 2200, 2300, 2400, 2500],
        spentAmounts: [1900, 2050, 2150, 2250, 2300, 2400]
    };
}

// Hide a modal by ID
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update budget for selected period
function updateBudgetPeriod(period) {
    console.log('Updating budget for period:', period);
    
    try {
        let budget;
        
        if (period === 'current') {
            budget = getMockBudget();
        } else {
            // Try to get the specific budget by ID
            try {
                const savedBudgets = localStorage.getItem('budgets');
                if (savedBudgets) {
                    const budgets = JSON.parse(savedBudgets);
                    budget = budgets.find(b => b.id === period);
                    
                    // If found, set as current budget
                    if (budget) {
                        localStorage.setItem('currentBudgetId', budget.id);
                    }
                }
            } catch (e) {
                console.error('Error loading specific budget:', e);
            }
            
            // Fall back to default if not found
            if (!budget) {
                budget = getMockBudget();
            }
        }
        
        const categories = getMockCategories();
        
        // Update UI with new data
        renderBudgetOverview(budget);
        renderBudgetCategories(categories, budget);
        renderBudgetChart(categories, budget);
        
        // Also update the budget selector to show the current selection
        const budgetPeriodSelect = document.getElementById('budget-period-select');
        if (budgetPeriodSelect) {
            // Find and select the option with the matching value
            for (let i = 0; i < budgetPeriodSelect.options.length; i++) {
                if (budgetPeriodSelect.options[i].value === budget.id) {
                    budgetPeriodSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        showSuccess(`Switched to ${budget.name || 'current budget'}`);
    } catch (error) {
        console.error('Error updating budget period:', error);
        showError('Failed to update budget period');
    }
}

// Update chart for selected period
function updateChartPeriod(period) {
    console.log('Updating chart for period:', period);
    
    try {
        // Get chart data based on period
        const chartData = getMockChartData(period);
        
        // Update chart
        if (window.budgetChart) {
            window.budgetChart.data.labels = chartData.labels;
            window.budgetChart.data.datasets[0].data = chartData.budgetAmounts;
            window.budgetChart.data.datasets[1].data = chartData.spentAmounts;
            window.budgetChart.update();
        }
        
        showSuccess(`Chart updated to ${period} view`);
    } catch (error) {
        console.error('Error updating chart period:', error);
        showError('Failed to update chart period');
    }
}

// Update budget period selector with available budgets
function updateBudgetSelector() {
    const budgetPeriodSelect = document.getElementById('budget-period-select');
    if (!budgetPeriodSelect) return;
    
    // Save current selection if there is one
    const currentSelection = budgetPeriodSelect.value;
    
    // Clear existing options except for the default "Current Budget" option
    while (budgetPeriodSelect.options.length > 0) {
        budgetPeriodSelect.options.remove(0);
    }
    
    // Add default "Current Budget" option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'current';
    defaultOption.textContent = 'Current Budget';
    budgetPeriodSelect.appendChild(defaultOption);
    
    // Try to get saved budgets
    try {
        const savedBudgets = localStorage.getItem('budgets');
        if (savedBudgets) {
            const budgets = JSON.parse(savedBudgets);
            
            // Get current budget ID
            const currentBudgetId = localStorage.getItem('currentBudgetId');
            
            // Add each budget as an option
            budgets.forEach(budget => {
                const option = document.createElement('option');
                option.value = budget.id;
                option.textContent = budget.name || `Budget for ${budget.month}`;
                budgetPeriodSelect.appendChild(option);
                
                // If this is the current budget, select it
                if (budget.id === currentBudgetId) {
                    option.selected = true;
                }
            });
            
            // If we had a selection before, try to restore it
            if (currentSelection && currentSelection !== 'current') {
                for (let i = 0; i < budgetPeriodSelect.options.length; i++) {
                    if (budgetPeriodSelect.options[i].value === currentSelection) {
                        budgetPeriodSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error updating budget selector:', e);
    }
}
