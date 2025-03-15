from flask import request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized
import jwt
import datetime
import os
from backend.models import User, db

def register_user():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")
        
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
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        # Find the user by username
        user = User.query.filter_by(username=data['username']).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
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
        os.getenv('SECRET_KEY', 'dev_key'),
        algorithm='HS256'
    )

def authenticate_token(token):
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(
            token,
            os.getenv('SECRET_KEY', 'dev_key'),
            algorithms=['HS256']
        )
        return payload['sub']  # User ID
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise Unauthorized("Invalid token. Please log in again.")