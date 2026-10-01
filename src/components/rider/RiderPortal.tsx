import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useDelivery } from '../../context/DeliveryContext';
import { AuthModal } from '../common/AuthModal';
import { calculateDistanceKm } from '../../utils/geo';
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
  Radio,
  Store,
  User,
  LogOut,
  KeyRound,
  Mail,
  CreditCard,
  Calendar,
  Wallet,
  Inbox,
  Settings,
  Flame,
  HelpCircle,
  FileText
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
    riderAcceptOrder,
    riderRejectOrder,
    riderConfirmCashPaidToVendor,
    riderConfirmCashCollectedFromCustomer,
    vendors,
    currentUser,
    logoutUser,
    riderMessages,
    markRiderMessageAsRead
  } = useDelivery();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // State Management
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isOrdersListOpen, setIsOrdersListOpen] = useState(false);
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

  // Incoming Candidate Order based on zone, distance, and dispatched single rider logic
  const incomingCandidateOrder = currentRider.is_online && !activeOrder
    ? orders.find((o) => {
        if (o.rider_id || ['delivered', 'cancelled'].includes(o.status)) return false;
        if (o.rejected_rider_ids?.includes(currentRider.id)) return false;
        if (o.dispatched_rider_id === currentRider.id) return true;
        if (
          !o.dispatched_rider_id &&
          (o.status === 'ready_for_pickup' || o.status === 'food_preparing')
        ) {
          const v = vendors.find((vend) => vend.id === o.vendor_id);
          const orderZone = o.zone || v?.zone;
          if (currentRider.zone && orderZone && currentRider.zone.toLowerCase() !== orderZone.toLowerCase()) {
            return false;
          }
          if (v) {
            const dist = calculateDistanceKm(v.latitude, v.longitude, currentRider.current_latitude, currentRider.current_longitude);
            return dist <= (settings.rider_match_radius_km || 1.5);
          }
          return true;
        }
        return false;
      })
    : null;

  const candidateVendor = incomingCandidateOrder
    ? (vendors.find((v) => v.id === incomingCandidateOrder.vendor_id) || incomingCandidateOrder.vendor)
    : null;

  const distanceToVendorKm = incomingCandidateOrder && candidateVendor
    ? calculateDistanceKm(
        candidateVendor.latitude,
        candidateVendor.longitude,
        currentRider.current_latitude,
        currentRider.current_longitude
      ).toFixed(2)
    : '0.4';

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
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Ignore
    }
  };

  // Sound chime when a new candidate appears
  useEffect(() => {
    if (incomingCandidateOrder && currentRider.is_online) {
      playAlertSound();
      setOrderCountdown(60);
    }
  }, [incomingCandidateOrder?.id, currentRider.is_online]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!incomingCandidateOrder || !currentRider.is_online) return;
    const interval = setInterval(() => {
      setOrderCountdown((prev) => {
        if (prev <= 1) {
          // Auto reject when countdown runs out -> pass to next rider
          riderRejectOrder(incomingCandidateOrder.id, currentRider.id);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingCandidateOrder?.id, currentRider.is_online]);

  const handleAcceptOrder = (orderId: string) => {
    riderAcceptOrder(orderId, currentRider.id);
  };

  const handleRejectOrder = (orderId: string) => {
    riderRejectOrder(orderId, currentRider.id);
  };

  // Lock body scroll strictly while in Rider Portal
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

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

      // 100% Free OpenStreetMap Tiles (No API key, No watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = routeGroup;

      // Rider Marker with custom navigation icon + heading cone
      const riderIcon = L.divIcon({
        className: 'rider-live-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <!-- Heading Field of View Cone -->
            <div style="position: absolute; top: -14px; width: 0; height: 0; border-left: 22px solid transparent; border-right: 22px solid transparent; border-top: 36px solid rgba(2, 132, 199, 0.3); filter: blur(1.5px);"></div>
            <!-- Outer soft ring -->
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(2, 132, 199, 0.22);"></div>
            <!-- Inner white border circle -->
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: #0284c7; border: 3.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 2;"></div>
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

  // Update Route Polyline & Destination Markers on Map (Exact Foodpanda Style Store & Customer Icons)
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;
    const layer = routeLayerGroupRef.current;
    layer.clearLayers();

    const targetOrder = activeOrder || incomingCandidateOrder;
    if (targetOrder) {
      const vendor = vendors.find((v) => v.id === targetOrder.vendor_id);
      const points: [number, number][] = [
        [currentRider.current_latitude, currentRider.current_longitude]
      ];

      // 1. VENDOR / RESTAURANT LOCATION PIN (Pink Storefront Badge with ground target stem)
      if (vendor) {
        const vendorIcon = L.divIcon({
          className: 'custom-foodpanda-vendor-pin',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); cursor: pointer;">
              <!-- Pink Circle Store Badge -->
              <div style="width: 38px; height: 38px; border-radius: 9999px; background: #e21b70; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(226, 27, 112, 0.45);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                  <path d="M2 7h20"/>
                </svg>
              </div>
              <!-- Black Connector Stem -->
              <div style="width: 3.5px; height: 10px; background: #0f172a; margin-top: -1px;"></div>
              <!-- Pink Target Base Ring -->
              <div style="width: 14px; height: 14px; border-radius: 9999px; border: 3px solid #e21b70; background: #ffffff; margin-top: -2px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
            </div>
          `,
          iconSize: [42, 60],
          iconAnchor: [21, 58],
          popupAnchor: [0, -56],
        });

        const vMarker = L.marker([vendor.latitude, vendor.longitude], { icon: vendorIcon }).addTo(layer);
        vMarker.bindPopup(`
          <div style="padding: 2px; font-family: inherit; font-size: 12px; font-weight: bold; color: #0f172a;">
            <span style="color: #e21b70; text-transform: uppercase; font-size: 9px; font-weight: 900; display: block;">Pickup Store</span>
            ${vendor.name}
            <span style="font-size: 10px; color: #64748b; display: block; font-weight: normal;">${vendor.address}</span>
          </div>
        `);
        points.push([vendor.latitude, vendor.longitude]);
      }

      // 2. CUSTOMER DROPOFF LOCATION PIN (Black User Badge with ground target stem)
      const customerIcon = L.divIcon({
        className: 'custom-foodpanda-customer-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); cursor: pointer;">
            <!-- Black Circle User Badge -->
            <div style="width: 38px; height: 38px; border-radius: 9999px; background: #0f172a; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.45);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <!-- Black Connector Stem -->
            <div style="width: 3.5px; height: 10px; background: #0f172a; margin-top: -1px;"></div>
            <!-- Black Target Base Ring -->
            <div style="width: 14px; height: 14px; border-radius: 9999px; border: 3px solid #0f172a; background: #ffffff; margin-top: -2px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
          </div>
        `,
        iconSize: [42, 60],
        iconAnchor: [21, 58],
        popupAnchor: [0, -56],
      });

      const cMarker = L.marker([targetOrder.delivery_latitude, targetOrder.delivery_longitude], { icon: customerIcon }).addTo(layer);
      cMarker.bindPopup(`
        <div style="padding: 2px; font-family: inherit; font-size: 12px; font-weight: bold; color: #0f172a;">
          <span style="color: #0f172a; text-transform: uppercase; font-size: 9px; font-weight: 900; display: block;">Customer Dropoff</span>
          ${targetOrder.customer_name}
          <span style="font-size: 10px; color: #64748b; display: block; font-weight: normal;">${targetOrder.delivery_address}</span>
        </div>
      `);
      points.push([targetOrder.delivery_latitude, targetOrder.delivery_longitude]);

      // 3. Connect route with dashed line
      L.polyline(points, {
        color: '#e21b70',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.85,
      }).addTo(layer);

      // Fit map viewport smoothly to show all points
      try {
        const bounds = L.latLngBounds(points);
        mapInstanceRef.current.fitBounds(bounds, {
          paddingTopLeft: [40, 90],
          paddingBottomRight: [40, 240],
          maxZoom: 16,
          animate: true,
        });
      } catch (e) {
        console.error('Fitbounds error:', e);
      }
    }
  }, [activeOrder?.id, incomingCandidateOrder?.id, currentRider.current_latitude, currentRider.current_longitude]);

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

  // Check if rider cash limit is exceeded (e.g. > 5000 BDT)
  const isCashRestricted = currentRider.cash_in_hand > 4000;

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-slate-100 font-sans select-none touch-none overscroll-none">
      
      {/* 
        ========================================================================
        1. FULLSCREEN INTERACTIVE LEAFLET MAP (Chattogram City Background)
        ========================================================================
      */}
      <div ref={mapContainerRef} className="fixed inset-0 z-0 clean-foodpanda-map touch-pan-x touch-pan-y" />

      {/* 
        ========================================================================
        2. FLOATING TOP BAR (100% Fixed and Anchored to Top - Never Scrolls)
        - Left: Circular Menu Hamburger [ ☰ ]
        - Center: Status Card with "Go Online / Go Offline" Switch
        - Right: Circular Headphone Support [ 🎧 ]
        ========================================================================
      */}
      <header className="fixed top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none max-w-md mx-auto">
        
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
                    ? 'bg-rose-500'
                    : currentRider.is_online
                    ? 'bg-emerald-500'
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
        FLOATING COMPASS BUTTON (TOP-RIGHT, MATCHING SCREENSHOT)
        ========================================================================
      */}
      <div className="fixed top-24 right-4 z-20">
        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:bg-slate-900 transition active:scale-95 cursor-pointer border border-slate-700/50"
          title="Compass / North"
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            {/* Red top needle */}
            <div className="absolute top-0.5 w-0 h-0 border-x-[5px] border-x-transparent border-b-[11px] border-b-rose-500"></div>
            {/* White bottom needle */}
            <div className="absolute bottom-0.5 w-0 h-0 border-x-[5px] border-x-transparent border-t-[11px] border-t-white"></div>
            {/* Center pivot dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white z-10 shadow-xs"></div>
          </div>
        </button>
      </div>

      {/* 
        ========================================================================
        3. BOTTOM-RIGHT FLOATING ACTION BUTTONS (MATCHING SCREENSHOT)
        - GPS Recenter Button [ ⌖ ]
        - Pink Turn-by-Turn Navigation Button [ ↗ ]
        ========================================================================
      */}
      <div className="fixed bottom-72 sm:bottom-64 right-4 z-20 flex flex-col space-y-3 items-center">
        {/* Recenter GPS */}
        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 border border-slate-200/80 cursor-pointer"
          title="Recenter Map"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            </div>
            <div className="absolute -top-0.5 w-[2px] h-1.5 bg-slate-900"></div>
            <div className="absolute -bottom-0.5 w-[2px] h-1.5 bg-slate-900"></div>
            <div className="absolute -left-0.5 h-[2px] w-1.5 bg-slate-900"></div>
            <div className="absolute -right-0.5 h-[2px] w-1.5 bg-slate-900"></div>
          </div>
        </button>

        {/* Pink Turn-by-Turn Navigation Button [ ↗ ] (100% Matching Screenshot) */}
        {(activeOrder || incomingCandidateOrder) && (
          <button
            onClick={() => {
              const target = activeOrder || incomingCandidateOrder;
              if (target) {
                const vendor = vendors.find(v => v.id === target.vendor_id);
                const destLat = target.status === 'out_for_delivery' ? target.delivery_latitude : (vendor?.latitude || target.delivery_latitude);
                const destLng = target.status === 'out_for_delivery' ? target.delivery_longitude : (vendor?.longitude || target.delivery_longitude);
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
              }
            }}
            className="w-12 h-12 rounded-full bg-[#e21b70] text-white shadow-2xl flex items-center justify-center hover:bg-[#c2145e] transition active:scale-95 cursor-pointer border border-pink-400/40"
            title="Open Turn-by-Turn GPS Navigation"
          >
            <Navigation className="w-6 h-6 stroke-[2.2] transform rotate-45" />
          </button>
        )}
      </div>

      {/* 
        ========================================================================
        4. BOTTOM FLOATING SHEET (THE RED MARKED AREA IN SCREENSHOT!)
        - Case A: Order Popup with Accept and Reject buttons (When new order exists)
        - Case B: Active Order Run (When order is accepted)
        - Case C: Access restricted / Offline / Idle state (Matching Screenshot)
        ========================================================================
      */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 max-w-md mx-auto pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* 
            CASE A: NEW ORDER POPUP WITH ACCEPT & REJECT BUTTONS
            (User requirement: "rider er kace vendor er and customer er all details show korbe with phone number and food price and delivery charge and totall amount and pay to vendor..jodi she reject kore tahole onno joner kace jabe")
          */}
          {currentRider.is_online && incomingCandidateOrder && !activeOrder && (
            <div className="space-y-3.5 animate-in fade-in">
              
              {/* Header: Incoming Order Alert + Countdown Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Zone Dispatch: {currentRider.zone}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>{orderCountdown}s left</span>
                </div>
              </div>

              {/* Order Code & Restaurant Pickup */}
              <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-orange-700 uppercase block">1. Pickup Restaurant</span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {candidateVendor?.name || 'Restaurant Partner'}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {candidateVendor?.address || 'Chattogram'}
                    </p>
                  </div>
                  <span className="text-xs font-black text-orange-600 bg-white px-2.5 py-1 rounded-xl border border-orange-200 shrink-0 font-mono shadow-xs">
                    {distanceToVendorKm} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-200/60">
                  <span className="text-slate-600 font-bold flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-orange-600" />
                    <span>{candidateVendor?.phone || 'Phone'}</span>
                  </span>
                  <a
                    href={`tel:${candidateVendor?.phone}`}
                    className="text-[11px] font-bold text-orange-700 underline"
                  >
                    Call Vendor
                  </a>
                </div>
              </div>

              {/* Customer Drop-off Target */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase block">2. Deliver to Customer</span>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {incomingCandidateOrder.customer_name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {incomingCandidateOrder.delivery_address}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0 font-mono">
                    {incomingCandidateOrder.delivery_distance_km.toFixed(2)} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{incomingCandidateOrder.customer_phone}</span>
                  </span>
                  <a
                    href={`tel:${incomingCandidateOrder.customer_phone}`}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Call Customer
                  </a>
                </div>
              </div>

              {/* COD Financial Breakdown */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Food Price (Pay Restaurant in cash):</span>
                  <span className="font-mono font-bold text-rose-600">
                    ৳{incomingCandidateOrder.food_total}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Delivery Charge (Your earning):</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +৳{incomingCandidateOrder.delivery_fee}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Total Cash to Collect from Customer:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    ৳{incomingCandidateOrder.total_cash_payable}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-amber-200 flex justify-between font-black text-slate-900 text-sm">
                  <span>Pay to Vendor:</span>
                  <span className="font-mono text-rose-600">
                    ৳{incomingCandidateOrder.food_total}
                  </span>
                </div>
              </div>

              {/* Accept & Reject Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Reject Button */}
                <button
                  onClick={() => handleRejectOrder(incomingCandidateOrder.id)}
                  className="w-full py-3.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-300 font-extrabold text-xs rounded-2xl transition cursor-pointer active:scale-95 flex items-center justify-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                {/* Accept Button */}
                <button
                  onClick={() => handleAcceptOrder(incomingCandidateOrder.id)}
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
                    <Radio className="w-5 h-5" />
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
        SIDE NAVIGATION DRAWER (100% Matching Screenshot_20261001_124714_pandarider.jpg)
        ========================================================================
      */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex animate-in fade-in">
          <div className="w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto select-none">
            
            <div className="space-y-6">
              {/* Pink / Rose Curve Header */}
              <div className="bg-rose-600 text-white p-6 pt-8 rounded-b-[2.5rem] shadow-md relative">
                <button 
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1 pr-6">
                  <h2 className="text-2xl font-black leading-tight tracking-tight">
                    Hi, {currentRider.name} 👋
                  </h2>
                  <p className="text-xs text-rose-100 font-medium">
                    {currentRider.phone} &bull; {currentRider.zone}
                  </p>
                </div>
              </div>

              {/* 4 Quick Action Cards Grid (Inbox, Schedule, Wallet, Payments) */}
              <div className="px-5 grid grid-cols-2 gap-3">
                {/* Inbox Card */}
                <button 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsInboxOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition flex flex-col justify-between space-y-3 relative group cursor-pointer text-left shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <Mail className="w-6 h-6 text-slate-800 group-hover:text-rose-600 transition" />
                    {riderMessages.filter(m => (m.recipient_rider_id === 'ALL' || m.recipient_rider_id === currentRider.id) && !m.is_read).length > 0 && (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-full shadow-xs">
                        +{riderMessages.filter(m => (m.recipient_rider_id === 'ALL' || m.recipient_rider_id === currentRider.id) && !m.is_read).length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition">
                    Inbox
                  </span>
                </button>

                {/* Schedule / Orders Card */}
                <button 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsOrdersListOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition flex flex-col justify-between space-y-3 group cursor-pointer text-left shadow-2xs"
                >
                  <Clock className="w-6 h-6 text-slate-800 group-hover:text-rose-600 transition" />
                  <span className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition">
                    Orders
                  </span>
                </button>

                {/* Wallet Card */}
                <button 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsCashoutModalOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition flex flex-col justify-between space-y-3 group cursor-pointer text-left shadow-2xs"
                >
                  <Wallet className="w-6 h-6 text-slate-800 group-hover:text-rose-600 transition" />
                  <span className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition">
                    Wallet (৳{currentRider.cash_in_hand})
                  </span>
                </button>

                {/* Payments Card */}
                <button 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsCashoutModalOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition flex flex-col justify-between space-y-3 group cursor-pointer text-left shadow-2xs"
                >
                  <Banknote className="w-6 h-6 text-slate-800 group-hover:text-rose-600 transition" />
                  <span className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition">
                    Payments
                  </span>
                </button>
              </div>

              {/* Vertical Menu Options List */}
              <div className="px-5 space-y-1 divide-y divide-slate-100 border-t border-slate-100 pt-2 text-sm font-bold text-slate-800">
                
                {/* My Profile */}
                <div 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                  }}
                  className="py-3.5 flex items-center space-x-3.5 cursor-pointer hover:text-rose-600 group"
                >
                  <User className="w-5 h-5 text-slate-700 group-hover:text-rose-600" />
                  <span>My profile</span>
                </div>

                {/* Orders List */}
                <div 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsOrdersListOpen(true);
                  }}
                  className="py-3.5 flex items-center space-x-3.5 cursor-pointer hover:text-rose-600 group"
                >
                  <Calendar className="w-5 h-5 text-slate-700 group-hover:text-rose-600" />
                  <span>Orders list</span>
                </div>

                {/* Inbox Messages */}
                <div 
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    setIsInboxOpen(true);
                  }}
                  className="py-3.5 flex items-center justify-between cursor-pointer hover:text-rose-600 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Mail className="w-5 h-5 text-slate-700 group-hover:text-rose-600" />
                    <span>Inbox / Admin Messages</span>
                  </div>
                  {riderMessages.filter(m => (m.recipient_rider_id === 'ALL' || m.recipient_rider_id === currentRider.id) && !m.is_read).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  )}
                </div>

                {/* Active Rider Switcher */}
                <div className="py-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 block">Switch Active Rider Profile:</span>
                  <select
                    value={currentRider.id}
                    onChange={(e) => {
                      const r = riders.find((x) => x.id === e.target.value);
                      if (r) setCurrentRider(r);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50 rounded-xl"
                  >
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.vehicle_type}) - ৳{r.cash_in_hand} Float
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settings and privacy */}
                <div className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <Settings className="w-5 h-5 text-slate-700" />
                      <span>Sound Chime</span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(prev => !prev)}
                      className={`p-1.5 rounded-lg text-xs font-bold ${
                        soundEnabled ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Simulator buttons */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location Simulator:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateRiderLocation(currentRider.id, 22.3600, 91.8250);
                          handleRecenter();
                        }}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                      >
                        Nasirabad (In Zone)
                      </button>
                      <button
                        onClick={() => {
                          updateRiderLocation(currentRider.id, 22.4200, 91.7800);
                          handleRecenter();
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                      >
                        Out of Zone
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Footer / Logout */}
            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => {
                  logoutUser();
                  setIsMenuDrawerOpen(false);
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: RIDER INBOX (ADMIN MESSAGES & BROADCAST NOTICES)
        ========================================================================
      */}
      {isInboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Rider Inbox</h3>
                  <p className="text-[11px] text-slate-500">Official Admin & Operations Messages</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInboxOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {riderMessages.filter(m => m.recipient_rider_id === 'ALL' || m.recipient_rider_id === currentRider.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No messages in your inbox yet.
                </div>
              ) : (
                riderMessages
                  .filter(m => m.recipient_rider_id === 'ALL' || m.recipient_rider_id === currentRider.id)
                  .map((msg) => (
                    <div 
                      key={msg.id}
                      onClick={() => markRiderMessageAsRead(msg.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                        msg.is_read 
                          ? 'bg-white border-slate-200' 
                          : 'bg-rose-50/60 border-rose-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                          {msg.sender || 'Admin'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900">{msg.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{msg.body}</p>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsInboxOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-xs"
              >
                Close Inbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: RIDER ORDERS LIST
        ========================================================================
      */}
      {isOrdersListOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Your Delivery Orders</h3>
                  <p className="text-[11px] text-slate-500">Assigned & Completed Cash Orders</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOrdersListOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {orders.filter(o => o.rider_id === currentRider.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No orders assigned to you yet. Stay Online to receive cash order dispatches!
                </div>
              ) : (
                orders
                  .filter(o => o.rider_id === currentRider.id)
                  .map((ord) => {
                    const vend = vendors.find(v => v.id === ord.vendor_id);
                    return (
                      <div key={ord.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-black text-rose-600">{ord.order_code}</span>
                            <h5 className="font-extrabold text-slate-900">{vend?.name || 'Restaurant'}</h5>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="text-slate-600 space-y-0.5">
                          <p><span className="font-bold text-slate-800">Customer:</span> {ord.customer_name} ({ord.customer_phone})</p>
                          <p><span className="font-bold text-slate-800">Address:</span> {ord.delivery_address}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-mono font-black text-slate-900">
                          <span>COD Collect Total:</span>
                          <span className="text-emerald-600 text-sm">৳{ord.total_cash_payable}</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsOrdersListOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-xs"
              >
                Close Orders List
              </button>
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

      {/* Rider Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          targetRole="rider"
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

    </div>
  );
};
