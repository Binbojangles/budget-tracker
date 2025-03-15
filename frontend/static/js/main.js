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
    
    // Render summary cards
    renderSummaryCards(sampleData);
    
    // Render transactions
    renderTransactions(sampleData.transactions);
    
    // Initialize charts (placeholder for now)
    initCharts();
});

function renderSummaryCards(data) {
    const summaryContainer = document.getElementById('summary-cards');
    
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
    
    // Add some styling to the table
    const style = document.createElement('style');
    style.textContent = `
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
        }
        .transactions-table th, .transactions-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #eaeaea;
        }
        .transactions-table th {
            background-color: #f5f7fa;
            font-weight: 600;
        }
        .income .amount {
            color: #2ecc71;
        }
        .expense .amount {
            color: #e74c3c;
        }
    `;
    document.head.appendChild(style);
}

function initCharts() {
    const chartContainer = document.getElementById('chart-container');
    
    chartContainer.innerHTML = `
        <p>Charts will be implemented using a JavaScript library like Chart.js or D3.js.</p>
        <div class="chart-placeholder"></div>
    `;
    
    // Add some styling to the placeholder
    const style = document.createElement('style');
    style.textContent = `
        .chart-placeholder {
            height: 300px;
            background-color: #f5f7fa;
            border: 2px dashed #ccd6e0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 1rem;
        }
        .chart-placeholder:after {
            content: 'Spending visualization will appear here';
            color: #7f8c8d;
        }
    `;
    document.head.appendChild(style);
}

// Utility functions
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