import React from 'react';
import { Sparkles, Bike, Heart, Star } from 'lucide-react';
import { Vendor } from '../../types/database';

export interface VendorCardProps {
  vendor: Vendor;
  onClick: (vendor: Vendor) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (vendorId: string, e: React.MouseEvent) => void;
  distanceKm: string | number;
  deliveryFee: number;
  currencySymbol?: string;
}

export const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  distanceKm,
  deliveryFee,
  currencySymbol = '৳'
}) => {
  const isFreeDelivery = Boolean(vendor.is_free_delivery);

  // Check if vendor was registered within the last 30 days
  const isNew = (() => {
    if (!vendor.created_at) return true;
    const createdTime = new Date(vendor.created_at).getTime();
    if (isNaN(createdTime)) return true;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return (Date.now() - createdTime) <= thirtyDaysMs;
  })();

  return (
    <div
      onClick={() => onClick(vendor)}
      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img 
          src={vendor.cover_image} 
          alt={vendor.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* NEW Badge & Free Delivery Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
          {isNew && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center space-x-1 border border-emerald-400/40">
              <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>NEW</span>
            </span>
          )}
          {isFreeDelivery && (
            <span className="px-2.5 py-1 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center space-x-1 border border-orange-400/40">
              <Bike className="w-3 h-3 text-white" />
              <span>FREE DELIVERY</span>
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button 
            type="button"
            onClick={(e) => onToggleFavorite(vendor.id, e)}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-700 hover:text-rose-500 transition z-10"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center space-x-2 text-xs">
            {isFreeDelivery ? (
              <span className="text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <Bike className="w-3.5 h-3.5 text-emerald-600" /> Free Delivery ({distanceKm} km)
              </span>
            ) : (
              <span className="text-slate-500 font-medium">Delivery: {currencySymbol}{deliveryFee} ({distanceKm} km)</span>
            )}
          </div>
        </div>

        <div className="pt-1 flex items-center justify-end">
          <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
            View Menu &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
