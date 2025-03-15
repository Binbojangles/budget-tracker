# PowerShell script to set up the budget tracker project structure
$PROJECT_NAME = "budget-tracker"

# Navigate to the cloned repository (assuming you're already there)
# If not, uncomment and modify the next line
# Set-Location -Path C:\path\to\your\$PROJECT_NAME

# Create backend structure
New-Item -Path "backend" -ItemType Directory -Force
New-Item -Path "backend\api", "backend\api\routes", "backend\api\controllers" -ItemType Directory -Force
New-Item -Path "backend\models", "backend\models\schemas" -ItemType Directory -Force
New-Item -Path "backend\services", "backend\services\parsers", "backend\services\analyzers", "backend\services\recommendations" -ItemType Directory -Force
New-Item -Path "backend\utils", "backend\utils\helpers", "backend\utils\validators" -ItemType Directory -Force
New-Item -Path "backend\tests", "backend\tests\unit", "backend\tests\integration" -ItemType Directory -Force
New-Item -Path "backend\config", "backend\config\development", "backend\config\production" -ItemType Directory -Force

# Create frontend structure
New-Item -Path "frontend" -ItemType Directory -Force
New-Item -Path "frontend\static", "frontend\static\css", "frontend\static\js", "frontend\static\images" -ItemType Directory -Force
New-Item -Path "frontend\templates" -ItemType Directory -Force
New-Item -Path "frontend\components", "frontend\components\dashboard", "frontend\components\forms", "frontend\components\charts", "frontend\components\common" -ItemType Directory -Force
New-Item -Path "frontend\assets", "frontend\assets\icons", "frontend\assets\fonts" -ItemType Directory -Force

# Create database directory
New-Item -Path "database", "database\migrations" -ItemType Directory -Force

# Create documentation directory
New-Item -Path "docs", "docs\api", "docs\usage", "docs\development" -ItemType Directory -Force

# Create deployment directory
New-Item -Path "deployment", "deployment\scripts", "deployment\config" -ItemType Directory -Force

# Create initial files
New-Item -Path "README.md" -ItemType File -Force
New-Item -Path ".gitignore" -ItemType File -Force
New-Item -Path "requirements.txt" -ItemType File -Force
New-Item -Path "setup.py" -ItemType File -Force
New-Item -Path "backend\__init__.py" -ItemType File -Force
New-Item -Path "backend\app.py" -ItemType File -Force
New-Item -Path "frontend\index.html" -ItemType File -Force
New-Item -Path ".env" -ItemType File -Force
New-Item -Path ".env.example" -ItemType File -Force
New-Item -Path "docker-compose.yml" -ItemType File -Force
New-Item -Path "Dockerfile" -ItemType File -Force

Write-Host "Project structure for $PROJECT_NAME has been created successfully!"