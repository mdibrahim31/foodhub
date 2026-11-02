import React from 'react';
import { CustomerHeader } from '../../components/customer/views/CustomerHeader';
import { CustomerHomeView } from '../../components/customer/views/CustomerHomeView';
import { Vendor, FoodCategory, AdBanner, DeliveryZone, CustomerAddress } from '../../types/database';

interface CustomerGroceryPageProps {
  activeCustomerAddress: CustomerAddress | null;
  setIsAddressModalOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  setIsRating4PlusOnly: React.Dispatch<React.SetStateAction<boolean>>;
  favorites: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  heroSlides: any[];
  activeSlide: number;
  setActiveSlide: React.Dispatch<React.SetStateAction<number>>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  getSlideStyle: (i: number) => React.CSSProperties;
  setSelectedVendorForMenu: (v: Vendor) => void;
  activeRestaurantTypeFilter: string;
  setActiveRestaurantTypeFilter: (type: string) => void;
  activeMiddleBanners: AdBanner[];
  vendors: Vendor[];
  foodCategories: FoodCategory[];
  activeCuisineFilter: string;
  setActiveCuisineFilter: (cat: string) => void;
  setIsSortMenuOpen: (open: boolean) => void;
  selectedSort: 'popular' | 'rating' | 'distance' | 'new';
  setSelectedSort: (sort: 'popular' | 'rating' | 'distance' | 'new') => void;
  setIsNewOnly: (newOnly: boolean) => void;
  isNewOnly: boolean;
  isRating4PlusOnly: boolean;
  isSortMenuOpen: boolean;
  displayVendors: Vendor[];
  activeCustomerZone: DeliveryZone | null;
  getVendorCoords: (v: Vendor) => { lat: number; lng: number };
  calculateDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  calculateDeliveryFee: (dist: number, base: number, perKm: number) => number;
  customerLat: number;
  customerLng: number;
  settings: any;
  toggleFavorite: (vendorId: string, e?: React.MouseEvent) => Promise<void>;
  isVendorNew: (v: Vendor) => boolean;
}

export const CustomerGroceryPage: React.FC<CustomerGroceryPageProps> = (props) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 overflow-x-hidden max-w-full">
      <CustomerHeader
        activeCustomerAddress={props.activeCustomerAddress}
        setIsAddressModalOpen={props.setIsAddressModalOpen}
        toggleFullscreen={props.toggleFullscreen}
        isFullscreen={props.isFullscreen}
        setIsRating4PlusOnly={props.setIsRating4PlusOnly}
        favorites={props.favorites}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        heroSlides={props.heroSlides}
        activeSlide={props.activeSlide}
        setActiveSlide={props.setActiveSlide}
        handleTouchStart={props.handleTouchStart}
        handleTouchMove={props.handleTouchMove}
        handleTouchEnd={props.handleTouchEnd}
        getSlideStyle={props.getSlideStyle}
        setSelectedVendorForMenu={props.setSelectedVendorForMenu}
      />
      <CustomerHomeView
        activeBottomNav="grocery"
        activeRestaurantTypeFilter={props.activeRestaurantTypeFilter}
        setActiveRestaurantTypeFilter={props.setActiveRestaurantTypeFilter}
        activeMiddleBanners={props.activeMiddleBanners}
        vendors={props.vendors}
        setSelectedVendorForMenu={props.setSelectedVendorForMenu}
        foodCategories={props.foodCategories}
        activeCuisineFilter={props.activeCuisineFilter}
        setActiveCuisineFilter={props.setActiveCuisineFilter}
        setIsSortMenuOpen={props.setIsSortMenuOpen}
        selectedSort={props.selectedSort}
        setSelectedSort={props.setSelectedSort}
        setIsNewOnly={props.setIsNewOnly}
        isNewOnly={props.isNewOnly}
        isRating4PlusOnly={props.isRating4PlusOnly}
        setIsRating4PlusOnly={props.setIsRating4PlusOnly}
        isSortMenuOpen={props.isSortMenuOpen}
        displayVendors={props.displayVendors}
        activeCustomerZone={props.activeCustomerZone}
        setIsAddressModalOpen={props.setIsAddressModalOpen}
        getVendorCoords={props.getVendorCoords}
        calculateDistanceKm={props.calculateDistanceKm}
        calculateDeliveryFee={props.calculateDeliveryFee}
        customerLat={props.customerLat}
        customerLng={props.customerLng}
        settings={props.settings}
        favorites={props.favorites}
        toggleFavorite={props.toggleFavorite}
        isVendorNew={props.isVendorNew}
      />
    </div>
  );
};
