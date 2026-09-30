-- ====================================================================
-- FOODVIBE / CASH ON DELIVERY MULTI-PORTAL FOOD DELIVERY SYSTEM
-- SUPABASE POSTGRESQL INITIAL MIGRATION SCRIPT (001_initial_schema.sql)
-- Features: 
-- 1. Customer, Vendor, Rider, Admin Roles
-- 2. Customer Address Book with Lat/Lng Map Points
-- 3. Vendor Registration with exact Coordinates
-- 4. Haversine Distance & Dynamic Per-KM Delivery Fee Calculation
-- 5. Rider Live 5-Second Location Tracking & Cash In Hand Floating Balance
-- 6. Configurable Proximity Radius Dispatch (e.g. 1 km from restaurant)
-- 7. Full Cash-On-Delivery Lifecycle (Rider pays vendor -> collects from customer)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    per_km_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    base_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    rider_match_radius_km NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '৳',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default settings if not exists
INSERT INTO public.system_settings (per_km_delivery_charge, base_delivery_charge, rider_match_radius_km, currency, currency_symbol)
SELECT 15.00, 30.00, 1.00, 'BDT', '৳'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- 3. Vendors / Restaurants Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image TEXT,
    cuisine VARCHAR(100) DEFAULT 'Fast Food, Biryani',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    google_maps_link TEXT,
    is_active BOOLEAN DEFAULT true,
    rating NUMERIC(2, 1) DEFAULT 4.5,
    estimated_prep_time_minutes INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'Main Course',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Customer Addresses Table (Address Book)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    label VARCHAR(50) DEFAULT 'Home', -- Home, Office, Other
    address_line TEXT NOT NULL,
    details TEXT, -- Flat, Floor, Road details
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Riders Table
CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Motorcycle', -- Bicycle, Motorcycle, Scooter
    is_online BOOLEAN DEFAULT false,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    last_location_updated_at TIMESTAMP WITH TIME ZONE,
    cash_in_hand NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Orders Table (Cash on Delivery Focused)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    rider_id UUID REFERENCES public.riders(id),
    
    -- Delivery Location
    delivery_address TEXT NOT NULL,
    delivery_latitude DOUBLE PRECISION NOT NULL,
    delivery_longitude DOUBLE PRECISION NOT NULL,
    
    -- Financials (All Cash on Delivery)
    food_total NUMERIC(10, 2) NOT NULL,
    delivery_distance_km NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL,
    total_cash_payable NUMERIC(10, 2) NOT NULL, -- food_total + delivery_fee
    
    -- Cash Status
    food_cash_paid_to_vendor BOOLEAN DEFAULT false,
    food_and_delivery_cash_collected_from_customer BOOLEAN DEFAULT false,
    
    -- Order Statuses:
    -- 'pending', 'vendor_accepted', 'food_preparing', 'ready_for_pickup',
    -- 'rider_assigned', 'rider_arrived_at_vendor', 'food_picked_up', 
    -- 'rider_on_way_to_customer', 'delivered', 'cancelled'
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 9. Distance Calculation Function (Haversine Formula in KM)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371; -- Earth radius in KM
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)^2;
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    RETURN ROUND((r * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Sample Initial Vendors (Dhaka coordinates example)
INSERT INTO public.vendors (id, name, description, cuisine, phone, address, latitude, longitude, is_active, rating)
VALUES
('a0000001-0000-0000-0000-000000000001', 'Kacchi Bhai - Banani', 'Authentic traditional Dum Biryani and Borhani', 'Biryani, Mughlai', '+8801711122233', 'Road 11, Block D, Banani, Dhaka', 23.7937, 90.4049, true, 4.8),
('a0000002-0000-0000-0000-000000000002', 'Takeout Burger - Gulshan 1', 'Juicy gourmet smash burgers and cheesy fries', 'Fast Food, Burgers', '+8801811122244', 'Gulshan South Avenue, Gulshan 1, Dhaka', 23.7788, 90.4182, true, 4.6),
('a0000003-0000-0000-0000-000000000003', 'Chillox - Mohakhali', 'Crispy wings, loaded fries, and spicy beef burgers', 'Burgers, Wings', '+8801911122255', 'Bir Uttam AK Khandakar Rd, Mohakhali, Dhaka', 23.7776, 90.4024, true, 4.7)
ON CONFLICT (id) DO NOTHING;

-- 11. Sample Menu Items
INSERT INTO public.menu_items (vendor_id, name, description, price, category, is_available)
VALUES
('a0000001-0000-0000-0000-000000000001', 'Basmati Kacchi Biryani (Full)', 'Served with tender mutton, potato, egg, and salad', 380.00, 'Biryani', true),
('a0000001-0000-0000-0000-000000000001', 'Special Borhani (250ml)', 'Refreshing spiced yogurt drink', 60.00, 'Beverages', true),
('a0000001-0000-0000-0000-000000000001', 'Chicken Roast with Polao', 'Bengali wedding style roast with aromatic polao', 260.00, 'Biryani', true),

('a0000002-0000-0000-0000-000000000002', 'Classic Cheese Beef Burger', 'Grilled 140g beef patty with cheddar & special sauce', 290.00, 'Burgers', true),
('a0000002-0000-0000-0000-000000000002', 'Loaded Bacon Fries', 'Crispy french fries topped with melted cheese and crispy bacon', 180.00, 'Sides', true),
('a0000002-0000-0000-0000-000000000002', 'Oreo Thick Milkshake', 'Creamy rich chocolate shake blended with Oreos', 160.00, 'Beverages', true),

('a0000003-0000-0000-0000-000000000003', 'Smoky BBQ Beef Burger', 'Smoky flavored double beef patty with secret sauce', 280.00, 'Burgers', true),
('a0000003-0000-0000-0000-000000000003', 'Hot Wings (6 Pcs)', 'Spicy glazed crispy chicken wings', 210.00, 'Sides', true)
ON CONFLICT DO NOTHING;

-- 12. Sample Initial Rider (Positioned close to Banani)
INSERT INTO public.riders (id, name, phone, vehicle_type, is_online, current_latitude, current_longitude, cash_in_hand, is_approved)
VALUES
('r0000001-0000-0000-0000-000000000001', 'Rahim Rider', '+8801755500011', 'Motorcycle', true, 23.7940, 90.4060, 2000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 13. Row Level Security Policies (Open for Demo, easily restrictable)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Allow public all access to vendors" ON public.vendors FOR ALL USING (true);
CREATE POLICY "Allow public read access to menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public all access to menu_items" ON public.menu_items FOR ALL USING (true);
CREATE POLICY "Allow public all access to customer_addresses" ON public.customer_addresses FOR ALL USING (true);
CREATE POLICY "Allow public all access to riders" ON public.riders FOR ALL USING (true);
CREATE POLICY "Allow public all access to orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow public all access to order_items" ON public.order_items FOR ALL USING (true);
