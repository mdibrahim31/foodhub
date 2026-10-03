import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  SystemSettings, 
  Vendor, 
  MenuItem, 
  CustomerAddress, 
  Rider, 
  Order,
  CustomerUser,
  UserAccount,
  FoodCategory,
  DeliveryZone
} from '../types/database';

export const INITIAL_ZONES: DeliveryZone[] = [];

export const INITIAL_FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'cat-1', name: 'Pizza', icon: '🍕', is_active: true, order_index: 1 },
  { id: 'cat-2', name: 'Burgers', icon: '🍔', is_active: true, order_index: 2 },
  { id: 'cat-3', name: 'Chicken & Grill', icon: '🍗', is_active: true, order_index: 3 },
  { id: 'cat-4', name: 'Shawarma', icon: '🌯', is_active: true, order_index: 4 },
  { id: 'cat-5', name: 'Biryani', icon: '🍚', is_active: true, order_index: 5 },
  { id: 'cat-6', name: 'Kabab', icon: '🍢', is_active: true, order_index: 6 },
  { id: 'cat-7', name: 'Fast Food', icon: '🍟', is_active: true, order_index: 7 },
  { id: 'cat-8', name: 'Bangladeshi', icon: '🐟', is_active: true, order_index: 8 },
  { id: 'cat-9', name: 'Chinese & Thai', icon: '🍜', is_active: true, order_index: 9 },
  { id: 'cat-10', name: 'Bakery & Sweets', icon: '🍰', is_active: true, order_index: 10 },
  { id: 'cat-11', name: 'Drinks & Shakes', icon: '🥤', is_active: true, order_index: 11 },
];

const getStoredUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('foodhub_supabase_url');
    if (saved && saved.trim() && saved !== 'https://your-project.supabase.co') return saved.trim();
  }
  return import.meta.env.VITE_SUPABASE_URL || '';
};

const getStoredKey = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('foodhub_supabase_anon_key');
    if (saved && saved.trim() && saved !== 'your-anon-key') return saved.trim();
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

let activeUrl = getStoredUrl();
let activeKey = getStoredKey();

export let isSupabaseConfigured = Boolean(
  activeUrl && 
  activeKey && 
  activeUrl !== 'https://your-project.supabase.co' &&
  !activeUrl.includes('your-project')
);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeUrl, activeKey)
  : null;

export const updateSupabaseCredentials = (url: string, anonKey: string) => {
  activeUrl = (url || '').trim();
  activeKey = (anonKey || '').trim();
  
  if (typeof window !== 'undefined') {
    if (activeUrl) {
      localStorage.setItem('foodhub_supabase_url', activeUrl);
    } else {
      localStorage.removeItem('foodhub_supabase_url');
    }
    
    if (activeKey) {
      localStorage.setItem('foodhub_supabase_anon_key', activeKey);
    } else {
      localStorage.removeItem('foodhub_supabase_anon_key');
    }
  }

  isSupabaseConfigured = Boolean(
    activeUrl && 
    activeKey && 
    activeUrl !== 'https://your-project.supabase.co' &&
    !activeUrl.includes('your-project')
  );

  supabase = isSupabaseConfigured
    ? createClient(activeUrl, activeKey)
    : null;

  return { isConfigured: isSupabaseConfigured, client: supabase };
};

export const getSupabaseConfig = () => ({
  url: activeUrl,
  anonKey: activeKey,
  isConfigured: isSupabaseConfigured
});

