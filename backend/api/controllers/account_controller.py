from flask import request, jsonify, g
from werkzeug.exceptions import BadRequest, NotFound
from backend.models import Account, db

def get_accounts():
    """Get all accounts for the authenticated user."""
    try:
        accounts = Account.query.filter_by(user_id=g.user_id).all()
        
        result = []
        for account in accounts:
            result.append({
                'id': account.id,
                'name': account.name,
                'type': account.account_type,
                'balance': account.balance,
                'institution': account.institution if hasattr(account, 'institution') else "",
                'currency': account.currency,
                'is_active': account.is_active,
                'created_at': account.created_at.isoformat()
            })
        
        return jsonify({'accounts': result}), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve accounts', 'details': str(e)}), 500

def get_account(account_id):
    """Get a specific account by ID."""
    try:
        account = Account.query.filter_by(id=account_id, user_id=g.user_id).first()
        
        if not account:
            raise NotFound("Account not found")
        
        return jsonify({
            'id': account.id,
            'name': account.name,
            'account_type': account.account_type,
            'balance': account.balance,
            'currency': account.currency,
            'is_active': account.is_active,
            'created_at': account.created_at.isoformat(),
            'updated_at': account.updated_at.isoformat()
        }), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve account', 'details': str(e)}), 500

def create_account():
    """Create a new account."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'account_type']
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")
        
        # Create new account
        new_account = Account(
            name=data['name'],
            account_type=data['account_type'],
            user_id=g.user_id,
            balance=data.get('balance', 0.0),
            currency=data.get('currency', 'USD'),
            institution=data.get('institution', '')
        )
        
        db.session.add(new_account)
        db.session.commit()
        
        return jsonify({
            'id': new_account.id,
            'name': new_account.name,
            'account_type': new_account.account_type,
            'balance': new_account.balance,
            'currency': new_account.currency,
            'institution': new_account.institution,
            'is_active': new_account.is_active,
            'created_at': new_account.created_at.isoformat()
        }), 201
    
    except BadRequest as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create account', 'details': str(e)}), 500

def update_account(account_id):
    """Update an existing account."""
    try:
        account = Account.query.filter_by(id=account_id, user_id=g.user_id).first()
        
        if not account:
            raise NotFound("Account not found")
        
        data = request.get_json()
        
        # Update account fields
        if 'name' in data:
            account.name = data['name']
        if 'account_type' in data:
            account.account_type = data['account_type']
        if 'balance' in data:
            account.balance = data['balance']
        if 'currency' in data:
            account.currency = data['currency']
        if 'institution' in data:
            account.institution = data['institution']
        if 'is_active' in data:
            account.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'id': account.id,
            'name': account.name,
            'account_type': account.account_type,
            'balance': account.balance,
            'currency': account.currency,
            'institution': account.institution,
            'is_active': account.is_active,
            'updated_at': account.updated_at.isoformat()
        }), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update account', 'details': str(e)}), 500

def delete_account(account_id):
    """Delete an account."""
    try:
        account = Account.query.filter_by(id=account_id, user_id=g.user_id).first()
        
        if not account:
            raise NotFound("Account not found")
        
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
    
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account', 'details': str(e)}), 500