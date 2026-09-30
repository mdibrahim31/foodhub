import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
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
  Percent
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
    riders
  } = useDelivery();

  // Navigation & View States (Matching Screenshot_20260930_193547_panda partner.jpg)
  const [activeBottomNav, setActiveBottomNav] = useState<'overview' | 'menu' | 'ads' | 'more'>('overview');
  const [performancePeriod, setPerformancePeriod] = useState<'Today' | 'Yesterday' | 'This Week'>('Today');
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  
  // Modals & Panels
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isPromotionsOpen, setIsPromotionsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // New Dish Form
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');

  if (!currentVendor) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active vendor selected. Please register a vendor in Admin or choose from list.
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

  const currentMenuItems = menuItems.filter((m) => m.vendor_id === currentVendor.id);
  const categories = ['All', ...Array.from(new Set(currentMenuItems.map(m => m.category)))];

  const cyclePerformancePeriod = () => {
    if (performancePeriod === 'Today') setPerformancePeriod('Yesterday');
    else if (performancePeriod === 'Yesterday') setPerformancePeriod('This Week');
    else setPerformancePeriod('Today');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      {/* 
        ========================================================================
        1. TOP BRAND HEADER (Matching Screenshot_20260930_193547_panda partner.jpg)
        Color combination: FoodHub Vibrant Orange (#EA580C / #F97316)
        ========================================================================
      */}
      <header className="bg-gradient-to-b from-orange-600 via-orange-500 to-orange-500 text-white pt-4 pb-6 px-4 rounded-b-[2.2rem] shadow-md">
        <div className="max-w-md mx-auto space-y-4">
          {/* Top Row: Store Selector Pill + Close/Power Button */}
          <div className="flex items-center justify-between gap-3">
            {/* Store Pill */}
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

            {/* Right Status Toggle Button (Matching the round [X] / Power in Screenshot) */}
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

          {/* Performance Header Row: "Performance" and "< Today >" */}
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

          {/* Floating Performance White Card (Matching Screenshot_20260930_193547_panda partner.jpg) */}
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-4 text-slate-900">
            <div className="grid grid-cols-2 divide-x divide-slate-100 pb-3">
              {/* Sales Column */}
              <div className="pr-3">
                <span className="text-xs font-semibold text-slate-500 block">Sales</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-mono">
                  BDT {todaySales}
                </p>
              </div>

              {/* Orders Column */}
              <div className="pl-4">
                <span className="text-xs font-semibold text-slate-500 block">Orders</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-mono">
                  {todayOrdersCount}
                </p>
              </div>
            </div>

            {/* Bottom Status bar inside card: "Your operations are doing fine" */}
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

      {/* Main Body Content */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* 
          ========================================================================
          2. THREE QUICK ACTION CARDS (Order history, Promotions, Help)
          Matching Screenshot_20260930_193547_panda partner.jpg
          ========================================================================
        */}
        <div className="grid grid-cols-3 gap-3">
          {/* Order history */}
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

          {/* Promotions */}
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

          {/* Help */}
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

        {/* 
          ========================================================================
          LIVE KITCHEN PIPELINE (Essential for Active Restaurant Operations)
          Incoming Orders -> In Kitchen Cooking -> Ready for Rider Pickup
          ========================================================================
        */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Live Kitchen Queue</span>
              {pendingOrders.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </h3>
            <span className="text-xs font-bold text-orange-600">
              {pendingOrders.length + preparingOrders.length + readyForPickupOrders.length} Active
            </span>
          </div>

          {/* Active Orders List */}
          {pendingOrders.length === 0 && preparingOrders.length === 0 && readyForPickupOrders.length === 0 ? (
            <div className="p-5 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No orders cooking right now. New customer orders will appear here automatically!
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. Pending Incoming Orders */}
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white p-4 rounded-2xl border-2 border-rose-200 shadow-sm space-y-3 animate-pulse"
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

              {/* 2. In Kitchen Cooking */}
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

              {/* 3. Ready for Rider Pickup & Cash Handover */}
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

        {/* 
          ========================================================================
          3. SMART ACTIONS SECTION (Matching Screenshot_20260930_193547_panda partner.jpg)
          ========================================================================
        */}
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

        {/* 
          ========================================================================
          4. REVIEWS SECTION (Matching Screenshot_20260930_193547_panda partner.jpg)
          ========================================================================
        */}
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

      {/* 
        ========================================================================
        5. BOTTOM NAVIGATION DOCK (100% Matching Screenshot)
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
        MENU MODAL / OVERLAY (When Menu Tab is Pressed)
        ========================================================================
      */}
      {activeBottomNav === 'menu' && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col pb-20">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between z-10 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">{currentVendor.name} Menu</h2>
              <p className="text-xs text-slate-500">{currentMenuItems.length} dishes in catalog</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAddDishOpen(true)}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish</span>
              </button>
              <button
                onClick={() => setActiveBottomNav('overview')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Categories Pill Bar */}
          <div className="bg-white border-b border-slate-100 px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
                  selectedCategoryFilter === cat 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dishes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
            {currentMenuItems
              .filter(m => selectedCategoryFilter === 'All' || m.category === selectedCategoryFilter)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{item.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                    <p className="text-sm font-black text-orange-600 font-mono mt-1">
                      {settings.currency_symbol}{item.price}
                    </p>
                  </div>

                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
                  )}

                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => toggleMenuItemAvailability(item.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black transition ${
                        item.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        ADS / PROMOTIONS TAB
        ========================================================================
      */}
      {activeBottomNav === 'ads' && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col pb-20">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between z-10">
            <h2 className="text-base font-black text-slate-900">Ads & Restaurant Booster</h2>
            <button onClick={() => setActiveBottomNav('overview')} className="p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 max-w-md mx-auto w-full space-y-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 rounded-2xl text-white shadow-md space-y-2">
              <h3 className="font-black text-base">Get 3x More Orders</h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Featured restaurant placements appear at the very top of the customer feed in Banani, Gulshan, and Chittagong.
              </p>
              <button 
                onClick={() => alert('Promotional campaign activated! Your restaurant is now pinned as Featured.')}
                className="mt-2 px-4 py-2 bg-white text-orange-600 rounded-xl text-xs font-black shadow-xs"
              >
                Boost Restaurant Visibility
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Active Discounts</h4>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
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
      )}

      {/* 
        ========================================================================
        MORE TAB (Settings, Cash Ledger, Operating Hours)
        ========================================================================
      */}
      {activeBottomNav === 'more' && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col pb-20">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between z-10">
            <h2 className="text-base font-black text-slate-900">Partner Settings & Ledger</h2>
            <button onClick={() => setActiveBottomNav('overview')} className="p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
            {/* Cash Handover Summary */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900">Cash Flow & Settlements</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 block">Total Cash Collected</span>
                  <span className="text-lg font-black font-mono text-emerald-900">
                    {settings.currency_symbol}{cashCollectedFromRiders}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 block">Pending Handover</span>
                  <span className="text-lg font-black font-mono text-amber-900">
                    {settings.currency_symbol}{pendingCashToReceive}
                  </span>
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
              <h4 className="font-black text-slate-900 text-sm">Restaurant Coordinates</h4>
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

      {/* 
        ========================================================================
        MODAL: ADD DISH
        ========================================================================
      */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
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
                  placeholder="e.g. Kacchi Biryani / Loaded Burger"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price ({settings.currency_symbol})</label>
                  <input
                    type="number"
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    placeholder="Biryani / Pizza / Fast Food"
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
                  placeholder="Special ingredients, portion size..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
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
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
