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
  LogOut
} from 'lucide-react';

export const VendorOrdersTerminal: React.FC = () => {
  const {
    vendors,
    currentVendor,
    setCurrentVendor,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* 
        ========================================================================
        1. RESTAURANT ORDERS HEADER BAR (Customer-Site Clean White Theme)
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand + Logged-in Store Name (Strictly Single Profile - No Switching) */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
              <ChefHat className="w-6 h-6" />
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 text-left px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Restaurant Terminal</span>
                  <span className={`w-2 h-2 rounded-full ${
                    storeStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                    storeStatus === 'busy' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                </div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                  {authenticatedVendor.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Live Order Counter Pills */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'pending'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-rose-200" />
              <span>New Requests</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                pendingOrders.length > 0 ? 'bg-white text-rose-600' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preparing')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'preparing'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-200" />
              <span>Cooking ({preparingOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ready'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-blue-200" />
              <span>Rider Pickup ({readyOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Done ({completedOrders.length})</span>
            </button>
          </div>

          {/* Right: Sound, Auto-Accept & Store Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playNewOrderSound();
              }}
              className={`p-2.5 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Order Audio Chime Enabled' : 'Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Auto Accept Switch */}
            <button
              onClick={() => setAutoAccept(!autoAccept)}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                autoAccept
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Automatically accept all incoming orders immediately"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Accept {autoAccept ? 'ON' : 'OFF'}</span>
            </button>

            {/* Store Status Toggle */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
              <button
                onClick={() => setStoreStatus('online')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'online' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStoreStatus('busy')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'busy' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Busy
              </button>
              <button
                onClick={() => setStoreStatus('offline')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'offline' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pause
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={logoutUser}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              title="Logout Partner"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </header>

      {/* 
        ========================================================================
        2. SECONDARY CONTROLS & METRICS STRIP
        ========================================================================
      */}
      <div className="bg-white border-b border-slate-200/90 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Mobile Tab Pills */}
          <div className="flex lg:hidden w-full overflow-x-auto gap-2 pb-1 text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'pending' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              New ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'preparing' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Cooking ({preparingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'ready' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Pickup ({readyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Delivered ({completedOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({vendorOrders.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Customer, or Food Item..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Today's Restaurant Sales Badge */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4 text-xs font-medium">
            <div className="text-slate-500">
              Completed Today: <span className="text-slate-900 font-bold">{completedOrders.length} orders</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 font-bold flex items-center space-x-1.5 shadow-2xs">
              <span>Today's Food Sales:</span>
              <span className="font-mono text-emerald-700 text-sm font-black">৳{todayEarnings}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        3. MAIN ORDER CARDS CONTAINER
        ========================================================================
      */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* High Priority Banner for Incoming Orders */}
        {pendingOrders.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-rose-950">
                  🔔 {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''} Requiring Instant Acceptance!
                </h2>
                <p className="text-xs text-rose-700">
                  Accept with cooking time to send confirmation to customer screen.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className="w-full md:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>View & Accept Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayedOrders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Orders in this Section</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'All incoming orders have been accepted! Keep this tab open; new customer orders will ring here in real time.'
                : 'There are no active orders matching this filter right now.'}
            </p>
          </div>
        )}

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isPreparing = order.status === 'vendor_accepted' || order.status === 'food_preparing';
            const isReady = order.status === 'ready_for_pickup';
            const isPickedUp = order.status === 'food_picked_up' || order.status === 'rider_on_way_to_customer';
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';

            const assignedRider = riders.find((r) => r.id === order.rider_id);
            const selectedPrepMinutes = prepTimeSelection[order.id] || order.vendor_prep_minutes || 15;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-3xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md bg-white ${
                  isPending
                    ? 'border-rose-400 ring-2 ring-rose-500/20 shadow-rose-100'
                    : isPreparing
                    ? 'border-amber-300 shadow-amber-50'
                    : isReady
                    ? 'border-blue-300 shadow-blue-50'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Order ID + Status Pill + Print Button */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-rose-600 uppercase">
                          {order.order_code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customer_name}</span>
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Print Ticket Button */}
                      <button
                        onClick={() => setPrintModalOrder(order)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Print Kitchen Docket / Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPending ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        isPreparing ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isReady ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        isPickedUp ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        isDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {isPending ? 'New Request' :
                         order.status === 'vendor_accepted' ? 'Waiting Customer' :
                         order.status === 'food_preparing' ? 'Cooking' :
                         isReady ? 'Ready for Rider' :
                         isPickedUp ? 'Rider on the way' :
                         isDelivered ? 'Delivered' : 'Cancelled'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Phone & Delivery Address */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-bold">{order.customer_phone}</span>
                      </span>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Call
                      </a>
                    </div>
                    <div className="flex items-start space-x-1.5 text-[11px] text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  </div>

                  {/* Item List (With Kitchen Prep Checklist) */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Kitchen Items ({order.items?.reduce((s, i) => s + i.quantity, 0) || 0})</span>
                      {order.status === 'food_preparing' && <span className="text-[10px] text-amber-700 font-bold">Tap item to check off</span>}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {order.items?.map((item, idx) => {
                        const isChecked = checkedItems[order.id]?.[idx] || false;
                        return (
                          <div
                            key={idx}
                            onClick={() => order.status === 'food_preparing' && toggleItemCheck(order.id, idx)}
                            className={`flex items-start justify-between p-2 rounded-xl text-xs transition ${
                              order.status === 'food_preparing' ? 'cursor-pointer hover:bg-slate-100' : ''
                            } ${isChecked ? 'bg-emerald-50 border border-emerald-200 text-slate-500' : 'bg-slate-50 border border-slate-200'}`}
                          >
                            <div className="flex items-start space-x-2">
                              {order.status === 'food_preparing' && (
                                <button className="mt-0.5 text-slate-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                              )}
                              <div>
                                <div className={`font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  <span className="text-rose-600 font-mono mr-1.5">{item.quantity}x</span>
                                  {item.item_name}
                                </div>
                                {item.selected_variations && item.selected_variations.length > 0 && (
                                  <div className="text-[11px] font-semibold text-orange-700 bg-orange-50 rounded-md px-1.5 py-0.5 mt-0.5 border border-orange-100">
                                    {item.selected_variations.join(' • ')}
                                  </div>
                                )}
                                {item.special_instructions && (
                                  <div className="text-[11px] italic text-slate-500 mt-0.5">
                                    Note: "{item.special_instructions}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-700">
                              ৳{item.subtotal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment & Amount Summary */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Method</span>
                      <span className="font-bold text-slate-800 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Cash on Delivery (COD)</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Food Bill</span>
                      <span className="text-base font-black text-rose-600 font-mono">
                        ৳{order.food_total}
                      </span>
                    </div>
                  </div>

                  {/* Rider Info if assigned */}
                  {assignedRider && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-bold flex items-center space-x-1">
                          <Bike className="w-3.5 h-3.5 text-pink-600" />
                          <span>Rider: {assignedRider.name}</span>
                        </span>
                        <a
                          href={`tel:${assignedRider.phone}`}
                          className="text-[11px] font-bold text-pink-600 hover:underline"
                        >
                          📞 {assignedRider.phone}
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Status: {order.status === 'ready_for_pickup' ? '🛵 Rider on way to kitchen' : '⚡ En route to customer'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 
                  ==============================================================
                  ACTION BUTTONS ACCORDING TO STAGE
                  ==============================================================
                */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  
                  {/* CASE 1: INCOMING ORDER (ACCEPT / REJECT) */}
                  {isPending && (
                    <div className="space-y-2">
                      {/* Prep Time Selector */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px] font-bold">Prep Time:</span>
                        <div className="flex items-center space-x-1">
                          {[10, 15, 20, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setPrepTimeSelection(prev => ({ ...prev, [order.id]: mins }))}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                                selectedPrepMinutes === mins
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRejectModalOrder(order)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => vendorAcceptOrderWithPrepTime(order.id, selectedPrepMinutes)}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/30 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Accept ({selectedPrepMinutes}m)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE 1.5: WAITING FOR CUSTOMER CONFIRMATION */}
                  {order.status === 'vendor_accepted' && !order.customer_confirmed_prep && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-center space-y-1 animate-pulse">
                      <p className="text-xs font-bold text-amber-800 flex items-center justify-center space-x-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Waiting for customer confirmation</span>
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Proposed {order.vendor_prep_minutes || 15} mins cooking time sent to customer's screen.
                      </p>
                    </div>
                  )}

                  {/* CASE 2: PREPARING IN KITCHEN (MARK READY) */}
                  {order.status === 'food_preparing' && (
                    <div className="space-y-2">
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center justify-between text-xs text-amber-800 font-bold">
                        <span className="flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          <span>Customer Approved! Cooking</span>
                        </span>
                        <span>{order.vendor_prep_minutes || 15}m prep</span>
                      </div>

                      <button
                        onClick={() => vendorMarkFoodReady(order.id)}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-md shadow-rose-600/30 cursor-pointer"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Food Ready & Search Zone Rider</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 3: READY FOR PICKUP (HANDOVER TO RIDER) */}
                  {isReady && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleConfirmHandover(order.id)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-md shadow-blue-600/30 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Handover Food to Rider</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 4: PICKED UP (IN TRANSIT) */}
                  {isPickedUp && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-2.5 text-center text-xs text-indigo-700 font-bold flex items-center justify-center space-x-1.5">
                      <Bike className="w-4 h-4 text-indigo-600 animate-bounce" />
                      <span>Rider is delivering to customer</span>
                    </div>
                  )}

                  {/* CASE 5: DELIVERED */}
                  {isDelivered && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-center text-xs text-emerald-800 font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Order Delivered Successfully (COD Settled)</span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </main>

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

    </div>
  );
};
