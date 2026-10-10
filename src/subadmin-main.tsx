import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider } from './context/DeliveryContext';
import { SubAdminPortal } from './components/admin/SubAdminPortal';
import './index.css';

console.log('📦 foodiplace: Sub-Admin App Initializing...');

const StandaloneSubAdminApp: React.FC = () => {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
          <main className="flex-1">
            <SubAdminPortal />
          </main>
        </div>
      </DeliveryProvider>
    </AppErrorBoundary>
  );
};

console.log('🚀 foodiplace: Sub-Admin App Rendering to DOM...');
createRoot(document.getElementById('root')!).render(<StandaloneSubAdminApp />);
