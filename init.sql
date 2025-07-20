-- init.sql
-- Initial database setup for Yarn Management System

-- Create database if not exists (run as superuser)
-- CREATE DATABASE yarn_management;

-- Connect to the database
\c yarn_management;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE yarn_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE project_status AS ENUM ('queued', 'active', 'completed', 'frogged', 'hibernating');
CREATE TYPE craft_type AS ENUM ('knitting', 'crochet', 'weaving', 'spinning', 'dyeing');
CREATE TYPE sync_status AS ENUM ('success', 'error', 'pending');
CREATE TYPE item_type AS ENUM ('yarn', 'pattern', 'notion', 'tool');

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE yarn_management TO yarn_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yarn_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yarn_user;
GRANT USAGE ON TYPE user_role TO yarn_user;
GRANT USAGE ON TYPE yarn_condition TO yarn_user;
GRANT USAGE ON TYPE project_status TO yarn_user;
GRANT USAGE ON TYPE craft_type TO yarn_user;
GRANT USAGE ON TYPE sync_status TO yarn_user;
GRANT USAGE ON TYPE item_type TO yarn_user;