// Reports.js - Manages the reports page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the reports page
    initReportsPage();

    // Setup event listeners
    setupEventListeners();
});

// Main initialization function
async function initReportsPage() {
    try {
        // Show loading indicator
        setLoading(true);
        
        // Set default date range (last 30 days)
        setDefaultDateRange();
        
        // Generate an initial report (without showing error if data empty)
        await generateReport(true);
        
        // Setup chart
        setupChartTypeListener();
        
        // Show success message
        showSuccess('Reports loaded successfully!');
        
    } catch (error) {
        console.error('Error initializing reports page:', error);
        showError('Failed to initialize reports page. Please try again later.');
        
        // Try to render a default report with mock data
        try {
            renderMockReport();
        } catch (e) {
            console.error('Failed to render mock report:', e);
        }
    } finally {
        // Hide loading indicator
        setLoading(false);
    }
}

// Setup all event listeners for the reports page
function setupEventListeners() {
    // Report type selector
    const reportTypeSelect = document.getElementById('report-type-select');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', () => {
            const reportTitle = document.getElementById('report-title');
            if (reportTitle) {
                reportTitle.textContent = reportTypeSelect.options[reportTypeSelect.selectedIndex].text;
            }
            generateReport();
        });
    }

    // Generate report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => generateReport());
    }

    // Export report button
    const exportReportBtn = document.getElementById('export-report-btn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', showExportModal);
    }

    // Export modal close button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideExportModal);
    }

    // Cancel export button
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    if (cancelExportBtn) {
        cancelExportBtn.addEventListener('click', hideExportModal);
    }

    // Confirm export button
    const confirmExportBtn = document.getElementById('confirm-export-btn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', exportReport);
    }

    // Date range inputs
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', validateDateRange);
        endDateInput.addEventListener('change', validateDateRange);
    }
}

// Set default date range (last 30 days)
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.valueAsDate = startDate;
        endDateInput.valueAsDate = endDate;
    }
}

// Validate the date range
function validateDateRange() {
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    
    if (!startDateInput || !endDateInput) return true;
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    if (startDate > endDate) {
        showError('Start date cannot be after end date');
        return false;
    }
    
    // Limit date range to 1 year max
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate - startDate > oneYearInMs) {
        showError('Date range cannot exceed 1 year');
        return false;
    }
    
    return true;
}

// Generate a financial report based on selected parameters
async function generateReport(isInitial = false) {
    if (!validateDateRange()) return;
    
    try {
        setLoading(true);
        
        // Get selected report type and date range
        const reportType = document.getElementById('report-type-select').value;
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        // In a real app, fetch data from API
        // const response = await fetch(`/api/reports/${reportType}?start_date=${startDate}&end_date=${endDate}`);
        // const data = await response.json();
        
        // For mock purposes, generate mock data
        const data = generateMockReportData(reportType, startDate, endDate);
        
        // Update the UI with the report data
        updateReportUI(data, reportType);
        
        // Show the report content
        document.getElementById('reports-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error generating report:', error);
        if (!isInitial) {
            showError('Failed to generate report. Please try again later.');
        }
    } finally {
        setLoading(false);
    }
}

