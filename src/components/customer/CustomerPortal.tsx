import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
import { calculateDistanceKm, calculateDeliveryFee } from '../../utils/geo';
import { Vendor, Order } from '../../types/database';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
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
  ArrowRight
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
        setIsCartOpen(false);
        setActiveBottomNav('account');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Cuisine Bubbles (Matching Image 1)
  const cuisineBubbles = [
    { label: 'Pizza', icon: '🍕', filter: 'Pizza', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80' },
    { label: 'Burgers', icon: '🍔', filter: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80' },
    { label: 'Fast Food', icon: '🍗', filter: 'Fast Food', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=120&auto=format&fit=crop&q=80' },
    { label: 'Bangladeshi', icon: '🐟', filter: 'Bangladeshi', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&auto=format&fit=crop&q=80' },
    { label: 'Rice', icon: '🍚', filter: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=80' },
  ];

  // Quick Services Row (Matching Image 1 top chips)
  const serviceShortcuts = [
    { label: 'Offers', badge: '%', badgeBg: 'bg-rose-500', icon: '🏷️' },
    { label: 'foodmart', icon: '🛒' },
    { label: 'Pick-up', badge: 'Up to -25%', badgeBg: 'bg-orange-600', icon: '🛍️' },
    { label: 'Health & Beauty', icon: '🧴' },
    { label: 'Restaurants', icon: '🍽️' },
  ];

  // Promo Dishes (Matching Image 3)
  const promoDishes = [
    {
      id: 'pd-1',
      name: 'Plain Khichuri',
      vendor: "Sharia's Kitchen",
      rating: 3.9,
      prepTime: '60–85 mins',
      discountedPrice: 60,
      originalPrice: 70,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000006-0000-0000-0000-000000000006'
    },
    {
      id: 'pd-2',
      name: 'Set Menu - 3',
      vendor: "Sharia's Kitchen",
      rating: 3.9,
      prepTime: '60–85 mins',
      discountedPrice: 170,
      originalPrice: 200,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000006-0000-0000-0000-000000000006'
    },
    {
      id: 'pd-3',
      name: 'Loaded Shawarma',
      vendor: 'Snackza',
      rating: 4.5,
      prepTime: '40 mins',
      discountedPrice: 180,
      originalPrice: 210,
      discountText: '15% off',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
      vendorId: 'a0000002-0000-0000-0000-000000000002'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24">
      {/* 
        ========================================================================
        1. SOLID BRAND HEADER (100% Matching Screenshot_20260930_184203.jpg)
        Only difference: FoodHub Vibrant Orange (#EA580C / #F97316) instead of Pink
        ========================================================================
      */}
      <header className="bg-gradient-to-b from-orange-600 via-orange-500 to-orange-500 text-white pt-3 pb-5 px-4 rounded-b-[2rem] shadow-sm">
        <div className="max-w-md mx-auto space-y-3">
          {/* Top Row: Location Pin + Current Location + Chittagong + Heart */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => setIsAddressModalOpen(true)}
              className="flex items-start space-x-2.5 cursor-pointer group"
            >
              <MapPin className="w-6 h-6 text-white mt-0.5 fill-transparent stroke-[2.2]" />
              <div>
                <div className="flex items-center space-x-1">
                  <h1 className="text-base font-black tracking-tight text-white leading-tight">
                    Current Location
                  </h1>
                </div>
                <p className="text-xs text-orange-100 font-medium">
                  {selectedAddress ? selectedAddress.address_line : 'Chittagong'}
                </p>
              </div>
            </div>

            {/* Right: Heart Icon (Favorites) */}
            <button 
              onClick={() => setIsRating4PlusOnly(prev => !prev)}
              className="p-1 text-white hover:text-orange-200 transition"
              aria-label="Favorites"
            >
              <Heart className={`w-6 h-6 stroke-[2.2] ${favorites.length > 0 ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Search Bar (Inside the Orange Header directly below Location) */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search for restaurants and groceries"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 rounded-full text-sm font-medium shadow-sm focus:outline-hidden"
            />
          </div>

          {/* Hero Carousel: "Welcome back! Enjoy 35% off & free delivery" + Fried Chicken Bucket */}
          <div className="pt-2 pb-1 flex items-center justify-between gap-3 relative">
            <div className="space-y-1.5 max-w-[200px] sm:max-w-xs z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                Welcome back! Enjoy 35% off & free delivery
              </h2>
              <button 
                onClick={() => setActiveCuisineFilter('All')}
                className="inline-flex items-center space-x-1 text-xs font-bold text-white hover:text-orange-100 transition pt-1"
              >
                <span>Redeem now</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Food Graphic: Crispy Fried Chicken Bucket */}
            <div className="relative shrink-0 w-36 h-28 sm:w-44 sm:h-32">
              <img 
                src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80" 
                alt="Fried Chicken Bucket" 
                className="w-full h-full object-cover rounded-2xl drop-shadow-md"
              />
            </div>
          </div>

          {/* Carousel Dots Pill Indicator [ — • • • • ] */}
          <div className="flex justify-center pt-1">
            <div className="inline-flex items-center space-x-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
              <span className="w-6 h-1 bg-white rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
            </div>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: EXACT FEATURES & OPTIONS WHERE THEY ARE IN THE SCREENSHOTS
        ========================================================================
      */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">

        {/* 2. QUICK SERVICE ICONS ROW (Offers, foodmart, Pick-up, Health & Beauty, Restaurants) */}
        <section className="grid grid-cols-5 gap-2 text-center pt-1">
          {serviceShortcuts.map((svc) => (
            <div 
              key={svc.label}
              onClick={() => {
                if (svc.label === 'Offers') setHasOfferOnly(prev => !prev);
              }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="relative w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                {svc.badge && (
                  <span className={`absolute -top-1.5 -right-1 px-1.5 py-0.2 ${svc.badgeBg} text-white font-black text-[9px] rounded-full shadow-xs whitespace-nowrap`}>
                    {svc.badge}
                  </span>
                )}
                <span>{svc.icon}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1.5 leading-tight">
                {svc.label}
              </span>
            </div>
          ))}
        </section>

        {/* 3. 3D CUISINE FOOD BUBBLES HORIZONTAL SCROLL (Pizza, Burgers, Fast Food, Bangladeshi, Rice) */}
        <section className="space-y-2">
          <div className="flex items-center space-x-3.5 overflow-x-auto pb-2 scrollbar-none">
            {cuisineBubbles.map((c) => {
              const isSelected = activeCuisineFilter === c.filter;
              return (
                <button
                  key={c.label}
                  onClick={() => setActiveCuisineFilter(isSelected ? 'All' : c.filter)}
                  className="flex flex-col items-center shrink-0 group cursor-pointer focus:outline-hidden"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-xs transition-transform ${
                    isSelected ? 'ring-2 ring-orange-500 scale-105 bg-orange-50' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <span>{c.icon}</span>
                  </div>
                  <span className={`text-[11px] mt-1.5 font-bold whitespace-nowrap ${
                    isSelected ? 'text-orange-600' : 'text-slate-800'
                  }`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. VERTICAL PROMOTIONAL DEAL POSTER CARDS (Sultan's Dine, PizzaBurg, etc.) */}
        <section className="space-y-3">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {/* Sultan's Dine Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("Sultan"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-48 sm:w-52 rounded-3xl bg-gradient-to-b from-[#2E1A47] via-[#1E1233] to-[#120B20] text-white p-3.5 relative overflow-hidden shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-white text-slate-900 font-bold text-[9px] rounded-md border border-slate-200">
                  Sultan's Dine
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-black leading-tight text-white">Up to 40% off</h3>
                <p className="text-xs font-bold text-purple-300 mt-0.5">+ free delivery</p>
              </div>
              <div className="mt-3 h-24 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=350&auto=format&fit=crop&q=80" 
                  alt="Biryani" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[8px] text-slate-400 mt-2">T&Cs apply.</p>
            </div>

            {/* PizzaBurg Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("PizzaBurg"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-48 sm:w-52 rounded-3xl bg-gradient-to-b from-[#2E1A47] via-[#1E1233] to-[#120B20] text-white p-3.5 relative overflow-hidden shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-md">
                  PizzaBurg
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-black leading-tight text-white">Up to 40% off</h3>
                <p className="text-xs font-bold text-purple-300 mt-0.5">+ free delivery</p>
              </div>
              <div className="mt-3 h-24 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=350&auto=format&fit=crop&q=80" 
                  alt="Pizza" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[8px] text-slate-400 mt-2">T&Cs apply.</p>
            </div>

            {/* FoodHub Pro Card */}
            <div 
              onClick={() => {
                const v = vendors.find(x => x.name.includes("Domino"));
                if (v) setSelectedVendorForMenu(v);
              }}
              className="shrink-0 w-48 sm:w-52 rounded-3xl bg-gradient-to-b from-[#2E1A47] via-[#1E1233] to-[#120B20] text-white p-3.5 relative overflow-hidden shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-orange-600 text-white font-bold text-[9px] rounded-md">
                  FoodHub Pro
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-black leading-tight text-white">Up to 40% off</h3>
                <p className="text-xs font-bold text-orange-300 mt-0.5">+ free delivery</p>
              </div>
              <div className="mt-3 h-24 w-full rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=350&auto=format&fit=crop&q=80" 
                  alt="Domino" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[8px] text-slate-400 mt-2">T&Cs apply.</p>
            </div>
          </div>
        </section>

        {/* 5. POPULAR RESTAURANTS SECTION (Matching Screenshot 2) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Popular Restaurants</h2>
            <button 
              onClick={() => setActiveCuisineFilter('All')}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3.5 overflow-x-auto pb-2 scrollbar-none">
            {vendors.slice(0, 3).map((v) => {
              const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
              const fee = calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
              const isFav = favorites.includes(v.id);

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendorForMenu(v)}
                  className="shrink-0 w-72 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={v.cover_image} 
                      alt={v.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={(e) => toggleFavorite(v.id, e)}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-600 hover:text-rose-500 transition"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {/* Pro Banner Ribbon */}
                    <div className="absolute bottom-0 inset-x-0 bg-white/95 px-3 py-1 flex items-center space-x-1.5 text-slate-800 text-[11px] font-bold border-t border-slate-100">
                      <span className="text-purple-700 font-extrabold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-purple-600" /> PRO
                      </span>
                      <span>40% off selected items</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{v.name}</h3>
                      <div className="flex items-center space-x-1 text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{v.rating} (1k+)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      From {v.estimated_prep_time_minutes} min &bull; ৳৳ &bull; {v.cuisine}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <span className="line-through text-slate-400">Tk15</span>
                      <span className="font-bold text-emerald-600">Free</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">{distanceKm} km</span>
                    </div>

                    <div className="pt-1">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">
                        <Ticket className="w-3 h-3 text-rose-500" />
                        <span>35% off Tk. 299: back4more</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. DISHES UP TO 15% OFF SECTION (Matching Screenshot 3) */}
        <section className="space-y-3 bg-rose-50/40 p-4 rounded-3xl border border-rose-100/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="p-0.5 bg-rose-500 text-white rounded-md text-xs font-black px-1">%</span>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Dishes up to 15% off</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Minimum spend applies</p>
            </div>
            <button 
              onClick={() => setActiveCuisineFilter('All')}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
            {promoDishes.map((dish) => (
              <div 
                key={dish.id}
                onClick={() => {
                  const v = vendors.find(x => x.id === dish.vendorId);
                  if (v) setSelectedVendorForMenu(v);
                }}
                className="shrink-0 w-44 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group"
              >
                <div className="relative h-28 w-full bg-slate-100">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-xs text-slate-900 text-[9px] font-bold rounded-md shadow-xs">
                    {dish.prepTime}
                  </span>
                </div>

                <div className="p-2.5 space-y-1">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                    <span className="truncate font-semibold">{dish.vendor}</span>
                    <span className="flex items-center gap-0.5 font-bold text-slate-800 shrink-0">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {dish.rating}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 line-clamp-1">{dish.name}</h4>

                  <div className="flex items-center space-x-1.5 text-xs font-black">
                    <span className="text-rose-600 font-mono">Tk{dish.discountedPrice}</span>
                    <span className="text-slate-400 line-through font-mono text-[10px]">Tk{dish.originalPrice}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className="text-rose-600 font-bold">{dish.discountText}</span>
                    <span className="text-slate-500 font-bold">🛵 Free</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. DOMINO'S MEATMAXXX PROMO BANNER (Matching Screenshot 3 bottom) */}
        <section 
          onClick={() => {
            const v = vendors.find(x => x.name.includes("Domino"));
            if (v) setSelectedVendorForMenu(v);
          }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0C1E3C] via-[#102B59] to-[#0C1E3C] text-white p-4 shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 z-10">
              <span className="text-xs font-black text-blue-300">Domino's Pizza</span>
              <h3 className="text-xl font-black text-white leading-tight">GET 40% OFF*</h3>
              <p className="text-[10px] text-slate-300">Exclusively for FoodHub Pro</p>
              <button className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition">
                ORDER NOW
              </button>
            </div>
            <div className="w-36 h-24 rounded-2xl overflow-hidden shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80" 
                alt="MeatMaxxx" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 text-[9px] bg-slate-900/60 px-1 py-0.2 rounded text-slate-400">Ad</span>
        </section>

        {/* 8. SHOP BY CATEGORY SECTION (Matching Screenshot 4) */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Shop by category</h2>
          <div className="grid grid-cols-4 gap-2.5 text-center">
            {[
              { name: 'Grocery', icon: '🛍️' },
              { name: 'Convenience', icon: '🏪' },
              { name: 'Health & Beauty', icon: '🧴' },
              { name: 'Pet Shop', icon: '🥣' },
            ].map((cat) => (
              <div 
                key={cat.name}
                onClick={() => setSearchQuery(cat.name)}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-orange-400 transition cursor-pointer flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-slate-700 mt-2 line-clamp-1">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 9. STICKY FILTER CHIPS BAR (Matching Screenshot 4 & 5) */}
        <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none border-b border-slate-100">
          <button 
            onClick={() => {
              setSelectedSort(prev => prev === 'popular' ? 'rating' : prev === 'rating' ? 'distance' : 'popular');
            }}
            className="p-2 bg-white rounded-full border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedSort(prev => prev === 'popular' ? 'distance' : 'popular')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              selectedSort !== 'popular' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <span>Sort</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setHasOfferOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              hasOfferOnly ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <span>Offers</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsRating4PlusOnly(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 ${
              isRating4PlusOnly ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Ratings 4.0+</span>
          </button>
        </section>

        {/* 10. EXPLORE RESTAURANTS NEARBY (Matching Screenshot 4 & 5) */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Explore restaurants nearby</h2>

          <div className="space-y-4">
            {filteredVendors.map((vendor) => {
              const distanceKm = calculateDistanceKm(vendor.latitude, vendor.longitude, customerLat, customerLng);
              const fee = calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
              const isFav = favorites.includes(vendor.id);

              return (
                <div
                  key={vendor.id}
                  onClick={() => setSelectedVendorForMenu(vendor)}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={vendor.cover_image} 
                      alt={vendor.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button 
                      onClick={(e) => toggleFavorite(vendor.id, e)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-700 hover:text-rose-500 transition"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <div className="absolute bottom-0 inset-x-0 bg-white/95 px-3 py-1 flex items-center space-x-1.5 text-slate-800 text-[11px] font-bold border-t border-slate-100">
                      <span className="text-purple-700 font-extrabold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-purple-600" /> PRO
                      </span>
                      <span>40% off selected items</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-slate-900">{vendor.name}</h3>
                      <div className="flex items-center space-x-1 text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{vendor.rating} (500+)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      From {vendor.estimated_prep_time_minutes} min &bull; ৳ &bull; {vendor.cuisine} &bull; Price Match
                    </p>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="line-through text-slate-400">Tk15</span>
                      <span className="font-bold text-emerald-600">Free</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500 font-medium">COD: {settings.currency_symbol}{fee} ({distanceKm} km)</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">
                        <Ticket className="w-3 h-3 text-rose-500" />
                        <span>35% off Tk. 299: back4more</span>
                      </span>
                      <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                        View Menu &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* 
        ========================================================================
        RESTAURANT MENU MODAL
        ========================================================================
      */}
      {selectedVendorForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="relative h-36 bg-slate-900">
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
                <h3 className="text-lg font-black">{selectedVendorForMenu.name}</h3>
                <p className="text-xs text-slate-200">{selectedVendorForMenu.cuisine} &bull; {selectedVendorForMenu.address}</p>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Items</h4>
              <div className="space-y-2.5">
                {menuItems
                  .filter((m) => m.vendor_id === selectedVendorForMenu.id)
                  .map((dish) => {
                    const cartItem = cart.find(ci => ci.menuItem.id === dish.id);
                    return (
                      <div 
                        key={dish.id}
                        className="p-3 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 bg-white hover:border-orange-300 transition"
                      >
                        <div className="flex-1">
                          <h5 className="font-extrabold text-slate-900 text-xs">{dish.name}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{dish.description}</p>
                          <span className="font-mono font-black text-sm text-slate-900 mt-1 block">
                            {settings.currency_symbol}{dish.price}
                          </span>
                        </div>

                        {dish.image_url && (
                          <img src={dish.image_url} alt={dish.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
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
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{totalCartCount} items in cart</p>
                <p className="text-base font-black text-slate-900 font-mono">
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
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <span>Checkout ({settings.currency_symbol}{totalCashPayable})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        CHECKOUT & CASH ON DELIVERY MODAL
        ========================================================================
      */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-100 text-orange-800 rounded-lg">
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

            <div className="p-4 overflow-y-auto space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-2xl text-xs flex justify-between items-center border border-slate-200">
                <div>
                  <span className="font-extrabold text-slate-900">{cartVendor?.name}</span>
                  <p className="text-slate-500">{cartVendor?.address}</p>
                </div>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartDistanceKm} km
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Items</span>
                {cart.map((ci) => (
                  <div key={ci.menuItem.id} className="flex justify-between items-center py-1 text-xs border-b border-slate-100">
                    <span className="font-medium text-slate-800">{ci.quantity}x {ci.menuItem.name}</span>
                    <span className="font-mono font-bold text-slate-900">{settings.currency_symbol}{ci.menuItem.price * ci.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-orange-950 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" /> Delivery Address
                  </span>
                  <button onClick={() => setIsAddressModalOpen(true)} className="text-orange-700 font-bold hover:underline">
                    Change Pin
                  </button>
                </div>
                <p className="text-slate-800 font-medium">{selectedAddress?.address_line}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell, keep exact change ready"
                  value={orderInstructions}
                  onChange={(e) => setOrderInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Food Total:</span>
                  <span className="font-mono font-bold">{settings.currency_symbol}{foodTotal}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Delivery Charge:</span>
                  <span className="font-mono font-bold">{settings.currency_symbol}{deliveryFee}</span>
                </div>
                <div className="pt-1.5 border-t border-amber-300 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Cash to Pay:</span>
                  <span className="font-mono text-orange-600 text-base">{settings.currency_symbol}{totalCashPayable}</span>
                </div>
              </div>
            </div>

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
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
              >
                {isPlacingOrder ? 'Confirming...' : `Confirm Cash Order (${settings.currency_symbol}${totalCashPayable})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        ADDRESS BOOK MODAL
        ========================================================================
      */}
      <AddressBookModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />

      {/* 
        ========================================================================
        11. BOTTOM FLOATING NAVIGATION DOCK (100% Matching Screenshot_20260930_184203.jpg)
        Food, Grocery, Search, Carts, Account
        ========================================================================
      */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Food (Active in Orange) */}
          <button
            onClick={() => setActiveBottomNav('food')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'food' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'food' ? 'bg-orange-50 text-orange-600' : ''}`}>
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
            <div className={`p-1 rounded-xl ${activeBottomNav === 'grocery' ? 'bg-orange-50 text-orange-600' : ''}`}>
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
            <div className={`p-1 rounded-xl ${activeBottomNav === 'search' ? 'bg-orange-50 text-orange-600' : ''}`}>
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
            <div className={`p-1 rounded-xl ${activeBottomNav === 'carts' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 bg-orange-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
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
            <div className={`p-1 rounded-xl ${activeBottomNav === 'account' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
