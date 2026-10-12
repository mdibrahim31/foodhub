import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider } from './context/DeliveryContext';
import { VendorOrdersTerminal } from './components/vendor/VendorOrdersTerminal';
import './index.css';

const StandaloneOrdersApp: React.FC = () => {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
          <main className="flex-1">
            <VendorOrdersTerminal />
          </main>
        </div>
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneOrdersApp />);
