import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { MenuItem, Order, OrderStatus, Vendor } from '../../types/database';
import { VendorReviewsView } from './VendorReviewsView';
import { 
  Store, 
  Clock, 
  Banknote, 
  CheckCircle, 
  Plus, 
  Trash2, 
  MapPin, 
  ChefHat, 
  Bike,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  Tag,
  HelpCircle,
  LogOut,
  LayoutGrid,
  BookOpen,
  Megaphone,
  Menu as MenuIcon,
  X,
  ThumbsUp,
  SlidersHorizontal,
  Flame,
  Power,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Filter,
  MoreVertical,
  Pencil,
  Search,
  Trophy,
  BarChart2,
  Receipt,
  FileSpreadsheet,
  Landmark,
  Globe,
  MessageSquareQuote,
  Settings,
  Building2,
  Image,
  Upload,
  Camera,
  Lock,
  Phone,
  Utensils
} from 'lucide-react';

export const VendorPortal: React.FC = () => {
  const { 
    vendors, 
    currentVendor, 
    setCurrentVendor, 
    updateVendor,
    uploadVendorImage,
    deleteVendorImage,
    menuItems, 
    addMenuItem, 
    updateMenuItem,
    toggleMenuItemAvailability, 
    deleteMenuItem,
    orders, 
    updateOrderStatus,
    settings,
    riders,
    foodCategories,
    addFoodCategory,
    currentUser,
    loginUser,
    setPasswordForUser,
    logoutUser
  } = useDelivery();

  // Vendor Auth State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Navigation & View States
  const [activeBottomNav, setActiveBottomNavState] = useState<'overview' | 'menu' | 'ads' | 'more'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodiplace_vendor_tab') as 'overview' | 'menu' | 'ads' | 'more';
      if (['overview', 'menu', 'ads', 'more'].includes(saved)) return saved;
    }
    return 'overview';
  });

  const setActiveBottomNav = (tab: 'overview' | 'menu' | 'ads' | 'more') => {
    setActiveBottomNavState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodiplace_vendor_tab', tab);
    }
  };

  const [performancePeriod, setPerformancePeriod] = useState<'Today' | 'Yesterday' | 'This Week'>('Today');
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);

  // Menu Page States
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && currentVendor?.id) {
      try {
        const saved = localStorage.getItem(`foodiplace_vendor_categories_${currentVendor.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Sync custom categories per vendor
  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentVendor?.id) {
      try {
        localStorage.setItem(`foodiplace_vendor_categories_${currentVendor.id}`, JSON.stringify(customCategories));
      } catch {}
    }
  }, [customCategories, currentVendor?.id]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isMenuMoreDropdownOpen, setIsMenuMoreDropdownOpen] = useState(false);

  // Modals & Panels
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isPromotionsOpen, setIsPromotionsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isVendorAuthModalOpen, setIsVendorAuthModalOpen] = useState(false);
  const [vendorAuthMode, setVendorAuthMode] = useState<'login' | 'register'>('login');

  // Modals for More view items
  const [isTopProgramOpen, setIsTopProgramOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [isOpeningTimesOpen, setIsOpeningTimesOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStoreBrandingOpen, setIsStoreBrandingOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isDeletingCover, setIsDeletingCover] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Direct Web Image URL Inputs (optional)
  const [profileLogoUrlInput, setProfileLogoUrlInput] = useState('');
  const [profileCoverUrlInput, setProfileCoverUrlInput] = useState('');
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);

  const openVendorProfileModal = () => {
    if (currentVendor) {
      setProfileLogoUrlInput(currentVendor.logo_url || '');
      setProfileCoverUrlInput(currentVendor.cover_image || '');
      setUploadFeedback(null);
    }
    setIsStoreBrandingOpen(true);
  };

  const handleApplyWebUrls = async () => {
    if (!currentVendor) return;
    setUploadFeedback(null);
    try {
      const trimmedLogo = profileLogoUrlInput.trim();
      const trimmedCover = profileCoverUrlInput.trim();

      // Logo URL change
      if (trimmedLogo !== (currentVendor.logo_url || '')) {
        if (!trimmedLogo) {
          await deleteVendorImage(currentVendor.id, 'logo');
        } else {
          if (currentVendor.logo_url) {
            await deleteVendorImage(currentVendor.id, 'logo');
          }
          await updateVendor(currentVendor.id, { logo_url: trimmedLogo });
        }
      }

      // Cover URL change
      if (trimmedCover !== (currentVendor.cover_image || '')) {
        if (!trimmedCover) {
          await deleteVendorImage(currentVendor.id, 'cover');
        } else {
          if (currentVendor.cover_image) {
            await deleteVendorImage(currentVendor.id, 'cover');
          }
          await updateVendor(currentVendor.id, { cover_image: trimmedCover });
        }
      }

      setUploadFeedback({ 
        type: 'success', 
        message: '✅ ছবির লিংক ডাটাবেসে সফলভাবে আপডেট করা হয়েছে!' 
      });
    } catch {
      setUploadFeedback({ type: 'error', message: 'Failed to update image URLs.' });
    }
  };
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'English' | 'বাংলা'>('English');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const getUserInitials = (name: string): string => {
    if (!name) return 'FU';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'FU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // New/Edit Dish Form State
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Burger');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishVariations, setDishVariations] = useState<import('../../types/database').MenuVariationGroup[]>([]);

  const openAddDishModal = () => {
    setEditingDish(null);
    setDishName('');
    setDishPrice('');
    setDishCategory('Burger');
    setDishDescription('');
    setDishImageUrl('');
    setDishVariations([]);
    setIsAddDishOpen(true);
  };

  const openEditDishModal = (item: MenuItem) => {
    setEditingDish(item);
    setDishName(item.name);
    setDishPrice(item.price.toString());
    setDishCategory(item.category || 'Main Course');
    setDishDescription(item.description || '');
    setDishImageUrl(item.image_url || '');
    setDishVariations(item.variations || []);
    setIsAddDishOpen(true);
  };

  const addVariationGroup = () => {
    setDishVariations(prev => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        name: 'Portion / Size',
        type: 'single',
        required: true,
        options: [
          { id: `opt-${Date.now()}-1`, name: 'Full (1:2)', price: 0 },
          { id: `opt-${Date.now()}-2`, name: 'Half (1:1)', price: 0 }
        ]
      }
    ]);
  };

  const updateVariationGroup = (index: number, updates: Partial<import('../../types/database').MenuVariationGroup>) => {
    setDishVariations(prev => prev.map((g, i) => i === index ? { ...g, ...updates } : g));
  };

  const removeVariationGroup = (index: number) => {
    setDishVariations(prev => prev.filter((_, i) => i !== index));
  };

  const addOptionToGroup = (groupIndex: number) => {
    setDishVariations(prev => prev.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        options: [
          ...g.options,
          { id: `opt-${Date.now()}`, name: 'New Option', price: 0 }
        ]
      };
    }));
  };

  const updateOptionInGroup = (groupIndex: number, optionIndex: number, updates: Partial<import('../../types/database').MenuVariationOption>) => {
    setDishVariations(prev => prev.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        options: g.options.map((opt, oi) => oi === optionIndex ? { ...opt, ...updates } : opt)
      };
    }));
  };

  const removeOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setDishVariations(prev => prev.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        options: g.options.filter((_, oi) => oi !== optionIndex)
      };
    }));
  };

  // Auth Handlers
  const handleVendorLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = loginUser('vendor', authPhone, authPassword);
    if (!res.success) {
      if (res.requiresPasswordSetup) {
        setAuthTab('register');
        setAuthError('First-time login detected. Please set your new password below.');
      } else {
        setAuthError(res.message || 'Login failed. Please check phone and password.');
      }
    }
  };

  const handleVendorRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authPhone.trim() || !authPassword.trim()) {
      setAuthError('Please enter phone number and password.');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }

    const ok = setPasswordForUser('vendor', authPhone, authPassword);
    if (!ok) {
      setAuthError('This phone number is not registered as a Vendor by Admin. Please contact Admin.');
    }
  };

  if (!currentUser || currentUser.role !== 'vendor' || !currentVendor) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
        <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200/80">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <Store className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              foodiplace Partner
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Vendor Portal Registration & Login
            </p>
          </div>

          {/* Auth Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-black">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                authTab === 'login' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Partner Login
            </button>
            <button
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                authTab === 'register' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Set New Password
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl animate-in fade-in">
              {authError}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleVendorLoginSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase tracking-wider text-[10px]">Registered Phone Number</label>
                <input
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="e.g. 01711122233"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase tracking-wider text-[10px]">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Login to Partner Dashboard
              </button>
            </form>
          ) : (
            <form onSubmit={handleVendorRegisterSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase tracking-wider text-[10px]">Admin Registered Phone Number *</label>
                <input
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="e.g. 01711122233"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400 font-normal">
                  Enter the phone number provided during registration by Admin.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase tracking-wider text-[10px]">Set New Password *</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase tracking-wider text-[10px]">Confirm Password *</label>
                <input
                  type="password"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Complete Registration & Login
              </button>
            </form>
          )}

          {/* Quick Select Preset Account for Testing */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Quick Test Vendor Login:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setAuthPhone(v.phone);
                    setAuthPassword(v.password || '123');
                    loginUser('vendor', v.phone, v.password || '123');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Filter orders for this specific restaurant
  const vendorOrders = orders.filter((o) => o.vendor_id === currentVendor.id);
  const pendingOrders = vendorOrders.filter((o) => o.status === 'pending');
  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyForPickupOrders = vendorOrders.filter((o) => 
    o.status === 'ready_for_pickup' || o.status === 'rider_assigned' || o.status === 'rider_arrived_at_vendor'
  );
  const completedOrders = vendorOrders.filter((o) => ['rider_on_way_to_customer', 'delivered'].includes(o.status));

  // Today Sales & Orders Calculation
  const todayOrders = vendorOrders.filter((o) => {
    const ordDate = new Date(o.created_at).toDateString();
    const todayDate = new Date().toDateString();
    return ordDate === todayDate;
  });

  const todaySales = todayOrders.reduce((sum, o) => sum + o.food_total, 0);
  const todayOrdersCount = todayOrders.length;

  // Cash Ledger calculations
  const cashCollectedFromRiders = vendorOrders
    .filter((o) => o.food_cash_paid_to_vendor || ['rider_on_way_to_customer', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.food_total, 0);

  const pendingCashToReceive = vendorOrders
    .filter((o) => !o.food_cash_paid_to_vendor && !['delivered', 'cancelled'].includes(o.status))
    .reduce((sum, o) => sum + o.food_total, 0);

  // Menu items and Categories for Current Vendor
  const currentMenuItems = menuItems.filter((m) => m.vendor_id === currentVendor.id);
  const existingCategories = Array.from(new Set(currentMenuItems.map(m => m.category)));
  
  // Combine existing categories and custom added categories
  const allCategoryNames = Array.from(new Set([
    ...existingCategories,
    ...customCategories
  ]));

  const filteredMenuItems = currentMenuItems.filter(item => {
    const query = menuSearchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query);

    const matchesAvailability = 
      filterAvailability === 'all' || 
      (filterAvailability === 'in_stock' && item.is_available) ||
      (filterAvailability === 'sold_out' && !item.is_available);

    return matchesSearch && matchesAvailability;
  });

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) return;

    if (editingDish) {
      updateMenuItem(editingDish.id, {
        name: dishName.trim(),
        description: dishDescription.trim(),
        price: parseFloat(dishPrice),
        category: dishCategory,
        image_url: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        variations: dishVariations.length > 0 ? dishVariations : undefined
      });
    } else {
      addMenuItem({
        vendor_id: currentVendor.id,
        name: dishName.trim(),
        description: dishDescription.trim(),
        price: parseFloat(dishPrice),
        category: dishCategory,
        is_available: true,
        image_url: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        variations: dishVariations.length > 0 ? dishVariations : undefined
      });
    }

    setDishName('');
    setDishPrice('');
    setDishDescription('');
    setDishImageUrl('');
    setDishVariations([]);
    setEditingDish(null);
    setIsAddDishOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!customCategories.includes(cat)) {
      setCustomCategories(prev => [...prev, cat]);
    }
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const cyclePerformancePeriod = () => {
    if (performancePeriod === 'Today') setPerformancePeriod('Yesterday');
    else if (performancePeriod === 'Yesterday') setPerformancePeriod('This Week');
    else setPerformancePeriod('Today');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      {/* 
        ========================================================================
        RENDER BASED ON ACTIVE TAB:
        - If activeBottomNav === 'menu': Render Menu view (Matching Screenshot_20260930_194219_panda partner.jpg)
        - If activeBottomNav === 'overview': Render Overview (Matching Screenshot_20260930_193547_panda partner.jpg)
        - If activeBottomNav === 'ads': Render Ads
        - If activeBottomNav === 'more': Render More & Cash Ledger
        ========================================================================
      */}

      {activeBottomNav === 'menu' ? (
        /* 
          ========================================================================
          MENU VIEW (100% Matching Screenshot_20260930_194219_panda partner.jpg)
          "products er por option s nam er option Ta rakte hobe na" -> Omitted 'Options'
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-white text-slate-900 pb-28">
          {/* Top Bar: Store Pill + Round (X) button */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 pt-4 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              {/* Store Pill */}
              <div className="relative flex-1">
                <button
                  onClick={() => openVendorProfileModal()}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-slate-300 bg-white text-slate-800 text-left shadow-2xs hover:border-orange-400 transition cursor-pointer"
                  title="Click to open vendor profile (logo & cover photo)"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Store className="w-4 h-4 shrink-0 text-slate-700" />
                    <span className="font-bold text-xs sm:text-sm truncate">
                      {currentVendor.name}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>

              {/* Round (X) button on top right */}
              <button
                onClick={() => setActiveBottomNav('overview')}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition shrink-0"
                title="Back to Overview"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Title: Delivery Menu ⌵ */}
            <div className="pt-3 pb-1 flex items-center space-x-1.5 cursor-pointer">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Delivery Menu
              </h1>
              <ChevronDown className="w-5 h-5 text-slate-700 stroke-[2.5] mt-0.5" />
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* 
              Segmented Control:
              User instruction: "products er por option s nam er option Ta rakte hobe na"
              -> Only 'Products' is kept, 'Options' is completely excluded!
            */}
            <div className="bg-slate-100/80 p-1 rounded-2xl">
              <div className="w-full py-2 bg-white rounded-xl shadow-xs text-center font-bold text-xs text-slate-900 border border-slate-200/50">
                Products ({filteredMenuItems.length})
              </div>
            </div>

            {/* Search Bar + Filter Funnel + More (3 dots) */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition"
                />
                {menuSearchQuery && (
                  <button 
                    onClick={() => setMenuSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Button (Funnel) */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition shadow-2xs ${
                    filterAvailability !== 'all' 
                      ? 'border-orange-500 bg-orange-50 text-orange-600' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                  title="Filter availability"
                >
                  <Filter className="w-4 h-4" />
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 space-y-1 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Filter Availability</p>
                    <button
                      onClick={() => { setFilterAvailability('all'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold ${filterAvailability === 'all' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      All Items
                    </button>
                    <button
                      onClick={() => { setFilterAvailability('in_stock'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold ${filterAvailability === 'in_stock' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      In Stock Only
                    </button>
                    <button
                      onClick={() => { setFilterAvailability('sold_out'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold ${filterAvailability === 'sold_out' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      Sold Out Only
                    </button>
                  </div>
                )}
              </div>

              {/* 3-dots More button */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuMoreDropdownOpen(prev => !prev)}
                  className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 flex items-center justify-center transition shadow-2xs"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuMoreDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        const newCollapsed: Record<string, boolean> = {};
                        allCategoryNames.forEach(c => newCollapsed[c] = false);
                        setCollapsedCategories(newCollapsed);
                        setIsMenuMoreDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-50 font-bold"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => {
                        const newCollapsed: Record<string, boolean> = {};
                        allCategoryNames.forEach(c => newCollapsed[c] = true);
                        setCollapsedCategories(newCollapsed);
                        setIsMenuMoreDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-50 font-bold"
                    >
                      Collapse All
                    </button>
                    <button
                      onClick={() => {
                        setIsAddDishOpen(true);
                        setIsMenuMoreDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-orange-600 hover:bg-orange-50 font-bold"
                    >
                      + Add New Dish
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* "+ Add category" Full-width Button (Matching Screenshot) */}
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="w-full py-3 px-4 border border-orange-200 hover:border-orange-300 bg-white hover:bg-orange-50/50 text-orange-600 rounded-2xl font-bold text-sm flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add category</span>
            </button>

            {/* Category Groups Accordion List (Matching Screenshot) */}
            <div className="space-y-4 pt-1">
              {allCategoryNames.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                  <p className="font-bold text-sm text-slate-800">No categories created yet</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Tap "+ Add category" above to create your first menu category and start adding products.
                  </p>
                </div>
              ) : (
                allCategoryNames.map((categoryName) => {
                const categoryItems = filteredMenuItems.filter(item => item.category === categoryName);
                const isCollapsed = !!collapsedCategories[categoryName];

                return (
                  <div
                    key={categoryName}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-100">
                      <div 
                        onClick={() => toggleCategoryCollapse(categoryName)}
                        className="flex items-center space-x-2.5 cursor-pointer flex-1"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-700" />
                        )}
                        <div>
                          <h3 className="font-black text-slate-900 text-base leading-snug">
                            {categoryName}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {categoryItems.length} Products
                          </p>
                        </div>
                      </div>

                      {/* Right Count Badge & Pencil Edit Icon */}
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {categoryItems.length}
                        </span>
                        <button
                          onClick={() => {
                            if (categoryItems.length > 0) {
                              alert("⚠️ Cannot remove category: There are still products in this category. Move or delete them first.");
                              return;
                            }
                            if (window.confirm(`Are you sure you want to remove the category "${categoryName}"?`)) {
                              setCustomCategories(prev => prev.filter(c => c.toLowerCase().trim() !== categoryName.toLowerCase().trim()));
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title="Remove Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Category Content (when expanded) */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-3.5">
                        {/* "+ Add" Button inside Category (Matching Screenshot) */}
                        <button
                          onClick={() => {
                            openAddDishModal();
                            setDishCategory(categoryName);
                          }}
                          className="w-full py-2.5 px-3 border border-orange-200 hover:border-orange-300 bg-white hover:bg-orange-50/40 text-orange-600 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1 transition shadow-2xs cursor-pointer active:scale-[0.99]"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add</span>
                        </button>

                        {/* Dish Items inside this Category */}
                        {categoryItems.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4 italic">
                            No products in this category yet. Tap "+ Add" above to add dishes!
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {categoryItems.map((item) => (
                              <div
                                key={item.id}
                                className="py-3 flex items-center justify-between gap-3 group"
                              >
                                {/* Thumbnail Image */}
                                <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                                  <img 
                                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} 
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  />
                                </div>

                                {/* Center: Name, Description, Variations, Price */}
                                <div className="flex-1 min-w-0 pr-2">
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description || '1:1 - Special restaurant recipe'}
                                  </p>

                                  <div className="flex items-center justify-between mt-1 text-xs">
                                    <span className="text-[11px] text-orange-600 font-semibold truncate max-w-[130px]">
                                      {item.variations && item.variations.length > 0 
                                        ? item.variations.map(v => v.name).join(', ') 
                                        : 'No variations'}
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                      BDT {item.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Edit, iOS Style Switch Toggle & Delete */}
                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <button
                                    onClick={() => openEditDishModal(item)}
                                    className="text-slate-400 hover:text-orange-600 p-1 transition cursor-pointer"
                                    title="Edit dish and variations"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleMenuItemAvailability(item.id)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                      item.is_available ? 'bg-orange-500' : 'bg-slate-300'
                                    }`}
                                    title={item.is_available ? 'Available (In Stock)' : 'Unavailable (Sold Out)'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        item.is_available ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>

                                  {/* Delete option */}
                                  <button
                                    onClick={() => deleteMenuItem(item.id)}
                                    className="text-slate-300 hover:text-rose-500 p-1 transition cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      ) : activeBottomNav === 'ads' ? (
        /* 
          ========================================================================
          ADS & PROMOTIONS VIEW
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 pb-28">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between z-10">
            <h2 className="text-base font-black text-slate-900">Ads & Restaurant Booster</h2>
            <button onClick={() => setActiveBottomNav('overview')} className="p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 rounded-3xl text-white shadow-md space-y-2">
              <h3 className="font-black text-base">Get 3x More Orders</h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Featured restaurant placements appear at the top of customer search in Banani, Gulshan, and Chittagong.
              </p>
              <button 
                onClick={() => alert('Promotional campaign activated! Your restaurant is now pinned as Featured.')}
                className="mt-2 px-4 py-2 bg-white text-orange-600 rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Boost Restaurant Visibility
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Active Discounts</h4>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-xs text-slate-800">15% off: back4more</p>
                  <p className="text-[11px] text-slate-500">Auto-applied for orders above ৳299</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : activeBottomNav === 'more' ? (
        /* 
          ========================================================================
          MORE VIEW (100% Matching Screenshot_20261006_141354 and 141359)
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-slate-50/70 text-slate-900 pb-28 select-none">
          {/* Top Bar / Store Pill & Close Button (Matching Screenshot 1) */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 shadow-2xs">
            <button
              onClick={() => setIsStoreSelectorOpen(true)}
              className="flex-1 max-w-[84%] flex items-center space-x-2.5 px-4 py-2.5 rounded-full border border-slate-200/90 bg-white shadow-2xs text-slate-900 hover:border-slate-300 transition text-left cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-800 shrink-0 stroke-[2]" />
              <span className="font-bold text-sm truncate">
                {currentVendor.name} {currentVendor.unique_id ? `(${currentVendor.unique_id})` : '(LWTL)'}
              </span>
            </button>

            <button
              onClick={() => setActiveBottomNav('overview')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer ml-3 shrink-0"
              title="Close and return to Overview"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* User / Admin Profile Card (Matching Screenshot 1) */}
            <div 
              onClick={() => openVendorProfileModal()}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between cursor-pointer hover:border-orange-300 transition active:scale-[0.99] group"
              title="Click to open Vendor Profile (logo, cover photo & store settings)"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-800 font-extrabold text-lg shrink-0 overflow-hidden relative shadow-xs">
                  {currentVendor.logo_url ? (
                    <img 
                      src={currentVendor.logo_url} 
                      alt={currentVendor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <span>{getUserInitials(currentUser?.name || currentVendor.name || 'Farid Ullah')}</span>
                  )}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-orange-600 transition-colors">
                    {currentUser?.name || currentVendor.name || 'Farid Ullah'}
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      ADMIN
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-orange-600 truncate max-w-[150px]">
                      {currentVendor.name}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 stroke-[2.5] group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
            </div>

            {/* Section 1: Monitor your performance */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
                Monitor your performance
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  onClick={() => setIsTopProgramOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Trophy className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Top Restaurant Program</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setActiveBottomNav('overview')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <BarChart2 className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Performance</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsOrderHistoryOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <History className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Order history</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Star className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Reviews</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsInvoicesModalOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Receipt className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Invoices</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsReportsModalOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <FileSpreadsheet className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Reports</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Section 2: Grow your business */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
                Grow your business
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  onClick={() => setActiveBottomNav('ads')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Megaphone className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Advertising</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsPromotionsOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Tag className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Promotions</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Section 3: Manage your business */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
                Manage your business
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  onClick={() => setIsPaymentsModalOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Landmark className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Payments</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setIsOpeningTimesOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Clock className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Opening times</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => openVendorProfileModal()}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Settings className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Section 4: About panda partner */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
                About panda partner
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <HelpCircle className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Help Center</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setCurrentLanguage(prev => prev === 'English' ? 'বাংলা' : 'English')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Globe className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Language</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-sm font-semibold text-slate-600">{currentLanguage}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setFeedbackSubmitted(false);
                    setFeedbackText('');
                    setIsFeedbackModalOpen(true);
                  }}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <MessageSquareQuote className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">Send us feedback</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => {
                    if (currentUser && currentUser.role === 'vendor') {
                      setIsLogoutConfirmOpen(true);
                    } else {
                      setVendorAuthMode('login');
                      setIsVendorAuthModalOpen(true);
                    }
                  }}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <LogOut className="w-5 h-5 text-slate-800 stroke-[2]" />
                    <span className="text-[15px] font-bold text-slate-900">
                      {currentUser && currentUser.role === 'vendor' ? 'Logout' : 'Partner Login'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Version Footer (Matching Screenshot 2) */}
            <div className="text-center py-4 text-xs font-medium text-slate-400">
              Version 3.60.0
            </div>
          </div>
        </div>
      ) : (
        /* 
          ========================================================================
          OVERVIEW VIEW (100% Matching Screenshot_20260930_193547_panda partner.jpg)
          With FoodHub Orange theme
          ========================================================================
        */
        <>
          {/* TOP BRAND HEADER */}
          <header className="bg-gradient-to-b from-orange-600 via-orange-500 to-orange-500 text-white pt-4 pb-6 px-4 rounded-b-[2.2rem] shadow-md">
            <div className="max-w-md mx-auto space-y-4">
              {/* Top Row: Store Name Pill */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <button
                    onClick={() => openVendorProfileModal()}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-white/40 bg-white/15 backdrop-blur-md text-white text-left hover:bg-white/25 transition cursor-pointer"
                    title="Click to open vendor profile (logo & cover photo)"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Store className="w-4 h-4 shrink-0 text-white" />
                      <span className="font-bold text-xs sm:text-sm truncate">
                        {currentVendor.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-[10px] text-white/80 font-medium">Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Performance Row */}
              <div className="flex items-center justify-between text-white pt-1">
                <h2 className="text-base font-black tracking-tight">Performance</h2>
                <button
                  onClick={cyclePerformancePeriod}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-white/90 hover:text-white transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{performancePeriod}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Floating Performance Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-4 text-slate-900">
                <div className="grid grid-cols-2 divide-x divide-slate-100 pb-3">
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-slate-500 block">Sales</span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-mono">
                      BDT {todaySales}
                    </p>
                  </div>

                  <div className="pl-4">
                    <span className="text-xs font-semibold text-slate-500 block">Orders</span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-mono">
                      {todayOrdersCount}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>
                      {isStoreOnline ? 'Your operations are doing fine' : 'Kitchen is currently paused'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </header>

          {/* Overview Main Body */}
          <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
            {/* 3 Quick Action Cards */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setIsOrderHistoryOpen(true)}
                className="flex flex-col items-start justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition text-left h-24"
              >
                <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <History className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  Order history
                </span>
              </button>

              <button
                onClick={() => setIsPromotionsOpen(true)}
                className="flex flex-col items-start justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition text-left h-24"
              >
                <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Tag className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  Promotions
                </span>
              </button>

              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex flex-col items-start justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition text-left h-24"
              >
                <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  Help
                </span>
              </button>
            </div>



            {/* Live Kitchen Queue */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Live Kitchen Queue</span>
                  {pendingOrders.length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  )}
                </h3>
                <span className="text-xs font-bold text-orange-600">
                  {pendingOrders.length + preparingOrders.length + readyForPickupOrders.length} Active
                </span>
              </div>

              {pendingOrders.length === 0 && preparingOrders.length === 0 && readyForPickupOrders.length === 0 ? (
                <div className="p-5 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No orders cooking right now. New customer orders will appear here automatically!
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Incoming */}
                  {pendingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-2xl border-2 border-rose-300 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-slate-900 text-sm">#{ord.order_code}</span>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          Incoming New Order
                        </span>
                      </div>

                      <div className="space-y-1 text-xs border-y border-slate-100 py-2">
                        {ord.items?.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-700">
                            <span>{it.quantity}x {it.item_name}</span>
                            <span className="font-mono font-bold">{settings.currency_symbol}{it.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span>Collect Cash from Rider:</span>
                        <span className="font-mono text-orange-600 text-base">
                          {settings.currency_symbol}{ord.food_total}
                        </span>
                      </div>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'food_preparing')}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                      >
                        Accept & Start Preparing
                      </button>
                    </div>
                  ))}

                  {/* In Kitchen */}
                  {preparingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <ChefHat className="w-4 h-4 text-orange-600" />
                          <span className="font-black text-slate-900 text-sm">#{ord.order_code}</span>
                        </div>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Cooking in Kitchen
                        </span>
                      </div>

                      <div className="space-y-1 text-xs border-y border-slate-100 py-2">
                        {ord.items?.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-700">
                            <span>{it.quantity}x {it.item_name}</span>
                            <span className="font-mono">{settings.currency_symbol}{it.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'ready_for_pickup')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                      >
                        Mark Ready for Rider Pickup
                      </button>
                    </div>
                  ))}

                  {/* Ready for Pickup */}
                  {readyForPickupOrders.map((ord) => {
                    const assignedRider = riders.find((r) => r.id === ord.rider_id);

                    return (
                      <div
                        key={ord.id}
                        className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Bike className="w-4 h-4 text-blue-600" />
                            <span className="font-black text-slate-900 text-sm">#{ord.order_code}</span>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {ord.rider_id ? 'Rider On The Way' : 'Searching Nearby Rider'}
                          </span>
                        </div>

                        {assignedRider ? (
                          <div className="p-2.5 bg-blue-50 rounded-xl text-xs">
                            <p className="font-bold text-blue-900">Rider: {assignedRider.name}</p>
                            <p className="text-blue-700 text-[11px]">Phone: {assignedRider.phone} ({assignedRider.vehicle_type})</p>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50 rounded-xl text-xs text-amber-800">
                            Dispatching to delivery riders within {settings.rider_match_radius_km} km radius...
                          </div>
                        )}

                        <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-orange-700 font-bold block uppercase">Cash from Rider:</span>
                            <span className="text-base font-black font-mono text-orange-900">
                              {settings.currency_symbol}{ord.food_total}
                            </span>
                          </div>
                          <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 rounded-md font-bold">
                            Cash on Counter
                          </span>
                        </div>

                        {ord.food_cash_paid_to_vendor ? (
                          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-bold flex items-center justify-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Cash Paid by Rider & Handed Over</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              updateOrderStatus(ord.id, 'rider_on_way_to_customer', {
                                food_cash_paid_to_vendor: true,
                              });
                            }}
                            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black shadow-xs transition"
                          >
                            Confirm Cash Received & Hand Over Food
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Smart Actions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Smart actions</span>
                </h3>
                <button 
                  onClick={() => alert('Smart Actions: Accept orders quickly and keep your menu up to date to increase ranking.')}
                  className="text-xs font-bold text-slate-500 hover:text-orange-600 transition flex items-center"
                >
                  <span>More</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="p-4 bg-orange-50/70 border border-orange-100 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                  Customers couldn't order from you for 367 hours recently
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  92% of all restaurants have better availability
                </p>
                <button 
                  onClick={() => {
                    setIsStoreOnline(true);
                    alert('Store availability updated to 100% active!');
                  }}
                  className="text-xs font-black text-orange-600 hover:text-orange-700 transition inline-flex items-center space-x-1 pt-1"
                >
                  <span>Get started</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </section>

            {/* Reviews */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Reviews</h3>
                <button 
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="text-xs font-bold text-slate-500 hover:text-orange-600 transition flex items-center cursor-pointer"
                >
                  <span>More</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs max-w-[170px] space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Store rating</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {currentVendor.rating ? currentVendor.rating.toFixed(1) : '4.8'}
                  </span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
            </section>
          </main>
        </>
      )}

      {/* 
        ========================================================================
        BOTTOM FLOATING NAVIGATION DOCK (100% Matching Screenshot)
        Tabs: Overview, Menu, Ads, More
        ========================================================================
      */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Overview */}
          <button
            onClick={() => setActiveBottomNav('overview')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'overview' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'overview' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <LayoutGrid className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          {/* Menu */}
          <button
            onClick={() => setActiveBottomNav('menu')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'menu' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'menu' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>

          {/* Ads */}
          <button
            onClick={() => setActiveBottomNav('ads')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'ads' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'ads' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <Megaphone className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5">Ads</span>
          </button>

          {/* More */}
          <button
            onClick={() => setActiveBottomNav('more')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'more' ? 'text-rose-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'more' ? 'bg-rose-50 text-rose-600' : ''}`}>
              <MenuIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* 
        ========================================================================
        MODAL: ADD CATEGORY (Selection Grid from Predefined Master List)
        ========================================================================
      */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Select Category</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Choose a category to add to your menu</p>
              </div>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
              {foodCategories
                .filter(cat => cat.is_active !== false && (cat.category_type === 'food' || !cat.category_type))
                .map((cat) => {
                  const isExisting = allCategoryNames.some(cName => cName.toLowerCase().trim() === cat.name.toLowerCase().trim());
                  return (
                    <button
                      key={cat.id}
                      disabled={isExisting}
                      onClick={() => {
                        if (!customCategories.some(c => c.toLowerCase().trim() === cat.name.toLowerCase().trim())) {
                          setCustomCategories(prev => [...prev, cat.name]);
                        }
                        setIsAddCategoryOpen(false);
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                        isExisting 
                          ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 cursor-pointer active:scale-95'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-50 mb-1.5 shadow-2xs">
                        <span>{cat.icon || '🍽️'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: ADD DISH
        ========================================================================
      */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Food Item</h3>
              <button onClick={() => setIsAddDishOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Sheem Alu Bhaji / Kacchi Biryani"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="40.00"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold bg-white cursor-pointer"
                  >
                    {allCategoryNames.length > 0 ? (
                      allCategoryNames.map((catName) => {
                        const matchedCat = foodCategories.find(c => c.name.toLowerCase().trim() === catName.toLowerCase().trim());
                        return (
                          <option key={catName} value={catName}>
                            {matchedCat?.icon || '🍽️'} {catName}
                          </option>
                        );
                      })
                    ) : (
                      foodCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon || '🍽️'} {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="1:1 - Freshly prepared authentic recipe..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Food Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // 1. Base64 Preview & Data URL fallback
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result as string;
                      if (dataUrl) {
                        setDishImageUrl(dataUrl);
                      }
                    };
                    reader.readAsDataURL(file);

                    // 2. Upload to Supabase Storage bucket 'images' in vendor folder
                    if (isSupabaseConfigured && supabase && currentVendor) {
                      try {
                        const folderName = currentVendor.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const filePath = `${folderName}/dish_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                        const { error } = await supabase.storage.from('images').upload(filePath, file, { upsert: true });
                        if (!error) {
                          const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
                          if (publicUrlData?.publicUrl) {
                            setDishImageUrl(publicUrlData.publicUrl);
                          }
                        }
                      } catch (err) {
                        console.warn('Storage upload notice:', err);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
                {dishImageUrl && (
                  <div className="mt-2.5 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                    <img src={dishImageUrl} alt="Uploaded Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Variations Builder Section */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Variations & Portion Sizes (ভ্যারিয়েশন)</h4>
                    <p className="text-[11px] text-slate-500">Add portion sizes (e.g. Full, Half, 1:1, 1:2) or choices</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariationGroup}
                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Group</span>
                  </button>
                </div>

                {dishVariations.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    No variations added yet. Click "+ Add Group" to create options like Portion Size or Add-ons.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dishVariations.map((group, groupIdx) => (
                      <div key={group.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateVariationGroup(groupIdx, { name: e.target.value })}
                            placeholder="Group Name (e.g. Size / Portion)"
                            className="flex-1 px-2.5 py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={group.type}
                            onChange={(e) => updateVariationGroup(groupIdx, { type: e.target.value as 'single' | 'multiple' })}
                            className="px-2 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg"
                          >
                            <option value="single">Single Choice (Radio)</option>
                            <option value="multiple">Multiple Choice (Checkbox)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeVariationGroup(groupIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Options in this group */}
                        <div className="space-y-1.5 pl-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Option Name (e.g. Full, 1:2)</span>
                            <span>Extra Price (+BDT)</span>
                          </div>
                          {group.options.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => updateOptionInGroup(groupIdx, optIdx, { name: e.target.value })}
                                placeholder="Option Name"
                                className="flex-1 px-2.5 py-1 text-xs border border-slate-200 bg-white rounded-lg font-medium"
                              />
                              <input
                                type="number"
                                value={opt.price}
                                onChange={(e) => updateOptionInGroup(groupIdx, optIdx, { price: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-xs border border-slate-200 bg-white rounded-lg font-mono font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => removeOptionFromGroup(groupIdx, optIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOptionToGroup(groupIdx)}
                            className="mt-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Option</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  {editingDish ? 'Update Dish & Variations' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: ORDER HISTORY
        ========================================================================
      */}
      {isOrderHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Order History</h3>
              </div>
              <button onClick={() => setIsOrderHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {vendorOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No order records found.</p>
              ) : (
                vendorOrders.map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-slate-900">#{ord.order_code}</span>
                      <span className="text-orange-600 font-mono">{settings.currency_symbol}{ord.food_total}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      {new Date(ord.created_at).toLocaleString()} &bull; {ord.customer_name}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white border border-slate-200">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: PROMOTIONS
        ========================================================================
      */}
      {isPromotionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Promotions & Discounts</h3>
              </div>
              <button onClick={() => setIsPromotionsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1">
                <p className="font-bold text-orange-900">Active Campaign: Flat 15% OFF</p>
                <p className="text-slate-600">Code: back4more (Min. order ৳299)</p>
              </div>
              <p className="text-slate-500">
                Create new seasonal festival discounts to attract more local diners in your area.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsPromotionsOpen(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: HELP
        ========================================================================
      */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Vendor Support Hotline</h3>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">FoodHub Restaurant Partner Desk (24/7):</p>
              <p>📞 Phone: 16212 (Toll Free)</p>
              <p>✉️ Email: partner-support@foodhub.com</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">Rider Handover Rule:</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Always inspect the cash bill paid by the assigned rider before handing over the hot food parcel.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENDOR AUTHENTICATION POPUP MODAL */}
      {isVendorAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 relative">
            <button 
              onClick={() => setIsVendorAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Vendor Authentication</h3>
                <p className="text-xs text-slate-500">Partner Login & Registration</p>
              </div>
            </div>

            <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-black">
              <button
                type="button"
                onClick={() => setVendorAuthMode('login')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  vendorAuthMode === 'login' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setVendorAuthMode('register')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  vendorAuthMode === 'register' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Registration / Password
              </button>
            </div>

            {vendorAuthMode === 'login' ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const phoneInput = (e.currentTarget.elements.namedItem('vLoginPhone') as HTMLInputElement)?.value || '';
                  const passInput = (e.currentTarget.elements.namedItem('vLoginPass') as HTMLInputElement)?.value || '';
                  const res = loginUser('vendor', phoneInput, passInput);
                  if (res.success) {
                    alert('✅ Vendor login successful!');
                    setIsVendorAuthModalOpen(false);
                  } else if (res.requiresPasswordSetup) {
                    setVendorAuthMode('register');
                    alert('First-time login detected. Please set your password.');
                  } else {
                    alert(res.message || 'Login failed');
                  }
                }}
                className="space-y-3 pt-2 text-xs font-bold"
              >
                <div>
                  <label className="text-slate-700 block mb-1">Phone Number *</label>
                  <input 
                    name="vLoginPhone"
                    type="tel"
                    required
                    placeholder="e.g. 01711122233"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Password *</label>
                  <input 
                    name="vLoginPass"
                    type="password"
                    required
                    placeholder="Enter password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Login to Partner Portal
                </button>
              </form>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const phoneInput = (e.currentTarget.elements.namedItem('vRegPhone') as HTMLInputElement)?.value || '';
                  const passInput = (e.currentTarget.elements.namedItem('vRegPass') as HTMLInputElement)?.value || '';
                  const ok = setPasswordForUser('vendor', phoneInput, passInput);
                  if (ok) {
                    alert('✅ Vendor password registered & logged in successfully!');
                    setIsVendorAuthModalOpen(false);
                  } else {
                    alert('This phone number is not registered as a Vendor by Admin.');
                  }
                }}
                className="space-y-3 pt-2 text-xs font-bold"
              >
                <div>
                  <label className="text-slate-700 block mb-1">Admin Registered Phone *</label>
                  <input 
                    name="vRegPhone"
                    type="tel"
                    required
                    placeholder="e.g. 01711122233"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Set New Password *</label>
                  <input 
                    name="vRegPass"
                    type="password"
                    required
                    placeholder="Create password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Complete Registration
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: VENDOR PROFILE WINDOW (VIEW-ONLY INFO, PROFILE & COVER IMAGES EDIT)
        ========================================================================
      */}
      {isStoreBrandingOpen && currentVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Store className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    Vendor Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Profile & Cover Image Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStoreBrandingOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {uploadFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
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

              {/* COVER & PROFILE PHOTO COMPOSITION CARD */}
              <div className="bg-slate-50 rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
                
                {/* 1. Cover Banner Section */}
                <div className="relative h-36 sm:h-44 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 group overflow-hidden">
                  {currentVendor.cover_image ? (
                    <img
                      src={currentVendor.cover_image}
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
                      <Camera className="w-3.5 h-3.5 text-orange-400" />
                      <span>{isUploadingCover ? 'Uploading...' : currentVendor.cover_image ? 'Change Cover' : 'Add Cover'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCover || isDeletingCover}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !currentVendor) return;
                          setIsUploadingCover(true);
                          setUploadFeedback(null);
                          const oldCoverUrl = currentVendor.cover_image;
                          // uploadVendorImage automatically deletes previous image from storage
                          const res = await uploadVendorImage(currentVendor.name, file, 'cover', oldCoverUrl);
                          setIsUploadingCover(false);
                          if (res.success && res.url) {
                            await updateVendor(currentVendor.id, { cover_image: res.url });
                            setProfileCoverUrlInput(res.url);
                            setUploadFeedback({ 
                              type: 'success', 
                              message: '✅ পূর্বের কভার ছবি ডাটাবেস ও স্টোরেজ থেকে ডিলিট করে নতুন কভার ছবি সফলভাবে সেভ করা হয়েছে!' 
                            });
                          } else {
                            setUploadFeedback({ type: 'error', message: res.message || 'Failed to upload cover photo.' });
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Delete Cover Photo Button */}
                    {currentVendor.cover_image && (
                      <button
                        disabled={isDeletingCover || isUploadingCover}
                        onClick={async () => {
                          if (!currentVendor) return;
                          if (confirm('কভার ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete cover photo from database and storage?)')) {
                            setIsDeletingCover(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(currentVendor.id, 'cover');
                            setIsDeletingCover(false);
                            if (res.success) {
                              setProfileCoverUrlInput('');
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ কভার ছবি ডাটাবেস ও স্টোরেজ থেকে সফলভাবে ডিলিট করা হয়েছে।' 
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

                {/* 2. Profile Photo / Avatar Section (Overlapping bottom) */}
                <div className="px-5 pt-0 pb-5 -mt-12 sm:-mt-14 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="flex items-end space-x-3.5">
                    {/* Avatar Circle */}
                    <div className="relative group/avatar shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-slate-100 shadow-lg overflow-hidden flex items-center justify-center text-slate-800 font-black text-xl">
                        {currentVendor.logo_url ? (
                          <img
                            src={currentVendor.logo_url}
                            alt="Store Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{getUserInitials(currentVendor.name)}</span>
                        )}
                      </div>

                      {/* Camera Badge to Upload/Change Profile Photo */}
                      <label className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md cursor-pointer transition border-2 border-white active:scale-95">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingLogo || isDeletingLogo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !currentVendor) return;
                            setIsUploadingLogo(true);
                            setUploadFeedback(null);
                            const oldLogoUrl = currentVendor.logo_url;
                            // uploadVendorImage automatically deletes previous image from storage
                            const res = await uploadVendorImage(currentVendor.name, file, 'logo', oldLogoUrl);
                            setIsUploadingLogo(false);
                            if (res.success && res.url) {
                              await updateVendor(currentVendor.id, { logo_url: res.url });
                              setProfileLogoUrlInput(res.url);
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ পূর্বের প্রোফাইল ছবি ডাটাবেস ও স্টোরেজ থেকে ডিলিট করে নতুন প্রোফাইল ছবি সফলভাবে সেভ করা হয়েছে!' 
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
                        {currentVendor.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {currentVendor.cuisine || 'Fast Food & Restaurant'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                        সুপারিশকৃত সাইজ: 1:1 স্কয়ার (500×500 px)
                      </span>
                    </div>
                  </div>

                  {/* Profile Photo Action Buttons */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {/* Add / Change Photo */}
                    <label className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'Uploading...' : currentVendor.logo_url ? 'Change Photo' : 'Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo || isDeletingLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !currentVendor) return;
                          setIsUploadingLogo(true);
                          setUploadFeedback(null);
                          const oldLogoUrl = currentVendor.logo_url;
                          // uploadVendorImage automatically deletes previous image from storage
                          const res = await uploadVendorImage(currentVendor.name, file, 'logo', oldLogoUrl);
                          setIsUploadingLogo(false);
                          if (res.success && res.url) {
                            await updateVendor(currentVendor.id, { logo_url: res.url });
                            setProfileLogoUrlInput(res.url);
                            setUploadFeedback({ 
                              type: 'success', 
                              message: '✅ পূর্বের প্রোফাইল ছবি ডাটাবেস ও স্টোরেজ থেকে ডিলিট করে নতুন প্রোফাইল ছবি সফলভাবে সেভ করা হয়েছে!' 
                            });
                          } else {
                            setUploadFeedback({ type: 'error', message: res.message || 'Failed to upload profile photo.' });
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Delete Photo Button */}
                    {currentVendor.logo_url && (
                      <button
                        disabled={isDeletingLogo || isUploadingLogo}
                        onClick={async () => {
                          if (!currentVendor) return;
                          if (confirm('প্রোফাইল ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete profile photo from database and storage?)')) {
                            setIsDeletingLogo(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(currentVendor.id, 'logo');
                            setIsDeletingLogo(false);
                            if (res.success) {
                              setProfileLogoUrlInput('');
                              setUploadFeedback({ 
                                type: 'success', 
                                message: '✅ প্রোফাইল ছবি ডাটাবেস ও স্টোরেজ থেকে সফলভাবে ডিলিট করা হয়েছে।' 
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
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-orange-600 transition cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Or enter web image URL directly</span>
                  </span>
                  <span className="text-[11px] text-orange-600 underline">
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:border-orange-500 font-mono"
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:border-orange-500 font-mono"
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
                    <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
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
                      {currentVendor.name || '—'}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone Number</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm font-mono truncate">
                      {currentVendor.phone || '—'}
                    </div>
                  </div>

                  {/* Store Address */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs sm:col-span-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Store Address / Branch</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs">
                      {currentVendor.address || 'No specific address provided'}
                    </div>
                  </div>

                  {/* Cuisine */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Utensils className="w-3 h-3 text-slate-400" />
                      <span>Cuisine / Category</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs truncate">
                      {currentVendor.cuisine || 'Fast Food & Restaurant'}
                    </div>
                  </div>

                  {/* Zone */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Zone / City</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs truncate">
                      {currentVendor.zone || 'Chittagong / Dhaka'}
                    </div>
                  </div>
                </div>

                {/* Information Notice */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    এই তথ্যগুলো ভেন্ডর শুধুমাত্র দেখতে পারবেন কিন্তু পরিবর্তন বা এডিট করতে পারবেন না। ভেন্ডর শুধুমাত্র প্রোফাইল ছবি ও কভার ছবি পরিবর্তন বা ডিলিট করতে পারবেন। রেস্টুরেন্টের তথ্য পরিবর্তনের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStoreBrandingOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: VENDOR REVIEWS SCREEN (100% Matching Screenshot 1 & 2)
        ========================================================================
      */}
      {isReviewsModalOpen && currentVendor && (
        <div className="fixed inset-0 z-50 bg-[#f8f9fa] overflow-y-auto animate-in fade-in">
          <VendorReviewsView
            vendor={currentVendor}
            orders={vendorOrders}
            onClose={() => setIsReviewsModalOpen(false)}
            onOpenStoreSelector={() => setIsStoreSelectorOpen(true)}
          />
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: STORE SELECTOR
        ========================================================================
      */}
      {isStoreSelectorOpen && currentVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-slate-800" />
                <h3 className="font-black text-slate-900 text-base">Select Restaurant</h3>
              </div>
              <button
                onClick={() => setIsStoreSelectorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setCurrentVendor(v);
                    setIsStoreSelectorOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    v.id === currentVendor.id
                      ? 'border-[#d70f64] bg-pink-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                      {v.unique_id || 'VND'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {v.name} {v.unique_id ? `(${v.unique_id})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{v.zone || v.address}</p>
                    </div>
                  </div>
                  {v.id === currentVendor.id && (
                    <CheckCircle className="w-4 h-4 text-[#d70f64] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
