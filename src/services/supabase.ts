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

import { Division, CityArea } from '../types/database';

export const INITIAL_ZONES: DeliveryZone[] = [];

export const INITIAL_FOOD_CATEGORIES: FoodCategory[] = [];

export const INITIAL_DIVISIONS: Division[] = [
  { id: 'div-01', name: 'Chittagong', bn_name: 'চট্টগ্রাম', is_active: true },
  { id: 'div-02', name: 'Dhaka', bn_name: 'ঢাকা', is_active: true },
  { id: 'div-03', name: 'Sylhet', bn_name: 'সিলেট', is_active: true },
  { id: 'div-04', name: 'Rajshahi', bn_name: 'রাজশাহী', is_active: true },
  { id: 'div-05', name: 'Khulna', bn_name: 'খুলনা', is_active: true },
  { id: 'div-06', name: 'Barisal', bn_name: 'বরিশাল', is_active: true },
  { id: 'div-07', name: 'Rangpur', bn_name: 'রংপুর', is_active: true },
  { id: 'div-08', name: 'Mymensingh', bn_name: 'ময়মনসিংহ', is_active: true }
];

export const INITIAL_CITY_AREAS: CityArea[] = [
  { id: 'area-01', division_id: 'div-01', division_name: 'Chittagong', name: 'Chawkbazar', bn_name: 'চকবাজার', is_active: true },
  { id: 'area-02', division_id: 'div-01', division_name: 'Chittagong', name: 'GEC Circle', bn_name: 'জিইসি মোড়', is_active: true },
  { id: 'area-03', division_id: 'div-01', division_name: 'Chittagong', name: 'Agrabad', bn_name: 'আগ্রাবাদ', is_active: true },
  { id: 'area-04', division_id: 'div-01', division_name: 'Chittagong', name: 'Halishahar', bn_name: 'হালিশহর', is_active: true },
  { id: 'area-05', division_id: 'div-01', division_name: 'Chittagong', name: 'Khulshi', bn_name: 'খুলশী', is_active: true },
  { id: 'area-06', division_id: 'div-01', division_name: 'Chittagong', name: 'Nasirabad', bn_name: 'নাসিরাবাদ', is_active: true },
  { id: 'area-07', division_id: 'div-02', division_name: 'Dhaka', name: 'Dhanmondi', bn_name: 'ধানমন্ডি', is_active: true },
  { id: 'area-08', division_id: 'div-02', division_name: 'Dhaka', name: 'Gulshan & Banani', bn_name: 'গুলশান ও বনানী', is_active: true },
  { id: 'area-09', division_id: 'div-02', division_name: 'Dhaka', name: 'Mirpur', bn_name: 'মিরপুর', is_active: true },
  { id: 'area-10', division_id: 'div-02', division_name: 'Dhaka', name: 'Uttara', bn_name: 'উত্তরা', is_active: true }
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

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_ADDRESSES: CustomerAddress[] = [];

export const INITIAL_CUSTOMERS: CustomerUser[] = [];

export const INITIAL_RIDERS: Rider[] = [];

export const INITIAL_ORDERS: Order[] = [];

