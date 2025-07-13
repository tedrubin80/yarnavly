-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    ravelry_username VARCHAR(100),
    ravelry_access_key VARCHAR(255),
    ravelry_personal_key VARCHAR(255),
    google_drive_token TEXT,
    google_drive_refresh_token TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yarn Brands
CREATE TABLE yarn_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    website VARCHAR(255),
    ravelry_brand_id INTEGER,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yarn Lines (collections within brands)
CREATE TABLE yarn_lines (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES yarn_brands(id),
    name VARCHAR(255) NOT NULL,
    fiber_content VARCHAR(255),
    weight_category VARCHAR(50), -- Lace, DK, Worsted, etc.
    weight_grams INTEGER,
    yardage_per_skein INTEGER,
    ravelry_yarn_id INTEGER,
    discontinued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Yarn Inventory
CREATE TABLE yarn_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    yarn_line_id INTEGER REFERENCES yarn_lines(id),
    colorway VARCHAR(255),
    color_family VARCHAR(50), -- red, blue, variegated, etc.
    lot_number VARCHAR(100),
    dye_lot VARCHAR(100),
    skeins_total INTEGER DEFAULT 1,
    skeins_remaining DECIMAL(5,2) DEFAULT 1,
    total_yardage INTEGER,
    remaining_yardage INTEGER,
    purchase_date DATE,
    purchase_price DECIMAL(8,2),
    vendor VARCHAR(255),
    storage_location VARCHAR(255),
    storage_bin VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'excellent', -- excellent, good, fair, poor
    ravelry_stash_id INTEGER,
    google_drive_folder_id VARCHAR(255),
    photos JSONB DEFAULT '[]', -- Array of {filename, drive_id, thumbnail_url}
    notes TEXT,
    tags JSONB DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT FALSE,
    last_sync_ravelry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern Categories
CREATE TABLE pattern_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES pattern_categories(id),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- Pattern Designers
CREATE TABLE pattern_designers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    ravelry_designer_id INTEGER,
    bio TEXT,
    photo_url VARCHAR(255)
);

-- Pattern Library
CREATE TABLE patterns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    designer_id INTEGER REFERENCES pattern_designers(id),
    category_id INTEGER REFERENCES pattern_categories(id),
    craft_type VARCHAR(50), -- knitting, crochet, weaving
    difficulty_level INTEGER, -- 1-5
    ravelry_pattern_id INTEGER,
    pattern_source VARCHAR(100), -- book, magazine, website, ravelry
    source_details JSONB, -- {book_title, page_number, magazine_issue, etc}
    
    -- File Management
    original_filename VARCHAR(255),
    file_type VARCHAR(10), -- pdf, doc, docx, jpg, png
    google_drive_file_id VARCHAR(255),
    google_drive_folder_id VARCHAR(255),
    thumbnail_drive_id VARCHAR(255),
    file_size_bytes INTEGER,
    
    -- Pattern Details
    yardage_required INTEGER,
    yardage_max INTEGER,
    needle_sizes JSONB DEFAULT '[]', -- Array of sizes
    hook_sizes JSONB DEFAULT '[]',
    gauge_stitches DECIMAL(4,1),
    gauge_rows DECIMAL(4,1),
    gauge_measurement VARCHAR(20) DEFAULT '4 inches',
    finished_measurements JSONB, -- {chest, length, etc}
    sizes_available JSONB DEFAULT '[]',
    techniques JSONB DEFAULT '[]', -- cables, lace, colorwork, etc
    
    -- Metadata
    price DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'USD',
    purchase_date DATE,
    is_free BOOLEAN DEFAULT FALSE,
    pattern_notes TEXT,
    personal_notes TEXT,
    tags JSONB DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Ravelry Integration
    ravelry_rating DECIMAL(3,2),
    ravelry_rating_count INTEGER,
    ravelry_difficulty_rating DECIMAL(3,2),
    ravelry_projects_count INTEGER,
    ravelry_queued_count INTEGER,
    last_sync_ravelry TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    pattern_id INTEGER REFERENCES patterns(id),
    project_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued', -- queued, active, completed, frogged, hibernating
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    
    -- Timeline
    start_date DATE,
    target_completion_date DATE,
    completion_date DATE,
    total_hours_worked DECIMAL(6,2),
    
    -- Project Details
    size_making VARCHAR(100),
    modifications TEXT,
    progress_notes TEXT,
    final_notes TEXT,
    recipient VARCHAR(255), -- gift recipient
    occasion VARCHAR(255), -- birthday, christmas, etc
    
    -- Photos and Files
    google_drive_folder_id VARCHAR(255),
    progress_photos JSONB DEFAULT '[]',
    finished_photos JSONB DEFAULT '[]',
    
    -- Ravelry Integration
    ravelry_project_id INTEGER,
    ravelry_url VARCHAR(255),
    share_on_ravelry BOOLEAN DEFAULT TRUE,
    last_sync_ravelry TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Yarn Usage