// Initial Seed Data for immediate testing & local sync
export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'set-001',
  per_km_delivery_charge: 15.0,
  base_delivery_charge: 30.0,
  rider_match_radius_km: 1.0, // 1 km default dispatch radius
  currency: 'BDT',
  currency_symbol: '৳',
  is_active: true,
  updated_at: new Date().toISOString(),
  banner_slide_interval_seconds: 3,
  banner_slide_auto_play: true,
};

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    unique_id: 'VND-1001',
    name: "Khulshi Mart Kitchen",
    description: 'Fresh grilled steaks, club sandwiches, artisan salads and shakes',
    cuisine: 'Continental, Fast Food, Bakery',
    phone: '01711122233',
    address: '4, Zakir Hossain Road, Khulshi, Chittagong',
    zone: 'Khulshi Zone',
    latitude: 22.3620,
    longitude: 91.8210,
    google_maps_link: 'https://maps.google.com/?q=22.3620,91.8210',
    is_active: true,
    rating: 4.8,
    estimated_prep_time_minutes: 20,
    is_password_set: true,
    password: '123',
    is_boosted: true,
    boost_banner_title: 'Welcome back! Enjoy 35% off & free delivery',
    boost_banner_subtitle: 'Order artisan steaks, club sandwiches & shakes from Khulshi Mart Kitchen',
    cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    unique_id: 'VND-1002',
    name: 'KRUNCH - Chawkbazar',
    description: 'Crispy fried chicken, zinger burgers, spicy fries and cheese dips',
    cuisine: 'Fast Food, Fried Chicken, Burgers',
    phone: '01811122244',
    address: 'Chawkbazar Main Road, Chawkbazar, Chittagong',
    zone: 'Chawkbazar Zone',
    latitude: 22.3585,
    longitude: 91.8385,
    google_maps_link: 'https://maps.google.com/?q=22.3585,91.8385',
    is_active: true,
    rating: 4.6,
    estimated_prep_time_minutes: 15,
    is_password_set: true,
    password: '123',
    is_boosted: true,
    boost_banner_title: 'Crispy Crunchy Delights! Flat 20% OFF',
    boost_banner_subtitle: 'Hot & Crispy Fried Chicken, Zinger Burgers & Spicy Fries from KRUNCH',
    cover_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    unique_id: 'VND-1003',
    name: "Sultan's Dine",
    description: 'Authentic traditional Dum Biryani, Borhani, and Mughlai delicacies',
    cuisine: 'Biryani, Bengali, Mughlai',
    phone: '01911122255',
    address: 'GEC Circle, CDA Avenue, Chittagong',
    zone: 'GEC Zone',
    latitude: 22.3590,
    longitude: 91.8215,
    is_active: true,
    rating: 4.7,
    estimated_prep_time_minutes: 25,
    is_password_set: true,
    password: '123',
    cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    unique_id: 'VND-1004',
    name: 'Tasty Treat - East Nasirabad',
    description: 'Fresh bakery items, patties, burger sliders, cakes, and traditional sweets',
    cuisine: 'Dessert, Bakery, Fast Food',
    phone: '01722233344',
    address: 'East Nasirabad, Chittagong',
    zone: 'Nasirabad Zone',
    latitude: 22.3569,
    longitude: 91.8282,
    google_maps_link: 'https://maps.google.com/?q=22.3569,91.8282',
    is_active: true,
    rating: 4.4,
    estimated_prep_time_minutes: 20,
    is_password_set: true,
    password: '123',
    cover_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Khulshi Mart
  {
    id: 'm-001',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: "Classic Beef Burger with Cheddar",
    description: 'Grilled premium beef patty, melted cheddar, lettuce and secret sauce',
    price: 320,
    category: 'Burgers',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-002',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Loaded Nachos & Cheese Dip',
    description: 'Crispy corn tortilla chips topped with salsa, jalapeños, and warm cheese dip',
    price: 240,
    category: 'Snacks',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=80'
  },
  // KRUNCH
  {
    id: 'm-003',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'KRUNCH Crispy Fried Chicken (4 pcs)',
    description: 'Signature crunchy spicy fried chicken with garlic mayo dip and coleslaw',
    price: 399,
    category: 'Fast Food',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-004',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Spicy Zinger Tower Burger',
    description: 'Extra crispy chicken fillet, spicy mayo, cheese slice and toasted sesame bun',
    price: 280,
    category: 'Fast Food',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=500&auto=format&fit=crop&q=80'
  },
  // Sultan's Dine
  {
    id: 'm-005',
    vendor_id: 'a0000003-0000-0000-0000-000000000003',
    name: "Sultan's Kacchi Biryani (Half)",
    description: 'Aromatic basmati rice cooked with succulent mutton pieces, aloo, and traditional spices',
    price: 290,
    category: 'Biryani',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-006',
    vendor_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Special Traditional Borhani',
    description: 'Refreshing spiced yogurt drink prepared with mint and mustard seeds',
    price: 80,
    category: 'Beverage',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_ADDRESSES: CustomerAddress[] = [
  {
    id: 'addr-001',
    customer_phone: '01882208531',
    customer_name: 'MD Tanvir',
    label: 'Home',
    address_line: 'Sah amanot haowsing M. A.',
    details: 'Chittagong',
    zone: 'Chawkbazar Zone',
    latitude: 22.3595,
    longitude: 91.8360,
    is_default: true
  },
  {
    id: 'addr-002',
    customer_phone: '01882208531',
    customer_name: 'MD Tanvir',
    label: 'Office',
    address_line: 'CDA Avenue, GEC',
    details: 'Asian Housing Society, Flat 4B',
    zone: 'GEC Zone',
    latitude: 22.3610,
    longitude: 91.8220,
    is_default: false
  }
];

export const INITIAL_CUSTOMERS: CustomerUser[] = [
  {
    id: 'c-001',
    name: 'MD Tanvir',
    phone: '01882208531',
    password: '123',
    email: 'tanvir@gmail.com',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    addresses: INITIAL_ADDRESSES,
    created_at: new Date().toISOString()
  }
];

export const INITIAL_RIDERS: Rider[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    name: 'Rahim Rider',
    phone: '01755500011',
    photo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    home_address: 'Chawkbazar, Chittagong',
    zone: 'Chawkbazar Zone',
    vehicle_type: 'Motorcycle',
    is_online: true,
    current_latitude: 22.3588,
    current_longitude: 91.8378,
    last_location_updated_at: new Date().toISOString(),
    cash_in_hand: 2500,
    is_approved: true,
    is_password_set: true,
    password: '123',
    created_at: new Date().toISOString()
  },
  {
    id: 'r0000002-0000-0000-0000-000000000002',
    name: 'Karim Express',
    phone: '01855500022',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    home_address: 'Khulshi, Chittagong',
    zone: 'Khulshi Zone',
    vehicle_type: 'Motorcycle',
    is_online: true,
    current_latitude: 22.3615,
    current_longitude: 91.8205,
    last_location_updated_at: new Date().toISOString(),
    cash_in_hand: 1200,
    is_approved: true,
    is_password_set: true,
    password: '123',
    created_at: new Date().toISOString()
  },
  {
    id: 'r0000003-0000-0000-0000-000000000003',
    name: 'Shaon Delivery',
    phone: '01955500033',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    home_address: 'GEC Circle, Chittagong',
    zone: 'GEC Zone',
    vehicle_type: 'Bicycle',
    is_online: true,
    current_latitude: 22.3592,
    current_longitude: 91.8220,
    last_location_updated_at: new Date().toISOString(),
    cash_in_hand: 1800,
    is_approved: true,
    is_password_set: true,
    password: '123',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_code: 'FV-84920',
    customer_id: 'c-001',
    customer_name: 'MD Tanvir',
    customer_phone: '01882208531',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    rider_id: 'r0000001-0000-0000-0000-000000000001',
    zone: 'Chawkbazar Zone',
    delivery_address: 'Sah amanot haowsing M. A., Chawkbazar, Chittagong',
    delivery_latitude: 22.3595,
    delivery_longitude: 91.8360,
    food_total: 399,
    delivery_distance_km: 0.45,
    delivery_fee: 35,
    total_cash_payable: 434,
    food_cash_paid_to_vendor: false,
    food_and_delivery_cash_collected_from_customer: false,
    status: 'food_preparing',
    vendor_prep_minutes: 15,
    customer_confirmed_prep: true,
    prep_ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    special_instructions: 'Extra hot spicy chicken please',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'oi-101',
        order_id: 'ord-101',
        menu_item_id: 'm-003',
        item_name: 'KRUNCH Crispy Fried Chicken (4 pcs)',
        item_price: 399,
        quantity: 1,
        subtotal: 399
      }
    ],
    vendor: INITIAL_VENDORS[1],
    rider: INITIAL_RIDERS[0]
  }
];
