import React, { useState, useEffect } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { calculateDistanceKm } from '../../utils/geo';
import { Order } from '../../types/database';
import { 
  Bike, 
  Power, 
  MapPin, 
  Radio, 
  Banknote, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Compass, 
  Phone, 
  ArrowRight,
  ShieldAlert,
  Sliders
} from 'lucide-react';

export const RiderPortal: React.FC = () => {
  const { 
    riders, 
    currentRider, 
    setCurrentRider, 
    toggleRiderOnline, 
    updateRiderLocation,
    settings, 
    orders, 
    getEligibleOrdersForRider, 
    riderAcceptOrder,
    riderConfirmCashPaidToVendor,
    riderConfirmCashCollectedFromCustomer,
    vendors
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'wallet'>('requests');
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [secondsSinceLastUpdate, setSecondsSinceLastUpdate] = useState(0);

  // Counter to show live 5-second pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceLastUpdate((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentRider) {
    return (
      <div className="p-8 text-center text-gray-500">
        No rider profile found. Please create or approve a rider in Admin.
      </div>
    );
  }

  // Active delivery assigned to this rider that is not yet completed
  const activeOrder = orders.find(
    (o) => o.rider_id === currentRider.id && !['delivered', 'cancelled'].includes(o.status)
  );

  // Eligible orders based on Admin proximity radius
  const eligibleRequests = getEligibleOrdersForRider(currentRider);
  const withinRadiusRequests = eligibleRequests.filter((r) => r.isWithinRadius && !r.order.rider_id);
  const outsideRadiusRequests = eligibleRequests.filter((r) => !r.isWithinRadius && !r.order.rider_id);

  const handleToggleOnline = async () => {
    setIsTogglingOnline(true);
    try {
      await toggleRiderOnline(currentRider.id, !currentRider.is_online);
    } finally {
      setIsTogglingOnline(false);
    }
  };

  // Helper quick jump for testing dispatch zone
  const jumpLocationNearRestaurant = (vendorLat: number, vendorLng: number, offsetKm = 0.3) => {
    // 0.009 deg roughly ~ 1 km
    const offsetDeg = (offsetKm / 111.0);
    updateRiderLocation(currentRider.id, vendorLat + offsetDeg, vendorLng + offsetDeg);
  };

  const jumpLocationFarAway = () => {
    // Move 3 km away from Banani
    updateRiderLocation(currentRider.id, 23.7500, 90.3800);
  };

  // Markers for active delivery
  const deliveryMarkers = [];
  if (activeOrder) {
    const v = vendors.find((x) => x.id === activeOrder.vendor_id);
    if (v) {
      deliveryMarkers.push({
        id: 'v-pin',
        latitude: v.latitude,
        longitude: v.longitude,
        title: `Pickup: ${v.name}`,
        subtitle: v.address,
        type: 'vendor' as const,
      });
    }
    deliveryMarkers.push({
      id: 'c-pin',
      latitude: activeOrder.delivery_latitude,
      longitude: activeOrder.delivery_longitude,
      title: `Drop-off: ${activeOrder.customer_name}`,
      subtitle: activeOrder.delivery_address,
      type: 'customer' as const,
    });
  }
  // Current rider pin
  deliveryMarkers.push({
    id: 'r-live',
    latitude: currentRider.current_latitude,
    longitude: currentRider.current_longitude,
    title: `You (${currentRider.name})`,
    subtitle: `Live 5s GPS Pulse`,
    type: 'rider' as const,
    isDraggable: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sub Header: Status & Live GPS Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Rider ID */}
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${currentRider.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <select
                  value={currentRider.id}
                  onChange={(e) => {
                    const r = riders.find((x) => x.id === e.target.value);
                    if (r) setCurrentRider(r);
                  }}
                  className="font-bold text-gray-900 text-sm bg-transparent border-none cursor-pointer focus:ring-0 pr-6"
                >
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.vehicle_type})
                    </option>
                  ))}
                </select>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentRider.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {currentRider.is_online ? 'Online & Tracking' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500 font-mono">
                <span>Lat: {currentRider.current_latitude.toFixed(5)}</span>
                <span>Lng: {currentRider.current_longitude.toFixed(5)}</span>
                {currentRider.is_online && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-ping" />
                    5s Sync ({5 - secondsSinceLastUpdate}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Online Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleOnline}
              disabled={isTogglingOnline}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
                currentRider.is_online
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{currentRider.is_online ? 'Go Offline' : 'Go Online (Request GPS)'}</span>
            </button>

            {/* Navigation */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeTab === 'requests' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Nearby Orders</span>
                {withinRadiusRequests.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {withinRadiusRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeTab === 'active' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Active Delivery</span>
                {activeOrder && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'wallet' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Floating Cash & Earnings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* COD Protocol Guide */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Banknote className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cash On Delivery (COD) Rider Workflow</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Step 1: Pay food bill in cash to restaurant upon pickup &bull; Step 2: Collect full bill + delivery fee in cash from customer.
              </p>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-mono">
            <span>Float In Hand: </span>
            <span className="font-extrabold text-amber-300 text-sm">
              {settings.currency_symbol}{currentRider.cash_in_hand}
            </span>
          </div>
        </div>

        {/* Proximity Testing Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-gray-800">
                Proximity Dispatch Zone Radar: <span className="text-emerald-700 underline">&le; {settings.rider_match_radius_km} km</span> from Restaurant
              </h3>
            </div>
            <p className="text-[11px] text-gray-500">
              Only orders from restaurants within {settings.rider_match_radius_km} km appear for you to accept.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600">Simulate Rider Location:</span>
            {vendors.slice(0, 2).map((v) => (
              <button
                key={v.id}
                onClick={() => jumpLocationNearRestaurant(v.latitude, v.longitude, 0.4)}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100"
              >
                Jump near {v.name.split('-')[0]} (0.4 km - Inside Zone)
              </button>
            ))}
            <button
              onClick={jumpLocationFarAway}
              className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100"
            >
              Move 3+ km Away (Outside Zone)
            </button>
          </div>
        </div>

        {/* Tab 1: Nearby Order Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {!currentRider.is_online ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                <Bike className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 text-base">You are currently Offline</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Switch to Online to begin receiving delivery requests within {settings.rider_match_radius_km} km of nearby restaurants.
                </p>
                <button
                  onClick={handleToggleOnline}
                  className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
                >
                  Go Online Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Orders Within {settings.rider_match_radius_km} km Radius ({withinRadiusRequests.length})</span>
                  </h3>
                </div>

                {withinRadiusRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                    <Radio className="w-10 h-10 text-emerald-500 mx-auto mb-2 animate-pulse" />
                    <h3 className="font-bold text-gray-800 text-sm">Searching for orders within {settings.rider_match_radius_km} km...</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Currently no ready orders in your 1 km radius. You can use the simulator bar above to test jumping closer to a restaurant with orders.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {withinRadiusRequests.map(({ order: reqOrder, distanceToRestaurantKm }) => (
                      <div
                        key={reqOrder.id}
                        className="bg-white rounded-2xl p-5 border-2 border-emerald-300 shadow-xs space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-gray-900 text-base">#{reqOrder.order_code}</span>
                            <h4 className="font-bold text-gray-800 text-sm">{reqOrder.vendor?.name}</h4>
                            <p className="text-xs text-gray-500">{reqOrder.vendor?.address}</p>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {distanceToRestaurantKm} km away
                          </span>
                        </div>

                        {/* Customer target */}
                        <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-gray-800">Deliver to: {reqOrder.customer_name}</p>
                          <p className="text-gray-600 line-clamp-1">{reqOrder.delivery_address}</p>
                        </div>

                        {/* COD Financials */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-gray-700">
                            <span>Cash to pay restaurant (Food Bill):</span>
                            <span className="font-mono font-bold text-red-600">-{settings.currency_symbol}{reqOrder.food_total}</span>
                          </div>
                          <div className="flex justify-between text-gray-700">
                            <span>Cash to collect from customer:</span>
                            <span className="font-mono font-bold text-emerald-700">+{settings.currency_symbol}{reqOrder.total_cash_payable}</span>
                          </div>
                          <div className="pt-1 border-t border-amber-200 flex justify-between font-extrabold text-gray-900">
                            <span>Your Delivery Earning:</span>
                            <span className="font-mono text-emerald-700">+{settings.currency_symbol}{reqOrder.delivery_fee}</span>
                          </div>
                        </div>

                        {/* Accept Button */}
                        <button
                          onClick={() => {
                            riderAcceptOrder(reqOrder.id, currentRider.id);
                            setActiveTab('active');
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                        >
                          Accept Delivery Request
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders Out of Radius (Demonstrating the prompt's 1km restriction) */}
                {outsideRadiusRequests.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <ShieldAlert className="w-4 h-4 text-gray-400" />
                      <span>Orders Outside Your {settings.rider_match_radius_km} km Dispatch Radius ({outsideRadiusRequests.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                      {outsideRadiusRequests.map(({ order: reqOrder, distanceToRestaurantKm }) => (
                        <div key={reqOrder.id} className="bg-white p-3 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">#{reqOrder.order_code} - {reqOrder.vendor?.name}</p>
                            <p className="text-gray-500 text-[11px]">{reqOrder.delivery_address}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-red-600 font-bold block">{distanceToRestaurantKm} km away</span>
                            <span className="text-[10px] text-gray-400">Limit: {settings.rider_match_radius_km} km</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Delivery Workflow */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {!activeOrder ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                <Bike className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800 text-sm">No Active Delivery in Progress</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Accept an order from the "Nearby Orders" tab to start your delivery route.
                </p>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
                >
                  View Available Orders
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-6 p-6">
                {/* Active Header */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Delivery Run</span>
                    <h3 className="text-xl font-black text-gray-900">Order #{activeOrder.order_code}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                      Status: {activeOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Step 1 & Step 2 Progression Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stage 1: Pickup from Restaurant & Pay Cash */}
                  <div className={`p-4 rounded-xl border-2 transition ${
                    !activeOrder.food_cash_paid_to_vendor
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-emerald-500 bg-emerald-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-500">Stage 1: Restaurant Pickup</span>
                      {activeOrder.food_cash_paid_to_vendor && (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Cash Paid & Food In Hand
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">{activeOrder.vendor?.name}</h4>
                    <p className="text-xs text-gray-600">{activeOrder.vendor?.address}</p>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200 text-xs">
                      <div className="flex justify-between font-bold text-orange-950">
                        <span>Cash to Hand Over to Restaurant:</span>
                        <span className="font-mono text-base text-red-600">{settings.currency_symbol}{activeOrder.food_total}</span>
                      </div>
                    </div>

                    {!activeOrder.food_cash_paid_to_vendor ? (
                      <button
                        onClick={() => riderConfirmCashPaidToVendor(activeOrder.id)}
                        className="w-full mt-3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                      >
                        I Arrived & Paid {settings.currency_symbol}{activeOrder.food_total} Cash to Restaurant
                      </button>
                    ) : (
                      <p className="text-[11px] text-emerald-800 font-semibold mt-2">
                        Food parcel secured. Proceed to customer location.
                      </p>
                    )}
                  </div>

                  {/* Stage 2: Deliver to Customer & Collect Total Cash */}
                  <div className={`p-4 rounded-xl border-2 transition ${
                    activeOrder.food_cash_paid_to_vendor
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-500">Stage 2: Customer Delivery</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        Collect: {settings.currency_symbol}{activeOrder.total_cash_payable}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">{activeOrder.customer_name}</h4>
                    <p className="text-xs text-gray-600">{activeOrder.delivery_address}</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">Phone: {activeOrder.customer_phone}</p>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Total Cash to Collect:</span>
                        <span className="font-mono text-base text-emerald-700">{settings.currency_symbol}{activeOrder.total_cash_payable}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Reimburses food bill: {settings.currency_symbol}{activeOrder.food_total} | Delivery Fee earned: {settings.currency_symbol}{activeOrder.delivery_fee}</span>
                      </div>
                    </div>

                    <button
                      disabled={!activeOrder.food_cash_paid_to_vendor}
                      onClick={() => riderConfirmCashCollectedFromCustomer(activeOrder.id)}
                      className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40"
                    >
                      Food Handed Over & Collected {settings.currency_symbol}{activeOrder.total_cash_payable} Cash
                    </button>
                  </div>
                </div>

                {/* Live Route Map */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">Active Delivery GPS Route & 5-Second Ping</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      Your 5s Live Coordinates: {currentRider.current_latitude.toFixed(5)}, {currentRider.current_longitude.toFixed(5)}
                    </span>
                  </div>
                  <InteractiveMap
                    center={[currentRider.current_latitude, currentRider.current_longitude]}
                    zoom={14}
                    markers={deliveryMarkers}
                    heightClass="h-72"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cash Float & Ledger */}
        {activeTab === 'wallet' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Rider Cash Float & Settlement Ledger</h3>
              <p className="text-xs text-gray-500">Real-time accounting of physical cash in pocket</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-semibold text-emerald-800 uppercase">Floating Cash In Hand</span>
                <p className="text-2xl font-black text-emerald-900 font-mono mt-1">
                  {settings.currency_symbol}{currentRider.cash_in_hand}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">Ready to purchase food from restaurants</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs font-semibold text-blue-800 uppercase">Completed Deliveries</span>
                <p className="text-2xl font-black text-blue-900 font-mono mt-1">
                  {orders.filter((o) => o.rider_id === currentRider.id && o.status === 'delivered').length}
                </p>
                <p className="text-[11px] text-blue-700 mt-1">Successfully fulfilled</p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-xs font-semibold text-purple-800 uppercase">Total Delivery Fees Earned</span>
                <p className="text-2xl font-black text-purple-900 font-mono mt-1">
                  {settings.currency_symbol}
                  {orders
                    .filter((o) => o.rider_id === currentRider.id && o.status === 'delivered')
                    .reduce((sum, o) => sum + o.delivery_fee, 0)}
                </p>
                <p className="text-[11px] text-purple-700 mt-1">Net delivery profit collected</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
