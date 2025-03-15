# Budget Tracker

A powerful personal finance application for tracking budgets, expenses, and gaining insights into your spending habits.

## Features

- **Budget Management**: Create and manage multiple budgets with customizable periods
- **Category-Based Tracking**: Organize your finances with customizable categories
- **Visual Reports**: Visualize your spending with interactive charts and graphs
- **Spending Analysis**: Monitor budget progress and identify areas to save money
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Web browser with JavaScript enabled
- Local development server or web hosting

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/budget-tracker.git
   cd budget-tracker
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the application:
   ```
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Using the Budget Tracker

### Creating a Budget

1. Click the "Create New Budget" button
2. Enter a name for your budget
3. Set start and end dates
4. Add categories with their allocated amounts
5. Click "Save Budget"

### Adding Categories

1. Open an existing budget
2. Click "Add Category"
3. Select a category from the dropdown
4. Enter the budgeted amount
5. Click "Add Category"

### Tracking Expenses

1. Navigate to the Expenses section
2. Click "Add Expense"
3. Enter the expense details (amount, category, date, etc.)
4. Click "Save Expense"

### Viewing Reports

1. Go to the Dashboard page
2. View spending by category in the charts
3. Toggle between monthly, quarterly, and yearly views
4. Track your budget progress through the progress bars

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Python, Flask
- **Database**: SQLite (development), PostgreSQL (production)
- **UI Framework**: Custom CSS with responsive design principles

## Project Structure

- `/frontend`: Contains HTML, CSS, and JavaScript files
  - `/static`: Static assets (JS, CSS, images)
  - `/templates`: HTML templates
- `/backend`: Server-side code
  - `/models`: Database models
  - `/routes`: API endpoints
  - `/services`: Business logic
- `/config`: Configuration files
- `/utils`: Utility functions and helpers

## Local Storage

The application uses browser local storage to maintain:
- Budget data
- Category information
- User preferences
- Current session state

This enables persistence between sessions without requiring login.

## Known Issues & Future Improvements

- **Data Export**: Planning to add CSV/PDF export functionality
- **Dark Mode**: Coming in the next update
- **Multi-currency Support**: Future enhancement for international users
- **Budget Templates**: Save and reuse budget templates
- **Transaction Import**: Import transactions from CSV or bank feeds

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chart.js for the visualization components
- FontAwesome for the icons
- All contributors who have helped improve this application
