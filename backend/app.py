from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///budget_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key')
app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'

# Initialize extensions
db = SQLAlchemy(app)

# Sample route
@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "message": "Budget Tracker API is running"})

# Register blueprints (to be implemented)
# from backend.api.routes.user_routes import user_bp
# app.register_blueprint(user_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8000)), debug=app.config['DEBUG'])