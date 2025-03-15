import pandas as pd
from datetime import datetime, timedelta
from backend.services.analyzers.spending_analyzer import SpendingAnalyzer
from backend.models import Category, Transaction, Account

class BudgetRecommendationService:
    """Service for generating personalized budget recommendations."""
    
    def __init__(self, user_id):
        self.user_id = user_id
        self.analyzer = SpendingAnalyzer(user_id)
    
    def generate_budget_plan(self, income=None, savings_goal_percentage=20):
        """
        Generate a recommended budget plan based on historical spending and income.
        
        Parameters:
        - income: Monthly income amount (optional)
        - savings_goal_percentage: Target percentage for savings (default: 20%)
        
        Returns:
        - Dictionary with budget allocations and recommendations
        """
        # Get spending patterns for the last 3 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)  # ~3 months
        
        category_spending = self.analyzer.get_spending_by_category(start_date, end_date)
        
        if category_spending.empty:
            return {
                'status': 'insufficient_data',
                'message': 'Not enough transaction data to generate a budget plan',
                'categories': []
            }
        
        # Calculate monthly average spending
        total_spent = category_spending['total_amount'].sum()
        monthly_average = total_spent / 3
        
        # If income not provided, estimate from deposit transactions
        if not income:
            income = self._estimate_monthly_income()
        
        if not income or income <= 0:
            income = monthly_average * 1.3  # Assume income is 30% higher than expenses
        
        # Calculate target amounts based on recommended percentages
        recommended_budget = {}
        savings_amount = income * (savings_goal_percentage / 100)
        available_for_expenses = income - savings_amount
        
        # Common budget category allocations (percentages of income)
        default_allocations = {
            'Housing': 30,
            'Transportation': 15,
            'Food': 15,
            'Utilities': 10,
            'Healthcare': 5,
            'Personal': 5,
            'Entertainment': 5,
            'Education': 5,
            'Debt Payments': 10
        }
        
        # Start with the user's actual spending patterns
        for _, row in category_spending.iterrows():
            category = row['category']
            current_amount = row['total_amount'] / 3  # Monthly average
            current_percentage = row['percentage']
            
            # Get the recommended percentage for this category
            recommended_percentage = default_allocations.get(category, 5)  # Default to 5%
            
            # Calculate recommended amount based on available funds
            recommended_amount = (available_for_expenses * recommended_percentage / 100)
            
            # Determine status based on current vs recommended spending
            if current_amount > recommended_amount * 1.2:
                status = 'reduce'
            elif current_amount < recommended_amount * 0.8:
                status = 'good'
            else:
                status = 'maintain'
            
            recommended_budget[category] = {
                'current_amount': round(current_amount, 2),
                'current_percentage': round(current_percentage, 2),
                'recommended_amount': round(recommended_amount, 2),
                'recommended_percentage': recommended_percentage,
                'status': status
            }
        
        # Add missing essential categories
        for category, percentage in default_allocations.items():
            if category not in recommended_budget:
                recommended_amount = (available_for_expenses * percentage / 100)
                recommended_budget[category] = {
                    'current_amount': 0,
                    'current_percentage': 0,
                    'recommended_amount': round(recommended_amount, 2),
                    'recommended_percentage': percentage,
                    'status': 'new'
                }
        
        # Format results
        categories = []
        for category, data in recommended_budget.items():
            categories.append({
                'category': category,
                **data
            })
        
        # Sort by recommended amount (highest first)
        categories.sort(key=lambda x: x['recommended_amount'], reverse=True)
        
        return {
            'status': 'success',
            'monthly_income': round(income, 2),
            'monthly_expenses': round(monthly_average, 2),
            'savings_goal': round(savings_amount, 2),
            'savings_percentage': savings_goal_percentage,
            'categories': categories
        }
    
    def identify_cost_cutting_opportunities(self):
        """
        Identify specific opportunities to reduce expenses.
        
        Returns:
        - List of cost-cutting recommendations
        """
        # Get largest expenses from the last month
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        large_expenses = self.analyzer.get_largest_expenses(start_date, end_date, limit=20)
        
        if large_expenses.empty:
            return {
                'status': 'insufficient_data',
                'message': 'Not enough transaction data to identify cost-cutting opportunities',
                'opportunities': []
            }
        
        # Get monthly spending trends
        monthly_trends = self.analyzer.get_monthly_spending_trends(months=3)
        
        # Identify recurring large expenses
        recurring_patterns = self._identify_recurring_patterns()
        
        # Generate recommendations
        opportunities = []
        
        # 1. Subscription services
        subscriptions = self._identify_potential_subscriptions()
        for sub in subscriptions:
            opportunities.append({
                'type': 'subscription',
                'category': sub['category'],
                'description': sub['description'],
                'amount': sub['amount'],
                'frequency': sub['frequency'],
                'annual_cost': sub['annual_cost'],
                'message': f"Potential subscription to {sub['description']} costs ${sub['annual_cost']} annually.",
                'action': "Review this subscription and consider if it provides enough value."
            })
        
        # 2. Categories with significant increases
        if not monthly_trends.empty and len(monthly_trends) > 1:
            category_columns = [col for col in monthly_trends.columns if col not in ['month', 'total_amount']]
            
            for category in category_columns:
                if category in monthly_trends.columns:
                    values = monthly_trends[category].values
                    if len(values) >= 2 and values[-1] > values[0] * 1.3:  # 30% increase
                        opportunities.append({
                            'type': 'increasing_category',
                            'category': category,
                            'increase_percentage': round((values[-1] / values[0] - 1) * 100, 2),
                            'current_amount': round(values[-1], 2),
                            'message': f"Spending on {category} has increased by {round((values[-1] / values[0] - 1) * 100, 2)}% recently.",
                            'action': f"Review your {category} expenses and identify what's driving the increase."
                        })
        
        # 3. Large one-time expenses
        for _, expense in large_expenses.iterrows():
            if expense['amount'] > 100:  # Threshold for "large" expense
                # Skip if it's already in recurring patterns
                skip = False
                for pattern in recurring_patterns:
                    if pattern.get('description') and pattern['description'].lower() in expense['description'].lower():
                        skip = True
                        break
                
                if not skip:
                    opportunities.append({
                        'type': 'large_expense',
                        'category': expense['category'],
                        'description': expense['description'],
                        'amount': round(expense['amount'], 2),
                        'date': expense['date'],
                        'message': f"Large expense of ${round(expense['amount'], 2)} for {expense['description']}.",
                        'action': "Consider if there are cheaper alternatives or if this expense could be reduced in the future."
                    })
        
        return {
            'status': 'success',
            'opportunities': opportunities
        }
    
    def _estimate_monthly_income(self):
        """Estimate monthly income from deposit transactions."""
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        # Get positive transactions from the last 3 months (excluding transfers)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        income_transactions = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount > 0,  # Income transactions
            Transaction.transfer_account_id.is_(None),  # Exclude transfers
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()
        
        if not income_transactions:
            return None
        
        # Sum income and divide by 3 to get monthly average
        total_income = sum(transaction.amount for transaction in income_transactions)
        monthly_income = total_income / 3
        
        return monthly_income
    
    def _identify_recurring_patterns(self):
        """
        Identify recurring transaction patterns.
        
        Returns:
        - List of recurring transaction patterns
        """
        # Get accounts for this user
        accounts = Account.query.filter_by(user_id=self.user_id).all()
        account_ids = [account.id for account in accounts]
        
        # Get transactions from the last 6 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)
        
        transactions = Transaction.query.filter(
            Transaction.account_id.in_(account_ids),
            Transaction.amount < 0,  # Expenses only
            Transaction.transfer_account_id.is_(None),  # Exclude transfers
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()
        
        if not transactions:
            return []
        
        # Group transactions by similar descriptions
        description_groups = {}
        for transaction in transactions:
            desc_key = self._normalize_description(transaction.description)
            if desc_key:
                if desc_key in description_groups:
                    description_groups[desc_key].append(transaction)
                else:
                    description_groups[desc_key] = [transaction]
        
        # Identify recurring patterns
        recurring_patterns = []
        
        for desc_key, trans_list in description_groups.items():
            if len(trans_list) >= 3:  # Need at least 3 instances to establish a pattern
                # Sort by date
                trans_list.sort(key=lambda x: x.transaction_date)
                
                # Check if amounts are similar
                amounts = [abs(t.amount) for t in trans_list]
                avg_amount = sum(amounts) / len(amounts)
                amounts_similar = all(abs(amount - avg_amount) / avg_amount < 0.1 for amount in amounts)
                
                if amounts_similar:
                    # Check for monthly pattern
                    dates = [t.transaction_date for t in trans_list]
                    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                    avg_interval = sum(intervals) / len(intervals)
                    
                    if 25 <= avg_interval <= 35:  # Monthly
                        frequency = 'monthly'
                    elif 13 <= avg_interval <= 16:  # Bi-weekly
                        frequency = 'bi-weekly'
                    elif 6 <= avg_interval <= 8:  # Weekly
                        frequency = 'weekly'
                    else:
                        frequency = 'irregular'
                    
                    category_name = "Uncategorized"
                    if trans_list[0].category_id:
                        category = Category.query.get(trans_list[0].category_id)
                        if category:
                            category_name = category.name
                    
                    recurring_patterns.append({
                        'description': trans_list[0].description,
                        'normalized_description': desc_key,
                        'amount': round(avg_amount, 2),
                        'frequency': frequency,
                        'instances': len(trans_list),
                        'category': category_name,
                        'annual_cost': round(avg_amount * (12 if frequency == 'monthly' else 26 if frequency == 'bi-weekly' else 52), 2)
                    })
        
        # Sort by annual cost (highest first)
        recurring_patterns.sort(key=lambda x: x['annual_cost'], reverse=True)
        
        return recurring_patterns
    
    def _identify_potential_subscriptions(self):
        """
        Identify transactions that look like subscription services.
        
        Returns:
        - List of potential subscription services
        """
        # Get recurring patterns
        recurring_patterns = self._identify_recurring_patterns()
        
        # Filter for likely subscriptions
        subscriptions = []
        
        for pattern in recurring_patterns:
            # Subscription indicators
            is_likely_subscription = False
            description = pattern['description'].lower()
            
            # Common subscription keywords
            subscription_keywords = [
                'netflix', 'hulu', 'spotify', 'prime', 'disney', 'subscription', 
                'membership', 'monthly', 'access', 'service', 'app', 'cloud',
                'hbo', 'apple', 'google', 'adobe', 'office', 'gym', 'fitness',
                'news', 'magazine', 'journal'
            ]
            
            # Check for subscription indicators
            if pattern['frequency'] in ['monthly', 'bi-weekly'] and any(keyword in description for keyword in subscription_keywords):
                is_likely_subscription = True
            
            # Round amounts often indicate subscriptions ($9.99, $14.99)
            amount_str = str(pattern['amount'])
            if pattern['amount'] < 50 and (amount_str.endswith('.99') or amount_str.endswith('.95')):
                is_likely_subscription = True
            
            if is_likely_subscription:
                subscriptions.append(pattern)
        
        return subscriptions
    
    def _normalize_description(self, description):
        """Normalize transaction descriptions to group similar ones."""
        if not description:
            return None
        
        # Convert to lowercase
        desc = description.lower()
        
        # Remove dates, numbers, special characters
        desc = ''.join([c for c in desc if c.isalpha() or c.isspace()])
        
        # Remove common words
        common_words = ['the', 'and', 'for', 'inc', 'ltd', 'llc', 'co', 'company']
        words = desc.split()
        desc = ' '.join([word for word in words if word not in common_words])
        
        # Trim and remove extra spaces
        desc = ' '.join(desc.split())
        
        return desc if desc else None