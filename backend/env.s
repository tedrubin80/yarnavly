# .env.example (root level)
# Copy this to .env and fill in your actual values

# Database Configuration
DB_PASSWORD=generate_secure_password_here
DATABASE_URL=postgresql://yarn_user:${DB_PASSWORD}@localhost:5432/yarn_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yarn_management
DB_USER=yarn_user

# JWT Configuration (generate with: openssl rand -base64 64)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ADMIN_URL=http://localhost:3002

# Google Drive API (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Ravelry API (get from Ravelry Developer)
RAVELRY_CLIENT_ID=your_ravelry_client_id
RAVELRY_CLIENT_SECRET=your_ravelry_client_secret

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

# Production overrides (uncomment for production)
# NODE_ENV=production
# FRONTEND_URL=https://yarn.yourdomain.com
# REACT_APP_API_URL=https://yarn.yourdomain.com/api