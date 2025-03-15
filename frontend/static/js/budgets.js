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
        console.log('Initializing Budget Manager');
        
        // Check if all required DOM elements exist
        if (!this.checkDOMElements()) {
            console.error('Budget initialization failed - missing DOM elements');
            
            // Show error message directly (not using our helper since it might depend on missing elements)
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '20px';
            errorDiv.style.textAlign = 'center';
            errorDiv.innerHTML = '<strong>Error:</strong> The budget page could not be initialized properly. Please reload the page or contact support.';
            
            document.body.prepend(errorDiv);
            return;
        }
        
        // Set default sort
        this.currentSortField = 'amount';
        this.currentSortDirection = 'desc';
        
        // Set default chart period
        this.currentChartPeriod = 'monthly';
        
        console.log('Set default sort fields and chart period');
        
        // Show loading state
        this.setLoading(true);
        console.log('Set loading state to true');
        
        try {
            // Load data
            console.log('Loading categories and current budget');
            
            // Load categories
            this.loadCategories();
            console.log('Categories loaded:', this.categories.length, 'categories');
            
            // Load current budget
            this.loadCurrentBudget();
            console.log('Current budget loaded:', this.currentBudget ? this.currentBudget.name : 'No budget');
            
            // Hide loading
            this.setLoading(false);
            console.log('Set loading state to false');
            
            // Update UI
            this.updateUI();
            console.log('UI updated');
            
            // Attach event listeners
            this.attachEventListeners();
            console.log('Event listeners attached');
            
            // Update sort buttons UI
            this.updateSortButtonsUI();
            console.log('Sort buttons UI updated');
            
            console.log('Budget Manager initialization complete');
        } catch (error) {
            console.error('Error initializing Budget Manager:', error);
            this.setLoading(false);
            this.showErrorMessage('Failed to load budget data. Please try again.');
        }
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
        console.log('Starting UI update');
        
        try {
            // Hide loading, error, and success messages
            this.setLoading(false);
            console.log('Hiding loading indicator');
            
            // Hide message containers if they exist
            const errorContainer = document.getElementById('error-container');
            const successContainer = document.getElementById('success-container');
            
            if (errorContainer) errorContainer.style.display = 'none';
            if (successContainer) successContainer.style.display = 'none';
            
            // Update budget selector
            console.log('Updating budget selector');
            this.updateBudgetSelector();
            
            // If no current budget, show message
            if (!this.currentBudget) {
                console.log('No current budget, showing no-budget message');
                const noBudgetMessage = document.getElementById('no-budget-message');
                const budgetDashboard = document.getElementById('budget-dashboard');
                
                if (budgetDashboard) budgetDashboard.style.display = 'none';
                if (noBudgetMessage) noBudgetMessage.style.display = 'block';
                return;
            }
            
            // Show dashboard, hide no budget message
            console.log('Current budget found, showing dashboard');
            const budgetDashboard = document.getElementById('budget-dashboard');
            const noBudgetMessage = document.getElementById('no-budget-message');
            
            if (budgetDashboard) budgetDashboard.style.display = 'block';
            if (noBudgetMessage) noBudgetMessage.style.display = 'none';
            
            // Update budget details
            console.log('Updating budget details');
            this.updateBudgetDetails();
            
            // Render categories
            console.log('Rendering categories');
            this.renderCategories();
            
            // Update chart
            console.log('Updating budget chart');
            this.updateBudgetChart();
            
            console.log('UI update completed');
        } catch (error) {
            console.error('Error updating UI:', error);
            this.setLoading(false); // Ensure loading indicator is hidden even if there's an error
            this.showErrorMessage('There was an error updating the budget display. Please try refreshing the page.');
        }
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
        console.log('Loading current budget');
        try {
            const currentBudgetId = localStorage.getItem('currentBudgetId');
            console.log('Current budget ID from localStorage:', currentBudgetId);
            
            // If we have a current budget ID, try to load that specific budget
            if (currentBudgetId) {
                const savedBudgets = localStorage.getItem('budgets');
                
                if (savedBudgets) {
                    try {
                        const budgets = JSON.parse(savedBudgets);
                        console.log('Successfully parsed budgets array with', budgets.length, 'budgets');
                        
                        // Find the current budget
                        const budget = budgets.find(b => b.id === currentBudgetId);
                        if (budget) {
                            console.log('Found current budget:', budget.name);
                            this.currentBudget = budget;
                            return budget;
                        } else {
                            console.log('Could not find budget with ID', currentBudgetId);
                        }
                        
                        // If current budget not found but we have budgets, use the first one
                        if (budgets.length > 0) {
                            console.log('Using first budget instead:', budgets[0].name);
                            localStorage.setItem('currentBudgetId', budgets[0].id);
                            this.currentBudget = budgets[0];
                            return budgets[0];
                        }
                    } catch (parseError) {
                        console.error('Error parsing budgets from localStorage:', parseError);
                    }
                }
            }
            
            // If no current budget ID or couldn't find budget, check if we have any budgets
            const savedBudgets = localStorage.getItem('budgets');
            if (savedBudgets) {
                try {
                    const budgets = JSON.parse(savedBudgets);
                    if (budgets && budgets.length > 0) {
                        // Use the first budget and set it as current
                        console.log('Setting first available budget as current:', budgets[0].name);
                        localStorage.setItem('currentBudgetId', budgets[0].id);
                        this.currentBudget = budgets[0];
                        return budgets[0];
                    }
                } catch (parseError) {
                    console.error('Error parsing budgets from localStorage:', parseError);
                }
            }
            
            // If no budgets exist, create a default budget
            console.log('No budgets found, creating default budget');
            const defaultBudget = this.getDefaultBudget();
            console.log('Default budget created:', defaultBudget.name);
            
            // Save default budget
            const budgets = [defaultBudget];
            localStorage.setItem('budgets', JSON.stringify(budgets));
            localStorage.setItem('currentBudgetId', defaultBudget.id);
            
            this.currentBudget = defaultBudget;
            return defaultBudget;
        } catch (error) {
            console.error('Error in loadCurrentBudget:', error);
            
            // Create an emergency default budget as fallback
            const emergencyBudget = this.getDefaultBudget();
            this.currentBudget = emergencyBudget;
            return emergencyBudget;
        }
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
        
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
            console.log('Debug: Updated display of loading element to:', loadingElement.style.display);
        }
        
        if (contentElement) {
            contentElement.style.display = isLoading ? 'none' : 'block';
            console.log('Debug: Updated display of content element to:', contentElement.style.display);
        }
        
        if (!loadingElement || !contentElement) {
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
                icon: categoryDetails.icon || 'tag',
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
            categoryIcon.innerHTML = `<i class="fas fa-${category.icon}" style="color: ${category.color};"></i>`;
            
            // Create category name
            const categoryName = document.createElement('div');
            categoryName.className = 'category-name';
            categoryName.textContent = category.name;
            
            // Add icon and name to header
            categoryHeader.appendChild(categoryIcon);
            categoryHeader.appendChild(categoryName);
            
            // Create edit button with proper styling
            const editButton = document.createElement('button');
            editButton.className = 'edit-category-btn btn-primary';
            editButton.setAttribute('data-category-id', category.id);
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.style.backgroundColor = '#007bff';
            editButton.style.color = 'white';
            editButton.style.border = 'none';
            editButton.style.borderRadius = '4px';
            editButton.style.width = '30px';
            editButton.style.height = '30px';
            editButton.style.display = 'flex';
            editButton.style.alignItems = 'center';
            editButton.style.justifyContent = 'center';
            editButton.style.cursor = 'pointer';
            
            // Add click event directly
            const self = this;
            editButton.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-category-id');
                console.log('Edit button clicked for category:', id);
                self.showEditCategoryModal(id);
            };
            
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
        
        // Add category button
        const addCategoryDiv = document.createElement('div');
        addCategoryDiv.className = 'add-category-container';
        addCategoryDiv.style.textAlign = 'center';
        addCategoryDiv.style.margin = '20px 0';
        
        const addCategoryBtn = document.createElement('button');
        addCategoryBtn.id = 'add-category-btn';
        addCategoryBtn.className = 'btn btn-primary';
        addCategoryBtn.innerHTML = '<i class="fas fa-plus"></i> Add Category';
        addCategoryBtn.onclick = (e) => {
            e.preventDefault();
            this.showAddCategoryModal();
        };
        
        addCategoryDiv.appendChild(addCategoryBtn);
        categoriesContainer.appendChild(addCategoryDiv);
        
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
        console.log('Updating budget chart for period:', this.currentChartPeriod || 'monthly');
        
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
        
        // Set default period if not set
        if (!this.currentChartPeriod) {
            this.currentChartPeriod = 'monthly';
        }
        
        // Update active state of period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            const period = btn.getAttribute('data-period');
            if (period === this.currentChartPeriod) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Prepare chart data based on period
        const chartData = this.prepareChartData(this.currentChartPeriod);
        
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
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        fontColor: '#333'
                    }
                },
                cutoutPercentage: 70,
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const total = dataset.data.reduce((acc, val) => acc + val, 0);
                            const value = dataset.data[tooltipItem.index];
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${data.labels[tooltipItem.index]}: ${this.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        });
    },
    
    // Prepare data for chart
    prepareChartData: function(period = 'monthly') {
        console.log('Preparing chart data for period:', period);
        
        const labels = [];
        const data = [];
        const colors = [];
        
        // Default color palette
        const defaultColors = [
            '#4285F4', // Blue
            '#EA4335', // Red
            '#FBBC05', // Yellow
            '#34A853', // Green
            '#FF6D01', // Orange
            '#46BFBD', // Teal
            '#AC92EC', // Purple
            '#FF6384', // Pink
            '#36A2EB', // Light Blue
            '#FFCE56'  // Light Yellow
        ];
        
        // Filter transactions based on period if needed
        let filteredCategories = this.currentBudget.categories;
        
        // If we have transaction data, we can filter by date
        // This is a placeholder for actual date filtering logic
        // In a real app, you would filter transactions based on date range
        if (period === 'quarterly') {
            console.log('Filtering data for quarterly view');
            // Adjust data for quarterly view (for demo purposes, we'll just use the same data)
            // In a real implementation, this would filter transactions from the last quarter
        } else if (period === 'yearly') {
            console.log('Filtering data for yearly view');
            // Adjust data for yearly view (for demo purposes, we'll just use the same data)
            // In a real implementation, this would filter transactions from the last year
        } else {
            // Default to monthly
            console.log('Filtering data for monthly view');
            // In a real implementation, this would filter transactions from the last month
        }
        
        // Get spending by category from filtered data
        filteredCategories.forEach((budgetCategory, index) => {
            // Find category details
            const categoryDetails = this.categories.find(c => c.id === budgetCategory.category_id);
            if (!categoryDetails) {
                return;
            }
            
            // Add to chart data even if no spending
            // Only skip if explicitly 0 spent
            if (budgetCategory.spent === 0) {
                return;
            }
            
            // Add to chart data
            labels.push(categoryDetails.name);
            data.push(budgetCategory.spent);
            
            // Use category color if available, otherwise use from default palette
            const color = categoryDetails.color || defaultColors[index % defaultColors.length];
            colors.push(color);
        });
        
        // If no data, add a placeholder
        if (labels.length === 0) {
            labels.push('No spending data');
            data.push(1);
            colors.push('#cccccc');
        }
        
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
        console.log('Debug: attachCategoryEventListeners - Attaching category-specific event listeners');
        
        // Edit category buttons
        const editButtons = document.querySelectorAll('.edit-category-btn');
        console.log(`Debug: Found ${editButtons.length} edit category buttons`);
        
        editButtons.forEach((button, index) => {
            // Clone to remove existing listeners
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            
            // Add click event
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = newButton.dataset.categoryId || 
                                  newButton.getAttribute('data-category-id') ||
                                  (newButton.closest('.category-card') ? 
                                   newButton.closest('.category-card').dataset.categoryId : null);
                
                console.log('Debug: Edit button clicked for category ID:', categoryId);
                
                if (categoryId) {
                    this.showEditCategoryModal(categoryId);
                } else {
                    console.error('Debug: No category ID found for edit button');
                }
            });
            
            console.log(`Debug: Attached click event to edit button ${index}`);
        });
        
        console.log('Debug: Category event listeners attached');
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
        safeAddEventListener('#add-category-to-budget', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Add category to budget button clicked');
            this.addCategoryToBudgetForm();
        });
        
        // Cancel buttons
        safeAddEventListener('.cancel-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Cancel button clicked');
            this.closeAllModals();
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
            modal.style.display = 'none';
        });
        
        // Hide overlay
        if (overlay) {
            overlay.style.display = 'none';
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
        const modalTitle = budgetModal.querySelector('#budget-modal-title');
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
        const categoriesList = budgetModal.querySelector('#budget-categories-container');
        if (categoriesList) {
            categoriesList.innerHTML = '';
        }
        
        // Set up Add Category button for the budget form
        const addCategoryBtn = budgetModal.querySelector('#add-category-to-budget');
        if (addCategoryBtn) {
            // Remove old event listeners
            const newAddCategoryBtn = addCategoryBtn.cloneNode(true);
            addCategoryBtn.parentNode.replaceChild(newAddCategoryBtn, addCategoryBtn);
            
            // Add new event listener
            const self = this;
            newAddCategoryBtn.onclick = function(e) {
                e.preventDefault();
                console.log('Add category to budget button clicked in budget modal');
                self.addCategoryToBudgetForm();
            };
        }
        
        // Add event listener to cancel button
        const cancelButton = budgetModal.querySelector('#cancel-budget-btn');
        if (cancelButton) {
            // Remove old event listeners
            const newCancelButton = cancelButton.cloneNode(true);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            
            // Add new event listener
            const self = this;
            newCancelButton.onclick = function(e) {
                e.preventDefault();
                console.log('Cancel button clicked in budget modal');
                self.closeAllModals();
            };
        }
        
        // Show the modal
        budgetModal.style.display = 'block';
        modalOverlay.style.display = 'block';
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
            deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.padding = '6px 12px';
            deleteButton.style.marginRight = '10px';
            deleteButton.style.cursor = 'pointer';
            
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
        modal.style.display = 'block';
        overlay.style.display = 'block';
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
        modal.style.display = 'block';
        overlay.style.display = 'block';
    },
    
    // Add category to budget form
    addCategoryToBudgetForm: function() {
        console.log('Adding category to budget form');
        
        // Check if we have categories
        if (!this.categories || this.categories.length === 0) {
            this.showErrorMessage('No categories available to add.');
            return;
        }
        
        // Get the container for budget categories
        const container = document.getElementById('budget-categories-container');
        if (!container) {
            this.showErrorMessage('Budget categories container not found');
            return;
        }
        
        // Create a new category row
        const categoryRow = document.createElement('div');
        categoryRow.className = 'budget-category-row';
        
        // Create category select
        const categorySelect = document.createElement('select');
        categorySelect.className = 'category-select form-control';
        categorySelect.required = true;
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Category';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        categorySelect.appendChild(defaultOption);
        
        // Get already used categories
        const existingRows = container.querySelectorAll('.budget-category-row');
        const usedCategoryIds = Array.from(existingRows)
            .map(row => row.querySelector('.category-select'))
            .filter(select => select && select.value)
            .map(select => select.value);
        
        // Add categories to the select
        this.categories.forEach(category => {
            // Skip if already used
            if (usedCategoryIds.includes(category.id)) {
                return;
            }
            
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // Create amount input
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'amount-input form-control';
        amountInput.min = '0';
        amountInput.step = '0.01';
        amountInput.placeholder = 'Amount';
        amountInput.required = true;
        
        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-danger remove-category-btn';
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        removeButton.addEventListener('click', () => {
            categoryRow.remove();
            this.updateBudgetTotal();
        });
        
        // Create row layout
        const selectContainer = document.createElement('div');
        selectContainer.className = 'category-select-container';
        selectContainer.appendChild(categorySelect);
        
        const amountContainer = document.createElement('div');
        amountContainer.className = 'amount-container';
        amountContainer.appendChild(amountInput);
        
        // Add all elements to the row
        categoryRow.appendChild(selectContainer);
        categoryRow.appendChild(amountContainer);
        categoryRow.appendChild(removeButton);
        
        // Add change event to the amount input to update the total
        amountInput.addEventListener('change', () => {
            this.updateBudgetTotal();
        });
        
        // Add the row to the container
        container.appendChild(categoryRow);
        
        // Update the total budget amount
        this.updateBudgetTotal();
    },
    
    // Update the total budget amount
    updateBudgetTotal: function() {
        const totalElement = document.getElementById('budget-total');
        if (!totalElement) return;
        
        const container = document.getElementById('budget-categories-container');
        if (!container) return;
        
        // Get all amount inputs
        const amountInputs = container.querySelectorAll('.amount-input');
        
        // Calculate total
        let total = 0;
        amountInputs.forEach(input => {
            const amount = parseFloat(input.value) || 0;
            total += amount;
        });
        
        // Update total display
        totalElement.textContent = this.formatCurrency(total);
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
        
        // Get categories from the form
        const categoriesContainer = document.getElementById('budget-categories-container');
        const categoryRows = categoriesContainer ? categoriesContainer.querySelectorAll('.budget-category-row') : [];
        
        const categories = [];
        let hasInvalidCategory = false;
        
        // Process each category row
        categoryRows.forEach(row => {
            const categorySelect = row.querySelector('.category-select');
            const amountInput = row.querySelector('.amount-input');
            
            if (!categorySelect || !amountInput) {
                hasInvalidCategory = true;
                return;
            }
            
            const categoryId = categorySelect.value;
            const amount = parseFloat(amountInput.value) || 0;
            
            if (!categoryId || amount <= 0) {
                hasInvalidCategory = true;
                return;
            }
            
            categories.push({
                category_id: categoryId,
                amount: amount,
                spent: 0
            });
        });
        
        if (hasInvalidCategory) {
            this.showErrorMessage('One or more categories are invalid');
            return;
        }
        
        if (action === 'create') {
            // Create new budget
            const now = new Date();
            const newBudget = {
                id: 'budget-' + Date.now(),
                name: name,
                start_date: startDate,
                end_date: endDate,
                created: now.toISOString(),
                lastModified: now.toISOString(),
                categories: categories
            };
            
            // Save to localStorage
            this.saveBudget(newBudget);
            
            // Set as current budget
            this.currentBudget = newBudget;
            localStorage.setItem('currentBudgetId', newBudget.id);
            
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
            budget.lastModified = new Date().toISOString();
            
            // Update categories if provided
            if (categories.length > 0) {
                budget.categories = categories;
            }
            
            // Save to localStorage
            this.saveBudget(budget);
            
            // Set as current budget if it's different
            if (this.currentBudget && this.currentBudget.id !== budget.id) {
                this.currentBudget = budget;
                localStorage.setItem('currentBudgetId', budget.id);
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
        
        console.log('Form action:', action);
        console.log('Selected category ID:', selectedCategoryId);
        console.log('Amount:', amount);
        
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
            
            console.log('Category index:', categoryIndex);
            console.log('Current budget categories:', JSON.stringify(this.currentBudget.categories));
            
            if (categoryIndex !== -1) {
                console.log('Updating category at index', categoryIndex);
                console.log('Old amount:', this.currentBudget.categories[categoryIndex].amount);
                console.log('New amount:', amount);
                
                // Update the amount
                this.currentBudget.categories[categoryIndex].amount = amount;
                
                console.log('Updated category:', JSON.stringify(this.currentBudget.categories[categoryIndex]));
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
        const saveResult = this.saveBudget(this.currentBudget);
        console.log('Save result:', saveResult);
        
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
        
        const selector = document.getElementById('budget-period-select');
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
        
        // Calculate total budget and spent
        let totalBudgeted = 0;
        let totalSpent = 0;
        
        this.currentBudget.categories.forEach(category => {
            totalBudgeted += parseFloat(category.amount || 0);
            totalSpent += parseFloat(category.spent || 0);
        });
        
        // Update budget summary
        const totalBudgetElement = document.getElementById('total-budget');
        const spentAmountElement = document.getElementById('total-spent');
        const remainingAmountElement = document.getElementById('remaining-budget');
        const budgetProgressElement = document.getElementById('budget-progress');
        
        // Update total budget
        if (totalBudgetElement) {
            totalBudgetElement.textContent = this.formatCurrency(totalBudgeted);
        }
        
        // Update total spent
        if (spentAmountElement) {
            spentAmountElement.textContent = this.formatCurrency(totalSpent);
            // Add negative class if over budget
            spentAmountElement.className = 'card-value ' + (totalSpent > totalBudgeted ? 'negative' : '');
        }
        
        // Update remaining amount
        if (remainingAmountElement) {
            const remaining = totalBudgeted - totalSpent;
            remainingAmountElement.textContent = this.formatCurrency(remaining);
            remainingAmountElement.className = 'card-value ' + (remaining < 0 ? 'negative' : 'positive');
        }
        
        // Update progress bar
        if (budgetProgressElement) {
            const progressBar = budgetProgressElement.querySelector('.progress-bar');
            const progressText = budgetProgressElement.querySelector('.progress-text');
            
            if (progressBar && progressText) {
                // Calculate percentage
                const percentSpent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
                
                // Update progress bar
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
                
                // Update text
                progressText.textContent = percentSpent.toFixed(1) + '%';
            }
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
        console.log('Debug: attachEventListeners - Starting to attach event listeners');
        
        // Helper function to safely add event listener
        const safeAddEventListener = (selector, event, handler) => {
            const elements = document.querySelectorAll(selector);
            console.log(`Debug: Found ${elements.length} elements matching selector "${selector}"`);
            
            elements.forEach((element, index) => {
                // Clone element to remove any existing event listeners
                const newElement = element.cloneNode(true);
                if (element.parentNode) {
                    element.parentNode.replaceChild(newElement, element);
                    console.log(`Debug: Replaced element ${index} to clear existing listeners`);
                }
                
                // Add new event listener
                newElement.addEventListener(event, handler);
                console.log(`Debug: Added ${event} event listener to element ${index}`);
            });
            
            return elements.length > 0;
        };
        
        // Budget selector change event
        safeAddEventListener('#budget-period-select', 'change', (e) => {
            const selectedBudgetId = e.target.value;
            if (selectedBudgetId) {
                console.log('Debug: Budget selector changed to', selectedBudgetId);
                this.switchBudget(selectedBudgetId);
            }
        });
        
        // Create budget button (both main and in no-budget message)
        safeAddEventListener('#create-budget-btn, #create-first-budget-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Create budget button clicked');
            this.showCreateBudgetModal();
        });
        
        // Add category button in the budget dashboard
        safeAddEventListener('#manage-categories-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Manage categories button clicked');
            this.showAddCategoryModal();
        });
        
        // Add category button (dynamically added)
        safeAddEventListener('#add-category-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Add category button clicked');
            this.showAddCategoryModal();
        });
        
        // Add category to budget button in the budget form 
        safeAddEventListener('#add-category-to-budget', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Add category to budget button clicked');
            this.addCategoryToBudgetForm();
        });
        
        // Chart period selectors (monthly, quarterly, yearly)
        safeAddEventListener('.period-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Chart period button clicked');
            
            // Get the selected period
            const period = e.currentTarget.getAttribute('data-period');
            if (!period) return;
            
            // Update active state
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.currentTarget.classList.add('active');
            
            // Store the current period
            this.currentChartPeriod = period;
            
            // Update the chart with the new period
            this.updateBudgetChart();
        });
        
        // Budget form submission
        safeAddEventListener('#budget-form', 'submit', (e) => {
            e.preventDefault();
            console.log('Debug: Budget form submitted');
            this.handleBudgetFormSubmit();
        });
        
        // Category form submission
        safeAddEventListener('#category-form', 'submit', (e) => {
            e.preventDefault();
            console.log('Debug: Category form submitted');
            this.handleCategoryFormSubmit();
        });
        
        // Modal close buttons
        safeAddEventListener('.close-modal', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Close modal button clicked');
            this.closeAllModals();
        });
        
        // Cancel buttons
        safeAddEventListener('.cancel-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Debug: Cancel button clicked');
            this.closeAllModals();
        });
        
        // Modal overlay click to close
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            const newOverlay = modalOverlay.cloneNode(true);
            modalOverlay.parentNode.replaceChild(newOverlay, modalOverlay);
            
            newOverlay.addEventListener('click', (e) => {
                // Only close if clicking directly on the overlay, not on modal content
                if (e.target === newOverlay) {
                    console.log('Debug: Modal overlay clicked');
                    this.closeAllModals();
                }
            });
            console.log('Debug: Added click event listener to modal overlay');
        } else {
            console.log('Debug: Modal overlay not found');
        }
        
        // Category delete button in edit modal
        safeAddEventListener('.delete-btn', 'click', (e) => {
            e.preventDefault();
            const form = document.getElementById('category-form');
            if (form) {
                const categoryId = form.dataset.categoryId;
                if (categoryId) {
                    console.log('Debug: Delete category button clicked for category', categoryId);
                    this.deleteCategoryFromBudget(categoryId);
                } else {
                    console.log('Debug: No category ID found in form data attributes');
                }
            } else {
                console.log('Debug: Category form not found for delete operation');
            }
        });
        
        // Sort buttons
        safeAddEventListener('.sort-button', 'click', (e) => {
            e.preventDefault();
            const sortField = e.currentTarget.dataset.sort;
            if (sortField) {
                console.log('Debug: Sort button clicked for field', sortField);
                this.handleSortButtonClick(sortField);
            }
        });
        
        // Attach category-specific event listeners
        this.attachCategoryEventListeners();
        
        console.log('Debug: All event listeners attached');
    },
    
    // Helper function to check if important elements exist
    checkDOMElements: function() {
        const elementsToCheck = [
            'budgets-loading', 
            'budgets-content',
            'budget-dashboard', 
            'no-budget-message',
            'budget-period-select',
            'budget-categories-container'
        ];
        
        let allFound = true;
        const missing = [];
        
        elementsToCheck.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Debug: Critical element #${id} not found`);
                missing.push(id);
                allFound = false;
            }
        });
        
        if (!allFound) {
            console.error('Debug: Some critical elements are missing:', missing.join(', '));
        } else {
            console.log('Debug: All critical elements found');
        }
        
        return allFound;
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is ready, initializing Budget Manager');
    BudgetManager.init();
});
