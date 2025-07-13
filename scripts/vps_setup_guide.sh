#!/bin/bash

# =============================================================================
# COMPLETE VPS SETUP FOR YARN MANAGEMENT SYSTEM (PERN STACK)
# =============================================================================
# This script sets up everything from scratch on Ubuntu 22.04 LTS
# Run as root or with sudo privileges

set -e  # Exit on any error

echo "🚀 Starting complete PERN stack setup for Yarn Management System..."

# =============================================================================
# STEP 1: SYSTEM UPDATE AND BASIC TOOLS
# =============================================================================
echo "📦 Updating system packages..."
apt update && apt upgrade -y

echo "🛠️ Installing essential tools..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    vim \
    ufw \
    fail2ban

# =============================================================================
# STEP 2: INSTALL NODE.JS (Latest LTS)
# =============================================================================
echo "🟢 Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Verify installation
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install global packages
npm install -g pm2 nodemon

# =============================================================================
# STEP 3: INSTALL POSTGRESQL
# =============================================================================
echo "🐘 Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
echo "🗄️ Setting up database..."
sudo -u postgres createuser --interactive --pwprompt yarn_user || true
sudo -u postgres createdb yarn_management || true

# Configure PostgreSQL for remote connections (if needed)
PG_VERSION=$(ls /etc/postgresql/)
PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Backup original configs
cp $PG_CONFIG $PG_CONFIG.backup
cp $PG_HBA $PG_HBA.backup

# Allow connections from localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONFIG

# Restart PostgreSQL
systemctl restart postgresql

echo "✅ PostgreSQL installed and configured"

# =============================================================================
# STEP 4: INSTALL REDIS
# =============================================================================
echo "🔴 Installing Redis..."
apt install -y redis-server

# Configure Redis
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf

# Start and enable Redis
systemctl restart redis-server
systemctl enable redis-server

echo "✅ Redis installed and configured"

# =============================================================================
# STEP 5: INSTALL NGINX
# =============================================================================
echo "🌐 Installing Nginx..."
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

echo "✅ Nginx installed"

# =============================================================================
# STEP 6: INSTALL DOCKER & DOCKER COMPOSE (Alternative deployment method)
# =============================================================================
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group (if not root)
if [ "$EUID" -ne 0 ]; then
    usermod -aG docker $USER
fi

echo "✅ Docker installed"

# =============================================================================
# STEP 7: FIREWALL CONFIGURATION
# =============================================================================
echo "🔥 Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432  # PostgreSQL (only if needed externally)
ufw status

echo "✅ Firewall configured"

# =============================================================================
# STEP 8: CREATE PROJECT STRUCTURE
# =============================================================================
echo "📁 Creating project structure..."

PROJECT_DIR="/var/www/yarn-management"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Create main directories
mkdir -p {backend,frontend,admin,nginx,uploads,logs,backups}

# Set proper permissions
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

echo "✅ Project structure created at $PROJECT_DIR"

# =============================================================================
# STEP 9: CREATE BACKEND EXPRESS APP
# =============================================================================
echo "🔧 Setting up backend Express application..."
cd $PROJECT_DIR/backend

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "yarn-management-backend",
  "version": "1.0.0",
  "description": "Backend API for Yarn Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.1",
    "pg": "^8.11.0",
    "sequelize": "^6.32.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.1",
    "googleapis": "^121.0.0",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "winston": "^3.9.0",
    "joi": "^17.9.2",
    "redis": "^4.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Install backend dependencies
npm install

echo "✅ Backend dependencies installed"

# =============================================================================
# STEP 10: CREATE FRONTEND REACT APP
# =============================================================================
echo "⚛️ Setting up frontend React application..."
cd $PROJECT_DIR/frontend

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install additional frontend dependencies
npm install \
    @mui/material \
    @emotion/react \
    @emotion/styled \
    @mui/icons-material \
    @tanstack/react-query \
    react-router-dom \
    react-hook-form \
    react-dropzone \
    react-beautiful-dnd

echo "✅ Frontend React app created"

# =============================================================================
# STEP 11: CREATE ADMIN PANEL
# =============================================================================
echo "👨‍💼 Setting up admin panel..."
cd $PROJECT_DIR/admin

# Create admin app
npx create-react-app . --template typescript

# Install React Admin
npm install \
    react-admin \
    ra-data-simple-rest \
    @mui/material \
    @emotion/react \
    @emotion/styled

echo "✅ Admin panel created"

# =============================================================================
# STEP 12: CREATE BASIC SERVER FILES
# =============================================================================
echo "📝 Creating basic server configuration..."

# Backend server.js
cat > $PROJECT_DIR/backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Yarn Management API Server Running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
EOF

# Create .env template
cat > $PROJECT_DIR/backend/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://yarn_user:your_password@localhost:5432/yarn_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yarn_management
DB_USER=yarn_user
DB_PASS=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

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
EOF

# Copy .env template to actual .env file
cp $PROJECT_DIR/backend/.env.example $PROJECT_DIR/backend/.env

echo "✅ Basic server files created"

# =============================================================================
# STEP 13: CREATE NGINX CONFIGURATION
# =============================================================================
echo "🌐 Creating Nginx configuration..."

cat > $PROJECT_DIR/nginx/yarn-management.conf << 'EOF'
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

upstream admin {
    server localhost:3002;
}

