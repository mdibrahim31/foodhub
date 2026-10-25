-- ====================================================================
-- FOODIPLACE / FOODHUB CASH-ON-DELIVERY PLATFORM
-- PRODUCTION MASTER DATABASE SCHEMA FOR SUPABASE / POSTGRESQL
-- File: /src/db/schema.sql
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
-- 3. DELIVERY & ADMIN ZONES (Zone-Based Vendor & Boundary Filtering)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.zones (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    bn_name VARCHAR(100),
    description TEXT,
    center_latitude DOUBLE PRECISION NOT NULL DEFAULT 22.3590,
    center_longitude DOUBLE PRECISION NOT NULL DEFAULT 91.8380,
    radius_km NUMERIC(10, 2) NOT NULL DEFAULT 3.00,
    boundary_coordinates JSONB DEFAULT '[]'::JSONB,
    color VARCHAR(20) DEFAULT '#E11D48',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. DIVISIONS TABLE (বিভাগ)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.divisions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    bn_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. CITIES & AREAS TABLE (শহর ও এলাকা)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.city_areas (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    division_id VARCHAR(255) NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    division_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    bn_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_division_city_area UNIQUE (division_id, name)
);

-- ====================================================================
-- 6. CUSTOMER ACCOUNTS TABLE (Registered Customers)
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
-- 7. OTP SENDER TABLE (Signup & Verification OTPs)
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

-- Trigger Function: Auto generate 6-digit OTP & 5-minute expiry if not set
CREATE OR REPLACE FUNCTION generate_otp_sender_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.otp IS NULL OR NEW.otp = '' THEN
        NEW.otp := lpad(floor(random() * (999999 - 100000 + 1) + 100000)::text, 6, '0');
    END IF;

    IF NEW.status IS NULL OR NEW.status = '' THEN
        NEW.status := 'pending';
    END IF;

    IF NEW.expires_at IS NULL THEN
        NEW.expires_at := timezone('utc'::text, now()) + interval '5 minutes';
    END IF;

    IF NEW.message IS NULL OR NEW.message = '' THEN
        NEW.message := 'Your OTP verification code is ' || NEW.otp || '. Valid for 5 minutes.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_otp ON public.otp_sender;
CREATE TRIGGER trg_generate_otp
BEFORE INSERT ON public.otp_sender
FOR EACH ROW
EXECUTE FUNCTION generate_otp_sender_code();

-- ====================================================================
-- 8. VENDORS TABLE (Restaurants, Cloud Kitchens & Grocery Shops)
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
    address TEXT NOT NULL DEFAULT '',
    zone VARCHAR(100) NOT NULL DEFAULT 'Chawkbazar Zone',
    division VARCHAR(100),
    city_area VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL DEFAULT 22.3590,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 91.8380,
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
-- 9. PROMOTIONAL ADS & HERO BANNERS TABLE
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
-- 10. FOOD CATEGORIES TABLE (Food & Grocery Item Categories)
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

-- ====================================================================
-- 11. MENU ITEMS TABLE (Dishes, Products & Variations)
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
-- 12. CUSTOMER ADDRESS BOOK (Pinpoint GPS, Delivery Zones & Default)
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
    division VARCHAR(100),
    city_area VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL DEFAULT 22.3590,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 91.8380,
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 13. RIDERS TABLE (Delivery Fleet Management)
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
    current_latitude DOUBLE PRECISION DEFAULT 22.3590,
    current_longitude DOUBLE PRECISION DEFAULT 91.8380,
    last_location_updated_at TIMESTAMP WITH TIME ZONE,
    cash_in_hand NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT true,
    is_password_set BOOLEAN DEFAULT false,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 14. ORDERS TABLE (Cash-On-Delivery Lifecycle & Zone Dispatch)
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
    delivery_latitude DOUBLE PRECISION NOT NULL DEFAULT 22.3590,
    delivery_longitude DOUBLE PRECISION NOT NULL DEFAULT 91.8380,
    
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
-- 15. ORDER ITEMS TABLE (Items, Variations & Special Instructions)
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
-- 16. CUSTOMER CARTS TABLE (Persistent Multi-Device Shopping Carts)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customer_carts (
    customer_id VARCHAR(255) PRIMARY KEY,
    cart_items JSONB NOT NULL DEFAULT '[]'::JSONB,
    vendor JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 17. REVIEWS & RATINGS TABLE (Customer Reviews for Vendors)
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
-- 18. FAVORITES TABLE (Customer Favorite Vendors)
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
-- 19. AUTOMATED VENDOR RATING RECALCULATION TRIGGER
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
-- 20. STORAGE BUCKET CONFIGURATION (Public Uploads for Logos/Covers)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public View Storage Images" ON storage.objects;
CREATE POLICY "Public View Storage Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Upload Storage Images" ON storage.objects;
CREATE POLICY "Public Upload Storage Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Update Storage Images" ON storage.objects;
CREATE POLICY "Public Update Storage Images" ON storage.objects FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Delete Storage Images" ON storage.objects;
CREATE POLICY "Public Delete Storage Images" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ====================================================================
-- 21. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_zones_active ON public.zones(is_active);
CREATE INDEX IF NOT EXISTS idx_divisions_active ON public.divisions(is_active);
CREATE INDEX IF NOT EXISTS idx_city_areas_division ON public.city_areas(division_id);
CREATE INDEX IF NOT EXISTS idx_vendors_zone ON public.vendors(zone);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_phone ON public.customer_addresses(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_zone ON public.customer_addresses(zone);
CREATE INDEX IF NOT EXISTS idx_riders_zone ON public.riders(zone);
CREATE INDEX IF NOT EXISTS idx_riders_online ON public.riders(is_online);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON public.orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_code ON public.reviews(order_code);
CREATE INDEX IF NOT EXISTS idx_favorites_customer_phone ON public.favorites(customer_phone);
CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON public.favorites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_otp_sender_phone ON public.otp_sender(phone);

-- ====================================================================
-- 22. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_sender ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 22.1 System Settings
DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
CREATE POLICY "Public read system settings" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin update system settings" ON public.system_settings;
CREATE POLICY "Admin update system settings" ON public.system_settings FOR ALL USING (true);

-- 22.2 Zones
DROP POLICY IF EXISTS "Public read zones" ON public.zones;
CREATE POLICY "Public read zones" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage zones" ON public.zones;
CREATE POLICY "Admin manage zones" ON public.zones FOR ALL USING (true);

-- 22.3 Divisions & City Areas
DROP POLICY IF EXISTS "Public read divisions" ON public.divisions;
CREATE POLICY "Public read divisions" ON public.divisions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage divisions" ON public.divisions;
CREATE POLICY "Admin manage divisions" ON public.divisions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read city_areas" ON public.city_areas;
CREATE POLICY "Public read city_areas" ON public.city_areas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage city_areas" ON public.city_areas;
CREATE POLICY "Admin manage city_areas" ON public.city_areas FOR ALL USING (true);

-- 22.4 Customers
DROP POLICY IF EXISTS "Public manage customers" ON public.customers;
CREATE POLICY "Public manage customers" ON public.customers FOR ALL USING (true);

-- 22.5 OTP Sender
DROP POLICY IF EXISTS "Public manage otp_sender" ON public.otp_sender;
CREATE POLICY "Public manage otp_sender" ON public.otp_sender FOR ALL USING (true);

-- 22.6 Vendors
DROP POLICY IF EXISTS "Public manage vendors" ON public.vendors;
CREATE POLICY "Public manage vendors" ON public.vendors FOR ALL USING (true);

-- 22.7 Ads & Banners
DROP POLICY IF EXISTS "Public manage ads_banners" ON public.ads_banners;
CREATE POLICY "Public manage ads_banners" ON public.ads_banners FOR ALL USING (true);

-- 22.8 Categories
DROP POLICY IF EXISTS "Public manage food_categories" ON public.food_categories;
CREATE POLICY "Public manage food_categories" ON public.food_categories FOR ALL USING (true);

-- 22.9 Menu Items
DROP POLICY IF EXISTS "Public manage menu_items" ON public.menu_items;
CREATE POLICY "Public manage menu_items" ON public.menu_items FOR ALL USING (true);

-- 22.10 Customer Addresses
DROP POLICY IF EXISTS "Public manage customer_addresses" ON public.customer_addresses;
CREATE POLICY "Public manage customer_addresses" ON public.customer_addresses FOR ALL USING (true);

-- 22.11 Riders
DROP POLICY IF EXISTS "Public manage riders" ON public.riders;
CREATE POLICY "Public manage riders" ON public.riders FOR ALL USING (true);

-- 22.12 Orders & Items
DROP POLICY IF EXISTS "Public manage orders" ON public.orders;
CREATE POLICY "Public manage orders" ON public.orders FOR ALL USING (true);
DROP POLICY IF EXISTS "Public manage order_items" ON public.order_items;
CREATE POLICY "Public manage order_items" ON public.order_items FOR ALL USING (true);

-- 22.13 Carts, Reviews & Favorites
DROP POLICY IF EXISTS "Public manage customer_carts" ON public.customer_carts;
CREATE POLICY "Public manage customer_carts" ON public.customer_carts FOR ALL USING (true);

DROP POLICY IF EXISTS "Public manage reviews" ON public.reviews;
CREATE POLICY "Public manage reviews" ON public.reviews FOR ALL USING (true);

DROP POLICY IF EXISTS "Public manage favorites" ON public.favorites;
CREATE POLICY "Public manage favorites" ON public.favorites FOR ALL USING (true);

-- ====================================================================
-- 23. REALTIME REPLICATION (Instant Updates)
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
      public.system_settings,
      public.zones,
      public.divisions,
      public.city_areas,
      public.menu_items,
      public.food_categories,
      public.ads_banners,
      public.customer_carts;
EXCEPTION
  WHEN OTHERS THEN NULL
END $$;

-- ====================================================================
-- 24. DEFAULT SEED DATA (System Settings & Initial Zones)
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