// Update the UI with report data
function updateReportUI(data, reportType) {
    // Update summary figures
    document.getElementById('total-income').textContent = formatCurrency(data.summary.totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(data.summary.totalExpenses);
    document.getElementById('net-cashflow').textContent = formatCurrency(data.summary.netCashflow);
    document.getElementById('avg-monthly-spending').textContent = formatCurrency(data.summary.avgMonthlySpending);
    
    // Apply appropriate classes for positive/negative values
    document.getElementById('net-cashflow').className = data.summary.netCashflow >= 0 ? 'card-value positive' : 'card-value negative';
    
    // Generate the chart
    generateChart(data, reportType);
    
    // Update details section
    updateReportDetails(data, reportType);
}

// Generate and display a chart based on report data
function generateChart(data, reportType) {
    // Check for standalone reports page chart
    let chartCanvas = document.getElementById('report-chart');
    
    // If not found, check for specific report chart canvases in the main reports page
    if (!chartCanvas) {
        switch (reportType) {
            case 'spending':
                chartCanvas = document.getElementById('spending-analysis-chart');
                break;
            case 'income':
                chartCanvas = document.getElementById('income-report-chart');
                break;
            case 'cashflow':
                chartCanvas = document.getElementById('cashflow-chart');
                break;
            case 'category-breakdown':
                chartCanvas = document.getElementById('category-breakdown-chart');
                break;
            case 'investment':
                chartCanvas = document.getElementById('investment-performance-chart');
                break;
        }
    }
    
    if (!chartCanvas) return;
    
    // Get current chart type (if available)
    const chartTypeSelect = document.getElementById('chart-type-select');
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'bar';
    
    // Clear any existing chart
    if (window.reportChart) {
        window.reportChart.destroy();
    }
    
    // Configure chart options based on report type
    const chartConfig = createChartConfig(data, reportType, chartType);
    
    // Create chart
    window.reportChart = new Chart(chartCanvas, chartConfig);
}

// Create chart configuration based on report type and data
function createChartConfig(data, reportType, chartType) {
    let chartConfig = {
        type: chartType,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    };
    
    // Configure chart data based on report type
    switch (reportType) {
        case 'spending':
            chartConfig.data = {
                labels: data.categories.map(cat => cat.name),
                datasets: [{
                    label: 'Spending by Category',
                    data: data.categories.map(cat => Math.abs(cat.amount)),
                    backgroundColor: generateColorArray(data.categories.length),
                    borderWidth: 1
                }]
            };
            break;
            
        case 'income':
            chartConfig.data = {
                labels: data.incomeBySource.map(source => source.name),
                datasets: [{
                    label: 'Income by Source',
                    data: data.incomeBySource.map(source => source.amount),
                    backgroundColor: generateColorArray(data.incomeBySource.length),
                    borderWidth: 1
                }]
            };
            break;
            
        case 'cashflow':
            chartConfig.data = {
                labels: data.monthlyData.map(month => month.month),
                datasets: [
                    {
                        label: 'Income',
                        data: data.monthlyData.map(month => month.income),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: data.monthlyData.map(month => Math.abs(month.expenses)),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            };
            break;
            
        case 'category-breakdown':
            chartConfig.data = {
                labels: data.categoryDetails.map(cat => cat.name),
                datasets: [{
                    label: 'Category Breakdown',
                    data: data.categoryDetails.map(cat => Math.abs(cat.amount)),
                    backgroundColor: generateColorArray(data.categoryDetails.length),
                    borderWidth: 1
                }]
            };
            break;
            
        case 'investment':
            chartConfig.data = {
                labels: data.investmentPerformance.map(inv => inv.month),
                datasets: [{
                    label: 'Portfolio Value',
                    data: data.investmentPerformance.map(inv => inv.value),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    fill: false
                }]
            };
            // For investment, force line chart
            chartConfig.type = 'line';
            break;
    }
    
    return chartConfig;
}

// Update the report details section based on report type
function updateReportDetails(data, reportType) {
    // Check for standalone reports page container
    let detailsContainer = document.getElementById('report-details-container');
    
    // If not found, check for specific report detail containers in the main reports page
    if (!detailsContainer) {
        switch (reportType) {
            case 'spending':
                detailsContainer = document.getElementById('spending-analysis-details');
                break;
            case 'income':
                detailsContainer = document.getElementById('income-report-details');
                break;
            case 'cashflow':
                detailsContainer = document.getElementById('cashflow-details');
                break;
            case 'category-breakdown':
                detailsContainer = document.getElementById('category-breakdown-details');
                break;
            case 'investment':
                detailsContainer = document.getElementById('investment-performance-details');
                break;
        }
    }
    
    if (!detailsContainer) return;
    
    let detailsHTML = '';
    
    switch (reportType) {
        case 'spending':
            detailsHTML = '<h3>Spending by Category</h3>';
            detailsHTML += '<div class="details-table-container">';
            detailsHTML += '<table class="details-table"><thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead><tbody>';
            
            const totalSpending = data.categories.reduce((sum, cat) => sum + Math.abs(cat.amount), 0);
            
            data.categories.forEach(category => {
                const percentage = totalSpending > 0 ? (Math.abs(category.amount) / totalSpending * 100).toFixed(1) : 0;
                detailsHTML += `<tr>
                    <td>${category.name}</td>
                    <td>${formatCurrency(Math.abs(category.amount))}</td>
                    <td>${percentage}%</td>
                </tr>`;
            });
            
            detailsHTML += '</tbody></table></div>';
            break;
            
        case 'income':
            detailsHTML = '<h3>Income by Source</h3>';
            detailsHTML += '<div class="details-table-container">';
            detailsHTML += '<table class="details-table"><thead><tr><th>Source</th><th>Amount</th><th>% of Total</th></tr></thead><tbody>';
            
            const totalIncome = data.incomeBySource.reduce((sum, source) => sum + source.amount, 0);
            
            data.incomeBySource.forEach(source => {
                const percentage = totalIncome > 0 ? (source.amount / totalIncome * 100).toFixed(1) : 0;
                detailsHTML += `<tr>
                    <td>${source.name}</td>
                    <td>${formatCurrency(source.amount)}</td>
                    <td>${percentage}%</td>
                </tr>`;
            });
            
            detailsHTML += '</tbody></table></div>';
            break;
            
        case 'cashflow':
            detailsHTML = '<h3>Monthly Cash Flow</h3>';
            detailsHTML += '<div class="details-table-container">';
            detailsHTML += '<table class="details-table"><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr></thead><tbody>';
            
            data.monthlyData.forEach(month => {
                const net = month.income + month.expenses;
                detailsHTML += `<tr>
                    <td>${month.month}</td>
                    <td>${formatCurrency(month.income)}</td>
                    <td>${formatCurrency(month.expenses)}</td>
                    <td class="${net >= 0 ? 'positive' : 'negative'}">${formatCurrency(net)}</td>
                </tr>`;
            });
            
            detailsHTML += '</tbody></table></div>';
            break;
            
        case 'category-breakdown':
            detailsHTML = '<h3>Category Breakdown</h3>';
            detailsHTML += '<div class="details-table-container">';
            detailsHTML += '<table class="details-table"><thead><tr><th>Category</th><th>Subcategory</th><th>Amount</th></tr></thead><tbody>';
            
            data.categoryDetails.forEach(category => {
                let firstSubcategory = true;
                
                if (category.subcategories.length === 0) {
                    detailsHTML += `<tr>
                        <td>${category.name}</td>
                        <td>-</td>
                        <td>${formatCurrency(Math.abs(category.amount))}</td>
                    </tr>`;
                } else {
                    category.subcategories.forEach(subcategory => {
                        detailsHTML += `<tr>
                            <td>${firstSubcategory ? category.name : ''}</td>
                            <td>${subcategory.name}</td>
                            <td>${formatCurrency(Math.abs(subcategory.amount))}</td>
                        </tr>`;
                        firstSubcategory = false;
                    });
                }
            });
            
            detailsHTML += '</tbody></table></div>';
            break;
            
        case 'investment':
            detailsHTML = '<h3>Investment Performance</h3>';
            detailsHTML += '<div class="details-table-container">';
            detailsHTML += '<table class="details-table"><thead><tr><th>Month</th><th>Value</th><th>Change</th><th>% Change</th></tr></thead><tbody>';
            
            data.investmentPerformance.forEach((month, index) => {
                if (index === 0) {
                    detailsHTML += `<tr>
                        <td>${month.month}</td>
                        <td>${formatCurrency(month.value)}</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>`;
                } else {
                    const previousValue = data.investmentPerformance[index - 1].value;
                    const change = month.value - previousValue;
                    const percentChange = previousValue !== 0 ? (change / previousValue * 100).toFixed(2) : '-';
                    
                    detailsHTML += `<tr>
                        <td>${month.month}</td>
                        <td>${formatCurrency(month.value)}</td>
                        <td class="${change >= 0 ? 'positive' : 'negative'}">${formatCurrency(change)}</td>
                        <td class="${change >= 0 ? 'positive' : 'negative'}">${percentChange}%</td>
                    </tr>`;
                }
            });
            
            detailsHTML += '</tbody></table></div>';
            break;
    }
    
    detailsContainer.innerHTML = detailsHTML;
}

// Setup chart type change listener
function setupChartTypeListener() {
    const chartTypeSelect = document.getElementById('chart-type-select');
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', () => {
            const reportType = document.getElementById('report-type-select').value;
            
            // Don't allow pie/doughnut for cashflow reports
            if (reportType === 'cashflow' && (chartTypeSelect.value === 'pie' || chartTypeSelect.value === 'doughnut')) {
                showError('Pie and doughnut charts are not suitable for cash flow reports');
                chartTypeSelect.value = 'bar';
                return;
            }
            
            // Force line chart for investment reports
            if (reportType === 'investment') {
                chartTypeSelect.value = 'line';
                showError('Investment reports are best viewed as line charts');
                return;
            }
            
            generateReport();
        });
    }
}

