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

## Technology Stack

- **Backend**: Python with Flask/SQLAlchemy
- **Database**: SQLite (development), PostgreSQL (production)
- **Frontend**: HTML, CSS, JavaScript
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

### Docker Setup

1. Build and start the containers:
```bash
docker-compose up -d
```

2. The application will be available at http://localhost:8000

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

## Project Structure

```
budget-tracker/
│
├── backend/                # Backend Python code
│   ├── api/                # API endpoints and controllers
│   │   ├── controllers/    # Business logic for API routes
│   │   └── routes/         # API route definitions
│   ├── models/             # Database models
│   ├── services/           # Business logic services
│   │   ├── analyzers/      # Analysis tools
│   │   ├── parsers/        # File parsers
│   │   └── recommendations/ # Recommendation engines
│   └── utils/              # Utility functions
│
├── frontend/              # Frontend code
│   ├── static/            # Static assets
│   │   ├── css/           # CSS stylesheets
│   │   ├── js/            # JavaScript files
│   │   └── images/        # Image assets
│   └── templates/         # HTML templates
│
├── database/              # Database migrations and seeds
│
├── docs/                  # Documentation
│
├── deployment/            # Deployment configurations
│
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore file
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.