CREATE TABLE project_yarn_usage (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    yarn_inventory_id INTEGER REFERENCES yarn_inventory(id),
    skeins_used DECIMAL(5,2),
    yardage_used INTEGER,
    usage_notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Tracking
CREATE TABLE project_progress (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    progress_date DATE DEFAULT CURRENT_DATE,
    progress_type VARCHAR(50), -- rows_completed, percentage, milestone
    progress_value INTEGER, -- row number, percentage, etc
    progress_description TEXT,
    hours_worked DECIMAL(4,2),
    notes TEXT,
    photo_drive_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping Lists
CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping List Items
CREATE TABLE shopping_list_items (
    id SERIAL PRIMARY KEY,
    shopping_list_id INTEGER REFERENCES shopping_lists(id),
    item_type VARCHAR(50), -- yarn, pattern, notion, tool
    yarn_line_id INTEGER REFERENCES yarn_lines(id),
    pattern_id INTEGER REFERENCES patterns(id),
    item_name VARCHAR(255),
    colorway VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    estimated_price DECIMAL(8,2),
    vendor VARCHAR(255),
    url VARCHAR(500),
    priority INTEGER DEFAULT 0,
    purchased BOOLEAN DEFAULT FALSE,
    purchase_date DATE,
    actual_price DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Drive Sync Log
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    sync_type VARCHAR(50), -- full, incremental, pattern, yarn, project
    entity_type VARCHAR(50), -- pattern, yarn_photo, project_photo
    entity_id INTEGER,
    action VARCHAR(50), -- upload, download, delete, update
    google_drive_file_id VARCHAR(255),
    file_path VARCHAR(500),
    status VARCHAR(50), -- success, error, pending
    error_message TEXT,
    file_size_bytes INTEGER,
    sync_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings (Admin)
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_yarn_inventory_user_id ON yarn_inventory(user_id);
CREATE INDEX idx_yarn_inventory_yarn_line_id ON yarn_inventory(yarn_line_id);
CREATE INDEX idx_yarn_inventory_colorway ON yarn_inventory(colorway);
CREATE INDEX idx_yarn_inventory_tags ON yarn_inventory USING GIN(tags);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_patterns_category_id ON patterns(category_id);
CREATE INDEX idx_patterns_craft_type ON patterns(craft_type);
CREATE INDEX idx_patterns_tags ON patterns USING GIN(tags);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pattern_id ON projects(pattern_id);
CREATE INDEX idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);

-- Full-text search indexes
CREATE INDEX idx_patterns_search ON patterns USING GIN(to_tsvector('english', title || ' ' || COALESCE(pattern_notes, '') || ' ' || COALESCE(personal_notes, '')));
CREATE INDEX idx_yarn_search ON yarn_inventory USING GIN(to_tsvector('english', colorway || ' ' || COALESCE(notes, '')));

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yarn_inventory_updated_at BEFORE UPDATE ON yarn_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();