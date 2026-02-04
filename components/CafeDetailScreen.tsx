
import React, { useEffect, useRef } from 'react';
import { ChevronLeft, Share2, Star, Wifi, Zap, Wind, Navigation2, MapPin, Shield } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { Cafe } from '../types';

interface CafeDetailScreenProps {
  cafe: Cafe;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onJoin: () => void;
  onGoToMap?: (cafe: Cafe) => void;
}

const CafeDetailScreen: React.FC<CafeDetailScreenProps> = ({ cafe, onBack, onJoin, onGoToMap }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !cafe.coordinates) return;
    const { lat, lng } = cafe.coordinates;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [lng, lat],
      zoom: 15,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on('load', () => {
      const el = document.createElement('div');
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.backgroundColor = '#BC4749';
      el.style.borderRadius = '10px';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 4px 12px rgba(188,71,73,0.4)';
      new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cafe.id, cafe.coordinates?.lat, cafe.coordinates?.lng]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: cafe.name,
          text: cafe.description,
          url: window.location.href,
        });
      } else {
        alert("Paylaşım özelliği bu tarayıcıda desteklenmiyor.");
      }
    } catch (err) {
      console.error("Paylaşım hatası:", err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-[45%] shrink-0">
        <img src={cafe.image} className="w-full h-full object-cover" alt={cafe.name} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-white" />

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
          >
            <Share2 className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-8 -mt-12 relative z-10 bg-white rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] overflow-y-auto no-scrollbar pb-16">
        <div className="mt-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="font-outfit text-3xl font-bold text-[#1B4332]">{cafe.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Navigation2 className="w-3.5 h-3.5 text-[#BC4749]" />
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{cafe.address}</span>
              </div>
            </div>
            <div className="bg-[#FAF9F6] p-4 rounded-[1.8rem] shadow-sm border border-gray-100 flex flex-col items-center">
              <Star className="w-5 h-5 text-[#BC4749] fill-[#BC4749]" />
              <span className="text-xs font-black text-[#1B4332] mt-1">{cafe.rating}</span>
              {cafe.reviews > 0 && (
                <span className="text-[10px] font-bold text-gray-400 mt-0.5">{cafe.reviews} yorum</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 my-8">
            {[
              { icon: <Wifi className="w-5 h-5" />, label: cafe.wifiSpeed || 'Hızlı WiFi' },
              { icon: <Zap className="w-5 h-5" />, label: 'Güç / Priz' },
              { icon: <Wind className="w-5 h-5" />, label: cafe.noiseLevel || 'Sakin' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 bg-white/40 backdrop-blur-md p-5 rounded-[2rem] flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm">
                <div className="text-[#1B4332] opacity-80">{item.icon}</div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Konum - Mekan haritada */}
          <div className="mb-10 p-5 bg-[#1B4332]/5 backdrop-blur-xl rounded-[3rem] border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#BC4749]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#BC4749]" />
              </div>
              <h3 className="font-outfit text-xs font-black text-[#1B4332] uppercase tracking-[0.2em]">Konum</h3>
            </div>
            <div
              ref={mapContainerRef}
              className="w-full h-[180px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-[#F0EFEB]"
              aria-label="Mekan konumu"
            />
            {onGoToMap && (
              <button
                onClick={() => onGoToMap(cafe)}
                className="w-full mt-4 py-4 rounded-2xl bg-[#BC4749] text-white font-outfit font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#BC4749]/20 active:scale-[0.98] transition-all"
              >
                <Navigation2 className="w-5 h-5" />
                Mekana Git
              </button>
            )}
          </div>

          <div className="space-y-4 px-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-300" />
              <h2 className="font-outfit text-lg font-bold text-[#1B4332]">Mekan Hikayesi</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              {cafe.description}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12">
          <button
            onClick={onJoin}
            className="w-full bg-[#1B4332] py-6 rounded-[2.5rem] text-white font-outfit font-bold shadow-[0_15px_40px_rgba(27,67,50,0.2)] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
          >
            {cafe.isJoined ? 'Cüzdanı Görüntüle' : 'Sadakat Programına Katıl'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeDetailScreen;
