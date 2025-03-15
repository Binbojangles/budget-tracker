from flask import request, jsonify, g
from werkzeug.exceptions import BadRequest, NotFound
from datetime import datetime
from backend.models import Transaction, Account, Category, db

def get_transactions():
    """Get all transactions for the authenticated user."""
    try:
        # Get account IDs for the current user
        user_accounts = Account.query.filter_by(user_id=g.user_id).all()
        account_ids = [account.id for account in user_accounts]
        
        # Get query parameters for filtering
        account_id = request.args.get('account_id')
        category_id = request.args.get('category_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        min_amount = request.args.get('min_amount')
        max_amount = request.args.get('max_amount')
        transaction_type = request.args.get('type')
        
        # Base query
        query = Transaction.query.filter(Transaction.account_id.in_(account_ids))
        
        # Apply filters
        if account_id:
            query = query.filter_by(account_id=account_id)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Transaction.transaction_date >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Transaction.transaction_date <= end_date)
        
        if min_amount:
            query = query.filter(Transaction.amount >= float(min_amount))
        
        if max_amount:
            query = query.filter(Transaction.amount <= float(max_amount))
        
        if transaction_type:
            if transaction_type == 'income':
                query = query.filter(Transaction.amount >= 0, Transaction.transfer_account_id.is_(None))
            elif transaction_type == 'expense':
                query = query.filter(Transaction.amount < 0, Transaction.transfer_account_id.is_(None))
            elif transaction_type == 'transfer':
                query = query.filter(Transaction.transfer_account_id.isnot(None))
        
        # Order by date, newest first
        query = query.order_by(Transaction.transaction_date.desc())
        
        # Get results
        transactions = query.all()
        
        result = []
        for trans in transactions:
            category_name = None
            if trans.category_id:
                category = Category.query.get(trans.category_id)
                if category:
                    category_name = category.name
            
            account = Account.query.get(trans.account_id)
            account_name = account.name if account else 'Unknown Account'
            
            transfer_account_name = None
            if trans.transfer_account_id:
                transfer_account = Account.query.get(trans.transfer_account_id)
                if transfer_account:
                    transfer_account_name = transfer_account.name
            
            result.append({
                'id': trans.id,
                'amount': trans.amount,
                'description': trans.description,
                'transaction_date': trans.transaction_date.isoformat(),
                'is_recurring': trans.is_recurring,
                'recurrence_pattern': trans.recurrence_pattern,
                'notes': trans.notes,
                'account_id': trans.account_id,
                'account_name': account_name,
                'category_id': trans.category_id,
                'category_name': category_name,
                'transfer_account_id': trans.transfer_account_id,
                'transfer_account_name': transfer_account_name,
                'transaction_type': trans.transaction_type,
                'created_at': trans.created_at.isoformat()
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve transactions', 'details': str(e)}), 500

def get_transaction(transaction_id):
    """Get a specific transaction by ID."""
    try:
        # Get account IDs for the current user
        user_accounts = Account.query.filter_by(user_id=g.user_id).all()
        account_ids = [account.id for account in user_accounts]
        
        transaction = Transaction.query.filter_by(id=transaction_id).first()
        
        if not transaction or transaction.account_id not in account_ids:
            raise NotFound("Transaction not found")
        
        category_name = None
        if transaction.category_id:
            category = Category.query.get(transaction.category_id)
            if category:
                category_name = category.name
        
        account = Account.query.get(transaction.account_id)
        account_name = account.name if account else 'Unknown Account'
        
        transfer_account_name = None
        if transaction.transfer_account_id:
            transfer_account = Account.query.get(transaction.transfer_account_id)
            if transfer_account:
                transfer_account_name = transfer_account.name
        
        result = {
            'id': transaction.id,
            'amount': transaction.amount,
            'description': transaction.description,
            'transaction_date': transaction.transaction_date.isoformat(),
            'is_recurring': transaction.is_recurring,
            'recurrence_pattern': transaction.recurrence_pattern,
            'notes': transaction.notes,
            'account_id': transaction.account_id,
            'account_name': account_name,
            'category_id': transaction.category_id,
            'category_name': category_name,
            'transfer_account_id': transaction.transfer_account_id,
            'transfer_account_name': transfer_account_name,
            'transaction_type': transaction.transaction_type,
            'created_at': transaction.created_at.isoformat(),
            'updated_at': transaction.updated_at.isoformat()
        }
        
        return jsonify(result), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve transaction', 'details': str(e)}), 500

def create_transaction():
    """Create a new transaction."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'account_id', 'transaction_date']
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")
        
        # Verify account belongs to user
        account = Account.query.filter_by(id=data['account_id'], user_id=g.user_id).first()
        if not account:
            raise BadRequest("Invalid account ID")
        
        # Verify transfer account if provided
        if data.get('transfer_account_id'):
            transfer_account = Account.query.filter_by(id=data['transfer_account_id'], user_id=g.user_id).first()
            if not transfer_account:
                raise BadRequest("Invalid transfer account ID")
        
        # Verify category if provided
        if data.get('category_id'):
            category = Category.query.filter_by(id=data['category_id'], user_id=g.user_id).first()
            if not category:
                raise BadRequest("Invalid category ID")
        
        # Parse date
        transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d')
        
        # Create new transaction
        new_transaction = Transaction(
            amount=float(data['amount']),
            account_id=data['account_id'],
            transaction_date=transaction_date,
            category_id=data.get('category_id'),
            description=data.get('description'),
            is_recurring=data.get('is_recurring', False),
            recurrence_pattern=data.get('recurrence_pattern'),
            notes=data.get('notes'),
            transfer_account_id=data.get('transfer_account_id')
        )
        
        db.session.add(new_transaction)
        
        # Update account balance
        account.update_balance(float(data['amount']))
        
        # Update transfer account balance if applicable
        if data.get('transfer_account_id'):
            transfer_account = Account.query.get(data['transfer_account_id'])
            transfer_account.update_balance(-float(data['amount']))
        
        db.session.commit()
        
        return jsonify({
            'id': new_transaction.id,
            'amount': new_transaction.amount,
            'description': new_transaction.description,
            'transaction_date': new_transaction.transaction_date.isoformat(),
            'account_id': new_transaction.account_id,
            'category_id': new_transaction.category_id,
            'transaction_type': new_transaction.transaction_type,
            'created_at': new_transaction.created_at.isoformat()
        }), 201
    
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create transaction', 'details': str(e)}), 500

def update_transaction(transaction_id):
    """Update an existing transaction."""
    try:
        # Get account IDs for the current user
        user_accounts = Account.query.filter_by(user_id=g.user_id).all()
        account_ids = [account.id for account in user_accounts]
        
        transaction = Transaction.query.filter_by(id=transaction_id).first()
        
        if not transaction or transaction.account_id not in account_ids:
            raise NotFound("Transaction not found")
        
        data = request.get_json()
        
        # Save original amount for balance adjustment
        original_amount = transaction.amount
        original_account_id = transaction.account_id
        original_transfer_account_id = transaction.transfer_account_id
        
        # Update transaction fields
        if 'amount' in data:
            transaction.amount = float(data['amount'])
        
        if 'description' in data:
            transaction.description = data['description']
        
        if 'transaction_date' in data:
            transaction.transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d')
        
        if 'category_id' in data:
            if data['category_id']:
                category = Category.query.filter_by(id=data['category_id'], user_id=g.user_id).first()
                if not category:
                    raise BadRequest("Invalid category ID")
            transaction.category_id = data['category_id']
        
        if 'is_recurring' in data:
            transaction.is_recurring = data['is_recurring']
        
        if 'recurrence_pattern' in data:
            transaction.recurrence_pattern = data['recurrence_pattern']
        
        if 'notes' in data:
            transaction.notes = data['notes']
        
        if 'account_id' in data:
            account = Account.query.filter_by(id=data['account_id'], user_id=g.user_id).first()
            if not account:
                raise BadRequest("Invalid account ID")
            transaction.account_id = data['account_id']
        
        if 'transfer_account_id' in data:
            if data['transfer_account_id']:
                transfer_account = Account.query.filter_by(id=data['transfer_account_id'], user_id=g.user_id).first()
                if not transfer_account:
                    raise BadRequest("Invalid transfer account ID")
            transaction.transfer_account_id = data['transfer_account_id']
        
        # Adjust account balances
        if original_account_id == transaction.account_id:
            # Same account, just update the difference
            account = Account.query.get(transaction.account_id)
            account.update_balance(transaction.amount - original_amount)
        else:
            # Different account, revert the old and apply to the new
            old_account = Account.query.get(original_account_id)
            old_account.update_balance(-original_amount)
            
            new_account = Account.query.get(transaction.account_id)
            new_account.update_balance(transaction.amount)
        
        # Handle transfer account changes
        if original_transfer_account_id != transaction.transfer_account_id:
            # Revert old transfer
            if original_transfer_account_id:
                old_transfer = Account.query.get(original_transfer_account_id)
                old_transfer.update_balance(original_amount)
            
            # Apply new transfer
            if transaction.transfer_account_id:
                new_transfer = Account.query.get(transaction.transfer_account_id)
                new_transfer.update_balance(-transaction.amount)
        elif transaction.transfer_account_id:
            # Same transfer account, update the difference
            transfer_account = Account.query.get(transaction.transfer_account_id)
            transfer_account.update_balance(-(transaction.amount - original_amount))
        
        db.session.commit()
        
        return jsonify({
            'id': transaction.id,
            'amount': transaction.amount,
            'description': transaction.description,
            'transaction_date': transaction.transaction_date.isoformat(),
            'account_id': transaction.account_id,
            'category_id': transaction.category_id,
            'transfer_account_id': transaction.transfer_account_id,
            'transaction_type': transaction.transaction_type,
            'updated_at': transaction.updated_at.isoformat()
        }), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update transaction', 'details': str(e)}), 500

def delete_transaction(transaction_id):
    """Delete a transaction."""
    try:
        # Get account IDs for the current user
        user_accounts = Account.query.filter_by(user_id=g.user_id).all()
        account_ids = [account.id for account in user_accounts]
        
        transaction = Transaction.query.filter_by(id=transaction_id).first()
        
        if not transaction or transaction.account_id not in account_ids:
            raise NotFound("Transaction not found")
        
        # Revert account balance
        account = Account.query.get(transaction.account_id)
        account.update_balance(-transaction.amount)
        
        # Revert transfer account balance if applicable
        if transaction.transfer_account_id:
            transfer_account = Account.query.get(transaction.transfer_account_id)
            transfer_account.update_balance(transaction.amount)
        
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete transaction', 'details': str(e)}), 500