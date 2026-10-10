import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  ShieldCheck, 
  ChevronUp, 
  Layers, 
  ExternalLink 
} from 'lucide-react';

interface MultiAppDockProps {
  currentApp: 'customer' | 'vendor' | 'rider' | 'admin' | 'orders' | 'subadmin';
}

export const MultiAppDock: React.FC<MultiAppDockProps> = ({ currentApp }) => {
  const [isOpen, setIsOpen] = useState(false);

  const apps = [
    {
      id: 'customer',
      title: '1. Customer Ordering App',
      desc: 'Browse restaurants, food cart, Cash On Delivery & live tracking',
      url: './customer.html',
      hashUrl: './#customer',
      icon: <ShoppingBag className="w-5 h-5 text-orange-500" />,
      badge: 'Customer App',
      theme: 'border-orange-200 hover:border-orange-400 bg-orange-50/50',
    },
    {
      id: 'vendor',
      title: '2. Restaurant / Vendor Hub',
      desc: 'Kitchen display queue, menu management & live store operations',
      url: './vendor.html',
      hashUrl: './#vendor',
      icon: <Store className="w-5 h-5 text-emerald-500" />,
      badge: 'Merchant Portal',
      theme: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50',
    },
    {
      id: 'orders',
      title: '3. Kitchen Live Orders Terminal',
      desc: 'Dedicated sound alerts and order processing screen for kitchen staff',
      url: './orders.html',
      hashUrl: './#orders',
      icon: <ShoppingBag className="w-5 h-5 text-rose-500" />,
      badge: 'Live Kitchen',
      theme: 'border-rose-200 hover:border-rose-400 bg-rose-50/50',
    },
    {
      id: 'rider',
      title: '4. Rider / Delivery App',
      desc: 'Live GPS beacon, proximity dispatch radar & COD cash collection',
      url: './rider.html',
      hashUrl: './#rider',
      icon: <Bike className="w-5 h-5 text-amber-500" />,
      badge: 'Delivery Partner',
      theme: 'border-amber-200 hover:border-amber-400 bg-amber-50/50',
    },
    {
      id: 'admin',
      title: '5. Super Admin Control Center',
      desc: 'Per-km pricing, rider dispatch radius, vendor zones & database control',
      url: './admin.html',
      hashUrl: './#admin',
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      badge: 'Super Admin',
      theme: 'border-rose-200 hover:border-rose-400 bg-rose-50/50',
    },
    {
      id: 'subadmin',
      title: '6. Sub-Admin Operations Hub',
      desc: 'Daily order monitoring, vendor pause/resume, and rider fleet dispatch',
      url: './subadmin.html',
      hashUrl: './#subadmin',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
      badge: 'Operations Desk',
      theme: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/50',
    },
  ];

  const current = apps.find(a => a.id === currentApp);

  const handleNavigate = (appItem: typeof apps[0]) => {
    // If running in development or multi-page environment:
    // First try relative html link, or fallback to hash router
    try {
      window.location.href = appItem.url;
    } catch {
      window.location.hash = appItem.id;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 sm:w-96 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gray-900 text-white rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs">FoodHub 4-in-1 Platform</h4>
                <p className="text-[10px] text-gray-500">Same Repo &bull; 4 Standalone Websites</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
            >
              &times;
            </button>
          </div>

          <div className="space-y-2">
            {apps.map((app) => {
              const isCurrent = app.id === currentApp;
              return (
                <div
                  key={app.id}
                  onClick={() => {
                    handleNavigate(app);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                      : 'border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-white/10' : 'bg-gray-100'}`}>
                      {app.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold text-xs ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                          {app.title}
                        </span>
                        {isCurrent && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            Current Site
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] line-clamp-1 ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                        {app.desc}
                      </p>
                    </div>
                  </div>

                  <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <span>Powered by Supabase & GitHub Actions</span>
            <button
              onClick={() => setIsOpen(false)}
              className="font-bold text-gray-700 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-full shadow-xl border border-gray-700 text-xs font-semibold transition-transform hover:scale-105"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Switch Website (4 Sites)</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
};
