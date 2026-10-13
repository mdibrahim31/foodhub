import React, { useState, useMemo } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { Order, OrderStatus, Vendor, Rider } from '../../types/database';
import { 
  Users, 
  Store, 
  Bike, 
  ClipboardList, 
  Search, 
  Pause, 
  Play, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  Banknote, 
  ShieldAlert, 
  Filter, 
  LogOut, 
  Lock, 
  KeyRound, 
  AlertCircle,
  Eye,
  RefreshCw,
  Star,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export const SubAdminPortal: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    vendors,
    toggleVendorPause,
    menuItems,
    toggleMenuItemAvailability,
    riders,
    toggleRiderPause,
    reviews,
    settings,
    zones
  } = useDelivery();

  // Sub-Admin PIN/Password Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('foodiplace_subadmin_auth') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Operational Tabs: 'overview' | 'orders' | 'vendors' | 'riders' | 'reviews'
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'vendors' | 'riders' | 'reviews'>('overview');

  // Search & Filter States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorZoneFilter, setVendorZoneFilter] = useState('all');
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [riderStatusFilter, setRiderStatusFilter] = useState<'all' | 'online' | 'offline' | 'paused'>('all');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default subadmin access PIN: '123456' or 'subadmin'
    if (pinInput === '123456' || pinInput.toLowerCase() === 'subadmin' || pinInput === 'admin') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('foodiplace_subadmin_auth', 'true');
      }
      setAuthError('');
    } else {
      setAuthError('ভুল পিন/পাসওয়ার্ড। ডিফল্ট পিন: 123456');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foodiplace_subadmin_auth');
    }
  };

  // Helper Functions
  const getVendorName = (ord: Order) => {
    return ord.vendor?.name || vendors.find(v => v.id === ord.vendor_id)?.name || 'Restaurant';
  };

  const getOrderTotal = (ord: Order) => {
    return ord.total_cash_payable || ((ord.food_total || 0) + (ord.delivery_fee || 0));
  };

  // Metrics Calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'food_preparing').length;
    const onWayOrders = orders.filter(o => o.status === 'rider_assigned' || o.status === 'rider_arrived_at_vendor' || o.status === 'food_picked_up' || o.status === 'rider_on_way_to_customer').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    const totalRevenueToday = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + getOrderTotal(o), 0);

    const onlineRiders = riders.filter(r => r.is_online && !r.is_paused).length;
    const pausedRiders = riders.filter(r => r.is_paused).length;
    const activeVendors = vendors.filter(v => !v.is_paused).length;
    const pausedVendors = vendors.filter(v => v.is_paused).length;

    const totalCashInRiderHands = riders.reduce((sum, r) => sum + (r.cash_in_hand || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      onWayOrders,
      deliveredOrders,
      totalRevenueToday,
      onlineRiders,
      pausedRiders,
      activeVendors,
      pausedVendors,
      totalCashInRiderHands
    };
  }, [orders, riders, vendors]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = orderSearchQuery.toLowerCase().trim();
      const vName = getVendorName(order);
      const matchesSearch = !q || 
        order.order_code?.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_phone?.includes(q) ||
        vName.toLowerCase().includes(q);

      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter, vendors]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const q = vendorSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        vendor.name.toLowerCase().includes(q) ||
        vendor.phone.includes(q) ||
        vendor.cuisine.toLowerCase().includes(q);

      const matchesZone = vendorZoneFilter === 'all' || 
        (vendor.zone && vendor.zone.toLowerCase() === vendorZoneFilter.toLowerCase());

      return matchesSearch && matchesZone;
    });
  }, [vendors, vendorSearchQuery, vendorZoneFilter]);

  // Filtered Riders
  const filteredRiders = useMemo(() => {
    return riders.filter(rider => {
      const q = riderSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        rider.name?.toLowerCase().includes(q) ||
        rider.phone?.includes(q) ||
        rider.id?.toLowerCase().includes(q);

      if (riderStatusFilter === 'online') return matchesSearch && rider.is_online && !rider.is_paused;
      if (riderStatusFilter === 'offline') return matchesSearch && !rider.is_online && !rider.is_paused;
      if (riderStatusFilter === 'paused') return matchesSearch && rider.is_paused;

      return matchesSearch;
    });
  }, [riders, riderSearchQuery, riderStatusFilter]);

  // If Not Authenticated, show modern Sub-Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">foodiplace Sub-Admin</h1>
            <p className="text-xs text-slate-400">
              Operations & Dispatch Management Console<br/>
              (অপারেশনস ও লাইভ অর্ডার কন্ট্রোল প্যানেল)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Access PIN / Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 6-digit PIN (default: 123456)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs text-rose-400 font-bold flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Enter Sub-Admin Portal
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Role: Operations Sub-Admin</span>
            <a href="./admin.html" className="text-indigo-400 hover:underline flex items-center gap-1">
              Super Admin Console <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-tight">foodiplace</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Sub-Admin Operations
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Daily Orders, Rider Fleet & Restaurant Dispatch Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href="./index.html"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              <span>Customer App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none border-t border-slate-800/80">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp, badge: null },
            { id: 'orders', label: 'Live Orders', icon: ClipboardList, badge: stats.pendingOrders + stats.preparingOrders },
            { id: 'vendors', label: 'Vendors', icon: Store, badge: stats.pausedVendors > 0 ? `${stats.pausedVendors} paused` : null },
            { id: 'riders', label: 'Riders Fleet', icon: Bike, badge: `${stats.onlineRiders} online` },
            { id: 'reviews', label: 'Reviews', icon: Star, badge: reviews.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold whitespace-nowrap flex items-center space-x-2 border-b-2 transition cursor-pointer ${
                  isActive 
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/50' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* ================================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Total Orders</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">{stats.totalOrders}</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Live</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending / Cooking</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-600">{stats.pendingOrders + stats.preparingOrders}</span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">In Kitchen</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Riders</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-600">{stats.onlineRiders}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Ready</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rider COD Balance</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-indigo-600">{settings.currency_symbol}{stats.totalCashInRiderHands}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Cash</span>
                </div>
              </div>
            </div>

            {/* Quick Action Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Orders Feed */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Recent Active Orders</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    View All ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {orders.slice(0, 5).map(ord => (
                    <div 
                      key={ord.id} 
                      onClick={() => setSelectedOrderForModal(ord)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-slate-900">#{ord.order_code}</span>
                          <span className="text-[11px] text-slate-600 font-bold">{getVendorName(ord)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {ord.customer_name} • {ord.customer_phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-indigo-600">{settings.currency_symbol}{getOrderTotal(ord)}</span>
                        <div className="mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            ord.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            ord.status === 'food_preparing' ? 'bg-blue-100 text-blue-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No orders placed yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Operations Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Store className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">System Operations Status</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Systems Online
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Total Registered Vendors:</span>
                    <span className="font-black text-slate-900">{vendors.length} ({stats.activeVendors} Active, {stats.pausedVendors} Paused)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Delivery Fleet (Riders):</span>
                    <span className="font-black text-slate-900">{riders.length} ({stats.onlineRiders} On Duty)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Configured Delivery Zones:</span>
                    <span className="font-black text-slate-900">{zones.length} Zones</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">Sub-Admin Permissions:</span>
                    <span className="font-bold text-indigo-600">Orders, Riders & Vendors Operations</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                  💡 <strong>Sub-Admin Note:</strong> আপনি লাইভ অর্ডার ট্র্যাকিং, রাইডার ও ভেন্ডর পজ/রিজিউম এবং ক্যাশ অন ডেলিভারি মনিটর করতে পারেন। সিস্টেমের গ্লোবাল রেট ও ডাটাবেস সেটিংস পরিবর্তন শুধুমাত্র সুপার এডমিন প্যানেল থেকে সম্ভব।
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. ORDERS MANAGEMENT TAB */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Live Orders Terminal</h2>
                <p className="text-xs text-slate-500">Monitor live orders, assign status, and handle dispatch</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search order #, customer, phone..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="pending">Pending</option>
                  <option value="food_preparing">Preparing</option>
                  <option value="ready_for_pickup">Ready For Pickup</option>
                  <option value="rider_assigned">Rider Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="py-3 px-3">Order Code</th>
                    <th className="py-3 px-3">Vendor</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{order.order_code}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {getVendorName(order)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customer_phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3 px-3 font-black text-indigo-600">
                        {settings.currency_symbol}{getOrderTotal(order)}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase cursor-pointer border ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'food_preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="food_preparing">Food Preparing</option>
                          <option value="ready_for_pickup">Ready For Pickup</option>
                          <option value="rider_assigned">Rider Assigned</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrderForModal(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No orders match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. VENDORS MANAGEMENT TAB */}
        {/* ================================================================= */}
        {activeTab === 'vendors' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Vendors & Restaurants Operations</h2>
                <p className="text-xs text-slate-500">Monitor active kitchens, pause overloaded vendors, review contacts</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    placeholder="Search restaurant..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-48 sm:w-60"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map(vendor => (
                <div 
                  key={vendor.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    vendor.is_paused 
                      ? 'bg-rose-50/40 border-rose-200' 
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img 
                          src={vendor.logo_url || vendor.cover_image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150'} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{vendor.name}</h4>
                        <p className="text-xs text-slate-500">{vendor.cuisine} • {vendor.zone || 'No Zone'}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      vendor.is_paused ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {vendor.is_paused ? 'Paused' : 'Active'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{vendor.phone}</span>
                    </div>

                    <button
                      onClick={() => toggleVendorPause(vendor.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        vendor.is_paused 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {vendor.is_paused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3" />}
                      <span>{vendor.is_paused ? 'Resume Store' : 'Pause Store'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. RIDERS FLEET TAB */}
        {/* ================================================================= */}
        {activeTab === 'riders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Delivery Fleet & Riders Operations</h2>
                <p className="text-xs text-slate-500">Monitor active riders on duty, pause riders, verify cash collected</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={riderStatusFilter}
                  onChange={(e) => setRiderStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All Riders ({riders.length})</option>
                  <option value="online">Online on Road</option>
                  <option value="offline">Offline</option>
                  <option value="paused">Paused Riders</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRiders.map(rider => (
                <div 
                  key={rider.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rider.is_paused 
                      ? 'bg-rose-50/40 border-rose-200' 
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img 
                          src={rider.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{rider.name || 'Rider'}</h4>
                        <p className="text-xs text-slate-500">{rider.zone || 'Zone Not Set'} • {rider.vehicle_type || 'Bike'}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      rider.is_paused ? 'bg-rose-100 text-rose-700' :
                      rider.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rider.is_paused ? 'Paused' : rider.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Cash In Hand</span>
                      <span className="font-black text-indigo-600 text-sm">{settings.currency_symbol}{rider.cash_in_hand || 0}</span>
                    </div>

                    <button
                      onClick={() => toggleRiderPause(rider.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        rider.is_paused 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {rider.is_paused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3" />}
                      <span>{rider.is_paused ? 'Resume Rider' : 'Pause Rider'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. REVIEWS & CUSTOMER FEEDBACK TAB */}
        {/* ================================================================= */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Customer Ratings & Reviews Moderation</h2>
              <p className="text-xs text-slate-500">Read and monitor feedback from customers regarding food and delivery quality</p>
            </div>

            <div className="space-y-3">
              {reviews.map((rev, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs text-slate-900">{rev.customer_name || 'Customer'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-bold">Order #{rev.order_code}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.rating} / 5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>
                  <div className="text-[10px] text-slate-400">
                    {new Date(rev.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No customer reviews submitted yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrderForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedOrderForModal(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Order #{selectedOrderForModal.order_code}</h3>
                <p className="text-xs text-slate-500">{new Date(selectedOrderForModal.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Customer Details</span>
                <p className="font-extrabold text-slate-900">{selectedOrderForModal.customer_name}</p>
                <p className="text-slate-600">{selectedOrderForModal.customer_phone}</p>
                <p className="text-slate-600">{selectedOrderForModal.delivery_address}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Vendor & Restaurant</span>
                <p className="font-extrabold text-slate-900">{getVendorName(selectedOrderForModal)}</p>
              </div>

              <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Items Summary</span>
                {selectedOrderForModal.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{it.quantity}x {it.item_name}</span>
                    <span className="font-mono font-bold">{settings.currency_symbol}{it.subtotal}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-slate-900">
                  <span>Total Amount (COD)</span>
                  <span className="text-indigo-600">{settings.currency_symbol}{getOrderTotal(selectedOrderForModal)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
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
