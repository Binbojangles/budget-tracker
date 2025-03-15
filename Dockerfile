FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client for wait script
RUN apt-get update && apt-get install -y postgresql-client

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Set entrypoint directly with Python commands
CMD ["bash", "-c", "python init_db.py && gunicorn --bind 0.0.0.0:8000 --reload backend.app:app"]