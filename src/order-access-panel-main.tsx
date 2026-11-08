import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider } from './context/DeliveryContext';
import { OrderAccessPinGate } from './components/orders/OrderAccessPinGate';
import { VendorOrdersTerminal } from './components/vendor/VendorOrdersTerminal';
import './index.css';

const StandaloneOrderAccessApp: React.FC = () => {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <OrderAccessPinGate>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            <main className="flex-1">
              <VendorOrdersTerminal />
            </main>
          </div>
        </OrderAccessPinGate>
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneOrderAccessApp />);
