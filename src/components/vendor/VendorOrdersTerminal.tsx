import React, { useState, useEffect, useRef } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AuthModal } from '../common/AuthModal';
import { Order, OrderStatus, Vendor, MenuItem, DaySchedule, WeeklySchedule } from '../../types/database';
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
  Share2,
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
  MoreVertical,
  Calendar,
  Power,
  CheckCircle,
  Save,
  Info,
  Edit3,
  Play,
  Music
} from 'lucide-react';

type AlarmToneId = 'urgent_alarm' | 'classic_bell' | 'melody_chime' | 'digital_ring' | 'custom';

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  saturday: { day: 'saturday', day_label: 'Saturday', day_label_bn: 'শনিবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  sunday: { day: 'sunday', day_label: 'Sunday', day_label_bn: 'রবিবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  monday: { day: 'monday', day_label: 'Monday', day_label_bn: 'সোমবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  tuesday: { day: 'tuesday', day_label: 'Tuesday', day_label_bn: 'মঙ্গলবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  wednesday: { day: 'wednesday', day_label: 'Wednesday', day_label_bn: 'বুধবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  thursday: { day: 'thursday', day_label: 'Thursday', day_label_bn: 'বৃহস্পতিবার', is_open: true, open_time: '10:00', close_time: '23:30' },
  friday: { day: 'friday', day_label: 'Friday', day_label_bn: 'শুক্রবার', is_open: true, open_time: '10:00', close_time: '23:30' }
};

const DAYS_ORDER: Array<DaySchedule['day']> = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Helper to format order code cleanly by converting #FV- or FV- to clean order code digits
export const formatOrderDisplayCode = (code?: string): string => {
  if (!code) return '';
  return code.replace(/^#?FV-?/i, '');
};

// Helper to check if vendor is within scheduled open hours at given date
export const isVendorOpenBySchedule = (schedule?: WeeklySchedule): boolean => {
  if (!schedule) return true;
  const now = new Date();
  const dayNames: Array<DaySchedule['day']> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[now.getDay()];
  const todayRule = schedule[todayKey];
  if (!todayRule || !todayRule.is_open) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = (todayRule.open_time || '10:00').split(':').map(Number);
  const [closeH, closeM] = (todayRule.close_time || '23:30').split(':').map(Number);

  const startMinutes = (openH || 0) * 60 + (openM || 0);
  const endMinutes = (closeH || 0) * 60 + (closeM || 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Cross midnight e.g. 18:00 to 02:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

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
    setPasswordForUser,
    logoutUser,
    menuItems,
    updateMenuItem,
    modifyOrderItems
  } = useDelivery();

  // 1. Auth Form States
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'set_password'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // 2. Terminal UI States (All hooks at top of component)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_sound_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [alarmTone, setAlarmTone] = useState<AlarmToneId>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_alarm_tone') as AlarmToneId | null;
      return saved || 'urgent_alarm';
    } catch {
      return 'urgent_alarm';
    }
  });
  const [alarmRepeat, setAlarmRepeat] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_alarm_repeat');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [customAlarmAudio, setCustomAlarmAudio] = useState<{ name: string; dataUrl: string } | null>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_custom_alarm');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [alarmUploadError, setAlarmUploadError] = useState<string | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);

  // Vendor Auto-Close & Auto-Reopen Timer State
  // "vendor close dile 1day er jonno vendor close hoye jabe.too busy dile 1hour er jonno vendor close hoye jabe.1hour por auto open hoye jabe"
  const [vendorCloseInfo, setVendorCloseInfo] = useState<{
    reason: 'vendor_closed' | 'too_busy';
    closedUntil: number;
    durationMs: number;
    label: string;
    initiatedAt: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('foodiplace_vendor_close_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.closedUntil > Date.now()) {
          return parsed;
        } else {
          localStorage.removeItem('foodiplace_vendor_close_info');
        }
      }
    } catch {}
    return null;
  });

  // Active vendor: strictly the authenticated vendor matching phone or ID
  const authenticatedVendor = (currentUser && currentUser.role === 'vendor')
    ? (vendors.find(v => {
        if (!v) return false;
        if (v.id === currentUser.reference_id) return true;
        const vDigits = (v.phone || '').replace(/\D/g, '').slice(-10);
        const uDigits = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
        return Boolean(vDigits && uDigits && vDigits === uDigits);
      }) || currentVendor)
    : null;

  const activeVendor = authenticatedVendor;

  // Derive storeStatus directly from activeVendor database column: is_active
  // OPEN mode: is_active = true, is_paused = false
  // CLOSED mode: is_active = false, is_paused = false
  const storeStatus: 'online' | 'offline' = React.useMemo(() => {
    if (vendorCloseInfo) {
      return 'offline';
    }
    if (!activeVendor) return 'online';
    const isActive = activeVendor.is_active !== false && (activeVendor as any).is_active !== 'false' && (activeVendor as any).is_active !== 0;
    if (!isActive) return 'offline';
    return 'online';
  }, [activeVendor?.is_active, vendorCloseInfo]);

  // Handler to toggle vendor status and update database columns
  const handleToggleStoreStatus = async () => {
    if (!activeVendor) return;
    if (storeStatus === 'online') {
      // OPEN -> CLOSED: is_active = false, is_paused = false
      if (vendorCloseInfo) {
        setVendorCloseInfo(null);
        try { localStorage.removeItem('foodiplace_vendor_close_info'); } catch {}
      }
      await updateVendor(activeVendor.id, { is_active: false, is_paused: false });
    } else {
      // CLOSED -> OPEN: is_active = true, is_paused = false
      if (vendorCloseInfo) {
        setVendorCloseInfo(null);
        try { localStorage.removeItem('foodiplace_vendor_close_info'); } catch {}
      }
      await updateVendor(activeVendor.id, { is_active: true, is_paused: false });
    }
  };

  const [nowTime, setNowTime] = useState<number>(Date.now());

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
  const [riderPhoneInput, setRiderPhoneInput] = useState<string>('');
  const [selectedPrepMinutes, setSelectedPrepMinutes] = useState<number>(9);
  const [dummyOrders, setDummyOrders] = useState<Order[]>([]);

  // Modify Order Items Modal State & Handlers
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [modifyingOrder, setModifyingOrder] = useState<Order | null>(null);
  const [modifiedItems, setModifiedItems] = useState<any[]>([]);
  const [modifySearchQuery, setModifySearchQuery] = useState('');
  const [isSavingModify, setIsSavingModify] = useState(false);
  const [modifyToast, setModifyToast] = useState<string | null>(null);

  const handleOpenModifyModal = (ord: Order) => {
    const extractItems = (val: any): any[] | null => {
      if (!val) return null;
      if (Array.isArray(val) && val.length > 0) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items;
        } catch {}
      }
      if (typeof val === 'object' && Array.isArray(val.items) && val.items.length > 0) {
        return val.items;
      }
      return null;
    };

    let items = extractItems(ord.items)
      || extractItems((ord as any).order_items)
      || extractItems((ord as any).order_summary);

    if (!items || items.length === 0) {
      const keys = ['foodiplace_v3_orders', 'foodvibe_v3_orders', 'foodiplace_orders', 'foodhub_orders'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            const found = parsed.find((o: any) => o.id === ord.id || o.order_code === ord.order_code);
            const foundItems = extractItems(found?.items) || extractItems(found?.order_summary);
            if (foundItems && foundItems.length > 0) {
              items = foundItems;
              break;
            }
          }
        } catch {}
      }
    }

    if (!items || items.length === 0) {
      const foodTotal = ord.food_total || 0;
      if (foodTotal > 0) {
        items = [{
          id: `synth-${ord.id || ord.order_code}`,
          item_name: 'Food Order Item',
          item_price: foodTotal,
          quantity: 1,
          subtotal: foodTotal,
          selected_variations: []
        }];
      } else {
        items = [];
      }
    }

    const clonedItems = (items || []).map((it: any) => ({
      ...it,
      id: it.id || `mod-item-${Math.random().toString(36).substr(2, 9)}`,
      item_name: it.item_name || it.name || 'Food Item',
      item_price: Number(it.item_price || it.price || 0),
      quantity: Number(it.quantity || 1),
      subtotal: Number(it.subtotal || ((it.item_price || it.price || 0) * (it.quantity || 1))),
      selected_variations: Array.isArray(it.selected_variations)
        ? [...it.selected_variations]
        : (typeof it.selected_variations === 'string' && it.selected_variations.trim()
          ? it.selected_variations.split(',').map((s: string) => s.trim())
          : [])
    }));

    setModifyingOrder(ord);
    setModifiedItems(clonedItems);
    setModifySearchQuery('');
    setIsModifyModalOpen(true);
  };

  const handleIncrementModifiedItem = (idx: number) => {
    setModifiedItems(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      item.quantity = (item.quantity || 1) + 1;
      item.subtotal = item.quantity * item.item_price;
      next[idx] = item;
      return next;
    });
  };

  const handleDecrementModifiedItem = (idx: number) => {
    setModifiedItems(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      if ((item.quantity || 1) > 1) {
        item.quantity = (item.quantity || 1) - 1;
        item.subtotal = item.quantity * item.item_price;
        next[idx] = item;
      }
      return next;
    });
  };

  const handleRemoveModifiedItem = (idx: number) => {
    setModifiedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddItemFromMenu = (mItem: MenuItem) => {
    setModifiedItems(prev => {
      const existingIdx = prev.findIndex(it => (it.menu_item_id === mItem.id) || (it.item_name?.toLowerCase() === mItem.name.toLowerCase()));
      if (existingIdx !== -1) {
        const next = [...prev];
        const existing = { ...next[existingIdx] };
        existing.quantity = (existing.quantity || 1) + 1;
        existing.subtotal = existing.quantity * existing.item_price;
        next[existingIdx] = existing;
        return next;
      }

      const price = Number(mItem.price || 0);
      const newItem = {
        id: `added-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menu_item_id: mItem.id,
        item_name: mItem.name,
        item_price: price,
        quantity: 1,
        subtotal: price,
        selected_variations: []
      };
      return [...prev, newItem];
    });
  };

  const handleSaveOrderModification = async () => {
    if (!modifyingOrder) return;
    setIsSavingModify(true);
    try {
      await modifyOrderItems(modifyingOrder.id, modifiedItems);
      
      const newFoodTotal = modifiedItems.reduce((s, it) => s + (it.subtotal || (it.item_price * it.quantity)), 0);

      if (selectedReadyOrder && (selectedReadyOrder.id === modifyingOrder.id || selectedReadyOrder.order_code === modifyingOrder.order_code)) {
        const deliveryFee = selectedReadyOrder.order_type === 'pickup' ? 0 : (selectedReadyOrder.delivery_fee || 0);
        const discountAmount = selectedReadyOrder.discount_amount || 0;
        const platformFee = selectedReadyOrder.platform_fee || 0;
        const taxFee = selectedReadyOrder.tax_fee || 0;
        const vatFee = selectedReadyOrder.vat_fee || 0;
        const newTotalCashPayable = Math.max(0, newFoodTotal - discountAmount + deliveryFee + platformFee + taxFee + vatFee);

        setSelectedReadyOrder(prev => prev ? {
          ...prev,
          food_total: newFoodTotal,
          total_cash_payable: newTotalCashPayable,
          items: modifiedItems,
          order_summary: { items: modifiedItems }
        } : null);
      }

      if (selectedAcceptOrder && (selectedAcceptOrder.id === modifyingOrder.id || selectedAcceptOrder.order_code === modifyingOrder.order_code)) {
        const deliveryFee = selectedAcceptOrder.order_type === 'pickup' ? 0 : (selectedAcceptOrder.delivery_fee || 0);
        const discountAmount = selectedAcceptOrder.discount_amount || 0;
        const platformFee = selectedAcceptOrder.platform_fee || 0;
        const taxFee = selectedAcceptOrder.tax_fee || 0;
        const vatFee = selectedAcceptOrder.vat_fee || 0;
        const newTotalCashPayable = Math.max(0, newFoodTotal - discountAmount + deliveryFee + platformFee + taxFee + vatFee);

        setSelectedAcceptOrder(prev => prev ? {
          ...prev,
          food_total: newFoodTotal,
          total_cash_payable: newTotalCashPayable,
          items: modifiedItems,
          order_summary: { items: modifiedItems }
        } : null);
      }

      setModifyToast('অর্ডার পরিবর্তন সফলভাবে সেভ করা হয়েছে!');
      setTimeout(() => setModifyToast(null), 3000);
      setIsModifyModalOpen(false);
    } catch (err) {
      console.error('Failed to save order modifications:', err);
    } finally {
      setIsSavingModify(false);
    }
  };

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
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [weeklyScheduleDraft, setWeeklyScheduleDraft] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [isPermanentlyClosed, setIsPermanentlyClosed] = useState<boolean>(false);
  const [scheduleSaveFeedback, setScheduleSaveFeedback] = useState<string | null>(null);
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

  // Discount & Free Delivery Campaign Modal States
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignDiscountPct, setCampaignDiscountPct] = useState<number>(0);
  const [campaignDiscountTag, setCampaignDiscountTag] = useState<string>('');
  const [campaignIsFreeDelivery, setCampaignIsFreeDelivery] = useState<boolean>(false);
  const [campaignFreeDeliveryMinOrder, setCampaignFreeDeliveryMinOrder] = useState<number>(0);
  const [campaignSaveFeedback, setCampaignSaveFeedback] = useState<string | null>(null);

  const openCampaignModal = () => {
    if (!activeVendor) return;
    const minVal = Number(activeVendor.free_delivery_min_order) || 0;
    const isFree = Boolean(activeVendor.is_free_delivery) || minVal > 0;
    setCampaignDiscountPct(activeVendor.discount_percentage || 0);
    setCampaignDiscountTag(activeVendor.discount_title || (activeVendor.discount_percentage ? `${activeVendor.discount_percentage}% OFF` : ''));
    setCampaignIsFreeDelivery(isFree);
    setCampaignFreeDeliveryMinOrder(minVal);
    setCampaignSaveFeedback(null);
    setIsCampaignModalOpen(true);
  };

  const handleSaveDiscountCampaign = async () => {
    if (!activeVendor) return;
    const finalPct = campaignDiscountPct > 0 ? campaignDiscountPct : 0;
    const finalTag = finalPct > 0 ? (campaignDiscountTag || `${finalPct}% OFF`) : '';
    const minOrderVal = Number(campaignFreeDeliveryMinOrder) || 0;
    const isFree = campaignIsFreeDelivery || minOrderVal > 0;
    const finalMinOrder = isFree ? minOrderVal : 0;

    await updateVendor(activeVendor.id, {
      discount_percentage: finalPct,
      discount_title: finalTag,
      is_free_delivery: isFree,
      free_delivery_min_order: finalMinOrder
    });

    setCampaignSaveFeedback('✅ Promo Campaign successfully saved to database!');
    setTimeout(() => {
      setCampaignSaveFeedback(null);
      setIsCampaignModalOpen(false);
    }, 1000);
  };

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

  const isAuthenticated = Boolean(currentUser && currentUser.role === 'vendor' && authenticatedVendor);

  // Filter orders strictly for active restaurant (including dummy test orders)
  const allOrdersList = [...dummyOrders, ...orders];
  const vendorOrders = activeVendor ? allOrdersList.filter((o) => o.vendor_id === activeVendor.id) : [];

  // Pending orders sorted chronologically (FIFO queue)
  const pendingOrders = vendorOrders
    .filter((o) => o.status === 'pending')
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

  // Total pending count for header badge (New 1, New 2, New 3, etc.)
  // Only ONE order is displayed in the New slot at a time; others queue in background serial order (FIFO)
  const displayedNewOrders = pendingOrders.slice(0, 1);
  const newOrders = displayedNewOrders;

  // For now, no orders come in 'Upcoming'
  const upcomingOrders: Order[] = [];

  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyOrders = vendorOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'food_picked_up');
  const acceptedOrders = vendorOrders.filter((o) => 
    o.status === 'vendor_accepted' || o.status === 'food_preparing' || o.status === 'ready_for_pickup' || o.status === 'food_picked_up'
  );
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

  // Auth Handlers (Login & Password Setup)
  const handleVendorLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authPhone.trim() || !authPassword.trim()) {
      setAuthError('Please enter both phone number and password.');
      return;
    }
    const res = loginUser('vendor', authPhone.trim(), authPassword.trim());
    if (!res.success) {
      if (res.requiresPasswordSetup) {
        setAuthMode('set_password');
        setAuthError('First-time login detected. Please set your password below.');
      } else {
        setAuthError(res.message || 'Login failed. Please check phone and password.');
      }
    }
  };

  const handleVendorSetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authPhone.trim() || !newPassword.trim()) {
      setAuthError('Please enter phone number and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }

    const ok = setPasswordForUser('vendor', authPhone.trim(), newPassword.trim());
    if (!ok) {
      setAuthError('This phone number is not registered as a Vendor by Admin.');
    } else {
      setAuthMode('login');
      setAuthPassword(newPassword.trim());
    }
  };

  const audioCtxRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Unlock Web Audio API on first user gesture
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch {
        // Ignore audio unlock errors
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, []);

  // Persist alarm settings
  useEffect(() => {
    try {
      localStorage.setItem('foodiplace_vendor_sound_enabled', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('foodiplace_vendor_alarm_tone', alarmTone);
    } catch {}
  }, [alarmTone]);

  useEffect(() => {
    try {
      localStorage.setItem('foodiplace_vendor_alarm_repeat', String(alarmRepeat));
    } catch {}
  }, [alarmRepeat]);

  const handleCustomAlarmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlarmUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAlarmUploadError('অডিও ফাইল ২ MB এর কম হতে হবে (File must be under 2MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const payload = { name: file.name, dataUrl: reader.result };
        try {
          localStorage.setItem('foodiplace_vendor_custom_alarm', JSON.stringify(payload));
          setCustomAlarmAudio(payload);
          setAlarmTone('custom');
        } catch {
          setAlarmUploadError('ফাইল সেভ করা যায়নি, ছোট অডিও ফাইল দিন।');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Sound Synthesizer & Custom Audio Player
  const playNewOrderSound = (overrideTone?: AlarmToneId, forcePlay: boolean = false) => {
    if (!soundEnabled && !forcePlay) return;
    const toneToPlay = overrideTone || alarmTone;

    if (toneToPlay === 'custom' && customAlarmAudio?.dataUrl) {
      try {
        if (customAudioRef.current) {
          customAudioRef.current.pause();
          customAudioRef.current.currentTime = 0;
        }
        const audio = new Audio(customAlarmAudio.dataUrl);
        customAudioRef.current = audio;
        audio.play().catch(() => {});
        return;
      } catch {
        // Fallback to synthesized tone if custom audio fails
      }
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      if (toneToPlay === 'urgent_alarm') {
        // 3-pulse loud kitchen alarm
        [0, 0.24, 0.48].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1046.5, now + offset);
          osc.frequency.setValueAtTime(1396.9, now + offset + 0.09);
          gain.gain.setValueAtTime(0.28, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.21);
        });
      } else if (toneToPlay === 'melody_chime') {
        // 4-note ascending pleasant chime
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = now + idx * 0.11;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.32, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      } else if (toneToPlay === 'digital_ring') {
        // Rapid dual-tone POS ring
        [0, 0.16, 0.32, 0.48].forEach((offset) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'square';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(940, now + offset);
          osc2.frequency.setValueAtTime(1200, now + offset);
          gain.gain.setValueAtTime(0.2, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now + offset);
          osc2.start(now + offset);
          osc1.stop(now + offset + 0.13);
          osc2.stop(now + offset + 0.13);
        });
      } else {
        // classic_bell (default)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(1320, now + 0.15);

        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(660, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.68);
        osc2.stop(now + 0.68);
      }
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

  // Continuous repeat alarm while pending orders exist
  useEffect(() => {
    if (!soundEnabled || !alarmRepeat || pendingOrders.length === 0) return;
    const interval = setInterval(() => {
      playNewOrderSound();
    }, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled, alarmRepeat, pendingOrders.length, alarmTone, customAlarmAudio]);

  // Auto-accept if enabled
  useEffect(() => {
    if (autoAccept && pendingOrders.length > 0) {
      pendingOrders.forEach((o) => {
        vendorAcceptOrderWithPrepTime(o.id, 15);
      });
    }
  }, [autoAccept, pendingOrders]);

  // Keep active modals in sync with live orders array
  useEffect(() => {
    if (selectedAcceptOrder) {
      const match = vendorOrders.find(o => o.id === selectedAcceptOrder.id);
      if (match) {
        const currentItemsCount = selectedAcceptOrder.items?.length || 0;
        const matchItemsCount = match.items?.length || 0;
        if (matchItemsCount > currentItemsCount || match.status !== selectedAcceptOrder.status) {
          const mergedItems = (match.items && match.items.length > 0)
            ? match.items
            : (selectedAcceptOrder.items && selectedAcceptOrder.items.length > 0 ? selectedAcceptOrder.items : []);
          setSelectedAcceptOrder({ ...match, items: mergedItems });
        }
      }
    }
    if (selectedReadyOrder) {
      const match = vendorOrders.find(o => o.id === selectedReadyOrder.id);
      if (match) {
        const currentItemsCount = selectedReadyOrder.items?.length || 0;
        const matchItemsCount = match.items?.length || 0;
        if (matchItemsCount > currentItemsCount || match.status !== selectedReadyOrder.status) {
          setSelectedReadyOrder(match);
        }
      }
    }
  }, [orders, vendorOrders]);

  const handleMarkFoodReady = (orderId: string) => {
    vendorMarkFoodReady(orderId);
    setDummyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready_for_pickup' } : o));
    setSelectedReadyOrder(prev => prev && prev.id === orderId ? { ...prev, status: 'ready_for_pickup' } : prev);
  };

  const handleHandoverToRider = (orderId: string, phone: string) => {
    const trimmed = phone.trim();
    updateOrderStatus(orderId, 'food_picked_up', { rider_phone: trimmed });
    setDummyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'food_picked_up', rider_phone: trimmed } : o));
    setSelectedReadyOrder(null);
    setRiderPhoneInput('');
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

  // Compact WhatsApp order share message with Google Map pinpoint links
  const generateOrderWhatsAppMessage = (order: Order, vendor: Vendor | null) => {
    const vLat = vendor?.latitude || 22.3569;
    const vLng = vendor?.longitude || 91.7832;
    const vendorMapUrl = (vendor?.latitude && vendor?.longitude)
      ? `https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor?.address || vendor?.name || 'Restaurant')}`;

    const cLat = order.delivery_latitude;
    const cLng = order.delivery_longitude;
    const customerMapUrl = (cLat && cLng)
      ? `https://www.google.com/maps?q=${cLat},${cLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || 'Delivery Address')}`;

    const itemsList = (order.items && order.items.length > 0)
      ? order.items.map((it) => {
          const portion = it.selected_portion ? ` (${it.selected_portion})` : '';
          const variations = it.selected_variations && it.selected_variations.length > 0 ? ` [${it.selected_variations.join(', ')}]` : '';
          const price = `৳${it.subtotal || (it.item_price * it.quantity)}`;
          const note = it.special_instructions ? ` (নোট: ${it.special_instructions})` : '';
          return `• ${it.quantity}x ${it.item_name}${portion}${variations} - ${price}${note}`;
        }).join('\n')
      : '• No items';

    const text = 
`*অর্ডার কোড: #${formatOrderDisplayCode(order.order_code)}* | *মোট: ৳${order.total_cash_payable || 0}*
━━━━━━━━━━━━━━━━━━
🏪 *${vendor?.name || 'Restaurant'}* (${vendor?.phone || 'N/A'})
📍 ভেন্ডর ম্যাপ: ${vendorMapUrl}

👤 *${order.customer_name || 'Customer'}* (${order.customer_phone || 'N/A'})
🏠 ${order.delivery_address || 'N/A'}
📍 কাস্টমার ম্যাপ: ${customerMapUrl}
${order.special_instructions ? `📝 কাস্টমার নোট: ${order.special_instructions}\n` : ''}${order.unavailable_action ? `⚠️ আইটেম না থাকলে: ${order.unavailable_action === 'call' ? '📞 কাস্টমারকে কল করুন' : '❌ অর্ডার থেকে বাদ দিন'}\n` : ''}━━━━━━━━━━━━━━━━━━
🛒 *আইটেম:*
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 খাবার: ৳${order.food_total || 0} | ডেলিভারি: ৳${order.delivery_fee || 0}${order.discount_amount ? ` | ছাড়: -৳${order.discount_amount}` : ''}
💵 *সর্বমোট ক্যাশ কালেকশন (COD): ৳${order.total_cash_payable || 0}*${order.rider_phone ? `\n🚴 রাইডার: ${order.rider_phone}` : ''}`.trim();

    return text;
  };

  const handleShareOrderToWhatsApp = (order: Order) => {
    const text = generateOrderWhatsAppMessage(order, activeVendor);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    
    // On mobile devices, window.location.href opens the WhatsApp app directly.
    // On desktop, window.open opens WhatsApp Web.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Auto-open timer & weekly schedule evaluation:
  // 1. Checks auto-timer (1 hour for 'Too busy', 24 hours for 'Vendor closed')
  // 2. Evaluates 1-week opening/closing schedule: auto-opens and auto-closes according to set times
  // 3. Respects permanent close: if vendor permanently closed, stays closed until manually reopened
  useEffect(() => {
    if (activeVendor) {
      if (activeVendor.opening_schedule) {
        setWeeklyScheduleDraft(activeVendor.opening_schedule);
      } else {
        try {
          const localSaved = localStorage.getItem(`foodiplace_vendor_schedule_${activeVendor.id}`);
          if (localSaved) {
            setWeeklyScheduleDraft(JSON.parse(localSaved));
          } else {
            setWeeklyScheduleDraft(DEFAULT_WEEKLY_SCHEDULE);
          }
        } catch {
          setWeeklyScheduleDraft(DEFAULT_WEEKLY_SCHEDULE);
        }
      }
      setIsPermanentlyClosed(Boolean(activeVendor.is_permanently_closed));
    }
  }, [activeVendor?.id, activeVendor?.opening_schedule, activeVendor?.is_permanently_closed]);

  // Background timer for clock and expiration check only (no automatic schedule override of manual close)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNowTime(current);

      if (!activeVendor) return;

      // Check if timed pause / closure is active
      if (vendorCloseInfo) {
        if (current >= vendorCloseInfo.closedUntil) {
          // Time expired -> Auto open!
          setVendorCloseInfo(null);
          try {
            localStorage.removeItem('foodiplace_vendor_close_info');
          } catch {}
          updateVendor(activeVendor.id, { is_active: true, is_paused: false });
        }
        return;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [vendorCloseInfo, activeVendor, updateVendor]);

  // Handler to open weekly schedule modal
  const handleOpenScheduleModal = () => {
    if (activeVendor) {
      if (activeVendor.opening_schedule) {
        setWeeklyScheduleDraft(activeVendor.opening_schedule);
      }
      setIsPermanentlyClosed(Boolean(activeVendor.is_permanently_closed));
    }
    setScheduleSaveFeedback(null);
    setIsScheduleModalOpen(true);
  };

  // Handler to save weekly schedule
  const handleSaveWeeklySchedule = async () => {
    if (!activeVendor) return;
    try {
      localStorage.setItem(`foodiplace_vendor_schedule_${activeVendor.id}`, JSON.stringify(weeklyScheduleDraft));
    } catch {}

    const shouldBeOpenNow = !isPermanentlyClosed && isVendorOpenBySchedule(weeklyScheduleDraft);

    await updateVendor(activeVendor.id, {
      opening_schedule: weeklyScheduleDraft,
      is_permanently_closed: isPermanentlyClosed,
      is_active: shouldBeOpenNow,
      is_paused: false
    });

    setScheduleSaveFeedback('✅ ১ সপ্তাহের শিডিউল সফলভাবে সেভ হয়েছে!');
    setTimeout(() => {
      setScheduleSaveFeedback(null);
      setIsScheduleModalOpen(false);
    }, 1200);
  };

  // Handler to toggle permanent close
  const handleTogglePermanentClose = async (closed: boolean) => {
    setIsPermanentlyClosed(closed);
    if (!activeVendor) return;

    if (closed) {
      setVendorCloseInfo(null);
      try {
        localStorage.removeItem('foodiplace_vendor_close_info');
      } catch {}
      await updateVendor(activeVendor.id, {
        is_permanently_closed: true,
        is_active: false,
        is_paused: false
      });
    } else {
      // Reopening manually from permanent close
      const shouldBeOpen = isVendorOpenBySchedule(weeklyScheduleDraft);
      await updateVendor(activeVendor.id, {
        is_permanently_closed: false,
        is_active: shouldBeOpen,
        is_paused: false
      });
    }
  };

  // Timed decline handler (1 day for 'Vendor closed', 1 hour for 'Too busy')
  const handleConfirmDeclineWithTimer = (reason: 'Vendor closed' | 'Too busy') => {
    const isOneDay = reason === 'Vendor closed';
    const durationMs = isOneDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 1 day vs 1 hour
    const closedUntil = Date.now() + durationMs;

    const timerData = {
      reason: isOneDay ? ('vendor_closed' as const) : ('too_busy' as const),
      closedUntil,
      durationMs,
      label: isOneDay ? 'Closed for 1 day (24 hours)' : 'Paused for 1 hour (Too busy)',
      initiatedAt: Date.now()
    };

    setVendorCloseInfo(timerData);
    try {
      localStorage.setItem('foodiplace_vendor_close_info', JSON.stringify(timerData));
    } catch {}

    if (activeVendor) {
      updateVendor(activeVendor.id, {
        is_active: isOneDay ? false : true,
        is_paused: isOneDay ? false : true
      });
    }

    handleConfirmReject(reason);
    setDeclineConfirmModal(null);
  };

  // Manual reopen helper
  const handleReopenStoreManually = () => {
    setVendorCloseInfo(null);
    try {
      localStorage.removeItem('foodiplace_vendor_close_info');
    } catch {}
    if (activeVendor) {
      updateVendor(activeVendor.id, { is_active: true, is_paused: false });
    }
  };

  // Formatter for countdown
  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return '0s';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatShortCountdown = (ms: number) => {
    if (ms <= 0) return '0s';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    const seconds = totalSec % 60;
    return `${minutes}m ${seconds}s`;
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

  if (!currentUser || currentUser.role !== 'vendor' || !activeVendor) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 selection:bg-[#d70f64] selection:text-white font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 border border-slate-100">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-pink-100 text-[#d70f64] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Store className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Orders Terminal
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              ভেন্ডর সাইটের ফোন নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন
            </p>
          </div>

          <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-black">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                authMode === 'login' ? 'bg-white text-[#d70f64] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Partner Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('set_password'); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                authMode === 'set_password' ? 'bg-white text-[#d70f64] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Set Password
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl animate-in fade-in flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleVendorLoginSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-700 uppercase tracking-wider text-[10px]">
                  Phone Number (ফোন নম্বর)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="e.g. 01711122233"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:border-[#d70f64] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase tracking-wider text-[10px]">
                  Password (পাসওয়ার্ড)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter vendor password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#d70f64] text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#d70f64] hover:bg-[#b00c52] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-pink-600/30 transition cursor-pointer active:scale-95"
              >
                Login to Orders Terminal
              </button>
            </form>
          ) : (
            <form onSubmit={handleVendorSetPasswordSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-700 uppercase tracking-wider text-[10px]">
                  Admin Registered Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="e.g. 01711122233"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:border-[#d70f64] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase tracking-wider text-[10px]">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#d70f64] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase tracking-wider text-[10px]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#d70f64] text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#d70f64] hover:bg-[#b00c52] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-pink-600/30 transition cursor-pointer active:scale-95"
              >
                Set Password & Log In
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              ভেন্ডর পোর্টালে ব্যবহৃত ফোন নম্বর ও পাসওয়ার্ড দিয়ে অর্ডার টার্মিনালে লগইন হবে।
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased selection:bg-[#d70f64] selection:text-white w-full">
      <div className="w-full min-h-screen bg-white flex flex-col overflow-hidden relative">
        
        {/* 
          ========================================================================
          TOP HEADER (100% Matching Sample Image 2)
          Hamburger Menu ≡ (left) | Storefront with Clock + ● OPEN Pill (right)
          ========================================================================
        */}
        <header className="px-4 sm:px-6 lg:px-8 pt-5 pb-4 flex items-center justify-between bg-white shrink-0 border-b border-slate-100 w-full">
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
          <div className="flex items-center space-x-3">
            {/* Storefront with Clock Badge: Opens 1-week schedule & permanent close modal */}
            <button
              onClick={handleOpenScheduleModal}
              className="relative text-slate-800 hover:text-black transition cursor-pointer active:scale-95"
              title="Click to view & edit Weekly Opening/Closing Schedule"
            >
              <Store className="w-6 h-6 stroke-[1.8]" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 stroke-[2.2] text-[#d70f64]" />
              </div>
            </button>

            {/* Status Pill: ● Live countdown, PERMANENT CLOSED, or OPEN / BUSY / PAUSED */}
            {vendorCloseInfo ? (
              <button
                onClick={handleReopenStoreManually}
                className="bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100 border shadow-2xs rounded-full px-3 py-1.5 flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
                title="Store auto-closing active. Click to reopen store immediately"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-rose-500" />
                <span className="text-xs font-black tracking-wider uppercase">
                  CLOSED
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-800">
                  {formatShortCountdown(Math.max(0, vendorCloseInfo.closedUntil - nowTime))}
                </span>
              </button>
            ) : isPermanentlyClosed || activeVendor?.is_permanently_closed ? (
              <button
                onClick={handleOpenScheduleModal}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 shadow-2xs rounded-full px-3 py-1.5 flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
                title="Store permanently closed. Click to change schedule or reopen"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span className="text-xs font-black tracking-wider uppercase">
                  PERMANENT CLOSED
                </span>
              </button>
            ) : (
              <button
                onClick={handleToggleStoreStatus}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs rounded-full px-3.5 py-1.5 flex items-center space-x-2 transition cursor-pointer active:scale-95"
                title="Click to toggle store status (OPEN / CLOSED)"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    storeStatus === 'online'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                  {storeStatus === 'online' ? 'OPEN' : 'CLOSED'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Permanent Closed Notice Banner */}
        {(isPermanentlyClosed || activeVendor?.is_permanently_closed) && !vendorCloseInfo && (
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 text-rose-950 flex items-center justify-between text-xs sm:text-sm animate-in slide-in-from-top duration-200 shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center shrink-0">
                <Power className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-black text-xs sm:text-sm text-rose-900 leading-tight">
                  🔒 Vendor Permanently Closed
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5 font-medium leading-tight">
                  ম্যানুয়ালি ওপেন না করা পর্যন্ত স্টোর সম্পূর্ণ বন্ধ থাকবে।
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePermanentClose(false)}
              className="px-3 py-1.5 rounded-xl font-black text-xs bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition shrink-0 cursor-pointer"
            >
              Open Store
            </button>
          </div>
        )}

        {/* 
          Auto-reopen banner when store is closed for 1 day or 1 hour
          "vendor close dile 1day er jonno vendor close hoye jabe.
           too busy dile 1hour er jonno vendor close hoye jabe.
           1hour por auto open hoye jabe"
        */}
        {vendorCloseInfo && (
          <div
            className={`px-4 py-3 border-b flex items-center justify-between text-xs sm:text-sm animate-in slide-in-from-top duration-200 shrink-0 ${
              vendorCloseInfo.reason === 'too_busy'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  vendorCloseInfo.reason === 'too_busy'
                    ? 'bg-amber-200/90 text-amber-900'
                    : 'bg-rose-200/90 text-rose-900'
                }`}
              >
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span>
                    {vendorCloseInfo.reason === 'too_busy'
                      ? '⏸️ Store paused for 1 hour'
                      : '🔒 Store closed for 1 day'}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white shadow-2xs border border-current font-black">
                    Auto-reopens in {formatRemainingTime(Math.max(0, vendorCloseInfo.closedUntil - nowTime))}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5 font-medium">
                  {vendorCloseInfo.reason === 'too_busy'
                    ? 'Auto-reopening in 1 hour after declining busy order.'
                    : 'Auto-reopening in 24 hours after declining closed order.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReopenStoreManually}
              className="px-3 py-1.5 rounded-xl font-black text-xs bg-white text-slate-900 border border-slate-200 shadow-2xs hover:bg-slate-100 active:scale-95 transition shrink-0 cursor-pointer"
            >
              Reopen Now
            </button>
          </div>
        )}

        {/* 
          ========================================================================
          MAIN ORDER DASHBOARD (100% Matching Sample Image 2)
          Row 1: [ New 0 ] | [ Upcoming 0 ]
          Row 2: [ Accepted 0 ]
          ========================================================================
        */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 pt-4 pb-12 overflow-y-auto">
          {/* Row 1: Two Column Grid (New & Upcoming) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* 1. New Orders Column */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">New</h2>
                <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{pendingOrders.length}</span>
              </div>

              {newOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
                  <span className="text-sm font-bold text-slate-800">No new orders</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {newOrders.map((order, idx) => {
                    const serialNumber = (order.order_code && order.order_code !== '00')
                      ? formatOrderDisplayCode(order.order_code)
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
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block mb-1">
                          Order Code
                        </span>
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
                <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{upcomingOrders.length}</span>
              </div>

              {upcomingOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
                  <span className="text-sm font-bold text-slate-800 leading-snug">
                    No upcoming<br />orders
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingOrders.map((order, idx) => {
                    const serialNumber = (order.order_code && order.order_code !== '00')
                      ? formatOrderDisplayCode(order.order_code)
                      : String(idx + 2).padStart(2, '0');
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
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block mb-1">
                          Order Code
                        </span>
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

          </div>

          {/* Row 2: Accepted Orders Section (Matching Sample Image 2) */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center space-x-1.5 mb-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Accepted</h2>
              <span className="text-2xl sm:text-3xl font-black text-[#d70f64]">{acceptedOrders.length}</span>
            </div>

            {acceptedOrders.length === 0 ? (
              <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 min-h-[140px] flex items-center justify-center text-center border border-slate-100 shadow-2xs mt-3">
                <span className="text-sm font-bold text-slate-800">No accepted orders</span>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {acceptedOrders.map((order) => {
                  const totalItems = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
                  const itemLabel = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
                  const isTest = order.id.startsWith('test-') || order.order_code === '00' || order.order_code === '01';
                  const isReady = order.status === 'ready_for_pickup' || order.status === 'food_picked_up';

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedReadyOrder(order);
                        setRiderPhoneInput(order.rider_phone || '');
                      }}
                      className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100/90 hover:shadow-md transition-all cursor-pointer select-none space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Vertical pink/blue bar */}
                          <div className={`w-1.5 h-10 ${isReady ? 'bg-blue-600' : 'bg-[#d70f64]'} rounded-full shrink-0`} />
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Order Code
                            </span>
                            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans leading-none">
                              #{formatOrderDisplayCode(order.order_code)}
                            </h3>
                            <p className="text-sm font-bold text-slate-800 mt-1.5">
                              {order.customer_phone || 'XXXX-1234'} • {itemLabel}
                            </p>
                          </div>
                        </div>

                        {/* Badge */}
                        <span className={`font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          isTest ? 'bg-rose-50 text-[#d70f64]' : isReady ? 'bg-blue-50 text-blue-700 border border-blue-200' : order.order_type === 'pickup' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-[#d70f64]'
                        }`}>
                          {isTest ? 'TEST ORDER' : isReady ? 'READY (RIDER PICKUP)' : (order.order_type === 'pickup' ? 'PICKUP' : 'DELIVERY')}
                        </span>
                      </div>

                      {/* Bottom Right: Prep Time or Handover button + WhatsApp Share */}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          {isReady ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReadyOrder(order);
                                setRiderPhoneInput(order.rider_phone || '');
                              }}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                            >
                              {order.rider_phone ? `Handover (Rider: ${order.rider_phone})` : 'Handover to Rider'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 font-semibold">
                              Preparing food
                            </span>
                          )}
                          {isReady && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareOrderToWhatsApp(order);
                              }}
                              className="p-1 px-2.5 text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-95 rounded-lg transition cursor-pointer shadow-2xs flex items-center space-x-1 text-xs font-bold"
                              title="WhatsApp এ শেয়ার করুন"
                            >
                              <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                                <path d="M265 158V64l207 156-207 156v-96c-100 0-173 64-219 166 10-190 94-282 219-282z" fill="white" />
                              </svg>
                              <span className="text-[11px] font-bold">Share</span>
                            </button>
                          )}
                        </div>
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
                    openCampaignModal();
                  }}
                  className="w-full text-left hover:text-black transition cursor-pointer flex items-center justify-between"
                >
                  <span>Ads & Restaurant Booster</span>
                  <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">OFFERS</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenScheduleModal();
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Weekly Schedule & Hours
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openVendorProfileModal();
                  }}
                  className="block w-full text-left hover:text-black transition cursor-pointer"
                >
                  Restaurant Profile
                </button>

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
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="block w-full text-left text-rose-600 hover:text-rose-700 font-bold transition cursor-pointer flex items-center space-x-2"
                >
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span>Logout (লগআউট)</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* LOGOUT CONFIRMATION MODAL */}
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-slate-100">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <LogOut className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">
                  লগআউট করতে চান?
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  আপনি কি নিশ্চিতভাবে এই অর্ডার টার্মিনাল থেকে লগআউট করতে চান?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLogoutConfirmOpen(false);
                    setIsDrawerOpen(false);
                    logoutUser();
                  }}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  লগআউট (Logout)
                </button>
              </div>
            </div>
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
                  Order Code: #{formatOrderDisplayCode(selectedAcceptOrder.order_code)}
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  {selectedAcceptOrder.order_type === 'pickup' ? (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-[#d70f64]" />
                      <span>Foodiplace Pickup</span>
                    </>
                  ) : (
                    <>
                      <Bike className="w-3.5 h-3.5 text-[#d70f64]" />
                      <span>Foodiplace Delivery</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleOpenModifyModal(selectedAcceptOrder)}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center space-x-1 cursor-pointer shadow-xs active:scale-95"
                title="Modify Order Items"
              >
                <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Modify</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeclineOrder(selectedAcceptOrder)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                Decline
              </button>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 pb-28">
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
            {(() => {
              const rawNote = selectedAcceptOrder.special_instructions || '';
              const cleanNote = rawNote
                .replace(/\[Payment:[^\]]+\]/gi, '')
                .replace(/\[Delivery:[^\]]+\]/gi, '')
                .replace(/\[Rider Tip:[^\]]+\]/gi, '')
                .replace(/\[Priority Delivery[^\]]+\]/gi, '')
                .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
                .trim();
              const displayNote = cleanNote || rawNote;
              if (!displayNote) return null;

              return (
                <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Customer Note / Special Request
                    </h4>
                    <p className="text-sm sm:text-base font-extrabold text-amber-950 mt-0.5 leading-snug break-words break-all whitespace-pre-wrap">
                      {displayNote}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* If product unavailable preference */}
            {selectedAcceptOrder.unavailable_action && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs">
                <span className="text-slate-600">If item is unavailable:</span>
                <span className={`px-2.5 py-1 rounded-lg font-extrabold uppercase text-[11px] ${
                  selectedAcceptOrder.unavailable_action === 'call'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-rose-100 text-[#d70f64] border border-rose-200'
                }`}>
                  {selectedAcceptOrder.unavailable_action === 'call' ? '📞 Call customer' : 'Remove from order'}
                </span>
              </div>
            )}

            {/* 3. ORDER SUMMARY WINDOW (100% Exact match to Checkout Order summary window) */}
            {(() => {
              const liveMatch = allOrdersList.find(o => o.id === selectedAcceptOrder.id || o.order_code === selectedAcceptOrder.order_code);
              
              const extractItems = (val: any): any[] | null => {
                if (!val) return null;
                if (Array.isArray(val) && val.length > 0) return val;
                if (typeof val === 'string') {
                  try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items;
                  } catch {}
                }
                if (typeof val === 'object' && Array.isArray(val.items) && val.items.length > 0) {
                  return val.items;
                }
                return null;
              };

              let acceptItems = extractItems(selectedAcceptOrder.items)
                || extractItems(liveMatch?.items)
                || extractItems((selectedAcceptOrder as any).order_items)
                || extractItems((liveMatch as any)?.order_items)
                || extractItems((selectedAcceptOrder as any).order_summary)
                || extractItems((liveMatch as any)?.order_summary);

              if (!acceptItems || acceptItems.length === 0) {
                const keys = ['foodiplace_v3_orders', 'foodvibe_v3_orders', 'foodiplace_orders', 'foodhub_orders'];
                for (const k of keys) {
                  try {
                    const rawOrders = localStorage.getItem(k);
                    if (rawOrders) {
                      const parsedOrders = JSON.parse(rawOrders);
                      const found = parsedOrders.find((o: any) => o.id === selectedAcceptOrder.id || o.order_code === selectedAcceptOrder.order_code);
                      const foundItems = extractItems(found?.items) || extractItems(found?.order_summary);
                      if (foundItems && foundItems.length > 0) {
                        acceptItems = foundItems;
                        break;
                      }
                    }
                  } catch {}
                }
              }

              const initialFoodTotal = selectedAcceptOrder.food_total || 0;
              if ((!acceptItems || acceptItems.length === 0) && initialFoodTotal > 0) {
                acceptItems = [{
                  id: `synth-${selectedAcceptOrder.id || selectedAcceptOrder.order_code}`,
                  item_name: 'Food Order Item',
                  item_price: initialFoodTotal,
                  quantity: 1,
                  subtotal: initialFoodTotal,
                  selected_variations: []
                }];
              }

              acceptItems = (acceptItems || []).map((it: any) => ({
                ...it,
                item_name: it.item_name || it.name || 'Food Item',
                item_price: Number(it.item_price || it.price || 0),
                quantity: Number(it.quantity || 1),
                subtotal: Number(it.subtotal || ((it.item_price || it.price || 0) * (it.quantity || 1))),
                selected_variations: Array.isArray(it.selected_variations)
                  ? it.selected_variations
                  : (typeof it.selected_variations === 'string' && it.selected_variations.trim()
                    ? it.selected_variations.split(',').map((s: string) => s.trim())
                    : [])
              }));

              const itemsSubtotalSum = acceptItems.reduce((s, it) => s + (it.subtotal || ((it.item_price || 0) * (it.quantity || 1))), 0);
              const subtotalVal = selectedAcceptOrder.food_total || itemsSubtotalSum;
              const discountAmountVal = selectedAcceptOrder.discount_amount || liveMatch?.discount_amount || 0;
              const deliveryFeeVal = selectedAcceptOrder.order_type === 'pickup' ? 0 : (selectedAcceptOrder.delivery_fee || 0);
              const platformFeeVal = selectedAcceptOrder.platform_fee || liveMatch?.platform_fee || 0;
              const taxFeeVal = selectedAcceptOrder.tax_fee || liveMatch?.tax_fee || 0;
              const vatFeeVal = selectedAcceptOrder.vat_fee || liveMatch?.vat_fee || 0;
              const totalPayableVal = selectedAcceptOrder.total_cash_payable || (subtotalVal - discountAmountVal + deliveryFeeVal + platformFeeVal + taxFeeVal + vatFeeVal);

              return (
                <section className="space-y-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-950 tracking-tight">
                      Order summary
                    </h2>
                    <span className="text-xs font-bold text-slate-400">
                      Live Order
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2.5 pb-3 border-b border-slate-100">
                    {acceptItems.length > 0 ? (
                      acceptItems.map((item, idx) => {
                        const itemSubtotal = item.subtotal || ((item.item_price || 0) * (item.quantity || 1));
                        const variations = Array.isArray(item.selected_variations)
                          ? item.selected_variations.join(' • ')
                          : (item.selected_variations || '');

                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2 min-w-0 pr-2">
                                <span className="font-black text-slate-950 text-sm font-mono shrink-0">
                                  {item.quantity || 1}x
                                </span>
                                <span className="font-bold text-slate-800 truncate">
                                  {item.item_name}
                                </span>
                              </div>
                              <span className="font-black text-slate-950 font-mono shrink-0">
                                Tk {itemSubtotal}
                              </span>
                            </div>
                            {variations && (
                              <p className="text-xs text-slate-500 font-medium pl-6">
                                {variations}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-xs font-bold text-slate-400">
                        No item details provided
                      </div>
                    )}
                  </div>

                  {/* Price Calculation breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold">Tk {subtotalVal}</span>
                    </div>

                    {discountAmountVal > 0 && (
                      <div className="flex justify-between text-[#e21b70] font-extrabold">
                        <span className="flex items-center space-x-1">
                          <span>Discounts</span>
                          <Info className="w-3.5 h-3.5 inline text-slate-400" />
                        </span>
                        <span className="font-mono">- Tk {discountAmountVal}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Standard delivery</span>
                      <span className="font-extrabold text-[#e21b70] font-mono">
                        Tk {deliveryFeeVal}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Platform Fee</span>
                      <span className="font-mono font-bold">Tk {platformFeeVal}</span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Tax</span>
                      <span className="font-mono font-bold">Tk {taxFeeVal}</span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>VAT</span>
                      <span className="font-mono font-bold">Tk {vatFeeVal}</span>
                    </div>

                    <div className="flex justify-between items-center text-base font-black text-slate-950 pt-2 border-t border-slate-100">
                      <span>Total Cash Payable</span>
                      <span className="font-mono text-[#d70f64] text-lg">Tk {totalPayableVal}</span>
                    </div>
                  </div>

                  {/* Terms text */}
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    By completing this order, I agree to all{' '}
                    <span className="text-slate-900 font-extrabold underline underline-offset-2">
                      terms & conditions
                    </span>
                    .
                  </p>
                </section>
              );
            })()}

          </main>

          {/* Sticky Bottom Acceptance Bar (Full width Green button) */}
          <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
            <div className="max-w-4xl mx-auto">
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
              Order Code: {formatOrderDisplayCode(selectedReadyOrder.order_code)} - {selectedReadyOrder.customer_phone || 'XXXX-1234'}
            </span>

            <div className="flex items-center space-x-2 min-w-[40px] justify-end">
              {(selectedReadyOrder.status === 'vendor_accepted' ||
                selectedReadyOrder.status === 'food_preparing') && (
                <button
                  type="button"
                  onClick={() => handleOpenModifyModal(selectedReadyOrder)}
                  className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center space-x-1 cursor-pointer shadow-xs active:scale-95"
                  title="Modify Order Items"
                >
                  <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Modify</span>
                </button>
              )}

              {(selectedReadyOrder.status === 'ready_for_pickup' || selectedReadyOrder.status === 'food_picked_up') && (
                <button
                  type="button"
                  onClick={() => handleShareOrderToWhatsApp(selectedReadyOrder)}
                  className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center transition-all cursor-pointer ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 animate-in fade-in zoom-in-95 duration-200"
                  title="WhatsApp এ অর্ডার শেয়ার করুন (Share to WhatsApp)"
                  aria-label="WhatsApp Share Order"
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M265 158V64l207 156-207 156v-96c-100 0-173 64-219 166 10-190 94-282 219-282z" fill="white" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-5">
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
                    Order Code: {formatOrderDisplayCode(selectedReadyOrder.order_code)}
                  </h1>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {selectedReadyOrder.customer_phone || 'XXXX-1234'}
                  </p>
                  <span className={`font-black text-[10px] px-2.5 py-1 rounded-md inline-block uppercase tracking-wider mt-2.5 ${
                    (selectedReadyOrder.id.startsWith('test-') || selectedReadyOrder.order_code === '00' || selectedReadyOrder.order_code === '01')
                      ? 'bg-rose-50 text-[#d70f64]'
                      : selectedReadyOrder.order_type === 'pickup'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-[#d70f64]'
                  }`}>
                    {(selectedReadyOrder.id.startsWith('test-') || selectedReadyOrder.order_code === '00' || selectedReadyOrder.order_code === '01')
                      ? 'TEST ORDER'
                      : (selectedReadyOrder.order_type === 'pickup' ? 'PICKUP' : 'DELIVERY')}
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

            {/* If product unavailable preference */}
            {selectedReadyOrder.unavailable_action && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs">
                <span className="text-slate-600">If item unavailable:</span>
                <span className={`px-2.5 py-1 rounded-lg font-extrabold uppercase text-[11px] ${
                  selectedReadyOrder.unavailable_action === 'call'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-rose-100 text-[#d70f64] border border-rose-200'
                }`}>
                  {selectedReadyOrder.unavailable_action === 'call' ? '📞 Call customer' : 'Remove from order'}
                </span>
              </div>
            )}

            {/* Customer Special Instructions Banner */}
            {(() => {
              const rawNote = selectedReadyOrder.special_instructions || '';
              const cleanNote = rawNote
                .replace(/\[Payment:[^\]]+\]/gi, '')
                .replace(/\[Delivery:[^\]]+\]/gi, '')
                .replace(/\[Rider Tip:[^\]]+\]/gi, '')
                .replace(/\[Priority Delivery[^\]]+\]/gi, '')
                .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
                .trim();
              const displayNote = cleanNote || rawNote;
              if (!displayNote) return null;

              return (
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Customer Note / Restaurant Request
                    </h4>
                    <p className="text-sm sm:text-base font-extrabold text-amber-950 mt-0.5 leading-snug break-words break-all whitespace-pre-wrap">
                      {displayNote}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Gray Items Card Container */}
            {(() => {
              const liveMatch = allOrdersList.find(o => o.id === selectedReadyOrder.id || o.order_code === selectedReadyOrder.order_code);

              const extractItems = (val: any): any[] | null => {
                if (!val) return null;
                if (Array.isArray(val) && val.length > 0) return val;
                if (typeof val === 'string') {
                  try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items;
                  } catch {}
                }
                if (typeof val === 'object' && Array.isArray(val.items) && val.items.length > 0) {
                  return val.items;
                }
                return null;
              };

              let readyItems = extractItems(selectedReadyOrder.items)
                || extractItems(liveMatch?.items)
                || extractItems((selectedReadyOrder as any).order_items)
                || extractItems((liveMatch as any)?.order_items)
                || extractItems((selectedReadyOrder as any).order_summary)
                || extractItems((liveMatch as any)?.order_summary);

              if (!readyItems || readyItems.length === 0) {
                const keys = ['foodiplace_v3_orders', 'foodvibe_v3_orders', 'foodiplace_orders', 'foodhub_orders'];
                for (const k of keys) {
                  try {
                    const rawOrders = localStorage.getItem(k);
                    if (rawOrders) {
                      const parsedOrders = JSON.parse(rawOrders);
                      const found = parsedOrders.find((o: any) => o.id === selectedReadyOrder.id || o.order_code === selectedReadyOrder.order_code);
                      const foundItems = extractItems(found?.items) || extractItems(found?.order_summary);
                      if (foundItems && foundItems.length > 0) {
                        readyItems = foundItems;
                        break;
                      }
                    }
                  } catch {}
                }
              }

              const subtotalVal = selectedReadyOrder.food_total || 0;
              if ((!readyItems || readyItems.length === 0) && subtotalVal > 0) {
                readyItems = [{
                  id: `synth-${selectedReadyOrder.id || selectedReadyOrder.order_code}`,
                  item_name: 'Food Order Item',
                  item_price: subtotalVal,
                  quantity: 1,
                  subtotal: subtotalVal,
                  selected_variations: []
                }];
              }

              readyItems = (readyItems || []).map((it: any) => ({
                ...it,
                item_name: it.item_name || it.name || 'Food Item',
                item_price: Number(it.item_price || it.price || 0),
                quantity: Number(it.quantity || 1),
                subtotal: Number(it.subtotal || ((it.item_price || it.price || 0) * (it.quantity || 1))),
                selected_variations: Array.isArray(it.selected_variations)
                  ? it.selected_variations
                  : (typeof it.selected_variations === 'string' && it.selected_variations.trim()
                    ? it.selected_variations.split(',').map((s: string) => s.trim())
                    : [])
              }));

              return (
                <div className="bg-slate-50/80 rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  {readyItems && readyItems.length > 0 ? (
                    readyItems.map((item: any, idx: number) => {
                      const itemSubtotal = item.subtotal || ((item.item_price || 0) * (item.quantity || 1));
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <span className="text-base font-black text-[#d70f64] mr-2">
                                {item.quantity || 1} x
                              </span>
                              <span className="text-base font-black text-slate-950">
                                {item.item_name}
                              </span>
                            </div>
                            <span className="text-base font-bold text-slate-700 font-mono">
                              {itemSubtotal > 0 ? `Tk ${itemSubtotal}` : '--'}
                            </span>
                          </div>

                          {item.selected_variations && item.selected_variations.length > 0 && item.selected_variations.map((v: string, vIdx: number) => (
                            <div key={vIdx} className="flex justify-between items-center text-xs font-bold text-slate-800 pl-6">
                              <span>{v}</span>
                              <span className="text-slate-400 font-mono">--</span>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-xs font-bold text-slate-400">
                      No item details provided
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center font-black text-base text-slate-950">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-900 font-bold">
                      Tk {subtotalVal || readyItems.reduce((sum: number, it: any) => sum + (it.subtotal || 0), 0) || selectedReadyOrder.total_cash_payable || 0}
                    </span>
                  </div>
                </div>
              );
            })()}
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

          {/* Sticky Bottom Action Bar (Ready for delivery -> Handover to rider) */}
          <footer className="sticky bottom-0 z-20 bg-white border-t border-slate-100 p-4 shadow-xl">
            <div className="max-w-4xl mx-auto">
              {selectedReadyOrder.status === 'ready_for_pickup' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      Rider Phone / WhatsApp Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={riderPhoneInput}
                        onChange={(e) => setRiderPhoneInput(e.target.value)}
                        placeholder="Enter rider phone (e.g. 01882208531)"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#008a05] focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleHandoverToRider(selectedReadyOrder.id, riderPhoneInput)}
                    className="w-full py-4 px-6 bg-[#008a05] hover:bg-[#007404] active:scale-[0.99] text-white font-black rounded-2xl transition shadow-md flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Check className="w-5 h-5 stroke-[2.8]" /> Handover to rider
                    </span>
                    <span className="text-sm font-bold text-white/95">
                      {selectedReadyOrder.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} item
                    </span>
                  </button>
                </div>
              ) : selectedReadyOrder.status === 'food_picked_up' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <p className="text-sm font-black text-emerald-800">Order Handed Over to Rider</p>
                  {selectedReadyOrder.rider_phone && (
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">Rider Phone: {selectedReadyOrder.rider_phone}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkFoodReady(selectedReadyOrder.id)}
                  className="w-full py-4 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-black rounded-2xl transition shadow-md flex items-center justify-between cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-black text-white">
                    {selectedReadyOrder.order_type === 'pickup' ? 'Ready for pickup' : 'Ready for delivery'}
                  </span>
                  <span className="text-sm font-bold text-white/95">
                    {selectedReadyOrder.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} item
                  </span>
                </button>
              )}
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
          {/* "vendor close dile 1day er jonno vendor close hoye jabe.      */}
          {/*  too busy dile 1hour er jonno vendor close hoye jabe.         */}
          {/*  1hour por auto open hoye jabe"                               */}
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
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    declineConfirmModal.reason === 'Vendor closed'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {declineConfirmModal.reason === 'Vendor closed' ? (
                    <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
                  ) : (
                    <Clock className="w-7 h-7 stroke-[2.2]" />
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  {declineConfirmModal.reason === 'Vendor closed' ? 'Vendor Closed' : 'Too Busy'}
                </h3>

                <div className="text-sm font-semibold text-slate-600 leading-relaxed space-y-2">
                  {declineConfirmModal.reason === 'Vendor closed' ? (
                    <>
                      <p>
                        Are you sure you want to decline this order because the vendor is closed?
                      </p>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold leading-normal">
                        🔒 Your store will be closed for <span className="font-black underline">1 day (24 hours)</span> and will automatically reopen tomorrow.
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Are you sure you want to decline this order because you are too busy?
                      </p>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold leading-normal">
                        ⏸️ Your store will be paused for <span className="font-black underline">1 hour</span> and will <span className="font-black text-emerald-800">automatically reopen after 1 hour</span>.
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const reason = declineConfirmModal.reason;
                      handleConfirmDeclineWithTimer(reason);
                    }}
                    className={`w-full py-3.5 active:scale-[0.99] text-white font-black text-sm rounded-2xl transition shadow-md cursor-pointer ${
                      declineConfirmModal.reason === 'Vendor closed'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-[#d70f64] hover:bg-[#b8004f]'
                    }`}
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
                KITCHEN DOCKET • ORDER CODE: #{formatOrderDisplayCode(printModalOrder.order_code)}
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
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => handleShareOrderToWhatsApp(printModalOrder)}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-sans font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M265 158V64l207 156-207 156v-96c-100 0-173 64-219 166 10-190 94-282 219-282z" fill="white" />
                </svg>
                <span>WhatsApp শেয়ার</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-sans font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                title="Print Ticket"
              >
                <Printer className="w-4 h-4" />
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
                      <span className="font-mono font-black text-rose-600">Order Code: #{formatOrderDisplayCode(ord.order_code)}</span>
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
            className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900">
                <Settings className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Settings & Store Status</h3>
              </div>
              <button
                onClick={() => setIsOpeningTimesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* ORDER ALARM SOUND SETTINGS */}
              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-[#d70f64] text-white flex items-center justify-center shadow-2xs">
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-xs">Order Alarm Sound</p>
                      <p className="text-[10px] text-slate-500 font-semibold">নতুন অর্ডার আসলে অ্যালার্ম বাজবে</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1.5 rounded-full font-black text-[11px] transition cursor-pointer ${
                      soundEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {soundEnabled && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[11px]">Select Alarm Tone (সাউন্ড বাছাই করুন):</span>
                        <button
                          type="button"
                          onClick={() => playNewOrderSound(alarmTone, true)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition cursor-pointer active:scale-95"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Test Alarm</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'urgent_alarm' as AlarmToneId, label: 'Urgent Kitchen' },
                          { id: 'classic_bell' as AlarmToneId, label: 'Classic Bell' },
                          { id: 'melody_chime' as AlarmToneId, label: 'Pleasant Chime' },
                          { id: 'digital_ring' as AlarmToneId, label: 'Digital POS Ring' }
                        ].map((tone) => (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => {
                              setAlarmTone(tone.id);
                              playNewOrderSound(tone.id, true);
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold flex items-center justify-between transition cursor-pointer ${
                              alarmTone === tone.id
                                ? 'bg-white border-[#d70f64] text-[#d70f64] ring-2 ring-[#d70f64]/15 shadow-2xs'
                                : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <span className="truncate">{tone.label}</span>
                            {alarmTone === tone.id && <Check className="w-3.5 h-3.5 shrink-0 text-[#d70f64]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Audio Upload */}
                    <div className="pt-1 border-t border-rose-200/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[11px] flex items-center space-x-1">
                          <Music className="w-3.5 h-3.5 text-[#d70f64]" />
                          <span>Custom Alarm Audio (নিজস্ব অডিও):</span>
                        </span>
                        <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#d70f64] text-slate-700 font-bold text-[10px] cursor-pointer transition flex items-center space-x-1">
                          <Upload className="w-3 h-3" />
                          <span>Upload MP3/WAV</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleCustomAlarmUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {customAlarmAudio && (
                        <div
                          onClick={() => {
                            setAlarmTone('custom');
                            playNewOrderSound('custom', true);
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            alarmTone === 'custom'
                              ? 'bg-white border-[#d70f64] text-[#d70f64] ring-2 ring-[#d70f64]/15'
                              : 'bg-white/70 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#d70f64]" />
                            <span className="font-bold truncate text-[11px]">{customAlarmAudio.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {alarmTone === 'custom' && <Check className="w-3.5 h-3.5 text-[#d70f64]" />}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.removeItem('foodiplace_vendor_custom_alarm');
                                setCustomAlarmAudio(null);
                                if (alarmTone === 'custom') setAlarmTone('urgent_alarm');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Remove custom audio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {alarmUploadError && (
                        <p className="text-[10px] text-rose-600 font-bold">{alarmUploadError}</p>
                      )}
                    </div>

                    {/* Repeat until accepted toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                      <div>
                        <p className="font-bold text-slate-800 text-[11px]">Repeat until order accepted</p>
                        <p className="text-[10px] text-slate-500">অর্ডার একসেপ্ট না করা পর্যন্ত অ্যালার্ম বাজতে থাকবে</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlarmRepeat(!alarmRepeat)}
                        className={`px-2.5 py-1 rounded-full font-black text-[10px] transition cursor-pointer ${
                          alarmRepeat
                            ? 'bg-[#d70f64] text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {alarmRepeat ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="font-bold text-slate-600">Select Store Operational Status:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReopenStoreManually()}
                  className={`p-3 rounded-2xl border font-bold flex flex-col items-center space-y-1 transition cursor-pointer ${
                    storeStatus === 'online' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>OPEN</span>
                </button>

                <button
                  onClick={() => activeVendor && updateVendor(activeVendor.id, { is_active: false, is_paused: false })}
                  className={`p-3 rounded-2xl border font-bold flex flex-col items-center space-y-1 transition cursor-pointer ${
                    storeStatus === 'offline' ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>CLOSED</span>
                </button>
              </div>

              {vendorCloseInfo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1 text-amber-900">
                  <div className="font-black flex items-center justify-between">
                    <span>⏳ Auto-Timer Active:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                      {formatRemainingTime(Math.max(0, vendorCloseInfo.closedUntil - nowTime))}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    {vendorCloseInfo.reason === 'too_busy'
                      ? 'Closed for 1 hour (Too busy). Automatically reopens when time finishes.'
                      : 'Closed for 1 day (Vendor closed). Automatically reopens tomorrow.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleReopenStoreManually}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-center cursor-pointer shadow-xs"
                  >
                    Reopen Store Now
                  </button>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Weekly Operating Schedule:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpeningTimesModalOpen(false);
                      handleOpenScheduleModal();
                    }}
                    className="text-[11px] font-black text-[#d70f64] hover:underline"
                  >
                    Edit 1-Week Schedule →
                  </button>
                </div>
                <p>Configured daily opening and closing schedule with automated open/close.</p>
                <p className="text-[10px] text-slate-400">Orders placed during opening hours will automatically alert terminal audio.</p>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => {
                  setIsOpeningTimesModalOpen(false);
                  handleOpenScheduleModal();
                }}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#d70f64] font-bold text-xs rounded-xl transition border border-rose-200"
              >
                Weekly Schedule
              </button>
              <button
                onClick={() => setIsOpeningTimesModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: 1-WEEK SCHEDULE & PERMANENT CLOSE LIST PAGE
        "Ei option a click korle vendor er 1week er shedule list page open hobe.
         proti din er opening and closing time set korte parbe then set kora 
         data onujayi auto open and close hobe.vendor chaile parmanent close 
         korte parbe jotodin na manually open kortece"
        ========================================================================
      */}
      {isScheduleModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-[#d70f64] flex items-center justify-center shadow-2xs">
                  <Calendar className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                    Weekly Schedule & Operating Hours
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    ১ সপ্তাহের শিডিউল ও স্বয়ংক্রিয় ওপেন/ক্লোজ কন্ট্রোল
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              
              {/* Permanent Close Control Card */}
              {/* "vendor chaile parmanent close korte parbe jotodin na manually open kortece" */}
              <div className={`rounded-2xl p-4 border transition-all ${
                isPermanentlyClosed 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 pr-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPermanentlyClosed ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Power className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">
                          Permanent Close (স্থায়ীভাবে বন্ধ)
                        </span>
                        {isPermanentlyClosed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {isPermanentlyClosed
                          ? 'স্টোর বর্তমানে স্থায়ীভাবে বন্ধ আছে। পুনরায় ম্যানুয়ালি ওপেন না করা পর্যন্ত বন্ধ থাকবে।'
                          : 'সুইচ অন করলে শিডিউল উপেক্ষা করে স্টোর সম্পূর্ণ বন্ধ থাকবে যতক্ষণ না ম্যানুয়ালি ওপেন করবেন।'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePermanentClose(!isPermanentlyClosed)}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs transition cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                      isPermanentlyClosed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isPermanentlyClosed ? 'Reopen Store' : 'Close Permanently'}
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#d70f64]" />
                  <span className="font-bold text-slate-800 text-xs">
                    বর্তমান অবস্থা: {isPermanentlyClosed ? '🔒 বন্ধ (Permanent Closed)' : isVendorOpenBySchedule(weeklyScheduleDraft) ? '● খোলা (Schedule Open)' : '○ বন্ধ (Schedule Closed)'}
                  </span>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  isPermanentlyClosed
                    ? 'bg-rose-100 text-rose-800'
                    : isVendorOpenBySchedule(weeklyScheduleDraft)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isPermanentlyClosed ? 'PERMANENT CLOSED' : isVendorOpenBySchedule(weeklyScheduleDraft) ? 'ONLINE' : 'CLOSED'}
                </span>
              </div>

              {/* Weekly Schedule Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 text-sm">
                    ১ সপ্তাহের শিডিউল লিস্ট (7-Day Schedule List)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Auto Open & Close Time
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 font-normal">
                  প্রতিদিনের Opening এবং Closing সময় সেট করুন। সেট করা ডাটা অনুযায়ী স্বয়ংক্রিয়ভাবে ওপেন ও ক্লোজ হবে।
                </p>

                {/* 7 Days Schedule List */}
                <div className="space-y-2.5">
                  {DAYS_ORDER.map((dayKey) => {
                    const rule = weeklyScheduleDraft[dayKey] || DEFAULT_WEEKLY_SCHEDULE[dayKey];

                    return (
                      <div
                        key={dayKey}
                        className={`p-3 rounded-2xl border transition-all ${
                          rule.is_open
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                            : 'bg-slate-50 border-slate-200/80 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Left: Day Label & On/Off Toggle */}
                          <div className="flex items-center space-x-2.5 min-w-[130px]">
                            <button
                              type="button"
                              onClick={() => {
                                setWeeklyScheduleDraft(prev => ({
                                  ...prev,
                                  [dayKey]: {
                                    ...rule,
                                    is_open: !rule.is_open
                                  }
                                }));
                              }}
                              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                                rule.is_open ? 'bg-[#d70f64]' : 'bg-slate-300'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs absolute top-0.5 ${
                                  rule.is_open ? 'translate-x-4 left-0.5' : 'translate-x-0.5 left-0.5'
                                }`}
                              />
                            </button>
                            <div>
                              <div className="font-black text-slate-900 text-xs sm:text-sm">
                                {rule.day_label}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {rule.day_label_bn} {rule.is_open ? '• Open' : '• Off Day'}
                              </div>
                            </div>
                          </div>

                          {/* Right: Opening and Closing Time pickers */}
                          {rule.is_open ? (
                            <div className="flex items-center space-x-2 flex-wrap">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Open:</span>
                                <input
                                  type="time"
                                  value={rule.open_time || '10:00'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setWeeklyScheduleDraft(prev => ({
                                      ...prev,
                                      [dayKey]: {
                                        ...rule,
                                        open_time: val
                                      }
                                    }));
                                  }}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 focus:outline-rose-500 focus:bg-white"
                                />
                              </div>

                              <span className="text-slate-400 font-black">—</span>

                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Close:</span>
                                <input
                                  type="time"
                                  value={rule.close_time || '23:30'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setWeeklyScheduleDraft(prev => ({
                                      ...prev,
                                      [dayKey]: {
                                        ...rule,
                                        close_time: val
                                      }
                                    }));
                                  }}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 focus:outline-rose-500 focus:bg-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-slate-400 italic">
                              সারাদিন বন্ধ থাকবে (Closed whole day)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Alert */}
              {scheduleSaveFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-center font-bold text-xs animate-in fade-in">
                  {scheduleSaveFeedback}
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setWeeklyScheduleDraft(DEFAULT_WEEKLY_SCHEDULE);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-xs text-slate-700 transition cursor-pointer"
              >
                Reset Default
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-xs text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWeeklySchedule}
                  className="px-6 py-2.5 rounded-xl bg-[#d70f64] hover:bg-[#b8004f] text-white font-black text-xs transition cursor-pointer shadow-md flex items-center space-x-1.5 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Save Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: DISCOUNT & FREE DELIVERY CAMPAIGN (ADS & RESTAURANT BOOSTER)
        (100% Matching Screenshot_20261103_173444_Chrome_0143ba66.jpg)
        Includes feature: Vendor can set Minimum Order Amount (e.g. 500 Tk)
        for Free Delivery eligibility.
        ========================================================================
      */}
      {isCampaignModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
          onClick={() => setIsCampaignModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Tag className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                    Discount & Free Delivery Campaign
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure promotional offers for 7days
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Discount Percentage Section */}
            <div className="space-y-2.5 pt-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                SELECT DISCOUNT PERCENTAGE (%)
              </label>

              {/* 4x2 Grid Buttons matching screenshot */}
              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
                  const isSelected = campaignDiscountPct === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setCampaignDiscountPct(pct);
                        setCampaignDiscountTag(`${pct}% OFF`);
                      }}
                      className={`py-3 px-1 rounded-2xl border transition cursor-pointer text-center font-extrabold ${
                        isSelected
                          ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {pct}% OFF
                    </button>
                  );
                })}

                {/* No Discount Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCampaignDiscountPct(0);
                    setCampaignDiscountTag('');
                  }}
                  className={`py-3 px-1 rounded-2xl border transition cursor-pointer text-center font-extrabold ${
                    campaignDiscountPct === 0
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  No Discount
                </button>
              </div>

              {/* Inputs row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                    DISCOUNT %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={campaignDiscountPct || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const norm = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
                      setCampaignDiscountPct(norm);
                      if (norm > 0) setCampaignDiscountTag(`${norm}% OFF`);
                      else setCampaignDiscountTag('');
                    }}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#d70f64] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                    BADGE TAG TEXT
                  </label>
                  <input
                    type="text"
                    value={campaignDiscountTag}
                    onChange={(e) => setCampaignDiscountTag(e.target.value)}
                    placeholder="e.g. 15% OFF"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#d70f64] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Free Delivery Card (Mint container matching screenshot) */}
            <div className="p-4 bg-[#e8f8f2] border border-[#a8e6cf] rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00a86b] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bike className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block leading-tight">
                      Free Delivery Offer
                    </span>
                    <span className="text-[11px] text-emerald-900 font-semibold block leading-tight mt-0.5">
                      Provide 100% Free Delivery to customers
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setCampaignIsFreeDelivery(!campaignIsFreeDelivery)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    campaignIsFreeDelivery ? 'bg-[#00a86b]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm absolute top-0.75 ${
                      campaignIsFreeDelivery ? 'translate-x-6 left-0.5' : 'translate-x-0.5 left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Minimum order threshold setting (Always Visible) */}
              <div className="pt-2.5 border-t border-[#b2edd6] space-y-1 text-xs">
                <label className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                  MIN. ORDER AMOUNT FOR FREE DELIVERY (TK)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-900 text-sm">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={campaignFreeDeliveryMinOrder || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const norm = isNaN(val) ? 0 : Math.max(0, val);
                      setCampaignFreeDeliveryMinOrder(norm);
                      if (norm > 0) {
                        setCampaignIsFreeDelivery(true);
                      }
                    }}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#a8e6cf] rounded-2xl font-mono text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#00a86b]/20 transition shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-emerald-800 font-medium leading-tight pt-0.5">
                  * কাস্টমার সর্বনিম্ন কত টাকার ফুড অর্ডার করলে ডেলিভারি চার্জ ফ্রি পাবে তা সেট করুন (যেমন: ৫০০ Tk)।
                </p>
              </div>
            </div>

            {/* Save Feedback */}
            {campaignSaveFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center text-xs font-bold animate-in fade-in">
                {campaignSaveFeedback}
              </div>
            )}

            {/* Bottom Actions matching screenshot */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDiscountCampaign}
                className="py-3.5 bg-[#ff5200] hover:bg-[#e04800] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/30 transition cursor-pointer active:scale-95"
              >
                SAVE CAMPAIGN
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 
        ========================================================================
        MODIFY ORDER ITEMS MODAL (Vendor Order Editing Engine)
        - Allows vendor to remove items, change item quantities (+/-)
        - Allows vendor to add new items from restaurant menu
        - Automatically updates subtotal, total cash payable, and persists to database
        ========================================================================
      */}
      {isModifyModalOpen && modifyingOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Modify Order #{formatOrderDisplayCode(modifyingOrder.order_code)}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Add or remove items for {modifyingOrder.customer_name || 'Customer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModifyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              {/* Current Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Current Order Items ({modifiedItems.length})
                  </h4>
                  <span className="text-xs font-bold text-slate-400">
                    Subtotal: Tk {modifiedItems.reduce((s, it) => s + (it.subtotal || ((it.item_price || 0) * (it.quantity || 1))), 0)}
                  </span>
                </div>

                {modifiedItems.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">No items in order.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add items from the menu below.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {modifiedItems.map((item, idx) => {
                      const itemSub = item.subtotal || ((item.item_price || 0) * (item.quantity || 1));
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-black text-slate-900 truncate">
                              {item.item_name}
                            </h5>
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 mt-0.5">
                              <span>Tk {item.item_price}</span>
                              {item.selected_variations && item.selected_variations.length > 0 && (
                                <span className="text-slate-400">
                                  • {Array.isArray(item.selected_variations) ? item.selected_variations.join(', ') : item.selected_variations}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleDecrementModifiedItem(idx)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="w-8 text-center text-xs font-black font-mono text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleIncrementModifiedItem(idx)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>

                            <span className="text-sm font-black text-slate-950 font-mono w-16 text-right">
                              Tk {itemSub}
                            </span>

                            {/* Remove Item Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveModifiedItem(idx)}
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                              title="Remove Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Items From Menu Section */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Add Items From Menu
                  </h4>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modifySearchQuery}
                    onChange={e => setModifySearchQuery(e.target.value)}
                    placeholder="Search restaurant menu to add items..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>

                {/* Menu List */}
                {(() => {
                  const vendorItems = menuItems.filter(m => {
                    if (modifyingOrder.vendor_id && m.vendor_id !== modifyingOrder.vendor_id) {
                      return false;
                    }
                    if (modifySearchQuery.trim()) {
                      return m.name.toLowerCase().includes(modifySearchQuery.toLowerCase());
                    }
                    return true;
                  });

                  if (vendorItems.length === 0) {
                    return (
                      <div className="py-4 text-center text-xs font-bold text-slate-400">
                        No menu items found.
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {vendorItems.map(m => {
                        const inOrder = modifiedItems.find(it => it.menu_item_id === m.id || it.item_name?.toLowerCase() === m.name.toLowerCase());
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <h6 className="text-xs font-black text-slate-900 truncate">
                                {m.name}
                              </h6>
                              <p className="text-[11px] font-bold text-[#d70f64] font-mono">
                                Tk {m.price}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddItemFromMenu(m)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 transition cursor-pointer ${
                                inOrder
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{inOrder ? `Add (+${inOrder.quantity})` : 'Add Item'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 font-bold block">New Food Total</span>
                <span className="text-lg font-black text-slate-950 font-mono">
                  Tk {modifiedItems.reduce((s, it) => s + (it.subtotal || ((it.item_price || 0) * (it.quantity || 1))), 0)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModifyModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrderModification}
                  disabled={isSavingModify}
                  className="px-5 py-2.5 bg-[#008a05] hover:bg-[#007404] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingModify ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Toast Banner */}
      {modifyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5" />
          <span>{modifyToast}</span>
        </div>
      )}

    </div>
  );
};