# Main application
server {
    listen 80;
    server_name localhost;  # Replace with your domain
    client_max_body_size 100M;

    # Frontend (React app)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
    }

    # Static file serving
    location /uploads/ {
        alias /var/www/yarn-management/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin panel
server {
    listen 8080;
    server_name localhost;  # Replace with admin.yourdomain.com

    location / {
        proxy_pass http://admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf $PROJECT_DIR/nginx/yarn-management.conf /etc/nginx/sites-available/yarn-management
ln -sf /etc/nginx/sites-available/yarn-management /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo "✅ Nginx configured"

# =============================================================================
# STEP 14: CREATE PM2 ECOSYSTEM FILE
# =============================================================================
echo "⚙️ Creating PM2 ecosystem configuration..."

cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'yarn-backend',
      script: './backend/server.js',
      cwd: '/var/www/yarn-management',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'yarn-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: '/var/www/yarn-management/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'yarn-admin',
      script: 'serve',
      args: '-s build -l 3002',
      cwd: '/var/www/yarn-management/admin',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_file: './logs/admin-combined.log',
      time: true
    }
  ]
};
EOF

# Install serve globally for serving React builds
npm install -g serve

echo "✅ PM2 ecosystem configured"

# =============================================================================
# STEP 15: CREATE HELPFUL SCRIPTS
# =============================================================================
echo "📜 Creating management scripts..."

# Start script
cat > $PROJECT_DIR/start.sh << 'EOF'
#!/bin/bash
cd /var/www/yarn-management

echo "🚀 Starting Yarn Management System..."

# Start backend in development mode
echo "Starting backend..."
cd backend && npm run dev &

# Start frontend in development mode
echo "Starting frontend..."
cd ../frontend && npm start &

# Start admin in development mode
echo "Starting admin..."
cd ../admin && PORT=3002 npm start &

echo "✅ All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001/api"
echo "Admin Panel: http://localhost:3002"
EOF

# Production start script
cat > $PROJECT_DIR/start-production.sh << 'EOF'
#!/bin/bash
cd /var/www/yarn-management

echo "🚀 Starting Yarn Management System (Production)..."

# Build frontend and admin
echo "Building frontend..."
cd frontend && npm run build

echo "Building admin..."
cd ../admin && npm run build

# Start with PM2
echo "Starting with PM2..."
pm2 start ecosystem.config.js

echo "✅ Production services started!"
echo "Frontend: http://localhost"
echo "Admin Panel: http://localhost:8080"
pm2 status
EOF

# Stop script
cat > $PROJECT_DIR/stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Yarn Management System..."
pm2 stop ecosystem.config.js
pm2 delete ecosystem.config.js
echo "✅ All services stopped!"
EOF

# Make scripts executable
chmod +x $PROJECT_DIR/*.sh

echo "✅ Management scripts created"

# =============================================================================
# STEP 16: CREATE BASIC DATABASE MIGRATION
# =============================================================================
echo "🗄️ Creating basic database setup..."

mkdir -p $PROJECT_DIR/backend/scripts

cat > $PROJECT_DIR/backend/scripts/migrate.js << 'EOF'
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Users table created');

    // Create yarn_brands table
    await client.query(`
      CREATE TABLE IF NOT EXISTS yarn_brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Yarn brands table created');

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

createTables();
EOF

echo "✅ Database migration script created"

# =============================================================================
# STEP 17: FINAL SETUP AND INSTRUCTIONS
# =============================================================================
echo "🎯 Final setup..."

# Set proper ownership
chown -R $USER:$USER $PROJECT_DIR
chown -R www-data:www-data $PROJECT_DIR/uploads

# Create logs directory
mkdir -p $PROJECT_DIR/logs
chmod 755 $PROJECT_DIR/logs

echo ""
echo "🎉 YARN MANAGEMENT SYSTEM SETUP COMPLETE!"
echo "============================================="
echo ""
echo "📍 Project Location: $PROJECT_DIR"
echo ""
echo "🔧 Next Steps:"
echo "1. Edit backend/.env file with your database credentials and API keys"
echo "2. Run the database migration:"
echo "   cd $PROJECT_DIR/backend && npm run migrate"
echo "3. Start development servers:"
echo "   cd $PROJECT_DIR && ./start.sh"
echo "4. Or start production servers:"
echo "   cd $PROJECT_DIR && ./start-production.sh"
echo ""
echo "🌐 Access Points:"
echo "- Frontend: http://your-server-ip"
echo "- Backend API: http://your-server-ip/api"
echo "- Admin Panel: http://your-server-ip:8080"
echo "- Health Check: http://your-server-ip/api/health"
echo ""
echo "📚 Important Files:"
echo "- Backend config: $PROJECT_DIR/backend/.env"
echo "- Nginx config: $PROJECT_DIR/nginx/yarn-management.conf"
echo "- PM2 config: $PROJECT_DIR/ecosystem.config.js"
echo "- Start script: $PROJECT_DIR/start.sh"
echo "- Production script: $PROJECT_DIR/start-production.sh"
echo ""
echo "🔑 Don't forget to:"
echo "- Configure your domain in Nginx config"
echo "- Set up SSL certificates (Let's Encrypt recommended)"
echo "- Configure your .env file with real API credentials"
echo "- Set up regular backups"
echo ""
echo "📖 Useful Commands:"
echo "- Check services: pm2 status"
echo "- View logs: pm2 logs"
echo "- Restart services: pm2 restart ecosystem.config.js"
echo "- Check database: sudo -u postgres psql yarn_management"
echo ""

# Display system info
echo "💻 System Information:"
echo "- Node.js: $(node --version)"
echo "- NPM: $(npm --version)"
echo "- PostgreSQL: $(sudo -u postgres psql --version | head -1)"
echo "- Redis: $(redis-server --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo "- Docker: $(docker --version)"
echo ""

echo "✨ Your PERN stack is ready! Happy coding!"