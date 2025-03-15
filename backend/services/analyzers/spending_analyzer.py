import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from backend.models import Transaction, Category, Account

class SpendingAnalyzer:
    """Analyze spending patterns and provide insights."""
    
    def __init__(self, user_id):
        self.user_id = user_id
    
    def get_spending_by_category(self, start_date=None, end_date=None, account_id=None):
        """
        Analyze spending by category within a date range.
        
        Returns:
        - DataFrame with categories and their total spending
        """
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        if account_id:
            if account_id not in account_ids:
                raise ValueError("Invalid account ID")
            account_ids = [account_id]
        
        # Build query for transactions
        query = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount < 0,  # Only expenses
            Transaction.transfer_account_id.is_(None)  # Exclude transfers
        )
        
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        
        transactions = query.all()
        
        # Prepare data for analysis
        data = []
        for transaction in transactions:
            category_name = "Uncategorized"
            if transaction.category_id:
                category = Category.query.get(transaction.category_id)
                if category:
                    category_name = category.name
            
            data.append({
                'amount': abs(transaction.amount),  # Convert to positive for easier analysis
                'category': category_name,
                'date': transaction.transaction_date
            })
        
        if not data:
            return pd.DataFrame(columns=['category', 'total_amount', 'percentage'])
        
        # Create DataFrame and group by category
        df = pd.DataFrame(data)
        category_spending = df.groupby('category')['amount'].sum().reset_index()
        category_spending = category_spending.rename(columns={'amount': 'total_amount'})
        
        # Calculate percentages
        total_spent = category_spending['total_amount'].sum()
        category_spending['percentage'] = (category_spending['total_amount'] / total_spent * 100).round(2)
        
        # Sort by amount (highest first)
        category_spending = category_spending.sort_values('total_amount', ascending=False)
        
        return category_spending
    
    def get_monthly_spending_trends(self, months=6):
        """
        Analyze monthly spending trends over a period.
        
        Parameters:
        - months: Number of months to analyze (default: 6)
        
        Returns:
        - DataFrame with monthly totals and category breakdowns
        """
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months)
        
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        # Get expenses
        expenses = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount < 0,  # Only expenses
            Transaction.transfer_account_id.is_(None),  # Exclude transfers
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()
        
        # Prepare data for analysis
        data = []
        for expense in expenses:
            category_name = "Uncategorized"
            if expense.category_id:
                category = Category.query.get(expense.category_id)
                if category:
                    category_name = category.name
            
            data.append({
                'amount': abs(expense.amount),
                'category': category_name,
                'date': expense.transaction_date,
                'month': expense.transaction_date.strftime('%Y-%m')
            })
        
        if not data:
            return pd.DataFrame(columns=['month', 'total_amount'])
        
        # Create DataFrame and analyze
        df = pd.DataFrame(data)
        
        # Monthly totals
        monthly_totals = df.groupby('month')['amount'].sum().reset_index()
        monthly_totals = monthly_totals.rename(columns={'amount': 'total_amount'})
        
        # Sort by month
        monthly_totals = monthly_totals.sort_values('month')
        
        # Category breakdown by month
        pivot_data = df.pivot_table(
            index='month', 
            columns='category', 
            values='amount', 
            aggfunc='sum',
            fill_value=0
        ).reset_index()
        
        # Merge monthly totals with category breakdown
        result = pd.merge(monthly_totals, pivot_data, on='month')
        
        return result
    
    def get_largest_expenses(self, start_date=None, end_date=None, limit=10):
        """
        Find the largest individual expenses within a date range.
        
        Parameters:
        - start_date: Start date for analysis
        - end_date: End date for analysis
        - limit: Number of expenses to return (default: 10)
        
        Returns:
        - DataFrame with largest expenses
        """
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        # Build query for transactions
        query = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount < 0,  # Only expenses
            Transaction.transfer_account_id.is_(None)  # Exclude transfers
        )
        
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        
        # Sort by amount (smallest first, as expenses are negative)
        query = query.order_by(Transaction.amount).limit(limit)
        
        transactions = query.all()
        
        # Prepare data for analysis
        data = []
        for transaction in transactions:
            category_name = "Uncategorized"
            if transaction.category_id:
                category = Category.query.get(transaction.category_id)
                if category:
                    category_name = category.name
            
            data.append({
                'id': transaction.id,
                'amount': abs(transaction.amount),
                'description': transaction.description,
                'category': category_name,
                'date': transaction.transaction_date.strftime('%Y-%m-%d')
            })
        
        return pd.DataFrame(data) if data else pd.DataFrame(columns=['id', 'amount', 'description', 'category', 'date'])
    
    def get_spending_recommendations(self, months=3):
        """
        Generate spending recommendations based on historical data.
        
        Parameters:
        - months: Number of months to analyze (default: 3)
        
        Returns:
        - Dictionary with recommendations
        """
        # Get category spending for the period
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months)
        
        category_spending = self.get_spending_by_category(start_date, end_date)
        
        if category_spending.empty:
            return {
                'status': 'insufficient_data',
                'message': 'Not enough transaction data to generate recommendations',
                'recommendations': []
            }
        
        # Calculate average monthly spending
        total_spent = category_spending['total_amount'].sum()
        monthly_average = total_spent / months
        
        # Find categories that take up significant portions of spending
        high_spending_categories = category_spending[category_spending['percentage'] > 15]
        
        # Get monthly trends
        monthly_trends = self.get_monthly_spending_trends(months)
        
        # Check for spending increases
        increasing_categories = []
        if not monthly_trends.empty and len(monthly_trends) > 1:
            category_columns = [col for col in monthly_trends.columns if col not in ['month', 'total_amount']]
            
            for category in category_columns:
                if category in monthly_trends.columns:
                    values = monthly_trends[category].values
                    if len(values) >= 2 and values[-1] > values[0] * 1.2:  # 20% increase
                        increasing_categories.append({
                            'category': category,
                            'increase_percentage': round((values[-1] / values[0] - 1) * 100, 2),
                            'current_amount': values[-1]
                        })
        
        # Generate recommendations
        recommendations = []
        
        # High spending categories
        for _, row in high_spending_categories.iterrows():
            recommendations.append({
                'type': 'high_spending',
                'category': row['category'],
                'message': f"Your spending on {row['category']} is {row['percentage']}% of your total expenses.",
                'action': f"Consider setting a budget for {row['category']} to reduce overall expenses."
            })
        
        # Increasing trends
        for category in increasing_categories:
            recommendations.append({
                'type': 'increasing_trend',
                'category': category['category'],
                'message': f"Your spending on {category['category']} has increased by {category['increase_percentage']}% over the past {months} months.",
                'action': f"Review your {category['category']} expenses to identify areas for potential savings."
            })
        
        return {
            'status': 'success',
            'monthly_average': round(monthly_average, 2),
            'top_categories': category_spending.head(3)[['category', 'percentage']].to_dict('records'),
            'recommendations': recommendations
        }
    
    def get_monthly_budget_comparison(self, budget_id):
        """
        Compare actual spending with budget allocations.
        
        Parameters:
        - budget_id: ID of the budget to compare against
        
        Returns:
        - DataFrame with budget vs. actual spending
        """
        from backend.models import Budget, BudgetItem
        
        # Get the budget
        budget = Budget.query.filter_by(id=budget_id, user_id=self.user_id).first()
        if not budget:
            raise ValueError("Invalid budget ID")
        
        # Get budget items
        budget_items = BudgetItem.query.filter_by(budget_id=budget_id).all()
        if not budget_items:
            return pd.DataFrame(columns=['category', 'budget_amount', 'actual_amount', 'difference', 'percentage'])
        
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        # Get actual spending for the budget period
        transactions = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount < 0,  # Only expenses
            Transaction.transfer_account_id.is_(None),  # Exclude transfers
            Transaction.transaction_date >= budget.start_date,
            Transaction.transaction_date <= budget.end_date
        ).all()
        
        # Prepare budget data
        budget_data = {}
        for item in budget_items:
            category = Category.query.get(item.category_id)
            category_name = category.name if category else "Uncategorized"
            budget_data[category_name] = item.amount
        
        # Prepare actual spending data
        actual_data = {}
        for transaction in transactions:
            category_name = "Uncategorized"
            if transaction.category_id:
                category = Category.query.get(transaction.category_id)
                if category:
                    category_name = category.name
            
            if category_name in actual_data:
                actual_data[category_name] += abs(transaction.amount)
            else:
                actual_data[category_name] = abs(transaction.amount)
        
        # Combine budget and actual data
        comparison_data = []
        for category, budget_amount in budget_data.items():
            actual_amount = actual_data.get(category, 0)
            difference = budget_amount - actual_amount
            percentage = (actual_amount / budget_amount * 100) if budget_amount > 0 else 0
            
            comparison_data.append({
                'category': category,
                'budget_amount': budget_amount,
                'actual_amount': actual_amount,
                'difference': difference,
                'percentage': round(percentage, 2)
            })
        
        # Add categories with spending but no budget
        for category, actual_amount in actual_data.items():
            if category not in budget_data:
                comparison_data.append({
                    'category': category,
                    'budget_amount': 0,
                    'actual_amount': actual_amount,
                    'difference': -actual_amount,
                    'percentage': float('inf')  # Over budget by infinite percentage
                })
        
        # Convert to DataFrame and sort
        df = pd.DataFrame(comparison_data)
        if not df.empty:
            df = df.sort_values('difference')
        
        return df