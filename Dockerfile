FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Run the application
CMD ["./start.sh"]