import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { CustomerAddress } from '../../types/database';
import { MapPin, Plus, Check, Trash2, Navigation, X } from 'lucide-react';

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({ isOpen, onClose }) => {
  const { addresses, selectedAddress, setSelectedAddress, addAddress, deleteAddress } = useDelivery();
  
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [customerName, setCustomerName] = useState('Shakib Al Hasan');
  const [customerPhone, setCustomerPhone] = useState('+8801700998877');
  const [addressLine, setAddressLine] = useState('');
  const [details, setDetails] = useState('');
  
  // Pin location on map (Default center Banani/Dhaka)
  const [pinLat, setPinLat] = useState(23.7925);
  const [pinLng, setPinLng] = useState(90.4075);
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinLat(pos.coords.latitude);
        setPinLng(pos.coords.longitude);
        setAddressLine(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      (err) => {
        alert('Could not retrieve GPS location: ' + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);
    if (!addressLine) {
      setAddressLine(`Selected Point: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) return;

    addAddress({
      customer_name: customerName,
      customer_phone: customerPhone,
      label,
      address_line: addressLine,
      details,
      latitude: pinLat,
      longitude: pinLng,
      is_default: addresses.length === 0,
    });

    setIsAdding(false);
    setAddressLine('');
    setDetails('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Customer Address Book & Map</h3>
              <p className="text-xs text-gray-500">Set exact coordinates for accurate per-km delivery fee calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!isAdding ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Saved Delivery Locations ({addresses.length})
                </span>
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Location</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {addresses.map((addr) => {
                  const isCurrent = selectedAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                        isCurrent
                          ? 'border-rose-600 bg-rose-50/40 ring-1 ring-rose-600/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${isCurrent ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900 text-sm">{addr.label}</span>
                            {addr.is_default && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                            {isCurrent && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Active Delivery Target
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-700 mt-1">{addr.address_line}</p>
                          {addr.details && (
                            <p className="text-xs text-gray-500 mt-0.5">Details: {addr.details}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-2 text-[11px] text-gray-400 font-mono">
                            <span>Lat: {addr.latitude.toFixed(4)}</span>
                            <span>Lng: {addr.longitude.toFixed(4)}</span>
                            <span>Contact: {addr.customer_phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(addr.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800">Pin Location on Interactive Map</span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Use My GPS Location'}</span>
                </button>
              </div>

              {/* Map View */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Click anywhere on the map to set your delivery pin:</p>
                <InteractiveMap
                  center={[pinLat, pinLng]}
                  zoom={15}
                  markers={[
                    {
                      id: 'new-pin',
                      latitude: pinLat,
                      longitude: pinLng,
                      title: 'Delivery Pin Point',
                      subtitle: `${pinLat.toFixed(4)}, ${pinLng.toFixed(4)}`,
                      type: 'customer',
                      isDraggable: true,
                    },
                  ]}
                  onMapClick={handleMapClick}
                  onMarkerDragEnd={(_, lat, lng) => {
                    setPinLat(lat);
                    setPinLng(lng);
                  }}
                  heightClass="h-56"
                />
                <div className="text-[11px] text-gray-500 font-mono flex justify-between px-1">
                  <span>Selected Lat: {pinLat.toFixed(5)}</span>
                  <span>Selected Lng: {pinLng.toFixed(5)}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                  <div className="flex space-x-2">
                    {(['Home', 'Office', 'Other'] as const).map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLabel(l)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                          label === l
                            ? 'bg-rose-50 border-rose-600 text-rose-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. House 14, Road 7, Sector 3, Uttara or Banani"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Flat / Floor / Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Apartment 3A, 3rd Floor, Leave at front door"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-md"
                >
                  Save Address & Set as Target
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Selected: <strong className="text-gray-800">{selectedAddress?.label || 'None'}</strong> - {selectedAddress?.address_line}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
