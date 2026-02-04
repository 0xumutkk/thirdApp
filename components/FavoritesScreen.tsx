import React, { useState, useEffect, useRef } from 'react';
import { Heart, Star, MapPin, ArrowRight, Compass, ChevronDown, Sparkles, Map, Pause, Play } from 'lucide-react';
import { CAFES, COLLECTIONS } from '../data';
import { Cafe, CafeCollection } from '../types';

interface FavoritesScreenProps {
  onSelectCafe: (cafe: Cafe) => void;
  onSelectCollection: (collection: CafeCollection) => void;
  cafes?: Cafe[]; // Added to maintain compatibility with App.tsx if needed, though snippet uses local logic
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onSelectCafe, onSelectCollection, cafes }) => {
  // Use cafes prop if available (real favorites), otherwise fallback to high rating (original behavior in snippet)
  const favoriteCafes = (cafes && cafes.length > 0) ? cafes : CAFES.filter(c => c.rating >= 4.7);
  const dynamicCollections = COLLECTIONS.filter(c => c.type === 'DYNAMIC');

  const [currentLocation, setCurrentLocation] = useState("İstanbul");

  // Spotlight State
  const [activeCollectionId, setActiveCollectionId] = useState(dynamicCollections[0].id);
  const [isPaused, setIsPaused] = useState(false);

  // Aktif koleksiyonu bul
  const activeCollectionIndex = dynamicCollections.findIndex(c => c.id === activeCollectionId);
  const activeCollection = dynamicCollections[activeCollectionIndex] || dynamicCollections[0];

  // Koleksiyonlar arası otomatik geçiş döngüsü (10 saniyede bir)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const nextIndex = (activeCollectionIndex + 1) % dynamicCollections.length;
      setActiveCollectionId(dynamicCollections[nextIndex].id);
    }, 10000); // 10 saniye

    return () => clearInterval(interval);
  }, [activeCollectionIndex, isPaused, dynamicCollections.length]);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar pb-32 bg-[#FAF9F6]">
      {/* Header */}
      <div className="px-8 pt-16 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#BC4749]/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-[#BC4749] fill-[#BC4749]" />
          </div>
          <h1 className="font-outfit text-3xl font-bold text-[#1B4332]">Favorilerim</h1>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Kişisel kahve arşivin</p>
      </div>

      {/* Favorite Cafes List (Compact) */}
      <div className="px-8 space-y-4 mb-8">
        <h2 className="font-outfit text-sm font-black text-[#1B4332]/40 uppercase tracking-widest px-1">Kaydettiklerin</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {favoriteCafes.map((cafe) => (
            <div
              key={cafe.id}
              onClick={() => onSelectCafe(cafe)}
              className="min-w-[200px] bg-white rounded-[2rem] p-3 flex gap-3 border border-gray-50 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <img src={cafe.image} className="w-14 h-14 rounded-[1.2rem] object-cover" alt={cafe.name} />
              <div className="flex flex-col justify-center">
                <h3 className="font-outfit text-sm font-bold text-[#1B4332] truncate w-24">{cafe.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3 h-3 text-[#BC4749] fill-[#BC4749]" />
                  <span className="text-[10px] font-black text-[#1B4332]">{cafe.rating}</span>
                  {cafe.reviews > 0 && (
                    <span className="text-[9px] font-bold text-gray-400">({cafe.reviews})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SPOTLIGHT SECTION (The Fix) */}
      <div className="mt-2 relative">
        <div className="px-8 flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-outfit text-xl font-bold text-[#1B4332]">Şehrin Enleri</h2>
              <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentLocation(currentLocation === "İstanbul" ? "İzmir" : "İstanbul")}>
                <Map className="w-3 h-3 text-[#BC4749]" />
                <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-wide">{currentLocation}</span>
                <ChevronDown className="w-3 h-3 text-[#1B4332]/50" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Canlı Trendler</p>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 active:scale-90"
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="px-8 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {dynamicCollections.map((col) => {
            const isActive = col.id === activeCollectionId;
            return (
              <button
                key={col.id}
                onClick={() => { setActiveCollectionId(col.id); setIsPaused(true); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${isActive
                    ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-md scale-105'
                    : 'bg-white text-gray-400 border-gray-100'
                  }`}
              >
                {col.tag?.replace(/ .*/, '')}
              </button>
            )
          })}
        </div>

        {/* Single Spotlight Card */}
        <div className="px-8 pb-8 perspective-1000">
          <div
            className="w-full aspect-[4/5] relative rounded-[3rem] shadow-2xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-all duration-500 ease-out"
            onClick={() => onSelectCollection(activeCollection)}
          >
            {/* Render the Active Collection Card Content */}
            <SpotlightCardContent collection={activeCollection} />
          </div>
        </div>

      </div>
    </div>
  );
};

// Sub-component to handle image rotation WITHIN the single active card
const SpotlightCardContent: React.FC<{ collection: CafeCollection }> = ({ collection }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when collection changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [collection.id]);

  // Rotate images inside the active card
  useEffect(() => {
    if (collection.images && collection.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % collection.images.length);
      }, 3500); // Change image every 3.5s
      return () => clearInterval(interval);
    }
  }, [collection.id, collection.images]);

  return (
    <>
      {/* Background Images with Crossfade */}
      {collection.images.map((img, idx) => (
        <img
          key={`${collection.id}-${img}`}
          src={img}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out ${idx === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          alt={collection.title}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Progress Bar (Story Style) at Top */}
      <div className="absolute top-6 left-6 right-6 flex gap-1.5">
        {collection.images.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-white transition-all duration-300 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
              style={{ width: '100%' }} // Simple active indicator
            />
          </div>
        ))}
      </div>

      {/* Floating Sentiment Badge */}
      <div className="absolute top-10 right-6 animate-page-in delay-100">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-1 rounded-[1.2rem] shadow-xl">
          <div className="bg-white px-3 py-2 rounded-[0.9rem] flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Google</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[#BC4749] fill-[#BC4749]" />
              <span className="text-xs font-black text-[#1B4332]">{collection.ratingSummary?.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="bg-[#BC4749] inline-block px-3 py-1 rounded-lg mb-3 shadow-lg rotate-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-white fill-white" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">{collection.sentiment?.replace('En Çok Övülen:', '')}</span>
          </div>
        </div>

        <h2 className="font-outfit text-4xl font-black text-white leading-[0.9] mb-3 drop-shadow-xl">
          {collection.title.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h2>

        <p className="text-white/80 text-sm font-medium line-clamp-2 leading-relaxed mb-6 w-5/6">
          {collection.description}
        </p>

        <div className="flex items-center justify-between border-t border-white/20 pt-4">
          <div className="flex -space-x-3">
            {collection.cafeIds.map((id) => (
              <div key={id} className="w-8 h-8 rounded-full border-2 border-[#1B4332] bg-white overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} alt="" className="w-full h-full opacity-80" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#1B4332] bg-white flex items-center justify-center">
              <span className="text-[9px] font-black text-[#1B4332]">+{collection.cafeIds.length}</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform">
            <ArrowRight className="w-5 h-5 text-[#1B4332]" />
          </div>
        </div>
      </div>
    </>
  );
}

export default FavoritesScreen;
