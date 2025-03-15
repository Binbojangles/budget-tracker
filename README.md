# Budget Tracker

A comprehensive personal finance application that helps you track your expenses, monitor budgets, and visualize your financial health.

## Features

### Dashboard
- Financial overview with total assets, debt, and net worth
- Recent transactions listing
- Spending breakdown charts
- Budget progress tracking
- Responsive design for all device sizes

### Budget Management
- Create and manage monthly budgets
- Add custom categories with spending limits
- Visual progress bars for budget tracking
- Edit and delete budget categories
- Compare spending across different time periods

### Transactions
- Record income and expenses
- Categorize transactions for better analysis
- Filter and search transaction history
- Import transactions from CSV files

### Reports
- Spending analysis by category
- Income vs. expense comparisons
- Monthly trend reports
- Export reports as PDF or CSV

### User Experience
- Responsive design that works on desktop, tablet, and mobile
- Light and dark mode support for comfortable viewing
- Intuitive navigation and user-friendly interface
- Secure authentication system

## Technical Details

### Frontend
- HTML5, CSS3, and JavaScript
- Responsive design using custom CSS
- Chart.js for data visualization
- Theme switching between light and dark mode

### Backend
- Python with Flask framework
- SQLite database (configurable for PostgreSQL)
- RESTful API architecture
- JSON Web Token (JWT) authentication

## Recent Improvements

- Added dark mode support across all pages
- Fixed styling issues with financial overview elements in dashboard
- Improved budget category management
- Enhanced chart visualization with better colors
- Fixed issues with form submissions and cancel buttons
- Optimized performance for faster loading times
- Added theme toggle functionality in navigation

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js and npm (for frontend dependencies)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
```

2. Set up Python virtual environment
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```
pip install -r requirements.txt
```

4. Initialize the database
```
flask init-db
```

5. Start the development server
```
flask run
```

6. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Create an account or log in
2. Set up your accounts (checking, savings, credit cards)
3. Add your transactions
4. Create budget categories and set monthly limits
5. View your financial dashboard to monitor your progress

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chart.js for the visualization components
- FontAwesome for the icons
- All contributors who have helped improve this application
