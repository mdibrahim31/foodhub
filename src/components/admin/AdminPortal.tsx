import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { DELIVERY_ZONES, Vendor, Rider, Order, OrderStatus } from '../../types/database';
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
  Banknote,
  ArrowLeft,
  Crosshair,
  Compass,
  Navigation,
  Maximize2,
  Minimize2,
  Flame,
  UtensilsCrossed,
  ArrowUp,
  ArrowDown
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
    menuItems,
    toggleMenuItemAvailability,
    riders, 
    adminRegisterRider,
    toggleRiderPause,
    deleteRider,
    orders,
    foodCategories,
    addFoodCategory,
    updateFoodCategory,
    deleteFoodCategory,
    adBanners,
    addAdBanner,
    updateAdBanner,
    deleteAdBanner,
    toggleAdBannerStatus,
    sendAdminMessage,
    updateOrderStatus,
    isSupabaseConfigured
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'vendors' | 'riders' | 'orders' | 'ads' | 'database'>('settings');

  // Ad Banner Form State
  const [isAddAdOpen, setIsAddAdOpen] = useState(false);
  const [adTitle, setAdTitle] = useState('Welcome back! Enjoy 35% off & free delivery');
  const [adSubtitle, setAdSubtitle] = useState('Order from top Chittagong restaurants with 100% Cash On Delivery');
  const [adActionText, setAdActionText] = useState('Redeem now');
  const [adImageUrl, setAdImageUrl] = useState('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80');
  const [adTargetVendorId, setAdTargetVendorId] = useState('');
  const [targetVendorSearchQuery, setTargetVendorSearchQuery] = useState('');

  // Search Filters
  const [vendorSearch, setVendorSearch] = useState('');
  const [riderSearch, setRiderSearch] = useState('');

  // Selected for Full Profile Modals & Order Inspector
  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState<Vendor | null>(null);
  const [selectedRiderForProfile, setSelectedRiderForProfile] = useState<Rider | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [orderFilterTab, setOrderFilterTab] = useState<'active' | 'history'>('active');

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

  const handleMoveAdBanner = async (adId: string, direction: 'up' | 'down') => {
    const sorted = [...adBanners].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = sorted.findIndex(b => b.id === adId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const current = sorted[index];
      const other = sorted[index - 1];
      const currentIdx = current.order_index || 0;
      const otherIdx = other.order_index || 0;

      await updateAdBanner(current.id, { order_index: otherIdx });
      await updateAdBanner(other.id, { order_index: currentIdx === otherIdx ? currentIdx + 1 : currentIdx });
    } else if (direction === 'down' && index < sorted.length - 1) {
      const current = sorted[index];
      const other = sorted[index + 1];
      const currentIdx = current.order_index || 0;
      const otherIdx = other.order_index || 0;

      await updateAdBanner(current.id, { order_index: otherIdx });
      await updateAdBanner(other.id, { order_index: currentIdx === otherIdx ? Math.max(0, currentIdx - 1) : currentIdx });
    }
  };

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

  const filteredRiders = riders
    .filter(r => {
      const q = riderSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.unique_id && r.unique_id.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      // Working / Online riders placed at the top of the list
      const aWorking = a.is_online && !a.is_paused;
      const bWorking = b.is_online && !b.is_paused;
      if (aWorking && !bWorking) return -1;
      if (!aWorking && bWorking) return 1;

      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;

      if (!a.is_paused && b.is_paused) return -1;
      if (a.is_paused && !b.is_paused) return 1;

      return a.name.localeCompare(b.name);
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
        
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold gap-3 text-amber-800">
            <div className="space-y-0.5">
              <span className="text-sm font-black flex items-center space-x-1.5 text-amber-900">
                <span>⚠️ Supabase Database is not Connected</span>
              </span>
              <p className="text-[11px] text-amber-700">Your web app is running in Local Storage fallback mode because VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing from your environment variables.</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
              LocalStorage Fallback Active
            </div>
          </div>
        )}
        
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
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'ads' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ads & Banners ({adBanners.length})</span>
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
        {activeTab === 'orders' && (() => {
          const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
          const historyOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
          const displayOrders = orderFilterTab === 'active' ? activeOrders : historyOrders;

          return (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    foodiplace Orders Dispatch Stream
                  </h3>
                  <p className="text-xs text-slate-500">
                    Central dispatch & status tracking across all vendors and riders.
                  </p>
                </div>

                <a
                  href="./orders.html"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>Kitchen Terminal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Two Sub-Tab Switchers: Ongoing Orders vs Order History */}
              <div className="bg-slate-200/80 p-1.5 rounded-2xl flex text-xs font-black">
                <button
                  onClick={() => setOrderFilterTab('active')}
                  className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 ${
                    orderFilterTab === 'active' 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>চলমান অর্ডার (Active Orders)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    orderFilterTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                  }`}>
                    {activeOrders.length}
                  </span>
                </button>

                <button
                  onClick={() => setOrderFilterTab('history')}
                  className={`flex-1 py-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 ${
                    orderFilterTab === 'history' 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>অর্ডার হিস্ট্রি (Order History)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    orderFilterTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                  }`}>
                    {historyOrders.length}
                  </span>
                </button>
              </div>

              {/* Orders Cards List */}
              <div className="space-y-3">
                {displayOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs space-y-1">
                    <p className="text-sm text-slate-600">
                      {orderFilterTab === 'active' ? 'বর্তমানে কোনো চলমান অর্ডার নেই' : 'অর্ডার হিস্ট্রিতে কোনো রেকর্ড নেই'}
                    </p>
                    <p className="text-[11px] font-normal">
                      {orderFilterTab === 'active' ? 'নতুন কাস্টমার অর্ডার সরাসরি এই তালিকায় দেখাবে।' : 'সম্পন্ন বা বাতিলকৃত সকল অর্ডার হিস্ট্রি তালিকায় থাকবে।'}
                    </p>
                  </div>
                ) : (
                  displayOrders.map((ord) => {
                    const vend = vendors.find(v => v.id === ord.vendor_id);
                    const rid = riders.find(r => r.id === ord.rider_id);
                    return (
                      <div 
                        key={ord.id} 
                        onClick={() => setSelectedOrderForDetails(ord)}
                        className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition cursor-pointer space-y-3 text-xs group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-black text-rose-600 text-sm group-hover:underline">{ord.order_code}</span>
                            <h4 className="font-extrabold text-slate-900 text-base">{vend?.name || 'Restaurant'}</h4>
                            <span className="text-slate-400 text-[10px] font-mono">{new Date(ord.created_at).toLocaleString()}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 font-black text-[10px] rounded-full uppercase ${
                              ord.status === 'delivered' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : ord.status === 'cancelled' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForDetails(ord);
                              }}
                              className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[11px] rounded-xl hover:bg-black transition flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>All Details</span>
                            </button>
                          </div>
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
                            <p className="text-[11px] text-emerald-700 font-mono font-black">COD Collect: ৳{ord.total_cash_payable} (Food: ৳{ord.food_total} + Delivery: ৳{ord.delivery_fee})</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* 
          ======================================================================
          TAB: PROMOTIONAL ADS & HERO BANNERS MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  <span>Customer Top Hero Banner Ads ({adBanners.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage promotional ads & banners displayed at the top of the customer home page with customizable slide settings.
                </p>
              </div>

              <button
                onClick={() => setIsAddAdOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Banner Ad</span>
              </button>
            </div>

            {/* List of Current Ads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adBanners.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs">
                  No promotional banner ads running yet. Click "Post New Banner Ad" above to create one.
                </div>
              ) : (
                [...adBanners].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((ad, idx, sortedArr) => {
                  const targetVendor = ad.target_vendor_id ? vendors.find(v => v.id === ad.target_vendor_id) : null;
                  return (
                    <div 
                      key={ad.id} 
                      className={`border rounded-3xl p-4 shadow-xs space-y-3 transition-all ${
                        ad.is_active 
                          ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white border-rose-400' 
                          : 'bg-slate-100 text-slate-600 border-slate-300 opacity-75'
                      }`}
                    >
                      {/* Live Banner Mockup */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1 max-w-[220px]">
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${
                            ad.is_active ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {ad.is_active ? `● LIVE AD (Order: ${ad.order_index || 0})` : `INACTIVE (Order: ${ad.order_index || 0})`}
                          </span>
                          <h4 className="font-black text-base sm:text-lg leading-tight tracking-tight">
                            {ad.title}
                          </h4>
                          {ad.subtitle && (
                            <p className="text-[11px] font-medium opacity-90 truncate">{ad.subtitle}</p>
                          )}
                          <div className="pt-1">
                            <span className="inline-flex items-center space-x-1 text-xs font-black bg-black/20 px-3 py-1 rounded-xl">
                              <span>{ad.action_text || 'Redeem now'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="relative w-32 h-24 sm:w-36 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-md">
                          <img 
                            src={ad.image_url} 
                            alt={ad.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Control Footer */}
                      <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                        <div className="text-[11px]">
                          {targetVendor ? (
                            <span>Linked Vendor: <strong className="underline">{targetVendor.name}</strong></span>
                          ) : (
                            <span>General Offer Ad</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleAdBannerStatus(ad.id)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
                              ad.is_active 
                                ? 'bg-white text-rose-700 hover:bg-slate-100' 
                                : 'bg-slate-800 text-white hover:bg-black'
                            }`}
                          >
                            {ad.is_active ? 'Pause Ad' : 'Activate Ad'}
                          </button>

                          {/* Up Arrow (Disabled for first item) */}
                          <button
                            onClick={() => handleMoveAdBanner(ad.id, 'up')}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-xl transition cursor-pointer ${
                              idx === 0 
                                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                                : 'bg-black/30 hover:bg-black/50 text-white'
                            }`}
                            title="Move Up (Show First)"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          {/* Down Arrow (Disabled for last item) */}
                          <button
                            onClick={() => handleMoveAdBanner(ad.id, 'down')}
                            disabled={idx === sortedArr.length - 1}
                            className={`p-1.5 rounded-xl transition cursor-pointer ${
                              idx === sortedArr.length - 1 
                                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                                : 'bg-black/30 hover:bg-black/50 text-white'
                            }`}
                            title="Move Down (Show Later)"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Delete this promotional ad banner?')) {
                                deleteAdBanner(ad.id);
                              }
                            }}
                            className="p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-xl transition cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        FULLSCREEN VENDOR PROFILE & MENU INSPECTOR WINDOW
        ========================================================================
      */}
      {selectedVendorForProfile && (() => {
        const vendorMenuItems = menuItems.filter(m => m.vendor_id === selectedVendorForProfile.id);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
            
            {/* Header Bar with Back Arrow & Boost Vendor Toggle */}
            <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedVendorForProfile(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 border border-slate-700 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3] text-rose-400" />
                  <span>Back to Vendors List</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-800" />

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-base tracking-tight leading-none">{selectedVendorForProfile.name}</h2>
                    <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md mt-1 inline-block">
                      ID: {selectedVendorForProfile.unique_id || selectedVendorForProfile.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Boost Toggle & Close */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const nextBoosted = !selectedVendorForProfile.is_boosted;
                    updateVendor(selectedVendorForProfile.id, { 
                      is_boosted: nextBoosted,
                      boost_banner_title: selectedVendorForProfile.boost_banner_title || `Welcome back! Enjoy 35% off & free delivery`,
                      boost_banner_subtitle: selectedVendorForProfile.boost_banner_subtitle || `Special offer from ${selectedVendorForProfile.name}`
                    });
                    setSelectedVendorForProfile(prev => prev ? { ...prev, is_boosted: nextBoosted } : null);
                  }}
                  className={`px-4 py-2 font-black text-xs rounded-2xl transition flex items-center space-x-2 cursor-pointer shadow-lg active:scale-95 ${
                    selectedVendorForProfile.is_boosted 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border border-amber-300 animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{selectedVendorForProfile.is_boosted ? '🔥 Vendor Boosted (Hero Banner Active)' : 'Boost Vendor (Show in Top Banner)'}</span>
                </button>

                <button
                  onClick={() => setSelectedVendorForProfile(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  title="Close Window"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Main Content Body */}
            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* Vendor Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-mono font-bold text-white text-base">{selectedVendorForProfile.phone}</span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Zone</span>
                  <span className="font-extrabold text-rose-400 text-base">{selectedVendorForProfile.zone}</span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cuisine Specialty</span>
                  <span className="font-bold text-white text-base">{selectedVendorForProfile.cuisine}</span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating & Prep Time</span>
                  <span className="font-black text-amber-400 text-base">⭐ {selectedVendorForProfile.rating} &bull; {selectedVendorForProfile.estimated_prep_time_minutes} mins</span>
                </div>
              </div>

              {/* Popular Serial & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-white text-xs font-bold">{selectedVendorForProfile.address}</p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Popular Brands Ranking (1-5 Serial)</span>
                    <p className="text-slate-400 text-[11px]">Controls order in home page Popular Brands slider</p>
                  </div>
                  <select
                    value={selectedVendorForProfile.featured_position || 0}
                    onChange={(e) => {
                      const pos = Number(e.target.value);
                      updateVendor(selectedVendorForProfile.id, { featured_position: pos > 0 ? pos : undefined });
                      setSelectedVendorForProfile(prev => prev ? { ...prev, featured_position: pos > 0 ? pos : undefined } : null);
                    }}
                    className="bg-slate-900 border border-orange-500/40 rounded-xl px-3 py-1.5 font-bold text-orange-400 text-xs focus:outline-hidden cursor-pointer"
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

              {/* Boost Customization Panel (if boosted) */}
              {selectedVendorForProfile.is_boosted && (
                <div className="bg-gradient-to-r from-orange-950/60 to-amber-950/60 border border-orange-500/40 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-2 text-orange-400">
                    <Flame className="w-5 h-5 fill-orange-400" />
                    <h3 className="font-black text-sm uppercase tracking-wider">Top Banner Boost Customization</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-orange-300 font-bold uppercase">Banner Offer Heading Title:</label>
                      <input
                        type="text"
                        value={selectedVendorForProfile.boost_banner_title || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateVendor(selectedVendorForProfile.id, { boost_banner_title: val });
                          setSelectedVendorForProfile(prev => prev ? { ...prev, boost_banner_title: val } : null);
                        }}
                        placeholder="e.g. Welcome back! Enjoy 35% off & free delivery"
                        className="w-full bg-slate-900 border border-orange-500/30 rounded-xl px-3 py-2 text-white font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-orange-300 font-bold uppercase">Banner Subtitle / Offer Details:</label>
                      <input
                        type="text"
                        value={selectedVendorForProfile.boost_banner_subtitle || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateVendor(selectedVendorForProfile.id, { boost_banner_subtitle: val });
                          setSelectedVendorForProfile(prev => prev ? { ...prev, boost_banner_subtitle: val } : null);
                        }}
                        placeholder="e.g. Special discounts on all menu items"
                        className="w-full bg-slate-900 border border-orange-500/30 rounded-xl px-3 py-2 text-white font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Food Menu List */}
              <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-white text-base flex items-center space-x-2">
                    <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                    <span>Restaurant Food Menu ({vendorMenuItems.length} Items)</span>
                  </h3>
                </div>

                {vendorMenuItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-700 text-slate-400 font-bold text-xs">
                    No menu items added for this restaurant yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendorMenuItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs"
                      >
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'} 
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-black text-white text-xs truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 block">{item.category}</span>
                          <span className="text-emerald-400 font-mono font-black text-xs block">৳{item.price}</span>
                          
                          <button
                            onClick={() => toggleMenuItemAvailability(item.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition ${
                              item.is_available 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {item.is_available ? 'Available' : 'Sold Out'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </main>
          </div>
        );
      })()}

      {/* 
        ========================================================================
        FULLSCREEN RIDER PROFILE WINDOW
        ========================================================================
      */}
      {selectedRiderForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
          
          {/* Top Fullscreen Header with Back Arrow Button */}
          <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedRiderForProfile(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 border border-slate-700 cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3] text-rose-400" />
                <span>Back to Admin Panel</span>
              </button>

              <div className="hidden sm:block h-6 w-px bg-slate-800" />

              <div className="flex items-center space-x-3">
                <img
                  src={selectedRiderForProfile.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                  alt={selectedRiderForProfile.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-rose-500/40 shadow-xs"
                />
                <div>
                  <h2 className="font-black text-white text-base tracking-tight leading-none">{selectedRiderForProfile.name}</h2>
                  <span className="text-[10px] font-mono font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md mt-1 inline-block">
                    ID: {selectedRiderForProfile.unique_id || selectedRiderForProfile.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                selectedRiderForProfile.is_paused 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : selectedRiderForProfile.is_online 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {selectedRiderForProfile.is_paused ? 'PAUSED BY ADMIN' : selectedRiderForProfile.is_online ? 'ONLINE ON DUTY' : 'OFFLINE'}
              </span>

              <button
                onClick={() => setSelectedRiderForProfile(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Body Container */}
          <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="font-mono font-bold text-white text-base">{selectedRiderForProfile.phone}</span>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Zone</span>
                <span className="font-extrabold text-pink-400 text-base">{selectedRiderForProfile.zone}</span>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
                <span className="font-bold text-white text-base">{selectedRiderForProfile.vehicle_type}</span>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-3xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Float Cash Held (COD)</span>
                <span className="font-mono font-black text-emerald-400 text-lg">৳{selectedRiderForProfile.cash_in_hand}</span>
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-3xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Home Address Base</span>
              <p className="font-bold text-white text-sm">{selectedRiderForProfile.home_address || 'Chittagong'}</p>
            </div>

            {/* Live Location Map Section */}
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-white text-base flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                    <span>Rider Live GPS Tracking Map</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Current Coordinates: Lat {selectedRiderForProfile.current_latitude.toFixed(4)}, Lng {selectedRiderForProfile.current_longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Fullscreen & Interactive Map Box */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-900">
                <InteractiveMap
                  center={[selectedRiderForProfile.current_latitude, selectedRiderForProfile.current_longitude]}
                  zoom={16}
                  heightClass="h-96 md:h-[520px]"
                  showControls={true}
                  showFullscreenButton={true}
                  showRecenterButton={true}
                  markers={[
                    {
                      id: selectedRiderForProfile.id,
                      latitude: selectedRiderForProfile.current_latitude,
                      longitude: selectedRiderForProfile.current_longitude,
                      title: `${selectedRiderForProfile.name} (Live GPS)`,
                      subtitle: `${selectedRiderForProfile.zone} • ${selectedRiderForProfile.vehicle_type}`,
                      type: 'rider'
                    }
                  ]}
                />
              </div>
            </div>

          </main>
        </div>
      )}

      {/* 
        ========================================================================
        FULLSCREEN ORDER INSPECTOR WINDOW
        ========================================================================
      */}
      {selectedOrderForDetails && (() => {
        const ordVendor = vendors.find(v => v.id === selectedOrderForDetails.vendor_id);
        const ordRider = riders.find(r => r.id === selectedOrderForDetails.rider_id);

        // Build map markers list for Vendor, Customer, and Rider
        const orderMapMarkers: any[] = [];
        
        if (ordVendor) {
          orderMapMarkers.push({
            id: 'vendor-pin',
            latitude: ordVendor.latitude,
            longitude: ordVendor.longitude,
            title: ordVendor.name,
            subtitle: `Restaurant Pickup • ${ordVendor.address}`,
            type: 'vendor'
          });
        }

        orderMapMarkers.push({
          id: 'customer-pin',
          latitude: selectedOrderForDetails.delivery_latitude,
          longitude: selectedOrderForDetails.delivery_longitude,
          title: `Customer: ${selectedOrderForDetails.customer_name}`,
          subtitle: `Delivery Address: ${selectedOrderForDetails.delivery_address}`,
          type: 'customer'
        });

        if (ordRider) {
          orderMapMarkers.push({
            id: 'rider-pin',
            latitude: ordRider.current_latitude,
            longitude: ordRider.current_longitude,
            title: `Rider: ${ordRider.name} (Live GPS)`,
            subtitle: `Vehicle: ${ordRider.vehicle_type} • Phone: ${ordRider.phone}`,
            type: 'rider'
          });
        }

        const initialCenter: [number, number] = ordRider 
          ? [ordRider.current_latitude, ordRider.current_longitude]
          : [selectedOrderForDetails.delivery_latitude, selectedOrderForDetails.delivery_longitude];

        return (
          <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
            
            {/* Top Header */}
            <header className="bg-black/90 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 border border-slate-700 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3] text-rose-400" />
                  <span>Back to Orders Stream</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-800" />

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-rose-500 text-base">{selectedOrderForDetails.order_code}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(selectedOrderForDetails.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-bold truncate">
                    {ordVendor?.name || 'Restaurant'} &bull; {selectedOrderForDetails.customer_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Admin Order Status Override Dropdown */}
                <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Status:</span>
                  <select
                    value={selectedOrderForDetails.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      updateOrderStatus(selectedOrderForDetails.id, newStatus);
                      setSelectedOrderForDetails(prev => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="bg-transparent text-emerald-400 font-black text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="pending" className="bg-slate-900 text-amber-400">PENDING</option>
                    <option value="vendor_accepted" className="bg-slate-900 text-blue-400">VENDOR ACCEPTED</option>
                    <option value="food_preparing" className="bg-slate-900 text-orange-400">KITCHEN PREPARING</option>
                    <option value="ready_for_pickup" className="bg-slate-900 text-yellow-400">READY FOR PICKUP</option>
                    <option value="rider_assigned" className="bg-slate-900 text-purple-400">RIDER ASSIGNED</option>
                    <option value="rider_on_way_to_customer" className="bg-slate-900 text-cyan-400">ON THE WAY</option>
                    <option value="delivered" className="bg-slate-900 text-emerald-400">DELIVERED</option>
                    <option value="cancelled" className="bg-slate-900 text-red-400">CANCELLED</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Main Content Grid */}
            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* 3-Column Info Cards (Customer, Vendor, Rider) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Customer Details */}
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-2 text-blue-400 border-b border-slate-800 pb-2.5">
                    <User className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Customer Details</h3>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold">
                    <p className="text-white text-sm font-black">{selectedOrderForDetails.customer_name}</p>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-sm text-emerald-400">{selectedOrderForDetails.customer_phone}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{selectedOrderForDetails.delivery_address}</span>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-mono">
                      Zone: {selectedOrderForDetails.zone || 'Chawkbazar Zone'}
                    </span>
                  </div>
                </div>

                {/* 2. Vendor / Restaurant Details */}
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-2 text-orange-400 border-b border-slate-800 pb-2.5">
                    <Store className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Vendor Details</h3>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold">
                    <p className="text-white text-sm font-black">{ordVendor?.name || 'Restaurant'}</p>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-sm text-emerald-400">{ordVendor?.phone || 'N/A'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{ordVendor?.cuisine}</p>
                    <p className="text-slate-300 text-[11px] truncate">{ordVendor?.address}</p>
                  </div>
                </div>

                {/* 3. Assigned Rider Details */}
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-2 text-pink-400 border-b border-slate-800 pb-2.5">
                    <Bike className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Assigned Rider Details</h3>
                  </div>
                  {ordRider ? (
                    <div className="space-y-1.5 text-xs font-bold">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-black">{ordRider.name}</p>
                        <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-mono rounded-md">
                          {ordRider.unique_id || 'RDR-2001'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-sm text-emerald-400">{ordRider.phone}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">Vehicle: {ordRider.vehicle_type} &bull; Zone: {ordRider.zone}</p>
                      <p className="text-emerald-400 font-mono text-[11px]">Float Cash Held: ৳{ordRider.cash_in_hand}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/60 rounded-2xl text-slate-400 font-bold text-xs text-center space-y-1">
                      <p>No rider assigned yet.</p>
                      <p className="text-[10px] text-amber-400">Dispatch system searching proximity riders within 1 km radius...</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Food Items & Pricing Breakup Table */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-black text-white text-base flex items-center space-x-2">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span>Order Items & Pricing Financial Breakup</span>
                </h3>

                {/* Items List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-bold">
                    <thead>
                      <tr className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="p-3 rounded-l-xl">Food Item Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3 text-right rounded-r-xl">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {(selectedOrderForDetails.items || []).map((itm, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-extrabold text-white">{itm.item_name}</td>
                          <td className="p-3 font-mono text-rose-400 font-black">x{itm.quantity}</td>
                          <td className="p-3 font-mono">৳{itm.item_price}</td>
                          <td className="p-3 font-mono text-right text-emerald-400 font-black">৳{itm.subtotal || (itm.item_price * itm.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Price Breakdown Footer */}
                <div className="bg-black/60 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block">Food Items Subtotal</span>
                    <span className="text-white font-mono text-base font-black">৳{selectedOrderForDetails.food_total}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block">Distance Delivery Fee ({selectedOrderForDetails.delivery_distance_km.toFixed(1)} km)</span>
                    <span className="text-rose-400 font-mono text-base font-black">৳{selectedOrderForDetails.delivery_fee}</span>
                  </div>

                  <div className="space-y-0.5 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-300 uppercase block">Total Payable Cash (COD)</span>
                    <span className="text-emerald-400 font-mono text-xl font-black">৳{selectedOrderForDetails.total_cash_payable}</span>
                  </div>
                </div>
              </div>

              {/* Live Location Map (Vendor, Customer, Rider) */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-white text-base flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                      <span>Live Order GPS Dispatch Map</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Showing Vendor Pickup 🏪, Customer Address 🏠, and Live Rider 🛵 Pin Point.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                  <InteractiveMap
                    center={initialCenter}
                    zoom={15}
                    heightClass="h-96 md:h-[500px]"
                    showControls={true}
                    showFullscreenButton={true}
                    showRecenterButton={true}
                    markers={orderMapMarkers}
                  />
                </div>
              </div>

            </main>
          </div>
        );
      })()}

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
      {/* 
        ========================================================================
        MODAL: POST NEW PROMOTIONAL BANNER AD
        ========================================================================
      */}
      {isAddAdOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Post Custom Promotional Banner Ad</h3>
              </div>
              <button onClick={() => setIsAddAdOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!adTitle.trim() || !adImageUrl.trim()) {
                  alert('Please enter banner heading title and image URL');
                  return;
                }
                addAdBanner({
                  title: adTitle.trim(),
                  subtitle: adSubtitle.trim(),
                  action_text: adActionText.trim() || 'Redeem now',
                  image_url: adImageUrl.trim(),
                  target_vendor_id: adTargetVendorId || undefined,
                  is_active: true
                });
                setIsAddAdOpen(false);
                setAdTitle('Welcome back! Enjoy 35% off & free delivery');
                setAdSubtitle('');
                alert('New Promotional Banner Ad Published Successfully! 🎉');
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div className="space-y-1">
                <label className="text-slate-600">Banner Heading Title (Bold Text)*</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g. Welcome back! Enjoy 35% off & free delivery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600">Banner Subtitle / Description (Optional)</label>
                <input
                  type="text"
                  value={adSubtitle}
                  onChange={(e) => setAdSubtitle(e.target.value)}
                  placeholder="e.g. Order from top Chittagong restaurants with 100% COD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600">Action Button Text</label>
                <input
                  type="text"
                  value={adActionText}
                  onChange={(e) => setAdActionText(e.target.value)}
                  placeholder="e.g. Redeem now"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Target Restaurant Search & ID Selection Box */}
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-extrabold flex items-center space-x-1.5">
                    <Store className="w-4 h-4 text-rose-600" />
                    <span>Target Restaurant Search & Selection</span>
                  </label>
                  {adTargetVendorId && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdTargetVendorId('');
                        setTargetVendorSearchQuery('');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-md cursor-pointer"
                    >
                      Clear Link (✕)
                    </button>
                  )}
                </div>

                {/* If a restaurant is already selected */}
                {(() => {
                  const selectedVendorObj = adTargetVendorId 
                    ? vendors.find(v => v.id === adTargetVendorId || (v.unique_id && v.unique_id.toLowerCase() === adTargetVendorId.toLowerCase()))
                    : null;

                  if (selectedVendorObj) {
                    return (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-xs truncate">{selectedVendorObj.name}</span>
                              <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-800 font-mono font-bold text-[10px] rounded-md shrink-0">
                                {selectedVendorObj.unique_id || selectedVendorObj.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-700 font-medium truncate">
                              📞 {selectedVendorObj.phone} &bull; {selectedVendorObj.zone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-1 rounded-lg shrink-0">
                          ✓ Linked
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {/* Search Bar Input */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={targetVendorSearchQuery}
                          onChange={(e) => {
                            setTargetVendorSearchQuery(e.target.value);
                            setAdTargetVendorId(e.target.value.trim()); // Also supports direct ID typing
                          }}
                          placeholder="Search restaurant by Name, ID (VND-1001), or Phone..."
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-rose-500 font-bold"
                        />
                      </div>

                      {/* Matching Restaurants Dropdown Results */}
                      {targetVendorSearchQuery.trim().length > 0 && (() => {
                        const q = targetVendorSearchQuery.toLowerCase().trim();
                        const matchingVendors = vendors.filter(v => 
                          v.name.toLowerCase().includes(q) ||
                          v.phone.includes(q) ||
                          v.id.toLowerCase().includes(q) ||
                          (v.unique_id && v.unique_id.toLowerCase().includes(q))
                        );

                        if (matchingVendors.length === 0) {
                          return (
                            <div className="p-3 text-center bg-white border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-500 font-bold">
                              No restaurant found matching "{targetVendorSearchQuery}". Enter valid Vendor ID or search name.
                            </div>
                          );
                        }

                        return (
                          <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-md">
                            {matchingVendors.map((v) => (
                              <div
                                key={v.id}
                                onClick={() => {
                                  setAdTargetVendorId(v.id);
                                  setTargetVendorSearchQuery('');
                                }}
                                className="p-2.5 hover:bg-rose-50 cursor-pointer transition flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-slate-900">{v.name}</span>
                                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-mono font-bold text-[9px] rounded-md">
                                      {v.unique_id || v.id}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium">📞 {v.phone} &bull; {v.zone}</span>
                                </div>
                                <span className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                                  Select &rarr;
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Dropdown Quick Select Fallback */}
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Or select directly from registered partners list:</span>
                        <select
                          value={adTargetVendorId}
                          onChange={(e) => setAdTargetVendorId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-bold focus:outline-hidden cursor-pointer"
                        >
                          <option value="">-- General Ad (Unlinked Offer Banner) --</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              🎯 [{v.unique_id || v.id}] {v.name} ({v.phone} - {v.zone})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <label className="text-slate-600">Banner Image URL*</label>
                <input
                  type="url"
                  required
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono text-[11px]"
                />
                
                {/* Preset Image Options */}
                <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 shrink-0">Sample Images:</span>
                  {[
                    { name: 'Fried Chicken', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setAdImageUrl(preset.url)}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Live Preview */}
              <div className="p-3 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl text-white space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">Live Banner Preview</span>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <h4 className="font-black text-sm">{adTitle || 'Your Banner Title'}</h4>
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-lg mt-1 inline-block">{adActionText || 'Redeem now'} &rarr;</span>
                  </div>
                  {adImageUrl && (
                    <img src={adImageUrl} alt="Preview" className="w-16 h-14 object-cover rounded-xl shadow-xs shrink-0" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Publish Banner Ad
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