// Show export modal
function showExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Hide export modal
function hideExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export report (mock implementation)
function exportReport() {
    const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
    const filename = document.getElementById('export-filename').value;
    
    showSuccess(`Report exported as ${filename}.${exportFormat}`);
    hideExportModal();
}

// Generate an array of colors for charts
function generateColorArray(count) {
    const baseColors = [
        'rgba(255, 99, 132, 0.7)',    // Red
        'rgba(54, 162, 235, 0.7)',    // Blue
        'rgba(255, 206, 86, 0.7)',    // Yellow
        'rgba(75, 192, 192, 0.7)',    // Green
        'rgba(153, 102, 255, 0.7)',   // Purple
        'rgba(255, 159, 64, 0.7)',    // Orange
        'rgba(199, 199, 199, 0.7)',   // Gray
        'rgba(83, 102, 255, 0.7)',    // Indigo
        'rgba(78, 205, 196, 0.7)',    // Teal
        'rgba(255, 99, 255, 0.7)'     // Pink
    ];
    
    let colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

// Generate mock report data (for development purposes)
function generateMockReportData(reportType, startDate, endDate) {
    const data = {
        summary: {
            totalIncome: 8500,
            totalExpenses: -5200,
            netCashflow: 3300,
            avgMonthlySpending: 5200
        }
    };
    
    // Generate data based on report type
    switch (reportType) {
        case 'spending':
            data.categories = [
                { name: 'Housing', amount: -1800 },
                { name: 'Food', amount: -950 },
                { name: 'Transportation', amount: -450 },
                { name: 'Utilities', amount: -350 },
                { name: 'Entertainment', amount: -400 },
                { name: 'Healthcare', amount: -300 },
                { name: 'Clothing', amount: -250 },
                { name: 'Other', amount: -700 }
            ];
            break;
            
        case 'income':
            data.incomeBySource = [
                { name: 'Salary', amount: 6500 },
                { name: 'Freelance', amount: 1200 },
                { name: 'Investments', amount: 600 },
                { name: 'Other', amount: 200 }
            ];
            break;
            
        case 'cashflow':
            data.monthlyData = [
                { month: 'Jan', income: 8200, expenses: -5100 },
                { month: 'Feb', income: 8100, expenses: -5300 },
                { month: 'Mar', income: 8300, expenses: -5000 },
                { month: 'Apr', income: 8400, expenses: -5400 },
                { month: 'May', income: 8500, expenses: -5200 },
                { month: 'Jun', income: 8600, expenses: -5100 }
            ];
            break;
            
        case 'category-breakdown':
            data.categoryDetails = [
                { 
                    name: 'Housing', 
                    amount: -1800,
                    subcategories: [
                        { name: 'Rent', amount: -1500 },
                        { name: 'Insurance', amount: -150 },
                        { name: 'Maintenance', amount: -150 }
                    ]
                },
                { 
                    name: 'Food', 
                    amount: -950,
                    subcategories: [
                        { name: 'Groceries', amount: -600 },
                        { name: 'Restaurants', amount: -350 }
                    ]
                },
                { 
                    name: 'Transportation', 
                    amount: -450,
                    subcategories: [
                        { name: 'Fuel', amount: -250 },
                        { name: 'Public Transit', amount: -100 },
                        { name: 'Maintenance', amount: -100 }
                    ]
                },
                { 
                    name: 'Utilities', 
                    amount: -350,
                    subcategories: [
                        { name: 'Electricity', amount: -150 },
                        { name: 'Water', amount: -80 },
                        { name: 'Internet', amount: -120 }
                    ]
                }
            ];
            break;
            
        case 'investment':
            data.investmentPerformance = [
                { month: 'Jan', value: 15000 },
                { month: 'Feb', value: 15300 },
                { month: 'Mar', value: 15150 },
                { month: 'Apr', value: 15600 },
                { month: 'May', value: 16200 },
                { month: 'Jun', value: 16500 }
            ];
            break;
    }
    
    return data;
}

// Set loading state
function setLoading(isLoading) {
    const loader = document.getElementById('reports-loading');
    const content = document.getElementById('reports-content');
    
    if (!loader || !content) {
        console.error('Loading indicator or content elements not found!');
        return;
    }
    
    loader.style.display = isLoading ? 'flex' : 'none';
    content.style.display = isLoading ? 'none' : 'block';
    
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
        
        // Fallback: use error container with success styling
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.classList.add('success');
            const errorMessageEl = document.getElementById('error-message');
            if (errorMessageEl) {
                errorMessageEl.textContent = message;
                errorContainer.style.display = 'block';
                
                // Hide after 3 seconds
                setTimeout(() => {
                    errorContainer.style.display = 'none';
                    errorContainer.classList.remove('success');
                }, 3000);
            }
        }
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

// Render a mock report when real data fails to load
function renderMockReport() {
    // Get selected report type
    const reportType = document.getElementById('report-type-select').value || 'spending';
    
    // Get mock data for the selected report type
    const mockData = getMockReportData(reportType);
    
    // Render the report with mock data
    renderReportSummary(mockData);
    renderReportChart(mockData, reportType);
    renderReportDetails(mockData, reportType);
} 