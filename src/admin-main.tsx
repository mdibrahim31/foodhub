import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider } from './context/DeliveryContext';
import { AdminPortal } from './components/admin/AdminPortal';
import './index.css';

console.log('📦 foodiplace: Admin App Initializing...');

const StandaloneAdminApp: React.FC = () => {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          {/* Admin Body */}
          <main className="flex-1">
            <AdminPortal />
          </main>
        </div>
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

console.log('🚀 foodiplace: Admin App Rendering to DOM...');
createRoot(document.getElementById('root')!).render(<StandaloneAdminApp />);
