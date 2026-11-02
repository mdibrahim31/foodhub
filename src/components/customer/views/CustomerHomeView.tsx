import React from 'react';
import { SlidersHorizontal, ChevronDown, Star, Sparkles, MapPin, Check, X, Tag, Bike } from 'lucide-react';
import { Vendor, FoodCategory, AdBanner, DeliveryZone } from '../../../types/database';

interface CustomerHomeViewProps {
  activeBottomNav: 'food' | 'grocery' | 'carts' | 'orders' | 'account';
  activeRestaurantTypeFilter: string;
  setActiveRestaurantTypeFilter: (type: string) => void;
  activeMiddleBanners: AdBanner[];
  vendors: Vendor[];
  setSelectedVendorForMenu: (v: Vendor) => void;
  foodCategories: FoodCategory[];
  activeCuisineFilter: string;
  setActiveCuisineFilter: (cat: string) => void;
  setIsSortMenuOpen: (open: boolean) => void;
  selectedSort: 'popular' | 'rating' | 'distance' | 'new';
  setSelectedSort: (sort: 'popular' | 'rating' | 'distance' | 'new') => void;
  setIsNewOnly: (newOnly: boolean) => void;
  isNewOnly: boolean;
  isRating4PlusOnly: boolean;
  setIsRating4PlusOnly: React.Dispatch<React.SetStateAction<boolean>>;
  isSortMenuOpen: boolean;
  displayVendors: Vendor[];
  activeCustomerZone: DeliveryZone | null;
  setIsAddressModalOpen: (open: boolean) => void;
  getVendorCoords: (v: Vendor) => { lat: number; lng: number };
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  calculateDeliveryFee: (dist: number, base: number, perKm: number) => number;
  customerLat: number;
  customerLng: number;
  settings: any;
  favorites: string[];
  toggleFavorite: (vendorId: string, e?: React.MouseEvent) => Promise<void>;
  isVendorNew: (v: Vendor) => boolean;
}

