import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
import { InteractiveMap } from '../common/InteractiveMap';
import { calculateDistanceKm, calculateDeliveryFee } from '../../utils/geo';
import { Vendor, MenuItem, Order } from '../../types/database';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Clock, 
  Star, 
  Plus, 
  Minus, 
  ArrowRight, 
  ChevronRight, 
  Banknote, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { 
    vendors, 
    menuItems, 
    selectedAddress, 
    settings, 
    cart, 
    cartVendor, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    placeOrder,
    orders,
    riders
  } = useDelivery();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedVendorForMenu, setSelectedVendorForMenu] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<'restaurants' | 'orders'>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderInstructions, setOrderInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccessNotice, setOrderSuccessNotice] = useState<Order | null>(null);

  // Customer's current coordinates
  const customerLat = selectedAddress?.latitude || 23.7915;
  const customerLng = selectedAddress?.longitude || 90.4072;

  // Filter vendors
  const cuisines = ['All', 'Biryani', 'Burgers', 'Fast Food', 'Wings'];
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || v.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
    return matchesSearch && matchesCuisine;
  });

  // Calculate cart totals
  const foodTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartDistanceKm = cartVendor 
    ? calculateDistanceKm(cartVendor.latitude, cartVendor.longitude, customerLat, customerLng)
    : 0;
  const deliveryFee = cartVendor
    ? calculateDeliveryFee(cartDistanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge)
    : 0;
  const totalCashPayable = foodTotal + deliveryFee;

  const handleCheckout = async () => {
    if (!selectedAddress) {
      setIsAddressModalOpen(true);
      return;
    }
    setIsPlacingOrder(true);
    try {
      const placed = await placeOrder(orderInstructions);
      if (placed) {
        setOrderSuccessNotice(placed);
        setIsCartOpen(false);
        setActiveTab('orders');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Customer Sub-Header: Delivery Address Picker */}
      <div className="bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Delivering to</span>
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                  {selectedAddress?.label || 'Select Location'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-md">
                {selectedAddress ? selectedAddress.address_line : 'No delivery address selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Change / Pin Map</span>
            </button>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'restaurants' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Restaurants
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'orders' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Live Orders</span>
                {orders.length > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {orders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'restaurants' ? (
          <div className="space-y-6">
            {/* Cash on Delivery Educational Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm md:text-base">
                    Pure Cash On Delivery System
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Rider purchases food with cash at restaurant and collects <strong className="text-gray-900">Food Bill + Delivery Fee</strong> from you in cash at your doorstep!
                  </p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-amber-200 text-xs text-amber-900 font-mono">
                Formula: {settings.currency_symbol}{settings.base_delivery_charge} base + {settings.currency_symbol}{settings.per_km_delivery_charge} &times; distance (km)
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-xs"
                />
              </div>

              {/* Cuisine chips */}
              <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
                {cuisines.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCuisine(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCuisine === c
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => {
                const distanceKm = calculateDistanceKm(
                  vendor.latitude,
                  vendor.longitude,
                  customerLat,
                  customerLng
                );
                const fee = calculateDeliveryFee(
                  distanceKm,
                  settings.base_delivery_charge,
                  settings.per_km_delivery_charge
                );
                const vendorMenuItems = menuItems.filter((m) => m.vendor_id === vendor.id);

                return (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Cover image & badges */}
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      <img
                        src={vendor.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-gray-900 flex items-center space-x-1 shadow-xs">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{vendor.rating}</span>
                      </div>

                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{vendor.estimated_prep_time_minutes + Math.ceil(distanceKm * 4)} mins</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="text-xs font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                          {vendor.cuisine}
                        </span>
                        <span className="text-xs font-bold bg-amber-500 text-gray-950 px-2 py-0.5 rounded">
                          Cash on Delivery
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{vendor.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{vendor.address}</p>

                        {/* Distance & Delivery Fee Highlight */}
                        <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 text-gray-700">
                            <Truck className="w-4 h-4 text-rose-500" />
                            <span className="font-semibold">{distanceKm} km away</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 text-[10px]">Delivery Fee: </span>
                            <span className="font-extrabold text-gray-900 text-xs">
                              {settings.currency_symbol}{fee}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">
                          {vendorMenuItems.length} Items Available
                        </span>
                        <button
                          onClick={() => setSelectedVendorForMenu(vendor)}
                          className="inline-flex items-center space-x-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                          <span>View Menu</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Live Orders Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Live COD Orders</h2>
                <p className="text-xs text-gray-500">Track orders from restaurant preparation to rider doorstep handover</p>
              </div>
              <button
                onClick={() => setActiveTab('restaurants')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
              >
                Browse More Food
              </button>
            </div>

            {orderSuccessNotice && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Order #{orderSuccessNotice.order_code} Placed Successfully!</p>
                    <p className="text-emerald-700">
                      Total Cash Payable: {settings.currency_symbol}{orderSuccessNotice.total_cash_payable} upon delivery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderSuccessNotice(null)}
                  className="text-emerald-800 font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-base">No active orders right now</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Pick your favorite items from our registered restaurants and enjoy authentic Cash On Delivery!
                </p>
                <button
                  onClick={() => setActiveTab('restaurants')}
                  className="mt-4 px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700"
                >
                  Order Food Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => {
                  const assignedRider = riders.find((r) => r.id === ord.rider_id);
                  const vendor = vendors.find((v) => v.id === ord.vendor_id);

                  // Map markers for live tracking
                  const markers = [];
                  if (vendor) {
                    markers.push({
                      id: `v-${vendor.id}`,
                      latitude: vendor.latitude,
                      longitude: vendor.longitude,
                      title: `Restaurant: ${vendor.name}`,
                      subtitle: vendor.address,
                      type: 'vendor' as const,
                    });
                  }
                  markers.push({
                    id: `c-${ord.id}`,
                    latitude: ord.delivery_latitude,
                    longitude: ord.delivery_longitude,
                    title: `Delivery Destination: ${ord.customer_name}`,
                    subtitle: ord.delivery_address,
                    type: 'customer' as const,
                  });
                  if (assignedRider && assignedRider.is_online) {
                    markers.push({
                      id: `r-${assignedRider.id}`,
                      latitude: assignedRider.current_latitude,
                      longitude: assignedRider.current_longitude,
                      title: `Rider: ${assignedRider.name} (Live 5s GPS)`,
                      subtitle: `Phone: ${assignedRider.phone}`,
                      type: 'rider' as const,
                    });
                  }

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
                    >
                      {/* Order Header */}
                      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-gray-900 text-base">#{ord.order_code}</span>
                              <span className="text-xs font-bold text-gray-500">&bull; {vendor?.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                              Ordered on {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'rider_on_way_to_customer'
                              ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                              : ord.status === 'food_picked_up'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Progress */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-white">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                          <div className={`p-2 rounded-xl border ${
                            ['pending', 'vendor_accepted', 'food_preparing', 'ready_for_pickup', 'rider_assigned', 'rider_on_way_to_customer', 'delivered'].includes(ord.status)
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-gray-200 text-gray-400'
                          }`}>
                            1. Order Placed
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            ['food_preparing', 'ready_for_pickup', 'rider_assigned', 'rider_on_way_to_customer', 'delivered'].includes(ord.status)
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-gray-200 text-gray-400'
                          }`}>
                            2. Preparing in Kitchen
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            ['rider_on_way_to_customer', 'delivered'].includes(ord.status)
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-gray-200 text-gray-400'
                          }`}>
                            3. Food Picked Up (Cash Paid to Vendor)
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            ord.status === 'delivered'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-gray-200 text-gray-400'
                          }`}>
                            4. Handed Over (Cash Collected)
                          </div>
                        </div>
                      </div>

                      {/* Map + Details */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                        {/* Map View */}
                        <div className="lg:col-span-7 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-800 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Live Tracking Route
                            </span>
                            {assignedRider && assignedRider.is_online && (
                              <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Rider Live GPS Updating Every 5s
                              </span>
                            )}
                          </div>
                          <InteractiveMap
                            center={[ord.delivery_latitude, ord.delivery_longitude]}
                            zoom={13}
                            markers={markers}
                            heightClass="h-64"
                          />
                        </div>

                        {/* Invoice & Rider Details */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                          {/* Items List */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ordered Items</span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {ord.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs py-1 border-b border-gray-50">
                                  <span className="text-gray-700 font-medium">
                                    {item.quantity}x {item.item_name}
                                  </span>
                                  <span className="text-gray-900 font-bold font-mono">
                                    {settings.currency_symbol}{item.subtotal}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rider Info Card */}
                          {assignedRider ? (
                            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                  {assignedRider.name[0]}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{assignedRider.name}</p>
                                  <p className="text-[11px] text-gray-600">{assignedRider.vehicle_type} &bull; {assignedRider.phone}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                Assigned Rider
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                              <span>Searching for rider within {settings.rider_match_radius_km} km of restaurant...</span>
                            </div>
                          )}

                          {/* Cash On Delivery Breakdown */}
                          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-700">
                              <span>Food Items Total:</span>
                              <span className="font-mono font-medium">{settings.currency_symbol}{ord.food_total}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Delivery Fee ({ord.delivery_distance_km} km):</span>
                              <span className="font-mono font-medium">{settings.currency_symbol}{ord.delivery_fee}</span>
                            </div>
                            <div className="pt-2 border-t border-amber-300 flex justify-between font-extrabold text-sm text-gray-900">
                              <span>Cash Payable to Rider:</span>
                              <span className="text-rose-600 font-mono">{settings.currency_symbol}{ord.total_cash_payable}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 pt-1">
                              * Keep exact change ready for rider upon delivery.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Restaurant Menu Modal */}
      {selectedVendorForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="relative h-44 bg-gray-900">
              <img
                src={selectedVendorForMenu.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
                alt={selectedVendorForMenu.name}
                className="w-full h-full object-cover opacity-70"
              />
              <button
                onClick={() => setSelectedVendorForMenu(null)}
                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/80"
              >
                &times;
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <h3 className="text-xl font-black">{selectedVendorForMenu.name}</h3>
                <p className="text-xs text-gray-200 mt-0.5">{selectedVendorForMenu.cuisine} &bull; {selectedVendorForMenu.address}</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="font-bold text-gray-900 text-sm">Available Dishes & Specialties</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems
                  .filter((m) => m.vendor_id === selectedVendorForMenu.id)
                  .map((item) => {
                    const cartItem = cart.find((ci) => ci.menuItem.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition flex items-center justify-between gap-3 bg-white"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-900 text-xs">{item.name}</h5>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                          <span className="font-extrabold text-sm text-gray-900 font-mono mt-1 block">
                            {settings.currency_symbol}{item.price}
                          </span>
                        </div>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        )}

                        <div>
                          {cartItem ? (
                            <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1">
                              <button
                                onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                                className="p-1 text-rose-700 hover:bg-rose-100 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-rose-800 px-1">{cartItem.quantity}</span>
                              <button
                                onClick={() => addToCart(item, selectedVendorForMenu)}
                                className="p-1 text-rose-700 hover:bg-rose-100 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item, selectedVendorForMenu)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer with Cart summary */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cart Total: <strong className="text-gray-900">{cart.length} items</strong></p>
                <p className="text-sm font-extrabold text-gray-900 font-mono">
                  {settings.currency_symbol}{foodTotal}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedVendorForMenu(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Close
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedVendorForMenu(null);
                      setIsCartOpen(true);
                    }}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <span>Proceed to COD Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button (If items in cart) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-3 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl transition-transform transform hover:scale-105"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-amber-400 text-gray-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-medium leading-none text-rose-100">Review Cash Order</p>
              <p className="text-sm font-black font-mono leading-tight">
                {settings.currency_symbol}{totalCashPayable}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-200" />
          </button>
        </div>
      )}

      {/* Checkout & COD Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-gray-900 text-base">Cash On Delivery Checkout</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Restaurant info */}
              <div className="p-3 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900">{cartVendor?.name}</span>
                  <p className="text-gray-500">{cartVendor?.address}</p>
                </div>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {cartDistanceKm} km away
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Order Items</span>
                {cart.map((ci) => (
                  <div key={ci.menuItem.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{ci.menuItem.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {settings.currency_symbol}{ci.menuItem.price} &times; {ci.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold font-mono text-gray-900">
                        {settings.currency_symbol}{ci.menuItem.price * ci.quantity}
                      </span>
                      <button
                        onClick={() => removeFromCart(ci.menuItem.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Target */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-950 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Delivery Address
                  </span>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsAddressModalOpen(true);
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
                <p className="text-gray-800 font-medium">{selectedAddress?.address_line}</p>
                {selectedAddress?.details && <p className="text-gray-500 text-[11px]">{selectedAddress.details}</p>}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Notes / Instructions for Rider & Kitchen
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please bring exact change for 1000 Tk note, call upon arrival"
                  value={orderInstructions}
                  onChange={(e) => setOrderInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Bill Breakdown */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Food Total:</span>
                  <span className="font-mono font-medium">{settings.currency_symbol}{foodTotal}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>
                    Delivery Charge ({cartDistanceKm} km &times; {settings.currency_symbol}{settings.per_km_delivery_charge}/km):
                  </span>
                  <span className="font-mono font-medium">{settings.currency_symbol}{deliveryFee}</span>
                </div>
                <div className="pt-2 border-t border-amber-300 flex justify-between font-black text-sm text-gray-900">
                  <span>Total Cash on Delivery:</span>
                  <span className="text-rose-600 font-mono">{settings.currency_symbol}{totalCashPayable}</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-900 flex items-center gap-1">
                  <Banknote className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Rider will purchase food from restaurant & collect {settings.currency_symbol}{totalCashPayable} cash from you.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
              >
                Back to Menu
              </button>
              <button
                disabled={isPlacingOrder}
                onClick={handleCheckout}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isPlacingOrder ? 'Confirming...' : `Confirm Cash Order (${settings.currency_symbol}${totalCashPayable})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      <AddressBookModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
};
