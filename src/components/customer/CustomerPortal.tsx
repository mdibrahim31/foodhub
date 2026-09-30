import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
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
  ChevronRight, 
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  Store,
  User,
  Ticket,
  Banknote,
  ArrowRight,
  Flame,
  Check
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
    updateCartQuantity, 
    placeOrder,
    orders
  } = useDelivery();

  const [activeBottomNav, setActiveBottomNav] = useState<'food' | 'grocery' | 'search' | 'carts' | 'account'>('food');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedVendorForMenu, setSelectedVendorForMenu] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'rating' | 'distance' | 'fastest'>('popular');
  const [isRating4PlusOnly, setIsRating4PlusOnly] = useState(false);
  const [hasOfferOnly, setHasOfferOnly] = useState(false);
  const [activeCuisineFilter, setActiveCuisineFilter] = useState('All');
  
  // Checkout & Favorites
  const [favorites, setFavorites] = useState<string[]>(['a0000002-0000-0000-0000-000000000002']);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderInstructions, setOrderInstructions] = useState('');
  const [orderSuccessNotice, setOrderSuccessNotice] = useState<Order | null>(null);

  // Customer Coordinates
  const customerLat = selectedAddress?.latitude || 23.7915;
  const customerLng = selectedAddress?.longitude || 90.4072;

  const toggleFavorite = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  // Filtered and Sorted Vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = !isRating4PlusOnly || v.rating >= 4.0;
    const matchesCuisine = activeCuisineFilter === 'All' || v.cuisine.toLowerCase().includes(activeCuisineFilter.toLowerCase());
    return matchesSearch && matchesRating && matchesCuisine;
  }).sort((a, b) => {
    if (selectedSort === 'rating') return b.rating - a.rating;
    if (selectedSort === 'distance') {
      const distA = calculateDistanceKm(a.latitude, a.longitude, customerLat, customerLng);
      const distB = calculateDistanceKm(b.latitude, b.longitude, customerLat, customerLng);
      return distA - distB;
    }
    if (selectedSort === 'fastest') return a.estimated_prep_time_minutes - b.estimated_prep_time_minutes;
    return 0;
  });

  // Cart Calculations
  const foodTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartDistanceKm = cartVendor 
    ? calculateDistanceKm(cartVendor.latitude, cartVendor.longitude, customerLat, customerLng)
    : 0;
  const deliveryFee = cartVendor
    ? calculateDeliveryFee(cartDistanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge)
    : 0;
  const totalCashPayable = foodTotal + deliveryFee;
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

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
        setActiveBottomNav('account');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Food Categories Bubbles (Matching Image 1 with FoodHub color)
  const cuisineBubbles = [
    { label: 'All', icon: '🍽️', filter: 'All' },
    { label: 'Pizza', icon: '🍕', filter: 'Pizza' },
    { label: 'Burgers', icon: '🍔', filter: 'Burgers' },
    { label: 'Fast Food', icon: '🍗', filter: 'Fast Food' },
    { label: 'Bangladeshi', icon: '🐟', filter: 'Bangladeshi' },
    { label: 'Rice & Biryani', icon: '🍚', filter: 'Biryani' },
    { label: 'Snacks', icon: '🥪', filter: 'Snacks' },
    { label: 'Dessert', icon: '🍰', filter: 'Dessert' },
  ];

  // Quick Services Row (FoodHub Orange Palette)
  const serviceShortcuts = [
    { label: 'Offers', badge: '%', badgeBg: 'bg-orange-500', icon: '🏷️' },
    { label: 'Mart', icon: '🛒' },
    { label: 'Pick-up', badge: 'Up to -25%', badgeBg: 'bg-amber-600', icon: '🛍️' },
    { label: 'Health', icon: '🧴' },
    { label: 'Dine-in', icon: '🍽️' },
  ];

  // Discounted dishes data
  const promoDishes = [
    {
      id: 'pd-1',
      name: 'Plain Khichuri',
      vendor: "Sharia's Kitchen",
      rating: 3.9,
      prepTime: '60-85 mins',
      discountedPrice: 60,
      originalPrice: 70,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000006-0000-0000-0000-000000000006'
    },
    {
      id: 'pd-2',
      name: 'Set Menu - 3 (Khichuri + Chicken)',
      vendor: "Sharia's Kitchen",
      rating: 3.9,
      prepTime: '60-85 mins',
      discountedPrice: 170,
      originalPrice: 200,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000006-0000-0000-0000-000000000006'
    },
    {
      id: 'pd-3',
      name: 'Loaded Doner Shawarma',
      vendor: 'Snackza',
      rating: 4.5,
      prepTime: '30-40 mins',
      discountedPrice: 180,
      originalPrice: 210,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000002-0000-0000-0000-000000000002'
    },
    {
      id: 'pd-4',
      name: "Sultan's Kacchi Special",
      vendor: "Sultan's Dine",
      rating: 4.8,
      prepTime: '25-35 mins',
      discountedPrice: 380,
      originalPrice: 420,
      discountText: 'Special Deal',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000001-0000-0000-0000-000000000001'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* 1. TOP APP BAR MATCHING SCREENSHOT EXACTLY (White background + Orange FoodHub Logo + Orange Cart Pill) */}
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo from user screenshot: Fork/Knife Icon + FoodHub in bold orange */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 cursor-pointer">
                <UtensilsCrossed className="w-6 h-6 text-orange-500 stroke-[2.5]" />
                <span className="text-xl sm:text-2xl font-black tracking-tight text-orange-500">
                  FoodHub
                </span>
              </div>

              {/* Location Badge */}
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded-full text-xs font-bold hover:bg-orange-100 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span className="max-w-[140px] truncate">{selectedAddress?.address_line || 'Chittagong'}</span>
                <ChevronDown className="w-3 h-3 text-orange-400" />
              </button>
            </div>

            {/* Right: Cart Pill Badge from user screenshot [ 🛍️ 0 ] in orange */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 text-orange-500 stroke-[2.2]" />
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                  {totalCartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Address selector bar */}
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="sm:hidden mt-2.5 flex items-center justify-between px-3 py-1.5 bg-orange-50/70 border border-orange-100 rounded-xl cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">{selectedAddress?.address_line || 'Tap to select delivery location'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-6">

        {/* 2. HERO HEADER BANNER (Matching the burger hero with FoodHub warm colors) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/10 p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
            <div className="space-y-3 max-w-md">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-extrabold uppercase tracking-wide">
                <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                <span>Delivered Fast &bull; Cash On Delivery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight drop-shadow-xs">
                Explore top-rated restaurants & hot deals right at your fingertips
              </h2>
              <p className="text-xs sm:text-sm text-orange-50 font-medium">
                Live distance-based delivery fee: {settings.currency_symbol}{settings.base_delivery_charge} base + {settings.currency_symbol}{settings.per_km_delivery_charge}/km
              </p>
            </div>

            {/* Burger Hero Graphic */}
            <div className="relative shrink-0 w-44 h-36 sm:w-56 sm:h-44">
              <img 
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80" 
                alt="Juicy FoodHub Burger" 
                className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/40 transform hover:scale-105 transition duration-300"
              />
              <span className="absolute -bottom-2 -left-2 bg-slate-900/90 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md">
                ⭐ 4.8 Rating
              </span>
            </div>
          </div>

          {/* Search bar inside banner (Matching screenshot) */}
          <div className="mt-5 relative z-10">
            <div className="relative">
              <Search className="w-5 h-5 text-orange-500 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search restaurants or food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-sm font-semibold shadow-lg focus:outline-hidden focus:ring-3 focus:ring-orange-300 transition"
              />
            </div>
          </div>
        </section>

        {/* 3. QUICK SERVICE SHORTCUTS (FoodHub Orange Accent) */}
        <section className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
          {serviceShortcuts.map((svc) => (
            <div 
              key={svc.label}
              onClick={() => {
                if (svc.label === 'Offers') setHasOfferOnly(prev => !prev);
              }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xs border border-orange-100 hover:border-orange-300 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                {svc.badge && (
                  <span className={`absolute -top-1.5 -right-1 px-1.5 py-0.2 ${svc.badgeBg} text-white font-black text-[9px] rounded-full shadow-xs whitespace-nowrap`}>
                    {svc.badge}
                  </span>
                )}
                <span>{svc.icon}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight group-hover:text-orange-600 transition">
                {svc.label}
              </span>
            </div>
          ))}
        </section>

        {/* 4. CUISINE BUBBLES HORIZONTAL SCROLL (FoodHub Theme) */}
        <section className="space-y-2">
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none">
            {cuisineBubbles.map((c) => {
              const isSelected = activeCuisineFilter === c.filter;
              return (
                <button
                  key={c.label}
                  onClick={() => setActiveCuisineFilter(c.filter)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl shrink-0 transition-all font-bold text-xs ${
                    isSelected 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105' 
                      : 'bg-white hover:bg-orange-50/50 text-slate-700 border border-orange-100'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. VERTICAL PROMOTIONAL DEAL POSTER CARDS */}
        <section className="space-y-3">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {/* Sultan's Dine Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("Sultan"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-52 sm:w-56 rounded-3xl bg-gradient-to-b from-orange-950 via-slate-900 to-slate-900 text-white p-4 relative overflow-hidden shadow-md cursor-pointer group border border-orange-900/40"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-orange-500 text-white font-black text-[10px] rounded-md">
                  Sultan's Dine
                </span>
                <span className="text-[10px] font-mono text-amber-300">Popular</span>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-black leading-tight text-white">Up to 40% off</h3>
                <p className="text-xs font-bold text-orange-400 mt-0.5">+ free delivery</p>
              </div>
              <div className="mt-4 h-28 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80" 
                  alt="Kacchi" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">T&Cs apply &bull; Cash On Delivery</p>
            </div>

            {/* PizzaBurg Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("PizzaBurg"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-52 sm:w-56 rounded-3xl bg-gradient-to-b from-amber-950 via-slate-900 to-slate-900 text-white p-4 relative overflow-hidden shadow-md cursor-pointer group border border-amber-900/40"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-md">
                  PizzaBurg
                </span>
                <span className="text-[10px] font-mono text-orange-300">Cheesy</span>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-black leading-tight text-white">Up to 40% off</h3>
                <p className="text-xs font-bold text-amber-400 mt-0.5">+ free delivery</p>
              </div>
              <div className="mt-4 h-28 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80" 
                  alt="Pizza" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">T&Cs apply &bull; Cash On Delivery</p>
            </div>

            {/* Snackza Shawarma Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("Snackza"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-52 sm:w-56 rounded-3xl bg-gradient-to-b from-orange-900 via-slate-900 to-slate-900 text-white p-4 relative overflow-hidden shadow-md cursor-pointer group border border-orange-800/40"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-orange-400 text-slate-950 font-black text-[10px] rounded-md">
                  Snackza
                </span>
                <span className="text-[10px] font-mono text-orange-200">Doner</span>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-black leading-tight text-white">Flat 35% off</h3>
                <p className="text-xs font-bold text-orange-300 mt-0.5">Use: back4more</p>
              </div>
              <div className="mt-4 h-28 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80" 
                  alt="Shawarma" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 font-mono">T&Cs apply &bull; Cash On Delivery</p>
            </div>
          </div>
        </section>

        {/* 6. POPULAR RESTAURANTS SECTION (FoodHub Orange Accents) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Popular Restaurants</h2>
            <button 
              onClick={() => setActiveCuisineFilter('All')}
              className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4 overflow-x-auto pb-3 scrollbar-none">
            {vendors.slice(0, 3).map((v) => {
              const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
              const fee = calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
              const isFav = favorites.includes(v.id);

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendorForMenu(v)}
                  className="shrink-0 w-72 sm:w-80 bg-white rounded-3xl border border-orange-100/80 overflow-hidden shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                >
                  {/* Image with PRO badge and Heart */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={v.cover_image} 
                      alt={v.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={(e) => toggleFavorite(v.id, e)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-600 hover:text-orange-500 transition"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-orange-500 text-orange-500' : ''}`} />
                    </button>

                    {/* Pro tag banner */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2.5 flex items-center justify-between text-white">
                      <span className="text-[11px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" /> PRO 40% off selected
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 font-bold">
                        {distanceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{v.name}</h3>
                      <div className="flex items-center space-x-1 text-xs font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{v.rating} (1k+)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      From {v.estimated_prep_time_minutes} min &bull; ৳৳ &bull; {v.cuisine}
                    </p>

                    {/* Delivery Charge Line */}
                    <div className="flex items-center space-x-2 text-xs text-slate-700">
                      <span className="text-slate-400 line-through">Tk{fee + 15}</span>
                      <span className="font-black text-orange-600">Tk{fee} COD Fee</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-orange-700 font-bold bg-orange-50 px-1.5 py-0.2 rounded border border-orange-100">Fast Cash</span>
                    </div>

                    {/* Voucher pill */}
                    <div className="pt-1">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[11px] font-bold">
                        <Ticket className="w-3 h-3 text-orange-500" />
                        <span>35% off Tk. 299: back4more</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. DISHES UP TO 15% OFF SECTION */}
        <section className="space-y-3 bg-orange-50/60 p-4 sm:p-5 rounded-3xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="p-1 bg-orange-500 text-white rounded-md text-xs font-black">%</span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Dishes up to 15% off</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Minimum spend applies &bull; Direct COD</p>
            </div>
            <button 
              onClick={() => setActiveCuisineFilter('All')}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-xs hover:bg-orange-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {promoDishes.map((dish) => (
              <div 
                key={dish.id}
                onClick={() => {
                  const v = vendors.find(x => x.id === dish.vendorId);
                  if (v) setSelectedVendorForMenu(v);
                }}
                className="shrink-0 w-44 sm:w-48 bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group"
              >
                {/* Image + time */}
                <div className="relative h-32 w-full bg-slate-100">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                    {dish.prepTime}
                  </span>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[100px] font-medium">{dish.vendor}</span>
                    <span className="flex items-center gap-0.5 font-bold text-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {dish.rating}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{dish.name}</h4>

                  <div className="flex items-center space-x-1.5 text-xs font-black">
                    <span className="text-orange-600 font-mono">Tk{dish.discountedPrice}</span>
                    <span className="text-slate-400 line-through font-mono text-[11px]">Tk{dish.originalPrice}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 font-bold rounded">
                      {dish.discountText}
                    </span>
                    <span className="text-orange-700 font-bold">🛵 COD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. DOMINO'S PIZZA MEATMAXXX PROMO BANNER */}
        <section 
          onClick={() => {
            const v = vendors.find(x => x.name.includes("Domino"));
            if (v) setSelectedVendorForMenu(v);
          }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-5 shadow-lg border border-orange-400/30 cursor-pointer group"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 z-10">
              <span className="text-xs font-black text-amber-200 tracking-wider uppercase">Domino's Pizza</span>
              <h3 className="text-2xl font-black tracking-tight text-white">GET 40% OFF*</h3>
              <p className="text-xs text-orange-100">Exclusively for FoodHub Pro & COD Deliveries</p>
              <button className="mt-2 px-4 py-1.5 bg-white text-orange-600 rounded-xl text-xs font-black shadow-md hover:bg-orange-50 transition">
                ORDER NOW &rarr;
              </button>
            </div>
            <div className="w-36 h-28 sm:w-48 sm:h-32 rounded-2xl overflow-hidden border border-white/30">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80" 
                alt="Domino's MeatMaxxx" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
          <span className="absolute bottom-2 right-3 text-[9px] bg-slate-900/70 px-1.5 py-0.2 rounded text-slate-300 font-mono">Ad</span>
        </section>

        {/* 9. SHOP BY CATEGORY SECTION */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Shop by category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 text-center">
            {[
              { name: 'Grocery', icon: '🛍️' },
              { name: 'Convenience', icon: '🏪' },
              { name: 'Health & Beauty', icon: '🧴' },
              { name: 'Pet Shop', icon: '🥣' },
            ].map((cat) => (
              <div 
                key={cat.name}
                onClick={() => setSearchQuery(cat.name)}
                className="p-3 bg-white rounded-2xl border border-orange-100 shadow-xs hover:border-orange-400 hover:shadow-xs transition cursor-pointer flex flex-col items-center group"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-50/70 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-slate-700 mt-2 line-clamp-1">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 10. FILTER & SORT CHIPS BAR */}
        <section className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur-md py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => {
              setSelectedSort(prev => prev === 'popular' ? 'rating' : prev === 'rating' ? 'distance' : 'popular');
            }}
            className="p-2 bg-white rounded-full border border-orange-200 text-orange-600 shadow-xs hover:bg-orange-50 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedSort(prev => prev === 'popular' ? 'distance' : 'popular')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              selectedSort !== 'popular' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-700 border-orange-200'
            }`}
          >
            <span>Sort: {selectedSort}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setHasOfferOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              hasOfferOnly ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-700 border-orange-200'
            }`}
          >
            <span>Offers</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsRating4PlusOnly(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              isRating4PlusOnly ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-700 border-orange-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Ratings 4.0+</span>
          </button>
        </section>

        {/* 11. FEATURED & EXPLORE RESTAURANTS NEARBY (Matching Screenshot 'Featured Restaurants') */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Restaurants</h2>

          <div className="space-y-5">
            {filteredVendors.map((vendor) => {
              const distanceKm = calculateDistanceKm(vendor.latitude, vendor.longitude, customerLat, customerLng);
              const fee = calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
              const isFav = favorites.includes(vendor.id);

              return (
                <div
                  key={vendor.id}
                  onClick={() => setSelectedVendorForMenu(vendor)}
                  className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                >
                  {/* Big Cover Image */}
                  <div className="relative h-48 sm:h-56 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={vendor.cover_image} 
                      alt={vendor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={(e) => toggleFavorite(vendor.id, e)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-700 hover:text-orange-500 transition"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-orange-500 text-orange-500' : ''}`} />
                    </button>

                    {/* Pro Banner */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-3 flex items-center justify-between text-white">
                      <span className="text-xs font-black bg-orange-500 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> PRO 40% off selected
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {distanceKm} km away
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">{vendor.name}</h3>
                      <div className="flex items-center space-x-1 text-xs font-black text-slate-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{vendor.rating} (500+)</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-md text-xs font-extrabold">
                        {vendor.cuisine.split(',')[0]}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        &bull; {vendor.estimated_prep_time_minutes} min &bull; Price Match
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs pt-1">
                      <span className="text-slate-400 line-through">Tk{fee + 15}</span>
                      <span className="font-extrabold text-orange-600">Tk{fee} COD Fee</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-600 font-mono">{distanceKm} km direct</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[11px] font-bold">
                        <Ticket className="w-3 h-3 text-orange-500" />
                        <span>35% off Tk. 299: back4more</span>
                      </span>

                      <button 
                        onClick={() => setSelectedVendorForMenu(vendor)}
                        className="px-3.5 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-extrabold hover:bg-orange-600 transition shadow-xs"
                      >
                        View Menu &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ACTIVE LIVE ORDERS */}
        {orders.length > 0 && (
          <section className="bg-white rounded-3xl p-5 border border-orange-100 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Your Active COD Orders ({orders.length})</h2>
              <span className="text-xs font-mono text-orange-600 font-bold animate-pulse">● Live 5s Tracking</span>
            </div>

            <div className="space-y-3">
              {orders.slice(0, 2).map((ord) => (
                <div key={ord.id} className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900">Order #{ord.order_code}</span>
                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded-md font-bold text-[10px] uppercase">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Payable to Rider:</span>
                    <span className="font-mono font-black text-orange-600">{settings.currency_symbol}{ord.total_cash_payable}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Delivery to: {ord.delivery_address}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* RESTAURANT MENU MODAL */}
      {selectedVendorForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-40 bg-slate-900">
              <img 
                src={selectedVendorForMenu.cover_image} 
                alt={selectedVendorForMenu.name}
                className="w-full h-full object-cover opacity-80"
              />
              <button 
                onClick={() => setSelectedVendorForMenu(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/60 text-white flex items-center justify-center text-lg font-bold hover:bg-slate-950"
              >
                &times;
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-lg sm:text-xl font-black">{selectedVendorForMenu.name}</h3>
                <p className="text-xs text-orange-200 mt-0.5">{selectedVendorForMenu.cuisine} &bull; {selectedVendorForMenu.address}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Dishes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuItems
                  .filter((m) => m.vendor_id === selectedVendorForMenu.id)
                  .map((dish) => {
                    const cartItem = cart.find(ci => ci.menuItem.id === dish.id);
                    return (
                      <div 
                        key={dish.id}
                        className="p-3 border border-orange-100 rounded-2xl flex items-center justify-between gap-3 bg-white hover:border-orange-300 transition"
                      >
                        <div className="flex-1">
                          <h5 className="font-extrabold text-slate-900 text-xs">{dish.name}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{dish.description}</p>
                          <span className="font-mono font-black text-sm text-orange-600 mt-1 block">
                            {settings.currency_symbol}{dish.price}
                          </span>
                        </div>

                        {dish.image_url && (
                          <img src={dish.image_url} alt={dish.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}

                        <div>
                          {cartItem ? (
                            <div className="flex items-center space-x-1.5 bg-orange-50 border border-orange-300 rounded-lg p-1">
                              <button 
                                onClick={() => updateCartQuantity(dish.id, cartItem.quantity - 1)}
                                className="p-1 text-orange-800 hover:bg-orange-100 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-orange-950 px-1">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(dish, selectedVendorForMenu)}
                                className="p-1 text-orange-800 hover:bg-orange-100 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(dish, selectedVendorForMenu)}
                              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
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

            {/* Modal footer */}
            <div className="p-4 bg-orange-50/50 border-t border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{totalCartCount} items in cart</p>
                <p className="text-base font-black text-orange-600 font-mono">
                  {settings.currency_symbol}{foodTotal}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedVendorForMenu(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Close
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedVendorForMenu(null);
                      setIsCartOpen(true);
                    }}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 flex items-center gap-1.5"
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

      {/* CHECKOUT & CASH ON DELIVERY MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-orange-100 bg-orange-50/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Cash On Delivery Checkout</h3>
                  <p className="text-[11px] text-slate-500">Pay cash upon parcel delivery</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                &times;
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Restaurant source */}
              <div className="p-3 bg-orange-50/40 rounded-2xl text-xs flex justify-between items-center border border-orange-100">
                <div>
                  <span className="font-extrabold text-slate-900">{cartVendor?.name}</span>
                  <p className="text-slate-500">{cartVendor?.address}</p>
                </div>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartDistanceKm} km
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Items</span>
                {cart.map((ci) => (
                  <div key={ci.menuItem.id} className="flex justify-between items-center py-1 text-xs border-b border-slate-100">
                    <span className="font-medium text-slate-800">{ci.quantity}x {ci.menuItem.name}</span>
                    <span className="font-mono font-bold text-slate-900">{settings.currency_symbol}{ci.menuItem.price * ci.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Target Address */}
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-orange-950 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" /> Delivery Address
                  </span>
                  <button onClick={() => setIsAddressModalOpen(true)} className="text-orange-600 font-bold hover:underline">
                    Change Map Pin
                  </button>
                </div>
                <p className="text-slate-800 font-medium">{selectedAddress?.address_line}</p>
                {selectedAddress?.details && <p className="text-slate-500 text-[11px]">{selectedAddress.details}</p>}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Notes / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring doorbell, keep exact change ready"
                  value={orderInstructions}
                  onChange={(e) => setOrderInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* COD Breakdown */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Food Items Total:</span>
                  <span className="font-mono font-bold">{settings.currency_symbol}{foodTotal}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Delivery Charge ({cartDistanceKm} km):</span>
                  <span className="font-mono font-bold">{settings.currency_symbol}{deliveryFee}</span>
                </div>
                <div className="pt-2 border-t border-orange-300 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Cash to Pay Rider:</span>
                  <span className="font-mono text-orange-600 text-base font-black">{settings.currency_symbol}{totalCashPayable}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button 
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Back
              </button>
              <button
                disabled={isPlacingOrder}
                onClick={handleCheckout}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition disabled:opacity-50"
              >
                {isPlacingOrder ? 'Confirming...' : `Confirm Cash Order (${settings.currency_symbol}${totalCashPayable})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESS BOOK MAP PICKER MODAL */}
      <AddressBookModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />

      {/* BOTTOM FLOATING NAVIGATION DOCK (FoodHub Orange Matching Palette) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-orange-100 py-1.5 px-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Food */}
          <button
            onClick={() => setActiveBottomNav('food')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'food' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'food' ? 'bg-orange-100 text-orange-600' : ''}`}>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Food</span>
          </button>

          {/* Grocery */}
          <button
            onClick={() => {
              setActiveBottomNav('grocery');
              setSearchQuery('Grocery');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'grocery' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'grocery' ? 'bg-orange-100 text-orange-600' : ''}`}>
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Grocery</span>
          </button>

          {/* Search */}
          <button
            onClick={() => {
              setActiveBottomNav('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'search' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'search' ? 'bg-orange-100 text-orange-600' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Search</span>
          </button>

          {/* Carts */}
          <button
            onClick={() => {
              setActiveBottomNav('carts');
              setIsCartOpen(true);
            }}
            className={`relative flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'carts' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'carts' ? 'bg-orange-100 text-orange-600' : ''}`}>
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 bg-orange-500 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Carts</span>
          </button>

          {/* Account */}
          <button
            onClick={() => {
              setActiveBottomNav('account');
              setIsAddressModalOpen(true);
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'account' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'account' ? 'bg-orange-100 text-orange-600' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
