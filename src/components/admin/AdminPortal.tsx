import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { DELIVERY_ZONES, DeliveryZone } from '../../types/database';
import { 
  ShieldCheck, 
  Settings, 
  Store, 
  Bike, 
  ClipboardList, 
  Database, 
  MapPin, 
  Plus, 
  Check, 
  Radio, 
  Banknote,
  Search,
  ExternalLink,
  Layers,
  Phone,
  KeyRound,
  UserCheck,
  UserX,
  Compass,
  Sparkles,
  ChefHat
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    vendors, 
    adminRegisterVendor,
    updateVendor, 
    riders, 
    adminRegisterRider,
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
  const [vCuisine, setVCuisine] = useState('Biryani, Bengali, Mughlai');
  const [vPhone, setVPhone] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vZone, setVZone] = useState<string>('Chawkbazar Zone');
  const [vLat, setVLat] = useState(22.3585);
  const [vLng, setVLng] = useState(91.8385);
  const [isVendorMapPickerOpen, setIsVendorMapPickerOpen] = useState(false);

  // New Rider Form
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);
  const [rName, setRName] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rPhotoUrl, setRPhotoUrl] = useState('');
  const [rHomeAddress, setRHomeAddress] = useState('');
  const [rZone, setRZone] = useState<string>('Chawkbazar Zone');
  const [rVehicle, setRVehicle] = useState<'Motorcycle' | 'Bicycle' | 'Scooter'>('Motorcycle');
  const [rLat, setRLat] = useState(22.3590);
  const [rLng, setRLng] = useState(91.8380);
  const [isRiderMapPickerOpen, setIsRiderMapPickerOpen] = useState(false);

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

  const handleRegisterVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vPhone.trim() || !vAddress.trim()) {
      alert('Please enter restaurant name, phone number, and address.');
      return;
    }

    adminRegisterVendor({
      name: vName.trim(),
      phone: vPhone.trim(),
      address: vAddress.trim(),
      cuisine: vCuisine.trim(),
      zone: vZone,
      latitude: vLat,
      longitude: vLng,
    });

    setIsAddVendorOpen(false);
    setVName('');
    setVPhone('');
    setVAddress('');
    alert(`Vendor "${vName}" registered successfully! The vendor can now login using phone ${vPhone}.`);
  };

  const handleRegisterRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim() || !rPhone.trim()) {
      alert('Please enter rider name and phone number.');
      return;
    }

    adminRegisterRider({
      name: rName.trim(),
      phone: rPhone.trim(),
      photo_url: rPhotoUrl.trim() || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      home_address: rHomeAddress.trim() || 'Chittagong',
      zone: rZone,
      vehicle_type: rVehicle,
      latitude: rLat,
      longitude: rLng,
    });

    setIsAddRiderOpen(false);
    setRName('');
    setRPhone('');
    setRPhotoUrl('');
    setRHomeAddress('');
    alert(`Rider "${rName}" registered successfully in ${rZone}! The rider can now login using phone ${rPhone}.`);
  };

  // Map markers for central radar
  const allMarkers = [
    ...vendors.map((v) => ({
      id: v.id,
      latitude: v.latitude,
      longitude: v.longitude,
      title: `${v.name} (${v.zone || 'Zone'})`,
      subtitle: `${v.cuisine} • ${v.phone}`,
      type: 'vendor' as const,
    })),
    ...riders.map((r) => ({
      id: r.id,
      latitude: r.current_latitude,
      longitude: r.current_longitude,
      title: `Rider: ${r.name} (${r.is_online ? 'ONLINE' : 'OFFLINE'})`,
      subtitle: `${r.zone} • ${r.vehicle_type} • ${r.phone}`,
      type: 'rider' as const,
    })),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 select-none antialiased">
      
      {/* 
        ========================================================================
        1. ADMIN TOP BAR & NAVIGATION (Bright, Clean White Theme)
        ========================================================================
      */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg">FoodVibe Admin Portal</h1>
              <p className="text-xs text-slate-500">Register Vendors & Riders • Set Zones & Pin Points • Distance-based Rates</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Rates & Radius</span>
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'vendors' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Vendors ({vendors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'riders' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Riders ({riders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Live Orders ({orders.length})</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* 
          ======================================================================
          TAB 1: SETTINGS (DISTANCE FEES & DISPATCH RADIUS)
          ======================================================================
        */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <Banknote className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Delivery Fee Configuration</h3>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Base Delivery Fee (First 0-1 KM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      step="1"
                      value={baseCharge}
                      onChange={(e) => setBaseCharge(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Fixed minimum charge for every order</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Per KM Charge (After Base Distance)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      step="1"
                      value={perKmCharge}
                      onChange={(e) => setPerKmCharge(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Added per kilometer calculated from vendor pin to customer pin</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Rider Proximity Dispatch Radius (KM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">📍</span>
                    <input
                      type="number"
                      step="0.1"
                      value={riderRadius}
                      onChange={(e) => setRiderRadius(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Riders within this radius of the restaurant will receive the order</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Save Global Rates
                </button>
              </form>
            </div>

            {/* Live Map Radar */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-rose-600" />
                  <h3 className="font-black text-slate-900 text-base">Fleet & Vendor Live Radar (Chattogram)</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {vendors.length} Vendors • {riders.filter(r => r.is_online).length} Riders Online
                </span>
              </div>

              <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
                <InteractiveMap
                  center={[22.3590, 91.8280]}
                  zoom={14}
                  heightClass="h-full"
                  markers={allMarkers}
                />
              </div>
            </div>

          </div>
        )}

        {/* 
          ======================================================================
          TAB 2: VENDORS REGISTRATION & MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Store className="w-5 h-5 text-orange-500" />
                  <span>Registered Restaurant Partners ({vendors.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin registers vendor with exact pin point & zone. Vendor logs in with registered phone.
                </p>
              </div>

              <button
                onClick={() => setIsAddVendorOpen(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-rose-600/30 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Register New Vendor</span>
              </button>
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3.5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-rose-600 uppercase">
                          ID: {v.id.slice(0, 12)}...
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">{v.name}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        {v.zone || 'Zone Not Set'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">{v.cuisine}</p>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex items-center space-x-2 text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold">{v.phone}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-slate-600 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{v.address}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 pt-1">
                        Pin: Lat {v.latitude.toFixed(4)}, Lng {v.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      {v.is_password_set ? (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Password Set</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] flex items-center space-x-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Awaiting 1st Login</span>
                        </span>
                      )}
                    </div>
                    <a
                      href={`./orders.html`}
                      className="text-rose-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Open Orders</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 3: RIDERS REGISTRATION & MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Bike className="w-5 h-5 text-pink-500" />
                  <span>Registered Delivery Riders ({riders.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin registers rider with Zone & home pin point. Rider sets password on 1st login and toggles GPS online.
                </p>
              </div>

              <button
                onClick={() => setIsAddRiderOpen(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-rose-600/30 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Register New Rider</span>
              </button>
            </div>

            {/* Riders Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {riders.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3.5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={r.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                          alt={r.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <h4 className="text-base font-black text-slate-900">{r.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">ID: {r.id.slice(0, 10)}</span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.is_online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-800">
                        <span className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold">{r.phone}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {r.zone}
                        </span>
                      </div>

                      <div className="flex items-start space-x-1.5 text-slate-600 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{r.home_address || 'Chittagong'}</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                        <span>Float Cash Held:</span>
                        <span className="font-mono font-bold text-slate-900">৳{r.cash_in_hand}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      {r.is_password_set ? (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Password Set</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] flex items-center space-x-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Awaiting 1st Login</span>
                        </span>
                      )}
                    </div>
                    <a
                      href={`./rider.html`}
                      className="text-pink-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Open Rider App</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 4: LIVE ORDERS MONITOR
          ======================================================================
        */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-rose-600" />
              <span>All Active & Historical Orders ({orders.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Order Code</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Vendor / Zone</th>
                    <th className="py-3 px-3">Distance / Fee</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Assigned Rider</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((o) => {
                    const v = vendors.find(item => item.id === o.vendor_id);
                    const r = riders.find(item => item.id === o.rider_id);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-rose-600">{o.order_code}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{o.customer_name}</p>
                          <p className="text-[10px] text-slate-500">{o.customer_phone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{v?.name || 'Restaurant'}</p>
                          <p className="text-[10px] text-orange-600 font-medium">{o.zone || v?.zone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{o.delivery_distance_km.toFixed(2)} km</p>
                          <p className="text-[10px] text-slate-500">৳{o.delivery_fee} delivery</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                          ৳{o.total_cash_payable}
                        </td>
                        <td className="py-3 px-3">
                          {r ? (
                            <span className="font-bold text-pink-600">🛵 {r.name}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Searching in zone...</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            o.status === 'pending' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            o.status === 'food_preparing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
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

      </main>

      {/* 
        ========================================================================
        MODAL 1: REGISTER VENDOR (WITH LEAFLET PIN POINT PICKER)
        ========================================================================
      */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Store className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Register New Restaurant Partner</h3>
              </div>
              <button
                onClick={() => setIsAddVendorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVendorSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    placeholder="e.g. Handi Restaurant"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Vendor Login Phone Number *
                  </label>
                  <input
                    type="text"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    placeholder="01711000000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Cuisine / Category
                  </label>
                  <input
                    type="text"
                    value={vCuisine}
                    onChange={(e) => setVCuisine(e.target.value)}
                    placeholder="Fast Food, Burgers, Desi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Assigned Zone *
                  </label>
                  <select
                    value={vZone}
                    onChange={(e) => setVZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  >
                    {DELIVERY_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  placeholder="e.g. CDA Avenue, GEC Circle, Chittagong"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  required
                />
              </div>

              {/* Map Pin Point Picker Button */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Map Location Coordinates:</span>
                  <span className="font-mono text-[11px] text-rose-600 font-bold">
                    Lat: {vLat.toFixed(5)}, Lng: {vLng.toFixed(5)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVendorMapPickerOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-600 border border-slate-200 font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                >
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Pick Map Pin</span>
                </button>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Save & Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: REGISTER RIDER (WITH LEAFLET PIN POINT PICKER)
        ========================================================================
      */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Bike className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Register New Delivery Rider</h3>
              </div>
              <button
                onClick={() => setIsAddRiderOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterRiderSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Rider Full Name *
                  </label>
                  <input
                    type="text"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    placeholder="e.g. Shaon Das"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Rider Login Phone *
                  </label>
                  <input
                    type="text"
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    placeholder="01755000000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Assigned Zone *
                  </label>
                  <select
                    value={rZone}
                    onChange={(e) => setRZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  >
                    {DELIVERY_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                    Vehicle Type
                  </label>
                  <select
                    value={rVehicle}
                    onChange={(e) => setRVehicle(e.target.value as 'Motorcycle' | 'Bicycle' | 'Scooter')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                  Home Address
                </label>
                <input
                  type="text"
                  value={rHomeAddress}
                  onChange={(e) => setRHomeAddress(e.target.value)}
                  placeholder="e.g. Chawkbazar, Chittagong"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                  Photo URL (Optional)
                </label>
                <input
                  type="text"
                  value={rPhotoUrl}
                  onChange={(e) => setRPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Map Pin Point Picker Button */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Home Pin Point Location:</span>
                  <span className="font-mono text-[11px] text-rose-600 font-bold">
                    Lat: {rLat.toFixed(5)}, Lng: {rLng.toFixed(5)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRiderMapPickerOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-600 border border-slate-200 font-bold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                >
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Pick Map Pin</span>
                </button>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddRiderOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Save & Register Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal for Vendor */}
      {isVendorMapPickerOpen && (
        <LocationPickerModal
          title="Pick Restaurant Location Pin Point"
          subtitle="Click or drag pin to set exact coordinates for delivery charge calculations"
          initialLat={vLat}
          initialLng={vLng}
          initialZone={vZone}
          onConfirm={(lat, lng, zone) => {
            setVLat(lat);
            setVLng(lng);
            setVZone(zone);
          }}
          onClose={() => setIsVendorMapPickerOpen(false)}
        />
      )}

      {/* Map Picker Modal for Rider */}
      {isRiderMapPickerOpen && (
        <LocationPickerModal
          title="Pick Rider Base Pin Point"
          subtitle="Click or drag pin to set rider home location"
          initialLat={rLat}
          initialLng={rLng}
          initialZone={rZone}
          onConfirm={(lat, lng, zone) => {
            setRLat(lat);
            setRLng(lng);
            setRZone(zone);
          }}
          onClose={() => setIsRiderMapPickerOpen(false)}
        />
      )}

    </div>
  );
};
