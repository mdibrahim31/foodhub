import React from 'react';
import { MapPin, Search, Maximize2, Minimize2, Heart } from 'lucide-react';
import { CustomerAddress, Vendor } from '../../../types/database';

interface CustomerHeaderProps {
  activeCustomerAddress: CustomerAddress | null;
  setIsAddressModalOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  setIsRating4PlusOnly: React.Dispatch<React.SetStateAction<boolean>>;
  favorites: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  heroSlides: Array<{
    id: string;
    title: string;
    subtitle?: string | null;
    actionText: string;
    image: string;
    videoUrl?: string | null;
    vendor?: Vendor | null;
  }>;
  activeSlide: number;
  setActiveSlide: React.Dispatch<React.SetStateAction<number>>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  getSlideStyle: (index: number) => React.CSSProperties;
  setSelectedVendorForMenu: (v: Vendor) => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  activeCustomerAddress,
  setIsAddressModalOpen,
  toggleFullscreen,
  isFullscreen,
  setIsRating4PlusOnly,
  favorites,
  searchQuery,
  setSearchQuery,
  heroSlides,
  activeSlide,
  setActiveSlide,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  getSlideStyle,
  setSelectedVendorForMenu,
}) => {
  return (
    <header className="bg-gradient-to-b from-orange-600 via-orange-500 to-orange-500 text-white pt-[max(env(safe-area-inset-top),0.75rem)] pb-6 px-4 rounded-b-[2.5rem] shadow-sm">
      <div className="max-w-md mx-auto space-y-3">
        {/* Top Row: Location Pin + Choose Area + Fullscreen + Heart */}
        <div className="flex items-center justify-between">
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-start space-x-2 cursor-pointer group flex-1 min-w-0 pr-2"
          >
            <MapPin className="w-5 h-5 text-white mt-0.5 fill-transparent stroke-[2.2] shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                  Current Location
                </h1>
              </div>
              <p className="text-[11px] text-orange-100 font-medium truncate max-w-[150px] sm:max-w-[200px]">
                {activeCustomerAddress ? activeCustomerAddress.address_line : 'Select Address'}
              </p>
            </div>
          </div>

          {/* Address Book Pin Point Button */}
          <button
            onClick={() => setIsAddressModalOpen(true)}
            className="mr-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black flex items-center space-x-1 border border-white/30 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
            title="Open Address Book to change map pin point"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[110px]">
              {activeCustomerAddress ? activeCustomerAddress.label || 'At door' : 'At door'}
            </span>
          </button>

          {/* Right: Fullscreen Toggle + Heart Icon (Favorites) */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer active:scale-95"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View (ফুলস্ক্রিন ভিউ)"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <Maximize2 className="w-5 h-5 stroke-[2.2]" />
              )}
            </button>
            <button 
              onClick={() => setIsRating4PlusOnly(prev => !prev)}
              className="p-1 text-white hover:text-orange-200 transition cursor-pointer active:scale-95"
              aria-label="Favorites"
            >
              <Heart className={`w-6 h-6 stroke-[2.2] ${favorites.length > 0 ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
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

        {/* Hero Slides Banner */}
        {heroSlides.length > 0 && (
          <div className="space-y-1.5 -mx-2 sm:-mx-3 pt-0">
            <div className="relative overflow-hidden w-full aspect-[16/9] rounded-2xl sm:rounded-3xl border-0 shadow-xs bg-transparent">
              <div 
                className="w-full h-full relative bg-transparent"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {heroSlides.map((slide, i) => (
                  <div 
                    key={slide.id}
                    style={getSlideStyle(i)}
                    className="absolute inset-0 w-full h-full select-none overflow-hidden rounded-2xl sm:rounded-3xl bg-transparent cursor-pointer"
                    onClick={() => {
                      if (slide.vendor) {
                        setSelectedVendorForMenu(slide.vendor);
                      }
                    }}
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.title || 'Banner'} 
                      className="w-full h-full object-cover block transition-transform duration-500 hover:scale-102"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1280&h=720&auto=format&fit=crop&q=80';
                      }}
                    />

                    {slide.vendor && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVendorForMenu(slide.vendor!);
                        }}
                        className="absolute bottom-3 left-3 z-30 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center space-x-1.5 shadow-lg cursor-pointer hover:bg-black/90 transition select-none"
                      >
                        <span>🎯 {slide.vendor.name}</span>
                        <span className="text-[10px] text-orange-400 font-bold ml-1">View Menu &rarr;</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {heroSlides.length > 1 && (
              <div className="flex justify-center pt-1.5">
                <div className="bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`transition-all duration-300 h-1.5 rounded-full cursor-pointer ${
                        activeSlide === idx 
                          ? 'w-5 bg-white' 
                          : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
