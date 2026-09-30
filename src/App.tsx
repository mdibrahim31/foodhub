import React from 'react';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { Header } from './components/common/Header';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { VendorPortal } from './components/vendor/VendorPortal';
import { RiderPortal } from './components/rider/RiderPortal';
import { AdminPortal } from './components/admin/AdminPortal';

const MainLayout: React.FC = () => {
  const { role } = useDelivery();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-rose-500 selection:text-white">
      <Header />

      <div className="flex-1">
        {role === 'customer' && <CustomerPortal />}
        {role === 'vendor' && <VendorPortal />}
        {role === 'rider' && <RiderPortal />}
        {role === 'admin' && <AdminPortal />}
      </div>

      {/* Global Quick Info Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-xs border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
              FV
            </div>
            <span className="text-gray-200 font-bold">FoodVibe Delivery System</span>
            <span>&bull; Pure Cash on Delivery Network</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>4 Portals: Customer &bull; Vendor &bull; Rider &bull; Admin</span>
            <span>&bull;</span>
            <span>5s Live GPS Dispatch</span>
            <span>&bull;</span>
            <span>Supabase Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <DeliveryProvider>
      <MainLayout />
    </DeliveryProvider>
  );
}
