# Database Configuration
DATABASE_URL=postgresql://yarn_user:your_password@localhost:5432/yarn_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yarn_management
DB_USER=yarn_user
DB_PASS=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google Drive API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Ravelry API
RAVELRY_USERNAME=your_ravelry_username
RAVELRY_PASSWORD=your_ravelry_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AWS Configuration (for backups)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BACKUP_BUCKET=yarn-management-backups

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090