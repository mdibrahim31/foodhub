import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  SystemSettings, 
  Vendor, 
  MenuItem, 
  CustomerAddress, 
  Rider, 
  Order 
} from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
};

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: "Sultan's Dine",
    description: 'Authentic traditional Dum Biryani, Borhani, and Mughlai delicacies',
    cuisine: 'Biryani, Bengali, Mughlai',
    phone: '+8801711122233',
    address: 'Road 11, Block D, Banani, Dhaka',
    latitude: 23.7937,
    longitude: 90.4049,
    google_maps_link: 'https://maps.google.com/?q=23.7937,90.4049',
    is_active: true,
    rating: 4.8,
    estimated_prep_time_minutes: 25,
    cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Snackza',
    description: 'Loaded chicken shawarma, grilled doner kebabs, crispy rolls and dips',
    cuisine: 'Snacks, Shawarma, Wraps',
    phone: '+8801811122244',
    address: 'Gulshan South Avenue, Gulshan 1, Dhaka',
    latitude: 23.7788,
    longitude: 90.4182,
    google_maps_link: 'https://maps.google.com/?q=23.7788,90.4182',
    is_active: true,
    rating: 4.5,
    estimated_prep_time_minutes: 30,
    cover_image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'PizzaBurg',
    description: 'Cheesy artisan pan pizzas, loaded wedges, and barbecue wings',
    cuisine: 'Pizza, Fast Food, Burgers',
    phone: '+8801911122255',
    address: 'Bir Uttam AK Khandakar Rd, Mohakhali, Dhaka',
    latitude: 23.7776,
    longitude: 90.4024,
    is_active: true,
    rating: 4.7,
    estimated_prep_time_minutes: 25,
    cover_image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    name: 'Tasty Treat - East Nasirabad',
    description: 'Fresh bakery items, patties, burger sliders, cakes, and traditional sweets',
    cuisine: 'Dessert, Bakery, Price Match',
    phone: '+8801722233344',
    address: 'East Nasirabad, Chittagong',
    latitude: 22.3569,
    longitude: 91.8282,
    google_maps_link: 'https://maps.google.com/?q=22.3569,91.8282',
    is_active: true,
    rating: 4.4,
    estimated_prep_time_minutes: 20,
    cover_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000005-0000-0000-0000-000000000005',
    name: "Domino's Pizza",
    description: 'Famous pepperoni, MeatMaxxx loaded deep-dish crust pizzas and garlic sticks',
    cuisine: 'Pizza, Italian, Fast Food',
    phone: '+8801833344455',
    address: 'Pragati Sarani, Baridhara, Dhaka',
    latitude: 23.7972,
    longitude: 90.4230,
    google_maps_link: 'https://maps.google.com/?q=23.7972,90.4230',
    is_active: true,
    rating: 4.6,
    estimated_prep_time_minutes: 20,
    cover_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000006-0000-0000-0000-000000000006',
    name: "Sharia's Kitchen",
    description: 'Desi home-style cooking, spicy khichuri, set meals and fresh bhortas',
    cuisine: 'Bangladeshi, Khichuri, Set Menu',
    phone: '+8801944455566',
    address: 'GEC Circle, Chittagong',
    latitude: 22.3590,
    longitude: 91.8215,
    google_maps_link: 'https://maps.google.com/?q=22.3590,91.8215',
    is_active: true,
    rating: 3.9,
    estimated_prep_time_minutes: 35,
    cover_image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Sultan's Dine
  {
    id: 'm-001',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: "Sultan's Kacchi Biryani (Full)",
    description: 'Aromatic basmati rice cooked with succulent mutton pieces, aloo, and traditional spices',
    price: 380,
    category: 'Biryani',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-002',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Special Traditional Borhani',
    description: 'Refreshing spiced yogurt drink prepared with mint and mustard seeds',
    price: 60,
    category: 'Beverages',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80'
  },

  // Snackza
  {
    id: 'm-004',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Loaded Chicken Doner Shawarma',
    description: 'Warm pita bread filled with flame-grilled chicken, fresh salad and garlic mayonnaise',
    price: 180,
    category: 'Snacks',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-005',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Crispy Chicken Wrap Roll',
    description: 'Crispy fried chicken tenders wrapped with cheese slice and spicy chili mayo',
    price: 150,
    category: 'Snacks',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80'
  },

  // PizzaBurg
  {
    id: 'm-006',
    vendor_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Beef Supreme Delight Pizza (9-inch)',
    description: 'Topped with spiced ground beef, mushrooms, capsicum, olives, and mozzarella cheese',
    price: 340,
    category: 'Pizza',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80'
  },

  // Tasty Treat
  {
    id: 'm-007',
    vendor_id: 'a0000004-0000-0000-0000-000000000004',
    name: 'Chicken Cheese Puff (2 Pcs)',
    description: 'Flaky baked golden pastry stuffed with creamy chicken and cheese',
    price: 90,
    category: 'Snacks',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80'
  },

  // Domino's Pizza
  {
    id: 'm-008',
    vendor_id: 'a0000005-0000-0000-0000-000000000005',
    name: 'MeatMAXXX Cheesy Stuffed Crust Pizza',
    description: 'Overloaded with grilled chicken sausage, beef pepperoni, jalapenos and liquid cheese rim',
    price: 499,
    category: 'Pizza',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80'
  },

  // Sharia's Kitchen
  {
    id: 'm-009',
    vendor_id: 'a0000006-0000-0000-0000-000000000006',
    name: 'Plain Khichuri',
    description: 'Comforting turmeric moong dal yellow rice khichuri with fried onions and green chili',
    price: 60,
    category: 'Bangladeshi',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-010',
    vendor_id: 'a0000006-0000-0000-0000-000000000006',
    name: 'Set Menu - 3 (Khichuri + Chicken Curry + Salad)',
    description: 'Hot fragrant bhuna khichuri served with rich chicken curry and mixed vegetable salad',
    price: 170,
    category: 'Bangladeshi',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_ADDRESSES: CustomerAddress[] = [
  {
    id: 'addr-001',
    customer_phone: '01609470766',
    customer_name: 'MD',
    label: 'Home',
    address_line: 'Sah amanot haowsing M. A.',
    details: 'Chittagong',
    latitude: 22.3831,
    longitude: 91.8480,
    is_default: true
  },
  {
    id: 'addr-002',
    customer_phone: '01882208531',
    customer_name: 'MD',
    label: 'Home',
    address_line: 'Jongghishah',
    details: 'Chittagong',
    latitude: 22.3569,
    longitude: 91.8325,
    is_default: false
  },
  {
    id: 'addr-003',
    customer_phone: '01882208531',
    customer_name: 'MD',
    label: 'Other',
    address_line: 'Cda Avenue',
    details: 'asian housing society',
    latitude: 22.3610,
    longitude: 91.8220,
    is_default: false
  }
];

export const INITIAL_RIDERS: Rider[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    name: 'Rahim Rider',
    phone: '+8801755500011',
    vehicle_type: 'Motorcycle',
    is_online: true,
    // Centered in Chattogram (Khulshi / Nasirabad / Bayazid)
    current_latitude: 22.3650,
    current_longitude: 91.8200,
    last_location_updated_at: new Date().toISOString(),
    cash_in_hand: 2500, // Starts with floating cash to buy food from restaurant
    is_approved: true
  },
  {
    id: 'r0000002-0000-0000-0000-000000000002',
    name: 'Karim Express',
    phone: '+8801855500022',
    vehicle_type: 'Bicycle',
    is_online: false,
    current_latitude: 23.7650,
    current_longitude: 90.3950,
    last_location_updated_at: new Date().toISOString(),
    cash_in_hand: 1200,
    is_approved: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_code: 'FV-84920',
    customer_name: 'Shakib Al Hasan',
    customer_phone: '+8801700998877',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    rider_id: 'r0000001-0000-0000-0000-000000000001',
    delivery_address: 'House 42, Road 12, Block E, Banani, Dhaka (Apt 4B)',
    delivery_latitude: 23.7915,
    delivery_longitude: 90.4072,
    food_total: 440,
    delivery_distance_km: 0.35,
    delivery_fee: 35,
    total_cash_payable: 475,
    food_cash_paid_to_vendor: false,
    food_and_delivery_cash_collected_from_customer: false,
    status: 'ready_for_pickup',
    special_instructions: 'Please bring extra salad and spoons',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'oi-1',
        order_id: 'ord-101',
        item_name: 'Basmati Kacchi Biryani (Full)',
        item_price: 380,
        quantity: 1,
        subtotal: 380
      },
      {
        id: 'oi-2',
        order_id: 'ord-101',
        item_name: 'Special Traditional Borhani (250ml)',
        item_price: 60,
        quantity: 1,
        subtotal: 60
      }
    ]
  },
  {
    id: 'ord-102',
    order_code: 'FV-92144',
    customer_name: 'MD',
    customer_phone: '01609470766',
    vendor_id: 'a0000004-0000-0000-0000-000000000004',
    rider_id: undefined, // Unassigned: Available for Rider in Chattogram to Accept/Reject!
    delivery_address: '305 Chasma Hill R/A Rd, Chittagong',
    delivery_latitude: 22.3705,
    delivery_longitude: 91.8215,
    food_total: 280,
    delivery_distance_km: 1.4,
    delivery_fee: 45,
    total_cash_payable: 325,
    food_cash_paid_to_vendor: false,
    food_and_delivery_cash_collected_from_customer: false,
    status: 'ready_for_pickup',
    special_instructions: 'Asian housing society gate, call before arrival',
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'oi-3',
        order_id: 'ord-102',
        item_name: 'Chicken Burger & Fries Combo',
        item_price: 220,
        quantity: 1,
        subtotal: 220
      },
      {
        id: 'oi-4',
        order_id: 'ord-102',
        item_name: 'Chocolate Pastry Cake',
        item_price: 60,
        quantity: 1,
        subtotal: 60
      }
    ]
  }
];
