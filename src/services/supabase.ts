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
    name: 'Kacchi Bhai - Banani',
    description: 'Authentic traditional Dum Biryani, Borhani, and Mughlai delicacies',
    cuisine: 'Biryani, Bengali, Mughlai',
    phone: '+8801711122233',
    address: 'Road 11, Block D, Banani, Dhaka',
    latitude: 23.7937,
    longitude: 90.4049,
    google_maps_link: 'https://maps.google.com/?q=23.7937,90.4049',
    is_active: true,
    rating: 4.8,
    estimated_prep_time_minutes: 20,
    cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Takeout Burger - Gulshan 1',
    description: 'Juicy artisan beef smash burgers, crisp potato wedges and milkshakes',
    cuisine: 'Fast Food, Burgers, American',
    phone: '+8801811122244',
    address: 'Gulshan South Avenue, Gulshan 1, Dhaka',
    latitude: 23.7788,
    longitude: 90.4182,
    google_maps_link: 'https://maps.google.com/?q=23.7788,90.4182',
    is_active: true,
    rating: 4.6,
    estimated_prep_time_minutes: 15,
    cover_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Chillox - Mohakhali',
    description: 'Signature crispy wings, loaded cheese fries, and spicy gourmet burgers',
    cuisine: 'Burgers, Wings, Fries',
    phone: '+8801911122255',
    address: 'Bir Uttam AK Khandakar Rd, Mohakhali, Dhaka',
    latitude: 23.7776,
    longitude: 90.4024,
    google_maps_link: 'https://maps.google.com/?q=23.7776,90.4024',
    is_active: true,
    rating: 4.7,
    estimated_prep_time_minutes: 18,
    cover_image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    logo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Kacchi Bhai
  {
    id: 'm-001',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Basmati Kacchi Biryani (Full)',
    description: 'Fragrant basmati rice slow-cooked with tender marinated mutton, aloo, egg, and salad',
    price: 380,
    category: 'Biryani',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-002',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Special Traditional Borhani (250ml)',
    description: 'Tangy and spiced chilled yogurt drink made with secret herbs and mustard',
    price: 60,
    category: 'Beverages',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-003',
    vendor_id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Chicken Roast with Polao Combo',
    description: 'Golden fried desi chicken cooked in sweet-sour gravy served with chinigura polao',
    price: 260,
    category: 'Biryani',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80'
  },

  // Takeout Burger
  {
    id: 'm-004',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Classic Double Cheeseburger',
    description: 'Two smashed beef patties, cheddar cheese slice, pickles, caramelized onions, house burger sauce',
    price: 290,
    category: 'Burgers',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-005',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Loaded Cheesy Beef Bacon Fries',
    description: 'Crispy skin-on potato fries smothered with melted cheese, beef bacon bits & jalapenos',
    price: 180,
    category: 'Sides',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-006',
    vendor_id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Oreo Thick Milkshake',
    description: 'Blended whole milk, vanilla ice-cream, crushed oreos topped with whipped cream',
    price: 160,
    category: 'Beverages',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80'
  },

  // Chillox
  {
    id: 'm-007',
    vendor_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Smoky Naga Beef Burger',
    description: 'Extra fiery beef burger infused with authentic Sylheti Naga pepper and smoky BBQ glaze',
    price: 280,
    category: 'Burgers',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'm-008',
    vendor_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Crispy Fried Wings (6 Pcs)',
    description: 'Golden crunchy battered wings coated in sweet sweet chili sauce',
    price: 210,
    category: 'Sides',
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_ADDRESSES: CustomerAddress[] = [
  {
    id: 'addr-001',
    customer_phone: '+8801700998877',
    customer_name: 'Shakib Al Hasan',
    label: 'Home',
    address_line: 'House 42, Road 12, Block E, Banani, Dhaka',
    details: 'Apartment 4B, Lift 4, Bell marked Hasan',
    latitude: 23.7915,
    longitude: 90.4072,
    is_default: true
  },
  {
    id: 'addr-002',
    customer_phone: '+8801700998877',
    customer_name: 'Shakib Al Hasan',
    label: 'Office',
    address_line: 'Crystal Palace, SE(D) 22, Gulshan Avenue, Gulshan 1, Dhaka',
    details: '7th Floor, Tech Hub Reception',
    latitude: 23.7794,
    longitude: 90.4190,
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
    // Placed 0.35 km from Kacchi Bhai Banani (23.7937, 90.4049) -> inside the 1.0 km radius!
    current_latitude: 23.7945,
    current_longitude: 90.4062,
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
  }
];
