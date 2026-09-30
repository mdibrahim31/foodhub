import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { VendorPortal } from './components/vendor/VendorPortal';
import './index.css';

const StandaloneVendorApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Vendor Body */}
        <main className="flex-1">
          <VendorPortal />
        </main>
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneVendorApp />);
