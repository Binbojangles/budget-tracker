from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from backend.models import db
from backend.api.routes.auth_routes import auth_bp
from backend.api.routes.account_routes import account_bp
from backend.api.routes.transaction_routes import transaction_bp
from backend.api.routes.upload_routes import upload_bp
from backend.api.routes.analysis_routes import analysis_bp

# Load environment variables
load_dotenv()

def create_app(config=None):
    """Create and configure the Flask app."""
    app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')
    
    # Configure app
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///budget_tracker.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key')
    app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
    
    # Apply any custom config
    if config:
        app.config.update(config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(analysis_bp)
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "Budget Tracker API is running"})
    
    # Serve frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        from flask import send_from_directory, render_template
        
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        
        return render_template('index.html')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])