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

export interface Vendor {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_image?: string;
  cuisine: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  google_maps_link?: string;
  is_active: boolean;
  rating: number;
  estimated_prep_time_minutes: number;
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
  is_default: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle_type: 'Motorcycle' | 'Bicycle' | 'Scooter';
  is_online: boolean;
  current_latitude: number;
  current_longitude: number;
  last_location_updated_at?: string;
  cash_in_hand: number; // Floating cash held by rider
  is_approved: boolean;
}

export type OrderStatus = 
  | 'pending'                  // Customer placed order
  | 'vendor_accepted'          // Restaurant accepted order
  | 'food_preparing'           // Food is being cooked
  | 'ready_for_pickup'         // Ready at counter, waiting for nearby rider
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
  customer_name: string;
  customer_phone: string;
  vendor_id: string;
  rider_id?: string;
  
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
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  
  items?: OrderItem[];
  vendor?: Vendor;
  rider?: Rider;
}
