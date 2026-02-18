import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPin, MapPinPlus } from 'lucide-react';

export type PinType = 'checkin' | 'gidecekler';

export interface JourneyPin {
  id: string;
  lat: number;
  lng: number;
  type: PinType;
}

interface ProfileJourneyMapProps {
  userLocation: { lat: number; lng: number } | null;
  pins: JourneyPin[];
  onPinsChange: (pins: JourneyPin[]) => void;
  joinedCafeCoords?: { lat: number; lng: number }[];
}

const CHECKIN_COLOR = '#BC4749';
const GIDECEKLER_COLOR = '#1B4332';
const DEFAULT_CENTER = { lat: 40.991, lng: 29.027 };

const ProfileJourneyMap: React.FC<ProfileJourneyMapProps> = ({
  userLocation,
  pins,
  onPinsChange,
  joinedCafeCoords = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [pinMode, setPinMode] = useState<PinType | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const center = userLocation || DEFAULT_CENTER;

  const createPinElement = useCallback((pin: JourneyPin) => {
    const color = pin.type === 'checkin' ? CHECKIN_COLOR : GIDECEKLER_COLOR;
    const el = document.createElement('div');
    el.style.cssText = `
      width: 28px; height: 28px; background: ${color}; border: 2px solid white;
      border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    `;
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`;
    return el;
  }, []);

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const el = createPinElement(pin);
      el.onclick = (e) => {
        e.stopPropagation();
        onPinsChange(pins.filter((p) => p.id !== pin.id));
      };
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [pins, createPinElement, onPinsChange]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [center.lng, center.lat],
      zoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      const userEl = document.createElement('div');
      userEl.innerHTML = `<div style="width: 16px; height: 16px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(59,130,246,0.5);"></div>`;
      new maplibregl.Marker({ element: userEl })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      setMapReady(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setCenter([center.lng, center.lat]);
    }
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (mapReady) renderMarkers();
  }, [mapReady, renderMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!pinMode) return;
      const { lat, lng } = e.lngLat;
      const newPin: JourneyPin = {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        lat,
        lng,
        type: pinMode,
      };
      onPinsChange([...pins, newPin]);
      setPinMode(null);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [pinMode, mapReady, pins, onPinsChange]);

  return (
    <div className={`relative w-full rounded-[1.5rem] overflow-hidden border border-white/10 shadow-xl ${pinMode ? 'cursor-crosshair' : ''}`}>
      <div ref={mapContainerRef} className="w-full h-44" />
      <div className="absolute bottom-3 left-3 flex gap-2">
        <button
          onClick={() => setPinMode((m) => (m === 'checkin' ? null : 'checkin'))}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            pinMode === 'checkin'
              ? 'bg-[#BC4749] text-white border-2 border-white shadow-lg'
              : 'bg-white/90 backdrop-blur-md text-[#BC4749] border-2 border-[#BC4749]/30'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Check-in
        </button>
        <button
          onClick={() => setPinMode((m) => (m === 'gidecekler' ? null : 'gidecekler'))}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            pinMode === 'gidecekler'
              ? 'bg-[#1B4332] text-white border-2 border-white shadow-lg'
              : 'bg-white/90 backdrop-blur-md text-[#1B4332] border-2 border-[#1B4332]/30'
          }`}
        >
          <MapPinPlus className="w-3.5 h-3.5" />
          Gidecekler
        </button>
      </div>
      {pinMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
          Haritada konum seçin
        </div>
      )}
    </div>
  );
};

export default ProfileJourneyMap;
