import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { AdminPortal } from './components/admin/AdminPortal';
import './index.css';

const StandaloneAdminApp: React.FC = () => {
  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Admin Body */}
        <main className="flex-1">
          <AdminPortal />
        </main>
      </div>
    </DeliveryProvider>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneAdminApp />);
