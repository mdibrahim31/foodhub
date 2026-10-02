import React, { useState, useEffect } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
import { AuthModal } from '../common/AuthModal';
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
  ArrowRight,
  Settings,
  Receipt,
  Gift,
  HelpCircle,
  FileText,
  LogOut,
  Clock,
  Check,
  X,
  Phone,
  Bike,
  Tag,
  Percent,
  Flame
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { 
    vendors, 
    menuItems, 
    foodCategories,
    adBanners,
    selectedAddress, 
    settings, 
    cart, 
    cartVendor, 
    addToCart, 
    updateCartQuantity, 
    placeOrder,
    orders,
    currentUser,
    currentCustomer,
    customerRespondToPrepTime,
    logoutUser
  } = useDelivery();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [activeBottomNav, setActiveBottomNav] = useState<'food' | 'grocery' | 'offers' | 'carts' | 'account'>('food');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  // Account Page States (Matching Screenshot_20260930_190517.jpg)
  const [accountSubView, setAccountSubView] = useState<'none' | 'orders' | 'favourites'>('none');
  const [userName, setUserName] = useState('MD');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('+880 1812-345678');
  const [customerEmail, setCustomerEmail] = useState('md.rahim@example.com');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [selectedVendorForMenu, setSelectedVendorForMenu] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'rating' | 'distance' | 'fastest'>('popular');
  const [isRating4PlusOnly, setIsRating4PlusOnly] = useState(false);
  const [hasOfferOnly, setHasOfferOnly] = useState(false);
  const [activeCuisineFilter, setActiveCuisineFilter] = useState('All');
  
  // Hero Carousel Slides & Swipe state
  // Dynamically build slides from Admin Ad Banners & Boosted Vendors
  const activeAdBanners = [...(adBanners || [])]
    .filter(a => a.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const boostedVendors = vendors.filter(v => v.is_boosted);

  const heroSlides = activeAdBanners.map((ad) => {
    const targetVendorId = ad.target_vendor_id;
    const targetVendor = targetVendorId 
      ? vendors.find(v => v.id === targetVendorId || (v.unique_id && v.unique_id.toLowerCase() === targetVendorId.toLowerCase())) 
      : null;
    return {
      id: `ad-${ad.id}`,
      title: ad.title,
      actionText: ad.action_text || 'Redeem now',
      image: ad.image_url,
      vendor: targetVendor || null
    };
  });

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto slide every 3 seconds (starts from slide index 0 on refresh or page enter)
  useEffect(() => {
    setActiveSlide(0);
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const getSlideStyle = (index: number) => {
    if (heroSlides.length <= 1) {
      return { transform: 'translateX(0)', opacity: 1, zIndex: 10 };
    }

    // Active slide
    if (index === activeSlide) {
      return { 
        transform: 'translateX(0)', 
        opacity: 1, 
        zIndex: 10,
        transition: 'transform 700ms ease-in-out, opacity 700ms ease-in-out'
      };
    }

    // Check if it's the previous slide (exiting to left)
    const prevIndex = (activeSlide - 1 + heroSlides.length) % heroSlides.length;
    if (index === prevIndex) {
      return { 
        transform: 'translateX(-100%)', 
        opacity: 0, 
        zIndex: 0,
        transition: 'transform 700ms ease-in-out, opacity 700ms ease-in-out'
      };
    }

    // Otherwise, place it on the right (waiting to enter)
    return { 
      transform: 'translateX(100%)', 
      opacity: 0, 
      zIndex: 0,
      transition: 'transform 700ms ease-in-out, opacity 700ms ease-in-out'
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;
    if (isLeftSwipe) {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    } else if (isRightSwipe) {
      setActiveSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
  };

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
      {activeBottomNav === 'offers' ? (
        /* 
          ========================================================================
          OFFERS & DEALS VIEW (Replaced middle Search tab in Bottom Navigation)
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-white text-slate-900 pb-28">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Exclusive Savings</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Offers & Discounts</h1>
            </div>
            <button 
              onClick={() => setActiveBottomNav('food')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-xs font-bold px-3"
            >
              Back to Food
            </button>
          </div>

          <div className="px-5 py-5 space-y-6">
            {/* Promo Vouchers */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                <Ticket className="w-4 h-4 text-rose-600" />
                <span>Active Voucher Codes</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  { code: 'FOODVIBE40', title: '40% OFF on all Kacchi Biryani & Fast Food', minSpend: 'Min spend ৳300', expiry: 'Expires in 2 days' },
                  { code: 'FREEDELIVERY', title: 'Free Delivery on All Cash Orders', minSpend: 'Min spend ৳250', expiry: 'Valid all month' },
                  { code: 'CRISPY20', title: 'Flat ৳80 Discount on Burgers & Fried Chicken', minSpend: 'Min spend ৳350', expiry: 'Daily special' },
                ].map((vouch) => (
                  <div key={vouch.code} className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 shadow-xs flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-rose-600 text-white font-mono font-black text-xs rounded-lg shadow-2xs">
                          {vouch.code}
                        </span>
                        <span className="text-[10px] font-bold text-rose-700">{vouch.expiry}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900">{vouch.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{vouch.minSpend}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(vouch.code);
                        alert(`Voucher code "${vouch.code}" copied!`);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl text-xs font-black shadow-xs shrink-0 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurants with Big Offers */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Featured Restaurants with Big Savings</span>
              </h3>

              <div className="grid grid-cols-1 gap-3.5">
                {vendors.map((v) => {
                  const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVendorForMenu(v)}
                      className="p-3.5 bg-white border border-slate-200 rounded-3xl shadow-xs hover:shadow-md hover:border-orange-300 transition cursor-pointer flex items-center gap-3.5"
                    >
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                        <img src={v.cover_image || v.logo_url} alt={v.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-rose-600 text-white font-black text-[9px] text-center py-0.5">
                          35% OFF
                        </span>
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-slate-900">{v.name}</h4>
                          <span className="flex items-center gap-0.5 font-bold text-xs text-slate-800">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {v.rating || 4.8}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{v.cuisine}</p>
                        <p className="text-[11px] text-emerald-700 font-bold">🛵 Delivery from ৳{settings.base_delivery_charge} &bull; {distanceKm.toFixed(1)} km</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeBottomNav === 'account' ? (
        /* 
          ========================================================================
          ACCOUNT PAGE (100% Matching Screenshot_20260930_190517.jpg)
          With pandapro banner and Wallet/Perks sections EXCLUDED as marked with red 'X'
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-white text-slate-900 pb-28">
          {/* Top Bar: Account Title on Left + Settings Gear Icon on Right */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account</h1>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1 text-slate-800 hover:text-orange-600 transition"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-6">
            {/* User Name & View Profile */}
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userName}</h2>
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="text-xs font-semibold text-slate-700 hover:text-orange-600 transition mt-1 block"
              >
                View profile
              </button>
            </div>

            {/* 3 Action Cards (Orders, Favourites, Addresses) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Orders Card */}
              <button 
                onClick={() => setAccountSubView(prev => prev === 'orders' ? 'none' : 'orders')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  accountSubView === 'orders' 
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs' 
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <Receipt className="w-6 h-6 text-slate-800 stroke-[1.8]" />
                <span className="text-xs font-bold text-slate-800 mt-2">Orders</span>
              </button>

              {/* Favourites Card */}
              <button 
                onClick={() => setAccountSubView(prev => prev === 'favourites' ? 'none' : 'favourites')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  accountSubView === 'favourites' 
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs' 
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <Heart className={`w-6 h-6 stroke-[1.8] ${favorites.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-800'}`} />
                <span className="text-xs font-bold text-slate-800 mt-2">Favourites</span>
              </button>

              {/* Addresses Card */}
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-xs transition-all"
              >
                <MapPin className="w-6 h-6 text-slate-800 stroke-[1.8]" />
                <span className="text-xs font-bold text-slate-800 mt-2">Addresses</span>
              </button>
            </div>

            {/* If Orders View is opened */}
            {accountSubView === 'orders' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Your Orders ({orders.length})</h3>
                  <button 
                    onClick={() => setAccountSubView('none')}
                    className="text-xs text-orange-600 font-bold"
                  >
                    Hide
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No orders placed yet. Choose delicious food and place an order with 100% Cash On Delivery!
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900">
                            {ord.vendor?.name || vendors.find(v => v.id === ord.vendor_id)?.name || 'Restaurant'}
                          </span>
                          <p className="text-[11px] text-slate-500">{new Date(ord.created_at).toLocaleTimeString()}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold text-[10px] uppercase">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">
                        {(ord.items || []).map(it => `${it.quantity}x ${it.item_name}`).join(', ')}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">COD Total:</span>
                        <span className="font-mono font-black text-orange-600">{settings.currency_symbol}{ord.total_cash_payable}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* If Favourites View is opened */}
            {accountSubView === 'favourites' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Favourites ({favorites.length})</h3>
                  <button 
                    onClick={() => setAccountSubView('none')}
                    className="text-xs text-orange-600 font-bold"
                  >
                    Hide
                  </button>
                </div>

                {favorites.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No favourites saved yet. Tap the heart on any restaurant to add here!
                  </div>
                ) : (
                  vendors.filter(v => favorites.includes(v.id)).map((v) => (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVendorForMenu(v)}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-xs cursor-pointer hover:border-orange-300 transition"
                    >
                      <img src={v.cover_image} alt={v.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900">{v.name}</h4>
                        <p className="text-xs text-slate-500">{v.cuisine} &bull; {v.rating} ⭐</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bottom Menu List Items (Matching the list at bottom of Screenshot) */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
              {/* Invite Friends */}
              <div 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'FoodHub', url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('FoodHub link copied to clipboard!');
                  }
                }}
                className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
              >
                <div className="flex items-center space-x-3.5">
                  <Gift className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Invite friends</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
              </div>

              {/* Help Center */}
              <div 
                onClick={() => alert('Customer Support: Call 16212 or email support@foodhub.com')}
                className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
              >
                <div className="flex items-center space-x-3.5">
                  <HelpCircle className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Help center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
              </div>

              {/* Settings */}
              <div 
                onClick={() => setIsSettingsModalOpen(true)}
                className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
              >
                <div className="flex items-center space-x-3.5">
                  <Settings className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
              </div>

              {/* Terms & Policies */}
              <div 
                onClick={() => alert('Terms & Policies: 100% Cash On Delivery. Base Rate ৳30 + ৳15/km.')}
                className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
              >
                <div className="flex items-center space-x-3.5">
                  <FileText className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Terms & policies</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
              </div>
            </div>

            {/* Log out button in the marked area */}
            <div className="pt-2 pb-6">
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full py-3.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
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

          {/* Interactive Slideable Hero Carousel with Infinite Opacity Fade */}
          {heroSlides.length > 0 && (
            <>
              <div 
                className="relative overflow-hidden pt-2 pb-1 select-none h-36 flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {heroSlides.map((slide, i) => (
                  <div 
                    key={slide.id}
                    onClick={() => {
                      if (slide.vendor) {
                        setSelectedVendorForMenu(slide.vendor);
                      }
                    }}
                    style={getSlideStyle(i)}
                    className="absolute inset-0 w-full h-full flex items-center justify-between gap-3 px-0.5 cursor-pointer select-none"
                  >
                    <div className="space-y-1.5 max-w-[200px] sm:max-w-xs z-10">
                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                        {slide.title}
                      </h2>
                      <button 
                        type="button"
                        className="inline-flex items-center space-x-1 text-xs font-black text-white bg-black/20 hover:bg-black/30 backdrop-blur-xs px-3 py-1 rounded-xl transition pt-1 cursor-pointer"
                      >
                        <span>{slide.actionText || 'Redeem now'}</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {/* Food Graphic */}
                    <div className="relative shrink-0 w-36 h-28 sm:w-44 sm:h-32">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover rounded-2xl drop-shadow-md pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Carousel Dots Pill Indicator [ — • • • • ] */}
              <div className="flex justify-center pt-1">
                <div className="inline-flex items-center space-x-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        activeSlide === i 
                          ? 'w-6 h-1 bg-white' 
                          : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: EXACT FEATURES & OPTIONS WHERE THEY ARE IN THE SCREENSHOTS
        ========================================================================
      */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">

        {/* 
          ======================================================================
          TOP ROW (RED MARKED SECTION IN SCREENSHOT):
          POPULAR BRANDS / TOP RESTAURANTS HORIZONTAL SLIDER
          - Placed directly below hero carousel as requested by user
          - Admin can assign 1-5 rank serial from Admin Panel
          - Sorted primarily by Admin position (1-5), secondarily by Customer Rating
          - Displays Customer Rating ⭐ under name instead of minutes
          ======================================================================
        */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                <span>Popular Brands</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Top picks ranked by rating & admin priority</p>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Slide to explore &rarr;</span>
          </div>

          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none select-none">
            {[...vendors].sort((a, b) => {
              const posA = a.featured_position && a.featured_position >= 1 && a.featured_position <= 5 ? a.featured_position : 999;
              const posB = b.featured_position && b.featured_position >= 1 && b.featured_position <= 5 ? b.featured_position : 999;
              if (posA !== posB) return posA - posB;
              return (b.rating || 0) - (a.rating || 0);
            }).map((v) => {
              const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
              const isTop5 = v.featured_position && v.featured_position >= 1 && v.featured_position <= 5;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendorForMenu(v)}
                  className="shrink-0 w-36 bg-white rounded-3xl border border-slate-200 p-3 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group flex flex-col items-center text-center justify-between space-y-2"
                >
                  {/* Logo Container */}
                  <div className="relative w-24 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 shadow-2xs">
                    <img 
                      src={v.cover_image || v.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'} 
                      alt={v.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isTop5 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 bg-rose-600 text-white font-black text-[8px] rounded-md shadow-2xs">
                        #{v.featured_position} Top
                      </span>
                    )}
                  </div>

                  {/* Name & Customer Rating Underneath (Minutes replaced by Rating) */}
                  <div className="w-full space-y-1">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight group-hover:text-orange-600 transition-colors">
                      {v.name}
                    </h4>
                    
                    {/* Customer Rating Show (Instead of prep minutes) */}
                    <div className="flex items-center justify-center space-x-1 text-xs font-black text-slate-800 bg-amber-50/80 border border-amber-200/80 rounded-lg py-0.5 px-2 w-fit mx-auto">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{v.rating || 4.8}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({distanceKm.toFixed(1)}km)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 
          ======================================================================
          SECOND ROW: FOOD CATEGORIES HORIZONTAL SLIDER
          (Pizza, Burgers, Chicken & Grill, Shawarma, Biryani, Kabab, Fast Food, etc. - dynamically managed by Admin)
          ======================================================================
        */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>🍕 Food Categories</span>
            </h3>
            {activeCuisineFilter !== 'All' && (
              <button 
                onClick={() => setActiveCuisineFilter('All')} 
                className="text-[11px] font-bold text-orange-600 hover:underline"
              >
                Clear filter ({activeCuisineFilter})
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none select-none">
            {foodCategories.filter(cat => cat.is_active !== false).map((cat) => {
              const isSelected = activeCuisineFilter.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCuisineFilter(isSelected ? 'All' : cat.name)}
                  className={`flex flex-col items-center shrink-0 group cursor-pointer focus:outline-hidden transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-all border ${
                    isSelected 
                      ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-300 shadow-orange-100' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-9 h-9 object-contain" />
                    ) : (
                      <span>{cat.icon || '🍽️'}</span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-bold whitespace-nowrap max-w-[76px] truncate text-center ${
                    isSelected ? 'text-orange-600 font-black' : 'text-slate-700'
                  }`}>
                    {cat.name}
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
        </>
      )}

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

      {/* EDIT PROFILE / SETTINGS MODAL */}
      {(isEditProfileOpen || isSettingsModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {isEditProfileOpen ? 'User Profile' : 'Account Settings'}
              </h3>
              <button 
                onClick={() => {
                  setIsEditProfileOpen(false);
                  setIsSettingsModalOpen(false);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditProfileOpen(false);
                  setIsSettingsModalOpen(false);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Log out from FoodHub?</h3>
                <p className="text-xs text-slate-500">You can log back in at any time</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logoutUser();
                  setIsLogoutConfirmOpen(false);
                  setActiveBottomNav('food');
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        CUSTOMER PERMISSION WINDOW (POPUP MODAL)
        User requirement:
        "vendor order accept korar shomoy order er upor ekTa time level thakbe sheTa set kore accept korbe.
        tokon customer er kace ekTa permission window show hobe..jeTate bola hobe vendor er food ready hote eto minit lagbe apni ki order continue korte chan ki na..customer ok ba no select korte pare.ok bolle.order puropuri place hoye jabe.vendor order ready korbe"
        ========================================================================
      */}
      {orders.filter(o => o.status === 'vendor_accepted' && !o.customer_confirmed_prep).map((prepOrder) => (
        <div key={prepOrder.id} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Order #{prepOrder.order_code}
              </span>
              <h3 className="text-lg font-black text-slate-900 pt-1">
                Estimated Cooking Time
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">{prepOrder.vendor?.name || 'Restaurant'}</span> estimates that preparing your meal will take <span className="font-black text-amber-600 text-sm">{prepOrder.vendor_prep_minutes || 15} minutes</span>.
              </p>
              <p className="text-xs font-bold text-slate-800 pt-1">
                Do you want to continue with this order?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => customerRespondToPrepTime(prepOrder.id, false)}
                className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4" />
                <span>No (Cancel)</span>
              </button>

              <button
                onClick={() => customerRespondToPrepTime(prepOrder.id, true)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>OK (Continue)</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Customer Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          targetRole="customer"
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

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

          {/* Offers (Replaced Search) */}
          <button
            onClick={() => {
              setActiveBottomNav('offers');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              activeBottomNav === 'offers' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`relative p-1 rounded-xl ${activeBottomNav === 'offers' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <Tag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 px-1 bg-rose-600 text-white font-black text-[8px] rounded-full">
                %
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Offers</span>
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
            onClick={() => setActiveBottomNav('account')}
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