export const CustomerHomeView: React.FC<CustomerHomeViewProps> = ({
  activeBottomNav,
  activeRestaurantTypeFilter,
  setActiveRestaurantTypeFilter,
  activeMiddleBanners,
  vendors,
  setSelectedVendorForMenu,
  foodCategories,
  activeCuisineFilter,
  setActiveCuisineFilter,
  setIsSortMenuOpen,
  selectedSort,
  setSelectedSort,
  setIsNewOnly,
  isNewOnly,
  isRating4PlusOnly,
  setIsRating4PlusOnly,
  isSortMenuOpen,
  displayVendors,
  activeCustomerZone,
  setIsAddressModalOpen,
  getVendorCoords,
  calculateDistanceKm,
  calculateDeliveryFee,
  customerLat,
  customerLng,
  settings,
  favorites,
  toggleFavorite,
  isVendorNew,
}) => {
  return (
    <main className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* 1. Restaurant Types */}
      {activeBottomNav === 'food' && (
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>🏪 Restaurant Types</span>
            </h3>
            {activeRestaurantTypeFilter !== 'All' && (
              <button 
                onClick={() => setActiveRestaurantTypeFilter('All')} 
                className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
            {[
              { id: 'All', name: 'All', icon: '🍽️' },
              { id: 'restaurant', name: 'Restaurant', icon: '🏬' },
              { id: 'cloud_kitchen', name: 'Cloud Kitchen', icon: '🍳' },
              { id: 'home_kitchen', name: 'Home Kitchen', icon: '🏠' },
              { id: 'sweets_bakery', name: 'Sweets & Bakery', icon: '🧁' },
            ].map((type) => {
              const isSelected = activeRestaurantTypeFilter === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveRestaurantTypeFilter(isSelected ? 'All' : type.id)}
                  className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl border transition-all cursor-pointer select-none min-w-0 w-full ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-200 ring-2 ring-orange-400 font-black'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs font-bold'
                  }`}
                >
                  <span className="text-base sm:text-lg mb-0.5">{type.icon}</span>
                  <span className="text-[9px] sm:text-[10px] leading-tight text-center font-bold px-0.5 break-words">
                    {type.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Middle Banners / Featured Deals */}
      {activeMiddleBanners.length > 0 && (
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>🔥 Featured Deals</span>
            </h3>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
            {activeMiddleBanners.map((ad) => {
              const targetVendorId = ad.target_vendor_id;
              const targetVendor = targetVendorId 
                ? vendors.find(v => v.id === targetVendorId || (v.unique_id && v.unique_id.toLowerCase() === targetVendorId.toLowerCase())) 
                : null;
              return (
                <button
                  key={ad.id}
                  onClick={() => {
                    if (targetVendor) {
                      setSelectedVendorForMenu(targetVendor);
                    }
                  }}
                  className="relative w-28 sm:w-32 h-38 sm:h-44 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 shadow-xs border border-slate-100 hover:scale-102 transition-transform cursor-pointer focus:outline-hidden"
                >
                  <img 
                    src={ad.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80'} 
                    alt="Featured Offer" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80') {
                        img.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80';
                      }
                    }}
                  />
                  {targetVendor && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs py-1 px-1.5 rounded-xl text-[9px] font-black text-white text-center truncate">
                      {targetVendor.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Food Categories Horizontal Slider */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
            <span>🍕 {activeBottomNav === 'food' ? 'Food Categories' : 'Shop Categories'}</span>
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
          {foodCategories.filter(cat => 
            cat.is_active !== false && 
            (activeBottomNav === 'food' ? (cat.category_type === 'food' || !cat.category_type) : cat.category_type === 'grocery')
          ).map((cat) => {
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
                  <span>{cat.icon || '🍽️'}</span>
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

      {/* 4. Sticky Filter Chips Bar */}
      {activeBottomNav === 'food' && (
        <section className="sticky top-0 z-30 bg-white/95 py-2 flex items-center justify-start space-x-2 border-b border-slate-100 w-full max-w-full px-0.5 overflow-x-auto scrollbar-none">
          <div 
            className="p-1.5 rounded-full border border-slate-200 text-slate-700 shadow-2xs shrink-0 bg-white flex items-center justify-center"
            title="Filter Icon"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          </div>

          <button
            onClick={() => setIsSortMenuOpen(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
              selectedSort === 'new' || selectedSort === 'distance' ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>
              {selectedSort === 'new' ? 'Sort: New' : selectedSort === 'distance' ? 'Sort: Distance' : 'Sort'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsRating4PlusOnly(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
              isRating4PlusOnly ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Ratings 4.0+</span>
          </button>
        </section>
      )}

      {/* Sort Options Modal */}
      {isSortMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50" 
          onClick={() => setIsSortMenuOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Sort Vendors By</h3>
              <button 
                onClick={() => setIsSortMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => { 
                  if (selectedSort === 'new') {
                    setSelectedSort('popular'); 
                    setIsNewOnly(false);
                  } else {
                    setSelectedSort('new'); 
                    setIsNewOnly(true); 
                  }
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                  selectedSort === 'new' || isNewOnly ? 'bg-orange-50 text-orange-600 border-2 border-orange-500 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>New Vendors</span>
                </div>
                {(selectedSort === 'new' || isNewOnly) && <Check className="w-5 h-5 text-orange-600 stroke-[3]" />}
              </button>

              <button
                onClick={() => { 
                  if (selectedSort === 'distance') {
                    setSelectedSort('popular'); 
                  } else {
                    setSelectedSort('distance'); 
                  }
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                  selectedSort === 'distance' ? 'bg-orange-50 text-orange-600 border-2 border-orange-500 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>Nearest Distance</span>
                </div>
                {selectedSort === 'distance' && <Check className="w-5 h-5 text-orange-600 stroke-[3]" />}
              </button>
            </div>

            <button 
              onClick={() => setIsSortMenuOpen(false)}
              className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-[0.99] mt-2"
            >
              APPLY FILTERS
            </button>
          </div>
        </div>
      )}

      {/* 5. Explore Restaurants / Shops Nearby */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          {activeBottomNav === 'food' ? 'Explore restaurants nearby' : 'Explore shops nearby'}
        </h2>

        {displayVendors.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/90 shadow-xs space-y-3.5 my-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm">
                No {activeBottomNav === 'food' ? 'restaurants' : 'shops'} available in {activeCustomerZone?.name || 'this zone'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Only vendors within your active delivery zone boundary are displayed. Please change your delivery address or map pin to browse vendors in other zones.
              </p>
            </div>
            <button 
              onClick={() => setIsAddressModalOpen(true)}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-orange-600/20 cursor-pointer transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>CHANGE DELIVERY ADDRESS / ZONE</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayVendors.map((vendor) => {
              const { lat: vLat, lng: vLng } = getVendorCoords(vendor);
              const distanceKm = calculateDistanceKm(vLat, vLng, customerLat, customerLng);
              const isFreeDelivery = Boolean(vendor.is_free_delivery);
              const fee = isFreeDelivery ? 0 : calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
              const isFav = favorites.includes(vendor.id);
              const isNew = isVendorNew(vendor);

              return (
                <div
                  key={vendor.id}
                  onClick={() => setSelectedVendorForMenu(vendor)}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden">
                    <img 
                      src={vendor.cover_image || vendor.logo_url} 
                      alt={vendor.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';
                      }}
                    />

                    {isNew && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 fill-white" />
                        <span>New</span>
                      </div>
                    )}

                    <button 
                      onClick={(e) => toggleFavorite(vendor.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-md hover:bg-white active:scale-90 transition-transform cursor-pointer"
                      title={isFav ? "Remove from Favourites" : "Add to Favourites"}
                    >
                      <Star className={`w-4.5 h-4.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-slate-900 text-base leading-snug truncate">
                        {vendor.name}
                      </h3>
                      <div className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black">{vendor.rating || 4.8}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-bold truncate">
                      {vendor.cuisine} • {vendor.city_area || vendor.zone || 'Chattogram'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                      <div className="flex items-center space-x-1">
                        <Bike className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isFreeDelivery ? 'Free Delivery' : `Tk ${fee}`}</span>
                      </div>
                      <span>{vendor.estimated_prep_time_minutes || 20} mins</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
