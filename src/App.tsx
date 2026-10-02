import React, { useState, useEffect } from 'react';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { VendorPortal } from './components/vendor/VendorPortal';
import { RiderPortal } from './components/rider/RiderPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { PortalRole } from './types/database';

const CustomerSiteLayout: React.FC = () => {
  const { role, setRole, settings, selectedAddress } = useDelivery();
  const [activeSite, setActiveSite] = useState<PortalRole>(() => {
    const params = new URLSearchParams(window.location.search);
    const portalQuery = params.get('portal') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(portalQuery)) return portalQuery;

    const hash = window.location.hash.replace('#', '') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) return hash;

    return 'customer';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) {
        setActiveSite(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="flex-1">
        {activeSite === 'customer' && <CustomerPortal />}
        {activeSite === 'vendor' && <VendorPortal />}
        {activeSite === 'rider' && <RiderPortal />}
        {activeSite === 'admin' && <AdminPortal />}
      </main>
    </div>
  );
};

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Interface Recovery</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#customer';
                window.location.reload();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <CustomerSiteLayout />
      </DeliveryProvider>
    </AppErrorBoundary>
  );
}
