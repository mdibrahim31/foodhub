import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  type: 'vendor' | 'customer' | 'rider';
  isDraggable?: boolean;
}

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  radiusCircle?: {
    center: [number, number];
    radiusMeters: number;
    color?: string;
    label?: string;
  };
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  heightClass?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom = 14,
  markers = [],
  radiusCircle,
  onMapClick,
  onMarkerDragEnd,
  heightClass = 'h-72',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Center & Zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Click handler
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    mapInstanceRef.current.on('click', clickHandler);
    return () => {
      mapInstanceRef.current?.off('click', clickHandler);
    };
  }, [onMapClick]);

  // Render Markers & Radius
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Draw Radius Circle if provided (e.g. 1km rider proximity)
    if (radiusCircle) {
      const circle = L.circle(radiusCircle.center, {
        color: radiusCircle.color || '#10b981',
        fillColor: radiusCircle.color || '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '4, 4',
        radius: radiusCircle.radiusMeters,
      }).addTo(layerGroup);

      if (radiusCircle.label) {
        circle.bindTooltip(radiusCircle.label, { permanent: true, direction: 'top', className: 'bg-emerald-800 text-white text-xs px-2 py-1 rounded shadow' });
      }
    }

    // 2. Custom Icons
    const createCustomIcon = (type: 'vendor' | 'customer' | 'rider') => {
      let bg = 'bg-orange-600';
      let iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`;

      if (type === 'customer') {
        bg = 'bg-blue-600';
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
      } else if (type === 'rider') {
        bg = 'bg-emerald-600 animate-pulse';
        iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
      }

      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="${bg} p-2 rounded-full shadow-lg border-2 border-white transform transition hover:scale-110">
              ${iconSvg}
            </div>
            ${type === 'rider' ? '<div class="absolute -inset-1 bg-emerald-400 rounded-full animate-ping opacity-40"></div>' : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // 3. Add each marker
    markers.forEach((m) => {
      const marker = L.marker([m.latitude, m.longitude], {
        icon: createCustomIcon(m.type),
        draggable: Boolean(m.isDraggable),
      }).addTo(layerGroup);

      const popupContent = `
        <div class="p-1 font-sans text-xs">
          <p class="font-bold text-gray-900">${m.title}</p>
          ${m.subtitle ? `<p class="text-gray-600 mt-0.5">${m.subtitle}</p>` : ''}
          <p class="text-[10px] text-gray-400 mt-1 font-mono">${m.latitude.toFixed(4)}, ${m.longitude.toFixed(4)}</p>
        </div>
      `;
      marker.bindPopup(popupContent);

      if (m.isDraggable && onMarkerDragEnd) {
        marker.on('dragend', (e) => {
          const target = e.target as L.Marker;
          const pos = target.getLatLng();
          onMarkerDragEnd(m.id, pos.lat, pos.lng);
        });
      }
    });
  }, [markers, radiusCircle, onMarkerDragEnd]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
