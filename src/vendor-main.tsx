import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { VendorPortal } from './components/vendor/VendorPortal';
import { MultiAppDock } from './components/common/MultiAppDock';
import './index.css';

const StandaloneVendorApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Dedicated Restaurant / Vendor Site Header */}
        <header className="bg-orange-600 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight">FoodVibe Merchant Central</span>
                  <span className="bg-orange-800 text-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Vendor Site #2
                  </span>
                </div>
                <p className="text-xs text-orange-100">Restaurant Kitchen Display & Cash-on-Pickup Desk</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <a 
                href="./index.html" 
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg font-semibold transition"
              >
                Go to Customer Site &rarr;
              </a>
            </div>
          </div>
        </header>

        {/* Vendor Body */}
        <main className="flex-1">
          <VendorPortal />
        </main>

        <MultiAppDock currentApp="vendor" />
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneVendorApp />);
