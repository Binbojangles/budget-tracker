# init_db.py
from backend.app import create_app
from backend.models import db, User, Category

def init_database():
    app = create_app()
    with app.app_context():
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
            
            # Create default categories
            categories = Category.create_default_categories(admin.id)
            for category in categories:
                db.session.add(category)
                
            db.session.commit()
            print("Admin user and default categories created.")

if __name__ == "__main__":
    init_database()