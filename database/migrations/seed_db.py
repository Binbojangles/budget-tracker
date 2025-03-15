"""
Database seeding script for development and testing.

This script will:
1. Create necessary database tables
2. Seed the database with sample users, accounts, categories, and transactions
"""

import os
import sys
import datetime
import random
from werkzeug.security import generate_password_hash

# Add the project root to the path so we can import the application
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database models
from backend.models import (
    db, User, Account, Category, Transaction, Budget, BudgetItem
)
from backend.app import create_app

# Create a test configuration
test_config = {
    'SQLALCHEMY_DATABASE_URI': 'sqlite:///budget_tracker_dev.db',
    'TESTING': True
}

# Create app with test config
app = create_app(test_config)

def seed_database():
    """Seed the database with sample data."""
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if database already has data
        if User.query.count() > 0:
            print("Database already contains data. Skipping seed.")
            return
        
        print("Seeding database...")
        
        # Create test user
        test_user = User(
            username="testuser",
            email="test@example.com",
            password="password123",
            first_name="Test",
            last_name="User"
        )
        db.session.add(test_user)
        db.session.commit()
        
        # Create default categories
        categories = Category.create_default_categories(test_user.id)
        for category in categories:
            db.session.add(category)
        db.session.commit()
        
        # Get category IDs for reference
        categories = Category.query.filter_by(user_id=test_user.id).all()
        category_map = {category.name: category.id for category in categories}
        
        # Create accounts
        accounts = [
            Account(name="Checking Account", account_type="checking", user_id=test_user.id, balance=3500.00),
            Account(name="Savings Account", account_type="savings", user_id=test_user.id, balance=10000.00),
            Account(name="Credit Card", account_type="credit", user_id=test_user.id, balance=-1500.00)
        ]
        
        for account in accounts:
            db.session.add(account)
        db.session.commit()
        
        # Get account IDs
        checking_id = accounts[0].id
        savings_id = accounts[1].id
        credit_id = accounts[2].id
        
        # Generate transactions for the past 90 days
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=90)
        
        # Sample transaction data
        sample_income = [
            {"description": "Salary", "category": "Salary", "amount": 3500.00, "recurring": True},
            {"description": "Freelance Work", "category": "Other Income", "amount": 500.00, "recurring": False},
            {"description": "Dividend Payment", "category": "Investments", "amount": 200.00, "recurring": True}
        ]
        
        sample_expenses = [
            {"description": "Rent", "category": "Housing", "amount": -1200.00, "recurring": True},
            {"description": "Grocery Store", "category": "Food", "amount": -150.00, "recurring": False},
            {"description": "Electric Bill", "category": "Utilities", "amount": -80.00, "recurring": True},
            {"description": "Internet", "category": "Utilities", "amount": -65.00, "recurring": True},
            {"description": "Streaming Service", "category": "Entertainment", "amount": -15.99, "recurring": True},
            {"description": "Restaurant", "category": "Food", "amount": -45.00, "recurring": False},
            {"description": "Gas Station", "category": "Transportation", "amount": -40.00, "recurring": False},
            {"description": "Pharmacy", "category": "Healthcare", "amount": -30.00, "recurring": False},
            {"description": "Coffee Shop", "category": "Food", "amount": -5.00, "recurring": False},
            {"description": "Online Shopping", "category": "Personal", "amount": -60.00, "recurring": False},
            {"description": "Movie Tickets", "category": "Entertainment", "amount": -25.00, "recurring": False},
            {"description": "Phone Bill", "category": "Utilities", "amount": -70.00, "recurring": True},
            {"description": "Gym Membership", "category": "Personal", "amount": -50.00, "recurring": True},
            {"description": "Car Payment", "category": "Transportation", "amount": -300.00, "recurring": True},
            {"description": "Car Insurance", "category": "Transportation", "amount": -120.00, "recurring": True}
        ]
        
        # Generate transactions
        transactions = []
        
        # Generate income transactions (monthly)
        current_date = start_date
        while current_date <= end_date:
            for income in sample_income:
                if income["recurring"] or random.random() < 0.3:  # Only some non-recurring incomes appear
                    # Add some randomness to non-recurring amounts
                    amount = income["amount"]
                    if not income["recurring"]:
                        amount = amount * random.uniform(0.8, 1.2)
                    
                    transaction = Transaction(
                        amount=amount,
                        account_id=checking_id,
                        transaction_date=current_date + datetime.timedelta(days=random.randint(0, 5)),
                        category_id=category_map.get(income["category"]),
                        description=income["description"],
                        is_recurring=income["recurring"]
                    )
                    transactions.append(transaction)
            
            # Move to next month
            current_date = current_date + datetime.timedelta(days=30)
        
        # Generate expense transactions (mix of recurring and daily)
        current_date = start_date
        while current_date <= end_date:
            # Monthly recurring expenses
            if current_date.day <= 5:  # Beginning of month bills
                for expense in sample_expenses:
                    if expense["recurring"]:
                        # Slight variation in amounts
                        amount = expense["amount"] * random.uniform(0.95, 1.05)
                        
                        # Some expenses go on credit card, some on checking
                        account_id = credit_id if random.random() < 0.6 else checking_id
                        
                        transaction = Transaction(
                            amount=amount,
                            account_id=account_id,
                            transaction_date=current_date + datetime.timedelta(days=random.randint(0, 5)),
                            category_id=category_map.get(expense["category"]),
                            description=expense["description"],
                            is_recurring=True
                        )
                        transactions.append(transaction)
            
            # Random daily expenses
            if random.random() < 0.7:  # 70% chance of an expense on any given day
                # Pick 1-3 random expenses
                daily_expenses = random.sample(sample_expenses, k=random.randint(1, 3))
                for expense in daily_expenses:
                    if not expense["recurring"] or random.random() < 0.1:  # Occasional duplicate of recurring expenses
                        # Randomize amount a bit
                        amount = expense["amount"] * random.uniform(0.8, 1.2)
                        
                        # Some expenses go on credit card, some on checking
                        account_id = credit_id if random.random() < 0.6 else checking_id
                        
                        transaction = Transaction(
                            amount=amount,
                            account_id=account_id,
                            transaction_date=current_date,
                            category_id=category_map.get(expense["category"]),
                            description=expense["description"],
                            is_recurring=False
                        )
                        transactions.append(transaction)
            
            # Occasional transfers
            if current_date.day == 15 or random.random() < 0.05:  # Mid-month or random transfers
                # Transfer to savings
                if random.random() < 0.7:  # 70% chance of savings transfer on transfer days
                    amount = random.choice([100, 200, 500, 1000])
                    
                    # From checking to savings
                    transaction = Transaction(
                        amount=-amount,  # Negative as it's leaving this account
                        account_id=checking_id,
                        transaction_date=current_date,
                        description="Transfer to Savings",
                        transfer_account_id=savings_id
                    )
                    transactions.append(transaction)
                    
                    # Corresponding entry in savings
                    transaction = Transaction(
                        amount=amount,  # Positive as it's entering this account
                        account_id=savings_id,
                        transaction_date=current_date,
                        description="Transfer from Checking",
                        transfer_account_id=checking_id
                    )
                    transactions.append(transaction)
                
                # Credit card payment
                if current_date.day == 15:  # Monthly credit card payment
                    # Calculate a reasonable payment amount (60-90% of current balance)
                    balance_query = db.session.query(db.func.sum(Transaction.amount)).filter(
                        Transaction.account_id == credit_id,
                        Transaction.transaction_date < current_date
                    ).scalar()
                    
                    balance = balance_query or -1500  # Default if no transactions yet
                    payment_amount = min(abs(balance) * random.uniform(0.6, 0.9), 2000)
                    
                    # From checking to credit card
                    transaction = Transaction(
                        amount=-payment_amount,
                        account_id=checking_id,
                        transaction_date=current_date,
                        description="Credit Card Payment",
                        transfer_account_id=credit_id
                    )
                    transactions.append(transaction)
                    
                    # Corresponding entry in credit card
                    transaction = Transaction(
                        amount=payment_amount,
                        account_id=credit_id,
                        transaction_date=current_date,
                        description="Payment from Checking",
                        transfer_account_id=checking_id
                    )
                    transactions.append(transaction)
            
            # Move to next day
            current_date = current_date + datetime.timedelta(days=1)
        
        # Add all transactions to database
        for transaction in transactions:
            db.session.add(transaction)
        
        # Create a sample budget
        current_month = datetime.datetime.now().replace(day=1)
        next_month = (current_month + datetime.timedelta(days=32)).replace(day=1)
        
        budget = Budget(
            name=f"Budget for {current_month.strftime('%B %Y')}",
            user_id=test_user.id,
            start_date=current_month,
            end_date=next_month - datetime.timedelta(days=1),
            total_limit=3000.00
        )
        db.session.add(budget)
        db.session.commit()
        
        # Add budget items
        budget_items = [
            {"category": "Housing", "amount": 1200.00},
            {"category": "Food", "amount": 500.00},
            {"category": "Transportation", "amount": 400.00},
            {"category": "Utilities", "amount": 250.00},
            {"category": "Entertainment", "amount": 150.00},
            {"category": "Personal", "amount": 200.00},
            {"category": "Healthcare", "amount": 100.00},
            {"category": "Education", "amount": 50.00},
            {"category": "Debt Payments", "amount": 150.00}
        ]
        
        for item in budget_items:
            budget_item = BudgetItem(
                budget_id=budget.id,
                category_id=category_map.get(item["category"]),
                amount=item["amount"]
            )
            db.session.add(budget_item)
        
        db.session.commit()
        
        print(f"Database seeding complete. Added {len(transactions)} transactions and 1 budget.")

if __name__ == "__main__":
    seed_database()