import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { MenuItem, Order, OrderStatus, Vendor } from '../../types/database';
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
  Search
} from 'lucide-react';

export const VendorPortal: React.FC = () => {
  const { 
    vendors, 
    currentVendor, 
    setCurrentVendor, 
    menuItems, 
    addMenuItem, 
    toggleMenuItemAvailability, 
    deleteMenuItem,
    orders, 
    updateOrderStatus,
    settings,
    riders,
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
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
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

  // New Dish Form
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');

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
    ...customCategories,
    ...(existingCategories.length === 0 ? ['Bhorta & Bhaji', 'Main Course', 'Fast Food'] : [])
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

    addMenuItem({
      vendor_id: currentVendor.id,
      name: dishName.trim(),
      description: dishDescription.trim(),
      price: parseFloat(dishPrice),
      category: dishCategory,
      is_available: true,
      image_url: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    });

    setDishName('');
    setDishPrice('');
    setDishDescription('');
    setDishImageUrl('');
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
                  onClick={() => setIsStoreSelectorOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-slate-300 bg-white text-slate-800 hover:border-slate-400 transition text-left shadow-2xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Store className="w-4 h-4 shrink-0 text-slate-700" />
                    <span className="font-bold text-xs sm:text-sm truncate">
                      {currentVendor.name}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 ml-1" />
                </button>

                {/* Store Switcher Dropdown */}
                {isStoreSelectorOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 space-y-1 text-slate-900">
                    <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                      Select Your Kitchen
                    </p>
                    {vendors.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setCurrentVendor(v);
                          setIsStoreSelectorOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                          v.id === currentVendor.id 
                            ? 'bg-orange-50 text-orange-600' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Store className="w-4 h-4 shrink-0" />
                          <span className="truncate">{v.name}</span>
                        </div>
                        {v.id === currentVendor.id && (
                          <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
              {allCategoryNames.map((categoryName) => {
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
                            setEditingCategory(categoryName);
                            setEditedCategoryName(categoryName);
                          }}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                          title="Edit Category Name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Category Content (when expanded) */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-3.5">
                        {/* "+ Add" Button inside Category (Matching Screenshot) */}
                        <button
                          onClick={() => {
                            setDishCategory(categoryName);
                            setIsAddDishOpen(true);
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

                                {/* Center: Name, Description, No options, Price */}
                                <div className="flex-1 min-w-0 pr-2">
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description || '1:1 - Special restaurant recipe'}
                                  </p>

                                  <div className="flex items-center justify-between mt-1 text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      No options
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                      BDT {item.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: iOS Style Switch Toggle */}
                                <div className="flex items-center space-x-2 shrink-0">
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
                                    className="text-slate-300 hover:text-rose-500 p-1 transition"
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
              })}
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
          MORE & CASH LEDGER VIEW
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 pb-28">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between z-10">
            <h2 className="text-base font-black text-slate-900">Partner Settings & Ledger</h2>
            <button onClick={() => setActiveBottomNav('overview')} className="p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900">Cash Flow & Settlements</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 block">Total Cash Collected</span>
                  <span className="text-lg font-black font-mono text-emerald-900">
                    {settings.currency_symbol}{cashCollectedFromRiders}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 block">Pending Handover</span>
                  <span className="text-lg font-black font-mono text-amber-900">
                    {settings.currency_symbol}{pendingCashToReceive}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2 text-xs">
              <h4 className="font-black text-slate-900 text-sm">Restaurant Info</h4>
              <p className="text-slate-600 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>{currentVendor.address}</span>
              </p>
              <p className="text-slate-400 font-mono text-[11px]">
                Lat: {currentVendor.latitude.toFixed(4)}, Lng: {currentVendor.longitude.toFixed(4)}
              </p>
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
              {/* Top Row: Store Selector Pill + Close/Power Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <button
                    onClick={() => setIsStoreSelectorOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-white/40 bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition text-left"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Store className="w-4 h-4 shrink-0 text-white" />
                      <span className="font-bold text-xs sm:text-sm truncate">
                        {currentVendor.name}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 shrink-0 text-white/80 ml-1" />
                  </button>

                  {/* Store Switcher Dropdown */}
                  {isStoreSelectorOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 space-y-1 text-slate-900">
                      <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                        Select Your Kitchen
                      </p>
                      {vendors.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setCurrentVendor(v);
                            setIsStoreSelectorOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                            v.id === currentVendor.id 
                              ? 'bg-orange-50 text-orange-600' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Store className="w-4 h-4 shrink-0" />
                            <span className="truncate">{v.name}</span>
                          </div>
                          {v.id === currentVendor.id && (
                            <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsStoreOnline(prev => !prev)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-xs shrink-0 ${
                    isStoreOnline 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'bg-red-500 text-white'
                  }`}
                  title={isStoreOnline ? 'Kitchen Online (Tap to pause)' : 'Kitchen Paused (Tap to go online)'}
                >
                  {isStoreOnline ? (
                    <Power className="w-4 h-4" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </button>
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

            {/* Direct Link to Dedicated orders.html */}
            <a
              href="./orders.html"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-lg hover:from-black hover:to-slate-900 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">orders.html</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Dedicated Live Order Receiving Hub
                  </h4>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {pendingOrders.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-bounce">
                    {pendingOrders.length} New
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400 group-hover:text-white">Open Terminal ↗</span>
              </div>
            </a>

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
                  onClick={() => alert('Customer reviews: High ratings on food quality and packaging!')}
                  className="text-xs font-bold text-slate-500 hover:text-orange-600 transition flex items-center"
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
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'more' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'more' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <MenuIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* 
        ========================================================================
        MODAL: ADD CATEGORY
        ========================================================================
      */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Bhorta & Bhaji / Biryani / Dessert"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: EDIT CATEGORY
        ========================================================================
      */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Edit Category Name</h3>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rename Category</label>
                <input
                  type="text"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editedCategoryName.trim()) {
                      setCustomCategories(prev => [...prev.filter(c => c !== editingCategory), editedCategoryName.trim()]);
                    }
                    setEditingCategory(null);
                  }}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Update
                </button>
              </div>
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
                  <input
                    type="text"
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    placeholder="Bhorta & Bhaji"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
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
                        const filePath = `${currentVendor.id}/dish_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Save Dish
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
    </div>
  );
};
