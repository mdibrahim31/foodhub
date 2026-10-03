import React, { useState, useEffect } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { DELIVERY_ZONES, DeliveryZone, Vendor, Rider, Order, OrderStatus } from '../../types/database';
import { 
  ShieldCheck, 
  Settings, 
  Store, 
  Bike, 
  ClipboardList, 
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
  ArrowDown,
  Edit2,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    zones,
    addZone,
    updateZone,
    deleteZone,
    toggleZoneActive,
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
    isSupabaseConfigured,
    supabaseConfig,
    connectSupabase,
    syncAllToSupabase
  } = useDelivery();

  const [activeTab, setActiveTabState] = useState<'settings' | 'categories' | 'zones' | 'vendors' | 'riders' | 'orders' | 'ads'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodiplace_admin_active_tab') as any;
      if (['settings', 'categories', 'zones', 'vendors', 'riders', 'orders', 'ads'].includes(saved)) {
        return saved;
      }
    }
    return 'zones';
  });

  const setActiveTab = (tab: 'settings' | 'categories' | 'zones' | 'vendors' | 'riders' | 'orders' | 'ads') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodiplace_admin_active_tab', tab);
    }
  };

  // Zone Management Form State
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zName, setZName] = useState('');
  const [zBnName, setZBnName] = useState('');
  const [zDescription, setZDescription] = useState('');
  const [zLat, setZLat] = useState(22.3590);
  const [zLng, setZLng] = useState(91.8380);
  const [zRadiusKm, setZRadiusKm] = useState(3.0);
  const [zColor, setZColor] = useState('#E11D48');
  const [zIsActive, setZIsActive] = useState(true);
  const [selectedMapZoneId, setSelectedMapZoneId] = useState<string | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [isZoneMapPickerOpen, setIsZoneMapPickerOpen] = useState(false);

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

  // Selected for Full Profile Modals & Order Inspector (persisted across page refresh)
  const [selectedVendorForProfile, setSelectedVendorForProfileState] = useState<Vendor | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('foodiplace_admin_selected_vendor_id');
      if (savedId) {
        const found = vendors.find(v => v.id === savedId);
        if (found) return found;
      }
    }
    return null;
  });

  const setSelectedVendorForProfile = (action: React.SetStateAction<Vendor | null>) => {
    setSelectedVendorForProfileState(prev => {
      const next = typeof action === 'function' ? (action as (p: Vendor | null) => Vendor | null)(prev) : action;
      if (typeof window !== 'undefined') {
        if (next) localStorage.setItem('foodiplace_admin_selected_vendor_id', next.id);
        else localStorage.removeItem('foodiplace_admin_selected_vendor_id');
      }
      return next;
    });
  };

  const [selectedRiderForProfile, setSelectedRiderForProfileState] = useState<Rider | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('foodiplace_admin_selected_rider_id');
      if (savedId) {
        const found = riders.find(r => r.id === savedId);
        if (found) return found;
      }
    }
    return null;
  });

  const setSelectedRiderForProfile = (action: React.SetStateAction<Rider | null>) => {
    setSelectedRiderForProfileState(prev => {
      const next = typeof action === 'function' ? (action as (p: Rider | null) => Rider | null)(prev) : action;
      if (typeof window !== 'undefined') {
        if (next) localStorage.setItem('foodiplace_admin_selected_rider_id', next.id);
        else localStorage.removeItem('foodiplace_admin_selected_rider_id');
      }
      return next;
    });
  };

  const [selectedOrderForDetails, setSelectedOrderForDetailsState] = useState<Order | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('foodiplace_admin_selected_order_id');
      if (savedId) {
        const found = orders.find(o => o.id === savedId);
        if (found) return found;
      }
    }
    return null;
  });

  const setSelectedOrderForDetails = (action: React.SetStateAction<Order | null>) => {
    setSelectedOrderForDetailsState(prev => {
      const next = typeof action === 'function' ? (action as (p: Order | null) => Order | null)(prev) : action;
      if (typeof window !== 'undefined') {
        if (next) localStorage.setItem('foodiplace_admin_selected_order_id', next.id);
        else localStorage.removeItem('foodiplace_admin_selected_order_id');
      }
      return next;
    });
  };

  // Keep detail view states synced when collections are loaded/polled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRiderId = localStorage.getItem('foodiplace_admin_selected_rider_id');
      if (savedRiderId && !selectedRiderForProfile && riders.length > 0) {
        const found = riders.find(r => r.id === savedRiderId);
        if (found) setSelectedRiderForProfileState(found);
      }
      const savedVendorId = localStorage.getItem('foodiplace_admin_selected_vendor_id');
      if (savedVendorId && !selectedVendorForProfile && vendors.length > 0) {
        const found = vendors.find(v => v.id === savedVendorId);
        if (found) setSelectedVendorForProfileState(found);
      }
      const savedOrderId = localStorage.getItem('foodiplace_admin_selected_order_id');
      if (savedOrderId && !selectedOrderForDetails && (orders || []).length > 0) {
        const found = (orders || []).find(o => o && o.id === savedOrderId);
        if (found) setSelectedOrderForDetailsState(found);
      }
    }
  }, [riders, vendors, orders]);

  const [orderFilterTab, setOrderFilterTab] = useState<'active' | 'history'>('active');
  const [isRiderMapFullscreen, setIsRiderMapFullscreen] = useState(false);

  // Send Message Modal State
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [msgRecipientId, setMsgRecipientId] = useState<'ALL' | string>('ALL');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Settings form state
  const [perKmCharge, setPerKmCharge] = useState(settings?.per_km_delivery_charge || 15);
  const [baseCharge, setBaseCharge] = useState(settings?.base_delivery_charge || 30);
  const [riderRadius, setRiderRadius] = useState(settings?.rider_match_radius_km || 1.0);
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

  const handleRegisterVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vPhone.trim() || !vAddress.trim()) {
      alert('Please enter restaurant name, phone number, and address.');
      return;
    }

    const res = await adminRegisterVendor({
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
    
    if (res.savedToDatabase) {
      alert(`✅ Vendor "${res.vendor.name}" registered & saved to Database!\nID: ${res.vendor.unique_id || res.vendor.id}\nPhone: ${res.vendor.phone}\nZone: ${res.vendor.zone}`);
    } else {
      alert(`✅ Vendor "${res.vendor.name}" registered successfully!\nZone: ${res.vendor.zone}`);
    }
  };

  const handleRegisterRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rPhone.trim()) {
      alert('Please enter rider phone number.');
      return;
    }

    const res = await adminRegisterRider({
      phone: rPhone.trim(),
      name: rName.trim() || undefined,
      zone: rZone || (zones[0]?.name || 'Chawkbazar Zone'),
      vehicle_type: rVehicle || 'Motorcycle'
    });

    setIsAddRiderOpen(false);
    setRName('');
    setRPhone('');
    setRHomeAddress('');

    if (res.savedToDatabase) {
      alert(`✅ Rider phone "${res.rider.phone}" registered & saved to Database!\nZone: ${res.rider.zone}\nThe rider can now complete registration with their name and password from the Rider App.\nID: ${res.rider.id}`);
    } else {
      alert(`✅ Rider "${res.rider.name || res.rider.phone}" registered successfully!\nZone: ${res.rider.zone}`);
    }
  };

  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZName('');
    setZBnName('');
    setZDescription('');
    setZLat(22.3590);
    setZLng(91.8380);
    setZRadiusKm(3.0);
    setZColor('#E11D48');
    setZIsActive(true);
    setIsAddZoneOpen(true);
  };

  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZName(zone.name);
    setZBnName(zone.bn_name || '');
    setZDescription(zone.description || '');
    setZLat(zone.center_latitude || 22.3590);
    setZLng(zone.center_longitude || 91.8380);
    setZRadiusKm(zone.radius_km || 3.0);
    setZColor(zone.color || '#E11D48');
    setZIsActive(zone.is_active !== false);
    setIsAddZoneOpen(true);
  };

  const handleSaveZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zName.trim()) {
      alert('Please enter a Zone Name (e.g. Chawkbazar Zone).');
      return;
    }

    if (editingZone) {
      await updateZone(editingZone.id, {
        name: zName.trim(),
        bn_name: zBnName.trim() || undefined,
        description: zDescription.trim() || undefined,
        center_latitude: zLat,
        center_longitude: zLng,
        radius_km: zRadiusKm,
        color: zColor,
        is_active: zIsActive
      });
      alert(`✅ Zone "${zName.trim()}" updated successfully!`);
    } else {
      await addZone({
        name: zName.trim(),
        bn_name: zBnName.trim() || undefined,
        description: zDescription.trim() || undefined,
        center_latitude: zLat,
        center_longitude: zLng,
        radius_km: zRadiusKm,
        color: zColor,
        is_active: zIsActive
      });
      alert(`✅ New Zone "${zName.trim()}" created successfully!`);
    }

    setIsAddZoneOpen(false);
    setEditingZone(null);
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

  const filteredZones = (zones || []).filter(z => {
    if (!z) return false;
    const q = (zoneSearch || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (z.name && z.name.toLowerCase().includes(q)) ||
      (z.bn_name && z.bn_name.toLowerCase().includes(q)) ||
      (z.description && z.description.toLowerCase().includes(q))
    );
  });

  const filteredVendors = (vendors || []).filter(v => {
    if (!v) return false;
    const q = (vendorSearch || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q)) ||
      (v.unique_id && v.unique_id.toLowerCase().includes(q))
    );
  });

  const filteredRiders = (riders || [])
    .filter(r => {
      if (!r) return false;
      const q = (riderSearch || '').toLowerCase().trim();
      if (!q) return true;
      return (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      // Working / Online riders placed at the top of the list
      const aWorking = a.is_online && !a.is_paused;
      const bWorking = b.is_online && !b.is_paused;
      if (aWorking && !bWorking) return -1;
      if (!aWorking && bWorking) return 1;

      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;

      if (!a.is_paused && b.is_paused) return -1;
      if (a.is_paused && !b.is_paused) return 1;

      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 pb-12 font-sans selection:bg-rose-500 selection:text-white">
      {/* Header Bar */}
      <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-2xl shadow-md text-white">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight bg-linear-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                  foodiplace
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Master Control &bull; Vendors, Riders, Live Orders & Rates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <a
              href="./"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1 border border-slate-200 cursor-pointer"
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
            onClick={() => setActiveTab('zones')}
            className={`px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'zones' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Rider Zones ({zones.length})</span>
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
                              {r.id.length > 12 ? `${r.id.slice(0, 8)}...` : r.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900">{r.phone}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{r.name}</td>
                          <td className="py-3 px-4">
                            {r.is_paused ? (
                              <span className="px-2.5 py-1 bg-red-100 text-red-800 font-black text-[10px] rounded-full uppercase inline-flex items-center gap-1.5 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span>PAUSED</span>
                              </span>
                            ) : r.is_online ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase inline-flex items-center gap-1.5 border border-emerald-300 shadow-xs shadow-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                <span>ONLINE ON DUTY</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-full uppercase inline-flex items-center gap-1.5 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                                <span>OFFLINE</span>
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
                                  if (confirm(`Are you sure you want to delete rider "${r.name}" (${r.phone})?`)) {
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
          TAB: RIDER & DELIVERY ZONES MANAGEMENT
          ======================================================================
        */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            {/* Header & Action Bar */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Rider & Delivery Zones (রাইডার ও ডেলিভারি জোন)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Create geographic zones and boundary circles. Orders from a zone are strictly dispatched ONLY to riders in that zone!
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddZone}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Zone</span>
              </button>
            </div>

            {/* Zone Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Total Zones</span>
                  <MapPin className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-900">{zones.length}</span>
                  <span className="text-[11px] text-slate-400 font-bold">configured</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Active Zones</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-emerald-600">
                    {zones.filter(z => z.is_active !== false).length}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">operational</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Assigned Riders</span>
                  <Bike className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-900">{riders.length}</span>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    ({riders.filter(r => r.is_online && !r.is_paused).length} online)
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Covered Vendors</span>
                  <Store className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-900">{vendors.length}</span>
                  <span className="text-[11px] text-slate-400 font-bold">merchants</span>
                </div>
              </div>
            </div>

            {/* Live Interactive Zones Map */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-rose-600" />
                    <span>Live Geographic Delivery Zones Map</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Visual representation of all delivery boundary radiuses and active online rider positions in Chittagong.
                  </p>
                </div>

                {selectedMapZoneId && (
                  <button
                    onClick={() => setSelectedMapZoneId(null)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200"
                  >
                    Reset Map Selection
                  </button>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <InteractiveMap
                  center={[22.3590, 91.8380]}
                  zoom={13}
                  heightClass="h-96 w-full"
                  zonesOverlay={(zones || [])
                    .filter(z => z && z.id)
                    .map(z => ({
                      id: z.id,
                      name: z.name || 'Delivery Zone',
                      bn_name: z.bn_name,
                      center: [
                        typeof z.center_latitude === 'number' && !isNaN(z.center_latitude) ? z.center_latitude : 22.3590,
                        typeof z.center_longitude === 'number' && !isNaN(z.center_longitude) ? z.center_longitude : 91.8380
                      ],
                      radiusKm: typeof z.radius_km === 'number' && !isNaN(z.radius_km) ? z.radius_km : 3.0,
                      color: z.color || '#E11D48',
                      isActive: z.is_active !== false
                    }))}
                  selectedZoneId={selectedMapZoneId || undefined}
                  onZoneClick={(zid) => setSelectedMapZoneId(zid)}
                  markers={(riders || [])
                    .filter(r => r && r.is_online && !r.is_paused && typeof r.current_latitude === 'number' && typeof r.current_longitude === 'number' && !isNaN(r.current_latitude) && !isNaN(r.current_longitude))
                    .map(r => ({
                      id: r.id,
                      latitude: r.current_latitude,
                      longitude: r.current_longitude,
                      title: `${r.name || 'Rider'} (${r.zone || 'Zone Unassigned'})`,
                      subtitle: `Phone: ${r.phone || 'N/A'} • ${r.vehicle_type || 'Vehicle'}`,
                      type: 'rider'
                    }))}
                  showControls={true}
                  showFullscreenButton={true}
                  showRecenterButton={true}
                />
              </div>
            </div>

            {/* Zones Grid & Search Filter */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={zoneSearch}
                    onChange={(e) => setZoneSearch(e.target.value)}
                    placeholder="Search zones by name, Bengali name, or area..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 shadow-xs"
                  />
                </div>

                <span className="text-xs font-bold text-slate-500 self-center">
                  Showing {filteredZones.length} of {zones.length} zones
                </span>
              </div>

              {filteredZones.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">No Delivery Zones Found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {zoneSearch ? 'Try a different search query' : 'Create your first delivery zone to assign riders and vendors.'}
                  </p>
                  <button
                    onClick={handleOpenAddZone}
                    className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    + Add First Zone
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(filteredZones || []).map(zone => {
                    if (!zone || !zone.id) return null;
                    const zoneNameClean = (zone.name || '').trim().toLowerCase();
                    const zoneRiders = (riders || []).filter(r => r && (r.zone || '').trim().toLowerCase() === zoneNameClean);
                    const onlineRiders = zoneRiders.filter(r => r && r.is_online && !r.is_paused);
                    const zoneVendors = (vendors || []).filter(v => v && (v.zone || '').trim().toLowerCase() === zoneNameClean);
                    const isSelected = selectedMapZoneId === zone.id;
                    const zoneColor = zone.color || '#E11D48';

                    return (
                      <div
                        key={zone.id}
                        className={`bg-white border rounded-3xl p-5 shadow-xs space-y-4 transition hover:shadow-md relative ${
                          isSelected ? 'border-2 ring-2 ring-rose-400/30' : 'border-slate-200/90'
                        }`}
                        style={{ borderLeftColor: zoneColor, borderLeftWidth: '6px' }}
                      >
                        {/* Zone Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                                style={{ backgroundColor: zoneColor }}
                              />
                              <h4 className="font-black text-slate-900 text-sm">
                                {zone.name}
                              </h4>
                            </div>
                            {zone.bn_name && (
                              <p className="text-xs font-bold text-slate-500 mt-0.5 ml-5">
                                {zone.bn_name}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleZoneActive(zone.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition ${
                              zone.is_active !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {zone.is_active !== false ? '● Active' : '○ Inactive'}
                          </button>
                        </div>

                        {/* Description / Coverage Details */}
                        {zone.description && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl line-clamp-2">
                            {zone.description}
                          </p>
                        )}

                        {/* Geographic Center & Coverage Radius */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Coverage Radius</span>
                            <span className="text-slate-900 font-extrabold">{zone.radius_km || 3.0} KM</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Center Lat/Lng</span>
                            <span className="font-mono text-[11px] text-slate-700 truncate block">
                              {(zone.center_latitude || 22.3590).toFixed(4)}, {(zone.center_longitude || 91.8380).toFixed(4)}
                            </span>
                          </div>
                        </div>

                        {/* Assigned Fleet & Vendors Metric */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                            <div className="flex items-center space-x-1 text-blue-800 text-[10px] uppercase font-black">
                              <Bike className="w-3.5 h-3.5" />
                              <span>Zone Riders</span>
                            </div>
                            <div className="mt-1 flex items-baseline space-x-1.5">
                              <span className="text-base font-black text-blue-950">{zoneRiders.length}</span>
                              <span className="text-[10px] font-bold text-emerald-700">
                                ({onlineRiders.length} Online)
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-2xl">
                            <div className="flex items-center space-x-1 text-amber-800 text-[10px] uppercase font-black">
                              <Store className="w-3.5 h-3.5" />
                              <span>Zone Vendors</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-base font-black text-amber-950">{zoneVendors.length}</span>
                              <span className="text-[10px] font-bold text-slate-500 ml-1">merchants</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMapZoneId(zone.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Locate</span>
                          </button>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditZone(zone)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                              title="Edit Zone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
                                  deleteZone(zone.id);
                                }
                              }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                              title="Delete Zone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
          <div className="fixed inset-0 z-50 bg-gray-50 text-slate-900 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
            
            {/* Header Bar with Back Arrow & Boost Vendor Toggle */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => setSelectedVendorForProfile(null)}
                  className="h-7 px-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-[11px] rounded-lg transition-all duration-150 flex items-center space-x-1 border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs active:scale-95 group"
                  title="Back to Vendors List"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                  <span>Back</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-base tracking-tight leading-none">{selectedVendorForProfile.name}</h2>
                    <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md mt-1 inline-block">
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
                  className={`px-3 sm:px-4 py-2 font-black text-xs rounded-2xl transition flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95 ${
                    selectedVendorForProfile.is_boosted 
                      ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white border border-amber-300 shadow-amber-500/20' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{selectedVendorForProfile.is_boosted ? '🔥 Boosted' : 'Boost Vendor'}</span>
                </button>

                <button
                  onClick={() => setSelectedVendorForProfile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
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
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-mono font-bold text-slate-900 text-base">{selectedVendorForProfile.phone}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Zone</span>
                  <span className="font-extrabold text-rose-600 text-base">{selectedVendorForProfile.zone}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cuisine Specialty</span>
                  <span className="font-bold text-slate-900 text-base">{selectedVendorForProfile.cuisine}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating & Prep Time</span>
                  <span className="font-black text-amber-600 text-base">⭐ {selectedVendorForProfile.rating} &bull; {selectedVendorForProfile.estimated_prep_time_minutes} mins</span>
                </div>
              </div>

              {/* Popular Serial & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-slate-900 text-xs font-bold">{selectedVendorForProfile.address}</p>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Popular Brands Ranking (1-5 Serial)</span>
                    <p className="text-slate-400 text-[11px]">Controls order in home page Popular Brands slider</p>
                  </div>
                  <select
                    value={selectedVendorForProfile.featured_position || 0}
                    onChange={(e) => {
                      const pos = Number(e.target.value);
                      updateVendor(selectedVendorForProfile.id, { featured_position: pos > 0 ? pos : undefined });
                      setSelectedVendorForProfile(prev => prev ? { ...prev, featured_position: pos > 0 ? pos : undefined } : null);
                    }}
                    className="bg-white border border-orange-300 rounded-xl px-3 py-1.5 font-bold text-orange-600 text-xs focus:outline-hidden cursor-pointer"
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
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Flame className="w-5 h-5 fill-orange-500" />
                    <h3 className="font-black text-sm uppercase tracking-wider">Top Banner Boost Customization</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-orange-800 font-bold uppercase">Banner Offer Heading Title:</label>
                      <input
                        type="text"
                        value={selectedVendorForProfile.boost_banner_title || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateVendor(selectedVendorForProfile.id, { boost_banner_title: val });
                          setSelectedVendorForProfile(prev => prev ? { ...prev, boost_banner_title: val } : null);
                        }}
                        placeholder="e.g. Welcome back! Enjoy 35% off & free delivery"
                        className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-orange-800 font-bold uppercase">Banner Subtitle / Offer Details:</label>
                      <input
                        type="text"
                        value={selectedVendorForProfile.boost_banner_subtitle || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateVendor(selectedVendorForProfile.id, { boost_banner_subtitle: val });
                          setSelectedVendorForProfile(prev => prev ? { ...prev, boost_banner_subtitle: val } : null);
                        }}
                        placeholder="e.g. Special discounts on all menu items"
                        className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Food Menu List */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                    <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                    <span>Restaurant Food Menu ({vendorMenuItems.length} Items)</span>
                  </h3>
                </div>

                {vendorMenuItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                    No menu items added for this restaurant yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendorMenuItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs hover:border-slate-300 transition"
                      >
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'} 
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-black text-slate-900 text-xs truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-500 block">{item.category}</span>
                          <span className="text-emerald-600 font-mono font-black text-xs block">৳{item.price}</span>
                          
                          <button
                            onClick={() => toggleMenuItemAvailability(item.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition ${
                              item.is_available 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
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
      {selectedRiderForProfile && (() => {
        // Always bind to the live rider in riders state so updates are reflected in real-time
        const rider = riders.find(r => r.id === selectedRiderForProfile.id) || selectedRiderForProfile;
        const lat = Number.isFinite(Number(rider.current_latitude)) ? Number(rider.current_latitude) : 22.3590;
        const lng = Number.isFinite(Number(rider.current_longitude)) ? Number(rider.current_longitude) : 91.8380;
        const isOnline = Boolean(rider.is_online);
        const isPaused = Boolean(rider.is_paused);

        return (
          <div className="fixed inset-0 z-50 bg-gray-50 text-slate-900 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
            
            {/* Top Fullscreen Header with Sleek Back Arrow Button */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => setSelectedRiderForProfile(null)}
                  className="h-7 px-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-[11px] rounded-lg transition-all duration-150 flex items-center space-x-1 border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs active:scale-95 group"
                  title="Back to Admin Panel"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                  <span>Back</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                <div className="flex items-center space-x-3">
                  <img
                    src={rider.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                    alt={rider.name}
                    className="w-10 h-10 rounded-2xl object-cover border border-rose-200 shadow-xs"
                  />
                  <div>
                    <h2 className="font-black text-slate-900 text-base tracking-tight leading-none">{rider.name}</h2>
                    <span className="text-[10px] font-mono font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md mt-1 inline-block">
                      ID: {rider.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Pause / Resume Rider Button */}
                <button
                  type="button"
                  onClick={() => toggleRiderPause(rider.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition shadow-2xs ${
                    isPaused 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  }`}
                  title={isPaused ? 'Resume Rider' : 'Pause Rider'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPaused ? 'Resume Rider' : 'Pause Rider'}</span>
                </button>

                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center space-x-1.5 ${
                  isPaused 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : isOnline 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs shadow-emerald-500/20' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isOnline && !isPaused && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  )}
                  <span>
                    {isPaused ? 'PAUSED BY ADMIN' : isOnline ? 'ONLINE ON DUTY' : 'OFFLINE'}
                  </span>
                </span>

                <button
                  onClick={() => setSelectedRiderForProfile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
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
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-mono font-bold text-slate-900 text-base">{rider.phone}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Zone</span>
                  <span className="font-extrabold text-pink-600 text-base">{rider.zone}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
                  <span className="font-bold text-slate-900 text-base">{rider.vehicle_type}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Float Cash Held (COD)</span>
                  <span className="font-mono font-black text-emerald-600 text-lg">৳{Number(rider.cash_in_hand || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Address & Status Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Home Address Base</span>
                  <p className="font-bold text-slate-900 text-sm">{rider.home_address || 'Chittagong'}</p>
                </div>

                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last GPS Beacon</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {rider.last_location_updated_at ? (
                      <span className="text-emerald-600">
                        {new Date(rider.last_location_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (Updated)
                      </span>
                    ) : (
                      <span className="text-slate-400">Awaiting first GPS beacon</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Live Location Map Section */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                      <span>Rider Live GPS Tracking Map</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Current Coordinates: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsRiderMapFullscreen(true)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs active:scale-95"
                      title="Expand Fullscreen GPS Tracking Map"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Fullscreen Map</span>
                    </button>

                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isOnline ? '● Live Location Active' : '○ Rider Offline'}
                    </span>
                  </div>
                </div>

                {/* Fullscreen & Interactive Map Box */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <InteractiveMap
                    center={[lat, lng]}
                    zoom={16}
                    heightClass="h-96 md:h-[520px]"
                    showControls={true}
                    showFullscreenButton={true}
                    showRecenterButton={true}
                    onFullscreenToggle={() => setIsRiderMapFullscreen(true)}
                    markers={[
                      {
                        id: rider.id,
                        latitude: lat,
                        longitude: lng,
                        title: `${rider.name} (Live GPS)`,
                        subtitle: `${rider.zone} • ${rider.vehicle_type} • ${isOnline ? 'Online' : 'Offline'}`,
                        type: 'rider'
                      }
                    ]}
                  />
                </div>
              </div>

            </main>
          </div>
        );
      })()}

      {/* 
        ========================================================================
        FULLSCREEN RIDER GPS TRACKING MAP VIEW
        ========================================================================
      */}
      {isRiderMapFullscreen && selectedRiderForProfile && (() => {
        const rider = riders.find(r => r.id === selectedRiderForProfile.id) || selectedRiderForProfile;
        const lat = Number.isFinite(Number(rider.current_latitude)) ? Number(rider.current_latitude) : 22.3590;
        const lng = Number.isFinite(Number(rider.current_longitude)) ? Number(rider.current_longitude) : 91.8380;
        const isOnline = Boolean(rider.is_online);
        const isPaused = Boolean(rider.is_paused);

        return (
          <div className="fixed inset-0 z-[100] bg-white text-slate-900 w-screen h-screen flex flex-col font-sans select-none animate-in fade-in">
            {/* Top Toolbar */}
            <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs z-30 shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRiderMapFullscreen(false)}
                  className="h-7 px-2.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-[11px] rounded-lg transition-all flex items-center space-x-1 border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs active:scale-95 group"
                  title="Exit Fullscreen"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                  <span>Back</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                <div className="flex items-center space-x-2.5">
                  <img
                    src={rider.photo_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                    alt={rider.name}
                    className="w-8 h-8 rounded-xl object-cover border border-rose-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-slate-900 text-sm leading-tight">{rider.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-pink-600 bg-pink-50 border border-pink-200 px-1.5 py-0.2 rounded">
                        {rider.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Zone: {rider.zone} &bull; Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase flex items-center space-x-1.5 ${
                  isPaused 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : isOnline 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isOnline && !isPaused && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  )}
                  <span>
                    {isPaused ? 'PAUSED BY ADMIN' : isOnline ? 'ONLINE ON DUTY' : 'OFFLINE'}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsRiderMapFullscreen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Exit Fullscreen Map"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </button>
              </div>
            </header>

            {/* Viewport Map (100% full screen) */}
            <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50">
              <InteractiveMap
                center={[lat, lng]}
                zoom={16}
                heightClass="h-full"
                showControls={true}
                showFullscreenButton={false}
                showRecenterButton={true}
                markers={[
                  {
                    id: rider.id,
                    latitude: lat,
                    longitude: lng,
                    title: `${rider.name} (Live GPS Tracking)`,
                    subtitle: `${rider.zone} • ${rider.vehicle_type} • ${isOnline ? 'Online' : 'Offline'}`,
                    type: 'rider'
                  }
                ]}
              />
            </div>
          </div>
        );
      })()}

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
          <div className="fixed inset-0 z-50 bg-gray-50 text-slate-900 min-h-screen w-full overflow-y-auto font-sans selection:bg-rose-500 selection:text-white animate-in fade-in">
            
            {/* Top Header with Sleek Back Arrow Button */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="h-7 px-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-[11px] rounded-lg transition-all duration-150 flex items-center space-x-1 border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs active:scale-95 group"
                  title="Back to Orders Stream"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                  <span>Back</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-rose-600 text-base">{selectedOrderForDetails.order_code}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(selectedOrderForDetails.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold truncate">
                    {ordVendor?.name || 'Restaurant'} &bull; {selectedOrderForDetails.customer_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Admin Order Status Override Dropdown */}
                <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase hidden md:inline">Status:</span>
                  <select
                    value={selectedOrderForDetails.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      updateOrderStatus(selectedOrderForDetails.id, newStatus);
                      setSelectedOrderForDetails(prev => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="bg-transparent text-slate-900 font-black text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="pending" className="bg-white text-amber-600">PENDING</option>
                    <option value="vendor_accepted" className="bg-white text-blue-600">VENDOR ACCEPTED</option>
                    <option value="food_preparing" className="bg-white text-orange-600">KITCHEN PREPARING</option>
                    <option value="ready_for_pickup" className="bg-white text-yellow-600">READY FOR PICKUP</option>
                    <option value="rider_assigned" className="bg-white text-purple-600">RIDER ASSIGNED</option>
                    <option value="rider_on_way_to_customer" className="bg-white text-cyan-600">ON THE WAY</option>
                    <option value="delivered" className="bg-white text-emerald-600">DELIVERED</option>
                    <option value="cancelled" className="bg-white text-red-600">CANCELLED</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
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
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-2.5">
                    <User className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Customer Details</h3>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold">
                    <p className="text-slate-900 text-sm font-black">{selectedOrderForDetails.customer_name}</p>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-sm text-emerald-600">{selectedOrderForDetails.customer_phone}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedOrderForDetails.delivery_address}</span>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono">
                      Zone: {selectedOrderForDetails.zone || 'Chawkbazar Zone'}
                    </span>
                  </div>
                </div>

                {/* 2. Vendor / Restaurant Details */}
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-orange-600 border-b border-slate-100 pb-2.5">
                    <Store className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Vendor Details</h3>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold">
                    <p className="text-slate-900 text-sm font-black">{ordVendor?.name || 'Restaurant'}</p>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-sm text-emerald-600">{ordVendor?.phone || 'N/A'}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{ordVendor?.cuisine}</p>
                    <p className="text-slate-600 text-[11px] truncate">{ordVendor?.address}</p>
                  </div>
                </div>

                {/* 3. Assigned Rider Details */}
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-pink-600 border-b border-slate-100 pb-2.5">
                    <Bike className="w-4 h-4" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Assigned Rider Details</h3>
                  </div>
                  {ordRider ? (
                    <div className="space-y-1.5 text-xs font-bold">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-900 text-sm font-black">{ordRider.name}</p>
                        <span className="px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-mono rounded-md">
                          {ordRider.id.length > 12 ? `${ordRider.id.slice(0, 8)}...` : ordRider.id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-sm text-emerald-600">{ordRider.phone}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">Vehicle: {ordRider.vehicle_type} &bull; Zone: {ordRider.zone}</p>
                      <p className="text-emerald-600 font-mono text-[11px]">Float Cash Held: ৳{ordRider.cash_in_hand}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-500 font-bold text-xs text-center space-y-1 border border-slate-200">
                      <p>No rider assigned yet.</p>
                      <p className="text-[10px] text-amber-600">Dispatch system searching proximity riders within 1 km radius...</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Food Items & Pricing Breakup Table */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>Order Items & Pricing Financial Breakup</span>
                </h3>

                {/* Items List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-bold">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                        <th className="p-3 rounded-l-xl">Food Item Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3 text-right rounded-r-xl">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {(selectedOrderForDetails.items || []).map((itm, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-extrabold text-slate-900">{itm.item_name}</td>
                          <td className="p-3 font-mono text-rose-600 font-black">x{itm.quantity}</td>
                          <td className="p-3 font-mono">৳{itm.item_price}</td>
                          <td className="p-3 font-mono text-right text-emerald-600 font-black">৳{itm.subtotal || (itm.item_price * itm.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Price Breakdown Footer */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block">Food Items Subtotal</span>
                    <span className="text-slate-900 font-mono text-base font-black">৳{selectedOrderForDetails.food_total}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block">Distance Delivery Fee ({selectedOrderForDetails.delivery_distance_km.toFixed(1)} km)</span>
                    <span className="text-rose-600 font-mono text-base font-black">৳{selectedOrderForDetails.delivery_fee}</span>
                  </div>

                  <div className="space-y-0.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase block">Total Payable Cash (COD)</span>
                    <span className="text-emerald-700 font-mono text-xl font-black">৳{selectedOrderForDetails.total_cash_payable}</span>
                  </div>
                </div>
              </div>

              {/* Live Location Map (Vendor, Customer, Rider) */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                      <span>Live Order GPS Dispatch Map</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing Vendor Pickup 🏪, Customer Address 🏠, and Live Rider 🛵 Pin Point.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
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
        MODAL: CREATE / EDIT DELIVERY & RIDER ZONE
        ========================================================================
      */}
      {/* 
        ========================================================================
        FULLSCREEN VIEW: CREATE / EDIT DELIVERY & RIDER ZONE
        ========================================================================
      */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header Bar */}
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <button 
                onClick={() => {
                  setIsAddZoneOpen(false);
                  setEditingZone(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {editingZone ? 'Edit Delivery Zone' : 'Create New Delivery Zone'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Rider Dispatch Boundary Configuration
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSaveZoneSubmit}
              form="zone-form"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95"
            >
              {editingZone ? 'Update Zone' : 'Save Zone'}
            </button>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
              <form id="zone-form" onSubmit={handleSaveZoneSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
                    <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-rose-600" />
                      <span>Zone Identity & Details</span>
                    </h4>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                          Zone Name (English) *
                        </label>
                        <input
                          type="text"
                          value={zName}
                          onChange={(e) => setZName(e.target.value)}
                          placeholder="e.g. Chawkbazar Zone"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500 shadow-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                          Bangla Name (বাংলা নাম)
                        </label>
                        <input
                          type="text"
                          value={zBnName}
                          onChange={(e) => setZBnName(e.target.value)}
                          placeholder="e.g. চকবাজার জোন"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 shadow-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                          Description & Coverage Areas
                        </label>
                        <textarea
                          value={zDescription}
                          onChange={(e) => setZDescription(e.target.value)}
                          placeholder="e.g. Parade Square, Chatteshwari, Gani Bakery, DC Hill"
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 shadow-xs resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                    <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      <span>Visual Identity</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                        Select Zone Map Color Theme
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          { code: '#E11D48', label: 'Rose' },
                          { code: '#2563EB', label: 'Blue' },
                          { code: '#059669', label: 'Emerald' },
                          { code: '#D97706', label: 'Amber' },
                          { code: '#7C3AED', label: 'Purple' },
                          { code: '#0D9488', label: 'Teal' },
                          { code: '#4F46E5', label: 'Indigo' },
                          { code: '#EA580C', label: 'Orange' },
                          { code: '#0891B2', label: 'Cyan' },
                        ].map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => setZColor(c.code)}
                            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                              zColor === c.code ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.code }}
                            title={c.label}
                          >
                            {zColor === c.code && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Map & Geometry */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                        <Crosshair className="w-4 h-4 text-rose-600" />
                        <span>Geographic Boundary</span>
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg font-mono text-[10px] text-slate-600">
                          {zLat.toFixed(5)}, {zLng.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Full Map Picker Interaction */}
                      <div className="rounded-2xl overflow-hidden border border-slate-200 h-[320px] w-full shadow-inner relative group">
                        <InteractiveMap
                          center={[zLat, zLng]}
                          zoom={13}
                          heightClass="h-full w-full"
                          radiusCircle={{
                            center: [zLat, zLng],
                            radiusMeters: zRadiusKm * 1000,
                            color: zColor,
                            label: `${zName || 'Zone'} Boundary (${zRadiusKm} KM)`
                          }}
                          onMapClick={(lat, lng) => {
                            setZLat(lat);
                            setZLng(lng);
                          }}
                          showControls={true}
                          showFullscreenButton={false}
                          showRecenterButton={true}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click map to set center point
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between text-xs font-black">
                          <label className="text-[10px] text-slate-700 uppercase tracking-widest">
                            Coverage Radius (কভারেজ রেডিয়াস)
                          </label>
                          <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs shadow-xs">
                            {zRadiusKm} KM
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="20.0"
                          step="0.5"
                          value={zRadiusKm}
                          onChange={(e) => setZRadiusKm(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                          <span>0.5 KM</span>
                          <span>10.0 KM</span>
                          <span>20.0 KM</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 block uppercase font-bold">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={zLat}
                            onChange={(e) => setZLat(parseFloat(e.target.value) || 22.3590)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 block uppercase font-bold">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={zLng}
                            onChange={(e) => setZLng(parseFloat(e.target.value) || 91.8380)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black text-amber-950 uppercase">Zone Logic Notice</h5>
                      <p className="text-[11px] text-amber-800 font-medium leading-relaxed mt-1">
                        Orders placed within this boundary will be routed exclusively to riders registered in this specific zone. Ensure coverage area is sufficient for vendor density.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </main>
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
                  {zones && zones.length > 0 ? (
                    zones.map((zone) => (
                      <option key={zone.id} value={zone.name}>
                        {zone.name} {zone.bn_name ? `(${zone.bn_name})` : ''} ({zone.radius_km || 3} KM)
                      </option>
                    ))
                  ) : (
                    DELIVERY_ZONES.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))
                  )}
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

            <form onSubmit={handleRegisterRiderSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl text-[11px] text-pink-900 font-medium">
                Admin only needs to register the rider's phone number! The rider will complete their name and set password from the Rider App.
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Rider Phone Number *</label>
                <input
                  type="tel"
                  value={rPhone}
                  onChange={(e) => setRPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-rose-500 text-sm"
                  required
                />
                <span className="text-[10px] text-slate-400">Rider will use this phone number to complete registration.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Rider Name (Optional - Rider can set this themselves)</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="Optional (e.g. Rahim)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Delivery Zone</label>
                  <select
                    value={rZone}
                    onChange={(e) => setRZone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {zones && zones.length > 0 ? (
                      zones.map((zone) => (
                        <option key={zone.id} value={zone.name}>
                          {zone.name} {zone.bn_name ? `(${zone.bn_name})` : ''} ({zone.radius_km || 3} KM)
                        </option>
                      ))
                    ) : (
                      DELIVERY_ZONES.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">Vehicle</label>
                  <select
                    value={rVehicle}
                    onChange={(e) => setRVehicle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Motorcycle">Motorcycle 🏍️</option>
                    <option value="Bicycle">Bicycle 🚲</option>
                    <option value="Scooter">Scooter 🛵</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
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
                  Add Rider
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
