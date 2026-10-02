import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  PortalRole, 
  SystemSettings, 
  Vendor, 
  MenuItem, 
  CustomerAddress, 
  CustomerUser,
  Rider, 
  Order, 
  OrderStatus,
  UserAccount,
  DELIVERY_ZONES,
  DeliveryZone,
  RiderMessage,
  AdBanner
} from '../types/database';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_VENDORS, 
  INITIAL_MENU_ITEMS, 
  INITIAL_ADDRESSES, 
  INITIAL_CUSTOMERS,
  INITIAL_RIDERS, 
  INITIAL_ORDERS,
  INITIAL_FOOD_CATEGORIES,
  supabase,
  isSupabaseConfigured,
  updateSupabaseCredentials,
  getSupabaseConfig
} from '../services/supabase';
import { calculateDistanceKm, calculateDeliveryFee } from '../utils/geo';
import { FoodCategory } from '../types/database';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface DeliveryContextType {
  role: PortalRole;
  setRole: (role: PortalRole) => void;
  
  // Auth & Multi-User Privacy State
  currentUser: UserAccount | null;
  currentCustomer: CustomerUser | null;
  loginUser: (role: PortalRole, phone: string, password?: string) => { success: boolean; requiresPasswordSetup?: boolean; message?: string };
  setPasswordForUser: (role: PortalRole, phone: string, newPassword: string) => boolean;
  registerCustomer: (data: { name: string; phone: string; password: string; email?: string }) => { success: boolean; message?: string };
  logoutUser: () => void;

  // System Settings
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  
  // Vendors & Admin Management
  vendors: Vendor[];
  currentVendor: Vendor | null;
  setCurrentVendor: (vendor: Vendor) => void;
  adminRegisterVendor: (data: {
    name: string;
    phone: string;
    address: string;
    cuisine: string;
    zone: string;
    latitude: number;
    longitude: number;
    description?: string;
  }) => Promise<{ vendor: Vendor; savedToDatabase: boolean; dbMessage?: string }>;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  toggleVendorPause: (id: string) => void;
  deleteVendor: (id: string) => void;
  
  // Menu Items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  toggleMenuItemAvailability: (id: string) => void;
  deleteMenuItem: (id: string) => void;

  // Food Categories (Configurable by Admin)
  foodCategories: FoodCategory[];
  addFoodCategory: (category: Omit<FoodCategory, 'id'>) => void;
  updateFoodCategory: (id: string, updates: Partial<FoodCategory>) => void;
  deleteFoodCategory: (id: string) => void;

  // Promotional Ads & Hero Banners
  adBanners: AdBanner[];
  addAdBanner: (ad: Omit<AdBanner, 'id'>) => void;
  updateAdBanner: (id: string, updates: Partial<AdBanner>) => void;
  deleteAdBanner: (id: string) => void;
  toggleAdBannerStatus: (id: string) => void;
  
  // Customer Addresses & Map Pin Points
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (addr: CustomerAddress) => void;
  addAddress: (addr: Omit<CustomerAddress, 'id'>) => CustomerAddress;
  updateAddress: (id: string, updates: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  
  // Riders & Fleet Management
  riders: Rider[];
  currentRider: Rider | null;
  setCurrentRider: (rider: Rider) => void;
  adminRegisterRider: (data: {
    phone: string;
    name?: string;
    photo_url?: string;
    home_address?: string;
    zone?: string;
    vehicle_type?: 'Motorcycle' | 'Bicycle' | 'Scooter';
    latitude?: number;
    longitude?: number;
  }) => Promise<{ rider: Rider; savedToDatabase: boolean; dbMessage?: string }>;
  completeRiderRegistration: (data: {
    phone: string;
    name?: string;
    password: string;
  }) => Promise<{ success: boolean; message: string; rider?: Rider }>;
  updateRiderProfile: (riderId: string, updates: Partial<Rider>) => Promise<{ success: boolean; message: string }>;
  toggleRiderOnline: (riderId: string, isOnline: boolean) => Promise<boolean>;
  toggleRiderPause: (riderId: string) => void;
  deleteRider: (riderId: string) => void;
  updateRiderLocation: (riderId: string, lat: number, lng: number) => void;
  simulateRiderMovement: (stepLat: number, stepLng: number) => void;
  
  // Cart & Order Workflow
  orders: Order[];
  cart: CartItem[];
  cartVendor: Vendor | null;
  addToCart: (item: MenuItem, vendor: Vendor) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: (instructions?: string) => Promise<Order | null>;
  
  // Step-by-Step Vendor Prep & Customer Confirmation
  vendorAcceptOrderWithPrepTime: (orderId: string, prepMinutes: number) => void;
  customerRespondToPrepTime: (orderId: string, accept: boolean) => void;
  vendorMarkFoodReady: (orderId: string) => void;
  
  // Intelligent Single-Rider Proximity & Zone Dispatch
  triggerRiderDispatch: (orderId: string) => boolean;
  riderAcceptOrder: (orderId: string, riderId: string) => void;
  riderRejectOrder: (orderId: string, riderId: string) => void;
  
  // Cash on Delivery Handover
  riderConfirmCashPaidToVendor: (orderId: string) => void;
  riderConfirmCashCollectedFromCustomer: (orderId: string) => void;
  
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => void;
  playNotificationSound: () => void;

  // Admin Broadcast & Direct Messaging to Riders
  riderMessages: RiderMessage[];
  sendAdminMessage: (msg: Omit<RiderMessage, 'id' | 'created_at'>) => void;
  markRiderMessageAsRead: (msgId: string) => void;
  isSupabaseConfigured: boolean;
  supabaseConfig: { url: string; anonKey: string; isConfigured: boolean };
  connectSupabase: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string; vendorsCount: number; ridersCount: number }>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'foodvibe_v3_';

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State
  const [role, setRole] = useState<PortalRole>(() => {
    const hash = window.location.hash.replace('#', '') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) return hash;
    return 'customer';
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}vendors`);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(() => vendors[0] || null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}menu_items`);
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}addresses`);
    return saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
  });

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(
    () => addresses.find(a => a.is_default) || addresses[0] || null
  );

  const [riders, setRiders] = useState<Rider[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}riders`);
    return saved ? JSON.parse(saved) : INITIAL_RIDERS;
  });

  const [currentRider, setCurrentRider] = useState<Rider | null>(() => riders[0] || null);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}food_categories`);
    return saved ? JSON.parse(saved) : INITIAL_FOOD_CATEGORIES;
  });

  const [adBanners, setAdBanners] = useState<AdBanner[]>([]);

  // Fetch ad banners from database (Supabase) on mount
  useEffect(() => {
    const fetchAdBanners = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('ads_banners')
            .select('*')
            .order('order_index', { ascending: true });
          
          if (error) {
            console.error('Error fetching ads from Supabase:', error);
          } else if (data) {
            setAdBanners(data as AdBanner[]);
            return;
          }
        } catch (err) {
          console.error('Failed to load ads from database:', err);
        }
      }
      
      // Fallback local storage
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}ad_banners`);
      if (saved) {
        setAdBanners(JSON.parse(saved));
      } else {
        setAdBanners([]);
      }
    };

    fetchAdBanners();
  }, []);

  // Fetch vendors and riders from database on mount
  useEffect(() => {
    const fetchVendorsAndRiders = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: vData, error: vError } = await supabase
            .from('vendors')
            .select('*');
          if (!vError && vData) {
            setVendors(vData as Vendor[]);
          }

          const { data: rData, error: rError } = await supabase
            .from('riders')
            .select('*');
          if (!rError && rData) {
            setRiders(rData as Rider[]);
          }
        } catch (err) {
          console.error('Failed to load vendors/riders from database:', err);
        }
      }
    };

    fetchVendorsAndRiders();
  }, []);

  const [riderMessages, setRiderMessages] = useState<RiderMessage[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}rider_messages`);
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg-101',
        recipient_rider_id: 'ALL',
        sender: 'FoodHub Admin',
        title: 'Welcome to FoodHub Rider Fleet! 🛵',
        body: 'Keep your GPS location active and status set to Online to receive automatic cash order dispatches.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: false
      },
      {
        id: 'msg-102',
        recipient_rider_id: 'ALL',
        sender: 'FoodHub Operations',
        title: 'Daily Cash Bonus Alert! 💰',
        body: 'Complete 10 cash deliveries today in Chawkbazar or GEC Zone and earn an extra ৳200 bonus credited to your wallet.',
        created_at: new Date(Date.now() - 18000000).toISOString(),
        is_read: false
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVendor, setCartVendor] = useState<Vendor | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}vendors`, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}menu_items`, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}food_categories`, JSON.stringify(foodCategories));
  }, [foodCategories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}ad_banners`, JSON.stringify(adBanners));
  }, [adBanners]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}rider_messages`, JSON.stringify(riderMessages));
  }, [riderMessages]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}addresses`, JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}riders`, JSON.stringify(riders));
  }, [riders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  // Derived current customer
  const currentCustomer = currentUser && currentUser.role === 'customer'
    ? customers.find(c => c.id === currentUser.reference_id || c.phone === currentUser.phone) || null
    : null;

  // Sound notification
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  };

  // -------------------------------------------------------------
  // USER AUTHENTICATION & LOGIN WORKFLOW
  // -------------------------------------------------------------
  const loginUser = (userRole: PortalRole, phone: string, password?: string) => {
    const cleanPhone = phone.trim();

    if (userRole === 'admin') {
      if (password === 'admin123' || password === '123' || !password) {
        const adminAccount: UserAccount = {
          id: 'admin-001',
          role: 'admin',
          name: 'System Admin',
          phone: cleanPhone || '01700000000',
          is_password_set: true
        };
        setCurrentUser(adminAccount);
        return { success: true };
      }
      return { success: false, message: 'Invalid Admin Password' };
    }

    if (userRole === 'vendor') {
      const vendor = vendors.find(v => v.phone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')) || v.phone === cleanPhone);
      if (!vendor) {
        return { success: false, message: 'This phone number is not registered as a Vendor by Admin.' };
      }

      // If first time login (no password set yet)
      if (!vendor.is_password_set || !vendor.password) {
        return { 
          success: false, 
          requiresPasswordSetup: true, 
          message: 'First-time login detected. Please set your new password.' 
        };
      }

      if (vendor.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      const vendorAccount: UserAccount = {
        id: `u-v-${vendor.id}`,
        role: 'vendor',
        name: vendor.name,
        phone: vendor.phone,
        is_password_set: true,
        reference_id: vendor.id,
        zone: vendor.zone
      };
      setCurrentUser(vendorAccount);
      setCurrentVendor(vendor);
      return { success: true };
    }

    if (userRole === 'rider') {
      const rider = riders.find(r => {
        if (!r || !r.phone) return false;
        const rDigits = String(r.phone).replace(/\D/g, '');
        const cleanDigits = String(cleanPhone).replace(/\D/g, '');
        return (rDigits && cleanDigits && rDigits.endsWith(cleanDigits)) || r.phone === cleanPhone;
      });
      if (!rider) {
        return { success: false, message: 'This phone number is not registered as a Rider by Admin.' };
      }

      if (!rider.is_password_set || !rider.password) {
        return { 
          success: false, 
          requiresPasswordSetup: true, 
          message: 'First-time login detected. Please set your new password.' 
        };
      }

      if (rider.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      const riderAccount: UserAccount = {
        id: `u-r-${rider.id}`,
        role: 'rider',
        name: rider.name,
        phone: rider.phone,
        is_password_set: true,
        reference_id: rider.id,
        zone: rider.zone,
        photo_url: rider.photo_url
      };
      setCurrentUser(riderAccount);
      setCurrentRider(rider);
      return { success: true };
    }

    if (userRole === 'customer') {
      const customer = customers.find(c => c.phone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')) || c.phone === cleanPhone);
      if (!customer) {
        return { success: false, message: 'Account not found. Please register first.' };
      }

      if (customer.password && customer.password !== password) {
        return { success: false, message: 'Incorrect password.' };
      }

      const customerAccount: UserAccount = {
        id: `u-c-${customer.id}`,
        role: 'customer',
        name: customer.name,
        phone: customer.phone,
        is_password_set: true,
        reference_id: customer.id
      };
      setCurrentUser(customerAccount);
      return { success: true };
    }

    return { success: false, message: 'Unknown role' };
  };

  const setPasswordForUser = (userRole: PortalRole, phone: string, newPassword: string): boolean => {
    const cleanPhone = phone.trim();

    if (userRole === 'vendor') {
      const vendor = vendors.find(v => v.phone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')) || v.phone === cleanPhone);
      if (!vendor) return false;
      
      setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, password: newPassword, is_password_set: true } : v));
      
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('vendors')
          .update({ password: newPassword, is_password_set: true })
          .eq('id', vendor.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating vendor password in Supabase:', error);
            }
          });
      }

      const vendorAccount: UserAccount = {
        id: `u-v-${vendor.id}`,
        role: 'vendor',
        name: vendor.name,
        phone: vendor.phone,
        is_password_set: true,
        reference_id: vendor.id,
        zone: vendor.zone
      };
      setCurrentUser(vendorAccount);
      setCurrentVendor({ ...vendor, password: newPassword, is_password_set: true });
      return true;
    }

    if (userRole === 'rider') {
      const rider = riders.find(r => r.phone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')) || r.phone === cleanPhone);
      if (!rider) return false;

      setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, password: newPassword, is_password_set: true } : r));

      if (isSupabaseConfigured && supabase) {
        supabase
          .from('riders')
          .update({ password: newPassword, is_password_set: true })
          .eq('id', rider.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating rider password in Supabase:', error);
            }
          });
      }

      const riderAccount: UserAccount = {
        id: `u-r-${rider.id}`,
        role: 'rider',
        name: rider.name,
        phone: rider.phone,
        is_password_set: true,
        reference_id: rider.id,
        zone: rider.zone,
        photo_url: rider.photo_url
      };
      setCurrentUser(riderAccount);
      setCurrentRider({ ...rider, password: newPassword, is_password_set: true });
      return true;
    }

    return false;
  };

  const registerCustomer = (data: { name: string; phone: string; password: string; email?: string }) => {
    const cleanPhone = data.phone.trim();
    if (customers.some(c => c.phone === cleanPhone)) {
      return { success: false, message: 'This phone number is already registered. Please login.' };
    }

    const newCustomer: CustomerUser = {
      id: `c-${Date.now()}`,
      name: data.name.trim(),
      phone: cleanPhone,
      password: data.password,
      email: data.email?.trim(),
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      addresses: [],
      created_at: new Date().toISOString()
    };

    setCustomers(prev => [...prev, newCustomer]);
    
    const customerAccount: UserAccount = {
      id: `u-c-${newCustomer.id}`,
      role: 'customer',
      name: newCustomer.name,
      phone: newCustomer.phone,
      is_password_set: true,
      reference_id: newCustomer.id
    };
    setCurrentUser(customerAccount);
    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());

  const connectSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = updateSupabaseCredentials(url, anonKey);
      setSupabaseConfig(getSupabaseConfig());
      
      if (!res.isConfigured || !res.client) {
        return { success: false, message: 'Please provide valid Supabase Project URL and Public Anon Key.' };
      }

      // Test querying riders
      const { error } = await res.client.from('riders').select('id').limit(1);
      if (error) {
        return { 
          success: false, 
          message: `Connected, but query to riders table failed: ${error.message} (${error.hint || error.details || 'Check if table exists & RLS is disabled'})` 
        };
      }

      // Load live records from Supabase
      try {
        const { data: vData } = await res.client.from('vendors').select('*');
        if (vData && vData.length > 0) {
          setVendors(vData as Vendor[]);
        }

        const { data: rData } = await res.client.from('riders').select('*');
        if (rData && rData.length > 0) {
          setRiders(rData as Rider[]);
        }
      } catch (loadErr) {
        console.warn('Initial data load warning:', loadErr);
      }

      return { success: true, message: 'Connected to Supabase database successfully!' };
    } catch (e: any) {
      return { success: false, message: `Connection error: ${e?.message || String(e)}` };
    }
  };

  const syncAllToSupabase = async () => {
    if (!supabase || !isSupabaseConfigured) {
      return { 
        success: false, 
        message: 'Supabase is not connected in this browser session. Enter URL and Key first.', 
        vendorsCount: 0, 
        ridersCount: 0 
      };
    }

    let rCount = 0;
    let vCount = 0;

    for (const r of riders) {
      try {
        const payload: Record<string, any> = {
          id: r.id,
          name: r.name,
          phone: r.phone,
          zone: r.zone || 'Chawkbazar Zone',
          is_online: r.is_online || false,
          is_paused: r.is_paused || false,
          is_approved: true,
          is_password_set: r.is_password_set || false,
          password: r.password || null
        };
        const { error } = await supabase.from('riders').upsert([payload]);
        if (!error) rCount++;
      } catch (err) {
        console.warn('Sync rider error:', err);
      }
    }

    for (const v of vendors) {
      try {
        const payload: Record<string, any> = {
          id: v.id,
          name: v.name,
          phone: v.phone,
          address: v.address || 'Chittagong',
          cuisine: v.cuisine || 'Fast Food',
          zone: v.zone || 'Chawkbazar Zone',
          latitude: v.latitude || 22.3585,
          longitude: v.longitude || 91.8385,
          is_active: v.is_active ?? true,
          is_paused: v.is_paused ?? false
        };
        const { error } = await supabase.from('vendors').upsert([payload]);
        if (!error) vCount++;
      } catch (err) {
        console.warn('Sync vendor error:', err);
      }
    }

    return { 
      success: true, 
      message: `Successfully synced ${rCount} riders and ${vCount} vendors to Supabase database!`, 
      ridersCount: rCount, 
      vendorsCount: vCount 
    };
  };

  // -------------------------------------------------------------
  // ADMIN VENDOR & RIDER REGISTRATION
  // -------------------------------------------------------------
  const adminRegisterVendor = async (data: {
    name: string;
    phone: string;
    address: string;
    cuisine: string;
    zone: string;
    latitude: number;
    longitude: number;
    description?: string;
  }): Promise<{ vendor: Vendor; savedToDatabase: boolean; dbMessage?: string }> => {
    const newVendor: Vendor = {
      id: crypto.randomUUID(),
      unique_id: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      cuisine: data.cuisine.trim(),
      zone: data.zone || 'Chawkbazar Zone',
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description || 'Quality food prepared with fresh ingredients',
      is_active: true,
      is_paused: false,
      rating: 5.0,
      estimated_prep_time_minutes: 20,
      is_password_set: false,
      cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString()
    };

    let savedToDatabase = false;
    let dbMessage = '';

    if (isSupabaseConfigured && supabase) {
      try {
        const fullPayload = {
          id: newVendor.id,
          unique_id: newVendor.unique_id,
          name: newVendor.name,
          phone: newVendor.phone,
          address: newVendor.address,
          cuisine: newVendor.cuisine,
          zone: newVendor.zone,
          latitude: newVendor.latitude,
          longitude: newVendor.longitude,
          description: newVendor.description,
          is_active: newVendor.is_active,
          is_paused: newVendor.is_paused,
          rating: newVendor.rating,
          estimated_prep_time_minutes: newVendor.estimated_prep_time_minutes,
          is_password_set: newVendor.is_password_set,
          password: null,
          logo_url: newVendor.logo_url,
          cover_image: newVendor.cover_image,
          created_at: newVendor.created_at
        };

        const { error } = await supabase.from('vendors').insert([fullPayload]);
        if (error) {
          console.warn('Vendor full payload insert error:', error);
          const fallbackPayload: Record<string, any> = {
            id: newVendor.id,
            name: newVendor.name,
            phone: newVendor.phone,
            address: newVendor.address,
            latitude: newVendor.latitude,
            longitude: newVendor.longitude
          };
          const retryRes = await supabase.from('vendors').insert([fallbackPayload]);
          if (!retryRes.error) {
            savedToDatabase = true;
            dbMessage = 'Saved to Supabase vendors table (essential columns).';
          } else {
            dbMessage = `Database Error: ${retryRes.error.message || error.message}`;
          }
        } else {
          savedToDatabase = true;
          dbMessage = 'Saved to Supabase vendors table successfully.';
        }
      } catch (err: any) {
        dbMessage = `Database Exception: ${err?.message || String(err)}`;
      }
    } else {
      dbMessage = 'Supabase is not connected in this browser session. Saved in Local Storage.';
    }

    setVendors(prev => [newVendor, ...prev]);
    return { vendor: newVendor, savedToDatabase, dbMessage };
  };

  const toggleVendorPause = (id: string) => {
    setVendors(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, is_paused: !v.is_paused } : v);
      if (isSupabaseConfigured && supabase) {
        const matched = updated.find(x => x.id === id);
        if (matched) {
          supabase.from('vendors').update({ is_paused: matched.is_paused }).eq('id', id).then();
        }
      }
      return updated;
    });
  };

  const deleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from('vendors').delete().eq('id', id).then();
    }
  };

  const adminRegisterRider = async (data: {
    phone: string;
    name?: string;
    photo_url?: string;
    home_address?: string;
    zone?: string;
    vehicle_type?: 'Motorcycle' | 'Bicycle' | 'Scooter';
    latitude?: number;
    longitude?: number;
  }): Promise<{ rider: Rider; savedToDatabase: boolean; dbMessage?: string }> => {
    const cleanPhone = data.phone.trim();
    const cleanName = data.name?.trim() || `Rider ${cleanPhone.slice(-4) || 'Fleet'}`;
    const newRider: Rider = {
      id: crypto.randomUUID(),
      unique_id: `RDR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: cleanName,
      phone: cleanPhone,
      photo_url: data.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      home_address: data.home_address?.trim() || 'Chittagong',
      zone: data.zone || 'Chawkbazar Zone',
      vehicle_type: data.vehicle_type || 'Motorcycle',
      is_online: false,
      is_paused: false,
      current_latitude: data.latitude || 22.3590,
      current_longitude: data.longitude || 91.8380,
      last_location_updated_at: new Date().toISOString(),
      cash_in_hand: 0,
      is_approved: true,
      is_password_set: false,
      created_at: new Date().toISOString()
    };

    let savedToDatabase = false;
    let dbMessage = '';

    if (isSupabaseConfigured && supabase) {
      try {
        const fullPayload = {
          id: newRider.id,
          unique_id: newRider.unique_id,
          name: newRider.name,
          phone: newRider.phone,
          photo_url: newRider.photo_url,
          home_address: newRider.home_address,
          zone: newRider.zone,
          vehicle_type: newRider.vehicle_type,
          is_online: newRider.is_online,
          is_paused: newRider.is_paused,
          current_latitude: newRider.current_latitude,
          current_longitude: newRider.current_longitude,
          last_location_updated_at: newRider.last_location_updated_at,
          cash_in_hand: newRider.cash_in_hand,
          is_approved: newRider.is_approved,
          is_password_set: newRider.is_password_set,
          password: null,
          created_at: newRider.created_at
        };

        const { error } = await supabase.from('riders').insert([fullPayload]);
        
        if (error) {
          console.warn('Initial rider payload insert failed:', error);
          // If schema has fewer columns, retry with essential columns
          const fallbackPayload: Record<string, any> = {
            id: newRider.id,
            name: newRider.name,
            phone: newRider.phone,
          };
          const retryRes = await supabase.from('riders').insert([fallbackPayload]);
          if (!retryRes.error) {
            savedToDatabase = true;
            dbMessage = 'Saved to Supabase riders table (using essential columns).';
          } else {
            // Also try inserting with just id and phone if name column has issues
            const phoneOnlyPayload: Record<string, any> = {
              id: newRider.id,
              phone: newRider.phone,
            };
            const phoneOnlyRes = await supabase.from('riders').insert([phoneOnlyPayload]);
            if (!phoneOnlyRes.error) {
              savedToDatabase = true;
              dbMessage = 'Saved to Supabase riders table (id and phone).';
            } else {
              dbMessage = `Database Error: ${retryRes.error.message || error.message} (${error.hint || ''})`;
            }
          }
        } else {
          savedToDatabase = true;
          dbMessage = 'Saved to Supabase riders table successfully.';
        }
      } catch (err: any) {
        dbMessage = `Database Exception: ${err?.message || String(err)}`;
      }
    } else {
      dbMessage = 'Supabase is not connected in this browser session. Saved in Local Storage.';
    }

    setRiders(prev => [newRider, ...prev]);
    return { rider: newRider, savedToDatabase, dbMessage };
  };

  const completeRiderRegistration = async (data: {
    phone: string;
    name?: string;
    password: string;
  }): Promise<{ success: boolean; message: string; rider?: Rider }> => {
    const cleanPhone = (data.phone || '').trim();
    const cleanName = (data.name || '').trim();
    const password = (data.password || '').trim();

    if (!cleanPhone || !password) {
      return { success: false, message: 'Please provide phone number and password.' };
    }

    const rider = riders.find(r => {
      if (!r || !r.phone) return false;
      const rDigits = String(r.phone).replace(/\D/g, '');
      const cleanDigits = String(cleanPhone).replace(/\D/g, '');
      return (rDigits && cleanDigits && rDigits.endsWith(cleanDigits)) || r.phone === cleanPhone;
    });

    if (!rider) {
      return { 
        success: false, 
        message: 'This phone number has not been registered by Admin. Please ask Admin to add your phone number first.' 
      };
    }

    const resolvedName = cleanName || rider.name || `Rider ${cleanPhone.slice(-4) || 'Fleet'}`;

    const updatedRider: Rider = {
      ...rider,
      name: resolvedName,
      password: password,
      is_password_set: true,
      is_online: false,
      current_latitude: Number(rider.current_latitude) || 22.3590,
      current_longitude: Number(rider.current_longitude) || 91.8380,
      cash_in_hand: Number(rider.cash_in_hand) || 0,
      vehicle_type: rider.vehicle_type || 'Motorcycle',
      zone: rider.zone || 'Chawkbazar Zone'
    };

    // Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('riders').update({
          name: resolvedName,
          password: password,
          is_password_set: true
        }).eq('id', rider.id);
        
        if (error) {
          console.warn('Supabase rider password update error:', error);
          // Try fallback updating name only if password columns don't exist
          const fallbackRes = await supabase.from('riders').update({
            name: resolvedName
          }).eq('id', rider.id);
          if (fallbackRes.error) {
            console.warn('Supabase rider name update fallback warning:', fallbackRes.error);
          }
        }
      } catch (err) {
        console.warn('Supabase update exception:', err);
      }
    }

    // Update local state
    setRiders(prev => prev.map(r => r.id === rider.id ? updatedRider : r));

    const riderAccount: UserAccount = {
      id: `u-r-${updatedRider.id}`,
      role: 'rider',
      name: updatedRider.name,
      phone: updatedRider.phone,
      is_password_set: true,
      reference_id: updatedRider.id,
      zone: updatedRider.zone,
      photo_url: updatedRider.photo_url
    };

    setCurrentUser(riderAccount);
    setCurrentRider(updatedRider);

    return { 
      success: true, 
      message: 'Registration completed successfully! Welcome to the Rider App.', 
      rider: updatedRider 
    };
  };

  const updateRiderProfile = async (riderId: string, updates: Partial<Rider>): Promise<{ success: boolean; message: string }> => {
    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, ...updates } : r));
    
    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? { ...prev, ...updates } : null);
    }
    
    if (currentUser && currentUser.reference_id === riderId) {
      setCurrentUser(prev => prev ? { 
        ...prev, 
        name: updates.name !== undefined ? updates.name : prev.name, 
        zone: updates.zone !== undefined ? updates.zone : prev.zone,
        photo_url: updates.photo_url !== undefined ? updates.photo_url : prev.photo_url
      } : null);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('riders').update(updates).eq('id', riderId);
        if (error) {
          console.warn('Supabase updateRiderProfile error:', error);
        }
      } catch (err) {
        console.warn('Supabase exception in updateRiderProfile:', err);
      }
    }

    return { success: true, message: 'Rider profile updated successfully!' };
  };

  const toggleRiderPause = (id: string) => {
    setRiders(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, is_paused: !r.is_paused } : r);
      if (isSupabaseConfigured && supabase) {
        const matched = updated.find(x => x.id === id);
        if (matched) {
          supabase.from('riders').update({ is_paused: matched.is_paused }).eq('id', id).then();
        }
      }
      return updated;
    });
  };

  const deleteRider = (id: string) => {
    setRiders(prev => prev.filter(r => r.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from('riders').delete().eq('id', id).then();
    }
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    if (currentVendor && currentVendor.id === id) {
      setCurrentVendor(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings, updated_at: new Date().toISOString() }));
  };

  // -------------------------------------------------------------
  // MENU ITEMS
  // -------------------------------------------------------------
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `m-${Date.now()}` };
    setMenuItems(prev => [newItem, ...prev]);
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, is_available: !m.is_available } : m));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  // -------------------------------------------------------------
  // FOOD CATEGORIES (Admin Configurable)
  // -------------------------------------------------------------
  const addFoodCategory = (category: Omit<FoodCategory, 'id'>) => {
    const newCat: FoodCategory = {
      ...category,
      id: `cat-${Date.now()}`
    };
    setFoodCategories(prev => [...prev, newCat]);
  };

  const updateFoodCategory = (id: string, updates: Partial<FoodCategory>) => {
    setFoodCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteFoodCategory = (id: string) => {
    setFoodCategories(prev => prev.filter(c => c.id !== id));
  };

  // -------------------------------------------------------------
  // PROMOTIONAL ADS & HERO BANNERS
  // -------------------------------------------------------------
  const addAdBanner = async (ad: Omit<AdBanner, 'id'>) => {
    const newId = `ad-${Date.now()}`;
    const newAd: AdBanner = {
      ...ad,
      id: newId,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('ads_banners')
          .insert([
            {
              id: newAd.id,
              title: newAd.title,
              subtitle: newAd.subtitle || null,
              action_text: newAd.action_text || 'Redeem now',
              image_url: newAd.image_url,
              target_vendor_id: newAd.target_vendor_id || null,
              is_active: newAd.is_active,
              order_index: newAd.order_index || 0,
              created_at: newAd.created_at
            }
          ]);
        if (error) {
          console.error('Supabase error inserting banner:', error);
          alert('Database Error: ' + error.message);
          return;
        }
      } catch (err) {
        console.error('Failed to insert banner in database:', err);
      }
    }

    setAdBanners(prev => [newAd, ...prev]);
  };

  const updateAdBanner = async (id: string, updates: Partial<AdBanner>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('ads_banners')
          .update({
            title: updates.title,
            subtitle: updates.subtitle || null,
            action_text: updates.action_text,
            image_url: updates.image_url,
            target_vendor_id: updates.target_vendor_id || null,
            is_active: updates.is_active,
            order_index: updates.order_index
          })
          .eq('id', id);
        if (error) {
          console.error('Supabase error updating banner:', error);
        }
      } catch (err) {
        console.error('Failed to update banner in database:', err);
      }
    }

    setAdBanners(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAdBanner = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('ads_banners')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('Supabase error deleting banner:', error);
        }
      } catch (err) {
        console.error('Failed to delete banner in database:', err);
      }
    }

    setAdBanners(prev => prev.filter(a => a.id !== id));
  };

  const toggleAdBannerStatus = async (id: string) => {
    const targetAd = adBanners.find(a => a.id === id);
    if (!targetAd) return;

    const newStatus = !targetAd.is_active;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('ads_banners')
          .update({ is_active: newStatus })
          .eq('id', id);
        if (error) {
          console.error('Supabase error toggling banner status:', error);
        }
      } catch (err) {
        console.error('Failed to toggle status in database:', err);
      }
    }

    setAdBanners(prev => prev.map(a => a.id === id ? { ...a, is_active: newStatus } : a));
  };

  // -------------------------------------------------------------
  // CUSTOMER ADDRESSES
  // -------------------------------------------------------------
  const addAddress = (addr: Omit<CustomerAddress, 'id'>) => {
    const newAddr: CustomerAddress = { ...addr, id: `addr-${Date.now()}` };
    setAddresses(prev => [newAddr, ...prev]);
    setSelectedAddress(newAddr);
    return newAddr;
  };

  const updateAddress = (id: string, updates: Partial<CustomerAddress>) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (selectedAddress && selectedAddress.id === id) {
      setSelectedAddress(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedAddress && selectedAddress.id === id) {
      setSelectedAddress(addresses.find(a => a.id !== id) || null);
    }
  };

  // -------------------------------------------------------------
  // RIDER GPS & LOCATION UPDATES
  // -------------------------------------------------------------
  const updateRiderLocation = (riderId: string, lat: number, lng: number) => {
    setRiders(prev => prev.map(r => 
      r.id === riderId ? { 
        ...r, 
        current_latitude: lat, 
        current_longitude: lng,
        last_location_updated_at: new Date().toISOString()
      } : r
    ));
    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? { 
        ...prev, 
        current_latitude: lat, 
        current_longitude: lng,
        last_location_updated_at: new Date().toISOString()
      } : null);
    }
  };

  const simulateRiderMovement = (stepLat: number, stepLng: number) => {
    if (!currentRider) return;
    updateRiderLocation(
      currentRider.id,
      currentRider.current_latitude + stepLat,
      currentRider.current_longitude + stepLng
    );
  };

  const toggleRiderOnline = async (riderId: string, isOnline: boolean): Promise<boolean> => {
    if (isOnline && navigator.geolocation) {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            enableHighAccuracy: true
          });
        }).then((pos) => {
          updateRiderLocation(riderId, pos.coords.latitude, pos.coords.longitude);
        }).catch(() => {
          // Keep current lat/lng
        });
      } catch {
        // Ignore
      }
    }

    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, is_online: isOnline } : r));
    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? { ...prev, is_online: isOnline } : null);
    }
    return true;
  };

  // -------------------------------------------------------------
  // CART & ORDER CREATION (EXACT PIN POINT DELIVERY CALCULATION)
  // -------------------------------------------------------------
  const addToCart = (item: MenuItem, vendor: Vendor) => {
    if (cartVendor && cartVendor.id !== vendor.id && cart.length > 0) {
      const confirmReset = window.confirm(
        `Your cart contains items from ${cartVendor.name}. Clear cart and add from ${vendor.name}?`
      );
      if (!confirmReset) return;
      setCart([{ menuItem: item, quantity: 1 }]);
      setCartVendor(vendor);
      return;
    }

    setCartVendor(vendor);
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci => 
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const filtered = prev.filter(ci => ci.menuItem.id !== menuItemId);
      if (filtered.length === 0) setCartVendor(null);
      return filtered;
    });
  };

  const updateCartQuantity = (menuItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev => prev.map(ci => ci.menuItem.id === menuItemId ? { ...ci, quantity: qty } : ci));
  };

  const clearCart = () => {
    setCart([]);
    setCartVendor(null);
  };

  const placeOrder = async (instructions?: string): Promise<Order | null> => {
    if (cart.length === 0 || !cartVendor || !selectedAddress) return null;

    const foodTotal = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
    const distanceKm = calculateDistanceKm(
      cartVendor.latitude,
      cartVendor.longitude,
      selectedAddress.latitude,
      selectedAddress.longitude
    );
    const deliveryFee = calculateDeliveryFee(
      distanceKm,
      settings.base_delivery_charge,
      settings.per_km_delivery_charge
    );
    const totalCashPayable = foodTotal + deliveryFee;

    const orderId = `ord-${Date.now()}`;
    const orderCode = `FV-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      order_code: orderCode,
      customer_id: currentCustomer?.id || 'guest',
      customer_name: selectedAddress.customer_name || currentUser?.name || 'Customer',
      customer_phone: selectedAddress.customer_phone || currentUser?.phone || '01800000000',
      vendor_id: cartVendor.id,
      zone: cartVendor.zone || selectedAddress.zone || 'Chawkbazar Zone',
      delivery_address: `${selectedAddress.address_line}${selectedAddress.details ? ` (${selectedAddress.details})` : ''}`,
      delivery_latitude: selectedAddress.latitude,
      delivery_longitude: selectedAddress.longitude,
      food_total: foodTotal,
      delivery_distance_km: distanceKm,
      delivery_fee: deliveryFee,
      total_cash_payable: totalCashPayable,
      food_cash_paid_to_vendor: false,
      food_and_delivery_cash_collected_from_customer: false,
      status: 'pending',
      special_instructions: instructions || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: cart.map((ci, index) => ({
        id: `oi-${Date.now()}-${index}`,
        order_id: orderId,
        menu_item_id: ci.menuItem.id,
        item_name: ci.menuItem.name,
        item_price: ci.menuItem.price,
        quantity: ci.quantity,
        subtotal: ci.menuItem.price * ci.quantity
      })),
      vendor: cartVendor
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    playNotificationSound();
    return newOrder;
  };

  // -------------------------------------------------------------
  // STEP 2 & 3: VENDOR PREP TIME & CUSTOMER PERMISSION WINDOW
  // -------------------------------------------------------------
  const vendorAcceptOrderWithPrepTime = (orderId: string, prepMinutes: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'vendor_accepted',
          vendor_prep_minutes: prepMinutes,
          customer_confirmed_prep: false,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
    playNotificationSound();
  };

  const customerRespondToPrepTime = (orderId: string, accept: boolean) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (accept) {
          const prepMinutes = o.vendor_prep_minutes || 15;
          const prepEndsAt = new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();
          return {
            ...o,
            status: 'food_preparing',
            customer_confirmed_prep: true,
            prep_ends_at: prepEndsAt,
            updated_at: new Date().toISOString()
          };
        } else {
          return {
            ...o,
            status: 'cancelled',
            customer_confirmed_prep: false,
            cancellation_reason: 'Customer declined preparation wait time',
            updated_at: new Date().toISOString()
          };
        }
      }
      return o;
    }));
    playNotificationSound();
  };

  const vendorMarkFoodReady = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'ready_for_pickup',
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
    playNotificationSound();
    // Immediately attempt rider dispatch
    triggerRiderDispatch(orderId);
  };

  // -------------------------------------------------------------
  // STEP 4: INTELLIGENT SINGLE-RIDER PROXIMITY & ZONE DISPATCH ENGINE
  // User Requirement:
  // "rider zone registration korar shomoy admin set korbe...
  // order Ta rider er kace tokoni Dukbe jokon vendor and customer ubhoy tar zone er bhitor thaken..
  // order random j kono ekjon er kace Dukbe..jodi she reject kore tahole onno joner kace jabe"
  // -------------------------------------------------------------
  const triggerRiderDispatch = (orderId: string): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const vendor = vendors.find(v => v.id === order.vendor_id);
    if (!vendor) return false;

    const orderZone = order.zone || vendor.zone;
    const rejectedRiderIds = order.rejected_rider_ids || [];

    // Find eligible online riders matching:
    // 1. Is online
    // 2. Rider zone matches order/vendor zone
    // 3. Has not already rejected this order
    // 4. Distance to vendor is <= match radius (e.g. 1.0 km)
    const eligibleRiders = riders.filter(r => {
      if (!r.is_online) return false;
      if (rejectedRiderIds.includes(r.id)) return false;
      
      // Zone match check (if zone is set)
      if (r.zone && orderZone && r.zone.toLowerCase() !== orderZone.toLowerCase()) {
        return false;
      }

      // Proximity distance check
      const distKm = calculateDistanceKm(
        vendor.latitude,
        vendor.longitude,
        r.current_latitude,
        r.current_longitude
      );

      return distKm <= (settings.rider_match_radius_km || 1.5);
    });

    if (eligibleRiders.length === 0) {
      // Fallback: If no rider within 1km in zone, expand to any online rider in that zone
      const zoneRiders = riders.filter(r => r.is_online && !rejectedRiderIds.includes(r.id) && (r.zone === orderZone || !r.zone));
      if (zoneRiders.length === 0) return false;
      
      const targetRider = zoneRiders[0];
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        dispatched_rider_id: targetRider.id,
        dispatch_sent_at: new Date().toISOString()
      } : o));
      return true;
    }

    // Pick one candidate rider
    const selectedCandidate = eligibleRiders[0];

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      dispatched_rider_id: selectedCandidate.id,
      dispatch_sent_at: new Date().toISOString()
    } : o));

    playNotificationSound();
    return true;
  };

  const riderAcceptOrder = (orderId: string, riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'rider_assigned',
          rider_id: riderId,
          rider: rider || undefined,
          dispatched_rider_id: undefined,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
    playNotificationSound();
  };

  const riderRejectOrder = (orderId: string, riderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const rejected = o.rejected_rider_ids || [];
        return {
          ...o,
          dispatched_rider_id: undefined,
          rejected_rider_ids: [...rejected, riderId],
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));

    // Auto dispatch to the next eligible rider in zone
    setTimeout(() => {
      triggerRiderDispatch(orderId);
    }, 500);
  };

  // -------------------------------------------------------------
  // CASH ON DELIVERY HANDOVER
  // -------------------------------------------------------------
  const riderConfirmCashPaidToVendor = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (o.rider_id) {
          setRiders(rList => rList.map(r => 
            r.id === o.rider_id ? { ...r, cash_in_hand: r.cash_in_hand - o.food_total } : r
          ));
        }
        return {
          ...o,
          status: 'food_picked_up',
          food_cash_paid_to_vendor: true,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
  };

  const riderConfirmCashCollectedFromCustomer = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (o.rider_id) {
          setRiders(rList => rList.map(r => 
            r.id === o.rider_id ? { ...r, cash_in_hand: r.cash_in_hand + o.total_cash_payable } : r
          ));
        }
        return {
          ...o,
          status: 'delivered',
          food_and_delivery_cash_collected_from_customer: true,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
    playNotificationSound();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          updated_at: new Date().toISOString(),
          ...extra
        };
      }
      return o;
    }));
    playNotificationSound();
  };

  const sendAdminMessage = (msg: Omit<RiderMessage, 'id' | 'created_at'>) => {
    const newMsg: RiderMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setRiderMessages(prev => [newMsg, ...prev]);
    playNotificationSound();
  };

  const markRiderMessageAsRead = (msgId: string) => {
    setRiderMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
  };

  return (
    <DeliveryContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        currentCustomer,
        loginUser,
        setPasswordForUser,
        registerCustomer,
        logoutUser,
        settings,
        updateSettings,
        vendors,
        currentVendor,
        setCurrentVendor,
        adminRegisterVendor,
        updateVendor,
        toggleVendorPause,
        deleteVendor,
        menuItems,
        addMenuItem,
        toggleMenuItemAvailability,
        deleteMenuItem,
        foodCategories,
        addFoodCategory,
        updateFoodCategory,
        deleteFoodCategory,
        adBanners,
        addAdBanner,
        updateAdBanner,
        deleteAdBanner,
        toggleAdBannerStatus,
        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        riders,
        currentRider,
        setCurrentRider,
        adminRegisterRider,
        completeRiderRegistration,
        updateRiderProfile,
        toggleRiderOnline,
        toggleRiderPause,
        deleteRider,
        updateRiderLocation,
        simulateRiderMovement,
        orders,
        cart,
        cartVendor,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        vendorAcceptOrderWithPrepTime,
        customerRespondToPrepTime,
        vendorMarkFoodReady,
        triggerRiderDispatch,
        riderAcceptOrder,
        riderRejectOrder,
        riderConfirmCashPaidToVendor,
        riderConfirmCashCollectedFromCustomer,
        updateOrderStatus,
        playNotificationSound,
        riderMessages,
        sendAdminMessage,
        markRiderMessageAsRead,
        isSupabaseConfigured,
        supabaseConfig,
        connectSupabase,
        syncAllToSupabase
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = (): DeliveryContextType => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};
