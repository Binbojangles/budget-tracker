from flask import Blueprint, request, jsonify, g, current_app
import os
from werkzeug.utils import secure_filename
from backend.api.routes.auth_routes import token_required
from backend.services.parsers.statement_parser import parse_uploaded_statement
from backend.models import Account, Transaction, Category, db
from datetime import datetime

# Create a Blueprint for file upload routes
upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx', 'pdf'}

def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/statement', methods=['POST'])
@token_required
def upload_statement():
    """Upload and process a bank statement."""
    try:
        # Check if file was included
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        # Check if a file was selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Please upload one of: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Get form data
        account_id = request.form.get('account_id')
        bank_name = request.form.get('bank_name', '')
        
        # Validate account belongs to user
        if account_id:
            account = Account.query.filter_by(id=account_id, user_id=g.user_id).first()
            if not account:
                return jsonify({'error': 'Invalid account ID'}), 400
        
        # Get column mapping if provided
        column_mapping = None
        if 'column_mapping' in request.form:
            try:
                column_mapping = request.json.get('column_mapping')
            except:
                pass
        
        # Parse the statement
        parsed_transactions = parse_uploaded_statement(file, bank_name, column_mapping)
        
        # Return the parsed transactions for preview
        result = []
        for transaction in parsed_transactions:
            result.append({
                'date': transaction['date'].strftime('%Y-%m-%d'),
                'description': transaction['description'],
                'amount': transaction['amount'],
                'category_hint': transaction.get('category_hint', ''),
                'notes': transaction.get('notes', '')
            })
        
        return jsonify({
            'message': 'Statement parsed successfully',
            'transactions_count': len(result),
            'transactions': result
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to process statement', 'details': str(e)}), 500

@upload_bp.route('/import', methods=['POST'])
@token_required
def import_transactions():
    """Import parsed transactions into the database."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'transactions' not in data or 'account_id' not in data:
            return jsonify({'error': 'Missing required fields: transactions and account_id'}), 400
        
        # Validate account belongs to user
        account_id = data['account_id']
        account = Account.query.filter_by(id=account_id, user_id=g.user_id).first()
        if not account:
            return jsonify({'error': 'Invalid account ID'}), 400
        
        # Get default categories for matching
        categories = Category.query.filter_by(user_id=g.user_id).all()
        category_map = {}
        
        for category in categories:
            category_map[category.name.lower()] = category.id
        
        # Import transactions
        transactions = data['transactions']
        imported_count = 0
        skipped_count = 0
        
        for transaction_data in transactions:
            # Check for required fields
            if 'date' not in transaction_data or 'amount' not in transaction_data:
                skipped_count += 1
                continue
            
            # Parse date
            try:
                transaction_date = datetime.strptime(transaction_data['date'], '%Y-%m-%d')
            except ValueError:
                skipped_count += 1
                continue
            
            # Find category if possible
            category_id = None
            category_hint = transaction_data.get('category_hint', '').lower()
            
            if category_hint and category_hint in category_map:
                category_id = category_map[category_hint]
            
            # Create transaction
            new_transaction = Transaction(
                amount=float(transaction_data['amount']),
                account_id=account_id,
                transaction_date=transaction_date,
                description=transaction_data.get('description', ''),
                category_id=category_id,
                notes=transaction_data.get('notes', '')
            )
            
            db.session.add(new_transaction)
            
            # Update account balance
            account.update_balance(float(transaction_data['amount']))
            
            imported_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transactions imported successfully',
            'imported_count': imported_count,
            'skipped_count': skipped_count
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to import transactions', 'details': str(e)}), 500