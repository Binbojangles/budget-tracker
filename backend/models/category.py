from datetime import datetime
import uuid
from backend.models.user import db

class Category(db.Model):
    """Category model for classifying transactions."""
    
    __tablename__ = 'categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), default='#3498db')  # Hexadecimal color code
    icon = db.Column(db.String(50), nullable=True)  # Icon identifier
    category_type = db.Column(db.String(20), default='expense')  # expense, income, transfer
    is_system = db.Column(db.Boolean, default=False)  # System categories cannot be deleted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=True)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='category', lazy=True)
    subcategories = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy=True)
    budget_items = db.relationship('BudgetItem', backref='category', lazy=True)
    
    def __init__(self, name, user_id, category_type='expense', color='#3498db', icon=None, parent_id=None, is_system=False):
        self.name = name
        self.user_id = user_id
        self.category_type = category_type
        self.color = color
        self.icon = icon
        self.parent_id = parent_id
        self.is_system = is_system
    
    def __repr__(self):
        return f'<Category {self.name}>'
    
    @classmethod
    def create_default_categories(cls, user_id):
        """Create default expense and income categories for a new user."""
        print(f"Creating default categories for user_id: {user_id}")
        
        default_categories = [
            # Income categories
            {'name': 'Salary', 'type': 'income', 'color': '#2ecc71', 'icon': 'briefcase'},
            {'name': 'Investments', 'type': 'income', 'color': '#27ae60', 'icon': 'trending-up'},
            {'name': 'Gifts', 'type': 'income', 'color': '#3498db', 'icon': 'gift'},
            {'name': 'Other Income', 'type': 'income', 'color': '#2980b9', 'icon': 'plus-circle'},
            
            # Expense categories
            {'name': 'Housing', 'type': 'expense', 'color': '#e74c3c', 'icon': 'home'},
            {'name': 'Transportation', 'type': 'expense', 'color': '#d35400', 'icon': 'car'},
            {'name': 'Food', 'type': 'expense', 'color': '#f39c12', 'icon': 'shopping-cart'},
            {'name': 'Utilities', 'type': 'expense', 'color': '#f1c40f', 'icon': 'zap'},
            {'name': 'Healthcare', 'type': 'expense', 'color': '#e67e22', 'icon': 'activity'},
            {'name': 'Personal', 'type': 'expense', 'color': '#9b59b6', 'icon': 'user'},
            {'name': 'Entertainment', 'type': 'expense', 'color': '#8e44ad', 'icon': 'film'},
            {'name': 'Education', 'type': 'expense', 'color': '#1abc9c', 'icon': 'book'},
            {'name': 'Debt Payments', 'type': 'expense', 'color': '#c0392b', 'icon': 'credit-card'},
            {'name': 'Savings', 'type': 'expense', 'color': '#16a085', 'icon': 'save'},
            {'name': 'Other Expenses', 'type': 'expense', 'color': '#7f8c8d', 'icon': 'more-horizontal'},
        ]
        
        categories = []
        for cat in default_categories:
            print(f"Creating category {cat['name']} with user_id {user_id}")
            category = cls(
                name=cat['name'],
                user_id=user_id,  # Ensure this is set correctly
                category_type=cat['type'],
                color=cat['color'],
                icon=cat['icon'],
                is_system=True
            )
            categories.append(category)
        
        return categories