import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { RiderPortal } from './components/rider/RiderPortal';
import { MultiAppDock } from './components/common/MultiAppDock';
import './index.css';

const StandaloneRiderApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Dedicated Rider App Header */}
        <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight">FoodVibe Delivery Hero</span>
                  <span className="bg-emerald-900 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Rider Site #3
                  </span>
                </div>
                <p className="text-xs text-emerald-100">Live 5-Second GPS Beacon & Proximity Dispatcher</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <a 
                href="./index.html" 
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold transition"
              >
                Go to Customer Site &rarr;
              </a>
            </div>
          </div>
        </header>

        {/* Rider Body */}
        <main className="flex-1">
          <RiderPortal />
        </main>

        <MultiAppDock currentApp="rider" />
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneRiderApp />);
