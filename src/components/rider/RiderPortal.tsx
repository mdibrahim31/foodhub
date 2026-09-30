import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useDelivery } from '../../context/DeliveryContext';
import { Order, Rider } from '../../types/database';
import { 
  Bike, 
  Menu, 
  Headphones, 
  Navigation, 
  X, 
  Check, 
  Banknote, 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Volume2, 
  VolumeX, 
  DollarSign, 
  Layers,
  ArrowRight,
  Radio
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

  // State Management
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [rejectedOrderIds, setRejectedOrderIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [orderCountdown, setOrderCountdown] = useState(60);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  if (!currentRider) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div>
          <Bike className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <p className="font-bold text-base">No active rider profile selected</p>
          <p className="text-xs text-slate-400 mt-1">Please select or register a rider in Admin.</p>
        </div>
      </div>
    );
  }

  // Active delivery assigned to this rider that is not completed
  const activeOrder = orders.find(
    (o) => o.rider_id === currentRider.id && !['delivered', 'cancelled'].includes(o.status)
  );

  // Eligible orders based on proximity radius
  const eligibleRequests = getEligibleOrdersForRider(currentRider);
  const incomingCandidate = eligibleRequests.find(
    (r) => r.isWithinRadius && !r.order.rider_id && !rejectedOrderIds.includes(r.order.id)
  );

  // Audio chime for new incoming order
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio context restricted before user interaction
    }
  };

  // Sound chime when a new candidate appears
  useEffect(() => {
    if (incomingCandidate && currentRider.is_online) {
      playAlertSound();
      setOrderCountdown(60);
    }
  }, [incomingCandidate?.order.id, currentRider.is_online]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!incomingCandidate || !currentRider.is_online) return;
    const interval = setInterval(() => {
      setOrderCountdown((prev) => {
        if (prev <= 1) {
          // Auto reject when countdown runs out
          setRejectedOrderIds((r) => [...r, incomingCandidate.order.id]);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingCandidate?.order.id, currentRider.is_online]);

  // Online / Offline Switch Toggle handler
  const handleToggleOnlineSwitch = async () => {
    setIsTogglingOnline(true);
    try {
      await toggleRiderOnline(currentRider.id, !currentRider.is_online);
    } finally {
      setIsTogglingOnline(false);
    }
  };

  // Initialize Fullscreen Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentRider.current_latitude, currentRider.current_longitude],
        zoom: 15,
        zoomControl: false, // Clean custom mobile view
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = routeGroup;

      // Rider Marker with custom pulsing navigation icon
      const riderIcon = L.divIcon({
        className: 'rider-live-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <!-- Heading Cone Light -->
            <div style="position: absolute; top: -14px; width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 32px solid rgba(14, 165, 233, 0.35); filter: blur(2px);"></div>
            <!-- Pulsing outer ring -->
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(14, 165, 233, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <!-- Inner white border circle -->
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); z-index: 2;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker(
        [currentRider.current_latitude, currentRider.current_longitude],
        { icon: riderIcon }
      ).addTo(map);

      riderMarkerRef.current = marker;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Rider Marker position & Map View when coordinates update
  useEffect(() => {
    if (!mapInstanceRef.current || !riderMarkerRef.current) return;
    const lat = currentRider.current_latitude;
    const lng = currentRider.current_longitude;
    riderMarkerRef.current.setLatLng([lat, lng]);
  }, [currentRider.current_latitude, currentRider.current_longitude]);

  // Update Route Polyline & Destination Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;
    const layer = routeLayerGroupRef.current;
    layer.clearLayers();

    const targetOrder = activeOrder || incomingCandidate?.order;
    if (targetOrder) {
      const vendor = vendors.find((v) => v.id === targetOrder.vendor_id);
      const points: [number, number][] = [
        [currentRider.current_latitude, currentRider.current_longitude]
      ];

      // Vendor Marker
      if (vendor) {
        const vIcon = L.divIcon({
          className: 'vendor-pin',
          html: `<div style="background:#ea580c;color:white;padding:4px;border-radius:10px;font-size:10px;font-weight:900;border:2px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.3);text-align:center;">🏪 ${vendor.name.split(' ')[0]}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });
        L.marker([vendor.latitude, vendor.longitude], { icon: vIcon }).addTo(layer);
        points.push([vendor.latitude, vendor.longitude]);
      }

      // Customer Marker
      const cIcon = L.divIcon({
        className: 'customer-pin',
        html: `<div style="background:#0f172a;color:white;padding:4px;border-radius:10px;font-size:10px;font-weight:900;border:2px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.3);text-align:center;">📍 ${targetOrder.customer_name.split(' ')[0]}</div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });
      L.marker([targetOrder.delivery_latitude, targetOrder.delivery_longitude], { icon: cIcon }).addTo(layer);
      points.push([targetOrder.delivery_latitude, targetOrder.delivery_longitude]);

      // Connect with dotted route polyline
      L.polyline(points, {
        color: '#ea580c',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8,
      }).addTo(layer);
    }
  }, [activeOrder?.id, incomingCandidate?.order.id, currentRider.current_latitude, currentRider.current_longitude]);

  // Recenter Map to Rider GPS
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [currentRider.current_latitude, currentRider.current_longitude],
        16,
        { animate: true }
      );
    }
  };

  // Reject Incoming Order
  const handleRejectOrder = (orderId: string) => {
    setRejectedOrderIds((prev) => [...prev, orderId]);
  };

  // Accept Incoming Order
  const handleAcceptOrder = (orderId: string) => {
    riderAcceptOrder(orderId, currentRider.id);
  };

  // Check if rider cash limit is exceeded (e.g. > 5000 BDT)
  const isCashRestricted = currentRider.cash_in_hand > 4000;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-100 font-sans select-none">
      
      {/* 
        ========================================================================
        1. FULLSCREEN INTERACTIVE LEAFLET MAP (Chattogram City Background)
        ========================================================================
      */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* 
        ========================================================================
        2. FLOATING TOP BAR (100% Matching Screenshot_20260930_201012_pandarider.jpg)
        - Left: Circular Menu Hamburger [ ☰ ]
        - Center: Status Card with "Go Online / Go Offline" Switch
        - Right: Circular Headphone Support [ 🎧 ]
        ========================================================================
      */}
      <header className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none max-w-md mx-auto">
        
        {/* Left: Circular Hamburger Button [ ☰ ] */}
        <button
          onClick={() => setIsMenuDrawerOpen(true)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 border border-slate-100/80 cursor-pointer"
          aria-label="Rider menu"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* 
          Center: Floating Status Pill Card with "Go Online / Go Offline" Switch
          (As explicitly requested by user: "upore status er ghore go online and go offline switch button add koro")
        */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 px-4 py-1.5 flex items-center space-x-3.5">
          {/* Status Label & Title */}
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider leading-none">
              Status
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isCashRestricted
                    ? 'bg-rose-500 animate-pulse'
                    : currentRider.is_online
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-black text-xs text-slate-900 leading-tight">
                {isCashRestricted
                  ? 'Access restricted'
                  : currentRider.is_online
                  ? 'Online'
                  : 'Offline'}
              </span>
            </div>
          </div>

          {/* Go Online / Go Offline Switch Toggle */}
          <button
            onClick={handleToggleOnlineSwitch}
            disabled={isTogglingOnline}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              currentRider.is_online ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title={currentRider.is_online ? 'Tap to Go Offline' : 'Tap to Go Online'}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                currentRider.is_online ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {currentRider.is_online ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
              )}
            </span>
          </button>
        </div>

        {/* Right: Circular Headphone Support Button [ 🎧 ] */}
        <button
          onClick={() => setIsSupportModalOpen(true)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 border border-slate-100/80 cursor-pointer"
          aria-label="Support hotline"
        >
          <Headphones className="w-6 h-6 stroke-[2]" />
        </button>
      </header>

      {/* 
        ========================================================================
        3. BOTTOM-RIGHT GPS RECENTER BUTTON [ ⌖ ]
        ========================================================================
      */}
      <div className="absolute bottom-72 sm:bottom-64 right-4 z-20">
        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 border border-slate-100 cursor-pointer"
          title="Recenter Map"
        >
          <Navigation className="w-5 h-5 stroke-[2.2] text-slate-800" />
        </button>
      </div>

      {/* 
        ========================================================================
        4. BOTTOM FLOATING SHEET (THE RED MARKED AREA IN SCREENSHOT!)
        - Case A: Order Popup with Accept and Reject buttons (When new order exists)
        - Case B: Active Order Run (When order is accepted)
        - Case C: Access restricted / Offline / Idle state (Matching Screenshot)
        ========================================================================
      */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-3 sm:p-4 max-w-md mx-auto pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* 
            CASE A: NEW ORDER POPUP WITH ACCEPT & REJECT BUTTONS
            (User explicitly requested: "red mark a order ppup show hobe accept and reject button thakbe")
          */}
          {currentRider.is_online && incomingCandidate && !activeOrder && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom duration-300">
              
              {/* Header: Incoming Order Alert + Countdown Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    New Delivery Request
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>{orderCountdown}s left</span>
                </div>
              </div>

              {/* Order Code & Restaurant Pickup */}
              <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-orange-700 uppercase">Pickup Restaurant</span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {incomingCandidate.order.vendor?.name || 'Restaurant Partner'}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {incomingCandidate.order.vendor?.address || 'Chattogram'}
                    </p>
                  </div>
                  <span className="text-xs font-black text-orange-600 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shrink-0 font-mono">
                    {incomingCandidate.distanceToRestaurantKm} km
                  </span>
                </div>
              </div>

              {/* Customer Drop-off Target */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Deliver to Customer</span>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {incomingCandidate.order.customer_name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {incomingCandidate.order.delivery_address}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0 font-mono">
                    {incomingCandidate.order.delivery_distance_km} km
                  </span>
                </div>
              </div>

              {/* COD Financial Breakdown */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Pay restaurant in cash:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{settings.currency_symbol}{incomingCandidate.order.food_total}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Collect cash from customer:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{settings.currency_symbol}{incomingCandidate.order.total_cash_payable}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-amber-200 flex justify-between font-black text-slate-900 text-sm">
                  <span>Your Net Earnings:</span>
                  <span className="font-mono text-emerald-700 text-base">
                    +{settings.currency_symbol}{incomingCandidate.order.delivery_fee}
                  </span>
                </div>
              </div>

              {/* 
                THE TWO REQUESTED BUTTONS: ACCEPT & REJECT
                (Explicit user requirement: "accept and reject button thakbe")
              */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Reject Button */}
                <button
                  onClick={() => handleRejectOrder(incomingCandidate.order.id)}
                  className="w-full py-3.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-300 font-extrabold text-xs rounded-2xl transition cursor-pointer active:scale-95"
                >
                  Reject / Decline
                </button>

                {/* Accept Button */}
                <button
                  onClick={() => handleAcceptOrder(incomingCandidate.order.id)}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Accept Order</span>
                </button>
              </div>
            </div>
          )}

          {/* 
            CASE B: ACTIVE ORDER IN PROGRESS (Accepted Delivery Run)
          */}
          {activeOrder && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                    Active Delivery Run
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Order #{activeOrder.order_code}
                  </h3>
                </div>
                <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Stage 1: Pickup from Restaurant */}
              {!activeOrder.food_cash_paid_to_vendor ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-orange-700 uppercase">Step 1: Go to Restaurant</span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {activeOrder.vendor?.name}
                    </h4>
                    <p className="text-xs text-slate-600">{activeOrder.vendor?.address}</p>
                    <div className="pt-2 text-xs flex justify-between font-bold text-slate-800">
                      <span>Cash to Pay Restaurant:</span>
                      <span className="font-mono text-rose-600 font-black">
                        {settings.currency_symbol}{activeOrder.food_total}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => riderConfirmCashPaidToVendor(activeOrder.id)}
                    className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-2xl shadow-md transition cursor-pointer"
                  >
                    Confirm Paid {settings.currency_symbol}{activeOrder.food_total} & Picked Up Food
                  </button>
                </div>
              ) : (
                /* Stage 2: Deliver to Customer & Collect COD */
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-emerald-700 uppercase">Step 2: Deliver to Customer</span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {activeOrder.customer_name}
                    </h4>
                    <p className="text-xs text-slate-600">{activeOrder.delivery_address}</p>
                    
                    <div className="pt-2 text-xs flex justify-between font-black text-slate-900 border-t border-emerald-200/80">
                      <span>Collect Full COD Cash:</span>
                      <span className="font-mono text-emerald-700 text-base">
                        {settings.currency_symbol}{activeOrder.total_cash_payable}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${activeOrder.customer_phone}`}
                      className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </a>
                    <button
                      onClick={() => riderConfirmCashCollectedFromCustomer(activeOrder.id)}
                      className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-md transition cursor-pointer"
                    >
                      Collected {settings.currency_symbol}{activeOrder.total_cash_payable} COD & Delivered
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 
            CASE C: ACCESS RESTRICTED / OFFLINE / SEARCHING
            (Matching Screenshot_20260930_201012_pandarider.jpg!)
          */}
          {!activeOrder && !incomingCandidate && (
            <div className="space-y-3">
              {isCashRestricted ? (
                /* Screenshot matching: "Access restricted - To end this restriction, return cash through wallet cashout" */
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-black text-rose-600 tracking-tight">
                      Access restricted
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                      To end this restriction, return cash through wallet cashout
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCashoutModalOpen(true)}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-md transition cursor-pointer active:scale-98"
                  >
                    Cash out
                  </button>
                </div>
              ) : currentRider.is_online ? (
                /* Searching State */
                <div className="py-2 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Searching for orders in Chattogram...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Stay online. Orders within {settings.rider_match_radius_km} km radius from restaurants will pop up here with Accept & Reject buttons!
                  </p>
                </div>
              ) : (
                /* Offline State */
                <div className="py-2 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Bike className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    You are currently offline
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Toggle the switch above to <strong>Go Online</strong> and start receiving delivery requests.
                  </p>
                  <button
                    onClick={handleToggleOnlineSwitch}
                    className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                  >
                    Go Online
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        MODAL: MENU DRAWER (Profile, Cash, Switch Rider, Location Simulator)
        ========================================================================
      */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bike className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Rider Profile & Settings</h3>
              </div>
              <button 
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rider Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Active Rider Profile</label>
              <select
                value={currentRider.id}
                onChange={(e) => {
                  const r = riders.find((x) => x.id === e.target.value);
                  if (r) setCurrentRider(r);
                }}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl"
              >
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vehicle_type}) - ৳{r.cash_in_hand} Float
                  </option>
                ))}
              </select>
            </div>

            {/* Floating Cash in Hand Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Cash in Hand (Floating Float)</span>
                <span className="font-mono font-black text-lg text-slate-900">
                  {settings.currency_symbol}{currentRider.cash_in_hand}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Cash limit: ৳4,000. Above limit triggers "Access restricted" until cash is deposited.
              </p>
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  setIsCashoutModalOpen(true);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                Cash out / Deposit Cash
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Order Audio Alert Chime</span>
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-2 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                  soundEnabled ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            {/* Dispatch Simulator Controls for Testing */}
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
              <span className="text-xs font-black text-orange-900 block">
                Quick Location Simulator (Chattogram)
              </span>
              <p className="text-[11px] text-slate-600">
                Test order popping up inside vs outside the {settings.rider_match_radius_km} km radius:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateRiderLocation(currentRider.id, 22.3600, 91.8250);
                    handleRecenter();
                  }}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold"
                >
                  Inside Zone (Nasirabad)
                </button>
                <button
                  onClick={() => {
                    updateRiderLocation(currentRider.id, 22.4200, 91.7800);
                    handleRecenter();
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                >
                  Outside Zone (5km away)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: CASHOUT / RETURN CASH TO END RESTRICTION
        ========================================================================
      */}
      {isCashoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Return Cash (Cash Out)</h3>
              <button onClick={() => setIsCashoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Current Floating Cash: <strong className="text-slate-900 font-mono">৳{currentRider.cash_in_hand}</strong>
              </p>
              <p className="text-slate-500">
                Deposit cash through bKash/Nagad agent or FoodHub partner hub counter to clear restrictions.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                Tap confirm below to simulate depositing ৳2,000 cash back to the system.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCashoutModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  currentRider.cash_in_hand = Math.max(0, currentRider.cash_in_hand - 2000);
                  setIsCashoutModalOpen(false);
                  alert('Cashout confirmed! ৳2,000 deposited. Restriction cleared.');
                }}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs shadow-md"
              >
                Confirm Cashout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: SUPPORT HOTLINE
        ========================================================================
      */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Rider Dispatch Helpdesk</h3>
              </div>
              <button onClick={() => setIsSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">24/7 Rider Emergency Dispatch:</p>
              <p className="text-base font-black text-orange-600 font-mono">📞 16212 (Hotline)</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-800">COD Delivery Rule:</p>
                <p className="text-[11px] text-slate-500">
                  Always verify cash handed to restaurant matches food bill, and collect exact cash amount from customer upon handover.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs"
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
