import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { AdminPortal } from './components/admin/AdminPortal';
import { MultiAppDock } from './components/common/MultiAppDock';
import './index.css';

const StandaloneAdminApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Dedicated Admin Dashboard Header */}
        <header className="bg-indigo-900 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-black text-xl shadow-xs">
                FV
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight">FoodVibe Master Command</span>
                  <span className="bg-indigo-700 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin Site #4
                  </span>
                </div>
                <p className="text-xs text-indigo-200">Per-KM Pricing, Radius Rules, Vendor Pinning & Supabase SQL</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <a 
                href="./index.html" 
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                Go to Customer Site &rarr;
              </a>
            </div>
          </div>
        </header>

        {/* Admin Body */}
        <main className="flex-1">
          <AdminPortal />
        </main>

        <MultiAppDock currentApp="admin" />
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneAdminApp />);
