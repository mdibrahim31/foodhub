import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { RiderPortal } from './components/rider/RiderPortal';
import './index.css';

const StandaloneRiderApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Rider Body */}
        <main className="flex-1">
          <RiderPortal />
        </main>
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneRiderApp />);
