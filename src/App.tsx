import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext';
import { PortalRole } from './types/database';
import { LayoutGrid, User, Store, Bike, ShieldCheck, X, ChevronRight } from 'lucide-react';

const CustomerPortal = lazy(() => import('./components/customer/CustomerPortal').then(m => ({ default: m.CustomerPortal })));
const VendorPortal = lazy(() => import('./components/vendor/VendorPortal').then(m => ({ default: m.VendorPortal })));
const RiderPortal = lazy(() => import('./components/rider/RiderPortal').then(m => ({ default: m.RiderPortal })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then(m => ({ default: m.AdminPortal })));

function PortalIcon({ id, className }: { id: PortalRole, className?: string }) {
  switch (id) {
    case 'customer': return <User className={className} />;
    case 'vendor': return <Store className={className} />;
    case 'rider': return <Bike className={className} />;
    case 'admin': return <ShieldCheck className={className} />;
    default: return <User className={className} />;
  }
}

function CustomerSiteLayout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const { 
    role, 
    setRole, 
    currentUser,
    isSupabaseConfigured, 
    supabaseConfig, 
    connectSupabase 
  } = useDelivery();

  const [dbUrl, setDbUrl] = useState(supabaseConfig.url || '');
  const [dbKey, setDbKey] = useState(supabaseConfig.anonKey || '');
  const [isConnecting, setIsConnecting] = useState(false);

  // Only show switcher in development/preview environments (not on production github.io)
  const isPreview = typeof window !== 'undefined' && 
    !window.location.hostname.includes('github.io');

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setIsConnecting(true);
    const res = await connectSupabase(dbUrl, dbKey);
    setIsConnecting(false);
    if (res.success) {
      alert('✅ Connected to Supabase!');
      setIsDbModalOpen(false);
    } else {
      alert('❌ ' + res.message);
    }
  }

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      {/* AI Studio Preview Site Switcher - Pull-out Sidebar Style */}
      {isPreview && (
        <>
          <motion.div 
            initial={false}
            animate={{ x: isExpanded ? 0 : -52 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] flex items-center group pointer-events-none"
          >
            {/* Main Sidebar Content */}
            <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-r-2xl shadow-2xl border-y border-r border-slate-200/60 p-2 gap-2 pointer-events-auto w-[52px]">
              {[
                { id: 'customer' as PortalRole, label: 'Customer', activeBg: 'bg-orange-600 text-white', inactiveText: 'text-slate-500' },
                { id: 'vendor' as PortalRole, label: 'Vendor', activeBg: 'bg-emerald-600 text-white', inactiveText: 'text-slate-500' },
                { id: 'rider' as PortalRole, label: 'Rider', activeBg: 'bg-amber-500 text-white', inactiveText: 'text-slate-500' },
                { id: 'admin' as PortalRole, label: 'Admin', activeBg: 'bg-rose-600 text-white', inactiveText: 'text-slate-500' },
              ].map((site) => (
                <button
                  key={site.id}
                  onClick={() => setRole(site.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 group/btn relative ${
                    role === site.id 
                      ? `${site.activeBg} shadow-md shadow-black/10` 
                      : `hover:bg-slate-100 ${site.inactiveText}`
                  }`}
                >
                  <PortalIcon id={site.id} className="w-5 h-5" />
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover/btn:translate-x-0 whitespace-nowrap z-[10000] shadow-xl">
                    {site.label} Portal
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                </button>
              ))}

              <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                <button 
                  onClick={() => setIsDbModalOpen(true)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 group/db relative ${
                    isSupabaseConfigured ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                  title="Database Connection"
                >
                  <LayoutGrid className="w-5 h-5" />
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover/db:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover/db:translate-x-0 whitespace-nowrap z-[10000] shadow-xl">
                    {isSupabaseConfigured ? 'DB Connected' : 'Connect Supabase'}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                </button>
              </div>
            </div>

            {/* Pull Handle - Tene ber kora tab */}
            <div className="flex flex-col items-start pointer-events-auto">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-6 h-24 bg-white/95 backdrop-blur-md border-y border-r border-slate-200/60 rounded-r-2xl shadow-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer group active:scale-95"
                title={isExpanded ? "Collapse" : "Pull Out Switcher"}
              >
                <div className="flex flex-col gap-1">
                  <div className="w-0.5 h-3 bg-slate-300 rounded-full group-hover:bg-orange-400 transition-colors" />
                  <div className="w-0.5 h-3 bg-slate-300 rounded-full group-hover:bg-orange-400 transition-colors" />
                  <div className="w-0.5 h-3 bg-slate-300 rounded-full group-hover:bg-orange-400 transition-colors" />
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-orange-500' : 'animate-pulse'}`} />
                <span className="[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">
                  {isExpanded ? 'CLOSE' : 'PULL'}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Database Connection Modal */}
          <AnimatePresence>
            {isDbModalOpen && (
              <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDbModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Supabase Connection</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connect your own database</p>
                        </div>
                      </div>
                      <button onClick={() => setIsDbModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleConnect} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Supabase Project URL</label>
                        <input 
                          type="url"
                          required
                          value={dbUrl}
                          onChange={(e) => setDbUrl(e.target.value)}
                          placeholder="https://your-project.supabase.co"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Public Anon Key</label>
                        <textarea 
                          required
                          value={dbKey}
                          onChange={(e) => setDbKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[100px] resize-none"
                        />
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl">
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                          ⚠️ You can find these in your Supabase Project Settings under <b>API</b>.
                          This will allow persistent data storage for Vendors, Riders, and Orders.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isConnecting}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
                          isConnecting 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                        }`}
                      >
                        {isConnecting ? 'Testing Connection...' : 'Connect & Sync Database'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          {role === 'customer' && <CustomerPortal />}
          {role === 'vendor' && <VendorPortal />}
          {role === 'rider' && <RiderPortal />}
          {role === 'admin' && <AdminPortal />}
        </Suspense>
      </main>
    </div>
  );
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
