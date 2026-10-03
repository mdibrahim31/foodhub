import React, { useState, useEffect } from 'react';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { VendorPortal } from './components/vendor/VendorPortal';
import { RiderPortal } from './components/rider/RiderPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { PortalRole } from './types/database';

const CustomerSiteLayout: React.FC = () => {
  const { role, setRole } = useDelivery();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalQuery = params.get('portal') as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(portalQuery)) {
      setRole(portalQuery);
      return;
    }

    const hash = window.location.hash.replace('#', '').split('?')[0] as PortalRole;
    if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) {
      setRole(hash);
    }
  }, [setRole]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0] as PortalRole;
      if (['customer', 'vendor', 'rider', 'admin'].includes(hash)) {
        setRole(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setRole]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="flex-1">
        {role === 'customer' && <CustomerPortal />}
        {role === 'vendor' && <VendorPortal />}
        {role === 'rider' && <RiderPortal />}
        {role === 'admin' && <AdminPortal />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <DeliveryProvider>
        <CustomerSiteLayout />
      </DeliveryProvider>
    </AppErrorBoundary>
  );
}
