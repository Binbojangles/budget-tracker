# Budget Tracker Application

A full-stack web application for tracking personal finances, analyzing spending patterns, and receiving budget recommendations.

## Features

- **Account Management**: Add and manage different financial accounts (checking, savings, credit cards)
- **Transaction Tracking**: Record income, expenses, and transfers between accounts
- **Statement Import**: Upload and parse bank statements in various formats (CSV, Excel, PDF)
- **Spending Analysis**: Visualize spending patterns by category, time period, and merchant
- **Budget Creation**: Create and track budgets with customizable categories
- **Smart Recommendations**: Receive personalized recommendations for reducing expenses and optimizing your budget
- **Reporting**: Generate comprehensive financial reports

## Project Status

This project is currently in active development. The current status is:

- ✅ Project structure and architecture set up
- ✅ Backend API endpoints implemented
- ✅ Frontend UI designed and implemented
- ✅ Database models and relationships defined
- ✅ Docker containerization configured
- 🔄 Frontend-Backend integration in progress
- 🔄 Authentication flow implementation in progress
- 🔄 Data visualization implementation in progress
- 🔄 Statement parsing and import functionality in progress

## Technology Stack

- **Backend**: Python with Flask/SQLAlchemy
- **Database**: PostgreSQL (production), SQLite (development)
- **Frontend**: HTML, CSS, JavaScript with Chart.js for visualization
- **Containerization**: Docker and Docker Compose
- **Version Control**: Git/GitHub

## Installation and Setup

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Docker and Docker Compose (optional, for containerized deployment)
- Git

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/budget-tracker.git
cd budget-tracker
```

2. Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Edit the .env file with your settings
```

5. Initialize the database:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

6. Run the application:
```bash
flask run
```

### Docker Setup (Recommended)

1. Build and start the containers:
```bash
docker-compose up -d
```

2. The application will be available at http://localhost:8000

3. To stop the containers:
```bash
docker-compose down
```

## Development Roadmap

Here are the next steps in our development process:

1. **Authentication Integration**: Connect the frontend login/registration with backend authentication
2. **Account Management**: Implement account creation and management functionality
3. **Transaction Tracking**: Enable transaction entry, editing, and viewing
4. **Statement Import**: Complete CSV/Excel statement parsing and import
5. **Data Visualization**: Implement interactive charts and graphs
6. **Budget Management**: Enable budget creation and tracking
7. **Recommendations Engine**: Activate the smart recommendations system

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## API Documentation

The application provides a RESTful API with the following endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get authentication token
- `GET /api/auth/profile` - Get user profile information

### Accounts
- `GET /api/accounts` - Get all user accounts
- `GET /api/accounts/:id` - Get a specific account
- `POST /api/accounts` - Create a new account
- `PUT /api/accounts/:id` - Update an account
- `DELETE /api/accounts/:id` - Delete an account

### Transactions
- `GET /api/transactions` - Get all transactions (with filtering options)
- `GET /api/transactions/:id` - Get a specific transaction
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### File Upload and Import
- `POST /api/upload/statement` - Upload and parse a bank statement
- `POST /api/upload/import` - Import parsed transactions into the database

### Analysis and Recommendations
- `GET /api/analysis/spending-by-category` - Get spending breakdown by category
- `GET /api/analysis/monthly-trends` - Get monthly spending trends
- `GET /api/analysis/largest-expenses` - Get largest individual expenses
- `GET /api/analysis/budget-comparison/:id` - Compare actual spending with budget
- `GET /api/analysis/recommendations/spending` - Get spending recommendations
- `GET /api/analysis/recommendations/budget-plan` - Get recommended budget plan
- `GET /api/analysis/recommendations/cost-cutting` - Get cost-cutting opportunities

## Troubleshooting

If you encounter any issues while setting up or running the application, please check the following:

1. Ensure all dependencies are installed correctly
2. Verify database connection settings in the .env file
3. Check the application logs for detailed error messages
4. Make sure the required ports (8000, 5432) are available and not used by other applications

For more detailed troubleshooting, check the error messages in the console or the application logs.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
