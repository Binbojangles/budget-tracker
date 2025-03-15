from datetime import datetime
import uuid
from backend.models.user import db

class Transaction(db.Model):
    """Transaction model representing financial movement (income, expense, transfer)."""
    
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    amount = db.Column(db.Float, nullable=False)  # Positive for income, negative for expense
    description = db.Column(db.String(255), nullable=True)
    transaction_date = db.Column(db.DateTime, nullable=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.String(50), nullable=True)  # monthly, weekly, etc.
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=True)
    
    # For transfers between accounts
    transfer_account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=True)

    # Add this after your existing relationships:
    transfer_account = db.relationship(
    'Account',
    foreign_keys=[transfer_account_id],
    backref=db.backref('incoming_transfers', lazy=True)
    )
    
    # Relationships
    attachments = db.relationship('Attachment', backref='transaction', lazy=True, cascade="all, delete-orphan")
    
    def __init__(self, amount, account_id, transaction_date, category_id=None, description=None, 
                 is_recurring=False, recurrence_pattern=None, notes=None, transfer_account_id=None):
        self.amount = amount
        self.account_id = account_id
        self.transaction_date = transaction_date
        self.category_id = category_id
        self.description = description
        self.is_recurring = is_recurring
        self.recurrence_pattern = recurrence_pattern
        self.notes = notes
        self.transfer_account_id = transfer_account_id
    
    def __repr__(self):
        return f'<Transaction {self.amount}: {self.description}>'
    
    @property
    def transaction_type(self):
        """Determine if this is an income, expense, or transfer transaction."""
        if self.transfer_account_id:
            return 'transfer'
        return 'income' if self.amount >= 0 else 'expense'