from flask import request, jsonify, g
from werkzeug.exceptions import BadRequest, Unauthorized
import jwt
import datetime
import os
import re
from backend.models import User, db

def validate_email(email):
    """
    Validate email format using a comprehensive regex pattern.
    
    The regex checks for:
    - One or more characters before the @
    - A domain name after the @
    - A top-level domain of at least 2 characters
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

def validate_password(password):
    """
    Validate password strength with multiple criteria.
    
    Checks:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    
    Returns:
    - Boolean indicating if password meets all criteria
    """
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

def register_user():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                raise BadRequest(f"Missing required field: {field}")
        
        # Validate email
        if not validate_email(data['email']):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        if not validate_password(data['password']):
            return jsonify({
                "error": "Password must be at least 8 characters long and include uppercase, lowercase, and numeric characters"
            }), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Username already exists"}), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already exists"}), 409
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Create default categories for the user
        from backend.models import Category
        default_categories = Category.create_default_categories(new_user.id)
        for category in default_categories:
            db.session.add(category)
        db.session.commit()
        
        # Generate token
        token = generate_auth_token(new_user.id)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name
            }
        }), 201
        
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "details": str(e)}), 500

def login_user():
    """Authenticate a user and return a token."""
    try:
        # Log the incoming request data
        print("Login request received:")
        print("Request JSON:", request.get_json())
        
        data = request.get_json()
        
        # More detailed validation logging
        if not data.get('username'):
            print("Missing username")
            return jsonify({"error": "Username is required"}), 400
        
        if not data.get('password'):
            print("Missing password")
            return jsonify({"error": "Password is required"}), 400
        
        # Find the user by username
        user = User.query.filter_by(username=data['username']).first()
        
        # Detailed authentication logging
        if not user:
            print(f"User not found: {data['username']}")
            return jsonify({"error": "Invalid credentials"}), 401
        
        if not user.check_password(data['password']):
            print(f"Invalid password for user: {data['username']}")
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate token
        token = generate_auth_token(user.id)
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }), 200
        
    except Exception as e:
        # Catch-all error logging
        print(f"Unexpected login error: {str(e)}")
        return jsonify({"error": "Server error", "details": str(e)}), 500

def generate_auth_token(user_id):
    """Generate a JWT token for authentication."""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        os.getenv('JWT_SECRET_KEY', 'dev_key'),
        algorithm='HS256'
    )

def authenticate_token(token):
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'dev_key'),
            algorithms=['HS256']
        )
        return payload['sub']  # User ID
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise Unauthorized("Invalid token. Please log in again.")

def get_user_profile():
    """Retrieve the current user's profile information."""
    try:
        user = User.query.get(g.user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'created_at': user.created_at.isoformat(),
            'accounts_count': len(user.accounts),
            'categories_count': len(user.categories)
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve profile', 'details': str(e)}), 500

def update_user_profile():
    """Update the current user's profile information."""
    try:
        user = User.query.get(g.user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        # Validate email if provided
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({"error": "Invalid email format"}), 400
            
            # Check if the new email is already in use
            existing_user = User.query.filter(
                User.email == data['email'], 
                User.id != user.id
            ).first()
            
            if existing_user:
                return jsonify({"error": "Email already in use"}), 409
            
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

def change_user_password():
    """Change the current user's password."""
    try:
        user = User.query.get(g.user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate current password
        if not user.check_password(data.get('current_password')):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        new_password = data.get('new_password')
        if not validate_password(new_password):
            return jsonify({
                "error": "New password must be at least 8 characters long and include uppercase, lowercase, and numeric characters"
            }), 400
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'details': str(e)}), 500