import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Wallet, Star, Sparkles, Coffee, Check, Target, SlidersHorizontal, Loader2, ExternalLink, RefreshCw, Clock, ChevronDown, Radio, Laptop, Leaf, Wifi, Utensils, Zap, MessageSquare, Mountain, Moon, Briefcase, Plus, BookOpen, ArrowRight, User, Timer, Ticket, Map, ChevronLeft, Heart } from 'lucide-react';
import { CAFES, CAMPAIGNS, EDITOR_PICKS } from '../data';
import { Cafe, CafeCollection, EditorPick, Campaign } from '../types';
import { fetchDiscoveryCafes } from '../services/places';

interface HomeScreenProps {
  onSelectCafe: (cafe: Cafe) => void;
  onOpenWallet: () => void;
  onSelectCollection: (collection: CafeCollection) => void;
  onSelectArticle: (article: EditorPick) => void;
  cafes: Cafe[];
  userLocation: { lat: number, lng: number } | null;
}

const DEFAULT_CENTER = { lat: 40.991, lng: 29.027 }; // Kadıköy

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectCafe, onOpenWallet, onSelectCollection, onSelectArticle, cafes, userLocation }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState("Kadıköy, İstanbul");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [discoveryCafes, setDiscoveryCafes] = useState<Cafe[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (!userLocation) return;

      const now = Date.now();
      if (now - lastFetchTimeRef.current < 10000) return;
      lastFetchTimeRef.current = now;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLocation.lat}&lon=${userLocation.lng}`,
          {
            headers: {
              'Accept-Language': 'tr-TR,tr;q=0.9',
              'User-Agent': 'LocalCoffeeApp/1.0'
            }
          }
        );
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const province = addr.province || addr.city || addr.state || "";
          if (province.includes("İstanbul")) {
            const district = addr.suburb || addr.town || addr.district || addr.city_district || "İstanbul";
            setSelectedLocation(`${district}, İstanbul`);
          } else {
            const city = addr.province || addr.city || addr.state || "Bilinmeyen Konum";
            setSelectedLocation(city);
          }
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        setSelectedLocation("Konum bulunamadı");
      }
    };
    fetchLocationName();
  }, [userLocation]);

  useEffect(() => {
    const center = userLocation || DEFAULT_CENTER;
    setDiscoveryLoading(true);
    fetchDiscoveryCafes(center.lat, center.lng, 2000)
      .then((fetched) => setDiscoveryCafes(fetched))
      .catch(() => setDiscoveryCafes([]))
      .finally(() => setDiscoveryLoading(false));
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % (cafes.length || 1));
    }, 5000);

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(carouselInterval);
      clearInterval(clockInterval);
    };
  }, [cafes.length]);

  const isIstanbul = useMemo(() => {
    const loc = selectedLocation.toLowerCase();
    return loc.includes('istanbul') || ['kadıköy', 'moda', 'beşiktaş', 'üsküdar', 'galata', 'beyoğlu', 'şişli', 'ortaköy', 'bebek'].some(d => loc.includes(d)) ||
      (selectedLocation === 'Mevcut Konumun' && userLocation && userLocation.lat >= 40.85 && userLocation.lat <= 41.25 && userLocation.lng >= 28.8 && userLocation.lng <= 29.5);
  }, [selectedLocation, userLocation]);

  const dynamicShortcuts = useMemo(() => {
    const base = [
      { id: 'work', label: 'Çalışma', icon: <Briefcase className="w-3 h-3" /> },
      { id: 'view', label: 'Manzara', icon: <Mountain className="w-3 h-3" /> },
      { id: 'garden', label: 'Bahçe', icon: <Leaf className="w-3 h-3" /> },
      { id: 'botanical', label: 'Botanik', icon: <Leaf className="w-3 h-3" /> },
      { id: 'creative', label: 'Konsept', icon: <Sparkles className="w-3 h-3" /> }
    ];
    if (isIstanbul) {
      base.push({ id: 'bosphorus', label: 'Boğaz', icon: <Mountain className="w-3 h-3" /> });
    }
    return base;
  }, [isIstanbul]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const claimCampaign = (campaignId: string) => {
    if (claimedIds.includes(campaignId)) return;
    setClaimingId(campaignId);
    setTimeout(() => {
      setClaimedIds(prev => [...prev, campaignId]);
      setClaimingId(null);
    }, 1500);
  };

  const baseCafes = discoveryCafes.length > 0 ? discoveryCafes : cafes;

  const nearbyCafes = useMemo(() => {
    const searchTerms: Record<string, string[]> = {
      work: ['work', 'çalışma', 'laptop', 'priz', 'desk', 'coffee', 'kahve'],
      view: ['manzara', 'deniz', 'teras', 'view', 'viewpoint'],
      garden: ['bahçe', 'outdoor', 'terrace', 'açık hava', 'garden'],
      botanical: ['botanik', 'bitki', 'yeşil', 'plant', 'flora'],
      creative: ['creative', 'konsept', 'sanat', 'art', 'design', 'ilham', 'yaratıcılık'],
      bosphorus: ['boğaz', 'bosphorus', 'deniz manzarası', 'bebek', 'ortaköy'],
      breakfast: ['kahvaltı', 'brunch', 'yumurta'],
      filter: ['filtre', 'demleme', 'v60']
    };

    return baseCafes.filter(cafe => {
      if (activeFilters.length === 0) return true;

      return activeFilters.every(filterId => {
        if (filterId === 'work' && (cafe.powerOutlets || (cafe.wifiSpeed && parseInt(String(cafe.wifiSpeed)) >= 50))) return true;
        if (filterId === 'garden' && (cafe.hasGarden || cafe.amenities?.some(a => ['Outdoor', 'Garden', 'Bahçe'].includes(a)))) return true;

        const terms = searchTerms[filterId] || [filterId];
        const searchable = [
          cafe.name,
          cafe.address,
          cafe.description || '',
          ...(cafe.amenities || []),
          ...(cafe.moods || [])
        ].join(' ').toLowerCase();
        return terms.some(term => searchable.includes(term.toLowerCase()));
      });
    });
  }, [activeFilters, baseCafes]);

  const featuredCafe = cafes[carouselIndex] || cafes[0];
  const getCafeData = (id: string) => cafes.find(c => c.id === id);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar pb-40 bg-[#FAF9F6]">
      <div className="px-6 pt-12 pb-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-page-in">
            <h1 className="font-outfit text-3xl font-bold text-[#1B4332] leading-tight">
              Şehirdeki<br /><span className="text-[#BC4749]">İzlerin.</span>
            </h1>
          </div>
          <button
            onClick={() => onOpenWallet()}
            className="w-14 h-14 bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-[2rem] flex items-center justify-center text-[#1B4332] active:scale-90 transition-all cursor-pointer relative z-10"
          >
            <Wallet className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        <div
          onClick={() => onSelectCafe(featuredCafe)}
          className="relative h-60 w-full rounded-[3rem] overflow-hidden shadow-2xl active:scale-[0.99] transition-all cursor-pointer group"
        >
          <img src={featuredCafe.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt={featuredCafe.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-3">
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Günün Seçimi</span>
            </div>
            <h3 className="text-white font-outfit text-2xl font-bold mb-1">{featuredCafe.name}</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                <Star className="w-2.5 h-2.5 text-[#BC4749] fill-[#BC4749]" />
                <span className="text-[9px] font-black text-white">{featuredCafe.rating}</span>
                {featuredCafe.reviews > 0 && (
                  <span className="text-[8px] text-white/80 font-bold">({featuredCafe.reviews})</span>
                )}
              </div>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#BC4749]" /> {featuredCafe.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#BC4749]" />
            <h2 className="font-outfit text-sm font-black text-[#1B4332] uppercase tracking-widest">Hızlı Keşif</h2>
          </div>
        </div>

        <div className="px-8 flex items-center gap-2">
          <div className="flex-1 flex items-center justify-between bg-white/40 backdrop-blur-xl border border-white/60 px-4 py-3 rounded-[1.4rem] shadow-sm active:scale-[0.98] transition-all overflow-hidden cursor-default">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3 h-3 text-[#BC4749] shrink-0" />
              <span className="text-[10px] font-bold text-[#1B4332] truncate uppercase tracking-tighter">{selectedLocation}</span>
            </div>
            <div className="w-2.5 h-2.5 shrink-0 ml-1" />
          </div>

          <div className="bg-white/40 backdrop-blur-xl border border-white/60 px-3 py-3 rounded-[1.4rem] shadow-sm flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-[#1B4332]/30" />
            <span className="text-[10px] font-bold text-[#1B4332]">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="bg-[#1B4332]/5 backdrop-blur-md border border-[#1B4332]/10 px-3 py-3 rounded-[1.4rem] flex items-center gap-1.5 shrink-0">
            <Radio className="w-3 h-3 text-[#BC4749] animate-pulse" />
            <span className="text-[9px] font-black text-[#1B4332] uppercase tracking-tighter">500m</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-8 py-1">
          {dynamicShortcuts.map((filter) => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-[1.2rem] border transition-all font-bold text-[10px] uppercase tracking-tighter active:scale-95 ${activeFilters.includes(filter.id)
                ? 'bg-[#1B4332] border-[#1B4332] text-white shadow-lg'
                : 'bg-white/60 backdrop-blur-md border-white/80 text-[#1B4332]'
                } `}
            >
              <span className={`${activeFilters.includes(filter.id) ? 'text-white' : 'text-[#BC4749]'} `}>{filter.icon}</span>
              {filter.label}
              {activeFilters.includes(filter.id) && <Plus className="w-2.5 h-2.5 ml-0.5 rotate-45" />}
            </button>
          ))}
        </div>

        <div className="px-8 space-y-4 pt-2">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {discoveryLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative w-48 aspect-[3/4] shrink-0 rounded-[2.5rem] overflow-hidden bg-gray-200/50 animate-pulse" />
                ))}
              </>
            ) : (
            nearbyCafes.map(cafe => (
              <div
                key={cafe.id}
                onClick={() => onSelectCafe(cafe)}
                className="relative w-48 aspect-[3/4] shrink-0 rounded-[2.5rem] overflow-hidden shadow-lg active:scale-95 transition-all cursor-pointer group"
              >
                <img src={cafe.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={cafe.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-[1rem] flex items-center gap-1.5 shadow-sm border border-white/50">
                    <Star className="w-2.5 h-2.5 text-[#BC4749] fill-[#BC4749]" />
                    <span className="text-[9px] font-black text-[#1B4332]">{cafe.rating}</span>
                    {cafe.reviews > 0 && (
                      <span className="text-[8px] font-bold text-[#1B4332]/70">({cafe.reviews})</span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <h4 className="font-outfit text-sm font-bold text-white truncate mb-0.5">{cafe.name}</h4>
                  <p className="text-[8px] text-white/60 font-bold uppercase tracking-widest">{cafe.distance}</p>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        <div className="mt-10 mb-2">
          <div className="px-8 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#BC4749] fill-[#BC4749]" />
              <h2 className="font-outfit text-sm font-black text-[#1B4332] uppercase tracking-widest">Anlık Fırsatlar</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-[#BC4749]/10 border border-[#BC4749]/20 px-2.5 py-1.5 rounded-full">
              <Map className="w-3 h-3 text-[#BC4749]" />
              <span className="text-[9px] font-black text-[#BC4749] uppercase tracking-wide">Yakınında</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-8 pb-6">
            {CAMPAIGNS.map((campaign) => {
              const cafe = getCafeData(campaign.cafeId);
              return (
                <div
                  key={campaign.id}
                  onClick={() => claimCampaign(campaign.id)}
                  className="relative w-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-5 border border-white/60 shadow-lg active:scale-[0.99] transition-all cursor-pointer overflow-hidden group"
                >
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{cafe?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-[9px] font-bold text-[#BC4749] uppercase tracking-widest">{cafe?.distance}</span>
                      </div>
                      <h3 className="font-outfit text-xl font-black text-[#1B4332] leading-none tracking-tight mb-2">
                        {campaign.title} {campaign.stickerIcon}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500 leading-tight line-clamp-2 mb-3">
                        {campaign.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="bg-[#BC4749] text-white px-3 py-1.5 rounded-xl shadow-md rotate-[-2deg] flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-wider">{campaign.discount}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-60">
                          <Ticket className="w-3 h-3 text-[#1B4332]" />
                          <span className="text-[9px] font-bold text-[#1B4332]">Kalan: {campaign.totalLimit - campaign.claimedCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative shrink-0 w-24 h-24">
                      <svg className="absolute -top-2 -left-2 w-28 h-28 text-[#BC4749] opacity-20 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10,50 Q20,10 50,10 T90,50 T50,90 T10,50" strokeDasharray="5,5" />
                      </svg>
                      <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden shadow-md rotate-2 border-2 border-white">
                        <img src={campaign.productImage} className="w-full h-full object-cover" alt="Product" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/5 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                    <Clock className="w-3 h-3 text-[#1B4332]" />
                    <span className="text-[9px] font-bold text-[#1B4332] font-mono">{campaign.timeLeft}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 mb-10">
          <div className="px-8 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#BC4749]" />
              <h2 className="font-outfit text-sm font-black text-[#1B4332] uppercase tracking-widest">Editör Günlüğü</h2>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar px-8 pb-4">
            {EDITOR_PICKS.map((pick) => (
              <div
                key={pick.id}
                onClick={() => onSelectArticle(pick)}
                className="relative w-80 shrink-0 bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/60 shadow-xl group cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="h-56 w-full relative">
                  <img src={pick.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt={pick.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
                  <div className="absolute top-4 left-4 bg-white/30 backdrop-blur-md border border-white/40 rounded-full pl-1 pr-3 py-1 flex items-center gap-2">
                    <img src={pick.editorImage} className="w-6 h-6 rounded-full object-cover border border-white" alt={pick.editorName} />
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">{pick.editorName}</span>
                  </div>
                  <div className="absolute bottom-4 left-6 bg-[#BC4749] px-2.5 py-1 rounded-lg">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{pick.location}</span>
                  </div>
                </div>

                <div className="p-6 pt-2">
                  <h3 className="font-outfit text-lg font-bold text-[#1B4332] mb-2 leading-tight">{pick.title}</h3>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic line-clamp-2 mb-4">
                    "{pick.blurb}"
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{pick.readTime} OKUMA</span>
                    <button className="flex items-center gap-1 text-[10px] font-black text-[#BC4749] uppercase tracking-widest">
                      DENEYİMİ OKU <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
