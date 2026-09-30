import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { parseGoogleMapsLinkOrCoords } from '../../utils/geo';
import { Vendor } from '../../types/database';
import { 
  ShieldCheck, 
  Settings, 
  Store, 
  Bike, 
  ClipboardList, 
  Database, 
  MapPin, 
  Plus, 
  Copy, 
  Check, 
  Radio, 
  Banknote,
  Search,
  ExternalLink,
  Layers
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    vendors, 
    addVendor, 
    updateVendor, 
    riders, 
    orders,
    menuItems 
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'settings' | 'vendors' | 'riders' | 'orders' | 'database'>('settings');

  // Settings form state
  const [perKmCharge, setPerKmCharge] = useState(settings.per_km_delivery_charge);
  const [baseCharge, setBaseCharge] = useState(settings.base_delivery_charge);
  const [riderRadius, setRiderRadius] = useState(settings.rider_match_radius_km);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New Vendor Form
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vName, setVName] = useState('');
  const [vCuisine, setVCuisine] = useState('Biryani, Bengali');
  const [vPhone, setVPhone] = useState('+8801700112233');
  const [vAddress, setVAddress] = useState('');
  const [vMapInput, setVMapInput] = useState('');
  const [vLat, setVLat] = useState(23.7937);
  const [vLng, setVLng] = useState(90.4049);
  const [vCoverImage, setVCoverImage] = useState('');

  // SQL Copy feedback
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      per_km_delivery_charge: Number(perKmCharge),
      base_delivery_charge: Number(baseCharge),
      rider_match_radius_km: Number(riderRadius),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleParseMapLink = () => {
    if (!vMapInput.trim()) return;
    const parsed = parseGoogleMapsLinkOrCoords(vMapInput);
    if (parsed) {
      setVLat(parsed.lat);
      setVLng(parsed.lng);
      alert(`Successfully parsed coordinates: Lat ${parsed.lat.toFixed(5)}, Lng ${parsed.lng.toFixed(5)}`);
    } else {
      alert('Could not parse coordinates. Format can be "23.7937, 90.4049" or a Google Maps URL containing ?q= or @lat,lng');
    }
  };

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vAddress.trim()) return;

    addVendor({
      name: vName.trim(),
      cuisine: vCuisine.trim(),
      phone: vPhone.trim(),
      address: vAddress.trim(),
      latitude: vLat,
      longitude: vLng,
      google_maps_link: vMapInput.trim() || `https://maps.google.com/?q=${vLat},${vLng}`,
      is_active: true,
      rating: 4.8,
      estimated_prep_time_minutes: 20,
      cover_image: vCoverImage.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    });

    setIsAddVendorOpen(false);
    setVName('');
    setVAddress('');
    setVMapInput('');
  };

  // SQL Schema Script for display & copy
  const sqlScript = `-- ====================================================================
-- FOODVIBE / CASH ON DELIVERY MULTI-PORTAL FOOD DELIVERY SYSTEM
-- SUPABASE POSTGRESQL INITIAL MIGRATION SCRIPT (001_initial_schema.sql)
-- Features: 
-- 1. Customer, Vendor, Rider, Admin Roles
-- 2. Customer Address Book with Lat/Lng Map Points
-- 3. Vendor Registration with exact Coordinates
-- 4. Haversine Distance & Dynamic Per-KM Delivery Fee Calculation
-- 5. Rider Live 5-Second Location Tracking & Cash In Hand Floating Balance
-- 6. Configurable Proximity Radius Dispatch (e.g. 1 km from restaurant)
-- 7. Full Cash-On-Delivery Lifecycle (Rider pays vendor -> collects from customer)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    per_km_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    base_delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    rider_match_radius_km NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '৳',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image TEXT,
    cuisine VARCHAR(100) DEFAULT 'Fast Food, Biryani',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    google_maps_link TEXT,
    is_active BOOLEAN DEFAULT true,
    rating NUMERIC(2, 1) DEFAULT 4.5,
    estimated_prep_time_minutes INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'Main Course',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    label VARCHAR(50) DEFAULT 'Home',
    address_line TEXT NOT NULL,
    details TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
    is_online BOOLEAN DEFAULT false,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    last_location_updated_at TIMESTAMP WITH TIME ZONE,
    cash_in_hand NUMERIC(10, 2) DEFAULT 0.00,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    rider_id UUID REFERENCES public.riders(id),
    delivery_address TEXT NOT NULL,
    delivery_latitude DOUBLE PRECISION NOT NULL,
    delivery_longitude DOUBLE PRECISION NOT NULL,
    food_total NUMERIC(10, 2) NOT NULL,
    delivery_distance_km NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL,
    total_cash_payable NUMERIC(10, 2) NOT NULL,
    food_cash_paid_to_vendor BOOLEAN DEFAULT false,
    food_and_delivery_cash_collected_from_customer BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(10, 2) NOT NULL
);

CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371;
    dlat DOUBLE PRECISION := radians(lat2 - lat1);
    dlon DOUBLE PRECISION := radians(lon2 - lon1);
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)^2;
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    RETURN ROUND((r * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Fleet map markers
  const fleetMarkers = [
    ...vendors.map((v) => ({
      id: `v-${v.id}`,
      latitude: v.latitude,
      longitude: v.longitude,
      title: `Store: ${v.name}`,
      subtitle: `${v.cuisine} &bull; ${v.address}`,
      type: 'vendor' as const,
    })),
    ...riders.map((r) => ({
      id: `r-${r.id}`,
      latitude: r.current_latitude,
      longitude: r.current_longitude,
      title: `Rider: ${r.name} (${r.is_online ? 'ONLINE' : 'OFFLINE'})`,
      subtitle: `${r.vehicle_type} &bull; Float: ${settings.currency_symbol}${r.cash_in_hand}`,
      type: 'rider' as const,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-base">Central Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Configure Per-KM Delivery Charges, Dispatch Radius & Vendor Locations</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Rate & Radius Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'vendors' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendors ({vendors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'riders' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Fleet Live Radar</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>All Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'database' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Supabase SQL Migration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Delivery Pricing & Proximity Rules</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust per-kilometer delivery charges and configure the strict rider dispatch radius around restaurants.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Configuration saved! Applied instantly across Customer, Vendor, and Rider sites.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Per KM Delivery Charge ({settings.currency_symbol})
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Added for every kilometer calculated between vendor pin and customer delivery pin.
                    </p>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-bold">{settings.currency_symbol}</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        required
                        value={perKmCharge}
                        onChange={(e) => setPerKmCharge(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Base Delivery Charge ({settings.currency_symbol})
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Minimum threshold delivery fee applied for first kilometer.
                    </p>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-bold">{settings.currency_symbol}</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={baseCharge}
                        onChange={(e) => setBaseCharge(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rider Dispatch Radius Requirement */}
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                        Rider Proximity Dispatch Radius (Current: {riderRadius} km)
                      </label>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Only riders whose live 5-second GPS is inside this radius from the restaurant will receive incoming orders!
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold rounded-lg text-sm">
                      {riderRadius} KM
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.3"
                    max="5.0"
                    step="0.1"
                    value={riderRadius}
                    onChange={(e) => setRiderRadius(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-indigo-700 font-mono">
                    <span>0.3 km (Strict Local)</span>
                    <span className="font-bold">1.0 km (Prompt Specification)</span>
                    <span>5.0 km (Wide Metro)</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Save & Enforce System Rules
                  </button>
                </div>
              </form>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-gray-900">Sample Dynamic Fee Calculation</h4>
              <p className="text-xs text-gray-500">
                Formula verified on every customer checkout:
              </p>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-700">
                  <span>If Distance = 0.8 km (Under 1 km):</span>
                  <span className="font-bold text-gray-900">{settings.currency_symbol}{baseCharge}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>If Distance = 2.5 km:</span>
                  <span className="font-bold text-gray-900">
                    {settings.currency_symbol}{baseCharge} + (1.5 &times; {settings.currency_symbol}{perKmCharge}) = {settings.currency_symbol}{Math.round(baseCharge + 1.5 * perKmCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>If Distance = 4.0 km:</span>
                  <span className="font-bold text-gray-900">
                    {settings.currency_symbol}{baseCharge} + (3.0 &times; {settings.currency_symbol}{perKmCharge}) = {settings.currency_symbol}{Math.round(baseCharge + 3.0 * perKmCharge)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Banknote className="w-4 h-4 text-amber-600" /> Pure Cash On Delivery Protocol
                </p>
                <p className="text-[11px] text-amber-800">
                  Customer pays (Food Bill + Delivery Fee) in cash to the rider at delivery. The rider has previously paid the Food Bill amount in cash to the vendor. The net remaining cash is the rider's delivery profit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vendor Management & Pin Link Setting */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Registered Restaurants & Vendors</h3>
                <p className="text-xs text-gray-500">
                  Set exact Google Maps pin coordinates via map click or Google Maps link parser
                </p>
              </div>
              <button
                onClick={() => setIsAddVendorOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Vendor</span>
              </button>
            </div>

            {/* Add Vendor Modal */}
            {isAddVendorOpen && (
              <div className="bg-white rounded-2xl border-2 border-indigo-300 p-6 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Register Vendor & Pin Exact Location</h4>
                    <p className="text-xs text-gray-500">Provide Google Maps link or click on map to set coordinates</p>
                  </div>
                  <button onClick={() => setIsAddVendorOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                    &times;
                  </button>
                </div>

                <form onSubmit={handleRegisterVendor} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        required
                        value={vName}
                        onChange={(e) => setVName(e.target.value)}
                        placeholder="e.g. Sultan's Dine - Dhanmondi"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Cuisine / Category</label>
                      <input
                        type="text"
                        value={vCuisine}
                        onChange={(e) => setVCuisine(e.target.value)}
                        placeholder="Kacchi Biryani, Kebab"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={vPhone}
                        onChange={(e) => setVPhone(e.target.value)}
                        placeholder="+8801700..."
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      required
                      value={vAddress}
                      onChange={(e) => setVAddress(e.target.value)}
                      placeholder="e.g. House 54, Road 10/A, Dhanmondi, Dhaka"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Google Map Link / Coords Parser */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-indigo-950">
                      Google Maps Pin Link or Coordinates
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vMapInput}
                        onChange={(e) => setVMapInput(e.target.value)}
                        placeholder="Paste link: https://maps.google.com/?q=23.7937,90.4049 or 23.7937, 90.4049"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleParseMapLink}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Parse Coordinates
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-[11px] text-indigo-800 font-mono">
                      <span>Current Lat: <strong>{vLat.toFixed(5)}</strong></span>
                      <span>Current Lng: <strong>{vLng.toFixed(5)}</strong></span>
                    </div>
                  </div>

                  {/* Interactive Map Picker */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Or click directly on map to position vendor marker:</p>
                    <InteractiveMap
                      center={[vLat, vLng]}
                      zoom={14}
                      markers={[
                        {
                          id: 'new-v-pin',
                          latitude: vLat,
                          longitude: vLng,
                          title: vName || 'New Restaurant Pin',
                          subtitle: `${vLat.toFixed(4)}, ${vLng.toFixed(4)}`,
                          type: 'vendor',
                          isDraggable: true,
                        },
                      ]}
                      onMapClick={(lat, lng) => {
                        setVLat(lat);
                        setVLng(lng);
                      }}
                      onMarkerDragEnd={(_, lat, lng) => {
                        setVLat(lat);
                        setVLng(lng);
                      }}
                      heightClass="h-56"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddVendorOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Register & Save Location
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Existing Vendors List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <div className="h-32 bg-gray-100 relative">
                    <img src={v.cover_image} alt={v.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {v.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{v.name}</h4>
                      <p className="text-xs text-gray-500">{v.cuisine}</p>
                      <p className="text-xs text-gray-700 mt-1 line-clamp-1">{v.address}</p>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-xl text-xs font-mono space-y-0.5">
                      <div className="flex justify-between text-gray-600">
                        <span>Coordinates:</span>
                        <span>{v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Contact:</span>
                        <span>{v.phone}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <a
                        href={v.google_maps_link || `https://maps.google.com/?q=${v.latitude},${v.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Google Maps</span>
                      </a>
                      <button
                        onClick={() => updateVendor(v.id, { is_active: !v.is_active })}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          v.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {v.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Fleet Live Radar */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Rider Fleet & Live 5-Second GPS Map</h3>
              <p className="text-xs text-gray-500">
                Visualizing all riders, registered restaurants, and the {settings.rider_match_radius_km} km proximity dispatch zone
              </p>
            </div>

            {/* Map with Dispatch Zone Circles */}
            <div className="space-y-2">
              <InteractiveMap
                center={[vendors[0]?.latitude || 23.7937, vendors[0]?.longitude || 90.4049]}
                zoom={14}
                markers={fleetMarkers}
                radiusCircle={{
                  center: [vendors[0]?.latitude || 23.7937, vendors[0]?.longitude || 90.4049],
                  radiusMeters: settings.rider_match_radius_km * 1000,
                  label: `${settings.rider_match_radius_km} km Proximity Dispatch Radius`,
                  color: '#4f46e5',
                }}
                heightClass="h-96"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Riders Fleet Ledger</span>
                <span className="text-xs text-gray-500 font-mono">
                  {riders.filter((r) => r.is_online).length} of {riders.length} Online
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Rider</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Live Coordinates (5s)</th>
                      <th className="py-2.5 px-4">Vehicle</th>
                      <th className="py-2.5 px-4">Floating Cash In Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {riders.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-[11px] text-gray-400">{r.phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {r.is_online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {r.current_latitude.toFixed(5)}, {r.current_longitude.toFixed(5)}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-700">{r.vehicle_type}</td>
                        <td className="py-3 px-4 font-bold font-mono text-gray-900">
                          {settings.currency_symbol}{r.cash_in_hand}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: All Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-4 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">System-Wide Orders & COD Transactions</h3>
                <p className="text-xs text-gray-500">Live oversight of order progress and cash collection</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Restaurant</th>
                    <th className="py-2.5 px-3">Distance & Fee</th>
                    <th className="py-2.5 px-3">Total Cash (COD)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => {
                    const v = vendors.find((x) => x.id === o.vendor_id);
                    return (
                      <tr key={o.id}>
                        <td className="py-2.5 px-3 font-bold text-gray-900">#{o.order_code}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-gray-800">{o.customer_name}</p>
                          <p className="text-[11px] text-gray-400">{o.customer_phone}</p>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">{v?.name}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {o.delivery_distance_km} km ({settings.currency_symbol}{o.delivery_fee})
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-rose-600">
                          {settings.currency_symbol}{o.total_cash_payable}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 uppercase">
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Supabase SQL Migration Script Viewer */}
        {activeTab === 'database' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>Supabase SQL Migration Script (001_initial_schema.sql)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pre-configured PostgreSQL schema file located in <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">/supabase/migrations/001_initial_schema.sql</code>
                </p>
              </div>

              <button
                onClick={copySql}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'SQL Copied to Clipboard!' : 'Copy SQL Migration'}</span>
              </button>
            </div>

            {/* Instruction cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" /> How to apply to Supabase
                </span>
                <ol className="list-decimal list-inside space-y-1 text-indigo-800">
                  <li>Go to your Supabase Project Dashboard &rarr; <strong>SQL Editor</strong>.</li>
                  <li>Click <strong>New query</strong> and paste this exact script.</li>
                  <li>Click <strong>Run</strong> to create tables, distance functions, and policies.</li>
                  <li>Add your project URL & Anon key to <code className="bg-white px-1 py-0.5 rounded">.env</code> or GitHub secrets.</li>
                </ol>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Tables & Columns Included
                </span>
                <p className="text-emerald-800 text-[11px]">
                  Includes <code className="font-mono">system_settings</code> (rates & radius), <code className="font-mono">vendors</code> (lat/lng, maps link), <code className="font-mono">menu_items</code>, <code className="font-mono">customer_addresses</code> (address book), <code className="font-mono">riders</code> (live 5s lat/lng, cash in hand), and <code className="font-mono">orders</code> with Cash on Delivery status.
                </p>
              </div>
            </div>

            {/* Code Block */}
            <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 p-4 font-mono text-[11px] text-gray-200 max-h-96 overflow-y-auto">
              <pre>{sqlScript}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
