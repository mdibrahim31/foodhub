import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { DELIVERY_ZONES, Vendor, Rider } from '../../types/database';
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
  Phone, 
  Search, 
  Pause, 
  Play, 
  Trash2, 
  Eye, 
  X, 
  KeyRound, 
  ChefHat, 
  Mail, 
  ExternalLink,
  Sparkles,
  User,
  Clock,
  Banknote
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    vendors, 
    adminRegisterVendor,
    updateVendor,
    toggleVendorPause,
    deleteVendor, 
    riders, 
    adminRegisterRider,
    toggleRiderPause,
    deleteRider,
    orders,
    foodCategories,
    addFoodCategory,
    updateFoodCategory,
    deleteFoodCategory,
    sendAdminMessage,
    updateOrderStatus
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'vendors' | 'riders' | 'orders' | 'database'>('settings');

  // Search Filters
  const [vendorSearch, setVendorSearch] = useState('');
  const [riderSearch, setRiderSearch] = useState('');

  // Selected for Full Profile Modals
  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState<Vendor | null>(null);
  const [selectedRiderForProfile, setSelectedRiderForProfile] = useState<Rider | null>(null);

  // Send Message Modal State
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [msgRecipientId, setMsgRecipientId] = useState<'ALL' | string>('ALL');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Settings form state
  const [perKmCharge, setPerKmCharge] = useState(settings.per_km_delivery_charge);
  const [baseCharge, setBaseCharge] = useState(settings.base_delivery_charge);
  const [riderRadius, setRiderRadius] = useState(settings.rider_match_radius_km);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New Category Form
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍕');
  const [catImageUrl, setCatImageUrl] = useState('');

  // New Vendor Form
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vName, setVName] = useState('');
  const [vCuisine, setVCuisine] = useState('Fast Food, Biryani, Burgers');
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
      per_km_delivery_charge: perKmCharge,
      base_delivery_charge: baseCharge,
      rider_match_radius_km: riderRadius,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) {
      alert('Please fill in message title and message body.');
      return;
    }

    const recipientName = msgRecipientId === 'ALL' 
      ? 'All Riders (Broadcast)' 
      : riders.find(r => r.id === msgRecipientId)?.name || 'Rider';

    sendAdminMessage({
      recipient_rider_id: msgRecipientId,
      sender: 'foodiplace Admin',
      title: msgTitle.trim(),
      body: msgBody.trim()
    });

    setIsSendMessageOpen(false);
    setMsgTitle('');
    setMsgBody('');
    alert(`Message sent to ${recipientName}! It will appear in their Rider App Inbox.`);
  };

  const handleRegisterVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vPhone.trim() || !vAddress.trim()) {
      alert('Please enter restaurant name, phone number, and address.');
      return;
    }

    const created = adminRegisterVendor({
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
    alert(`Vendor "${created.name}" registered! ID: ${created.unique_id || created.id}. Phone: ${created.phone}`);
  };

  const handleRegisterRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim() || !rPhone.trim()) {
      alert('Please enter rider name and phone number.');
      return;
    }

    const created = adminRegisterRider({
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
    setRHomeAddress('');
    alert(`Rider "${created.name}" registered! ID: ${created.unique_id || created.id}. Phone: ${created.phone}`);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Please enter a food category name.');
      return;
    }

    addFoodCategory({
      name: catName.trim(),
      icon: catIcon.trim() || '🍕',
      image_url: catImageUrl.trim() || undefined,
      is_active: true
    });

    setIsAddCategoryOpen(false);
    setCatName('');
    setCatImageUrl('');
  };

  // Filtered lists
  const filteredVendors = vendors.filter(v => {
    const q = vendorSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      (v.unique_id && v.unique_id.toLowerCase().includes(q))
    );
  });

  const filteredRiders = riders.filter(r => {
    const q = riderSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.unique_id && r.unique_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans selection:bg-rose-500 selection:text-white">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-2xl shadow-md text-white">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight bg-linear-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                  foodiplace
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Master Control &bull; Vendors, Riders, Live Orders & Rates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <a
              href="./"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center space-x-1"
            >
              <span>Customer App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Compact Navigation Tabs Bar */}
        <div className="bg-white border border-slate-200/90 p-1.5 rounded-2xl shadow-xs flex items-center justify-between overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Rates & Radius</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Categories ({foodCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'vendors' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Vendors ({vendors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('riders')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'riders' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Riders ({riders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'database' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database</span>
          </button>
        </div>

        {/* 
          ======================================================================
          TAB 1: DELIVERY RATES & RADIUS SETTINGS
          ======================================================================
        */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-rose-600" />
                <span>Delivery Fee & Dispatch Radius Settings</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure distance-based calculation rules applied across the foodiplace customer checkout.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Global settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-700 block">BASE DELIVERY FEE (FIRST 0-1 KM)</label>
                <div className="flex items-center space-x-2">
                  <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono">৳</span>
                  <input
                    type="number"
                    value={baseCharge}
                    onChange={(e) => setBaseCharge(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">PER KM CHARGE (AFTER BASE DISTANCE)</label>
                <div className="flex items-center space-x-2">
                  <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono">৳</span>
                  <input
                    type="number"
                    value={perKmCharge}
                    onChange={(e) => setPerKmCharge(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">RIDER PROXIMITY DISPATCH RADIUS (KM)</label>
                <div className="flex items-center space-x-2">
                  <span className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono">📍</span>
                  <input
                    type="number"
                    step="0.1"
                    value={riderRadius}
                    onChange={(e) => setRiderRadius(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer"
              >
                SAVE GLOBAL RATES
              </button>
            </form>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 2: FOOD CATEGORIES
          ======================================================================
        */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <ChefHat className="w-5 h-5 text-rose-600" />
                  <span>Food Categories Slider ({foodCategories.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage horizontal slider categories shown on top of the customer app home screen.
                </p>
              </div>

              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Food Category</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {foodCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`bg-white border rounded-3xl p-4 flex flex-col items-center text-center justify-between space-y-3 transition shadow-xs hover:shadow-md ${
                    cat.is_active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl shadow-2xs">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-9 h-9 object-contain" />
                    ) : (
                      <span>{cat.icon || '🍽️'}</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{cat.name}</h4>
                    <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                      cat.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-100 w-full justify-center text-[10px] font-bold">
                    <button
                      onClick={() => updateFoodCategory(cat.id, { is_active: !cat.is_active })}
                      className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                      {cat.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          deleteFoodCategory(cat.id);
                        }
                      }}
                      className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 3: VENDORS MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            {/* Header & Controls Bar */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Registered Vendors ({filteredVendors.length} / {vendors.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search by ID, Phone, or Name. Pause or remove vendors at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search ID, phone, name..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                {/* Add Vendor Button */}
                <button
                  onClick={() => setIsAddVendorOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-2xl shadow-md transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Vendor</span>
                </button>
              </div>
            </div>

            {/* Compact Vendors List Table */}
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Unique ID</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Vendor / Restaurant Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          No vendors found matching "{vendorSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono font-black text-[10px] rounded-md border border-rose-200">
                              {v.unique_id || `VND-${v.id.slice(0, 4).toUpperCase()}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900">{v.phone}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{v.name}</td>
                          <td className="py-3 px-4">
                            {v.is_paused ? (
                              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-black text-[10px] rounded-full uppercase">
                                PAUSED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Pause / Resume */}
                              <button
                                onClick={() => toggleVendorPause(v.id)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition ${
                                  v.is_paused 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title={v.is_paused ? 'Resume Vendor' : 'Pause Vendor'}
                              >
                                {v.is_paused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                                <span>{v.is_paused ? 'Resume' : 'Pause'}</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete vendor "${v.name}" (${v.unique_id || v.phone})?`)) {
                                    deleteVendor(v.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                                title="Remove Vendor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* View Full Profile */}
                              <button
                                onClick={() => setSelectedVendorForProfile(v)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 4: RIDERS MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'riders' && (
          <div className="space-y-4">
            {/* Header & Controls Bar */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-pink-100 text-pink-600 rounded-2xl">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Registered Riders ({filteredRiders.length} / {riders.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search by ID, Phone, or Name. Pause or remove riders at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Send Message Button */}
                <button
                  onClick={() => setIsSendMessageOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Notice</span>
                </button>

                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={riderSearch}
                    onChange={(e) => setRiderSearch(e.target.value)}
                    placeholder="Search ID, phone, name..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                {/* Add Rider Button */}
                <button
                  onClick={() => setIsAddRiderOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-2xl shadow-md transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Rider</span>
                </button>
              </div>
            </div>

            {/* Compact Riders List Table */}
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Unique ID</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Rider Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    {filteredRiders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          No riders found matching "{riderSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredRiders.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-pink-50 text-pink-700 font-mono font-black text-[10px] rounded-md border border-pink-200">
                              {r.unique_id || `RDR-${r.id.slice(0, 4).toUpperCase()}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900">{r.phone}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{r.name}</td>
                          <td className="py-3 px-4">
                            {r.is_paused ? (
                              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-black text-[10px] rounded-full uppercase">
                                PAUSED
                              </span>
                            ) : r.is_online ? (
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase">
                                ONLINE
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full uppercase">
                                OFFLINE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Pause / Resume */}
                              <button
                                onClick={() => toggleRiderPause(r.id)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition ${
                                  r.is_paused 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title={r.is_paused ? 'Resume Rider' : 'Pause Rider'}
                              >
                                {r.is_paused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                                <span>{r.is_paused ? 'Resume' : 'Pause'}</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete rider "${r.name}" (${r.unique_id || r.phone})?`)) {
                                    deleteRider(r.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                                title="Remove Rider"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* View Full Profile */}
                              <button
                                onClick={() => setSelectedRiderForProfile(r)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 5: LIVE ORDERS STREAM
          ======================================================================
        */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Live Orders Stream ({orders.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Central dispatch & status tracking across all vendors and riders.
                </p>
              </div>

              <a
                href="./orders.html"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition flex items-center space-x-1"
              >
                <span>Full Kitchen Terminal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs">
                  No orders placed yet in the system.
                </div>
              ) : (
                orders.map((ord) => {
                  const vend = vendors.find(v => v.id === ord.vendor_id);
                  const rid = riders.find(r => r.id === ord.rider_id);
                  return (
                    <div key={ord.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-black text-rose-600 text-sm">{ord.order_code}</span>
                          <h4 className="font-extrabold text-slate-900 text-base">{vend?.name || 'Restaurant'}</h4>
                          <span className="text-slate-400 text-[10px] font-mono">{new Date(ord.created_at).toLocaleString()}</span>
                        </div>

                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Customer:</span>
                          <p className="font-extrabold text-slate-900">{ord.customer_name} ({ord.customer_phone})</p>
                          <p className="text-[11px] text-slate-600">{ord.delivery_address}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Rider:</span>
                          <p className="font-extrabold text-slate-900">{rid ? `${rid.name} (${rid.phone})` : 'Searching Proximity Rider...'}</p>
                          <p className="text-[11px] text-emerald-700 font-mono font-black">COD Collect: ৳{ord.total_cash_payable}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 
          ======================================================================
          TAB 6: DATABASE & BACKUP
          ======================================================================
        */}
        {activeTab === 'database' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Database className="w-5 h-5 text-rose-600" />
                <span>System Database & Local Storage</span>
              </h3>
              <p className="text-xs text-slate-500">
                All foodiplace application state is automatically synced with LocalStorage & ready for Supabase integration.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span>Registered Vendors:</span>
                <span className="font-mono text-slate-900">{vendors.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Registered Riders:</span>
                <span className="font-mono text-slate-900">{riders.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Food Categories:</span>
                <span className="font-mono text-slate-900">{foodCategories.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Orders Recorded:</span>
                <span className="font-mono text-slate-900">{orders.length}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset local storage state to default seed data?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs rounded-2xl transition cursor-pointer"
            >
              Reset Local Storage
            </button>
          </div>
        )}

      </main>

      {/* 
        ========================================================================
        MODAL: FULL VENDOR PROFILE DETAILS
        ========================================================================
      */}
      {selectedVendorForProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-2xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedVendorForProfile.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    ID: {selectedVendorForProfile.unique_id || selectedVendorForProfile.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendorForProfile(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Phone Number</span>
                  <span className="font-mono text-slate-900 text-sm">{selectedVendorForProfile.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Zone</span>
                  <span className="text-rose-600">{selectedVendorForProfile.zone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Cuisine</span>
                  <span className="text-slate-800">{selectedVendorForProfile.cuisine}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Password Status</span>
                  <span className={selectedVendorForProfile.is_password_set ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedVendorForProfile.is_password_set ? 'Password Set' : 'Awaiting 1st Login'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-bold">
                <span className="text-[10px] text-slate-400 uppercase block">Address & Coordinates</span>
                <p className="text-slate-800">{selectedVendorForProfile.address}</p>
                <p className="text-[10px] font-mono text-slate-500">Lat: {selectedVendorForProfile.latitude}, Lng: {selectedVendorForProfile.longitude}</p>
              </div>

              {/* Popular Serial Position Control */}
              <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200 flex items-center justify-between gap-2">
                <span className="font-extrabold text-orange-950">Popular Brands Serial (1-5):</span>
                <select
                  value={selectedVendorForProfile.featured_position || 0}
                  onChange={(e) => {
                    const pos = Number(e.target.value);
                    updateVendor(selectedVendorForProfile.id, { featured_position: pos > 0 ? pos : undefined });
                    setSelectedVendorForProfile(prev => prev ? { ...prev, featured_position: pos > 0 ? pos : undefined } : null);
                  }}
                  className="bg-white border border-orange-300 rounded-xl px-2.5 py-1.5 font-bold text-orange-950 focus:outline-hidden cursor-pointer"
                >
                  <option value={0}>Default (Sorted by Rating)</option>
                  <option value={1}>#1 Serial (Top 1)</option>
                  <option value={2}>#2 Serial (Top 2)</option>
                  <option value={3}>#3 Serial (Top 3)</option>
                  <option value={4}>#4 Serial (Top 4)</option>
                  <option value={5}>#5 Serial (Top 5)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedVendorForProfile(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: FULL RIDER PROFILE DETAILS
        ========================================================================
      */}
      {selectedRiderForProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedRiderForProfile.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                  alt={selectedRiderForProfile.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedRiderForProfile.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                    ID: {selectedRiderForProfile.unique_id || selectedRiderForProfile.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRiderForProfile(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Phone Number</span>
                  <span className="font-mono text-slate-900 text-sm">{selectedRiderForProfile.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Zone</span>
                  <span className="text-pink-600">{selectedRiderForProfile.zone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Vehicle Type</span>
                  <span className="text-slate-800">{selectedRiderForProfile.vehicle_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Float Cash Held</span>
                  <span className="text-emerald-700 font-mono text-sm">৳{selectedRiderForProfile.cash_in_hand}</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Home Base Address</span>
                <p className="text-slate-800">{selectedRiderForProfile.home_address || 'Chittagong'}</p>
                <p className="text-[10px] font-mono text-slate-500">Base Lat: {selectedRiderForProfile.current_latitude}, Lng: {selectedRiderForProfile.current_longitude}</p>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span>Account Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  selectedRiderForProfile.is_paused 
                    ? 'bg-red-100 text-red-800' 
                    : selectedRiderForProfile.is_online 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {selectedRiderForProfile.is_paused ? 'PAUSED BY ADMIN' : selectedRiderForProfile.is_online ? 'ONLINE ON DUTY' : 'OFFLINE'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRiderForProfile(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: REGISTER VENDOR
        ========================================================================
      */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Store className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Register New Vendor Partner</h3>
              </div>
              <button onClick={() => setIsAddVendorOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVendorSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Restaurant / Merchant Name *</label>
                <input
                  type="text"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. Sultan's Dine / Krunch"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Cuisine Specialties</label>
                <input
                  type="text"
                  value={vCuisine}
                  onChange={(e) => setVCuisine(e.target.value)}
                  placeholder="e.g. Biryani, Fast Food, Bakery"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Login Phone Number *</label>
                <input
                  type="tel"
                  value={vPhone}
                  onChange={(e) => setVPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Operating Delivery Zone *</label>
                <select
                  value={vZone}
                  onChange={(e) => setVZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {DELIVERY_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Physical Street Address *</label>
                <input
                  type="text"
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  placeholder="Street / Market / Area"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
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
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: REGISTER RIDER
        ========================================================================
      */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Bike className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Register New Delivery Rider</h3>
              </div>
              <button onClick={() => setIsAddRiderOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterRiderSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Rider Full Name *</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="e.g. Rahim Rider"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Login Phone Number *</label>
                <input
                  type="tel"
                  value={rPhone}
                  onChange={(e) => setRPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Primary Delivery Zone *</label>
                <select
                  value={rZone}
                  onChange={(e) => setRZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {DELIVERY_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Vehicle Type *</label>
                <select
                  value={rVehicle}
                  onChange={(e) => setRVehicle(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Motorcycle">Motorcycle 🏍️</option>
                  <option value="Bicycle">Bicycle 🚲</option>
                  <option value="Scooter">Scooter 🛵</option>
                </select>
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
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                >
                  Register Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: SEND ADMIN MESSAGE
        ========================================================================
      */}
      {isSendMessageOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Mail className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Send Rider Inbox Notice</h3>
              </div>
              <button onClick={() => setIsSendMessageOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessageSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Recipient *</label>
                <select
                  value={msgRecipientId}
                  onChange={(e) => setMsgRecipientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="ALL">📢 All Riders (Broadcast Announcement)</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      👤 Personal: {r.name} ({r.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Title / Subject *</label>
                <input
                  type="text"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="e.g. Daily Bonus Alert / Route Notice"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Message Body *</label>
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  rows={4}
                  placeholder="Type message content here..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSendMessageOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                >
                  Send Message
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
