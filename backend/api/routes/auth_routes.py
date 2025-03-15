from flask import Blueprint, request, jsonify, g
from functools import wraps
from backend.api.controllers.auth_controller import register_user, login_user, authenticate_token
from werkzeug.exceptions import Unauthorized

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Register routes
auth_bp.route('/register', methods=['POST'])(register_user)
auth_bp.route('/login', methods=['POST'])(login_user)

# Token authentication middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        try:
            # Verify token and get user ID
            user_id = authenticate_token(token)
            # Store the user ID for use in the route function
            g.user_id = user_id
        except Unauthorized as e:
            return jsonify({'error': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# Test protected route
@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    from backend.models import User
    user = User.query.get(g.user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'created_at': user.created_at.isoformat()
    }), 200