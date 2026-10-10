import React, { useState, useEffect, useRef } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AuthModal } from '../common/AuthModal';
import { Order, OrderStatus, Vendor, MenuItem } from '../../types/database';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Check,
  Plus,
  Minus,
  X,
  AlertTriangle,
  Phone,
  Printer,
  ShoppingBag,
  Store,
  ChevronDown,
  RefreshCw,
  Search,
  Filter,
  Flame,
  ArrowRight,
  ArrowLeft,
  Receipt,
  User,
  MapPin,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  KeyRound,
  LogOut,
  Menu,
  Camera,
  Image,
  Upload,
  Trash2,
  Lock,
  Building2,
  Utensils,
  Globe,
  ChevronRight,
  Trophy,
  BarChart2,
  History,
  Star,
  FileSpreadsheet,
  Megaphone,
  Tag,
  Landmark,
  HelpCircle,
  MessageSquareQuote,
  Settings,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react';

export const VendorOrdersTerminal: React.FC = () => {
  const {
    vendors,
    currentVendor,
    setCurrentVendor,
    updateVendor,
    uploadVendorImage,
    deleteVendorImage,
    zones,
    orders,
    updateOrderStatus,
    vendorAcceptOrderWithPrepTime,
    vendorMarkFoodReady,
    riders,
    currentUser,
    loginUser,
    logoutUser,
    menuItems,
    updateMenuItem
  } = useDelivery();

  // 1. Auth Form States (Only Login)
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // 2. Terminal UI States (All hooks at top of component)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [storeStatus, setStoreStatus] = useState<'online' | 'busy' | 'offline'>('online');

  // Modal States
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Vendor closed');
  const [declineSubStep, setDeclineSubStep] = useState<'reasons' | 'unavailable_items' | 'save_order'>('reasons');
  const [declineConfirmModal, setDeclineConfirmModal] = useState<{ isOpen: boolean; reason: 'Vendor closed' | 'Too busy' } | null>(null);
  const [selectedUnavailableItems, setSelectedUnavailableItems] = useState<string[]>([]);
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);
  const [prepTimeSelection, setPrepTimeSelection] = useState<Record<string, number>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});

  // Accept Order Page State & Dummy Test Orders
  const [selectedAcceptOrder, setSelectedAcceptOrder] = useState<Order | null>(null);
  const [selectedReadyOrder, setSelectedReadyOrder] = useState<Order | null>(null);
  const [selectedPrepMinutes, setSelectedPrepMinutes] = useState<number>(9);
  const [dummyOrders, setDummyOrders] = useState<Order[]>([]);

  // Menu Category & Item Availability States (Matching Foodpanda Partner App)
  const [isMenuViewOpen, setIsMenuViewOpen] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [availabilityModalItem, setAvailabilityModalItem] = useState<MenuItem | null>(null);
  const [selectedAvailabilityOption, setSelectedAvailabilityOption] = useState<'available' | 'sold_out_today' | 'sold_out_indefinite'>('available');
  const [itemAvailabilityMap, setItemAvailabilityMap] = useState<Record<string, 'available' | 'sold_out_today' | 'sold_out_indefinite'>>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_item_availability');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Vendor Drawer & Profile Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [isOpeningTimesModalOpen, setIsOpeningTimesModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'English' | 'বাংলা'>('English');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isDeletingCover, setIsDeletingCover] = useState(false);
  const [profileLogoUrlInput, setProfileLogoUrlInput] = useState('');
  const [profileCoverUrlInput, setProfileCoverUrlInput] = useState('');
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openVendorProfileModal = () => {
    if (!activeVendor) return;
    setProfileLogoUrlInput(activeVendor.logo_url || '');
    setProfileCoverUrlInput(activeVendor.cover_image || '');
    setIsUrlInputMode(false);
    setUploadFeedback(null);
    setIsProfileModalOpen(true);
  };

  const handleApplyWebUrls = async () => {
    if (!activeVendor) return;
    setUploadFeedback(null);
    const updates: Partial<Vendor> = {};
    if (profileLogoUrlInput.trim() !== (activeVendor.logo_url || '')) {
      updates.logo_url = profileLogoUrlInput.trim();
    }
    if (profileCoverUrlInput.trim() !== (activeVendor.cover_image || '')) {
      updates.cover_image = profileCoverUrlInput.trim();
    }
    if (Object.keys(updates).length > 0) {
      await updateVendor(activeVendor.id, updates);
      setUploadFeedback({ type: 'success', message: '✅ ছবির লিংক ডাটাবেসে সফলভাবে আপডেট হয়েছে!' });
    } else {
      setUploadFeedback({ type: 'error', message: 'কোনো নতুন লিংক পরিবর্তন করা হয়নি।' });
    }
  };

  // Audio Ref tracking previous pending count
  const prevPendingCountRef = useRef<number>(0);

  // Active vendor: logged in vendor, currentVendor, or fallback to first vendor so terminal is always ready
  const authenticatedVendor = (currentUser && currentUser.role === 'vendor')
    ? (vendors.find(v => v.id === currentUser.reference_id || v.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) || currentVendor)
    : null;

  const activeVendor = authenticatedVendor || currentVendor || vendors[0];

  const isAuthenticated = Boolean(currentUser && currentUser.role === 'vendor' && authenticatedVendor);

  // Filter orders strictly for active restaurant (including dummy test orders)
  const allOrdersList = [...dummyOrders, ...orders];
  const vendorOrders = activeVendor ? allOrdersList.filter((o) => o.vendor_id === activeVendor.id) : [];

  const pendingOrders = vendorOrders.filter((o) => o.status === 'pending');
  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyOrders = vendorOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'food_picked_up');
  const completedOrders = vendorOrders.filter((o) => o.status === 'delivered');

  const handleAcceptOrder = (orderId: string, prepMinutes: number = 9) => {
    vendorAcceptOrderWithPrepTime(orderId, prepMinutes);
    setDummyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'food_preparing', vendor_prep_minutes: prepMinutes } : o));
    setSelectedAcceptOrder(null);
  };

  const handleDeclineOrder = (order: Order) => {
    setRejectModalOrder(order);
    setDeclineSubStep('reasons');
    setDeclineConfirmModal(null);
    setSelectedUnavailableItems([]);
    setSelectedAcceptOrder(null);
  };

  const toggleUnavailableItem = (itemName: string) => {
    setSelectedUnavailableItems(prev =>
      prev.includes(itemName) ? prev.filter(n => n !== itemName) : [...prev, itemName]
    );
  };

  const handleContinueUnavailableItems = () => {
    if (selectedUnavailableItems.length === 0) return;
    for (const itemName of selectedUnavailableItems) {
      const matched = effectiveMenuItems.find(m => m.name.toLowerCase() === itemName.toLowerCase());
      if (matched) {
        setItemAvailabilityMap(prev => {
          const next = { ...prev, [matched.id]: 'sold_out_today' as const };
          try {
            localStorage.setItem('foodiplace_vendor_item_availability', JSON.stringify(next));
          } catch {}
          return next;
        });
        updateMenuItem(matched.id, { is_available: false });
      }
    }
    setDeclineSubStep('save_order');
  };

  const handleSendTestOrder = () => {
    if (!activeVendor) return;
    const serialNum = dummyOrders.length + 1;
    const serialCode = String(serialNum).padStart(2, '0');
    const testOrderId = `test-${Date.now()}`;
    const newTestOrder: Order = {
      id: testOrderId,
      order_code: serialCode,
      customer_id: 'test-cust',
      customer_name: 'Test Customer',
      customer_phone: 'XXXX-1234',
      vendor_id: activeVendor.id,
      delivery_address: 'Central Zone, Test Address',
      delivery_latitude: activeVendor.latitude || 22.3569,
      delivery_longitude: activeVendor.longitude || 91.7832,
      food_total: 0,
      delivery_distance_km: 1.2,
      delivery_fee: 0,
      total_cash_payable: 0,
      food_cash_paid_to_vendor: false,
      food_and_delivery_cash_collected_from_customer: false,
      status: 'pending',
      vendor_prep_minutes: 9,
      special_instructions: '** the tomatoes should be fresh',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: `item-${Date.now()}`,
          order_id: testOrderId,
          item_name: 'Pizza Salami',
          item_price: 0,
          quantity: 1,
          subtotal: 0,
          selected_variations: ['0 x large'],
          special_instructions: '** the tomatoes should be fresh'
        }
      ]
    };

    setDummyOrders(prev => [newTestOrder, ...prev]);
    setIsDrawerOpen(false);
    playNewOrderSound();
  };

  // Auth Handler (Login Only)
  const handleVendorLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = loginUser('vendor', authPhone, authPassword);
    if (!res.success) {
      if (res.requiresPasswordSetup) {
        setAuthError('First-time login detected. Please set your password on the Vendor Portal first.');
      } else {
        setAuthError(res.message || 'Login failed. Please check phone and password.');
      }
    }
  };

  // Sound Synthesizer via Web Audio API
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.65);
      osc2.stop(ctx.currentTime + 0.65);
    } catch {
      // Audio context restricted
    }
  };

  // Sound trigger on new pending order
  useEffect(() => {
    if (pendingOrders.length > prevPendingCountRef.current) {
      playNewOrderSound();
    }
    prevPendingCountRef.current = pendingOrders.length;
  }, [pendingOrders.length]);

  // Auto-accept if enabled
  useEffect(() => {
    if (autoAccept && pendingOrders.length > 0) {
      pendingOrders.forEach((o) => {
        vendorAcceptOrderWithPrepTime(o.id, 15);
      });
    }
  }, [autoAccept, pendingOrders]);

  const handleMarkFoodReady = (orderId: string) => {
    vendorMarkFoodReady(orderId);
    setDummyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready_for_pickup' } : o));
    setSelectedReadyOrder(null);
  };

  const handleConfirmHandover = (orderId: string) => {
    updateOrderStatus(orderId, 'food_picked_up');
    setDummyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
  };

  const handleConfirmReject = (customReason?: string) => {
    if (!rejectModalOrder) return;
    const finalReason = customReason || rejectReason;
    updateOrderStatus(rejectModalOrder.id, 'cancelled', { cancellation_reason: finalReason });
    setDummyOrders(prev => prev.filter(o => o.id !== rejectModalOrder.id));
    setRejectModalOrder(null);
    setSelectedAcceptOrder(null);
  };

  // Toggle item in kitchen prep checklist
  const toggleItemCheck = (orderId: string, itemIndex: number) => {
    setCheckedItems(prev => {
      const orderChecks = { ...(prev[orderId] || {}) };
      orderChecks[itemIndex] = !orderChecks[itemIndex];
      return { ...prev, [orderId]: orderChecks };
    });
  };

  // Filtered list based on active tab and search
  const getFilteredOrders = () => {
    let list: Order[] = [];
    if (activeTab === 'pending') list = pendingOrders;
    else if (activeTab === 'preparing') list = preparingOrders;
    else if (activeTab === 'ready') list = readyOrders;
    else if (activeTab === 'completed') list = completedOrders;
    else list = vendorOrders;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.order_code.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      o.items?.some((it) => it.item_name.toLowerCase().includes(q))
    );
  };

  const displayedOrders = getFilteredOrders();

  // Total earnings today for this restaurant
  const todayEarnings = completedOrders.reduce((sum, o) => sum + o.food_total, 0);

  // Default menu items list to guarantee realistic food categories & items
  const defaultMenuItemsList: MenuItem[] = [
    // 1. Pizza
    {
      id: 'item-pizza-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Pizza Salami',
      description: 'Hand-tossed crust, spiced beef salami slices, marinara sauce & mozzarella cheese',
      price: 12.00,
      category: 'Pizza',
      image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-pizza-2',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Margherita Classic',
      description: 'San Marzano tomato sauce, fresh fragrant basil leaves & melted mozzarella',
      price: 10.50,
      category: 'Pizza',
      image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-pizza-3',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'BBQ Chicken Supreme',
      description: 'Smoked pulled chicken, tangy hickory BBQ sauce drizzle & red onions',
      price: 13.50,
      category: 'Pizza',
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-pizza-4',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Garden Fresh Veggie',
      description: 'Bell peppers, sliced black olives, sweet corn, mushrooms & melted mozzarella',
      price: 11.00,
      category: 'Pizza',
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },

    // 2. Burgers
    {
      id: 'item-burger-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Classic Smash Beef Burger',
      description: 'Juicy smashed beef patty, melted cheddar cheese, pickles & signature sauce',
      price: 9.50,
      category: 'Burgers',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-burger-2',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Crispy Zinger Chicken',
      description: 'Crispy seasoned chicken breast fillet, iceberg lettuce & spiced mayonnaise',
      price: 8.99,
      category: 'Burgers',
      image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-burger-3',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Smokey BBQ Cheeseburger',
      description: 'Grilled Angus beef patty, smoky beef bacon, melted cheese & barbecue glaze',
      price: 10.99,
      category: 'Burgers',
      image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },

    // 3. Pasta
    {
      id: 'item-pasta-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Creamy Chicken Alfredo',
      description: 'Fettuccine pasta in rich garlic parmesan cream with sliced grilled chicken',
      price: 11.50,
      category: 'Pasta',
      image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-pasta-2',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Penne all’Arrabbiata',
      description: 'Fiery Italian chili flakes, garlic, tomato sauce & fresh parsley',
      price: 9.80,
      category: 'Pasta',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },

    // 4. Sides & Snacks
    {
      id: 'item-side-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Cheesy Loaded Fries',
      description: 'Crispy golden fries topped with warm melted cheese and seasoning',
      price: 5.50,
      category: 'Sides & Snacks',
      image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-side-2',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Buffalo Chicken Wings',
      description: '6 pcs crispy wings tossed in spicy tangy buffalo sauce',
      price: 7.20,
      category: 'Sides & Snacks',
      image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-side-3',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Toasted Garlic Cheese Bread',
      description: 'Crunchy French bread slices topped with roasted garlic butter and mozzarella',
      price: 4.50,
      category: 'Sides & Snacks',
      image_url: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },

    // 5. Beverages
    {
      id: 'item-drink-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Coca-Cola (Can 330ml)',
      description: 'Classic refreshing ice-cold cola',
      price: 2.00,
      category: 'Beverages',
      image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },
    {
      id: 'item-drink-2',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Fresh Mint Lemonade',
      description: 'Fresh squeezed lime juice, crushed mint leaves & chilled soda splash',
      price: 3.50,
      category: 'Beverages',
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    },

    // 6. Desserts
    {
      id: 'item-dessert-1',
      vendor_id: activeVendor?.id || 'v-1',
      name: 'Warm Fudge Brownie',
      description: 'Rich dark chocolate brownie served with molten center',
      price: 4.90,
      category: 'Desserts',
      image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=400&q=80',
      is_available: true
    }
  ];

  // Effective vendor menu items
  const effectiveMenuItems = React.useMemo(() => {
    const contextItems = menuItems.filter(m => m.vendor_id === activeVendor?.id);
    if (contextItems.length > 0) {
      return contextItems;
    }
    return defaultMenuItemsList;
  }, [menuItems, activeVendor?.id]);

  // Group into categories
  const vendorCategoriesList = React.useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of effectiveMenuItems) {
      const c = item.category || 'General';
      if (!map.has(c)) {
        map.set(c, []);
      }
      map.get(c)!.push(item);
    }
    return Array.from(map.entries()).map(([catName, items]) => ({
      name: catName,
      items,
      count: items.length,
      image: items[0]?.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&h=120&q=80'
    }));
  }, [effectiveMenuItems]);

  const getItemEffectiveStatus = (item: MenuItem): 'available' | 'sold_out_today' | 'sold_out_indefinite' => {
    if (itemAvailabilityMap[item.id]) {
      return itemAvailabilityMap[item.id];
    }
    return item.is_available ? 'available' : 'sold_out_indefinite';
  };

  const openAvailabilityModal = (item: MenuItem) => {
    const current = getItemEffectiveStatus(item);
    setSelectedAvailabilityOption(current);
    setAvailabilityModalItem(item);
  };

  const handleApplyAvailability = () => {
    if (!availabilityModalItem) return;
    const isAvail = selectedAvailabilityOption === 'available';

    setItemAvailabilityMap(prev => {
      const nextMap = { ...prev, [availabilityModalItem.id]: selectedAvailabilityOption };
      try {
        localStorage.setItem('foodiplace_vendor_item_availability', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });

    updateMenuItem(availabilityModalItem.id, { is_available: isAvail });
    setAvailabilityModalItem(null);
  };

  if (!activeVendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-slate-500 font-bold">
        Loading restaurant terminal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-start font-sans antialiased selection:bg-[#d70f64] selection:text-white">
      <div className="w-full max-w-lg min-h-screen bg-white sm:shadow-md sm:border-x sm:border-slate-100 flex flex-col overflow-hidden relative">
        
        {/* 
          ========================================================================
          TOP HEADER (100% Matching Sample Image 2)
          Hamburger Menu ≡ (left) | Storefront with Clock + ● OPEN Pill (right)
          ========================================================================
        */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between bg-white shrink-0">
          {/* Left: Hamburger menu & 3-dot trigger icons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1 -ml-1 text-slate-800 hover:text-black transition cursor-pointer active:scale-95"
              title="Open Menu / Window"
            >
              <Menu className="w-7 h-7 stroke-[2.2]" />
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1 text-slate-400 hover:text-slate-800 transition cursor-pointer active:scale-95"
              title="3-dot Menu"
            >
              <MoreVertical className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Right Group: Store icon with clock + Status Pill */}
          <div className="flex items-center space-x-3.5">
            {/* Storefront with Clock Badge */}
            <button
              onClick={openVendorProfileModal}
              className="relative text-slate-800 hover:text-black transition cursor-pointer active:scale-95"
              title="Click to view & edit Store Profile (Logo & Cover)"
            >
              <Store className="w-6 h-6 stroke-[1.8]" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 stroke-[2.2] text-slate-800" />
              </div>
            </button>

            {/* Status Pill: ● OPEN matching Sample Image 2 */}
            <button
              onClick={() => {
                setStoreStatus((prev) => (prev === 'online' ? 'busy' : prev === 'busy' ? 'offline' : 'online'));
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs rounded-full px-3.5 py-1.5 flex items-center space-x-2 transition cursor-pointer active:scale-95"
              title="Click to toggle store status (Open / Busy / Paused)"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  storeStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : storeStatus === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                {storeStatus === 'online' ? 'OPEN' : storeStatus === 'busy' ? 'BUSY' : 'PAUSED'}
              </span>
            </button>
          </div>
        </header>

        {/* 
          ========================================================================
          MAIN ORDER DASHBOARD (100% Matching Sample Image 2)
          Row 1: [ New 0 ] | [ Upcoming 0 ]
          Row 2: [ Accepted 0 ]
          ========================================================================
        */}
        <main className="flex-1 px-5 pt-4 pb-12 overflow-y-auto">
          {/* Row 1: Two Column Grid (New & Upcoming) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* 1. New Orders Column */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">New</h2>
                <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{pendingOrders.length}</span>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
                  <span className="text-sm font-bold text-slate-800">No new orders</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order, idx) => {
                    const serialNumber = (order.order_code && order.order_code !== '00')
                      ? order.order_code
                      : String(idx + 1).padStart(2, '0');
                    const itemCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
                    const itemLabel = `${itemCount} item${itemCount > 1 ? 's' : ''}`;

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedAcceptOrder(order);
                          setSelectedPrepMinutes(order.vendor_prep_minutes || 9);
                        }}
                        className="bg-[#b8004f] hover:bg-[#a30046] active:scale-[0.98] transition-all rounded-2xl p-4 sm:p-5 shadow-xs min-h-[140px] flex flex-col justify-start cursor-pointer select-none text-white border-0"
                      >
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                          #{serialNumber}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-white/95 mt-2 leading-tight">
                          {itemLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Upcoming Orders Column */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Upcoming</h2>
                <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{readyOrders.length}</span>
              </div>

              {readyOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
                  <span className="text-sm font-bold text-slate-800 leading-snug">
                    No upcoming<br />orders
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-blue-200 rounded-2xl p-3.5 shadow-2xs space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-blue-600">#{order.order_code}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          Rider Pickup
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium leading-snug">
                        {order.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(', ')}
                      </div>
                      <button
                        onClick={() => handleConfirmHandover(order.id)}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Handover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Row 2: Accepted Orders Section (Matching Sample Image 2) */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center space-x-1.5 mb-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Accepted</h2>
              <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{preparingOrders.length}</span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs mt-3">
                <span className="text-sm font-bold text-slate-800">No accepted orders</span>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {preparingOrders.map((order) => {
                  const totalItems = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
                  const itemLabel = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
                  const isTest = order.id.startsWith('test-') || order.order_code === '00' || order.order_code === '01';

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedReadyOrder(order)}
                      className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all cursor-pointer select-none space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Vertical pink bar */}
                          <div className="w-1.5 h-10 bg-[#d70f64] rounded-full shrink-0" />
                          <div>
                            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans leading-none">
                              #{order.order_code}
                            </h3>
                            <p className="text-sm font-bold text-slate-800 mt-1.5">
                              {order.customer_phone || 'XXXX-1234'} • {itemLabel}
                            </p>
                          </div>
                        </div>

                        {/* Badge */}
                        <span className="bg-rose-50 text-[#d70f64] font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {isTest ? 'TEST ORDER' : 'DELIVERY'}
                        </span>
                      </div>

                      {/* Bottom Right: Prep Time */}
                      <div className="flex justify-end pt-1">
                        <span className="text-base font-bold text-slate-900">
                          {order.vendor_prep_minutes || 9} mins
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* 
          ========================================================================
          SIDE-SLIDING WINDOW (DRAWER / 3-DOT MENU)
          "example image er moto same design koro.page na window ber hobe side theke"
          - Darkened backdrop overlay
          - Window emerges/slides smoothly from the left side (fixed inset-y-0 left-0)
          - Scrollable: Logout is positioned directly below Help Center
          ========================================================================
        */}
        {isDrawerOpen && activeVendor && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Dimmed backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Side-emerging Window docked to the left edge - 100% Matching Example Image */}
            <aside
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-y-0 left-0 w-[72vw] max-w-[290px] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300 ease-out border-r border-slate-200 select-none overflow-y-auto px-6 sm:px-7 pt-10 pb-8"
            >
              {/* Header Title: Your Restaurant */}
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">
                Your Restaurant
              </h2>

              {/* Group 1 */}
              <div className="space-y-6 text-[16px] sm:text-[17px] font-semibold text-slate-900">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setActiveTab('all');
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Orders overview
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsOrderHistoryModalOpen(true);
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Recent orders
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsPerformanceModalOpen(true);
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Performance
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsMenuViewOpen(true);
                    setSelectedMenuCategory(null);
                    setMenuSearchQuery('');
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Menu
                </button>

                <button
                  onClick={() => {
                    alert('Request a rider: Rider dispatch requested for available orders.');
                  }}
                  className="w-full flex items-center justify-between text-left hover:text-black transition cursor-pointer"
                >
                  <span>Request a rider</span>
                  <ChevronDown className="w-4 h-4 text-slate-700 stroke-[2]" />
                </button>
              </div>

              {/* Gap */}
              <div className="my-7" />

              {/* Group 2 */}
              <div className="space-y-6 text-[16px] sm:text-[17px] font-semibold text-slate-900">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    alert('Inbox: No new notifications.');
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Inbox
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    alert('Tutorial:\n1. Keep this terminal open for incoming orders.\n2. Audio alert chimes on new order.\n3. Tap Accept and prep food.\n4. Tap Mark Food Ready for pickup.');
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Tutorial
                </button>

                <button
                  onClick={() => {
                    handleSendTestOrder();
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Send Test Order
                </button>
              </div>

              {/* Gap */}
              <div className="my-7" />

              {/* Group 3 */}
              <div className="space-y-6 text-[16px] sm:text-[17px] font-semibold text-slate-900">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsOpeningTimesModalOpen(true);
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Settings
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsHelpModalOpen(true);
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Help Center
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to log out from this terminal?')) {
                      setIsDrawerOpen(false);
                      logoutUser();
                    }
                  }}
                  className="block w-full text-left text-rose-600 hover:text-rose-700 transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

      </div>

      {/* 
        ========================================================================
        ACCEPT ORDER PAGE (Matching Foodpanda Partner Accept Order Screen)
        - "then click korle accept page open hobe same example image er moto design koro"
        ========================================================================
      */}
      {selectedAcceptOrder && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setSelectedAcceptOrder(null)}
                className="p-2 -ml-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition cursor-pointer"
                title="Back to orders"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                  Order #{selectedAcceptOrder.order_code}
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-[#d70f64]" /> Foodpanda delivery
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDeclineOrder(selectedAcceptOrder)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              Decline
            </button>
          </header>

          {/* Body Content */}
          <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 space-y-4 pb-28">
            {/* 1. Preparation Time Section (Matching signature foodpanda design) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Select preparation time
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#d70f64]" /> Estimated
                </span>
              </div>

              {/* Big Stepper */}
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPrepMinutes((prev) => Math.max(5, prev - 1))}
                  className="w-12 h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-200 active:scale-95 font-black text-2xl shadow-2xs border border-slate-200 flex items-center justify-center transition cursor-pointer"
                  title="Decrease minutes"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="text-center px-4">
                  <div className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
                    {selectedPrepMinutes} <span className="text-base sm:text-lg font-bold text-slate-500 font-sans">mins</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">Rider dispatch timing is synced</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPrepMinutes((prev) => Math.min(60, prev + 1))}
                  className="w-12 h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-200 active:scale-95 font-black text-2xl shadow-2xs border border-slate-200 flex items-center justify-center transition cursor-pointer"
                  title="Increase minutes"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[5, 9, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedPrepMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedPrepMinutes === mins
                        ? 'bg-[#d70f64] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Customer Special Instructions Banner */}
            {selectedAcceptOrder.special_instructions && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Customer Note / Special Request
                  </h4>
                  <p className="text-sm sm:text-base font-bold text-amber-950 mt-0.5 leading-snug">
                    {selectedAcceptOrder.special_instructions}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Items List Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Order Items ({selectedAcceptOrder.items?.reduce((s, it) => s + it.quantity, 0) || 1})
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {selectedAcceptOrder.order_code === '00' ? 'Dummy Test Order' : 'Live Order'}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedAcceptOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-black text-xs rounded-lg">
                          {item.quantity}x
                        </span>
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-snug">
                            {item.item_name}
                          </h4>
                          {item.selected_variations && item.selected_variations.length > 0 && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {item.selected_variations.join(' • ')}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
                              <span>•</span> {item.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-sm font-black text-slate-900 font-mono">
                        ৳{item.subtotal || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </main>

          {/* Sticky Bottom Acceptance Bar (Full width Green button) */}
          <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
            <div className="max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => handleAcceptOrder(selectedAcceptOrder.id, selectedPrepMinutes)}
                className="w-full py-4 bg-[#008a05] hover:bg-[#007404] active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.8]" />
                <span>Accept order ({selectedPrepMinutes} mins)</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 
        ========================================================================
        READY ORDER PAGE (100% Matching Screenshot_20261010_142603_YouTube.jpg)
        - Opens when clicking an accepted order card
        - Header with #00 - XXXX-1234 and Printer icon
        - Order title with 9 mins and TEST ORDER badge
        - Customer section (Max)
        - Gray items card (1 x Pizza Salami, ** the tomatoes should be fresh, 0 x large)
        - Floating pink (?) help button
        - Bottom full-width Blue button "Ready for delivery" with item count
        ========================================================================
      */}
      {selectedReadyOrder && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedReadyOrder(null)}
              className="p-1.5 -ml-1 text-slate-800 hover:text-black hover:bg-slate-50 rounded-full transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <span className="text-base sm:text-lg font-black text-slate-950 font-sans tracking-tight">
              #{selectedReadyOrder.order_code} - {selectedReadyOrder.customer_phone || 'XXXX-1234'}
            </span>

            <button
              type="button"
              onClick={() => setPrintModalOrder(selectedReadyOrder)}
              className="p-1.5 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              title="Print Kitchen Docket"
            >
              <Printer className="w-5 h-5 stroke-[2]" />
            </button>
          </header>

          {/* Body Content */}
          <main className="flex-1 max-w-xl w-full mx-auto px-5 pt-4 pb-28 space-y-5">
            {/* Restaurant Badge & Order Title */}
            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-[#d70f64] text-white flex items-center justify-center text-[10px] font-black">
                  🐼
                </div>
                <span className="text-xs font-bold text-[#d70f64]">
                  {activeVendor?.name || 'Test restaurant'}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-sans leading-none">
                    Order #{selectedReadyOrder.order_code}
                  </h1>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {selectedReadyOrder.customer_phone || 'XXXX-1234'}
                  </p>
                  <span className="bg-rose-50 text-[#d70f64] font-black text-[10px] px-2.5 py-1 rounded-md inline-block uppercase tracking-wider mt-2.5">
                    {selectedReadyOrder.id.startsWith('test-') || selectedReadyOrder.order_code === '00' || selectedReadyOrder.order_code === '01' ? 'TEST ORDER' : 'DELIVERY'}
                  </span>
                </div>

                <span className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                  {selectedReadyOrder.vendor_prep_minutes || 9} mins
                </span>
              </div>
            </div>

            {/* Customer Section */}
            <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#d70f64] block leading-none">
                  Customer
                </span>
                <span className="text-base font-black text-slate-950 block leading-tight mt-0.5">
                  {selectedReadyOrder.customer_name || 'Max'}
                </span>
              </div>
            </div>

            {/* Gray Items Card Container */}
            <div className="bg-slate-50/80 rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
              {selectedReadyOrder.items?.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="text-base font-black text-[#d70f64] mr-2">
                        {item.quantity} x
                      </span>
                      <span className="text-base font-black text-slate-950">
                        {item.item_name}
                      </span>
                    </div>
                    <span className="text-base font-bold text-slate-400 font-mono">--</span>
                  </div>

                  {/* Special instruction in pink */}
                  {(item.special_instructions || selectedReadyOrder.special_instructions) && (
                    <p className="text-xs font-bold text-[#d70f64] pl-6 leading-tight">
                      {item.special_instructions || selectedReadyOrder.special_instructions}
                    </p>
                  )}

                  {/* Variations */}
                  {item.selected_variations && item.selected_variations.map((v, vIdx) => (
                    <div key={vIdx} className="flex justify-between items-center text-xs font-bold text-slate-800 pl-6">
                      <span>{v}</span>
                      <span className="text-slate-400 font-mono">--</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Subtotal */}
              <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center font-black text-base text-slate-950">
                <span>Subtotal</span>
                <span className="text-slate-400 font-mono">--</span>
              </div>
            </div>
          </main>

          {/* Floating Pink Help (?) Button */}
          <div className="fixed bottom-24 right-5 sm:right-8 z-30">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="w-11 h-11 rounded-full bg-[#d70f64] hover:bg-[#b8004f] text-white shadow-lg flex items-center justify-center font-black text-lg transition active:scale-95 cursor-pointer"
              title="Help"
            >
              ?
            </button>
          </div>

          {/* Sticky Bottom Action Bar (Blue Button: Ready for delivery) */}
          <footer className="sticky bottom-0 z-20 bg-white border-t border-slate-100 p-4 shadow-xl">
            <div className="max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => handleMarkFoodReady(selectedReadyOrder.id)}
                className="w-full py-4 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-black rounded-2xl transition shadow-md flex items-center justify-between cursor-pointer"
              >
                <span className="text-base sm:text-lg font-black text-white">
                  Ready for delivery
                </span>
                <span className="text-sm font-bold text-white/95">
                  {selectedReadyOrder.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} item
                </span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 
        ========================================================================
        MENU MANAGEMENT VIEWS (Matching Foodpanda Partner App)
        1. 3dot window te thaka menu option a click korle all category list show hobe
        2. then category te click korle category te thaka all item list page show hobe
        3. then item list a thaka 3dot a click korle availability er window popup hobe
        ========================================================================
      */}
      {isMenuViewOpen && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
          {/* View 1: All Categories List View */}
          {selectedMenuCategory === null ? (
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsMenuViewOpen(false)}
                    className="p-2 -ml-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition cursor-pointer"
                    title="Back to terminal"
                  >
                    <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                  </button>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                      Menu
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-[#d70f64]" /> {activeVendor?.name || 'Restaurant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {vendorCategoriesList.length} Categories
                  </span>
                </div>
              </header>

              {/* Search Bar */}
              <div className="p-4 sm:p-5 max-w-xl w-full mx-auto pb-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#d70f64] focus:ring-2 focus:ring-[#d70f64]/10 transition shadow-2xs"
                  />
                  {menuSearchQuery && (
                    <button
                      onClick={() => setMenuSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories List */}
              <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 space-y-2.5 pb-20">
                {vendorCategoriesList
                  .filter((cat) => !menuSearchQuery || cat.name.toLowerCase().includes(menuSearchQuery.toLowerCase()))
                  .map((category) => (
                    <div
                      key={category.name}
                      onClick={() => {
                        setSelectedMenuCategory(category.name);
                        setMenuSearchQuery('');
                      }}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs active:scale-[0.99] transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120';
                          }}
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-[15px] sm:text-base group-hover:text-[#d70f64] transition">
                            {category.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {category.count} {category.count === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}

                {vendorCategoriesList.filter((cat) => !menuSearchQuery || cat.name.toLowerCase().includes(menuSearchQuery.toLowerCase())).length === 0 && (
                  <div className="py-12 text-center text-slate-400 font-bold text-sm bg-white rounded-2xl border border-slate-200">
                    No categories found matching "{menuSearchQuery}"
                  </div>
                )}
              </main>
            </div>
          ) : (
            /* View 2: Category Item List Page */
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMenuCategory(null);
                      setMenuSearchQuery('');
                    }}
                    className="p-2 -ml-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition cursor-pointer"
                    title="Back to categories"
                  >
                    <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                  </button>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                      {selectedMenuCategory}
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {vendorCategoriesList.find(c => c.name === selectedMenuCategory)?.count || 0} items in this category
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMenuCategory(null);
                    setMenuSearchQuery('');
                  }}
                  className="text-xs font-bold text-[#d70f64] hover:underline cursor-pointer"
                >
                  All categories
                </button>
              </header>

              {/* Search Within Category */}
              <div className="p-4 sm:p-5 max-w-xl w-full mx-auto pb-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    placeholder={`Search in ${selectedMenuCategory}...`}
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#d70f64] focus:ring-2 focus:ring-[#d70f64]/10 transition shadow-2xs"
                  />
                  {menuSearchQuery && (
                    <button
                      onClick={() => setMenuSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 space-y-3 pb-24">
                {(vendorCategoriesList.find(c => c.name === selectedMenuCategory)?.items || [])
                  .filter((item) => {
                    if (!menuSearchQuery) return true;
                    const q = menuSearchQuery.toLowerCase();
                    return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
                  })
                  .map((item) => {
                    const status = getItemEffectiveStatus(item);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-start justify-between gap-3 relative"
                      >
                        {/* Left Details */}
                        <div className="flex-1 pr-2 min-w-0">
                          <h4 className="font-bold text-slate-900 text-[15px] sm:text-base leading-snug">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center space-x-2">
                            <span className="font-mono font-black text-slate-900 text-sm">
                              ৳{item.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Availability Badge */}
                          <div className="mt-2">
                            {status === 'available' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Available
                              </span>
                            )}
                            {status === 'sold_out_today' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Sold out for today
                              </span>
                            )}
                            {status === 'sold_out_indefinite' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Sold out indefinitely
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Item Image & 3-dot Button */}
                        <div className="flex flex-col items-end space-y-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAvailabilityModal(item);
                            }}
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer"
                            title="Item availability settings"
                          >
                            <MoreVertical className="w-4 h-4 stroke-[2.4]" />
                          </button>

                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 shadow-2xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160';
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </main>
            </div>
          )}

          {/* 
            ========================================================================
            AVAILABILITY WINDOW POPUP (100% Matching Foodpanda Partner App Popup)
            - "then item list a thaka 3dot a click korle availability er window popup hobe"
            - Radio button options: Available, Sold out for today, Sold out indefinitely
            - Apply & Cancel buttons
            ========================================================================
          */}
          {availabilityModalItem && (
            <div
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
              onClick={() => setAvailabilityModalItem(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white text-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col"
              >
                {/* Mobile drag handle */}
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-1 sm:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                      Item availability
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {availabilityModalItem.name} • ৳{availabilityModalItem.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setAvailabilityModalItem(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Radio Options */}
                <div className="space-y-3 py-1 text-xs sm:text-sm">
                  {/* Option 1: Available */}
                  <label
                    onClick={() => setSelectedAvailabilityOption('available')}
                    className={`flex items-start p-3.5 rounded-2xl border transition cursor-pointer ${
                      selectedAvailabilityOption === 'available'
                        ? 'border-[#d70f64] bg-pink-50/40 ring-2 ring-[#d70f64]/15'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 mr-3 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          selectedAvailabilityOption === 'available'
                            ? 'border-[#d70f64] bg-[#d70f64]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedAvailabilityOption === 'available' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Available
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        This item will appear on the menu and customers can order it right now.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Sold out for today */}
                  <label
                    onClick={() => setSelectedAvailabilityOption('sold_out_today')}
                    className={`flex items-start p-3.5 rounded-2xl border transition cursor-pointer ${
                      selectedAvailabilityOption === 'sold_out_today'
                        ? 'border-[#d70f64] bg-pink-50/40 ring-2 ring-[#d70f64]/15'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 mr-3 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          selectedAvailabilityOption === 'sold_out_today'
                            ? 'border-[#d70f64] bg-[#d70f64]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedAvailabilityOption === 'sold_out_today' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Sold out for today
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        This item will be unavailable today and will automatically turn back on tomorrow morning.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Sold out indefinitely */}
                  <label
                    onClick={() => setSelectedAvailabilityOption('sold_out_indefinite')}
                    className={`flex items-start p-3.5 rounded-2xl border transition cursor-pointer ${
                      selectedAvailabilityOption === 'sold_out_indefinite'
                        ? 'border-[#d70f64] bg-pink-50/40 ring-2 ring-[#d70f64]/15'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 mr-3 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          selectedAvailabilityOption === 'sold_out_indefinite'
                            ? 'border-[#d70f64] bg-[#d70f64]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedAvailabilityOption === 'sold_out_indefinite' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Sold out indefinitely
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        This item will remain unavailable until you manually turn it back on.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleApplyAvailability}
                    className="w-full py-3.5 bg-[#d70f64] hover:bg-[#b8004f] active:scale-[0.99] text-white font-black text-sm rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvailabilityModalItem(null)}
                    className="w-full py-2.5 text-center text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* 
        ========================================================================
        PAGE / MODAL: DECLINE ORDER
        - Step 1: "Sad to see you decline." (Reasons page)
          - "Vendor closed" & "Too busy" trigger Confirm and Cancel popup
          - "Item unavailable" navigates to "Which items are unavailable?"
        - Step 2: "Which items are unavailable?" (Screenshot_20261010_182014_YouTube.jpg)
        - Step 3: "Let's save the order!" (Screenshot_20261010_182031_YouTube.jpg)
        ========================================================================
      */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-200 select-none">
          {/* ------------------------------------------------------------- */}
          {/* SUB-STEP 1: SELECT REASON (Sad to see you decline)            */}
          {/* ------------------------------------------------------------- */}
          {declineSubStep === 'reasons' && (
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="p-1 -ml-1 text-slate-800 hover:text-black transition cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="text-[#d70f64] hover:text-[#b8004f] font-bold text-base tracking-wide cursor-pointer transition"
                >
                  Cancel
                </button>
              </header>

              {/* Main Decline Content */}
              <main className="max-w-md w-full mx-auto p-6 sm:p-8 flex-1 flex flex-col justify-start">
                <div className="pt-2 pb-6">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                    Sad to see you<br />decline.
                  </h1>
                  <p className="text-sm sm:text-base font-bold text-slate-700 mt-3">
                    Select your reason for declining.
                  </p>
                </div>

                {/* Reason Options List */}
                <div className="space-y-4">
                  {/* 1. Vendor closed -> opens Confirm/Cancel popup */}
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('Vendor closed');
                      setDeclineConfirmModal({ isOpen: true, reason: 'Vendor closed' });
                    }}
                    className="w-full p-5 rounded-2xl flex items-center transition cursor-pointer text-left bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 shadow-sm active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200/90 flex items-center justify-center mr-4 shrink-0 text-slate-800">
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-tight">Vendor closed</span>
                  </button>

                  {/* 2. Too busy -> opens Confirm/Cancel popup */}
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('Too busy');
                      setDeclineConfirmModal({ isOpen: true, reason: 'Too busy' });
                    }}
                    className="w-full p-5 rounded-2xl flex items-center transition cursor-pointer text-left bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 shadow-sm active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 shrink-0 text-slate-800">
                      <Clock className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-tight">Too busy</span>
                  </button>

                  {/* 3. Item unavailable -> navigates to Which items are unavailable? */}
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason('Item unavailable');
                      setSelectedUnavailableItems([]);
                      setDeclineSubStep('unavailable_items');
                    }}
                    className="w-full p-5 rounded-2xl flex items-center transition cursor-pointer text-left bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 shadow-sm active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 shrink-0 text-slate-800">
                      <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-tight">Item unavailable</span>
                  </button>
                </div>
              </main>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-STEP 2: WHICH ITEMS ARE UNAVAILABLE?                      */}
          {/* (100% Matching Screenshot_20261010_182014_YouTube.jpg)        */}
          {/* ------------------------------------------------------------- */}
          {declineSubStep === 'unavailable_items' && (
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => setDeclineSubStep('reasons')}
                  className="p-1 -ml-1 text-slate-800 hover:text-black transition cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOrder(null);
                    setDeclineSubStep('reasons');
                  }}
                  className="text-[#d70f64] hover:text-[#b8004f] font-bold text-base tracking-wide cursor-pointer transition"
                >
                  Cancel
                </button>
              </header>

              <main className="max-w-md w-full mx-auto p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight pt-2">
                    Which items are<br />unavailable?
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-slate-700 mt-3 leading-relaxed">
                    These items will be set to unavailable for the rest of the day.
                  </p>

                  {/* Unavailable Items Container */}
                  <div className="bg-[#f8f9fa] rounded-2xl p-5 mt-6 border border-slate-100 space-y-3">
                    {((rejectModalOrder.items && rejectModalOrder.items.length > 0)
                      ? rejectModalOrder.items
                      : [{ id: 'item-fallback', item_name: 'Pizza Salami', quantity: 1 }]
                    ).map((item, idx) => {
                      const itemName = item.item_name || 'Pizza Salami';
                      const isChecked = selectedUnavailableItems.includes(itemName);

                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => toggleUnavailableItem(itemName)}
                          className="flex items-center space-x-3.5 cursor-pointer py-1 select-none"
                        >
                          <div
                            className={`w-5 h-5 rounded-xs border-2 transition flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'border-[#d70f64] bg-[#d70f64]'
                                : 'border-[#d70f64] bg-white'
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                            )}
                          </div>
                          <span className="font-bold text-slate-900 text-base sm:text-lg">
                            {itemName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Continue Button */}
                <div className="pt-8 pb-4">
                  {selectedUnavailableItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleContinueUnavailableItems}
                      className="w-full py-4 text-center font-bold text-base sm:text-lg rounded-xl bg-[#d70f64] hover:bg-[#b8004f] active:scale-[0.99] text-white transition shadow-sm cursor-pointer"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-4 text-center font-bold text-base sm:text-lg rounded-xl bg-[#e2e4e8] text-white cursor-not-allowed"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </main>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-STEP 3: LET'S SAVE THE ORDER!                             */}
          {/* (100% Matching Screenshot_20261010_182031_YouTube.jpg)        */}
          {/* ------------------------------------------------------------- */}
          {declineSubStep === 'save_order' && (
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => setDeclineSubStep('unavailable_items')}
                  className="p-1 -ml-1 text-slate-800 hover:text-black transition cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOrder(null);
                    setDeclineSubStep('reasons');
                  }}
                  className="text-[#d70f64] hover:text-[#b8004f] font-bold text-base tracking-wide cursor-pointer transition"
                >
                  Cancel
                </button>
              </header>

              <main className="max-w-md w-full mx-auto p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight pt-2">
                    Let's save the order!
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-slate-700 mt-3 leading-relaxed">
                    Try calling the customer and offering an alternative item of similar value
                  </p>

                  {/* Customer Card */}
                  <div className="bg-[#f8f9fa] rounded-2xl p-5 mt-6 border border-slate-100 flex items-center space-x-4 shadow-2xs">
                    <div className="w-11 h-11 rounded-full bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-700">
                      <User className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <span className="text-[#d70f64] font-bold text-xs uppercase tracking-wide block">
                        {rejectModalOrder.customer_name || 'Max'}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900 font-sans block mt-0.5">
                        {rejectModalOrder.customer_phone || '+49123456789'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Accept Order (Green) & Decline Order (Pink link) */}
                <div className="pt-8 pb-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAcceptOrder(rejectModalOrder.id, rejectModalOrder.vendor_prep_minutes || 9);
                      setRejectModalOrder(null);
                      setDeclineSubStep('reasons');
                    }}
                    className="w-full py-4 bg-[#1ea855] hover:bg-[#188e47] active:scale-[0.99] text-white font-bold text-base sm:text-lg rounded-xl shadow-xs transition cursor-pointer text-center"
                  >
                    Accept Order
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmReject('Item unavailable');
                      setDeclineSubStep('reasons');
                    }}
                    className="w-full py-3 text-center text-[#d70f64] hover:text-[#b8004f] font-bold text-base transition cursor-pointer"
                  >
                    Decline Order
                  </button>
                </div>
              </main>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CONFIRMATION POPUP FOR BUSY & CLOSED OPTIONS                  */}
          {/* "busy and close option a click korle confirm and cencel       */}
          {/*  button popup hobe"                                           */}
          {/* ------------------------------------------------------------- */}
          {declineConfirmModal && (
            <div
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setDeclineConfirmModal(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-150"
              >
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-1">
                  <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
                </div>

                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  Decline Order?
                </h3>
                <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                  Are you sure you want to decline this order because{' '}
                  <span className="font-bold text-slate-900">
                    {declineConfirmModal.reason === 'Vendor closed' ? 'vendor is closed' : 'you are too busy'}
                  </span>?
                </p>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const reason = declineConfirmModal.reason;
                      setDeclineConfirmModal(null);
                      handleConfirmReject(reason);
                    }}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl transition shadow-md cursor-pointer"
                  >
                    Confirm
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeclineConfirmModal(null)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-bold text-sm rounded-2xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: PRINT KITCHEN DOCKET / THERMAL RECEIPT
        ========================================================================
      */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-950 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider">{activeVendor?.name}</h2>
              <p className="text-[10px] text-slate-500">{activeVendor?.address}</p>
              <p className="text-[10px] text-slate-500">Tel: {activeVendor?.phone}</p>
              <div className="font-bold text-sm text-slate-900 pt-1">
                KITCHEN DOCKET #{printModalOrder.order_code}
              </div>
              <p className="text-[10px] text-slate-500">
                Time: {new Date(printModalOrder.created_at).toLocaleString()}
              </p>
            </div>

            {/* Customer Details */}
            <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[11px]">
              <p><span className="font-bold">Customer:</span> {printModalOrder.customer_name}</p>
              <p><span className="font-bold">Phone:</span> {printModalOrder.customer_phone}</p>
              <p><span className="font-bold">Address:</span> {printModalOrder.delivery_address}</p>
              {printModalOrder.special_instructions && (
                <p className="font-bold text-rose-600">Note: {printModalOrder.special_instructions}</p>
              )}
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-slate-300 pb-2 space-y-1.5">
              {printModalOrder.items?.map((it, i) => (
                <div key={i} className="flex justify-between items-start font-bold">
                  <span>{it.quantity}x {it.item_name}</span>
                  <span>৳{it.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 font-bold pt-1">
              <div className="flex justify-between">
                <span>Food Subtotal:</span>
                <span>৳{printModalOrder.food_total}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge:</span>
                <span>৳{printModalOrder.delivery_fee}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-slate-900 pt-1">
                <span>TOTAL COD TO COLLECT:</span>
                <span>৳{printModalOrder.total_cash_payable}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex space-x-2">
              <button
                onClick={() => setPrintModalOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-sans font-black rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: VENDOR PROFILE WINDOW (VIEW-ONLY INFO, PROFILE & COVER IMAGES EDIT)
        ========================================================================
      */}
      {isProfileModalOpen && activeVendor && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
            {/* Modal Top Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                  <Store className="w-5 h-5 text-rose-600" />
                  <span>Vendor Store Profile</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View store info & manage profile and cover banner photos
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Feedback Alert if any */}
              {uploadFeedback && (
                <div 
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
                    uploadFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{uploadFeedback.message}</span>
                  </div>
                  <button 
                    onClick={() => setUploadFeedback(null)} 
                    className="p-1 hover:bg-black/5 rounded-lg text-slate-500 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* COVER & PROFILE PHOTO CARD */}
              <div className="bg-slate-50 rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
                {/* 1. Cover Banner Section */}
                <div className="relative h-36 sm:h-44 bg-gradient-to-r from-rose-500 via-orange-500 to-pink-500 group overflow-hidden">
                  {activeVendor.cover_image ? (
                    <img
                      src={activeVendor.cover_image}
                      alt="Store Cover Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/90 bg-slate-900/40">
                      <Image className="w-8 h-8 stroke-[1.8] mb-1" />
                      <span className="text-xs font-bold">No Cover Photo Set</span>
                      <span className="text-[10px] text-white/70">Recommended: 16:9 ratio</span>
                    </div>
                  )}

                  {/* Top Overlay Buttons for Cover */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    {/* Add / Change Cover Photo Button */}
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer transition shadow-md active:scale-95">
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isUploadingCover ? 'Uploading...' : activeVendor.cover_image ? 'Change Cover' : 'Add Cover'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCover || isDeletingCover}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !activeVendor) return;
                          setIsUploadingCover(true);
                          setUploadFeedback(null);
                          const oldCoverUrl = activeVendor.cover_image;
                          const res = await uploadVendorImage(activeVendor.name, file, 'cover', oldCoverUrl);
                          setIsUploadingCover(false);
                          if (res.success && res.url) {
                            await updateVendor(activeVendor.id, { cover_image: res.url });
                            setProfileCoverUrlInput(res.url);
                            setUploadFeedback({ 
                              type: 'success', 
                              message: '✅ পূর্বের কভার ছবি মুছে নতুন কভার ছবি সফলভাবে সেভ করা হয়েছে!' 
                            });
                          } else {
                            setUploadFeedback({ type: 'error', message: res.message || 'Failed to upload cover photo.' });
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Delete Cover Photo Button */}
                    {activeVendor.cover_image && (
                      <button
                        disabled={isDeletingCover || isUploadingCover}
                        onClick={async () => {
                          if (!activeVendor) return;
                          if (confirm('কভার ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete cover photo from database?)')) {
                            setIsDeletingCover(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(activeVendor.id, 'cover');
                            setIsDeletingCover(false);
                            if (res.success) {
                              setProfileCoverUrlInput('');
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ কভার ছবি সফলভাবে ডিলিট করা হয়েছে।' 
                              });
                            } else {
                              setUploadFeedback({ type: 'error', message: res.message || 'Failed to delete cover photo.' });
                            }
                          }
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-bold backdrop-blur-md transition shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Delete Cover Photo from Database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isDeletingCover ? 'Deleting...' : 'Delete Cover'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Profile Photo / Avatar Section */}
                <div className="px-5 pt-0 pb-5 -mt-12 sm:-mt-14 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="flex items-end space-x-3.5">
                    {/* Avatar Circle */}
                    <div className="relative group/avatar shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-slate-100 shadow-lg overflow-hidden flex items-center justify-center text-slate-800 font-black text-xl">
                        {activeVendor.logo_url ? (
                          <img
                            src={activeVendor.logo_url}
                            alt="Store Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{activeVendor.name?.charAt(0) || 'V'}</span>
                        )}
                      </div>

                      {/* Camera Badge to Upload/Change Profile Photo */}
                      <label className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition border-2 border-white active:scale-95">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingLogo || isDeletingLogo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !activeVendor) return;
                            setIsUploadingLogo(true);
                            setUploadFeedback(null);
                            const oldLogoUrl = activeVendor.logo_url;
                            const res = await uploadVendorImage(activeVendor.name, file, 'logo', oldLogoUrl);
                            setIsUploadingLogo(false);
                            if (res.success && res.url) {
                              await updateVendor(activeVendor.id, { logo_url: res.url });
                              setProfileLogoUrlInput(res.url);
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ পূর্বের প্রোফাইল ছবি মুছে নতুন ছবি সফলভাবে সেভ করা হয়েছে!' 
                              });
                            } else {
                              setUploadFeedback({ type: 'error', message: res.message || 'Failed to upload profile photo.' });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="mb-1">
                      <h4 className="font-black text-base text-slate-900 leading-tight">
                        {activeVendor.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {activeVendor.cuisine || 'Fast Food & Restaurant'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                        সুপারিশকৃত সাইজ: 1:1 স্কয়ার (500×500 px)
                      </span>
                    </div>
                  </div>

                  {/* Profile Photo Action Buttons */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {/* Add / Change Photo */}
                    <label className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'Uploading...' : activeVendor.logo_url ? 'Change Photo' : 'Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo || isDeletingLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !activeVendor) return;
                          setIsUploadingLogo(true);
                          setUploadFeedback(null);
                          const oldLogoUrl = activeVendor.logo_url;
                          const res = await uploadVendorImage(activeVendor.name, file, 'logo', oldLogoUrl);
                          setIsUploadingLogo(false);
                          if (res.success && res.url) {
                            await updateVendor(activeVendor.id, { logo_url: res.url });
                            setProfileLogoUrlInput(res.url);
                            setUploadFeedback({ 
                              type: 'success', 
                              message: '✅ পূর্বের প্রোফাইল ছবি মুছে নতুন ছবি সফলভাবে সেভ করা হয়েছে!' 
                            });
                          } else {
                            setUploadFeedback({ type: 'error', message: res.message || 'Failed to upload profile photo.' });
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Delete Photo Button */}
                    {activeVendor.logo_url && (
                      <button
                        disabled={isDeletingLogo || isUploadingLogo}
                        onClick={async () => {
                          if (!activeVendor) return;
                          if (confirm('প্রোফাইল ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete profile photo from database?)')) {
                            setIsDeletingLogo(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(activeVendor.id, 'logo');
                            setIsDeletingLogo(false);
                            if (res.success) {
                              setProfileLogoUrlInput('');
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ প্রোফাইল ছবি সফলভাবে ডিলিট করা হয়েছে।' 
                              });
                            } else {
                              setUploadFeedback({ type: 'error', message: res.message || 'Failed to delete profile photo.' });
                            }
                          }
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Delete Profile Photo from Database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeletingLogo ? 'Deleting...' : 'Delete Photo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* URL Option Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setIsUrlInputMode(!isUrlInputMode)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-rose-600 transition cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Or enter web image URL directly</span>
                  </span>
                  <span className="text-[11px] text-rose-600 underline">
                    {isUrlInputMode ? 'Hide URL inputs' : 'Show URL inputs'}
                  </span>
                </button>

                {isUrlInputMode && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600">Profile Photo (Logo) URL:</label>
                        {profileLogoUrlInput && (
                          <button
                            type="button"
                            onClick={() => setProfileLogoUrlInput('')}
                            className="text-[10px] text-rose-600 hover:underline font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={profileLogoUrlInput}
                        onChange={(e) => setProfileLogoUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:border-rose-500 font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600">Cover Banner URL:</label>
                        {profileCoverUrlInput && (
                          <button
                            type="button"
                            onClick={() => setProfileCoverUrlInput('')}
                            className="text-[10px] text-rose-600 hover:underline font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={profileCoverUrlInput}
                        onChange={(e) => setProfileCoverUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:border-rose-500 font-mono"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleApplyWebUrls}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                      >
                        Apply URLs
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RESTAURANT INFORMATION (VIEW ONLY - CANNOT BE EDITED BY VENDOR) */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider">
                      Restaurant Information
                    </h4>
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-[10px] font-bold">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>View Only</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Restaurant Name */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>Restaurant Name</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {activeVendor.name || '—'}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone Number</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm font-mono truncate">
                      {activeVendor.phone || '—'}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Store Address</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs leading-relaxed">
                      {activeVendor.address || '—'}
                    </div>
                  </div>

                  {/* Cuisine */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Utensils className="w-3 h-3 text-slate-400" />
                      <span>Cuisine Type</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {activeVendor.cuisine || 'Restaurant & Fast Food'}
                    </div>
                  </div>

                  {/* Zone */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs sm:col-span-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Assigned Delivery Zone</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>
                        {activeVendor.zone || 'Chittagong Central Zone'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start space-x-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    নিরাপত্তার স্বার্থে রেস্টুরেন্টের নাম, ঠিকানা, ফোন ও জোন তথ্য শুধুমাত্র দেখার জন্য সংরক্ষিত। পরিবর্তন প্রয়োজন হলে অ্যাডমিনের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50/80">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: PARTNER HELP CENTER
        ========================================================================
      */}
      {isHelpModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Partner Help Center</h3>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 space-y-1">
                <span className="font-bold text-rose-900 text-xs flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>Merchant Support Hotline</span>
                </span>
                <p className="text-slate-700 text-sm font-mono font-bold">09612-889900</p>
                <p className="text-[10px] text-slate-500">Available 24/7 for active kitchen and rider assistance</p>
              </div>

              <div className="space-y-2 pt-1 text-slate-700">
                <p className="font-bold text-slate-900 text-xs">Common Inquiries:</p>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800">📸 How to change store logo & cover:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click your store profile card in the 3-dot menu to upload 1:1 logo or 16:9 banner.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800">💰 Payment & Payouts:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automated weekly settlements directly transferred to vendor bank accounts.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: PERFORMANCE OVERVIEW
        ========================================================================
      */}
      {isPerformanceModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsPerformanceModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-600">
                <BarChart2 className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Store Performance</h3>
              </div>
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Sales</span>
                <p className="text-xl font-black text-emerald-600 font-mono mt-1">৳{todayEarnings}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-1">{completedOrders.length}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cooking Now</span>
                <p className="text-xl font-black text-amber-600 font-mono mt-1">{preparingOrders.length}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ready / Picked</span>
                <p className="text-xl font-black text-blue-600 font-mono mt-1">{readyOrders.length}</p>
              </div>
            </div>

            <button
              onClick={() => setIsPerformanceModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: ORDER HISTORY
        ========================================================================
      */}
      {isOrderHistoryModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsOrderHistoryModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900">
                <History className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Completed Orders</h3>
              </div>
              <button
                onClick={() => setIsOrderHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {completedOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-bold">
                  No completed orders yet today.
                </div>
              ) : (
                completedOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-rose-600">#{ord.order_code}</span>
                      <span className="font-mono font-black text-slate-900">৳{ord.total_cash_payable}</span>
                    </div>
                    <p className="text-slate-600 font-medium truncate">
                      {ord.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.customer_name}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsOrderHistoryModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: OPENING TIMES & STATUS
        ========================================================================
      */}
      {isOpeningTimesModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsOpeningTimesModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900">
                <Clock className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Store Status & Hours</h3>
              </div>
              <button
                onClick={() => setIsOpeningTimesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-600">Select Store Operational Status:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStoreStatus('online')}
                  className={`p-3 rounded-2xl border font-bold flex flex-col items-center space-y-1 transition cursor-pointer ${
                    storeStatus === 'online' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>ONLINE</span>
                </button>

                <button
                  onClick={() => setStoreStatus('busy')}
                  className={`p-3 rounded-2xl border font-bold flex flex-col items-center space-y-1 transition cursor-pointer ${
                    storeStatus === 'busy' ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>BUSY</span>
                </button>

                <button
                  onClick={() => setStoreStatus('offline')}
                  className={`p-3 rounded-2xl border font-bold flex flex-col items-center space-y-1 transition cursor-pointer ${
                    storeStatus === 'offline' ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>PAUSED</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-slate-600">
                <span className="font-bold text-slate-900">Standard Operating Schedule:</span>
                <p>Monday – Sunday: 10:00 AM – 11:30 PM</p>
                <p className="text-[10px] text-slate-400">Orders placed during opening hours will automatically alert terminal audio.</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpeningTimesModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Apply Status
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
