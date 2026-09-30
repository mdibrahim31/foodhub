import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { VendorOrdersTerminal } from './components/vendor/VendorOrdersTerminal';
import './index.css';

const StandaloneOrdersApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <VendorOrdersTerminal />
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneOrdersApp />);
