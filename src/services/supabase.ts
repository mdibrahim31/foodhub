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

export const INITIAL_DIVISIONS: Division[] = [];

export const INITIAL_CITY_AREAS: CityArea[] = [];

const getStoredUrl = () => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get('sb_url') || params.get('supabase_url') || params.get('url');
      if (paramUrl && paramUrl.trim() && paramUrl !== 'https://your-project.supabase.co' && !paramUrl.includes('your-project')) {
        const trimmed = paramUrl.trim();
        localStorage.setItem('foodiplace_supabase_url', trimmed);
        localStorage.setItem('foodhub_supabase_url', trimmed);
        localStorage.setItem('supabase_url', trimmed);
        return trimmed;
      }
    } catch {}

    const candidateKeys = [
      'foodhub_supabase_url',
      'supabase_url',
      'foodvibe_v3_supabase_url',
      'foodiplace_supabase_url',
      'VITE_SUPABASE_URL',
      'sb_url'
    ];
    for (const k of candidateKeys) {
      const saved = localStorage.getItem(k);
      if (saved && saved.trim() && saved !== 'https://your-project.supabase.co' && !saved.includes('your-project')) {
        return saved.trim();
      }
    }
  }
  return import.meta.env.VITE_SUPABASE_URL || '';
};

const getStoredKey = () => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramKey = params.get('sb_key') || params.get('supabase_key') || params.get('key') || params.get('anon_key');
      if (paramKey && paramKey.trim() && paramKey !== 'your-anon-key' && !paramKey.includes('your-anon-key')) {
        const trimmed = paramKey.trim();
        localStorage.setItem('foodiplace_supabase_anon_key', trimmed);
        localStorage.setItem('foodhub_supabase_anon_key', trimmed);
        localStorage.setItem('supabase_anon_key', trimmed);
        return trimmed;
      }
    } catch {}

    const candidateKeys = [
      'foodhub_supabase_anon_key',
      'supabase_anon_key',
      'foodvibe_v3_supabase_anon_key',
      'foodiplace_supabase_anon_key',
      'VITE_SUPABASE_ANON_KEY',
      'sb_anon_key'
    ];
    for (const k of candidateKeys) {
      const saved = localStorage.getItem(k);
      if (saved && saved.trim() && saved !== 'your-anon-key' && !saved.includes('your-anon-key')) {
        return saved.trim();
      }
    }
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
    const urlKeys = ['foodhub_supabase_url', 'supabase_url', 'foodvibe_v3_supabase_url', 'foodiplace_supabase_url'];
    const keyKeys = ['foodhub_supabase_anon_key', 'supabase_anon_key', 'foodvibe_v3_supabase_anon_key', 'foodiplace_supabase_anon_key'];

    if (activeUrl) {
      urlKeys.forEach(k => localStorage.setItem(k, activeUrl));
    } else {
      urlKeys.forEach(k => localStorage.removeItem(k));
    }
    
    if (activeKey) {
      keyKeys.forEach(k => localStorage.setItem(k, activeKey));
    } else {
      keyKeys.forEach(k => localStorage.removeItem(k));
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
  platform_fee: 0,
  platform_fee_min_order: 0,
  tax_amount: 0,
  tax_min_order: 0,
  vat_amount: 0,
  vat_min_order: 0,
  free_delivery_distance_km: 2.0,
};

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_ADDRESSES: CustomerAddress[] = [];

export const INITIAL_CUSTOMERS: CustomerUser[] = [];

export const INITIAL_RIDERS: Rider[] = [];

export const INITIAL_ORDERS: Order[] = [];


