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
    logoutUser
  } = useDelivery();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Store Selection
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    currentVendor ? currentVendor.id : (vendors[0]?.id || '')
  );

  // Tab Filter
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('pending');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [storeStatus, setStoreStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  // Modal States
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Out of key ingredients');
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);
  const [prepTimeSelection, setPrepTimeSelection] = useState<Record<string, number>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});

  // Audio Ref tracking previous pending count
  const prevPendingCountRef = useRef<number>(0);

  // Active Vendor object
  const activeVendor = vendors.find((v) => v.id === selectedVendorId) || currentVendor || vendors[0];

  // Keep global current vendor in sync if switched
  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendorId(vendor.id);
    setCurrentVendor(vendor);
    setIsStoreDropdownOpen(false);
  };

  // Filter orders strictly for this restaurant
  const vendorOrders = orders.filter((o) => o.vendor_id === activeVendor?.id);

  const pendingOrders = vendorOrders.filter((o) => o.status === 'pending');
  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyOrders = vendorOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'picked_up');
  const completedOrders = vendorOrders.filter((o) => o.status === 'delivered');

  // Sound Synthesizer via Web Audio API (Zero external assets, guaranteed to work)
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual-tone restaurant chime (880Hz -> 1320Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Play chime on incoming orders
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
        updateOrderStatus(o.id, 'food_preparing');
      });
    }
  }, [autoAccept, pendingOrders]);

  // Order Acceptance Handlers
  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'food_preparing');
  };

  const handleMarkFoodReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready_for_pickup');
  };

  const handleConfirmHandover = (orderId: string) => {
    updateOrderStatus(orderId, 'picked_up');
  };

  const handleConfirmReject = () => {
    if (!rejectModalOrder) return;
    updateOrderStatus(rejectModalOrder.id, 'cancelled');
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
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      o.items.some((it) => it.menu_item.name.toLowerCase().includes(q))
    );
  };

  const displayedOrders = getFilteredOrders();

  // Total earnings today for this restaurant
  const todayEarnings = completedOrders.reduce((sum, o) => sum + o.food_subtotal, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 
        ========================================================================
        1. RESTAURANT ORDERS HEADER BAR
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand + Store Selector */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-900/30">
              <ChefHat className="w-6 h-6" />
            </div>

            <div className="relative">
              <button
                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 text-left px-3.5 py-1.5 rounded-xl border border-slate-700/80 transition"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Restaurant Terminal</span>
                    <span className={`w-2 h-2 rounded-full ${
                      storeStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                      storeStatus === 'busy' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                  </div>
                  <h1 className="text-sm sm:text-base font-black text-white truncate max-w-[180px] sm:max-w-xs">
                    {activeVendor?.name || 'Select Restaurant'}
                  </h1>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Store Switcher Dropdown */}
              {isStoreDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase">
                    Select Your Restaurant Branch
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {vendors.map((v) => {
                      const vPending = orders.filter(o => o.vendor_id === v.id && o.status === 'pending').length;
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVendor(v)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                            v.id === activeVendor?.id
                              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                              : 'text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-white truncate">{v.name}</p>
                            <p className="text-[10px] text-slate-400">{v.cuisine} • {v.phone}</p>
                          </div>
                          {vPending > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shrink-0 animate-bounce">
                              {vPending} new
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Live Order Counter Pills */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'pending'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-rose-300" />
              <span>New Requests</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                pendingOrders.length > 0 ? 'bg-white text-rose-600' : 'bg-slate-800 text-slate-300'
              }`}>
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preparing')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'preparing'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Cooking ({preparingOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ready'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-blue-300" />
              <span>Rider Pickup ({readyOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
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
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800/50 text-slate-500 border-slate-800'
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
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Automatically accept all incoming orders immediately"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Accept {autoAccept ? 'ON' : 'OFF'}</span>
            </button>

            {/* Store Status Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setStoreStatus('online')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'online' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStoreStatus('busy')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'busy' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Busy
              </button>
              <button
                onClick={() => setStoreStatus('offline')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  storeStatus === 'offline' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pause
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 
        ========================================================================
        2. SECONDARY CONTROLS & METRICS STRIP
        ========================================================================
      */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Mobile Tab Pills */}
          <div className="flex lg:hidden w-full overflow-x-auto gap-2 pb-1 text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'pending' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              New ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'preparing' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Cooking ({preparingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'ready' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Pickup ({readyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Delivered ({completedOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${
                activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              All ({vendorOrders.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Customer, or Food Item..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Today's Restaurant Sales Badge */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4 text-xs font-medium">
            <div className="text-slate-400">
              Completed Today: <span className="text-white font-bold">{completedOrders.length} orders</span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-emerald-300 font-bold flex items-center space-x-1.5">
              <span>Today's Food Sales:</span>
              <span className="font-mono text-white text-sm">৳{todayEarnings}</span>
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
          <div className="bg-rose-950/70 border-2 border-rose-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  🔔 {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''} Requiring Instant Acceptance!
                </h2>
                <p className="text-xs text-rose-300">
                  Accept now to assign nearest delivery rider and start kitchen preparation.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className="w-full md:w-auto px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>View & Accept Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayedOrders.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Orders in this Section</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
            const isPickedUp = order.status === 'picked_up';
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';

            const assignedRider = riders.find((r) => r.id === order.rider_id);
            const selectedPrepMinutes = prepTimeSelection[order.id] || 15;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-3xl p-5 border transition-all duration-200 shadow-xl ${
                  isPending
                    ? 'bg-slate-900 border-rose-500/80 shadow-rose-950/30 ring-2 ring-rose-500/20'
                    : isPreparing
                    ? 'bg-slate-900 border-amber-500/60 shadow-amber-950/20'
                    : isReady
                    ? 'bg-slate-900 border-blue-500/60 shadow-blue-950/20'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                {/* Header: Order ID + Status Pill + Print Button */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-rose-400 uppercase">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customer_name}</span>
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Print Ticket Button */}
                      <button
                        onClick={() => setPrintModalOrder(order)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Print Kitchen Docket / Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPending ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        isPreparing ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        isReady ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        isPickedUp ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        isDelivered ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {isPending ? 'New Request' :
                         isPreparing ? 'Cooking' :
                         isReady ? 'Ready for Rider' :
                         isPickedUp ? 'Rider on the way' :
                         isDelivered ? 'Delivered' : 'Cancelled'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Phone & Delivery Address */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{order.customer_phone}</span>
                      </span>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-[11px] font-bold text-rose-400 hover:underline"
                      >
                        Call
                      </a>
                    </div>
                    <div className="flex items-start space-x-1.5 text-[11px] text-slate-400 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  </div>

                  {/* Item List (With Kitchen Prep Checklist) */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Kitchen Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                      {isPreparing && <span className="text-[10px] text-amber-400">Tap item to check off</span>}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => {
                        const isChecked = checkedItems[order.id]?.[idx] || false;
                        return (
                          <div
                            key={idx}
                            onClick={() => isPreparing && toggleItemCheck(order.id, idx)}
                            className={`flex items-start justify-between p-2 rounded-xl text-xs transition ${
                              isPreparing ? 'cursor-pointer hover:bg-slate-800/80' : ''
                            } ${isChecked ? 'bg-emerald-950/30 border border-emerald-800/40 text-slate-400' : 'bg-slate-950/50 border border-slate-800/50'}`}
                          >
                            <div className="flex items-start space-x-2">
                              {isPreparing && (
                                <button className="mt-0.5 text-slate-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                              )}
                              <div>
                                <div className={`font-bold ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                                  <span className="text-rose-400 font-mono mr-1.5">{item.quantity}x</span>
                                  {item.menu_item.name}
                                </div>
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <p className="text-[10px] text-slate-400">
                                    Add-ons: {item.selectedAddons.map(a => a.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-300">
                              ৳{item.itemTotal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment & Amount Summary */}
                  <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Method</span>
                      <span className="font-bold text-white flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Cash on Delivery (COD)</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Food Bill</span>
                      <span className="text-base font-black text-rose-400 font-mono">
                        ৳{order.food_subtotal}
                      </span>
                    </div>
                  </div>

                  {/* Rider Info if assigned */}
                  {assignedRider && (
                    <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold flex items-center space-x-1">
                          <Bike className="w-3.5 h-3.5 text-blue-400" />
                          <span>Rider: {assignedRider.name}</span>
                        </span>
                        <a
                          href={`tel:${assignedRider.phone}`}
                          className="text-[11px] font-bold text-blue-400 hover:underline"
                        >
                          📞 {assignedRider.phone}
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-400">
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
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  
                  {/* CASE 1: INCOMING ORDER (ACCEPT / REJECT) */}
                  {isPending && (
                    <div className="space-y-2">
                      {/* Prep Time Selector */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Prep Time:</span>
                        <div className="flex items-center space-x-1">
                          {[10, 15, 20, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setPrepTimeSelection(prev => ({ ...prev, [order.id]: mins }))}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                                selectedPrepMinutes === mins
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
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
                          className="py-2.5 px-3 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-700"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => vendorAcceptOrderWithPrepTime(order.id, selectedPrepMinutes)}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1 shadow-lg shadow-emerald-950/40 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Accept ({selectedPrepMinutes}m)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE 1.5: WAITING FOR CUSTOMER CONFIRMATION */}
                  {order.status === 'vendor_accepted' && !order.customer_confirmed_prep && (
                    <div className="bg-amber-950/40 border border-amber-500/60 p-3 rounded-2xl text-center space-y-1 animate-pulse">
                      <p className="text-xs font-bold text-amber-300 flex items-center justify-center space-x-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for customer confirmation</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Proposed {order.vendor_prep_minutes || 15} mins cooking time sent to customer's screen.
                      </p>
                    </div>
                  )}

                  {/* CASE 2: PREPARING IN KITCHEN (MARK READY) */}
                  {order.status === 'food_preparing' && (
                    <div className="space-y-2">
                      <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded-xl flex items-center justify-between text-xs text-amber-300 font-bold">
                        <span className="flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>Customer Approved! Cooking in Kitchen</span>
                        </span>
                        <span>{order.vendor_prep_minutes || 15}m prep</span>
                      </div>

                      <button
                        onClick={() => vendorMarkFoodReady(order.id)}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/50 cursor-pointer"
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
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/50 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Handover Food to Rider</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 4: PICKED UP (IN TRANSIT) */}
                  {isPickedUp && (
                    <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-2.5 text-center text-xs text-indigo-300 font-bold flex items-center justify-center space-x-1.5">
                      <Bike className="w-4 h-4 animate-bounce" />
                      <span>Rider is delivering to customer</span>
                    </div>
                  )}

                  {/* CASE 5: COMPLETED / DELIVERED */}
                  {isDelivered && (
                    <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-2.5 text-center text-xs text-emerald-300 font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Delivered Successfully</span>
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
        MODAL 1: REJECT ORDER MODAL
        ========================================================================
      */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Decline Order #{rejectModalOrder.id}</h3>
              </div>
              <button
                onClick={() => setRejectModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 font-medium">Please specify reason for declining:</p>
              
              <div className="space-y-2">
                {[
                  'Out of key ingredients',
                  'Kitchen overloaded / Too many orders',
                  'Item temporarily sold out',
                  'Closing store early'
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      rejectReason === reason
                        ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span className="font-bold">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-500"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: PRINT KITCHEN DOCKET / THERMAL RECEIPT
        ========================================================================
      */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
              <div>
                <h2 className="text-base font-black uppercase tracking-widest">{activeVendor?.name}</h2>
                <p className="text-[10px] text-slate-500">KITCHEN DISPATCH TICKET</p>
              </div>
              <button
                onClick={() => setPrintModalOrder(null)}
                className="text-slate-400 hover:text-slate-800 font-sans"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between font-bold">
                <span>ORDER: {printModalOrder.id}</span>
                <span>{new Date(printModalOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>Customer: <span className="font-bold">{printModalOrder.customer_name}</span></div>
              <div>Phone: <span className="font-bold">{printModalOrder.customer_phone}</span></div>
              <div className="text-[11px] text-slate-600">Address: {printModalOrder.delivery_address}</div>
            </div>

            {/* Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 text-xs">
              <div className="flex justify-between font-bold text-slate-500 text-[10px]">
                <span>QTY / ITEM</span>
                <span>PRICE</span>
              </div>
              {printModalOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.quantity}x {it.menu_item.name}</span>
                  <span className="font-bold">৳{it.itemTotal}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL (COD):</span>
                <span>৳{printModalOrder.total}</span>
              </div>
              <p className="text-[10px] text-slate-500 text-center pt-2">
                Thank you for ordering with FoodVibe!
              </p>
            </div>

            <div className="pt-2 flex space-x-2 font-sans">
              <button
                onClick={() => setPrintModalOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
