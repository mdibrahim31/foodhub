-- ====================================================================
-- FOODIPLACE / FOODHUB CASH-ON-DELIVERY PLATFORM
-- COMPLETE PRODUCTION MASTER DATABASE SCHEMA FOR SUPABASE / POSTGRESQL
-- File: src/db/schema.sql (Consolidated Mirror)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. SYSTEM SETTINGS TABLE (Delivery Charges, Radius & Global Rates)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id VARCHAR(255) PRIMARY KEY DEFAULT 'set-001',
    per_km_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    base_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    rider_match_radius_km NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '৳',
    banner_slide_interval_seconds INT DEFAULT 3,
    banner_slide_auto_play BOOLEAN DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. RIDERS & DELIVERY ZONES TABLE (Admin Configured Boundary & Map)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.zones (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    bn_name VARCHAR(100),
    description TEXT,
    center_latitude DOUBLE PRECISION NOT NULL DEFAULT 22.3590,
    center_longitude DOUBLE PRECISION NOT NULL DEFAULT 91.8380,
    radius_km NUMERIC(10, 2) NOT NULL DEFAULT 3.00,
    boundary_coordinates JSONB,
    color VARCHAR(20) DEFAULT '#E11D48',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. CUSTOMER ACCOUNTS TABLE (Self-Registered Customer Users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. OTP SENDER TABLE (Signup OTP Verification via External Gateway)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.otp_sender (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) NOT NULL,
    otp VARCHAR(10),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5B. SMS FORWARDER TABLE (Android SMS Forwarder App Integration)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.sms_forwarder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender VARCHAR(50),
    phone VARCHAR(50),
    phone_number VARCHAR(50),
    message TEXT,
    content TEXT,
    otp VARCHAR(20),
    sim_slot INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'received',
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 6. VENDORS / RESTAURANTS & GROCERY SHOPS TABLE (Admin Registered)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image TEXT,
    cuisine VARCHAR(100) DEFAULT 'Fast Food, Biryani',
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    zone VARCHAR(100) NOT NULL DEFAULT 'Chawkbazar Zone',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    google_maps_link TEXT,
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    is_boosted BOOLEAN DEFAULT false,
    boost_banner_title TEXT,
    boost_banner_subtitle TEXT,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    estimated_prep_time_minutes INT DEFAULT 20,
    featured_position INT,
    is_password_set BOOLEAN DEFAULT false,
    password TEXT,
    vendor_type VARCHAR(20) DEFAULT 'restaurant',
    restaurant_type VARCHAR(30) DEFAULT 'restaurant',
    opening_schedule JSONB,
    is_permanently_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 7. PROMOTIONAL ADS & HERO BANNERS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.ads_banners (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    subtitle TEXT,
    action_text VARCHAR(100) DEFAULT 'Redeem now',
    image_url TEXT NOT NULL,
    video_url TEXT,
    target_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    target_category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT DEFAULT 0,
    portal_type VARCHAR(20) DEFAULT 'food',
    banner_position VARCHAR(20) DEFAULT 'top',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 8. FOOD CATEGORIES & GROCERY CATEGORIES TABLES (Admin Configured)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.food_categories (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT '🍕',
    image_url TEXT,
    category_type VARCHAR(20) DEFAULT 'food',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grocery_categories (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT '🛒',
    image_url TEXT,
    category_type VARCHAR(20) DEFAULT 'grocery',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 9. MENU ITEMS TABLE (Foods & Dishes)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'Main Course',
    is_available BOOLEAN DEFAULT true,
    variations JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 10. CUSTOMER ADDRESS BOOK (With Map Pin Points & Status)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    label VARCHAR(50) DEFAULT 'Home',
    address_line TEXT NOT NULL,
    details TEXT,
    zone VARCHAR(100) DEFAULT 'Chawkbazar Zone',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 11. RIDERS TABLE (Admin Registered Rider Fleet)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    photo_url TEXT,
    home_address TEXT,
    zone VARCHAR(100) NOT NULL DEFAULT 'Chawkbazar Zone',
    vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
    is_online BOOLEAN DEFAULT false,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    last_location_updated_at TIMESTAMP WITH TIME ZONE,
    cash_in_hand NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT true,
    is_password_set BOOLEAN DEFAULT false,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 12. ORDERS TABLE (Full Cash-On-Delivery, Cooking & Dispatch Lifecycle)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    rider_id UUID REFERENCES public.riders(id),
    zone VARCHAR(100) NOT NULL,
    
    delivery_address TEXT NOT NULL,
    delivery_latitude DOUBLE PRECISION NOT NULL,
    delivery_longitude DOUBLE PRECISION NOT NULL,
    
    food_total NUMERIC(10, 2) NOT NULL,
    delivery_distance_km NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL,
    total_cash_payable NUMERIC(10, 2) NOT NULL,
    
    food_cash_paid_to_vendor BOOLEAN DEFAULT false,
    food_and_delivery_cash_collected_from_customer BOOLEAN DEFAULT false,
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    vendor_prep_minutes INT DEFAULT 15,
    prep_ends_at TIMESTAMP WITH TIME ZONE,
    customer_confirmed_prep BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    
    dispatched_rider_id UUID REFERENCES public.riders(id),
    dispatch_sent_at TIMESTAMP WITH TIME ZONE,
    rejected_rider_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 13. ORDER ITEMS TABLE (Items, Variations & Special Instructions)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(10, 2) NOT NULL,
    selected_variations TEXT[],
    special_instructions TEXT
);

-- ====================================================================
-- 14. CUSTOMER CARTS TABLE (Persistent Multi-Device Shopping Carts)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customer_carts (
    customer_id VARCHAR(255) PRIMARY KEY,
    cart_items JSONB NOT NULL DEFAULT '[]'::JSONB,
    vendor JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 15. REVIEWS & RATINGS TABLE (Customer Order Reviews for Vendors)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_code VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    vendor_reply JSONB,
    dispute JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_review UNIQUE (order_code)
);

-- ====================================================================
-- 16. FAVORITES TABLE (Customer Favorite Vendors)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_customer_vendor_favorite UNIQUE (customer_phone, vendor_id)
);

-- ====================================================================
-- 17. AUTOMATED VENDOR RATING RECALCULATION TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION update_vendor_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendors
  SET rating = ROUND((
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE vendor_id = NEW.vendor_id
  )::numeric, 1)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_rating ON public.reviews;
CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_average_rating();

-- ====================================================================
-- 18. STORAGE BUCKET CONFIGURATION (For Uploading Vendor & Menu Images)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'images'
DROP POLICY IF EXISTS "Public View Storage Images" ON storage.objects;
CREATE POLICY "Public View Storage Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Upload Storage Images" ON storage.objects;
CREATE POLICY "Public Upload Storage Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Update Storage Images" ON storage.objects;
CREATE POLICY "Public Update Storage Images" ON storage.objects FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Delete Storage Images" ON storage.objects;
CREATE POLICY "Public Delete Storage Images" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ====================================================================
-- 19. INDEXES FOR HIGH-PERFORMANCE SEARCH & REAL-TIME
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_zones_active ON public.zones(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_zone ON public.vendors(zone);
CREATE INDEX IF NOT EXISTS idx_riders_zone ON public.riders(zone);
CREATE INDEX IF NOT EXISTS idx_riders_online ON public.riders(is_online);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON public.orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_code ON public.reviews(order_code);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_customer_phone ON public.favorites(customer_phone);
CREATE INDEX IF NOT EXISTS idx_favorites_customer_id ON public.favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON public.favorites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_otp_sender_phone ON public.otp_sender(phone);
CREATE INDEX IF NOT EXISTS idx_sms_forwarder_phone ON public.sms_forwarder(phone);
CREATE INDEX IF NOT EXISTS idx_sms_forwarder_sender ON public.sms_forwarder(sender);
CREATE INDEX IF NOT EXISTS idx_sms_forwarder_created_at ON public.sms_forwarder(created_at DESC);

-- ====================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_sender ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_forwarder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 20.1 System Settings Policies
DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
CREATE POLICY "Public read system settings" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin update system settings" ON public.system_settings;
CREATE POLICY "Admin update system settings" ON public.system_settings FOR ALL USING (true);

-- 20.2 Zones Policies
DROP POLICY IF EXISTS "Public read zones" ON public.zones;
CREATE POLICY "Public read zones" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage zones" ON public.zones;
CREATE POLICY "Admin manage zones" ON public.zones FOR ALL USING (true);

-- 20.3 Customers Policies
DROP POLICY IF EXISTS "Public insert customers" ON public.customers;
CREATE POLICY "Public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public select customers" ON public.customers;
CREATE POLICY "Public select customers" ON public.customers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Customers update own profile" ON public.customers;
CREATE POLICY "Customers update own profile" ON public.customers FOR UPDATE USING (true);

-- 20.4 OTP Sender Policies
DROP POLICY IF EXISTS "Public insert otp_sender" ON public.otp_sender;
CREATE POLICY "Public insert otp_sender" ON public.otp_sender FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public select otp_sender" ON public.otp_sender;
CREATE POLICY "Public select otp_sender" ON public.otp_sender FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update otp_sender" ON public.otp_sender;
CREATE POLICY "Public update otp_sender" ON public.otp_sender FOR UPDATE USING (true);

-- 20.4B SMS Forwarder Policies
DROP POLICY IF EXISTS "Public insert sms_forwarder" ON public.sms_forwarder;
CREATE POLICY "Public insert sms_forwarder" ON public.sms_forwarder FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public select sms_forwarder" ON public.sms_forwarder;
CREATE POLICY "Public select sms_forwarder" ON public.sms_forwarder FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update sms_forwarder" ON public.sms_forwarder;
CREATE POLICY "Public update sms_forwarder" ON public.sms_forwarder FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete sms_forwarder" ON public.sms_forwarder;
CREATE POLICY "Public delete sms_forwarder" ON public.sms_forwarder FOR DELETE USING (true);

-- 20.5 Vendors Policies
DROP POLICY IF EXISTS "Public read vendors" ON public.vendors;
CREATE POLICY "Public read vendors" ON public.vendors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin & Vendor manage vendors" ON public.vendors;
CREATE POLICY "Admin & Vendor manage vendors" ON public.vendors FOR ALL USING (true);

-- 20.6 Promotional Ads Policies
DROP POLICY IF EXISTS "Public read active ads" ON public.ads_banners;
CREATE POLICY "Public read active ads" ON public.ads_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage ads" ON public.ads_banners;
CREATE POLICY "Admin manage ads" ON public.ads_banners FOR ALL USING (true);

-- 20.7 Categories Policies
DROP POLICY IF EXISTS "Public read categories" ON public.food_categories;
CREATE POLICY "Public read categories" ON public.food_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage categories" ON public.food_categories;
CREATE POLICY "Admin manage categories" ON public.food_categories FOR ALL USING (true);
DROP POLICY IF EXISTS "Public read grocery categories" ON public.grocery_categories;
CREATE POLICY "Public read grocery categories" ON public.grocery_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage grocery categories" ON public.grocery_categories;
CREATE POLICY "Admin manage grocery categories" ON public.grocery_categories FOR ALL USING (true);

-- 20.8 Menu Items Policies
DROP POLICY IF EXISTS "Public read menu items" ON public.menu_items;
CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Vendors manage menu items" ON public.menu_items;
CREATE POLICY "Vendors manage menu items" ON public.menu_items FOR ALL USING (true);

-- 20.9 Customer Addresses Policies
DROP POLICY IF EXISTS "Manage customer addresses" ON public.customer_addresses;
CREATE POLICY "Manage customer addresses" ON public.customer_addresses FOR ALL USING (true);

-- 20.10 Riders Policies
DROP POLICY IF EXISTS "Public read active riders" ON public.riders;
CREATE POLICY "Public read active riders" ON public.riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin & Rider update riders" ON public.riders;
CREATE POLICY "Admin & Rider update riders" ON public.riders FOR ALL USING (true);

-- 20.11 Orders & Order Items Policies
DROP POLICY IF EXISTS "Public create and read orders" ON public.orders;
CREATE POLICY "Public create and read orders" ON public.orders FOR ALL USING (true);
DROP POLICY IF EXISTS "Public manage order items" ON public.order_items;
CREATE POLICY "Public manage order items" ON public.order_items FOR ALL USING (true);

-- 20.12 Customer Carts Policies
DROP POLICY IF EXISTS "Public manage customer carts" ON public.customer_carts;
CREATE POLICY "Public manage customer carts" ON public.customer_carts FOR ALL USING (true);

-- 20.13 Reviews Policies
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update reviews" ON public.reviews;
CREATE POLICY "Users can update reviews" ON public.reviews FOR UPDATE USING (true);

-- 20.14 Favorites Policies
DROP POLICY IF EXISTS "Public favorites access" ON public.favorites;
CREATE POLICY "Public favorites access" ON public.favorites FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 21. REALTIME REPLICATION CONFIGURATION (Live GPS, Orders & Status)
-- ====================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.orders, 
      public.riders, 
      public.vendors, 
      public.customers, 
      public.customer_addresses,
      public.reviews, 
      public.favorites, 
      public.otp_sender, 
      public.sms_forwarder, 
      public.system_settings,
      public.zones;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ====================================================================
-- 22. DEFAULT SEED DATA (System Settings & Starter Delivery Zones)
-- ====================================================================
INSERT INTO public.system_settings (
    id, per_km_delivery_charge, base_delivery_charge, rider_match_radius_km, 
    currency, currency_symbol, banner_slide_interval_seconds, banner_slide_auto_play, is_active
) VALUES (
    'set-001', 15.00, 30.00, 1.00, 'BDT', '৳', 3, true, true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.zones (id, name, bn_name, description, center_latitude, center_longitude, radius_km, color, is_active)
VALUES 
    ('zone-001', 'Chawkbazar Zone', 'চকবাজার জোন', 'Chawkbazar, Parade Square, Chatteshwari, Gani Bakery, DC Hill', 22.3590, 91.8380, 2.50, '#E11D48', true),
    ('zone-002', 'GEC Zone', 'জিইসি জোন', 'GEC Circle, CDA Avenue, Dampara, Golpahar, Prabartak Circle', 22.3595, 91.8215, 2.50, '#2563EB', true),
    ('zone-003', 'Khulshi Zone', 'খুলশী জোন', 'South Khulshi, North Khulshi, Zakir Hossain Road, Wireless Gate', 22.3650, 91.8150, 2.50, '#7C3AED', true),
    ('zone-004', 'Agrabad Zone', 'আগ্রাবাদ জোন', 'Commercial Area, Badamtali, Sheikh Mujib Road, Chowmuhani', 22.3275, 91.8120, 3.00, '#059669', true),
    ('zone-005', 'Nasirabad Zone', 'নাসিরাবাদ জোন', 'Nasirabad Housing, Polytechnic, Baizid Bostami, Sholashahar', 22.3780, 91.8250, 3.00, '#D97706', true),
    ('zone-006', 'Halishahar Zone', 'হালিশহর জোন', 'Halishahar Housing Estate, Boropool, Rampur, Block A-L', 22.3350, 91.7850, 3.50, '#0D9488', true)
ON CONFLICT (name) DO NOTHING;
