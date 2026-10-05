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
  INITIAL_ZONES,
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

  // Delivery & Rider Zones (Admin Configured Boundary & Map)
  zones: DeliveryZone[];
  addZone: (zone: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>) => Promise<DeliveryZone>;
  updateZone: (id: string, updates: Partial<DeliveryZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  toggleZoneActive: (id: string) => Promise<void>;

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
    vendor_type?: 'restaurant' | 'shop';
    google_maps_link?: string;
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
    zone?: string;
    vehicle_type?: 'Motorcycle' | 'Bicycle' | 'Scooter';
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
const PAUSED_RIDERS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}paused_rider_ids`;

export const getStoredPausedRiderIds = (): Set<string> => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PAUSED_RIDERS_STORAGE_KEY) : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const saveStoredPausedRiderIds = (ids: Set<string>) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PAUSED_RIDERS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    }
  } catch (e) {
    console.warn('Failed to save paused rider IDs to storage:', e);
  }
};

const foodiplaceRealtimeChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('foodiplace_realtime_sync')
  : null;

function safeJsonParse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.error(`Failed to parse localStorage key "${key}":`, err);
    return fallback;
  }
}

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State
  // Persistent Role: checks URL hash, query param, and localStorage so refreshing never resets to home
  const [role, setRoleState] = useState<PortalRole>(() => {
    if (typeof window !== 'undefined') {
      const rawHash = window.location.hash.replace('#', '').split('?')[0] as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(rawHash)) return rawHash;

      const params = new URLSearchParams(window.location.search);
      const portalQuery = params.get('portal') as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(portalQuery)) return portalQuery;

      const saved = localStorage.getItem('foodiplace_active_portal') as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(saved)) return saved;
    }
    return 'customer';
  });

  const setRole = (newRole: PortalRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodiplace_active_portal', newRole);
      const currentHash = window.location.hash.replace('#', '').split('?')[0];
      if (currentHash !== newRole) {
        window.location.hash = `#${newRole}`;
      }
    }
  };

  const [settings, setSettings] = useState<SystemSettings>(() => {
    return safeJsonParse(`${STORAGE_KEY_PREFIX}settings`, DEFAULT_SETTINGS);
  });

  const [zones, setZones] = useState<DeliveryZone[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}zones`, INITIAL_ZONES);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ZONES;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}vendors`, INITIAL_VENDORS);
    return Array.isArray(parsed) ? parsed : INITIAL_VENDORS;
  });

  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(() => vendors[0] || null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}menu_items`, INITIAL_MENU_ITEMS);
    return Array.isArray(parsed) ? parsed : INITIAL_MENU_ITEMS;
  });

  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}customers`, INITIAL_CUSTOMERS);
    return Array.isArray(parsed) ? parsed : INITIAL_CUSTOMERS;
  });

  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}addresses`, INITIAL_ADDRESSES);
    return Array.isArray(parsed) ? parsed : INITIAL_ADDRESSES;
  });

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(
    () => (Array.isArray(addresses) ? addresses.find(a => a?.is_default) || addresses[0] : null) || null
  );

  // Riders state: strictly enforces persistent is_paused so paused riders never auto-resume
  const [riders, setRiders] = useState<Rider[]>(() => {
    const list: Rider[] = safeJsonParse(`${STORAGE_KEY_PREFIX}riders`, INITIAL_RIDERS);
    const validList = Array.isArray(list) ? list : INITIAL_RIDERS;
    const pausedIds = getStoredPausedRiderIds();
    return validList.map(r => {
      if (!r) return r;
      const isPaused = pausedIds.has(r.id) ? true : Boolean(r.is_paused);
      return {
        ...r,
        is_paused: isPaused,
        is_online: isPaused ? false : Boolean(r.is_online)
      };
    });
  });

  const [currentRider, setCurrentRider] = useState<Rider | null>(() => riders[0] || null);

  const [orders, setOrders] = useState<Order[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}orders`, INITIAL_ORDERS);
    return Array.isArray(parsed) ? parsed : INITIAL_ORDERS;
  });

  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>(() => {
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}food_categories`, INITIAL_FOOD_CATEGORIES);
    const valid = Array.isArray(parsed) ? parsed.filter(c => c && c.id && !['cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7','cat-8','cat-9','cat-10','cat-11'].includes(c.id)) : [];
    return valid;
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
      const savedAds = safeJsonParse(`${STORAGE_KEY_PREFIX}ad_banners`, []);
      setAdBanners(Array.isArray(savedAds) ? savedAds : []);
    };

    fetchAdBanners();
  }, []);

  // Listen for real-time broadcast updates across open browser tabs
  useEffect(() => {
    if (!foodiplaceRealtimeChannel) return;
    const handleBroadcastMsg = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === 'RIDER_UPDATE') {
        const { riderId, updates } = data;
        const pausedIds = getStoredPausedRiderIds();
        if (updates.is_paused !== undefined) {
          if (updates.is_paused) pausedIds.add(riderId);
          else pausedIds.delete(riderId);
          saveStoredPausedRiderIds(pausedIds);
        }
        setRiders(prev => prev.map(r => {
          if (r.id !== riderId) return r;
          const isPaused = updates.is_paused !== undefined 
            ? updates.is_paused 
            : (pausedIds.has(r.id) ? true : Boolean(r.is_paused));
          return {
            ...r,
            ...updates,
            is_paused: isPaused,
            is_online: isPaused ? false : (updates.is_online !== undefined ? updates.is_online : r.is_online)
          };
        }));
        setCurrentRider(prev => (prev && prev.id === riderId ? { ...prev, ...updates } : prev));
      } else if (data?.type === 'ORDER_UPDATE') {
        const { order } = data;
        setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      } else if (data?.type === 'NEW_ORDER') {
        const { order } = data;
        setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
      } else if (data?.type === 'ORDERS_SYNC') {
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    };
    foodiplaceRealtimeChannel.addEventListener('message', handleBroadcastMsg);
    return () => foodiplaceRealtimeChannel.removeEventListener('message', handleBroadcastMsg);
  }, []);

  // Listen to window storage event for instant cross-tab sync of paused riders
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PAUSED_RIDERS_STORAGE_KEY) {
        const pausedIds = getStoredPausedRiderIds();
        setRiders(prev => prev.map(r => {
          const isPaused = pausedIds.has(r.id);
          return {
            ...r,
            is_paused: isPaused,
            is_online: isPaused ? false : r.is_online
          };
        }));
        setCurrentRider(prev => {
          if (!prev) return null;
          const isPaused = pausedIds.has(prev.id);
          return {
            ...prev,
            is_paused: isPaused,
            is_online: isPaused ? false : prev.is_online
          };
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Fetch vendors and riders from database on mount & continuously poll every 2 seconds
  useEffect(() => {
    let isSubscribed = true;

    const fetchVendorsAndRiders = async () => {
      let fetchedRiders: Rider[] | null = null;

      // 1. Try Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: zData, error: zError } = await supabase
            .from('zones')
            .select('*')
            .order('name', { ascending: true });
          if (!zError && zData && Array.isArray(zData) && zData.length > 0 && isSubscribed) {
            setZones(zData as DeliveryZone[]);
          }

          const { data: vData, error: vError } = await supabase
            .from('vendors')
            .select('*');
          if (!vError && vData && isSubscribed) {
            setVendors(vData as Vendor[]);
          }

          const { data: rData, error: rError } = await supabase
            .from('riders')
            .select('*');
          if (!rError && rData && Array.isArray(rData) && rData.length > 0) {
            fetchedRiders = rData as Rider[];
          }

          const { data: catData, error: catError } = await supabase
            .from('food_categories')
            .select('*');
          if (!catError && catData && isSubscribed && Array.isArray(catData)) {
            setFoodCategories(catData as FoodCategory[]);
          }

          const { data: menuData, error: menuError } = await supabase
            .from('menu_items')
            .select('*');
          if (!menuError && menuData && isSubscribed && Array.isArray(menuData)) {
            setMenuItems(menuData as MenuItem[]);
          }

          // Fetch orders from Supabase with relational items
          const { data: oSupadata, error: oSupaerror } = await supabase
            .from('orders')
            .select('*');
          if (!oSupaerror && oSupadata && isSubscribed && Array.isArray(oSupadata) && oSupadata.length > 0) {
            const { data: itemsData } = await supabase.from('order_items').select('*');
            const resolvedOrders = oSupadata.map(o => {
              const oItems = Array.isArray(itemsData) ? itemsData.filter(it => it.order_id === o.id) : [];
              return {
                ...o,
                items: oItems,
                vendor: vendors.find(v => v.id === o.vendor_id) || null
              };
            });
            resolvedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(resolvedOrders);
          }
        } catch (err) {
          console.error('Failed to load from Supabase:', err);
        }
      }

      // 2. Query backend server database /api/zones and /api/riders for cross-browser synchronization
      try {
        const oRes = await fetch('/api/orders');
        if (oRes.ok) {
          const oData = await oRes.json();
          if (Array.isArray(oData) && isSubscribed) {
            setOrders(oData);
          }
        }
      } catch {}

      try {
        const zRes = await fetch('/api/zones');
        if (zRes.ok) {
          const zData = await zRes.json();
          if (Array.isArray(zData) && zData.length > 0 && isSubscribed) {
            setZones(zData as DeliveryZone[]);
          }
        }
      } catch {
        // Ignore offline network error
      }

      try {
        const res = await fetch('/api/riders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // If Supabase didn't provide riders or as fallback, use server database
            if (!fetchedRiders) {
              fetchedRiders = data as Rider[];
            } else {
              // Merge server paused state if present
              const serverMap = new Map((data as Rider[]).map(r => [r.id, r]));
              fetchedRiders = fetchedRiders.map(r => {
                const sRider = serverMap.get(r.id);
                if (sRider && sRider.is_paused !== undefined && r.is_paused === undefined) {
                  return { ...r, is_paused: sRider.is_paused };
                }
                return r;
              });
            }
          }
        }
      } catch {
        // Ignore offline network error
      }

      // 3. Query backend server database /api/customers for cross-browser synchronization
      try {
        const cRes = await fetch('/api/customers');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (Array.isArray(cData) && cData.length > 0 && isSubscribed) {
            setCustomers(prev => {
              const map = new Map(prev.map(c => [c.id, c]));
              cData.forEach((c: CustomerUser) => {
                if (c && c.id) map.set(c.id, { ...map.get(c.id), ...c });
              });
              return Array.from(map.values());
            });
          }
        }
      } catch {
        // Ignore offline network error
      }

      if (fetchedRiders && isSubscribed) {
        const safeRiders: Rider[] = fetchedRiders.map(r => {
          const isPaused = Boolean(r.is_paused);
          return {
            ...r,
            is_paused: isPaused,
            is_online: isPaused ? false : Boolean(r.is_online)
          };
        });

        setRiders(safeRiders);
        // If current rider is in list, sync currentRider state
        setCurrentRider(prev => {
          if (!prev) return null;
          const matched = safeRiders.find(r => r.id === prev.id);
          return matched ? { ...prev, ...matched } : prev;
        });
      }
    };

    fetchVendorsAndRiders();

    // 2s periodic polling ensures live updates across separate browsers/devices
    const intervalId = setInterval(fetchVendorsAndRiders, 2000);

    // Also connect to Supabase Realtime channel if available
    let realtimeChannelInstance: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        realtimeChannelInstance = supabase
          .channel('public:riders_live_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, (payload: any) => {
            if (!isSubscribed) return;
            if (payload.eventType === 'UPDATE' && payload.new) {
              const rNew = payload.new as Rider;
              const remotePaused = Boolean(rNew.is_paused);
              const safeNew: Rider = {
                ...rNew,
                is_paused: remotePaused,
                is_online: remotePaused ? false : Boolean(rNew.is_online)
              };
              setRiders(prev => prev.map(r => r.id === safeNew.id ? safeNew : r));
              setCurrentRider(prev => (prev && prev.id === safeNew.id ? { ...prev, ...safeNew } : prev));
            } else if (payload.eventType === 'INSERT' && payload.new) {
              const rNew = payload.new as Rider;
              const remotePaused = Boolean(rNew.is_paused);
              const safeNew: Rider = {
                ...rNew,
                is_paused: remotePaused,
                is_online: remotePaused ? false : Boolean(rNew.is_online)
              };
              setRiders(prev => [safeNew, ...prev.filter(r => r.id !== safeNew.id)]);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setRiders(prev => prev.filter(r => r.id !== payload.old.id));
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription warning:', err);
      }
    }

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      if (realtimeChannelInstance && supabase) {
        supabase.removeChannel(realtimeChannelInstance);
      }
    };
  }, []);

  const [riderMessages, setRiderMessages] = useState<RiderMessage[]>(() => {
    const defaultMsgs: RiderMessage[] = [
      {
        id: 'msg-101',
        recipient_rider_id: 'ALL',
        sender: 'foodiplace Admin',
        title: 'Welcome to foodiplace Rider Fleet! 🛵',
        body: 'Keep your GPS location active and status set to Online to receive automatic cash order dispatches.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: false
      },
      {
        id: 'msg-102',
        recipient_rider_id: 'ALL',
        sender: 'foodiplace Operations',
        title: 'Daily Cash Bonus Alert! 💰',
        body: 'Complete 10 cash deliveries today in Chawkbazar or GEC Zone and earn an extra ৳200 bonus credited to your wallet.',
        created_at: new Date(Date.now() - 18000000).toISOString(),
        is_read: false
      }
    ];
    const parsed = safeJsonParse(`${STORAGE_KEY_PREFIX}rider_messages`, defaultMsgs);
    return Array.isArray(parsed) ? parsed : defaultMsgs;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return safeJsonParse<UserAccount | null>(`${STORAGE_KEY_PREFIX}current_user`, null);
  });

  const getCustomerCartKey = (user: UserAccount | null): string => {
    if (user && user.role === 'customer') {
      const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
      const id = cleanPhone || user.reference_id || user.id;
      return `cust_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    }
    return 'guest';
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const custKey = getCustomerCartKey(safeJsonParse<UserAccount | null>(`${STORAGE_KEY_PREFIX}current_user`, null));
    return safeJsonParse<CartItem[]>(`${STORAGE_KEY_PREFIX}cart_${custKey}`, []);
  });

  const [cartVendor, setCartVendor] = useState<Vendor | null>(() => {
    const custKey = getCustomerCartKey(safeJsonParse<UserAccount | null>(`${STORAGE_KEY_PREFIX}current_user`, null));
    return safeJsonParse<Vendor | null>(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`, null);
  });

  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());

  // Switch and load cart dynamically and strictly per customer account
  useEffect(() => {
    const custKey = getCustomerCartKey(currentUser);
    const localCart = safeJsonParse<CartItem[]>(`${STORAGE_KEY_PREFIX}cart_${custKey}`, []);
    const localVendor = safeJsonParse<Vendor | null>(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`, null);
    setCart(localCart);
    setCartVendor(localVendor);

    // 1. Fetch from backend database server (Fast local cache)
    fetch(`/api/cart/${encodeURIComponent(custKey)}`)
      .then(res => res.json())
      .then(data => {
        if (data?.cart && Array.isArray(data.cart.items) && data.cart.items.length > 0) {
          setCart(data.cart.items);
          setCartVendor(data.cart.vendor || null);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_${custKey}`, JSON.stringify(data.cart.items));
          localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`, JSON.stringify(data.cart.vendor || null));
        } else if (localCart.length > 0) {
          // Sync local to server if server is empty
          fetch(`/api/cart/${encodeURIComponent(custKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: localCart, vendor: localVendor })
          }).catch(() => {});
        }
      })
      .catch(() => {});

    // 2. Fetch from Supabase (Persistent remote storage)
    if (supabaseConfig.isConfigured && supabase) {
      supabase
        .from('customer_carts')
        .select('*')
        .eq('customer_id', custKey)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const remoteItems = data.cart_items || [];
            const remoteVendor = data.vendor || null;
            
            // Only update if remote is newer or local is empty
            if (remoteItems.length > 0) {
              setCart(remoteItems);
              setCartVendor(remoteVendor);
              localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_${custKey}`, JSON.stringify(remoteItems));
              localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`, JSON.stringify(remoteVendor));
            }
          }
        });
    }
  }, [currentUser?.reference_id, currentUser?.phone, currentUser?.role, currentUser?.id, supabaseConfig.isConfigured]);

  const persistCustomerCart = (items: CartItem[], vendor: Vendor | null, custKeyOverride?: string) => {
    const custKey = custKeyOverride || getCustomerCartKey(currentUser);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_${custKey}`, JSON.stringify(items));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`, JSON.stringify(vendor));
    } catch {}

    // Save to Database server
    fetch(`/api/cart/${encodeURIComponent(custKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, vendor })
    }).catch(err => console.warn('Failed to save cart to server:', err));

    // Save to Supabase if configured
    if (supabaseConfig.isConfigured && supabase) {
      supabase
        .from('customer_carts')
        .upsert([{
          customer_id: custKey,
          cart_items: items,
          vendor: vendor,
          updated_at: new Date().toISOString()
        }])
        .then(({ error }) => {
          if (error) {
            console.error('Supabase cart sync error:', error);
          }
        }, (err: any) => {
          console.warn('Supabase cart sync exception:', err);
        });
    }
  };

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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}zones`, JSON.stringify(zones));
  }, [zones]);

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

  // -------------------------------------------------------------
  // RIDERS & DELIVERY ZONES (ADMIN MAP BOUNDARY & CONFIG)
  // -------------------------------------------------------------
  const addZone = async (zoneData: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>): Promise<DeliveryZone> => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
    const newZone: DeliveryZone = {
      ...zoneData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setZones(prev => {
      const updated = [...prev.filter(z => z.id !== newId && z.name.toLowerCase() !== newZone.name.toLowerCase()), newZone];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}zones`, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone)
      });
    } catch (err) {
      console.warn('API add zone error:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('zones').upsert([newZone]);
      } catch (err) {
        console.warn('Supabase add zone error:', err);
      }
    }

    return newZone;
  };

  const updateZone = async (id: string, updates: Partial<DeliveryZone>) => {
    setZones(prev => {
      const updated = prev.map(z => z.id === id ? { ...z, ...updates, updated_at: new Date().toISOString() } : z);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}zones`, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch(`/api/zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.warn('API update zone error:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('zones').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase update zone error:', err);
      }
    }
  };

  const deleteZone = async (id: string) => {
    setZones(prev => {
      const updated = prev.filter(z => z.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}zones`, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch(`/api/zones/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('API delete zone error:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('zones').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete zone error:', err);
      }
    }
  };

  const toggleZoneActive = async (id: string) => {
    const target = zones.find(z => z.id === id);
    if (!target) return;
    const nextActive = !target.is_active;
    await updateZone(id, { is_active: nextActive });
  };

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
        return { 
          success: false, 
          message: 'Phone number not found. If you are new, click Rider Registration below to join.' 
        };
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

      // If guest had cart items and logging-in customer has no cart, migrate guest cart
      const guestKey = 'guest';
      const guestCart = safeJsonParse<CartItem[]>(`${STORAGE_KEY_PREFIX}cart_${guestKey}`, []);
      const guestVendor = safeJsonParse<Vendor | null>(`${STORAGE_KEY_PREFIX}cart_vendor_${guestKey}`, null);
      const userKey = getCustomerCartKey(customerAccount);
      const userCart = safeJsonParse<CartItem[]>(`${STORAGE_KEY_PREFIX}cart_${userKey}`, []);
      if (userCart.length === 0 && guestCart.length > 0) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_${userKey}`, JSON.stringify(guestCart));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_vendor_${userKey}`, JSON.stringify(guestVendor));
        fetch(`/api/cart/${encodeURIComponent(userKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: guestCart, vendor: guestVendor })
        }).catch(() => {});
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_${guestKey}`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_vendor_${guestKey}`);
        fetch(`/api/cart/${encodeURIComponent(guestKey)}`, { method: 'DELETE' }).catch(() => {});
      }

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
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
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

    // Save customer account to database server
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    }).catch(() => {});

    // Migrate any guest cart items to new customer account
    const guestKey = 'guest';
    const guestCart = safeJsonParse<CartItem[]>(`${STORAGE_KEY_PREFIX}cart_${guestKey}`, []);
    const guestVendor = safeJsonParse<Vendor | null>(`${STORAGE_KEY_PREFIX}cart_vendor_${guestKey}`, null);
    const userKey = getCustomerCartKey(customerAccount);
    if (guestCart.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_${userKey}`, JSON.stringify(guestCart));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}cart_vendor_${userKey}`, JSON.stringify(guestVendor));
      fetch(`/api/cart/${encodeURIComponent(userKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: guestCart, vendor: guestVendor })
      }).catch(() => {});
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_${guestKey}`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_vendor_${guestKey}`);
      fetch(`/api/cart/${encodeURIComponent(guestKey)}`, { method: 'DELETE' }).catch(() => {});
    }

    setCurrentUser(customerAccount);
    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCart([]);
    setCartVendor(null);
  };

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
          is_paused: v.is_paused ?? false,
          vendor_type: v.vendor_type || 'restaurant'
        };
        const { error } = await supabase.from('vendors').upsert([payload]);
        if (!error) vCount++;
      } catch (err) {
        console.warn('Sync vendor error:', err);
      }
    }

    let zCount = 0;
    for (const z of zones) {
      try {
        const { error } = await supabase.from('zones').upsert([z]);
        if (!error) zCount++;
      } catch (err) {
        console.warn('Sync zone error:', err);
      }
    }

    let adCount = 0;
    for (const ad of adBanners) {
      try {
        const payload = {
          id: ad.id,
          title: ad.title,
          subtitle: ad.subtitle || null,
          action_text: ad.action_text || 'Redeem now',
          image_url: ad.image_url,
          target_vendor_id: ad.target_vendor_id || null,
          is_active: ad.is_active,
          order_index: ad.order_index || 0,
          portal_type: ad.portal_type || 'food'
        };
        const { error } = await supabase.from('ads_banners').upsert([payload]);
        if (!error) adCount++;
      } catch (err) {
        console.warn('Sync ad error:', err);
      }
    }

    let catCount = 0;
    for (const cat of foodCategories) {
      try {
        const payload = {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '🍽️',
          image_url: cat.image_url || null,
          is_active: cat.is_active !== false,
          order_index: cat.order_index || 0,
          category_type: cat.category_type || 'food'
        };
        const { error } = await supabase.from('food_categories').upsert([payload]);
        if (!error) catCount++;
      } catch (err) {
        console.warn('Sync category error:', err);
      }
    }

    return { 
      success: true, 
      message: `Synced ${rCount} riders, ${vCount} vendors, ${zCount} zones, ${adCount} banners, and ${catCount} categories!`, 
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
    vendor_type?: 'restaurant' | 'shop';
    google_maps_link?: string;
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
      google_maps_link: data.google_maps_link || '',
      description: data.description || 'Quality food prepared with fresh ingredients',
      is_active: true,
      is_paused: false,
      rating: 5.0,
      estimated_prep_time_minutes: 20,
      is_password_set: false,
      vendor_type: data.vendor_type || 'restaurant',
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
          google_maps_link: newVendor.google_maps_link,
          description: newVendor.description,
          is_active: newVendor.is_active,
          is_paused: newVendor.is_paused,
          rating: newVendor.rating,
          estimated_prep_time_minutes: newVendor.estimated_prep_time_minutes,
          is_password_set: newVendor.is_password_set,
          password: null,
          vendor_type: newVendor.vendor_type,
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

        // Create a dedicated folder for this vendor in the 'images' bucket using vendor name
        try {
          const folderName = newVendor.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          await supabase.storage.from('images').upload(`${folderName}/.keep`, new Blob(['folder created'], { type: 'text/plain' }), { upsert: true });
        } catch (storageErr) {
          console.warn('Storage bucket folder creation note:', storageErr);
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

  const deleteVendor = async (id: string) => {
    const vendorToDelete = vendors.find(v => v.id === id);
    if (isSupabaseConfigured && supabase && vendorToDelete) {
      try {
        const folderName = vendorToDelete.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const { data: fileList } = await supabase.storage.from('images').list(folderName);
        if (fileList && fileList.length > 0) {
          const paths = fileList.map(f => `${folderName}/${f.name}`);
          await supabase.storage.from('images').remove(paths);
        }
      } catch (err) {
        console.warn('Vendor folder storage delete error:', err);
      }
      supabase.from('vendors').delete().eq('id', id).then();
    }
    setVendors(prev => prev.filter(v => v.id !== id));
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

    // Save to backend server API
    try {
      await fetch('/api/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRider)
      });
      savedToDatabase = true;
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const fullPayload = {
          id: newRider.id,
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
          const fallbackPayload: Record<string, any> = {
            id: newRider.id,
            name: newRider.name,
            phone: newRider.phone,
          };
          const retryRes = await supabase.from('riders').insert([fallbackPayload]);
          if (!retryRes.error) {
            savedToDatabase = true;
            dbMessage = 'Saved to Supabase riders table.';
          } else {
            dbMessage = `Database Error: ${retryRes.error.message || error.message}`;
          }
        } else {
          savedToDatabase = true;
          dbMessage = 'Saved to Supabase riders table successfully.';
        }
      } catch (err: any) {
        dbMessage = `Database Exception: ${err?.message || String(err)}`;
      }
    } else {
      dbMessage = 'Saved to server database and local session.';
    }

    setRiders(prev => [newRider, ...prev.filter(r => r.phone !== newRider.phone)]);
    return { rider: newRider, savedToDatabase, dbMessage };
  };

  const completeRiderRegistration = async (data: {
    phone: string;
    name?: string;
    password: string;
    zone?: string;
    vehicle_type?: 'Motorcycle' | 'Bicycle' | 'Scooter';
  }): Promise<{ success: boolean; message: string; rider?: Rider }> => {
    const cleanPhone = (data.phone || '').trim();
    const cleanName = (data.name || '').trim();
    const password = (data.password || '').trim();

    if (!cleanPhone || !password) {
      return { success: false, message: 'ফোন নম্বর এবং পাসওয়ার্ড দিন।' };
    }

    // 1. Search in memory riders
    let existingRider = riders.find(r => {
      if (!r || !r.phone) return false;
      const rDigits = String(r.phone).replace(/\D/g, '');
      const cleanDigits = String(cleanPhone).replace(/\D/g, '');
      return (rDigits && cleanDigits && rDigits.endsWith(cleanDigits)) || r.phone === cleanPhone;
    });

    // 2. Search in backend server database if not in memory
    if (!existingRider) {
      try {
        const res = await fetch('/api/riders');
        if (res.ok) {
          const allRiders: Rider[] = await res.json();
          existingRider = allRiders.find(r => {
            const rDigits = String(r.phone).replace(/\D/g, '');
            const cleanDigits = String(cleanPhone).replace(/\D/g, '');
            return (rDigits && cleanDigits && rDigits.endsWith(cleanDigits)) || r.phone === cleanPhone;
          });
        }
      } catch {}
    }

    // 3. Search in Supabase if not found
    if (!existingRider && isSupabaseConfigured && supabase) {
      try {
        const { data: sData } = await supabase.from('riders').select('*').eq('phone', cleanPhone).maybeSingle();
        if (sData) existingRider = sData as Rider;
      } catch {}
    }

    // STRICT ADMIN-ONLY POLICY: If phone is NOT pre-added by Admin, reject registration!
    if (!existingRider) {
      return {
        success: false,
        message: '❌ এই ফোন নম্বরটি এডমিন প্যানেল থেকে আগে যোগ করা হয়নি। শুধুমাত্র এডমিনের অ্যাড করা নম্বরে রেজিস্ট্রেশন করা সম্ভব। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।'
      };
    }

    // If rider has already set a password:
    if (existingRider.is_password_set && existingRider.password) {
      return {
        success: false,
        message: '⚠️ আপনার অ্যাকাউন্ট ইতিমধ্যে সক্রিয় করা হয়েছে। অনুগ্রহ করে লগইন ট্যাবে গিয়ে পাসওয়ার্ড দিয়ে লগইন করুন।'
      };
    }

    // Update empty columns with details provided by rider
    const resolvedName = cleanName || existingRider.name || `Rider ${cleanPhone.slice(-4)}`;
    const targetRider: Rider = {
      ...existingRider,
      name: resolvedName,
      password: password,
      is_password_set: true,
      vehicle_type: data.vehicle_type || existingRider.vehicle_type || 'Motorcycle',
      zone: data.zone || existingRider.zone || 'Chawkbazar Zone',
      is_online: false,
      is_approved: true,
    };

    // Save to backend server API
    try {
      await fetch(`/api/riders/${encodeURIComponent(existingRider.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetRider)
      });
    } catch {}

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('riders').update({
          name: targetRider.name,
          password: targetRider.password,
          is_password_set: true,
          vehicle_type: targetRider.vehicle_type,
          zone: targetRider.zone
        }).eq('id', existingRider.id);

        if (error) {
          console.warn('Supabase rider update warning:', error);
        }
      } catch (err) {
        console.warn('Supabase rider update exception:', err);
      }
    }

    setRiders(prev => prev.map(r => r.id === existingRider!.id ? targetRider : r));

    const riderAccount: UserAccount = {
      id: `u-r-${targetRider.id}`,
      role: 'rider',
      name: targetRider.name,
      phone: targetRider.phone,
      is_password_set: true,
      reference_id: targetRider.id,
      zone: targetRider.zone,
      photo_url: targetRider.photo_url
    };

    setCurrentUser(riderAccount);
    setCurrentRider(targetRider);

    return { 
      success: true, 
      message: '✅ রেজিস্ট্রেশন ও অ্যাকাউন্ট অ্যাক্টিভেশন সফল হয়েছে! রাইডার অ্যাপে স্বাগতম।', 
      rider: targetRider 
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

  const toggleRiderPause = async (id: string) => {
    const pausedIds = getStoredPausedRiderIds();
    const currentTarget = riders.find(r => r.id === id);
    const nextPaused = currentTarget ? !currentTarget.is_paused : !pausedIds.has(id);

    if (nextPaused) {
      pausedIds.add(id);
    } else {
      pausedIds.delete(id);
    }
    saveStoredPausedRiderIds(pausedIds);

    // 1. Instant local UI update
    setRiders(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        return { 
          ...r, 
          is_paused: nextPaused,
          is_online: nextPaused ? false : r.is_online
        };
      });

      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}riders`, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });

    setCurrentRider(prev => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          is_paused: nextPaused,
          is_online: nextPaused ? false : prev.is_online
        };
      }
      return prev;
    });

    // 2. Broadcast across open browser tabs
    foodiplaceRealtimeChannel?.postMessage({
      type: 'RIDER_UPDATE',
      riderId: id,
      updates: { 
        is_paused: nextPaused,
        is_online: nextPaused ? false : (currentTarget?.is_online ?? false)
      }
    });

    // 3. Fire local storage event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: PAUSED_RIDERS_STORAGE_KEY,
        newValue: JSON.stringify(Array.from(pausedIds))
      }));
    }

    // 4. Save to backend database server for cross-browser synchronization
    try {
      await fetch(`/api/riders/${encodeURIComponent(id)}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paused: nextPaused })
      });
    } catch (err) {
      console.warn('Backend API pause sync error:', err);
    }

    // 5. Sync to Supabase Postgres database column is_paused
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('riders')
          .update({ 
            is_paused: nextPaused,
            is_online: nextPaused ? false : Boolean(currentTarget?.is_online)
          })
          .eq('id', id);
        if (error) {
          console.warn('Supabase is_paused update status:', error.message);
        }
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    // 6. If rider is paused by admin, immediately withdraw any pending order dispatched to them
    if (nextPaused) {
      setOrders(prevOrders => {
        let changed = false;
        const updatedOrders = prevOrders.map(ord => {
          if (ord.dispatched_rider_id === id && !ord.rider_id && !['delivered', 'cancelled'].includes(ord.status)) {
            changed = true;
            return {
              ...ord,
              dispatched_rider_id: undefined,
              dispatch_sent_at: undefined
            };
          }
          return ord;
        });

        if (changed) {
          foodiplaceRealtimeChannel?.postMessage({
            type: 'ORDERS_SYNC',
            orders: updatedOrders
          });
        }
        return updatedOrders;
      });
    }
  };

  const deleteRider = (id: string) => {
    setRiders(prev => prev.filter(r => r.id !== id));
    foodiplaceRealtimeChannel?.postMessage({
      type: 'RIDER_DELETE',
      riderId: id
    });
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
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { 
      ...item, 
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}` 
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('menu_items').insert([{
          id: newItem.id,
          vendor_id: newItem.vendor_id,
          name: newItem.name,
          description: newItem.description || null,
          price: newItem.price,
          image_url: newItem.image_url || null,
          category: newItem.category || 'Main Course',
          is_available: newItem.is_available ?? true
        }]);
        if (error) {
          console.error('Supabase error inserting menu item:', error);
        }
      } catch (err) {
        console.error('Failed to insert menu item in database:', err);
      }
    }

    setMenuItems(prev => [newItem, ...prev]);
  };

  const toggleMenuItemAvailability = async (id: string) => {
    const target = menuItems.find(m => m.id === id);
    if (!target) return;
    const nextAvail = !target.is_available;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menu_items').update({ is_available: nextAvail }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggle menu availability error:', err);
      }
    }

    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, is_available: nextAvail } : m));
  };

  const deleteMenuItem = async (id: string) => {
    const itemToDelete = menuItems.find(m => m.id === id);
    if (itemToDelete && itemToDelete.image_url && isSupabaseConfigured && supabase) {
      try {
        const url = itemToDelete.image_url;
        if (url.includes('/storage/v1/object/public/images/')) {
          const relativePath = url.split('/storage/v1/object/public/images/')[1];
          if (relativePath) {
            await supabase.storage.from('images').remove([decodeURIComponent(relativePath)]);
          }
        }
      } catch (err) {
        console.warn('Menu image storage delete error:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menu_items').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete menu item error:', err);
      }
    }

    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  // -------------------------------------------------------------
  // FOOD CATEGORIES (Admin Configurable)
  // -------------------------------------------------------------
  const addFoodCategory = async (category: Omit<FoodCategory, 'id'>) => {
    const newCat: FoodCategory = {
      ...category,
      id: crypto.randomUUID()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('food_categories')
          .insert([
            {
              id: newCat.id,
              name: newCat.name,
              icon: newCat.icon || '🍽️',
              image_url: newCat.image_url || null,
              is_active: newCat.is_active,
              order_index: newCat.order_index || 0,
              category_type: newCat.category_type || 'food'
            }
          ]);
        if (error) {
          console.error('Supabase error inserting category:', error);
          alert('Database Error: ' + error.message);
          return;
        }
      } catch (err) {
        console.error('Failed to insert category in database:', err);
      }
    }

    setFoodCategories(prev => [...prev, newCat]);
  };

  const updateFoodCategory = async (id: string, updates: Partial<FoodCategory>) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('food_categories')
          .update({
            name: updates.name,
            icon: updates.icon,
            image_url: updates.image_url,
            is_active: updates.is_active,
            order_index: updates.order_index,
            category_type: updates.category_type
          })
          .eq('id', id);
        if (error) {
          console.error('Supabase error updating category:', error);
        }
      } catch (err) {
        console.error('Failed to update category in database:', err);
      }
    }
    setFoodCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteFoodCategory = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('food_categories')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('Supabase error deleting category:', error);
        }
      } catch (err) {
        console.error('Failed to delete category from database:', err);
      }
    }
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
              portal_type: newAd.portal_type || 'food',
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
            order_index: updates.order_index,
            portal_type: updates.portal_type
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
  const updateRiderLocation = async (riderId: string, lat: number, lng: number) => {
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return;

    const nowIso = new Date().toISOString();

    setRiders(prev => prev.map(r => 
      r.id === riderId ? { 
        ...r, 
        current_latitude: safeLat, 
        current_longitude: safeLng, 
        last_location_updated_at: nowIso 
      } : r
    ));

    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? { 
        ...prev, 
        current_latitude: safeLat, 
        current_longitude: safeLng, 
        last_location_updated_at: nowIso 
      } : null);
    }

    // Broadcast update across open browser tabs immediately
    foodiplaceRealtimeChannel?.postMessage({
      type: 'RIDER_UPDATE',
      riderId,
      updates: {
        current_latitude: safeLat,
        current_longitude: safeLng,
        last_location_updated_at: nowIso
      }
    });

    // Save live location to backend API
    try {
      fetch(`/api/riders/${encodeURIComponent(riderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_latitude: safeLat,
          current_longitude: safeLng,
          last_location_updated_at: nowIso
        })
      }).catch(() => {});
    } catch {}

    // Save live location to Supabase database
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('riders')
          .update({
            current_latitude: safeLat,
            current_longitude: safeLng,
            last_location_updated_at: nowIso
          })
          .eq('id', riderId);
      } catch (err) {
        console.warn('Error syncing rider GPS location to Supabase:', err);
      }
    }
  };

  const simulateRiderMovement = (stepLat: number, stepLng: number) => {
    if (!currentRider) return;
    const curLat = Number(currentRider.current_latitude) || 22.3590;
    const curLng = Number(currentRider.current_longitude) || 91.8380;
    updateRiderLocation(
      currentRider.id,
      curLat + stepLat,
      curLng + stepLng
    );
  };

  const toggleRiderOnline = async (riderId: string, isOnline: boolean): Promise<boolean> => {
    // If rider is paused by admin, they cannot go online
    const target = riders.find(r => r.id === riderId);
    if (target?.is_paused && isOnline) {
      return false;
    }

    let newLat: number | undefined;
    let newLng: number | undefined;

    if (isOnline && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true
          });
        });
        if (Number.isFinite(pos.coords.latitude) && Number.isFinite(pos.coords.longitude)) {
          newLat = pos.coords.latitude;
          newLng = pos.coords.longitude;
        }
      } catch {
        // Fallback to existing or default coordinates
      }
    }

    const nowIso = new Date().toISOString();

    setRiders(prev => prev.map(r => {
      if (r.id !== riderId) return r;
      return {
        ...r,
        is_online: isOnline,
        ...(newLat !== undefined && newLng !== undefined ? {
          current_latitude: newLat,
          current_longitude: newLng,
          last_location_updated_at: nowIso
        } : {
          last_location_updated_at: nowIso
        })
      };
    }));

    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => {
        if (!prev) return null;
        return {
          ...prev,
          is_online: isOnline,
          ...(newLat !== undefined && newLng !== undefined ? {
            current_latitude: newLat,
            current_longitude: newLng,
            last_location_updated_at: nowIso
          } : {
            last_location_updated_at: nowIso
          })
        };
      });
    }

    // Broadcast rider online status across tabs immediately
    foodiplaceRealtimeChannel?.postMessage({
      type: 'RIDER_UPDATE',
      riderId,
      updates: {
        is_online: isOnline,
        ...(newLat !== undefined && newLng !== undefined ? {
          current_latitude: newLat,
          current_longitude: newLng,
          last_location_updated_at: nowIso
        } : {
          last_location_updated_at: nowIso
        })
      }
    });

    // Save online status & location to backend server API
    try {
      fetch(`/api/riders/${encodeURIComponent(riderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_online: isOnline,
          last_location_updated_at: nowIso,
          ...(newLat !== undefined && newLng !== undefined ? {
            current_latitude: newLat,
            current_longitude: newLng
          } : {})
        })
      }).catch(() => {});
    } catch {}

    // Save online status & location to Supabase database
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {
          is_online: isOnline,
          last_location_updated_at: nowIso
        };
        if (newLat !== undefined && newLng !== undefined) {
          updatePayload.current_latitude = newLat;
          updatePayload.current_longitude = newLng;
        }

        const { error } = await supabase
          .from('riders')
          .update(updatePayload)
          .eq('id', riderId);

        if (error) {
          console.warn('Supabase rider online update error:', error);
        }
      } catch (err) {
        console.warn('Supabase rider online update exception:', err);
      }
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
      const newItems = [{ menuItem: item, quantity: 1 }];
      setCart(newItems);
      setCartVendor(vendor);
      persistCustomerCart(newItems, vendor);
      return;
    }

    setCartVendor(vendor);
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(ci => 
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        updated = [...prev, { menuItem: item, quantity: 1 }];
      }
      persistCustomerCart(updated, vendor);
      return updated;
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const filtered = prev.filter(ci => ci.menuItem.id !== menuItemId);
      const nextVendor = filtered.length === 0 ? null : cartVendor;
      if (filtered.length === 0) setCartVendor(null);
      persistCustomerCart(filtered, nextVendor);
      return filtered;
    });
  };

  const updateCartQuantity = (menuItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev => {
      const updated = prev.map(ci => ci.menuItem.id === menuItemId ? { ...ci, quantity: qty } : ci);
      persistCustomerCart(updated, cartVendor);
      return updated;
    });
  };

  const clearCart = () => {
    const custKey = getCustomerCartKey(currentUser);
    setCart([]);
    setCartVendor(null);
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_${custKey}`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}cart_vendor_${custKey}`);
    } catch {}
    fetch(`/api/cart/${encodeURIComponent(custKey)}`, { method: 'DELETE' }).catch(() => {});
  };

  const placeOrder = async (instructions?: string): Promise<Order | null> => {
    if (!currentUser || currentUser.role !== 'customer') {
      alert('Please log in first from your Account profile page with your Name, Phone, and Password before placing an order.');
      return null;
    }
    if (cart.length === 0) {
      alert('Your shopping cart is empty. Please add some food items first!');
      return null;
    }
    if (!cartVendor) {
      alert('No restaurant is selected for this cart. Please select items from a restaurant.');
      return null;
    }
    if (!selectedAddress) {
      alert('Please add or select a delivery address before placing your order.');
      return null;
    }

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

    // Use a clean valid UUID for orderId so it never fails Supabase UUID constraints
    const orderId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
      
    const orderCode = `FV-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      order_code: orderCode,
      customer_id: currentCustomer?.id || currentUser?.id || 'guest',
      customer_name: currentUser?.name || 'Customer',
      customer_phone: currentUser?.phone || '01800000000',
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
      items: cart.map((ci, index) => {
        // Use a clean valid UUID for each order item id to satisfy database constraints
        const itemId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `00000000-0000-4000-9000-${(Date.now() + index).toString(16).padStart(12, '0')}`;
          
        return {
          id: itemId,
          order_id: orderId,
          menu_item_id: ci.menuItem.id,
          item_name: ci.menuItem.name,
          item_price: ci.menuItem.price,
          quantity: ci.quantity,
          subtotal: ci.menuItem.price * ci.quantity
        };
      }),
      vendor: cartVendor
    };

    setOrders(prev => [newOrder, ...prev]);

    // Save to Database server
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    } catch (err) {
      console.warn('Failed to persist order to local server API:', err);
    }

    // Save to Supabase if configured with strict UUID format validations
    if (isSupabaseConfigured && supabase) {
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = (str: string) => uuidRegex.test(str);

        // Sanitize customer_id to ensure it's a valid UUID, otherwise set to null
        let cleanCustId = newOrder.customer_id;
        if (cleanCustId?.startsWith('u-c-')) {
          cleanCustId = cleanCustId.slice(4);
        }
        const sCustomerId = cleanCustId && isUuid(cleanCustId) ? cleanCustId : null;

        // Sanitize vendor_id to ensure it's a valid UUID
        const sVendorId = newOrder.vendor_id && isUuid(newOrder.vendor_id) ? newOrder.vendor_id : null;

        if (sVendorId) {
          const supabaseOrderPayload = {
            id: newOrder.id,
            order_code: newOrder.order_code,
            customer_id: sCustomerId,
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone,
            vendor_id: sVendorId,
            zone: newOrder.zone,
            delivery_address: newOrder.delivery_address,
            delivery_latitude: newOrder.delivery_latitude,
            delivery_longitude: newOrder.delivery_longitude,
            food_total: newOrder.food_total,
            delivery_distance_km: newOrder.delivery_distance_km,
            delivery_fee: newOrder.delivery_fee,
            total_cash_payable: newOrder.total_cash_payable,
            status: newOrder.status,
            special_instructions: newOrder.special_instructions,
            created_at: newOrder.created_at,
            updated_at: newOrder.updated_at
          };

          const { error: oError } = await supabase.from('orders').upsert([supabaseOrderPayload]);
          if (!oError) {
            const itemsPayload = (newOrder.items || []).map(it => ({
              id: it.id,
              order_id: newOrder.id,
              menu_item_id: it.menu_item_id && isUuid(it.menu_item_id) ? it.menu_item_id : null, // Set null if menu_item_id is not a valid UUID (e.g. 'm-001')
              item_name: it.item_name,
              item_price: it.item_price,
              quantity: it.quantity,
              subtotal: it.subtotal
            }));
            await supabase.from('order_items').upsert(itemsPayload);
          } else {
            console.error('Supabase order save error:', oError);
          }
        }
      } catch (err) {
        console.warn('Failed to persist order to Supabase:', err);
      }
    }

    // "order place hoye cart Ei thakbe" -> clearCart() is commented out/removed!
    // clearCart();
    playNotificationSound();
    return newOrder;
  };

  // -------------------------------------------------------------
  // STEP 2 & 3: VENDOR PREP TIME & CUSTOMER PERMISSION WINDOW
  // -------------------------------------------------------------
  const vendorAcceptOrderWithPrepTime = (orderId: string, prepMinutes: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextOrder = {
          ...o,
          status: 'vendor_accepted' as OrderStatus,
          vendor_prep_minutes: prepMinutes,
          customer_confirmed_prep: false,
          updated_at: new Date().toISOString()
        };

        // Post to backend API
        fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOrder)
        }).catch(() => {});

        // Save to Supabase
        if (isSupabaseConfigured && supabase) {
          supabase
            .from('orders')
            .update({
              status: 'vendor_accepted',
              vendor_prep_minutes: prepMinutes,
              customer_confirmed_prep: false,
              updated_at: nextOrder.updated_at
            })
            .eq('id', orderId)
            .then();
        }

        return nextOrder;
      }
      return o;
    }));
    playNotificationSound();
  };

  const customerRespondToPrepTime = (orderId: string, accept: boolean) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextOrder: Order;
        if (accept) {
          const prepMinutes = o.vendor_prep_minutes || 15;
          const prepEndsAt = new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();
          nextOrder = {
            ...o,
            status: 'food_preparing' as OrderStatus,
            customer_confirmed_prep: true,
            prep_ends_at: prepEndsAt,
            updated_at: new Date().toISOString()
          };
        } else {
          nextOrder = {
            ...o,
            status: 'cancelled' as OrderStatus,
            customer_confirmed_prep: false,
            cancellation_reason: 'Customer declined preparation wait time',
            updated_at: new Date().toISOString()
          };
        }

        // Post to backend API
        fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOrder)
        }).catch(() => {});

        // Save to Supabase
        if (isSupabaseConfigured && supabase) {
          supabase
            .from('orders')
            .update({
              status: nextOrder.status,
              customer_confirmed_prep: nextOrder.customer_confirmed_prep,
              prep_ends_at: nextOrder.prep_ends_at || null,
              cancellation_reason: nextOrder.cancellation_reason || null,
              updated_at: nextOrder.updated_at
            })
            .eq('id', orderId)
            .then();
        }

        return nextOrder;
      }
      return o;
    }));
    playNotificationSound();
  };

  const vendorMarkFoodReady = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextOrder = {
          ...o,
          status: 'ready_for_pickup' as OrderStatus,
          updated_at: new Date().toISOString()
        };

        // Post to backend API
        fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOrder)
        }).catch(() => {});

        // Save to Supabase
        if (isSupabaseConfigured && supabase) {
          supabase
            .from('orders')
            .update({
              status: 'ready_for_pickup',
              updated_at: nextOrder.updated_at
            })
            .eq('id', orderId)
            .then();
        }

        return nextOrder;
      }
      return o;
    }));
    playNotificationSound();
    // Immediately attempt rider dispatch
    triggerRiderDispatch(orderId);
  };

  // -------------------------------------------------------------
  // STEP 4: INTELLIGENT SINGLE-RIDER PROXIMITY & ZONE DISPATCH ENGINE
  // Strict User Rule:
  // "j zone er order she zone er riders der kace jabe onno zone er riders der kace jabe na"
  // -------------------------------------------------------------
  const triggerRiderDispatch = (orderId: string): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const vendor = vendors.find(v => v.id === order.vendor_id);
    if (!vendor) return false;

    // Strict Target Zone: Order zone or Vendor zone
    const targetZone = (order.zone || vendor.zone || '').trim().toLowerCase();
    const rejectedRiderIds = order.rejected_rider_ids || [];

    // STRICT ZONE MATCHING:
    // Only riders that belong to the EXACT same zone as the order/vendor!
    // Riders from other zones are NEVER dispatched this order.
    const zoneRiders = riders.filter(r => {
      if (!r.is_online || r.is_paused) return false;
      if (r.is_approved === false) return false;
      if (rejectedRiderIds.includes(r.id)) return false;

      const riderZone = (r.zone || '').trim().toLowerCase();
      // If target zone is set, only match riders in this exact zone!
      if (targetZone && riderZone !== targetZone) {
        return false;
      }
      return true;
    });

    if (zoneRiders.length === 0) {
      console.log(`[Dispatch Engine] No online riders available in zone "${order.zone || vendor.zone || 'Default'}". Waiting for zone riders.`);
      return false;
    }

    // Proximity distance check within zone
    const ridersWithDistance = zoneRiders.map(r => {
      const dist = calculateDistanceKm(
        vendor.latitude,
        vendor.longitude,
        r.current_latitude,
        r.current_longitude
      );
      return { rider: r, dist };
    });

    // Match closest within radius, or closest in zone
    const matchRadius = settings.rider_match_radius_km || 2.5;
    const withinRadius = ridersWithDistance.filter(item => item.dist <= matchRadius);

    const candidate = withinRadius.length > 0
      ? withinRadius.sort((a, b) => a.dist - b.dist)[0].rider
      : ridersWithDistance.sort((a, b) => a.dist - b.dist)[0].rider;

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      zone: order.zone || vendor.zone,
      dispatched_rider_id: candidate.id,
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
    let updatedOrder: Order | null = null;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status,
          updated_at: new Date().toISOString(),
          ...extra
        };
        return updatedOrder;
      }
      return o;
    }));

    if (updatedOrder) {
      const orderToSave = updatedOrder as Order;
      // Post to backend API
      fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToSave)
      }).catch((err) => console.warn('Failed to update order status on server:', err));

      // Save to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('orders')
          .update({
            status: orderToSave.status,
            updated_at: orderToSave.updated_at,
            ...extra
          })
          .eq('id', orderId)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to sync order status to Supabase:', error);
            }
          });
      }
    }

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
        zones,
        addZone,
        updateZone,
        deleteZone,
        toggleZoneActive,
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
        isSupabaseConfigured: supabaseConfig.isConfigured,
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
