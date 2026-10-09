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
        <VendorOrdersTerminal />
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneOrdersApp />);
