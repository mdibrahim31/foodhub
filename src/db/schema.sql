-- ==============================================================================
-- FOODIPLACE COMPLETE DATABASE SCHEMA & TABLES
-- SQL Migration Script for PostgreSQL / Supabase
-- ==============================================================================

-- 1. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'set-001',
  per_km_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  base_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  rider_match_radius_km NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT '৳',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1B. DELIVERY & RIDER ZONES TABLE
CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  bn_name VARCHAR(255),
  description TEXT,
  center_latitude NUMERIC(10, 6) NOT NULL DEFAULT 22.3590,
  center_longitude NUMERIC(10, 6) NOT NULL DEFAULT 91.8380,
  radius_km NUMERIC(10, 2) NOT NULL DEFAULT 3.00,
  boundary_coordinates JSONB,
  color VARCHAR(50) DEFAULT '#E11D48',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. VENDORS / RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  unique_id VARCHAR(50) UNIQUE, -- e.g. VND-1001
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image TEXT,
  cuisine VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  zone VARCHAR(100) NOT NULL DEFAULT 'Chawkbazar Zone',
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  google_maps_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  is_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  boost_banner_title TEXT,
  boost_banner_subtitle TEXT,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  estimated_prep_time_minutes INT NOT NULL DEFAULT 20,
  featured_position INT, -- 1 to 5 for ranking in top serial
  is_password_set BOOLEAN NOT NULL DEFAULT FALSE,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FOOD CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS food_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INT DEFAULT 0
);

-- 4. PROMOTIONAL ADS & HERO BANNERS TABLE
CREATE TABLE IF NOT EXISTS ads_banners (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  action_text VARCHAR(100) DEFAULT 'Redeem now',
  image_url TEXT NOT NULL,
  target_vendor_id VARCHAR(255) REFERENCES vendors(id) ON DELETE SET NULL,
  target_category VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category VARCHAR(100) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. RIDERS FLEET TABLE
CREATE TABLE IF NOT EXISTS riders (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  photo_url TEXT,
  home_address TEXT,
  zone VARCHAR(100) NOT NULL DEFAULT 'Chawkbazar Zone',
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Motorcycle',
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  current_latitude NUMERIC(10, 6) NOT NULL DEFAULT 22.3590,
  current_longitude NUMERIC(10, 6) NOT NULL DEFAULT 91.8380,
  last_location_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  cash_in_hand NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  is_password_set BOOLEAN NOT NULL DEFAULT FALSE,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CUSTOMER USERS TABLE
CREATE TABLE IF NOT EXISTS customer_users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  password TEXT,
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
  id VARCHAR(255) PRIMARY KEY,
  customer_phone VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  address_line TEXT NOT NULL,
  details TEXT,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  zone VARCHAR(100),
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. FV-84920
  customer_id VARCHAR(255) REFERENCES customer_users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  vendor_id VARCHAR(255) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  rider_id VARCHAR(255) REFERENCES riders(id) ON DELETE SET NULL,
  zone VARCHAR(100),
  delivery_address TEXT NOT NULL,
  delivery_latitude NUMERIC(10, 6) NOT NULL,
  delivery_longitude NUMERIC(10, 6) NOT NULL,
  food_total NUMERIC(10, 2) NOT NULL,
  delivery_distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  total_cash_payable NUMERIC(10, 2) NOT NULL,
  food_cash_paid_to_vendor BOOLEAN NOT NULL DEFAULT FALSE,
  food_and_delivery_cash_collected_from_customer BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  vendor_prep_minutes INT,
  prep_ends_at TIMESTAMP WITH TIME ZONE,
  customer_confirmed_prep BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id VARCHAR(255) REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  item_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_vendors_zone ON vendors(zone);
CREATE INDEX IF NOT EXISTS idx_riders_zone ON riders(zone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads_banners(is_active);
