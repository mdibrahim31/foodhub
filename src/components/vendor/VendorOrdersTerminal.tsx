import React, { useState, useEffect, useRef } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AuthModal } from '../common/AuthModal';
import { Order, OrderStatus, Vendor } from '../../types/database';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Check,
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
  Globe
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
    logoutUser
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
  const [rejectReason, setRejectReason] = useState('Out of key ingredients');
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);
  const [prepTimeSelection, setPrepTimeSelection] = useState<Record<string, number>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});

  // Vendor Drawer & Profile Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    if (!authenticatedVendor) return;
    setProfileLogoUrlInput(authenticatedVendor.logo_url || '');
    setProfileCoverUrlInput(authenticatedVendor.cover_image || '');
    setIsUrlInputMode(false);
    setUploadFeedback(null);
    setIsProfileModalOpen(true);
  };

  const handleApplyWebUrls = async () => {
    if (!authenticatedVendor) return;
    setUploadFeedback(null);
    const updates: Partial<Vendor> = {};
    if (profileLogoUrlInput.trim() !== (authenticatedVendor.logo_url || '')) {
      updates.logo_url = profileLogoUrlInput.trim();
    }
    if (profileCoverUrlInput.trim() !== (authenticatedVendor.cover_image || '')) {
      updates.cover_image = profileCoverUrlInput.trim();
    }
    if (Object.keys(updates).length > 0) {
      await updateVendor(authenticatedVendor.id, updates);
      setUploadFeedback({ type: 'success', message: '✅ ছবির লিংক ডাটাবেসে সফলভাবে আপডেট হয়েছে!' });
    } else {
      setUploadFeedback({ type: 'error', message: 'কোনো নতুন লিংক পরিবর্তন করা হয়নি।' });
    }
  };

  // Audio Ref tracking previous pending count
  const prevPendingCountRef = useRef<number>(0);

  // Strictly matched to logged-in vendor user only — SWITCHING TO OTHER STORES IS DISABLED
  const authenticatedVendor = (currentUser && currentUser.role === 'vendor')
    ? (vendors.find(v => v.id === currentUser.reference_id || v.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) || currentVendor)
    : null;

  const isAuthenticated = Boolean(currentUser && currentUser.role === 'vendor' && authenticatedVendor);

  // Filter orders strictly for THIS restaurant only
  const vendorOrders = authenticatedVendor ? orders.filter((o) => o.vendor_id === authenticatedVendor.id) : [];

  const pendingOrders = vendorOrders.filter((o) => o.status === 'pending');
  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyOrders = vendorOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'food_picked_up');
  const completedOrders = vendorOrders.filter((o) => o.status === 'delivered');

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

  const handleConfirmHandover = (orderId: string) => {
    updateOrderStatus(orderId, 'food_picked_up');
  };

  const handleConfirmReject = () => {
    if (!rejectModalOrder) return;
    updateOrderStatus(rejectModalOrder.id, 'cancelled', { cancellation_reason: rejectReason });
    setRejectModalOrder(null);
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

  // 🔒 STRICT AUTH GATE: Login required to enter the terminal!
  if (!isAuthenticated || !authenticatedVendor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
        <div className="bg-slate-800 text-slate-100 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-700">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-600/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <Store className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              foodiplace Orders Terminal
            </h2>
            <p className="text-xs text-slate-400 font-bold">
              Vendor Partner Login
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-2xl animate-in fade-in">
              {authError}
            </div>
          )}

          <form onSubmit={handleVendorLoginSubmit} className="space-y-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-400 uppercase tracking-wider text-[10px]">Registered Phone Number</label>
              <input
                type="tel"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                placeholder="e.g. 01711122233"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white focus:outline-hidden focus:border-rose-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 uppercase tracking-wider text-[10px]">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-rose-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-rose-600/30 transition cursor-pointer"
            >
              Login to Orders Terminal
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fed9de] sm:py-6 flex flex-col justify-start items-center font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Mobile Device Frame matching Sample Image 2 */}
      <div className="w-full max-w-md bg-white sm:rounded-[2.5rem] shadow-xl min-h-screen sm:min-h-[92vh] flex flex-col overflow-hidden relative border-x border-pink-200/50">
        
        {/* 
          ========================================================================
          TOP HEADER (100% Matching Sample Image 2)
          Hamburger Menu ≡ (left) | Storefront with Clock + ● OPEN Pill (right)
          ========================================================================
        */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between bg-white shrink-0">
          {/* Left: Hamburger menu icon */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1 -ml-1 text-slate-800 hover:text-black transition cursor-pointer active:scale-95"
            title="Open Menu & Store Settings"
          >
            <Menu className="w-7 h-7 stroke-[2.2]" />
          </button>

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
                <span className="text-2xl sm:text-3xl font-black text-rose-600">{pendingOrders.length}</span>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[95px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
                  <span className="text-sm font-bold text-slate-800">No new orders</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border-2 border-rose-500 rounded-2xl p-3.5 shadow-md space-y-2.5 animate-pulse"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-black text-rose-600">#{order.order_code}</span>
                        <span className="font-black text-slate-900">৳{order.total_cash_payable}</span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium leading-snug">
                        {order.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(', ')}
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => setRejectModalOrder(order)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => vendorAcceptOrderWithPrepTime(order.id, 15)}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Upcoming Orders Column */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Upcoming</h2>
                <span className="text-2xl sm:text-3xl font-black text-rose-600">{readyOrders.length}</span>
              </div>

              {readyOrders.length === 0 ? (
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 min-h-[95px] flex items-center justify-center text-center border border-slate-100 shadow-2xs">
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
              <span className="text-2xl sm:text-3xl font-black text-rose-600">{preparingOrders.length}</span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 min-h-[100px] flex items-center justify-center text-center border border-slate-100 shadow-2xs mt-3">
                <span className="text-sm font-bold text-slate-800">No accepted orders</span>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-mono font-black text-amber-700 text-sm">#{order.order_code}</span>
                        <p className="font-bold text-slate-900 mt-0.5">{order.customer_name}</p>
                      </div>
                      <button
                        onClick={() => setPrintModalOrder(order)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition cursor-pointer"
                        title="Print Kitchen Docket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between font-medium">
                          <span>{it.quantity}x {it.item_name}</span>
                          <span className="font-mono">৳{it.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => vendorMarkFoodReady(order.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Food Ready</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* 
          ========================================================================
          SLIDE-OVER DRAWER (Hamburger Menu ≡)
          Quick access to Store Profile, Status, Sound Alerts, Settings & Logout
          ========================================================================
        */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-left duration-200"
            >
              <div className="space-y-5">
                {/* Drawer Top: Store Logo, Name & Close */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center overflow-hidden shadow-sm">
                      {authenticatedVendor?.logo_url ? (
                        <img
                          src={authenticatedVendor.logo_url}
                          alt={authenticatedVendor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ChefHat className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-tight">
                        {authenticatedVendor?.name || 'Restaurant Hub'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {authenticatedVendor?.cuisine || 'Kitchen Terminal'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Edit Action Button */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openVendorProfileModal();
                  }}
                  className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-2xl text-xs font-black flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-rose-600" />
                    <span>Store Profile & Photos</span>
                  </div>
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md">Edit</span>
                </button>

                {/* Sound & Auto-Accept Toggles */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">Order Audio Alert</span>
                    <button
                      onClick={() => {
                        setSoundEnabled(!soundEnabled);
                        if (!soundEnabled) playNewOrderSound();
                      }}
                      className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        soundEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {soundEnabled ? 'Enabled 🔊' : 'Muted 🔇'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">Auto-Accept Orders</span>
                    <button
                      onClick={() => setAutoAccept(!autoAccept)}
                      className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        autoAccept ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {autoAccept ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Summary</div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-600">Completed Orders:</span>
                    <span className="text-slate-900 font-mono">{completedOrders.length}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-600">Total Food Sales:</span>
                    <span className="text-emerald-700 font-mono font-black">৳{todayEarnings}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer: Logout */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logoutUser();
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Terminal</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 
        ========================================================================
        MODAL: REJECT ORDER WITH REASON
        ========================================================================
      */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-slate-900 text-base">Decline Order #{rejectModalOrder.order_code}</h3>
            </div>

            <p className="text-xs text-slate-600">
              Please select a reason for declining this order. The customer will be informed immediately.
            </p>

            <div className="space-y-2 text-xs">
              {[
                'Out of key ingredients',
                'Kitchen is at max capacity / Overloaded',
                'Restaurant is closing soon',
                'Item unavailable / Power outage'
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    rejectReason === r
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="reject_reason"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 flex space-x-2 text-xs">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition shadow-md shadow-rose-600/30"
              >
                Confirm Decline
              </button>
            </div>
          </div>
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
              <h2 className="text-base font-black uppercase tracking-wider">{authenticatedVendor?.name}</h2>
              <p className="text-[10px] text-slate-500">{authenticatedVendor?.address}</p>
              <p className="text-[10px] text-slate-500">Tel: {authenticatedVendor?.phone}</p>
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
      {isProfileModalOpen && authenticatedVendor && (
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
                  {authenticatedVendor.cover_image ? (
                    <img
                      src={authenticatedVendor.cover_image}
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
                      <span>{isUploadingCover ? 'Uploading...' : authenticatedVendor.cover_image ? 'Change Cover' : 'Add Cover'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCover || isDeletingCover}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !authenticatedVendor) return;
                          setIsUploadingCover(true);
                          setUploadFeedback(null);
                          const oldCoverUrl = authenticatedVendor.cover_image;
                          const res = await uploadVendorImage(authenticatedVendor.name, file, 'cover', oldCoverUrl);
                          setIsUploadingCover(false);
                          if (res.success && res.url) {
                            await updateVendor(authenticatedVendor.id, { cover_image: res.url });
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
                    {authenticatedVendor.cover_image && (
                      <button
                        disabled={isDeletingCover || isUploadingCover}
                        onClick={async () => {
                          if (!authenticatedVendor) return;
                          if (confirm('কভার ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete cover photo from database?)')) {
                            setIsDeletingCover(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(authenticatedVendor.id, 'cover');
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
                        {authenticatedVendor.logo_url ? (
                          <img
                            src={authenticatedVendor.logo_url}
                            alt="Store Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{authenticatedVendor.name?.charAt(0) || 'V'}</span>
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
                            if (!file || !authenticatedVendor) return;
                            setIsUploadingLogo(true);
                            setUploadFeedback(null);
                            const oldLogoUrl = authenticatedVendor.logo_url;
                            const res = await uploadVendorImage(authenticatedVendor.name, file, 'logo', oldLogoUrl);
                            setIsUploadingLogo(false);
                            if (res.success && res.url) {
                              await updateVendor(authenticatedVendor.id, { logo_url: res.url });
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
                        {authenticatedVendor.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {authenticatedVendor.cuisine || 'Fast Food & Restaurant'}
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
                      <span>{isUploadingLogo ? 'Uploading...' : authenticatedVendor.logo_url ? 'Change Photo' : 'Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo || isDeletingLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !authenticatedVendor) return;
                          setIsUploadingLogo(true);
                          setUploadFeedback(null);
                          const oldLogoUrl = authenticatedVendor.logo_url;
                          const res = await uploadVendorImage(authenticatedVendor.name, file, 'logo', oldLogoUrl);
                          setIsUploadingLogo(false);
                          if (res.success && res.url) {
                            await updateVendor(authenticatedVendor.id, { logo_url: res.url });
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
                    {authenticatedVendor.logo_url && (
                      <button
                        disabled={isDeletingLogo || isUploadingLogo}
                        onClick={async () => {
                          if (!authenticatedVendor) return;
                          if (confirm('প্রোফাইল ছবি ডাটাবেস থেকে ডিলিট করতে চান?\n(Delete profile photo from database?)')) {
                            setIsDeletingLogo(true);
                            setUploadFeedback(null);
                            const res = await deleteVendorImage(authenticatedVendor.id, 'logo');
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
                      {authenticatedVendor.name || '—'}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone Number</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm font-mono truncate">
                      {authenticatedVendor.phone || '—'}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Store Address</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs leading-relaxed">
                      {authenticatedVendor.address || '—'}
                    </div>
                  </div>

                  {/* Cuisine */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Utensils className="w-3 h-3 text-slate-400" />
                      <span>Cuisine Type</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {authenticatedVendor.cuisine || 'Restaurant & Fast Food'}
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
                        {authenticatedVendor.zone || 'Chittagong Central Zone'}
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

    </div>
  );
};
