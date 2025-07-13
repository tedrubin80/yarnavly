#!/bin/bash

# This script will prompt you to paste each file content
create_file() {
    local filepath="$1"
    local description="$2"
    
    echo "========================================"
    echo "Creating: $filepath"
    echo "Description: $description"
    echo "========================================"
    echo "Please paste the content below, then press Ctrl+D when done:"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$filepath")"
    
    # Read content from stdin
    cat > "$filepath"
    
    echo "✅ Created: $filepath"
    echo ""
}

# Create all the files
create_file "backend/models/index.js" "Database models"
create_file "backend/middleware/auth.js" "Authentication middleware"
create_file "backend/middleware/upload.js" "File upload middleware"
create_file "backend/middleware/errorHandler.js" "Error handling"
create_file "backend/routes/auth.js" "Authentication routes"
create_file "backend/services/ravelryService.js" "Ravelry API service"
create_file "frontend/src/hooks/useApi.js" "API hooks"
create_file "frontend/src/contexts/AuthContext.js" "Auth context"
create_file "frontend/src/utils/constants.js" "Constants"
create_file "backend/Dockerfile" "Backend Docker config"
create_file "frontend/Dockerfile" "Frontend Docker config"
create_file "admin/Dockerfile" "Admin Docker config"
create_file "docker-compose.override.yml" "Development overrides"
create_file "monitoring/docker-compose.monitoring.yml" "Monitoring stack"
create_file "monitoring/prometheus.yml" "Prometheus config"
create_file "security/nginx-security.conf" "Security headers"
create_file "scripts/backup-database.sh" "Backup script"
create_file "scripts/health-check.sh" "Health check script"
create_file ".gitignore" "Git ignore"
create_file ".dockerignore" "Docker ignore"
create_file "Makefile" "Development commands"
create_file ".vscode/settings.json" "VS Code settings"

echo "🎉 All files created! Remember to:"
echo "1. Make scripts executable: chmod +x scripts/*.sh"
echo "2. Configure your .env files"
echo "3. Update file permissions as needed"
