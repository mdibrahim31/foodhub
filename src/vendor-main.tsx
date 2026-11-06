import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider } from './context/DeliveryContext';
import { PartnerAccessPinGate } from './components/vendor/PartnerAccessPinGate';
import { VendorPortal } from './components/vendor/VendorPortal';
import './index.css';

const StandaloneVendorApp: React.FC = () => {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <PartnerAccessPinGate>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            <main className="flex-1">
              <VendorPortal />
            </main>
          </div>
        </PartnerAccessPinGate>
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneVendorApp />);
