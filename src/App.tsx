import React, { useState, useEffect } from 'react';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { VendorPortal } from './components/vendor/VendorPortal';
import { RiderPortal } from './components/rider/RiderPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { MultiAppDock } from './components/common/MultiAppDock';
import { PortalRole } from './types/database';
import { 
  ShoppingBag, 
  MapPin, 
  Store, 
  Bike, 
  ShieldCheck, 
  ChevronRight,
  Banknote
} from 'lucide-react';

const CustomerSiteLayout: React.FC = () => {
  const { role, setRole, settings, selectedAddress } = useDelivery();
  const [activeSite, setActiveSite] = useState<PortalRole>(() => {
    const params = new URLSearchParams(window.location.search);
    const portalQuery = params.get('portal') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(portalQuery)) return portalQuery;

    const hash = window.location.hash.replace('#', '') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) return hash;

    return 'customer';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) {
        setActiveSite(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* If customer site is active, show the genuine Foodpanda/Pathao style Customer Header */}
      {activeSite === 'customer' ? (
        <header className="bg-rose-600 text-white sticky top-0 z-40 shadow-sm">
          {/* Top COD Info Line */}
          <div className="bg-rose-700/80 px-4 py-1 text-center text-xs font-medium text-rose-100 flex items-center justify-center gap-2">
            <Banknote className="w-3.5 h-3.5 text-amber-300" />
            <span>100% Cash On Delivery: Delivery Rate {settings.currency_symbol}{settings.base_delivery_charge} base + {settings.currency_symbol}{settings.per_km_delivery_charge}/km</span>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSite('customer')}>
              <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight">FoodVibe</span>
                  <span className="bg-rose-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Customer Site #1
                  </span>
                </div>
                <p className="text-xs text-rose-100">Hot & Fresh Food Delivered to Your Doorstep</p>
              </div>
            </div>

            {/* Quick Links to other 3 sites */}
            <div className="hidden lg:flex items-center space-x-3 text-xs">
              <a 
                href="./vendor.html" 
                onClick={(e) => { e.preventDefault(); setActiveSite('vendor'); window.location.hash = 'vendor'; }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 rounded-lg text-white font-medium transition flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5" />
                <span>2. Restaurant Hub</span>
              </a>
              <a 
                href="./rider.html" 
                onClick={(e) => { e.preventDefault(); setActiveSite('rider'); window.location.hash = 'rider'; }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 rounded-lg text-white font-medium transition flex items-center gap-1"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>3. Rider App</span>
              </a>
              <a 
                href="./admin.html" 
                onClick={(e) => { e.preventDefault(); setActiveSite('admin'); window.location.hash = 'admin'; }}
                className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 rounded-lg text-rose-200 font-medium transition flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4. Admin</span>
              </a>
            </div>
          </div>
        </header>
      ) : activeSite === 'vendor' ? (
        <header className="bg-orange-600 text-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight">FoodVibe Merchant Central</span>
                <span className="ml-2 bg-orange-800 text-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Site #2</span>
              </div>
            </div>
            <button 
              onClick={() => { setActiveSite('customer'); window.location.hash = 'customer'; }}
              className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1.5 rounded-lg text-white font-semibold"
            >
              &larr; Back to Customer Site
            </button>
          </div>
        </header>
      ) : activeSite === 'rider' ? (
        <header className="bg-emerald-700 text-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight">FoodVibe Delivery Hero</span>
                <span className="ml-2 bg-emerald-900 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Site #3</span>
              </div>
            </div>
            <button 
              onClick={() => { setActiveSite('customer'); window.location.hash = 'customer'; }}
              className="text-xs bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg text-white font-semibold"
            >
              &larr; Back to Customer Site
            </button>
          </div>
        </header>
      ) : (
        <header className="bg-indigo-900 text-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight">FoodVibe Master Command</span>
                <span className="ml-2 bg-indigo-700 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Site #4</span>
              </div>
            </div>
            <button 
              onClick={() => { setActiveSite('customer'); window.location.hash = 'customer'; }}
              className="text-xs bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-white font-semibold"
            >
              &larr; Back to Customer Site
            </button>
          </div>
        </header>
      )}

      {/* Main Page View */}
      <main className="flex-1">
        {activeSite === 'customer' && <CustomerPortal />}
        {activeSite === 'vendor' && <VendorPortal />}
        {activeSite === 'rider' && <RiderPortal />}
        {activeSite === 'admin' && <AdminPortal />}
      </main>

      {/* Floating 4-Site Launcher Dock */}
      <MultiAppDock currentApp={activeSite} />
    </div>
  );
};

export default function App() {
  return (
    <DeliveryProvider>
      <CustomerSiteLayout />
    </DeliveryProvider>
  );
}
