from flask import Blueprint, request, jsonify, g
from functools import wraps
from backend.api.controllers.auth_controller import (
    register_user, 
    login_user, 
    authenticate_token, 
    get_user_profile, 
    update_user_profile, 
    change_user_password
)
from werkzeug.exceptions import Unauthorized, BadRequest

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Token authentication middleware with enhanced error handling
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'error': 'Authentication token is missing', 
                'code': 'TOKEN_MISSING'
            }), 401
        
        try:
            # Verify token and get user ID
            user_id = authenticate_token(token)
            # Store the user ID for use in the route function
            g.user_id = user_id
        except Unauthorized as e:
            return jsonify({
                'error': str(e), 
                'code': 'TOKEN_INVALID'
            }), 401
        except Exception as e:
            return jsonify({
                'error': 'An unexpected error occurred during authentication', 
                'code': 'AUTH_ERROR'
            }), 500
        
        return f(*args, **kwargs)
    
    return decorated

# Register routes
auth_bp.route('/register', methods=['POST'])(register_user)
auth_bp.route('/login', methods=['POST'])(login_user)

# Protected profile routes
@auth_bp.route('/profile', methods=['GET'])
@token_required
def profile():
    """Get the current user's profile information."""
    return get_user_profile()

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update the current user's profile information."""
    return update_user_profile()

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change the current user's password."""
    return change_user_password()