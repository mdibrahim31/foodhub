import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { MenuItem, Order, OrderStatus } from '../../types/database';
import { 
  Store, 
  Clock, 
  Utensils, 
  Banknote, 
  CheckCircle, 
  Plus, 
  Trash2, 
  MapPin, 
  ExternalLink,
  ChefHat,
  Bike
} from 'lucide-react';

export const VendorPortal: React.FC = () => {
  const { 
    vendors, 
    currentVendor, 
    setCurrentVendor, 
    menuItems, 
    addMenuItem, 
    toggleMenuItemAvailability, 
    deleteMenuItem,
    orders, 
    updateOrderStatus,
    settings,
    riders
  } = useDelivery();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'cash'>('orders');
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');

  if (!currentVendor) {
    return (
      <div className="p-8 text-center text-gray-500">
        No active vendor selected. Please register a vendor in Admin or choose from list.
      </div>
    );
  }

  // Filter orders for this restaurant
  const vendorOrders = orders.filter((o) => o.vendor_id === currentVendor.id);
  const pendingOrders = vendorOrders.filter((o) => o.status === 'pending');
  const preparingOrders = vendorOrders.filter((o) => o.status === 'vendor_accepted' || o.status === 'food_preparing');
  const readyForPickupOrders = vendorOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'rider_assigned' || o.status === 'rider_arrived_at_vendor');
  const completedOrders = vendorOrders.filter((o) => ['rider_on_way_to_customer', 'delivered'].includes(o.status));

  // Cash calculations:
  // In this COD model, the restaurant receives the food bill in CASH from the rider upon food collection
  const cashCollectedFromRiders = vendorOrders
    .filter((o) => o.food_cash_paid_to_vendor || ['rider_on_way_to_customer', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.food_total, 0);

  const pendingCashToReceive = vendorOrders
    .filter((o) => !o.food_cash_paid_to_vendor && !['delivered', 'cancelled'].includes(o.status))
    .reduce((sum, o) => sum + o.food_total, 0);

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) return;

    addMenuItem({
      vendor_id: currentVendor.id,
      name: dishName.trim(),
      description: dishDescription.trim(),
      price: parseFloat(dishPrice),
      category: dishCategory,
      is_available: true,
      image_url: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    });

    setDishName('');
    setDishPrice('');
    setDishDescription('');
    setDishImageUrl('');
    setIsAddDishOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sub Header: Restaurant Switcher & Status */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <select
                  value={currentVendor.id}
                  onChange={(e) => {
                    const found = vendors.find((v) => v.id === e.target.value);
                    if (found) setCurrentVendor(found);
                  }}
                  className="font-bold text-gray-900 text-sm bg-transparent border-none cursor-pointer focus:ring-0 pr-8"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kitchen Active
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                {currentVendor.address} &bull; Coordinates: {currentVendor.latitude.toFixed(4)}, {currentVendor.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Live Kitchen Queue</span>
              {pendingOrders.length + preparingOrders.length > 0 && (
                <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingOrders.length + preparingOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'menu' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Menu Items ({menuItems.filter((m) => m.vendor_id === currentVendor.id).length})
            </button>
            <button
              onClick={() => setActiveTab('cash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'cash' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* COD Restaurant Rule Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Banknote className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">Restaurant Cash Handover Protocol</h2>
              <p className="text-xs text-orange-100 mt-0.5">
                When a rider arrives to collect the food, they must pay you the full food bill amount in cash immediately.
              </p>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-xs px-4 py-2 rounded-xl text-xs font-mono">
            <span>Collected: </span>
            <span className="font-extrabold text-amber-200 text-sm">
              {settings.currency_symbol}{cashCollectedFromRiders} Cash
            </span>
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Pipeline Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. New Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>1. Incoming Orders ({pendingOrders.length})</span>
                  </h3>
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">
                    No new orders waiting
                  </div>
                ) : (
                  pendingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-xl border-2 border-red-200 shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-gray-900 text-sm">#{ord.order_code}</span>
                          <p className="text-xs text-gray-500 font-mono">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          New Request
                        </span>
                      </div>

                      <div className="space-y-1 text-xs border-y border-gray-100 py-2">
                        {ord.items?.map((it) => (
                          <div key={it.id} className="flex justify-between text-gray-700">
                            <span>{it.quantity}x {it.item_name}</span>
                            <span className="font-mono">{settings.currency_symbol}{it.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                        <span>Food Total (Cash from Rider):</span>
                        <span className="font-mono text-orange-600 text-sm">{settings.currency_symbol}{ord.food_total}</span>
                      </div>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'food_preparing')}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        Accept & Start Preparing
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 2. In Kitchen Preparing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                    <span>2. In Kitchen ({preparingOrders.length})</span>
                  </h3>
                </div>

                {preparingOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">
                    No orders being cooked
                  </div>
                ) : (
                  preparingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-gray-900 text-sm">#{ord.order_code}</span>
                          <p className="text-xs text-gray-500">{ord.items?.length} Items cooking</p>
                        </div>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Cooking
                        </span>
                      </div>

                      <div className="space-y-1 text-xs border-y border-gray-100 py-2">
                        {ord.items?.map((it) => (
                          <div key={it.id} className="flex justify-between text-gray-700">
                            <span>{it.quantity}x {it.item_name}</span>
                            <span className="font-mono">{settings.currency_symbol}{it.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'ready_for_pickup')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        Mark Ready for Rider Pickup
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 3. Ready for Rider Pickup & Cash Handover */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-blue-500" />
                    <span>3. Ready for Pickup ({readyForPickupOrders.length})</span>
                  </h3>
                </div>

                {readyForPickupOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">
                    No parcels waiting at pickup counter
                  </div>
                ) : (
                  readyForPickupOrders.map((ord) => {
                    const assignedRider = riders.find((r) => r.id === ord.rider_id);

                    return (
                      <div
                        key={ord.id}
                        className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-gray-900 text-sm">#{ord.order_code}</span>
                            <p className="text-xs text-gray-500">Destination: {ord.customer_name}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {ord.rider_id ? 'Rider Assigned' : 'Awaiting Rider'}
                          </span>
                        </div>

                        {assignedRider ? (
                          <div className="p-2.5 bg-blue-50 rounded-lg text-xs">
                            <p className="font-bold text-blue-900">Assigned: {assignedRider.name}</p>
                            <p className="text-blue-700 text-[11px]">Phone: {assignedRider.phone} ({assignedRider.vehicle_type})</p>
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-800">
                            Dispatching to riders within {settings.rider_match_radius_km} km radius...
                          </div>
                        )}

                        <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                          <div className="flex justify-between font-bold text-orange-900">
                            <span>Collect Cash from Rider:</span>
                            <span className="text-base font-mono">{settings.currency_symbol}{ord.food_total}</span>
                          </div>
                          <p className="text-[10px] text-orange-700 mt-1">
                            * Rider pays cash to restaurant when receiving package.
                          </p>
                        </div>

                        {/* Action: If rider arrives, restaurant can confirm receipt of cash */}
                        {ord.food_cash_paid_to_vendor ? (
                          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Cash Received & Handed Over</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              updateOrderStatus(ord.id, 'rider_on_way_to_customer', {
                                food_cash_paid_to_vendor: true,
                              });
                            }}
                            className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs transition"
                          >
                            Confirm Cash Received & Hand Over Food
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Restaurant Menu Catalog</h3>
                <p className="text-xs text-gray-500">Manage dishes, prices, and live in-stock toggles</p>
              </div>
              <button
                onClick={() => setIsAddDishOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Food Item</span>
              </button>
            </div>

            {/* Dishes list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems
                .filter((m) => m.vendor_id === currentVendor.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                      <p className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                        {settings.currency_symbol}{item.price}
                      </p>
                    </div>

                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                    )}

                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`text-[10px] px-2 py-1 rounded font-bold transition ${
                          item.is_available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'cash' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Cash Flow & Settlements</h3>
              <p className="text-xs text-gray-500">Every food item bill paid directly to you in cash by dispatch riders</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Cash Received</span>
                <p className="text-2xl font-black text-emerald-900 font-mono mt-1">
                  {settings.currency_symbol}{cashCollectedFromRiders}
                </p>
                <p className="text-xs text-emerald-700 mt-1">Fully handed over and pocketed by kitchen counter.</p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending Handover Cash</span>
                <p className="text-2xl font-black text-amber-900 font-mono mt-1">
                  {settings.currency_symbol}{pendingCashToReceive}
                </p>
                <p className="text-xs text-amber-700 mt-1">To be paid by arriving riders for active orders.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order Code</th>
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Food Cash Amount</th>
                    <th className="py-2.5 px-3">Cash Handover Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendorOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-2.5 px-3 font-bold text-gray-900">#{ord.order_code}</td>
                      <td className="py-2.5 px-3 text-gray-500">{new Date(ord.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-gray-800">{ord.customer_name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{settings.currency_symbol}{ord.food_total}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          ord.food_cash_paid_to_vendor
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.food_cash_paid_to_vendor ? 'Cash Paid by Rider' : 'Pending Payment'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Dish Modal */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Add Dish to Menu</h3>
              <button onClick={() => setIsAddDishOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Special Beef Biryani / Double Patty Burger"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price ({settings.currency_symbol})</label>
                  <input
                    type="number"
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    placeholder="Main Course / Beverages"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Details of ingredients, portion size, spices..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
