export type PortalRole = 'customer' | 'vendor' | 'rider' | 'admin';

export interface SystemSettings {
  id: string;
  per_km_delivery_charge: number; // e.g. 15 BDT per KM
  base_delivery_charge: number;   // e.g. 30 BDT base
  rider_match_radius_km: number;  // e.g. 1.0 KM radius
  currency: string;
  currency_symbol: string;
  is_active: boolean;
  updated_at: string;
}

export const DELIVERY_ZONES = [
  'Chawkbazar Zone',
  'GEC Zone',
  'Agrabad Zone',
  'Nasirabad Zone',
  'Halishahar Zone',
  'Khulshi Zone',
  'Banani & Gulshan Zone',
  'Dhanmondi Zone',
  'Uttara Zone',
  'Mirpur Zone'
] as const;

export type DeliveryZone = typeof DELIVERY_ZONES[number] | string;

export interface Vendor {
  id: string;
  unique_id?: string; // e.g. VND-1001
  name: string;
  description?: string;
  logo_url?: string;
  cover_image?: string;
  cuisine: string;
  phone: string;
  email?: string;
  address: string;
  zone: string;
  latitude: number;
  longitude: number;
  google_maps_link?: string;
  is_active: boolean;
  is_paused?: boolean; // Admin can pause/resume vendor
  is_boosted?: boolean; // Admin boost vendor to top banner carousel
  boost_banner_title?: string;
  boost_banner_subtitle?: string;
  rating: number;
  estimated_prep_time_minutes: number;
  featured_position?: number; // 1 to 5 for ranking in top serial
  is_password_set?: boolean;
  password?: string;
  created_at?: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  icon?: string; // emoji e.g. 🍕, 🍔 or icon name
  image_url?: string;
  is_active: boolean;
  order_index?: number;
}

export interface AdBanner {
  id: string;
  title: string;
  subtitle?: string;
  action_text?: string;
  image_url: string;
  target_vendor_id?: string;
  target_category?: string;
  is_active: boolean;
  order_index?: number;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  is_available: boolean;
}

export interface CustomerAddress {
  id: string;
  customer_phone: string;
  customer_name: string;
  label: 'Home' | 'Office' | 'Other' | string;
  address_line: string;
  details?: string;
  latitude: number;
  longitude: number;
  zone?: string;
  is_default: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  password?: string;
  email?: string;
  avatar_url?: string;
  addresses: CustomerAddress[];
  created_at: string;
}

export interface Rider {
  id: string;
  unique_id?: string; // e.g. RDR-5001
  name: string;
  phone: string;
  photo_url?: string;
  home_address?: string;
  zone: string;
  vehicle_type: 'Motorcycle' | 'Bicycle' | 'Scooter';
  is_online: boolean;
  is_paused?: boolean; // Admin can pause/resume rider
  current_latitude: number;
  current_longitude: number;
  last_location_updated_at?: string;
  cash_in_hand: number; // Floating cash held by rider
  is_approved: boolean;
  is_password_set?: boolean;
  password?: string;
  created_at?: string;
}

export interface UserAccount {
  id: string;
  role: PortalRole;
  name: string;
  phone: string;
  is_password_set: boolean;
  reference_id?: string; // vendor_id or rider_id or customer_id
  zone?: string;
  photo_url?: string;
}

export type OrderStatus = 
  | 'pending'                  // Customer placed order
  | 'vendor_accepted'          // Restaurant accepted order, waiting for customer prep time confirmation
  | 'food_preparing'           // Customer approved prep time, kitchen cooking
  | 'ready_for_pickup'         // Food cooked & packaged, searching for nearby zone riders
  | 'rider_assigned'           // Rider accepted dispatch
  | 'rider_arrived_at_vendor'  // Rider arrived at restaurant
  | 'food_picked_up'           // Rider paid cash to restaurant & picked up food
  | 'rider_on_way_to_customer' // Rider traveling to customer location
  | 'delivered'                // Food handed over, cash collected from customer
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_code: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  vendor_id: string;
  rider_id?: string;
  zone?: string;
  
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  
  food_total: number;
  delivery_distance_km: number;
  delivery_fee: number;
  total_cash_payable: number; // food_total + delivery_fee
  
  food_cash_paid_to_vendor: boolean;
  food_and_delivery_cash_collected_from_customer: boolean;
  
  status: OrderStatus;
  vendor_prep_minutes?: number;
  prep_ends_at?: string;
  customer_confirmed_prep?: boolean;
  cancellation_reason?: string;
  
  // Intelligent Single-Rider Proximity & Zone Dispatching Engine
  dispatched_rider_id?: string;
  dispatch_sent_at?: string;
  rejected_rider_ids?: string[];
  
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  
  items?: OrderItem[];
  vendor?: Vendor;
  rider?: Rider;
}

export interface RiderMessage {
  id: string;
  recipient_rider_id: string; // 'ALL' or specific rider id
  sender: string; // e.g. 'FoodHub Admin'
  title: string;
  body: string;
  created_at: string;
  is_read?: boolean;
}
