from datetime import datetime
import uuid
from backend.models.user import db

class Budget(db.Model):
    """Budget model representing a financial plan for a specific period."""
    
    __tablename__ = 'budgets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_limit = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(3), default='USD')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    budget_items = db.relationship('BudgetItem', backref='budget', lazy=True, cascade="all, delete-orphan")
    
    def __init__(self, name, user_id, start_date, end_date, total_limit=0.0, currency='USD'):
        self.name = name
        self.user_id = user_id
        self.start_date = start_date
        self.end_date = end_date
        self.total_limit = total_limit
        self.currency = currency
    
    def __repr__(self):
        return f'<Budget {self.name}>'

class BudgetItem(db.Model):
    """Budget item representing an allocation for a specific category within a budget."""
    
    __tablename__ = 'budget_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    budget_id = db.Column(db.String(36), db.ForeignKey('budgets.id'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)
    
    def __init__(self, budget_id, category_id, amount):
        self.budget_id = budget_id
        self.category_id = category_id
        self.amount = amount
    
    def __repr__(self):
        return f'<BudgetItem {self.amount}>'