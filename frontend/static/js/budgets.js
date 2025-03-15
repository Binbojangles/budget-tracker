// Budgets.js - Budget management functionality
// Rebuilt version with improved structure and reliability

// Global state to manage the current budget data
const BudgetManager = {
    // Current loaded budget
    currentBudget: null,
    // Available categories
    categories: [],
    // UI state management
    isLoading: false,
    // Chart references
    budgetChart: null,
    
    // Initialize the budget manager
    init: function() {
        console.log('Initializing Budget Manager - Debug: Start initialization');
        
        // Set default sort
        this.currentSortField = 'amount';
        this.currentSortDirection = 'desc';
        
        console.log('Debug: Set default sort fields', this.currentSortField, this.currentSortDirection);
        
        // Show loading state
        this.setLoading(true);
        console.log('Debug: Set loading state to true');
        
        // Load data
        console.log('Debug: About to load categories and current budget');
        Promise.all([
            this.loadCategories(),
            this.loadCurrentBudget()
        ])
        .then(() => {
            console.log('Debug: Data loaded successfully');
            console.log('Debug: Categories:', JSON.stringify(this.categories));
            console.log('Debug: Current budget:', this.currentBudget ? JSON.stringify(this.currentBudget) : 'No current budget');
            
            // Hide loading
            this.setLoading(false);
            console.log('Debug: Set loading state to false');
            
            // Update UI after a short delay to ensure DOM is ready
            console.log('Debug: Setting timeout for UI update');
            setTimeout(() => {
                console.log('Debug: In timeout, about to call updateUI()');
                this.updateUI();
                console.log('Debug: After updateUI, about to attach event listeners');
                this.attachEventListeners();
                console.log('Debug: After attachEventListeners, about to update sort buttons UI');
                this.updateSortButtonsUI();
                console.log('Debug: Initialization timeout complete');
            }, 100);
        })
        .catch(error => {
            console.error('Debug: Error initializing Budget Manager:', error);
            this.setLoading(false);
            this.showErrorMessage('Failed to load budget data. Please try again.');
        });
    },
    
    // Reset budget data
    resetBudgetData: function() {
        console.log('Resetting budget data');
        localStorage.removeItem('budgets');
        localStorage.removeItem('currentBudgetId');
        localStorage.removeItem('budgetCategories');
    },
    
    // Load initial data from localStorage or API
    loadInitialData: function() {
        try {
            this.setLoading(true);
            
            // Load available categories
            this.categories = this.loadCategories();
            console.log('Loaded categories:', this.categories);
            
            // Load current budget
            this.currentBudget = this.loadCurrentBudget();
            console.log('Loaded current budget:', this.currentBudget);
            
            // Update UI
            this.updateUI();
            
            this.setLoading(false);
            this.showSuccessMessage('Budget data loaded successfully!');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showErrorMessage('Failed to load budget data. Using default data instead.');
            
            // Use default data as fallback
            this.categories = this.getDefaultCategories();
            this.currentBudget = this.getDefaultBudget();
            
            // Update UI with default data
            this.updateUI();
            this.setLoading(false);
        }
    },
    
    // Setup all event listeners for the budget page
    setupEventListeners: function() {
        // Budget period selector
        const budgetSelector = document.getElementById('budget-period-select');
        if (budgetSelector) {
            budgetSelector.addEventListener('change', (e) => {
                const budgetId = e.target.value;
                this.switchBudget(budgetId);
            });
        }
        
        // Create new budget button
        const createBudgetBtn = document.getElementById('create-budget-btn');
        if (createBudgetBtn) {
            createBudgetBtn.addEventListener('click', () => this.showCreateBudgetModal());
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal, .modal-overlay');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });
        
        // Budget form submission
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBudgetFormSubmit();
            });
        }
        
        // Category form submission
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategoryFormSubmit();
            });
        }
        
        // Prevent modal overlay clicks from closing modals
        const modalContents = document.querySelectorAll('.modal-content');
        modalContents.forEach(content => {
            content.addEventListener('click', (e) => e.stopPropagation());
        });
        
        // Add category to budget button in budget form
        const addCategoryToBudgetBtn = document.getElementById('add-category-to-budget');
        if (addCategoryToBudgetBtn) {
            addCategoryToBudgetBtn.addEventListener('click', () => this.addCategoryToBudgetForm());
        }
        
        // Cancel buttons
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });
        
        // Also attach category event listeners 
        this.attachCategoryEventListeners();
    },
    
    // Update UI with current budget data
    updateUI: function() {
        console.log('Debug: updateUI - Starting UI update');
        
        // Hide loading, error, and success messages
        this.setLoading(false);
        console.log('Debug: Hiding loading indicator');
        
        document.getElementById('error-container').style.display = 'none';
        document.getElementById('success-container').style.display = 'none';
        console.log('Debug: Hid error and success containers');
        
        // Update budget selector
        console.log('Debug: About to update budget selector');
        this.updateBudgetSelector();
        
        // If no current budget, show message
        if (!this.currentBudget) {
            console.log('Debug: No current budget, showing no-budget message');
            const noBudgetMessage = document.getElementById('no-budget-message');
            const budgetDashboard = document.getElementById('budget-dashboard');
            
            console.log('Debug: no-budget-message element exists:', !!noBudgetMessage);
            console.log('Debug: budget-dashboard element exists:', !!budgetDashboard);
            
            if (budgetDashboard) budgetDashboard.style.display = 'none';
            if (noBudgetMessage) noBudgetMessage.style.display = 'block';
            return;
        }
        
        // Show dashboard, hide no budget message
        console.log('Debug: Current budget found, showing dashboard');
        const budgetDashboard = document.getElementById('budget-dashboard');
        const noBudgetMessage = document.getElementById('no-budget-message');
        
        console.log('Debug: budget-dashboard element exists:', !!budgetDashboard);
        console.log('Debug: no-budget-message element exists:', !!noBudgetMessage);
        
        if (budgetDashboard) budgetDashboard.style.display = 'block';
        if (noBudgetMessage) noBudgetMessage.style.display = 'none';
        
        // Update budget details
        console.log('Debug: About to update budget details');
        this.updateBudgetDetails();
        
        // Render categories
        console.log('Debug: About to render categories');
        this.renderCategories();
        
        // Update chart
        console.log('Debug: About to update budget chart');
        this.updateBudgetChart();
        
        console.log('Debug: updateUI completed');
    },
    
    // Data Storage and Retrieval Functions
    
    // Load categories from storage
    loadCategories: function() {
        console.log('Debug: loadCategories - Starting to load categories');
        try {
            const savedCategories = localStorage.getItem('budgetCategories');
            console.log('Debug: Saved categories from localStorage:', savedCategories);
            
            if (savedCategories) {
                this.categories = JSON.parse(savedCategories);
                console.log('Debug: Successfully parsed categories', this.categories.length, 'categories loaded');
                return this.categories;
            } else {
                console.log('Debug: No saved categories found, using default categories');
            }
        } catch (error) {
            console.error('Debug: Error loading categories:', error);
        }
        
        // Fall back to default categories
        console.log('Debug: Using default categories');
        this.categories = this.getDefaultCategories();
        console.log('Debug: Default categories loaded', this.categories.length, 'default categories');
        return this.categories;
    },
    
    // Save categories to storage
    saveCategories: function(categories) {
        try {
            localStorage.setItem('budgetCategories', JSON.stringify(categories));
            this.categories = categories;
            return true;
        } catch (error) {
            console.error('Error saving categories:', error);
            return false;
        }
    },
    
    // Add a new category
    addCategory: function(name, icon = 'tag') {
        const newCategory = {
            id: 'cat-' + Date.now(),
            name: name,
            icon: icon
        };
        
        const updatedCategories = [...this.categories, newCategory];
        if (this.saveCategories(updatedCategories)) {
            return newCategory;
        }
        return null;
    },
    
    // Delete a category
    deleteCategory: function(categoryId) {
        const updatedCategories = this.categories.filter(cat => cat.id !== categoryId);
        
        // Update any budgets that might have this category
        this.removeDeletedCategoryFromBudgets(categoryId);
        
        // Save the updated categories
        return this.saveCategories(updatedCategories);
    },
    
    // Remove deleted category from all budgets
    removeDeletedCategoryFromBudgets: function(categoryId) {
        const budgets = this.getAllBudgets();
        
        const updatedBudgets = budgets.map(budget => {
            // Filter out the deleted category
            const updatedCategories = budget.categories.filter(
                cat => cat.category_id !== categoryId
            );
            
            return {
                ...budget,
                categories: updatedCategories
            };
        });
        
        this.saveBudgets(updatedBudgets);
        
        // Update current budget if needed
        if (this.currentBudget) {
            this.currentBudget.categories = this.currentBudget.categories.filter(
                cat => cat.category_id !== categoryId
            );
        }
    },
    
    // Get default categories
    getDefaultCategories: function() {
        return [
            { id: 'cat-1', name: 'Housing', icon: 'home' },
            { id: 'cat-2', name: 'Food', icon: 'utensils' },
            { id: 'cat-3', name: 'Transportation', icon: 'car' },
            { id: 'cat-4', name: 'Entertainment', icon: 'film' },
            { id: 'cat-5', name: 'Shopping', icon: 'shopping-cart' },
            { id: 'cat-6', name: 'Healthcare', icon: 'medkit' },
            { id: 'cat-7', name: 'Education', icon: 'graduation-cap' }
        ];
    },
    
    // Load current budget from storage
    loadCurrentBudget: function() {
        console.log('Debug: loadCurrentBudget - Starting to load current budget');
        try {
            const currentBudgetId = localStorage.getItem('currentBudgetId');
            console.log('Debug: Current budget ID from localStorage:', currentBudgetId);
            
            const savedBudgets = localStorage.getItem('budgets');
            console.log('Debug: Saved budgets from localStorage:', savedBudgets ? 'found' : 'not found');
            
            if (savedBudgets && currentBudgetId) {
                const budgets = JSON.parse(savedBudgets);
                console.log('Debug: Successfully parsed budgets', budgets.length, 'budgets loaded');
                
                const budget = budgets.find(b => b.id === currentBudgetId);
                if (budget) {
                    console.log('Debug: Found current budget', budget.id, budget.name);
                    this.currentBudget = budget;
                    return budget;
                } else {
                    console.log('Debug: Could not find budget with ID', currentBudgetId);
                }
            }
            
            // If no current budget, check if we have any budgets
            if (savedBudgets) {
                const budgets = JSON.parse(savedBudgets);
                if (budgets.length > 0) {
                    // Use the first budget and set it as current
                    console.log('Debug: No current budget, using first available budget', budgets[0].id);
                    localStorage.setItem('currentBudgetId', budgets[0].id);
                    this.currentBudget = budgets[0];
                    return budgets[0];
                } else {
                    console.log('Debug: Parsed budgets array is empty');
                }
            } else {
                console.log('Debug: No budgets found in localStorage');
            }
        } catch (error) {
            console.error('Debug: Error loading current budget:', error);
        }
        
        // If no budgets exist, create and save the default budget
        console.log('Debug: Creating default budget');
        const defaultBudget = this.getDefaultBudget();
        console.log('Debug: Default budget created', defaultBudget.id, defaultBudget.name);
        
        this.saveBudget(defaultBudget);
        console.log('Debug: Default budget saved to localStorage');
        
        localStorage.setItem('currentBudgetId', defaultBudget.id);
        console.log('Debug: Set currentBudgetId in localStorage to', defaultBudget.id);
        
        this.currentBudget = defaultBudget;
        return defaultBudget;
    },
    
    // Get all budgets from storage
    getAllBudgets: function() {
        try {
            const savedBudgets = localStorage.getItem('budgets');
            if (savedBudgets) {
                return JSON.parse(savedBudgets);
            }
        } catch (error) {
            console.error('Error getting all budgets:', error);
        }
        
        return [];
    },
    
    // Save all budgets to storage
    saveBudgets: function(budgets) {
        try {
            localStorage.setItem('budgets', JSON.stringify(budgets));
            return true;
        } catch (error) {
            console.error('Error saving budgets:', error);
            return false;
        }
    },
    
    // Save a single budget and update the budgets list
    saveBudget: function(budget) {
        try {
            // Get existing budgets
            const budgets = this.getAllBudgets();
            
            // Check if budget already exists (update) or is new (add)
            const existingIndex = budgets.findIndex(b => b.id === budget.id);
            
            if (existingIndex >= 0) {
                // Update existing budget
                budgets[existingIndex] = budget;
            } else {
                // Add new budget
                budgets.push(budget);
            }
            
            // Save back to storage
            localStorage.setItem('budgets', JSON.stringify(budgets));
            
            // If this is the currently active budget, update currentBudget
            const currentBudgetId = localStorage.getItem('currentBudgetId');
            if (currentBudgetId === budget.id) {
                this.currentBudget = budget;
            }
            
            return true;
        } catch (error) {
            console.error('Error saving budget:', error);
            return false;
        }
    },
    
    // Set the current active budget
    setCurrentBudget: function(budgetId) {
        try {
            // Get the budget by ID
            const budgets = this.getAllBudgets();
            const budget = budgets.find(b => b.id === budgetId);
            
            if (budget) {
                localStorage.setItem('currentBudgetId', budgetId);
                this.currentBudget = budget;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error setting current budget:', error);
            return false;
        }
    },
    
    // Create a new budget with the given name and period
    createBudget: function(budgetData) {
        // If we received a complete budget object
        if (typeof budgetData === 'object' && budgetData.id) {
            // Make sure the budget has an id
            if (!budgetData.id) {
                budgetData.id = 'budget-' + Date.now();
            }
            
            // Save the budget
            if (this.saveBudget(budgetData)) {
                // Set as current budget
                this.setCurrentBudget(budgetData.id);
                this.currentBudget = budgetData;
                return budgetData;
            }
            return null;
        }
        
        // Otherwise, create a new budget from parameters (name, period, categories)
        const name = budgetData;
        const period = arguments[1];
        const categories = arguments[2] || [];
        
        const now = new Date();
        
        const newBudget = {
            id: 'budget-' + Date.now(),
            name: name,
            period: period,
            created: now.toISOString(),
            lastModified: now.toISOString(),
            categories: categories
        };
        
        if (this.saveBudget(newBudget)) {
            // Set as current budget
            this.setCurrentBudget(newBudget.id);
            this.currentBudget = newBudget;
            return newBudget;
        }
        
        return null;
    },
    
    // Get default budget
    getDefaultBudget: function() {
        const currentDate = new Date();
        const month = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        
        return {
            id: 'budget-default-' + Date.now(), // Ensure unique ID for default budget
            name: `${month} ${year} Budget`,
            period: `${month} ${year}`,
            created: currentDate.toISOString(),
            lastModified: currentDate.toISOString(),
            categories: [
                { category_id: 'cat-1', amount: 1200.00, spent: 1150.00 },
                { category_id: 'cat-2', amount: 500.00, spent: 425.75 },
                { category_id: 'cat-3', amount: 300.00, spent: 285.50 },
                { category_id: 'cat-4', amount: 200.00, spent: 180.25 },
                { category_id: 'cat-5', amount: 150.00, spent: 175.30 },
                { category_id: 'cat-6', amount: 100.00, spent: 45.00 },
                { category_id: 'cat-7', amount: 200.00, spent: 315.60 }
            ]
        };
    },
    
    // Toggle loading state
    setLoading: function(isLoading) {
        console.log('Debug: setLoading - Setting loading state to', isLoading);
        this.isLoading = isLoading;
        const loadingElement = document.getElementById('budgets-loading');
        const contentElement = document.getElementById('budgets-content');
        
        console.log('Debug: loadingElement exists:', !!loadingElement);
        console.log('Debug: contentElement exists:', !!contentElement);
        
        if (loadingElement && contentElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
            contentElement.style.display = isLoading ? 'none' : 'block';
            console.log('Debug: Updated display of loading and content elements');
        } else {
            console.error('Debug: Could not find loading or content elements');
        }
    },
    
    // Show success message
    showSuccessMessage: function(message) {
        const successContainer = document.getElementById('success-container');
        const successMessage = document.getElementById('success-message');
        
        if (successContainer && successMessage) {
            successMessage.textContent = message;
            successContainer.style.display = 'block';
            
            setTimeout(() => {
                successContainer.style.display = 'none';
            }, 3000);
        }
    },
    
    // Show error message
    showErrorMessage: function(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
            
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
    },
    
    // Format currency values
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // Render budget selector dropdown
    renderBudgetSelector: function() {
        const budgetSelector = document.getElementById('budget-period-select');
        if (!budgetSelector) return;
        
        // Save the current selection if any
        const currentValue = budgetSelector.value;
        
        // Clear existing options
        budgetSelector.innerHTML = '';
        
        // Add default "Current Budget" option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'current';
        defaultOption.textContent = 'Current Budget';
        budgetSelector.appendChild(defaultOption);
        
        // Get all budgets and add them as options
        const budgets = this.getAllBudgets();
        const currentBudgetId = this.currentBudget ? this.currentBudget.id : null;
        
        budgets.forEach(budget => {
            const option = document.createElement('option');
            option.value = budget.id;
            option.textContent = budget.name;
            
            // Select the current budget
            if (budget.id === currentBudgetId) {
                option.selected = true;
            }
            
            budgetSelector.appendChild(option);
        });
        
        // Restore previous selection if it still exists
        if (currentValue && currentValue !== 'current') {
            for (let i = 0; i < budgetSelector.options.length; i++) {
                if (budgetSelector.options[i].value === currentValue) {
                    budgetSelector.selectedIndex = i;
                    break;
                }
            }
        }
    },
    
    // Render budget overview section
    renderBudgetOverview: function() {
        if (!this.currentBudget) return;
        
        const budget = this.currentBudget;
        const overviewContainer = document.querySelector('.current-budget-overview');
        if (!overviewContainer) return;
        
        // Calculate summary values
        const totalBudgeted = budget.categories.reduce((sum, cat) => sum + parseFloat(cat.amount || 0), 0);
        const totalSpent = budget.categories.reduce((sum, cat) => sum + parseFloat(cat.spent || 0), 0);
        const remainingAmount = totalBudgeted - totalSpent;
        const percentSpent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
        
        // Update budget overview values
        const elements = {
            totalBudget: document.getElementById('total-budget'),
            totalSpent: document.getElementById('total-spent'),
            remainingBudget: document.getElementById('remaining-budget'),
            budgetProgress: document.getElementById('budget-progress')
        };
        
        if (elements.totalBudget) {
            elements.totalBudget.textContent = this.formatCurrency(totalBudgeted);
        }
        
        if (elements.totalSpent) {
            elements.totalSpent.textContent = this.formatCurrency(totalSpent);
            elements.totalSpent.className = 'card-value ' + (totalSpent > totalBudgeted ? 'negative' : '');
        }
        
        if (elements.remainingBudget) {
            elements.remainingBudget.textContent = this.formatCurrency(remainingAmount);
            elements.remainingBudget.className = 'card-value ' + (remainingAmount < 0 ? 'negative' : 'positive');
        }
        
        // Update progress bar
        if (elements.budgetProgress) {
            const progressBar = elements.budgetProgress.querySelector('.progress-bar');
            const progressText = elements.budgetProgress.querySelector('.progress-text');
            
            if (progressBar) {
                const progressFill = progressBar.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = Math.min(percentSpent, 100) + '%';
                }
                
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
    },
    
    // Render budget categories
    renderCategories: function() {
        console.log('Debug: renderCategories - Starting to render categories');
        
        // Get container and check if it exists
        const categoriesContainer = document.getElementById('budget-categories');
        console.log('Debug: budget-categories element exists:', !!categoriesContainer);
        
        if (!categoriesContainer) {
            console.error('Debug: Categories container not found');
            
            // Try alternate container ids
            const alternateContainerId = 'categories-list';
            const alternateContainer = document.getElementById(alternateContainerId);
            console.log('Debug: Trying alternate container', alternateContainerId, 'exists:', !!alternateContainer);
            
            if (alternateContainer) {
                console.log('Debug: Using alternate categories container');
                this.renderCategoriesAlternate(alternateContainer);
                return;
            }
            
            return;
        }
        
        // Clear container
        categoriesContainer.innerHTML = '';
        console.log('Debug: Cleared categories container');
        
        if (!this.currentBudget || !this.currentBudget.categories || this.currentBudget.categories.length === 0) {
            console.log('Debug: No categories in current budget, showing message');
            // Show no categories message
            const noCategories = document.createElement('div');
            noCategories.className = 'no-data-message';
            noCategories.textContent = 'No categories in this budget. Add a category to get started.';
            categoriesContainer.appendChild(noCategories);
            return;
        }
        
        // Get categories for this budget
        console.log('Debug: Mapping budget categories to category details');
        const categoryItems = this.currentBudget.categories.map(budgetCategory => {
            // Find category details
            const categoryDetails = this.categories.find(c => c.id === budgetCategory.category_id);
            if (!categoryDetails) {
                console.log('Debug: Could not find category details for ID:', budgetCategory.category_id);
                return null;
            }
            
            return {
                id: budgetCategory.category_id,
                name: categoryDetails.name,
                amount: budgetCategory.amount,
                spent: budgetCategory.spent,
                icon: categoryDetails.icon,
                color: categoryDetails.color || '#007bff' // Default color if none specified
            };
        }).filter(c => c !== null);
        
        console.log('Debug: Found', categoryItems.length, 'valid categories to render');
        
        // If no valid categories, show message
        if (categoryItems.length === 0) {
            console.log('Debug: No valid categories found, showing message');
            const noCategories = document.createElement('div');
            noCategories.className = 'no-data-message';
            noCategories.textContent = 'No valid categories found for this budget.';
            categoriesContainer.appendChild(noCategories);
            return;
        }
        
        // Apply sort if active
        console.log('Debug: Sorting categories by', this.currentSortField, 'in', this.currentSortDirection, 'order');
        const sortedCategories = this.sortCategories(categoryItems, this.currentSortField, this.currentSortDirection);
        
        // Create category cards
        console.log('Debug: Creating category cards for', sortedCategories.length, 'categories');
        sortedCategories.forEach((category, index) => {
            console.log('Debug: Creating card for category', index, '-', category.name);
            // Create category card
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.setAttribute('data-category-id', category.id);
            
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            
            // Create category icon
            const categoryIcon = document.createElement('div');
            categoryIcon.className = 'category-icon';
            categoryIcon.innerHTML = `<i class="${category.icon}" style="color: ${category.color};"></i>`;
            
            // Create category name
            const categoryName = document.createElement('div');
            categoryName.className = 'category-name';
            categoryName.textContent = category.name;
            
            // Add icon and name to header
            categoryHeader.appendChild(categoryIcon);
            categoryHeader.appendChild(categoryName);
            
            // Create edit button
            const editButton = document.createElement('button');
            editButton.className = 'edit-category-btn';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showEditCategoryModal(category.id);
            });
            
            // Add edit button to header
            categoryHeader.appendChild(editButton);
            
            // Create category details
            const categoryDetails = document.createElement('div');
            categoryDetails.className = 'category-details';
            
            // Calculate percentage spent
            const percentSpent = category.amount > 0 ? (category.spent / category.amount) * 100 : 0;
            const percentClass = percentSpent > 100 ? 'over-budget' : percentSpent > 80 ? 'warning' : 'good';
            
            // Create progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progressFill = document.createElement('div');
            progressFill.className = `progress-fill ${percentClass}`;
            progressFill.style.width = `${Math.min(percentSpent, 100)}%`;
            
            progressBar.appendChild(progressFill);
            
            // Create amounts
            const amountsDiv = document.createElement('div');
            amountsDiv.className = 'category-amounts';
            
            // Spent amount
            const spentAmount = document.createElement('div');
            spentAmount.className = 'spent-amount';
            spentAmount.textContent = `Spent: ${this.formatCurrency(category.spent)}`;
            
            // Budget amount
            const budgetAmount = document.createElement('div');
            budgetAmount.className = 'budget-amount';
            budgetAmount.textContent = `Budget: ${this.formatCurrency(category.amount)}`;
            
            // Add amounts to amounts div
            amountsDiv.appendChild(spentAmount);
            amountsDiv.appendChild(budgetAmount);
            
            // Add progress bar and amounts to details
            categoryDetails.appendChild(progressBar);
            categoryDetails.appendChild(amountsDiv);
            
            // Build final card
            categoryCard.appendChild(categoryHeader);
            categoryCard.appendChild(categoryDetails);
            
            // Add card to container
            categoriesContainer.appendChild(categoryCard);
        });
        
        console.log('Debug: renderCategories completed');
    },
    
    // Try rendering to alternate container (for compatibility)
    renderCategoriesAlternate: function(container) {
        console.log('Debug: renderCategoriesAlternate - Using alternate container');
        
        // Clear container
        container.innerHTML = '';
        console.log('Debug: Cleared alternate container');
        
        if (!this.currentBudget || !this.currentBudget.categories || this.currentBudget.categories.length === 0) {
            console.log('Debug: No categories in current budget, showing message');
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-folder-open"></i>
                    <p>No budget categories found. Add categories to your budget to get started!</p>
                    <button id="add-category-btn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Category
                    </button>
                </div>
            `;
            
            // Attach event listener to the new button
            setTimeout(() => {
                const addCategoryBtn = document.getElementById('add-category-btn');
                if (addCategoryBtn) {
                    addCategoryBtn.addEventListener('click', () => this.showAddCategoryModal());
                    console.log('Debug: Attached event listener to add category button');
                }
            }, 0);
            
            return;
        }
        
        // Get categories with details
        console.log('Debug: Preparing category data for alternate rendering');
        const categoryItems = this.currentBudget.categories.map(budgetCategory => {
            const categoryDetails = this.categories.find(c => c.id === budgetCategory.category_id);
            if (!categoryDetails) return null;
            
            return {
                id: budgetCategory.category_id,
                name: categoryDetails.name,
                amount: budgetCategory.amount,
                spent: budgetCategory.spent,
                icon: categoryDetails.icon || 'tag',
                color: categoryDetails.color || '#007bff'
            };
        }).filter(c => c !== null);
        
        if (categoryItems.length === 0) {
            console.log('Debug: No valid categories for alternate rendering');
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No valid categories found for this budget.</p>
                </div>
            `;
            return;
        }
        
        // Sort categories
        const sortedCategories = this.sortCategories(categoryItems, this.currentSortField, this.currentSortDirection);
        console.log('Debug: Sorted', sortedCategories.length, 'categories for alternate rendering');
        
        // Create category cards container
        const categoryCards = document.createElement('div');
        categoryCards.className = 'category-cards';
        
        // Render each card
        sortedCategories.forEach(category => {
            const percentSpent = category.amount > 0 ? (category.spent / category.amount) * 100 : 0;
            const statusClass = percentSpent > 100 ? 'over-budget' : (percentSpent > 80 ? 'warning' : 'good');
            
            const categoryCard = document.createElement('div');
            categoryCard.className = `category-card ${statusClass}`;
            categoryCard.dataset.categoryId = category.id;
            
            categoryCard.innerHTML = `
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas fa-${category.icon}" style="color: ${category.color};"></i>
                    </div>
                    <div class="category-details">
                        <h3>${category.name}</h3>
                        <div class="category-budget">
                            <span class="spent">${this.formatCurrency(category.spent)}</span>
                            <span class="separator">/</span>
                            <span class="amount">${this.formatCurrency(category.amount)}</span>
                        </div>
                    </div>
                </div>
                <div class="category-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentSpent, 100)}%;"></div>
                    </div>
                    <div class="progress-label">
                        <span>${percentSpent.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-secondary edit-category-btn" data-category-id="${category.id}">
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
        
        // Add everything to container
        container.appendChild(categoryCards);
        container.appendChild(addButton);
        console.log('Debug: Added category cards and add button to alternate container');
        
        // Attach event listeners
        setTimeout(() => {
            this.attachCategoryEventListeners();
            console.log('Debug: Attached event listeners to category elements');
        }, 0);
    },
    
    // Update budget chart
    updateBudgetChart: function() {
        console.log('Updating budget chart');
        
        if (!this.currentBudget || !this.currentBudget.categories || this.currentBudget.categories.length === 0) {
            // Hide chart if no budget or categories
            const chartContainer = document.getElementById('budget-chart-container');
            if (chartContainer) {
                chartContainer.style.display = 'none';
            }
            return;
        }
        
        // Show chart container
        const chartContainer = document.getElementById('budget-chart-container');
        if (chartContainer) {
            chartContainer.style.display = 'block';
        }
        
        // Prepare chart data
        const chartData = this.prepareChartData();
        
        // Get the chart canvas
        const chartCanvas = document.getElementById('budget-chart');
        if (!chartCanvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        // If a chart instance already exists, destroy it
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        // Create new chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: chartData.colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12
                    }
                },
                cutoutPercentage: 70,
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    },
    
    // Prepare data for chart
    prepareChartData: function() {
        console.log('Preparing chart data');
        
        const labels = [];
        const data = [];
        const colors = [];
        
        // Get spending by category
        this.currentBudget.categories.forEach(budgetCategory => {
            // Find category details
            const categoryDetails = this.categories.find(c => c.id === budgetCategory.category_id);
            if (!categoryDetails) {
                return;
            }
            
            // Skip if no spending
            if (budgetCategory.spent <= 0) {
                return;
            }
            
            // Add to chart data
            labels.push(categoryDetails.name);
            data.push(budgetCategory.spent);
            colors.push(categoryDetails.color);
        });
        
        return {
            labels,
            data,
            colors
        };
    },
    
    // Sort categories by field
    sortCategories: function(categories, field, direction) {
        console.log(`Sorting categories by ${field} in ${direction} order`);
        
        if (!categories || !Array.isArray(categories)) {
            return [];
        }
        
        // Clone the array to avoid modifying the original
        const sorted = [...categories];
        
        // Sort based on field
        sorted.sort((a, b) => {
            let comparison = 0;
            
            switch (field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'spent':
                    comparison = a.spent - b.spent;
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'percent':
                    const percentA = a.amount > 0 ? (a.spent / a.amount) * 100 : 0;
                    const percentB = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
                    comparison = percentA - percentB;
                    break;
                default:
                    return 0;
            }
            
            // Apply direction
            return direction === 'asc' ? comparison : -comparison;
        });
        
        return sorted;
    },
    
    // Attach event listeners to category elements
    attachCategoryEventListeners: function() {
        // Add category button
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            // Remove any existing event listeners (to prevent duplicates)
            const newAddCategoryBtn = addCategoryBtn.cloneNode(true);
            addCategoryBtn.parentNode.replaceChild(newAddCategoryBtn, addCategoryBtn);
            
            // Add new event listener
            newAddCategoryBtn.addEventListener('click', () => this.showAddCategoryModal());
            console.log('Attached click event to add category button');
        }
        
        // Edit category buttons
        const editButtons = document.querySelectorAll('.edit-category-btn');
        editButtons.forEach(button => {
            // Remove any existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new event listener
            newButton.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                console.log('Edit button clicked for category ID:', categoryId);
                if (categoryId) {
                    this.showEditCategoryModal(categoryId);
                }
            });
        });
        
        console.log('Attached events to', editButtons.length, 'edit category buttons');
    },
    
    // Initialize all event listeners
    initializeEventListeners: function() {
        // Budget period selector
        const budgetSelector = document.getElementById('budget-period-select');
        if (budgetSelector) {
            budgetSelector.addEventListener('change', (e) => {
                const budgetId = e.target.value;
                this.switchBudget(budgetId);
            });
        }
        
        // Create new budget button
        const createBudgetBtn = document.getElementById('create-budget-btn');
        if (createBudgetBtn) {
            createBudgetBtn.addEventListener('click', () => this.showCreateBudgetModal());
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal, .modal-overlay');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });
        
        // Budget form submission
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBudgetFormSubmit();
            });
        }
        
        // Category form submission
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategoryFormSubmit();
            });
        }
        
        // Prevent modal overlay clicks from closing modals
        const modalContents = document.querySelectorAll('.modal-content');
        modalContents.forEach(content => {
            content.addEventListener('click', (e) => e.stopPropagation());
        });
        
        // Add category to budget button in budget form
        const addCategoryToBudgetBtn = document.getElementById('add-category-to-budget');
        if (addCategoryToBudgetBtn) {
            addCategoryToBudgetBtn.addEventListener('click', () => this.addCategoryToBudgetForm());
        }
        
        // Cancel buttons
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });
    },
    
    // Switch to a different budget
    switchBudget: function(budgetId) {
        console.log('Switching to budget:', budgetId);
        
        if (!budgetId) {
            this.showErrorMessage('No budget ID provided');
            return;
        }
        
        // Load budget by ID
        const budget = this.loadBudgetById(budgetId);
        if (!budget) {
            this.showErrorMessage(`Budget with ID ${budgetId} not found`);
            return;
        }
        
        // Set as current budget
        this.currentBudget = budget;
        
        // Save current budget ID to localStorage
        localStorage.setItem('currentBudgetId', budgetId);
        
        // Update UI
        this.updateUI();
        
        this.showSuccessMessage(`Switched to budget: ${budget.name}`);
    },
    
    // Close all modals
    closeAllModals: function() {
        console.log('Closing all modals');
        
        // Find all modals and overlay
        const modals = document.querySelectorAll('.modal');
        const overlay = document.querySelector('.modal-overlay');
        
        // Close each modal
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Hide overlay
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    // Show create budget modal
    showCreateBudgetModal: function() {
        console.log('Showing create budget modal');
        
        // Check if we have categories
        if (!this.categories || this.categories.length === 0) {
            this.showErrorMessage('No categories available. Cannot create a budget.');
            return;
        }
        
        // Find all required elements
        const budgetModal = document.getElementById('budget-modal');
        const modalOverlay = document.querySelector('.modal-overlay');
        const budgetForm = document.getElementById('budget-form');
        const budgetNameInput = document.getElementById('budget-name');
        const budgetStartDateInput = document.getElementById('budget-start-date');
        const budgetEndDateInput = document.getElementById('budget-end-date');
        
        // Validate elements
        if (!budgetModal || !modalOverlay || !budgetForm || 
            !budgetNameInput || !budgetStartDateInput || !budgetEndDateInput) {
            this.showErrorMessage('Budget modal elements not found');
            return;
        }
        
        // Set modal title
        const modalTitle = budgetModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Create New Budget';
        }
        
        // Reset form and prepare for new budget
        budgetForm.reset();
        budgetForm.dataset.action = 'create';
        budgetForm.dataset.budgetId = '';
        
        // Set today's date as default start date
        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 10);
        budgetStartDateInput.value = formattedDate;
        
        // Set default end date (30 days from today)
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 30);
        budgetEndDateInput.value = nextMonth.toISOString().slice(0, 10);
        
        // Clear category list
        const categoriesList = budgetModal.querySelector('#budget-categories-list');
        if (categoriesList) {
            categoriesList.innerHTML = '';
        }
        
        // Show the modal
        budgetModal.classList.add('active');
        modalOverlay.classList.add('active');
    },
    
    // Show edit category modal
    showEditCategoryModal: function(categoryId) {
        console.log('Showing edit category modal for category ID:', categoryId);
        if (!categoryId || !this.currentBudget) {
            this.showErrorMessage('Cannot edit category: Missing category ID or budget');
            return;
        }
        
        // Find the budget category
        const budgetCategory = this.currentBudget.categories.find(c => c.category_id === categoryId);
        if (!budgetCategory) {
            this.showErrorMessage('Category not found in current budget');
            return;
        }
        
        // Find the category details
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            this.showErrorMessage('Category details not found');
            return;
        }
        
        const modal = document.getElementById('category-modal');
        const overlay = document.querySelector('.modal-overlay');
        const modalTitle = document.querySelector('#category-modal .modal-title');
        
        if (!modal || !overlay || !modalTitle) {
            this.showErrorMessage('Cannot show modal: Missing UI elements');
            return;
        }
        
        modalTitle.textContent = `Edit ${category.name} Budget`;
        
        // Prepare form
        const form = document.getElementById('category-form');
        if (!form) {
            this.showErrorMessage('Category form not found');
            return;
        }
        
        form.reset();
        
        // Set category select to disabled with single option
        const categorySelect = form.querySelector('#category-select');
        if (categorySelect) {
            categorySelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = category.name;
            categorySelect.appendChild(option);
            categorySelect.disabled = true;
        }
        
        // Set amount
        const amountInput = form.querySelector('#category-amount');
        if (amountInput) {
            amountInput.value = budgetCategory.amount || 0;
        }
        
        // Show delete button
        const deleteButton = form.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.style.display = 'block';
            deleteButton.dataset.categoryId = categoryId;
            
            // Remove old event listeners
            const newDeleteButton = deleteButton.cloneNode(true);
            deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
            
            // Add delete event listener
            newDeleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteCategoryFromBudget(categoryId);
            });
        }
        
        // Set form action to edit
        form.dataset.action = 'edit';
        form.dataset.categoryId = categoryId;
        
        // Show modal
        modal.classList.add('active');
        overlay.classList.add('active');
    },
    
    // Show add category modal
    showAddCategoryModal: function() {
        console.log('Showing add category modal');
        
        if (!this.currentBudget) {
            this.showErrorMessage('No budget selected');
            return;
        }
        
        const modal = document.getElementById('category-modal');
        const overlay = document.querySelector('.modal-overlay');
        const modalTitle = document.querySelector('#category-modal .modal-title');
        
        if (!modal || !overlay || !modalTitle) {
            this.showErrorMessage('Cannot show modal: Missing UI elements');
            return;
        }
        
        modalTitle.textContent = 'Add Category to Budget';
        
        // Prepare form
        const form = document.getElementById('category-form');
        if (!form) {
            this.showErrorMessage('Category form not found');
            return;
        }
        
        form.reset();
        
        // Set category select options
        const categorySelect = form.querySelector('#category-select');
        if (!categorySelect) {
            this.showErrorMessage('Category select element not found');
            return;
        }
        
        // Clear existing options
        categorySelect.innerHTML = '';
        categorySelect.disabled = false;
        
        // Skip categories already in the budget
        const usedCategoryIds = this.currentBudget ? 
            this.currentBudget.categories.map(c => c.category_id) : [];
        
        // Filter available categories
        const availableCategories = this.categories.filter(
            category => !usedCategoryIds.includes(category.id)
        );
        
        // Add options for available categories
        if (availableCategories.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'All categories are already in your budget';
            option.disabled = true;
            categorySelect.appendChild(option);
            
            this.showErrorMessage('All categories are already added to this budget');
        } else {
            // Add a placeholder option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a category';
            defaultOption.selected = true;
            defaultOption.disabled = true;
            categorySelect.appendChild(defaultOption);
            
            // Add all available categories
            availableCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
        
        // Set default amount
        const amountInput = form.querySelector('#category-amount');
        if (amountInput) {
            amountInput.value = 0;
        }
        
        // Hide delete button
        const deleteButton = form.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
        
        // Set form action to add
        form.dataset.action = 'add';
        form.dataset.categoryId = '';
        
        // Show modal
        modal.classList.add('active');
        overlay.classList.add('active');
    },
    
    // Add category to budget form
    addCategoryToBudgetForm: function() {
        console.log('Adding category to budget form');
        // Implementation of addCategoryToBudgetForm function
    },
    
    // Handle budget form submission
    handleBudgetFormSubmit: function() {
        console.log('Handling budget form submission');
        
        // Get form and inputs
        const form = document.getElementById('budget-form');
        if (!form) {
            this.showErrorMessage('Budget form not found');
            return;
        }
        
        const nameInput = document.getElementById('budget-name');
        const startDateInput = document.getElementById('budget-start-date');
        const endDateInput = document.getElementById('budget-end-date');
        
        // Validate form elements
        if (!nameInput || !startDateInput || !endDateInput) {
            this.showErrorMessage('Budget form inputs missing');
            return;
        }
        
        // Get form values
        const name = nameInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Validate inputs
        if (!name) {
            this.showErrorMessage('Please enter a budget name');
            return;
        }
        
        if (!startDate || !endDate) {
            this.showErrorMessage('Please enter valid dates');
            return;
        }
        
        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            this.showErrorMessage('End date must be after start date');
            return;
        }
        
        // Get action and budget ID
        const action = form.dataset.action;
        const budgetId = form.dataset.budgetId;
        
        if (action === 'create') {
            // Create new budget
            const newBudget = {
                id: 'budget_' + Date.now(),
                name: name,
                start_date: startDate,
                end_date: endDate,
                categories: []
            };
            
            // Save to localStorage
            this.saveBudget(newBudget);
            
            // Set as current budget
            this.currentBudget = newBudget;
            
            this.showSuccessMessage('Budget created successfully');
        } else if (action === 'edit') {
            // Find budget to edit
            if (!budgetId) {
                this.showErrorMessage('No budget ID provided for editing');
                return;
            }
            
            // Get existing budget
            const budget = this.loadBudgetById(budgetId);
            if (!budget) {
                this.showErrorMessage('Budget not found');
                return;
            }
            
            // Update budget details
            budget.name = name;
            budget.start_date = startDate;
            budget.end_date = endDate;
            
            // Save to localStorage
            this.saveBudget(budget);
            
            // Set as current budget if it's different
            if (this.currentBudget && this.currentBudget.id !== budget.id) {
                this.currentBudget = budget;
            }
            
            this.showSuccessMessage('Budget updated successfully');
        } else {
            this.showErrorMessage('Invalid form action');
            return;
        }
        
        // Close modal and update UI
        this.closeAllModals();
        this.updateUI();
    },
    
    // Load budget by ID
    loadBudgetById: function(budgetId) {
        console.log('Loading budget by ID:', budgetId);
        
        if (!budgetId) {
            console.error('No budget ID provided');
            return null;
        }
        
        try {
            // Get budgets from localStorage
            const storedBudgets = localStorage.getItem('budgets');
            if (!storedBudgets) {
                return null;
            }
            
            const budgets = JSON.parse(storedBudgets);
            return budgets.find(budget => budget.id === budgetId) || null;
        } catch (error) {
            console.error('Error loading budget by ID:', error);
            return null;
        }
    },
    
    // Handle category form submission
    handleCategoryFormSubmit: function() {
        console.log('Handling category form submission');
        
        const form = document.getElementById('category-form');
        if (!form) {
            this.showErrorMessage('Category form not found');
            return;
        }
        
        // Get form data
        const action = form.dataset.action;
        const categoryId = form.dataset.categoryId;
        const selectElement = form.querySelector('#category-select');
        const amountInput = form.querySelector('#category-amount');
        
        // Validate form elements
        if (!selectElement || !amountInput) {
            this.showErrorMessage('Form elements missing');
            return;
        }
        
        const selectedCategoryId = action === 'edit' ? categoryId : selectElement.value;
        const amount = parseFloat(amountInput.value) || 0;
        
        // Validate inputs
        if (!selectedCategoryId) {
            this.showErrorMessage('Please select a category');
            return;
        }
        
        if (amount <= 0) {
            this.showErrorMessage('Please enter a valid amount greater than zero');
            return;
        }
        
        // Check if we have a current budget
        if (!this.currentBudget) {
            this.showErrorMessage('No budget selected');
            return;
        }
        
        // Process based on action
        if (action === 'add') {
            // Add new category to budget
            this.currentBudget.categories.push({
                category_id: selectedCategoryId,
                amount: amount,
                spent: 0
            });
            
            this.showSuccessMessage('Category added to budget');
        } else if (action === 'edit') {
            // Find and update existing category
            const categoryIndex = this.currentBudget.categories.findIndex(c => c.category_id === selectedCategoryId);
            
            if (categoryIndex !== -1) {
                this.currentBudget.categories[categoryIndex].amount = amount;
                this.showSuccessMessage('Category updated successfully');
            } else {
                this.showErrorMessage('Category not found in budget');
                return;
            }
        } else {
            this.showErrorMessage('Invalid form action');
            return;
        }
        
        // Save to localStorage and update UI
        this.saveBudget(this.currentBudget);
        this.closeAllModals();
        this.updateUI();
    },
    
    // Delete category from budget
    deleteCategoryFromBudget: function(categoryId) {
        console.log('Deleting category from budget:', categoryId);
        
        if (!this.currentBudget || !categoryId) {
            this.showErrorMessage('Cannot delete: Missing budget or category ID');
            return;
        }
        
        // Find category
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            this.showErrorMessage('Category not found');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to remove ${category.name} from this budget?`)) {
            return;
        }
        
        // Remove category from budget
        this.currentBudget.categories = this.currentBudget.categories.filter(c => c.category_id !== categoryId);
        
        // Save to localStorage and update UI
        this.saveBudget(this.currentBudget);
        this.closeAllModals();
        this.updateUI();
        
        this.showSuccessMessage(`${category.name} removed from budget`);
    },
    
    // Update budget selector dropdown
    updateBudgetSelector: function() {
        console.log('Updating budget selector');
        
        const selector = document.getElementById('budget-selector');
        if (!selector) {
            console.error('Budget selector not found');
            return;
        }
        
        // Clear existing options
        selector.innerHTML = '';
        
        try {
            // Get budgets from localStorage
            const storedBudgets = localStorage.getItem('budgets');
            const budgets = storedBudgets ? JSON.parse(storedBudgets) : [];
            
            if (budgets.length === 0) {
                // If no budgets, add placeholder
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No budgets available';
                option.disabled = true;
                option.selected = true;
                selector.appendChild(option);
            } else {
                // Add all budgets to selector
                budgets.forEach(budget => {
                    const option = document.createElement('option');
                    option.value = budget.id;
                    option.textContent = budget.name;
                    
                    // Select current budget if available
                    if (this.currentBudget && budget.id === this.currentBudget.id) {
                        option.selected = true;
                    }
                    
                    selector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error updating budget selector:', error);
        }
    },
    
    // Update budget details section
    updateBudgetDetails: function() {
        console.log('Updating budget details');
        
        if (!this.currentBudget) {
            return;
        }
        
        // Update budget name
        const budgetNameElement = document.getElementById('current-budget-name');
        if (budgetNameElement) {
            budgetNameElement.textContent = this.currentBudget.name;
        }
        
        // Update date range
        const dateRangeElement = document.getElementById('budget-date-range');
        if (dateRangeElement) {
            const startDate = new Date(this.currentBudget.start_date);
            const endDate = new Date(this.currentBudget.end_date);
            
            const formattedStartDate = startDate.toLocaleDateString();
            const formattedEndDate = endDate.toLocaleDateString();
            
            dateRangeElement.textContent = `${formattedStartDate} - ${formattedEndDate}`;
        }
        
        // Calculate total budget and spent
        let totalBudgeted = 0;
        let totalSpent = 0;
        
        this.currentBudget.categories.forEach(category => {
            totalBudgeted += category.amount;
            totalSpent += category.spent;
        });
        
        // Update budget summary
        const totalBudgetElement = document.getElementById('total-budget-amount');
        const spentAmountElement = document.getElementById('spent-amount');
        const remainingAmountElement = document.getElementById('remaining-amount');
        
        if (totalBudgetElement) {
            totalBudgetElement.textContent = this.formatCurrency(totalBudgeted);
        }
        
        if (spentAmountElement) {
            spentAmountElement.textContent = this.formatCurrency(totalSpent);
        }
        
        if (remainingAmountElement) {
            const remaining = totalBudgeted - totalSpent;
            remainingAmountElement.textContent = this.formatCurrency(remaining);
            
            // Add class based on remaining amount
            remainingAmountElement.classList.remove('positive', 'negative');
            remainingAmountElement.classList.add(remaining >= 0 ? 'positive' : 'negative');
        }
    },
    
    // Handle sort button click
    handleSortButtonClick: function(field) {
        console.log('Sorting by field:', field);
        
        // If clicking the same field, toggle direction
        if (field === this.currentSortField) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // If clicking new field, set it and default to desc
            this.currentSortField = field;
            this.currentSortDirection = 'desc';
        }
        
        // Update sort buttons UI
        this.updateSortButtonsUI();
        
        // Re-render categories with new sort
        this.renderCategories();
    },
    
    // Update sort buttons UI to show active sort
    updateSortButtonsUI: function() {
        console.log('Updating sort buttons UI');
        
        // Get all sort buttons
        const sortButtons = document.querySelectorAll('.sort-button');
        
        // Remove active class from all buttons
        sortButtons.forEach(button => {
            button.classList.remove('active', 'asc', 'desc');
            // Clear arrow indicators
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sort';
            }
        });
        
        // Find active button and update it
        const activeButton = document.querySelector(`.sort-button[data-sort="${this.currentSortField}"]`);
        if (activeButton) {
            activeButton.classList.add('active', this.currentSortDirection);
            
            // Update icon
            const icon = activeButton.querySelector('i');
            if (icon) {
                icon.className = this.currentSortDirection === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            }
        }
    },
    
    // Attach all event listeners
    attachEventListeners: function() {
        console.log('Attaching event listeners');
        
        // Budget selector change event
        const budgetSelector = document.getElementById('budget-selector');
        if (budgetSelector) {
            budgetSelector.addEventListener('change', (e) => {
                const selectedBudgetId = e.target.value;
                if (selectedBudgetId) {
                    this.switchBudget(selectedBudgetId);
                }
            });
        }
        
        // Create budget button
        const createBudgetBtn = document.getElementById('create-budget-btn');
        if (createBudgetBtn) {
            createBudgetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCreateBudgetModal();
            });
        }
        
        // Add category button
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddCategoryModal();
            });
        }
        
        // Budget form submission
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBudgetFormSubmit();
            });
        }
        
        // Category form submission
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategoryFormSubmit();
            });
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAllModals();
            });
        });
        
        // Modal overlay click to close
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                // Only close if clicking directly on the overlay, not on modal content
                if (e.target === modalOverlay) {
                    this.closeAllModals();
                }
            });
        }
        
        // Category delete button in edit modal
        const deleteCategoryBtn = document.getElementById('delete-category-btn');
        if (deleteCategoryBtn) {
            deleteCategoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = document.getElementById('category-form').dataset.categoryId;
                if (categoryId) {
                    this.deleteCategoryFromBudget(categoryId);
                }
            });
        }
        
        // Sort buttons
        const sortButtons = document.querySelectorAll('.sort-button');
        sortButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const sortField = button.dataset.sort;
                if (sortField) {
                    this.handleSortButtonClick(sortField);
                }
            });
        });
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready, initializing Budget Manager');
    BudgetManager.init();
});
