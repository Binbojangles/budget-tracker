from flask import Flask, jsonify, send_from_directory, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import os
from backend.models import db
from backend.api.routes.auth_routes import auth_bp
from backend.api.routes.account_routes import account_bp
from backend.api.routes.transaction_routes import transaction_bp
from backend.api.routes.upload_routes import upload_bp
from backend.api.routes.analysis_routes import analysis_bp
import logging
from logging.handlers import RotatingFileHandler
from flask import request

# Load environment variables
load_dotenv()

def configure_logging(app):
    # Ensure logs directory exists
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Configure file logging
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'), 
        maxBytes=10240, 
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Add handlers to app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)



def create_app(config=None):
    """Create and configure the Flask app."""
    # Determine the base directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(base_dir, 'frontend')
    static_dir = os.path.join(frontend_dir, 'static')
    templates_dir = os.path.join(frontend_dir, 'templates')

    app = Flask(__name__, 
                static_folder=static_dir, 
                template_folder=templates_dir)
    
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
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(analysis_bp)
    
    def setup_logging(app):
    # Configure logging
        handler = logging.FileHandler('app.log')
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)
    
    # Log all requests
    @app.before_request
    def log_request_info():
        app.logger.info(f'Request Headers: {request.headers}')
        app.logger.info(f'Request Path: {request.path}')
        app.logger.info(f'Request Method: {request.method}')
        
        # Log request data more comprehensively
        if request.method == 'POST':
            # Log form data
            if request.form:
                app.logger.info(f'Request Form Data: {request.form}')
            
            # Log JSON data
            try:
                if request.json:
                    app.logger.info(f'Request JSON Data: {request.json}')
            except Exception as e:
                app.logger.info(f'No valid JSON in request: {str(e)}')
            
            # Log raw data
            if request.data:
                app.logger.info(f'Request Raw Data: {request.data[:1000]}')  # Truncate if too large
                
    @app.after_request
    def log_response_info(response):
        app.logger.info(f'Response Status: {response.status}')
        app.logger.info(f'Response Headers: {response.headers}')
        return response
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "Budget Tracker API is running"})
    
    # Static file routes
    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory(static_dir, path)
        
    # Add direct routes for HTML templates
    @app.route('/login.html')
    @app.route('/login')
    def login_page():
        return render_template('standalone_login.html')
        
    @app.route('/register.html')
    @app.route('/register')
    def register_page():
        return render_template('standalone_register.html')
        
    @app.route('/dashboard.html')
    @app.route('/dashboard')
    def dashboard_page():
        return render_template('standalone_dashboard.html')
        
    @app.route('/accounts.html')
    @app.route('/accounts')
    def accounts_page():
        return render_template('standalone_accounts.html')
        
    @app.route('/transactions.html')
    @app.route('/transactions')
    def transactions_page():
        return render_template('standalone_transactions.html')
        
    @app.route('/budgets.html')
    @app.route('/budgets')
    def budgets_page():
        return render_template('standalone_budgets.html')
        
    @app.route('/reports.html')
    @app.route('/reports')
    def reports_page():
        return render_template('standalone_reports.html')

    # Root route - serve login page
    @app.route('/')
    def index():
        # Serve the login page as the default landing page
        return render_template('standalone_login.html')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Add logging setup
    setup_logging(app)

    # Enable CORS with more permissive settings
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "allow_headers": [
                "Content-Type", 
                "Authorization", 
                "Access-Control-Allow-Credentials"
            ],
            "supports_credentials": True
        }
    })

    configure_logging(app)

    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])