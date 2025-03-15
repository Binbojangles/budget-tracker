#!/bin/bash

# Wait for PostgreSQL to start
echo "Waiting for database..."
sleep 5

# Initialize the database
python init_db.py

# Start the application
if [ "$ENVIRONMENT" = "production" ]; then
    gunicorn --bind 0.0.0.0:8000 backend.app:app
else
    gunicorn --bind 0.0.0.0:8000 --reload backend.app:app
fi