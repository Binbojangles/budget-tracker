# init_db.py
import time
import os
import psycopg2
from sqlalchemy.exc import OperationalError
from backend.app import create_app
from backend.models import db, User, Category

def wait_for_db(max_retries=30, retry_interval=2):
    """Wait for the database to be ready."""
    retries = 0
    print("Waiting for database...")
    
    db_params = {
        'database': os.getenv('POSTGRES_DB', 'budget_tracker'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'host': 'db',
        'port': '5432'
    }
    
    while retries < max_retries:
        try:
            conn = psycopg2.connect(**db_params)
            conn.close()
            print("Database is ready!")
            return True
        except psycopg2.OperationalError:
            retries += 1
            print(f"Database not ready yet. Retry {retries}/{max_retries}...")
            time.sleep(retry_interval)
    
    print("Failed to connect to the database after maximum retries.")
    return False

def init_database():
    """Initialize the database with tables and initial data."""
    # Wait for database to be ready
    if not wait_for_db():
        return False
        
    app = create_app()
    with app.app_context():
        try:
            # Create tables
            db.create_all()
            
            # Check if we need to create initial user
            if User.query.count() == 0:
                print("Creating initial admin user...")
                admin = User(
                    username="admin",
                    email="admin@example.com",
                    password="admin123",  # Change this in production!
                    first_name="Admin",
                    last_name="User"
                )
                db.session.add(admin)
                # Commit the user FIRST to get the ID
                db.session.commit()
                
                print(f"Admin user created with ID: {admin.id}")
                
                # Now create default categories with the user ID
                print(f"Creating default categories for user {admin.id}...")
                categories = Category.create_default_categories(admin.id)
                for category in categories:
                    db.session.add(category)
                    
                # Commit the categories
                db.session.commit()
                print("Default categories created successfully.")
            return True
        except OperationalError as e:
            print(f"Database error: {e}")
            return False

if __name__ == "__main__":
    init_database()