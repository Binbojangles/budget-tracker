from datetime import datetime
import uuid
from backend.models.user import db

class Attachment(db.Model):
    """Attachment model for storing files related to transactions."""
    
    __tablename__ = 'attachments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # mime type
    file_size = db.Column(db.Integer, nullable=False)  # size in bytes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    transaction_id = db.Column(db.String(36), db.ForeignKey('transactions.id'), nullable=False)
    
    def __init__(self, filename, file_path, file_type, file_size, transaction_id):
        self.filename = filename
        self.file_path = file_path
        self.file_type = file_type
        self.file_size = file_size
        self.transaction_id = transaction_id
    
    def __repr__(self):
        return f'<Attachment {self.filename}>'