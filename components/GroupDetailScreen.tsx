import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, MapPin, Star, Compass, ArrowRight, Loader2 } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { CafeCollection, Cafe } from '../types';
import { CAFES } from '../data';

interface GroupDetailScreenProps {
  collection: CafeCollection;
  onBack: () => void;
  onSelectCafe: (cafe: Cafe) => void;
  cafes: Cafe[];
}

const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ collection, onBack, onSelectCafe, cafes }) => {
  const collectionCafes = cafes.filter(c => collection.cafeIds.includes(c.id));
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      setMapLoaded(false);
    }

    const initialCenter = collectionCafes.length > 0
      ? [collectionCafes[0].coordinates.lng, collectionCafes[0].coordinates.lat]
      : [29.0270, 40.9910];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: initialCenter as [number, number],
      zoom: 14.5,
      attributionControl: false,
    });

    mapInstance.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      if (collectionCafes.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        collectionCafes.forEach(c => bounds.extend([c.coordinates.lng, c.coordinates.lat]));
        map.fitBounds(bounds, { padding: 80, duration: 2000 });
      }

      collectionCafes.forEach(cafe => {
        const el = document.createElement('div');
        el.className = 'collection-marker-pill';
        el.style.backgroundColor = 'white';
        el.style.padding = '6px 12px';
        el.style.borderRadius = '16px';
        el.style.border = '2px solid #1B4332';
        el.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '6px';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s';

        el.innerHTML = `
          <span style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 11px; color: #1B4332; white-space: nowrap;">${cafe.name}</span>
          <div style="display: flex; align-items: center; gap: 2px; background: #FAF9F6; padding: 2px 6px; border-radius: 8px;">
             <svg width="8" height="8" viewBox="0 0 24 24" fill="#BC4749" stroke="#BC4749"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
             <span style="font-size: 10px; font-weight: 800; color: #1B4332;">${cafe.rating}</span>
          </div>
        `;

        el.onclick = () => onSelectCafe(cafe);
        new maplibregl.Marker({ element: el })
          .setLngLat([cafe.coordinates.lng, cafe.coordinates.lat])
          .addTo(map);
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapLoaded(false);
      }
    };
  }, [collection.id]);

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF9F6] animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="relative h-[45%] shrink-0">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none" />

        <div className="absolute top-10 left-6 right-6 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#1B4332] active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50">
            <MapPin className="w-4 h-4 text-[#BC4749]" />
            <span className="text-[11px] font-bold text-[#1B4332] uppercase tracking-widest">{collection.tag}</span>
          </div>
        </div>

        {!mapLoaded && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 px-8 pt-4 space-y-8 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-2">
          <h1 className="font-outfit text-2xl font-bold text-[#1B4332]">{collection.title}</h1>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed italic">
            "{collection.description}"
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-outfit text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">KEŞİF ROTASI</h2>
            <div className="flex -space-x-3">
              {collectionCafes.slice(0, 3).map((c, i) => (
                <img key={i} src={c.image} className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" alt="Cafe preview" />
              ))}
            </div>
          </div>

          {collectionCafes.map((cafe) => (
            <div
              key={cafe.id}
              onClick={() => onSelectCafe(cafe)}
              className="bg-white rounded-[2.8rem] p-4 flex gap-5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="relative shrink-0">
                <img src={cafe.image} className="w-24 h-24 rounded-[2.2rem] object-cover shadow-sm" alt={cafe.name} />
                <div className="absolute -top-2 -right-2 bg-white p-1.5 rounded-2xl shadow-md">
                  <div className="w-6 h-6 bg-[#BC4749] rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h3 className="font-outfit text-lg font-bold text-[#1B4332] leading-tight group-hover:text-[#BC4749] transition-colors truncate">{cafe.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 mt-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#BC4749]" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter truncate">{cafe.address}</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-1.5">
                    {cafe.moods.slice(0, 2).map(m => (
                      <span key={m} className="px-2.5 py-1 bg-[#FAF9F6] rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{m}</span>
                    ))}
                  </div>
                  <span className="text-xs font-black text-[#1B4332]">
                    {cafe.rating}
                    {cafe.reviews > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 ml-1">({cafe.reviews})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailScreen;