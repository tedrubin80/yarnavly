# Yarn Management System - Setup Guide

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/yarn-management-system.git
cd yarn-management-system

# Install root dependencies and setup workspace
npm install

# Install all project dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your actual values
nano .env
```

**Required Environment Variables:**
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing secret (generate with `openssl rand -base64 64`)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google Drive API credentials
- `RAVELRY_CLIENT_ID` & `RAVELRY_CLIENT_SECRET` - Ravelry API credentials

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb yarn_management

# Run migrations
npm run migrate

# Seed with sample data (optional)
npm run seed
```

### 4. Start Development Environment

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:backend    # Backend API (port 3001)
npm run dev:frontend   # Frontend App (port 3000)
npm run dev:admin      # Admin Panel (port 3002)
```

## 🐳 Docker Deployment

### Quick Docker Setup

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Production Docker Deployment

```bash
# Setup for production
./scripts/setup.sh

# Deploy with Docker
./scripts/deploy.sh
```

## 📦 Package.json Structure

### Root Level (`/package.json`)
- **Workspace management** for monorepo
- **Unified scripts** for all services
- **Development tools** (concurrently, prettier, husky)
- **Git hooks** for code quality

### Backend (`/backend/package.json`)
- **Express.js** web framework
- **Sequelize** ORM for PostgreSQL
- **Authentication** (JWT, bcrypt)
- **File handling** (multer, sharp)
- **API integrations** (Google Drive, Ravelry)
- **Testing** (Jest, supertest)

### Frontend (`/frontend/package.json`)
- **React 18** with TypeScript
- **Material-UI** for components
- **React Query** for data fetching
- **React Router** for navigation
- **Form handling** (react-hook-form)
- **File uploads** (react-dropzone)

### Admin (`/admin/package.json`)
- **React Admin** framework
- **Material-UI** components
- **Data visualization** (recharts)
- **CRUD operations** for all entities

## 🛠️ Available Scripts

### Development
```bash
npm run dev              # Start all services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run dev:admin        # Admin panel only
```

### Building
```bash
npm run build            # Build all services
npm run build:backend    # Backend build
npm run build:frontend   # Frontend build
npm run build:admin      # Admin build
```

### Testing
```bash
npm run test             # Run all tests
npm run test:backend     # Backend tests
npm run test:frontend    # Frontend tests
npm run test:admin       # Admin tests
```

### Code Quality
```bash
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with prettier
```

### Database
```bash
npm run migrate          # Run database migrations
npm run seed             # Seed sample data
npm run backup           # Create database backup
```

### Docker
```bash
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View container logs
```

### Utilities
```bash
npm run clean            # Clean all build artifacts
npm run health           # Check system health
npm run setup            # Initial system setup
npm run deploy           # Production deployment
```

## 🌐 Access Points

After starting the development environment:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Admin Panel**: http://localhost:3002
- **API Documentation**: http://localhost:3001/api/docs (if implemented)
- **Health Check**: http://localhost:3001/api/health

## 🔧 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/yarn-search

# Start development environment
npm run dev

# Make changes and test
npm run test

# Lint and format code
npm run lint:fix
npm run format

# Commit changes (husky will run pre-commit hooks)
git add .
git commit -m "feat: add yarn search functionality"
```

### 2. Database Changes
```bash
# Create new migration
cd backend
npx sequelize-cli migration:generate --name add-yarn-tags

# Edit migration file, then run
npm run migrate
```

### 3. Adding New Dependencies
```bash
# Backend dependency
cd backend && npm install package-name

# Frontend dependency
cd frontend && npm install package-name

# Admin dependency
cd admin && npm install package-name
```

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001
lsof -i :3002
```

**Database connection issues:**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Reset database
dropdb yarn_management
createdb yarn_management
npm run migrate
```

**Node modules issues:**
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

### Environment Issues

**Missing environment variables:**
- Copy `