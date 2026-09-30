import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  PortalRole, 
  SystemSettings, 
  Vendor, 
  MenuItem, 
  CustomerAddress, 
  Rider, 
  Order, 
  OrderStatus 
} from '../types/database';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_VENDORS, 
  INITIAL_MENU_ITEMS, 
  INITIAL_ADDRESSES, 
  INITIAL_RIDERS, 
  INITIAL_ORDERS,
  supabase,
  isSupabaseConfigured
} from '../services/supabase';
import { calculateDistanceKm, calculateDeliveryFee } from '../utils/geo';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface DeliveryContextType {
  role: PortalRole;
  setRole: (role: PortalRole) => void;
  
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  currentVendor: Vendor | null;
  setCurrentVendor: (vendor: Vendor) => void;
  
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  toggleMenuItemAvailability: (id: string) => void;
  deleteMenuItem: (id: string) => void;
  
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (addr: CustomerAddress) => void;
  addAddress: (addr: Omit<CustomerAddress, 'id'>) => void;
  updateAddress: (id: string, updates: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  
  riders: Rider[];
  currentRider: Rider | null;
  setCurrentRider: (rider: Rider) => void;
  toggleRiderOnline: (riderId: string, isOnline: boolean) => Promise<boolean>;
  updateRiderLocation: (riderId: string, lat: number, lng: number) => void;
  simulateRiderMovement: (stepLat: number, stepLng: number) => void;
  
  orders: Order[];
  cart: CartItem[];
  cartVendor: Vendor | null;
  addToCart: (item: MenuItem, vendor: Vendor) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: (instructions?: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => void;
  
  // Specific Cash on Delivery Actions
  riderAcceptOrder: (orderId: string, riderId: string) => void;
  riderConfirmCashPaidToVendor: (orderId: string) => void;
  riderConfirmCashCollectedFromCustomer: (orderId: string) => void;
  
  // Helper to filter nearby orders for rider
  getEligibleOrdersForRider: (rider: Rider) => { order: Order; distanceToRestaurantKm: number; isWithinRadius: boolean }[];
  
  // Audio notification feedback
  playNotificationSound: () => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'foodvibe_cod_';

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or fallback
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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}addresses`, JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}riders`, JSON.stringify(riders));
  }, [riders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  // Keep window hash synced
  useEffect(() => {
    window.location.hash = role;
  }, [role]);

  // Audio tone generator for real-time notifications
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // -------------------------------------------------------------
  // 5-SECOND RIDER LIVE LOCATION TRACKING
  // -------------------------------------------------------------
  const riderWatchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentRider || !currentRider.is_online) {
      if (riderWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch?.(riderWatchIdRef.current);
        riderWatchIdRef.current = null;
      }
      return;
    }

    // 5-second interval location updater
    const intervalId = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            updateRiderLocation(currentRider.id, latitude, longitude);
          },
          () => {
            // Geolocation permission might be denied or simulated in dev;
            // subtly drift coordinates for realistic testing if simulated
            const driftLat = (Math.random() - 0.5) * 0.00015;
            const driftLng = (Math.random() - 0.5) * 0.00015;
            updateRiderLocation(
              currentRider.id,
              currentRider.current_latitude + driftLat,
              currentRider.current_longitude + driftLng
            );
          },
          { enableHighAccuracy: true, timeout: 4000 }
        );
      } else {
        // Fallback
        const driftLat = (Math.random() - 0.5) * 0.00015;
        const driftLng = (Math.random() - 0.5) * 0.00015;
        updateRiderLocation(
          currentRider.id,
          currentRider.current_latitude + driftLat,
          currentRider.current_longitude + driftLng
        );
      }
    }, 5000); // exactly 5 seconds

    return () => clearInterval(intervalId);
  }, [currentRider?.id, currentRider?.is_online, currentRider?.current_latitude, currentRider?.current_longitude]);

  const updateRiderLocation = (riderId: string, lat: number, lng: number) => {
    const nowIso = new Date().toISOString();
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        return {
          ...r,
          current_latitude: lat,
          current_longitude: lng,
          last_location_updated_at: nowIso,
        };
      }
      return r;
    }));

    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? {
        ...prev,
        current_latitude: lat,
        current_longitude: lng,
        last_location_updated_at: nowIso,
      } : null);
    }
  };

  const simulateRiderMovement = (targetLat: number, targetLng: number) => {
    if (!currentRider) return;
    updateRiderLocation(currentRider.id, targetLat, targetLng);
  };

  const toggleRiderOnline = async (riderId: string, isOnline: boolean): Promise<boolean> => {
    if (isOnline && navigator.geolocation) {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            enableHighAccuracy: true
          });
        }).then((pos) => {
          updateRiderLocation(riderId, pos.coords.latitude, pos.coords.longitude);
        }).catch(() => {
          // Continue online even if browser refuses hardware GPS
        });
      } catch {
        // continue
      }
    }

    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, is_online: isOnline } : r));
    if (currentRider && currentRider.id === riderId) {
      setCurrentRider(prev => prev ? { ...prev, is_online: isOnline } : null);
    }
    return true;
  };

  // -------------------------------------------------------------
  // PROXIMITY DISPATCH CALCULATION (Admin radius check)
  // -------------------------------------------------------------
  const getEligibleOrdersForRider = (rider: Rider) => {
    return orders
      .filter(o => 
        // Order is ready for pickup or actively assigned to this rider
        o.rider_id === rider.id ||
        (!o.rider_id && ['ready_for_pickup', 'food_preparing', 'vendor_accepted'].includes(o.status))
      )
      .map(o => {
        const vendor = vendors.find(v => v.id === o.vendor_id);
        const vendorLat = vendor ? vendor.latitude : 23.7937;
        const vendorLng = vendor ? vendor.longitude : 90.4049;
        const distanceToRestaurantKm = calculateDistanceKm(
          vendorLat,
          vendorLng,
          rider.current_latitude,
          rider.current_longitude
        );

        const isWithinRadius = distanceToRestaurantKm <= settings.rider_match_radius_km;
        return {
          order: {
            ...o,
            vendor: vendor || undefined
          },
          distanceToRestaurantKm,
          isWithinRadius
        };
      });
  };

  // -------------------------------------------------------------
  // CART & ORDER LIFECYCLE
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
      customer_name: selectedAddress.customer_name,
      customer_phone: selectedAddress.customer_phone,
      vendor_id: cartVendor.id,
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

  const riderAcceptOrder = (orderId: string, riderId: string) => {
    updateOrderStatus(orderId, 'rider_assigned', { rider_id: riderId });
  };

  // Stage 1 of COD: Rider reaches restaurant, buys food with cash
  const riderConfirmCashPaidToVendor = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Decrease rider's cash in hand by food_total (since rider paid vendor)
        if (o.rider_id) {
          setRiders(rList => rList.map(r => 
            r.id === o.rider_id ? { ...r, cash_in_hand: r.cash_in_hand - o.food_total } : r
          ));
        }
        return {
          ...o,
          status: 'rider_on_way_to_customer',
          food_cash_paid_to_vendor: true,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
  };

  // Stage 2 of COD: Rider reaches customer, collects total cash (food bill + delivery fee)
  const riderConfirmCashCollectedFromCustomer = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Increase rider's cash in hand by total_cash_payable (reimburses food bill + gives delivery fee)
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
  };

  // -------------------------------------------------------------
  // SETTINGS & ENTITY MANAGEMENT
  // -------------------------------------------------------------
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      updated_at: new Date().toISOString()
    }));
  };

  const addVendor = (newVendor: Omit<Vendor, 'id'>) => {
    const id = `v-${Date.now()}`;
    const vendor: Vendor = {
      ...newVendor,
      id,
      rating: 4.8,
      created_at: new Date().toISOString()
    };
    setVendors(prev => [vendor, ...prev]);
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    if (currentVendor && currentVendor.id === id) {
      setCurrentVendor(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const id = `m-${Date.now()}`;
    const newItem: MenuItem = { ...item, id };
    setMenuItems(prev => [...prev, newItem]);
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, is_available: !m.is_available } : m));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  const addAddress = (addr: Omit<CustomerAddress, 'id'>) => {
    const id = `addr-${Date.now()}`;
    const newAddr: CustomerAddress = { ...addr, id };
    if (newAddr.is_default || addresses.length === 0) {
      setAddresses(prev => prev.map(a => ({ ...a, is_default: false })).concat({ ...newAddr, is_default: true }));
      setSelectedAddress({ ...newAddr, is_default: true });
    } else {
      setAddresses(prev => [...prev, newAddr]);
    }
  };

  const updateAddress = (id: string, updates: Partial<CustomerAddress>) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (selectedAddress?.id === id) {
      setSelectedAddress(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedAddress?.id === id) {
      setSelectedAddress(addresses.find(a => a.id !== id) || null);
    }
  };

  return (
    <DeliveryContext.Provider
      value={{
        role,
        setRole,
        settings,
        updateSettings,
        vendors,
        addVendor,
        updateVendor,
        currentVendor,
        setCurrentVendor,
        menuItems,
        addMenuItem,
        toggleMenuItemAvailability,
        deleteMenuItem,
        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        riders,
        currentRider,
        setCurrentRider,
        toggleRiderOnline,
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
        updateOrderStatus,
        riderAcceptOrder,
        riderConfirmCashPaidToVendor,
        riderConfirmCashCollectedFromCustomer,
        getEligibleOrdersForRider,
        playNotificationSound,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};
