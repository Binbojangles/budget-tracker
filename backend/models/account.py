from datetime import datetime
import uuid
from backend.models.user import db

class Account(db.Model):
    """Account model representing a financial account (checking, savings, credit card, etc.)."""
    
    __tablename__ = 'accounts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # checking, savings, credit, investment, etc.
    institution = db.Column(db.String(100), nullable=True)  # The financial institution (bank, credit union, etc.)
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(3), default='USD')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    transactions = db.relationship(
        'Transaction', 
        foreign_keys="Transaction.account_id",
        backref='account', 
        lazy=True, 
        cascade="all, delete-orphan"
    )
    
    def __init__(self, name, account_type, user_id, balance=0.0, currency='USD', institution=None):
        self.name = name
        self.account_type = account_type
        self.user_id = user_id
        self.balance = balance
        self.currency = currency
        self.institution = institution
    
    def __repr__(self):
        return f'<Account {self.name} ({self.account_type})>'
    
    def update_balance(self, amount):
        """Update account balance after a transaction."""
        self.balance += amount
        self.updated_at = datetime.utcnow()