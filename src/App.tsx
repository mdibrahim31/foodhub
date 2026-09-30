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

export default function App() {
  return (
    <DeliveryProvider>
      <CustomerSiteLayout />
    </DeliveryProvider>
  );
}
