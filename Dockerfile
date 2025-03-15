FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client for wait script
RUN apt-get update && apt-get install -y postgresql-client

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Make scripts executable
RUN chmod +x start.sh
RUN chmod +x wait-for-db.sh

# Run the application with wait script
CMD ["./wait-for-db.sh", "db", "./start.sh"]