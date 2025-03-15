#!/usr/bin/env python
"""
Budget Tracker Setup Script

This script helps with setting up the Budget Tracker application by:
1. Creating necessary directories
2. Setting up the virtual environment
3. Installing dependencies
4. Initializing the database
5. Creating a sample user and data (optional)
"""

import os
import sys
import subprocess
import argparse
import platform
import venv
import shutil
from pathlib import Path

def print_step(step, message):
    """Print a formatted step message."""
    print(f"\n\033[1;34m[{step}]\033[0m {message}")

def print_success(message):
    """Print a success message."""
    print(f"\033[1;32m✓ {message}\033[0m")

def print_error(message):
    """Print an error message."""
    print(f"\033[1;31m✗ {message}\033[0m")

def run_command(command, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            text=True, 
            capture_output=True,
            cwd=cwd
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {e}")
        print(e.stdout)
        print(e.stderr)
        return None

def create_directories():
    """Create the project directory structure."""
    print_step(1, "Creating project directory structure...")
    
    directories = [
        # Backend structure
        "backend/api/routes",
        "backend/api/controllers",
        "backend/models/schemas",
        "backend/services/parsers",
        "backend/services/analyzers",
        "backend/services/recommendations",
        "backend/utils/helpers",
        "backend/utils/validators",
        "backend/tests/unit",
        "backend/tests/integration",
        "backend/config/development",
        "backend/config/production",
        
        # Frontend structure
        "frontend/static/css",
        "frontend/static/js",
        "frontend/static/images",
        "frontend/templates",
        "frontend/components/dashboard",
        "frontend/components/forms",
        "frontend/components/charts",
        "frontend/components/common",
        "frontend/assets/icons",
        "frontend/assets/fonts",
        
        # Database directory
        "database/migrations",
        
        # Documentation directory
        "docs/api",
        "docs/usage",
        "docs/development",
        
        # Deployment directory
        "deployment/scripts",
        "deployment/config",
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"  Created {directory}")
    
    # Create initial files if they don't exist
    files = [
        "README.md",
        ".gitignore",
        "requirements.txt",
        "backend/__init__.py",
        "backend/app.py",
        "frontend/index.html",
        ".env",
        ".env.example",
        "docker-compose.yml",
        "Dockerfile",
    ]
    
    for file in files:
        if not os.path.exists(file):
            with open(file, 'w') as f:
                f.write('')
            print(f"  Created {file}")
    
    print_success("Directory structure created successfully!")

def setup_virtual_environment():
    """Create and activate a Python virtual environment."""
    print_step(2, "Setting up Python virtual environment...")
    
    # Check if venv already exists
    if os.path.exists("venv"):
        overwrite = input("Virtual environment already exists. Recreate? (y/n): ").lower()
        if overwrite == 'y':
            shutil.rmtree("venv")
        else:
            print("Skipping virtual environment creation.")
            return
    
    # Create venv
    venv.create("venv", with_pip=True)
    print_success("Virtual environment created successfully!")
    
    # Print activation instructions
    print("\nTo activate the virtual environment:")
    if platform.system() == "Windows":
        print("  Run: .\\venv\\Scripts\\activate")
    else:
        print("  Run: source venv/bin/activate")

def install_dependencies():
    """Install Python dependencies."""
    print_step(3, "Installing dependencies...")
    
    venv_python = os.path.join("venv", "Scripts", "python") if platform.system() == "Windows" else os.path.join("venv", "bin", "python")
    
    # Install from requirements.txt if it exists and has content
    if os.path.exists("requirements.txt") and os.path.getsize("requirements.txt") > 0:
        run_command(f'"{venv_python}" -m pip install -r requirements.txt')
    else:
        # Install core dependencies
        dependencies = [
            "flask",
            "flask-sqlalchemy",
            "flask-cors",
            "python-dotenv",
            "werkzeug",
            "pyjwt",
            "pandas",
            "numpy",
            "openpyxl",
            "matplotlib",
            "pytest",
            "gunicorn",
            "psycopg2-binary",
        ]
        
        command = f'"{venv_python}" -m pip install {" ".join(dependencies)}'
        run_command(command)
        
        # Save installed packages to requirements.txt
        run_command(f'"{venv_python}" -m pip freeze > requirements.txt')
    
    print_success("Dependencies installed successfully!")

def initialize_database():
    """Initialize the application database."""
    print_step(4, "Initializing database...")

    # Check if database file already exists
    if os.path.exists("budget_tracker.db"):
        overwrite = input("Database already exists. Recreate? (y/n): ").lower()
        if overwrite == 'y':
            os.remove("budget_tracker.db")
        else:
            print("Skipping database initialization.")
            return
    
    venv_python = os.path.join("venv", "Scripts", "python") if platform.system() == "Windows" else os.path.join("venv", "bin", "python")
    
    # Create database tables
    print("Creating database tables...")
    
    # Create a temporary script to initialize the database
    with open("database/init_db.py", "w") as f:
        f.write("""
import sys
import os
sys.path.append(os.getcwd())
from backend.app import create_app
from backend.models import db

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created successfully.")
""")
    
    result = run_command(f'"{venv_python}" database/init_db.py')
    
    if result and "Database tables created successfully" in result:
        print_success("Database initialized successfully!")
    else:
        print_error("Failed to initialize database.")

def create_sample_data():
    """Create sample user and data for testing."""
    print_step(5, "Creating sample data...")
    
    venv_python = os.path.join("venv", "Scripts", "python") if platform.system() == "Windows" else os.path.join("venv", "bin", "python")
    
    # Run the seed script
    result = run_command(f'"{venv_python}" database/seed_db.py')
    
    if result and "Database seeding complete" in result:
        print_success("Sample data created successfully!")
    else:
        print_error("Failed to create sample data.")

def start_application():
    """Start the Flask application for testing."""
    print_step(6, "Starting the application...")
    
    venv_python = os.path.join("venv", "Scripts", "python") if platform.system() == "Windows" else os.path.join("venv", "bin", "python")
    
    print("\nStarting Flask development server...")
    print("Press Ctrl+C to stop the server")
    
    # Set environment variables
    os.environ["FLASK_APP"] = "backend.app"
    os.environ["FLASK_ENV"] = "development"
    os.environ["FLASK_DEBUG"] = "1"
    
    # Run Flask
    command = f'"{venv_python}" -m flask run --host=0.0.0.0 --port=8000'
    
    try:
        subprocess.run(command, shell=True, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except subprocess.CalledProcessError:
        print_error("Failed to start the application.")

def main():
    """Main function to run the setup script."""
    parser = argparse.ArgumentParser(description="Budget Tracker Setup Script")
    parser.add_argument("--skip-venv", action="store_true", help="Skip virtual environment creation")
    parser.add_argument("--skip-deps", action="store_true", help="Skip dependencies installation")
    parser.add_argument("--skip-db", action="store_true", help="Skip database initialization")
    parser.add_argument("--skip-sample", action="store_true", help="Skip sample data creation")
    parser.add_argument("--start", action="store_true", help="Start the application after setup")
    
    args = parser.parse_args()
    
    print("\n🚀 Budget Tracker Setup\n")
    
    create_directories()
    
    if not args.skip_venv:
        setup_virtual_environment()
    
    if not args.skip_deps:
        install_dependencies()
    
    if not args.skip_db:
        initialize_database()
    
    if not args.skip_sample:
        create_sample_data()
    
    print("\n✨ Setup completed successfully! ✨\n")
    
    if args.start:
        start_application()
    else:
        venv_python = os.path.join("venv", "Scripts", "python") if platform.system() == "Windows" else os.path.join("venv", "bin", "python")
        print("To start the application, run:")
        print(f'  {venv_python} -m flask run --app backend.app --host=0.0.0.0 --port=8000')

if __name__ == "__main__":
    main()