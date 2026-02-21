import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Wallet, Star, Sparkles, Coffee, Check, Target, SlidersHorizontal, Loader2, ExternalLink, RefreshCw, Clock, ChevronDown, Radio, Laptop, Leaf, Wifi, Utensils, Zap, MessageSquare, Mountain, Moon, Briefcase, Plus, BookOpen, ArrowRight, User, Timer, Ticket, Map, ChevronLeft, Heart, Trees, Sprout, Palette, Ship, Telescope, Wind, Flower2 } from 'lucide-react';
import { CAFES, CAMPAIGNS, EDITOR_PICKS } from '../data';
import { Cafe, CafeCollection, EditorPick, Campaign } from '../types';
import { fetchDiscoveryCafes, haversineDistanceMeters } from '../services/places';

interface HomeScreenProps {
  onSelectCafe: (cafe: Cafe) => void;
  onOpenWallet: () => void;
  onSelectCollection: (collection: CafeCollection) => void;
  onSelectArticle: (article: EditorPick) => void;
  cafes: Cafe[];
  userLocation: { lat: number, lng: number } | null;
}

const DEFAULT_CENTER = { lat: 40.991, lng: 29.027 }; // Kadıköy

const FILTER_KEYWORDS: Record<string, string[]> = {
  work: [
    'coworking cafe',
    'study cafe',
    'laptop friendly cafe',
    'çalışma kahvesi'
  ],
  view: [
    'sea view cafe',
    'viewpoint cafe',
    'terrace cafe',
    'manzaralı kafe'
  ],
  garden: [
    'garden cafe',
    'outdoor cafe',
    'bahçeli kafe'
  ],
  botanical: [
    'botanical cafe',
    'green cafe',
    'bitkili kafe'
  ],
  creative: [
    'art cafe',
    'concept cafe',
    'design cafe',
    'konsept kafe'
  ],
  breakfast: [
    'breakfast cafe',
    'brunch cafe',
    'kahvaltı kafe'
  ],
  bosphorus: [
    'boğaz manzaralı kafe',
    'bosphorus view cafe',
    'bebek cafe',
    'ortaköy cafe'
  ]
};

const sortByRatingThenReviews = (a: Cafe, b: Cafe) => {
  if (b.rating !== a.rating) return b.rating - a.rating;
  return b.reviews - a.reviews;
};

const dedupeCafes = (cafes: Cafe[]) => {
  const map = new Map<string, Cafe>();
  cafes.forEach((cafe) => {
    if (!map.has(cafe.id)) {
      map.set(cafe.id, cafe);
      return;
    }
    const existing = map.get(cafe.id)!;
    if (sortByRatingThenReviews(cafe, existing) > 0) return;
    map.set(cafe.id, cafe);
  });
  return Array.from(map.values());
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectCafe, onOpenWallet, onSelectCollection, onSelectArticle, cafes, userLocation }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState(userLocation ? "İstanbul" : "Konum alınıyor...");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [discoveryCafes, setDiscoveryCafes] = useState<Cafe[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (!userLocation) {
        setSelectedLocation("Konum aranıyor...");
        return;
      }

      const now = Date.now();
      // Bypass throttle if we are still in default/loading state to get first real location fast
      const isInitialState = selectedLocation === "Konum aranıyor..." || selectedLocation === "Kadıköy, İstanbul";
      if (!isInitialState && now - lastFetchTimeRef.current < 3000) return;

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
        // Don't overwrite if we have a stale but valid location
        if (selectedLocation === "Konum aranıyor...") {
          setSelectedLocation("Konum bulunamadı");
        }
      }
    };
    fetchLocationName();
  }, [userLocation, selectedLocation]);

  useEffect(() => {
    const center = userLocation || DEFAULT_CENTER;
    let cancelled = false;

    const fetchFilteredDiscovery = async () => {
      setDiscoveryLoading(true);
      try {
        if (activeFilters.length === 0) {
          const fetched = await fetchDiscoveryCafes(center.lat, center.lng, 500);
          if (!cancelled) setDiscoveryCafes(fetched);
          return;
        }

        const perFilterResults = await Promise.all(
          activeFilters.map(async (filterId) => {
            const keywords = FILTER_KEYWORDS[filterId] || [filterId];
            const keywordResults = await Promise.all(
              keywords.map((keyword) => fetchDiscoveryCafes(center.lat, center.lng, 500, keyword))
            );
            return dedupeCafes(keywordResults.flat()).sort(sortByRatingThenReviews);
          })
        );

        const intersectionIds = perFilterResults.reduce<Set<string>>((acc, list, idx) => {
          const ids = new Set(list.map((cafe) => cafe.id));
          if (idx === 0) return ids;
          return new Set(Array.from(acc).filter((id) => ids.has(id)));
        }, new Set<string>());

        const merged = dedupeCafes(perFilterResults.flat());
        const filtered = merged
          .filter((cafe) => intersectionIds.has(cafe.id))
          .sort(sortByRatingThenReviews);

        if (!cancelled) setDiscoveryCafes(filtered);
      } catch {
        if (!cancelled) setDiscoveryCafes([]);
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    };

    fetchFilteredDiscovery();

    return () => {
      cancelled = true;
    };
  }, [activeFilters, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const maxItems = Math.min(cafes.length || 1, 5);
    const carouselInterval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % maxItems);
    }, 5000);

    return () => clearInterval(carouselInterval);
  }, [cafes.length, carouselIndex]);

  const onTouchStartContent = (e: React.TouchEvent) => {
    setDragEnd(null);
    setDragStart(e.targetTouches[0].clientX);
    isDraggingRef.current = false;
  };

  const onTouchMoveContent = (e: React.TouchEvent) => {
    if (dragStart !== null) {
      setDragEnd(e.targetTouches[0].clientX);
      if (Math.abs(e.targetTouches[0].clientX - dragStart) > 10) {
        isDraggingRef.current = true;
      }
    }
  };

  const onTouchEndContent = () => {
    handleSwipeEnd();
  };

  const onMouseDownContent = (e: React.MouseEvent) => {
    setDragEnd(null);
    setDragStart(e.clientX);
    isDraggingRef.current = false;
  };

  const onMouseMoveContent = (e: React.MouseEvent) => {
    if (dragStart !== null) {
      setDragEnd(e.clientX);
      if (Math.abs(e.clientX - dragStart) > 10) {
        isDraggingRef.current = true;
      }
    }
  };

  const onMouseUpContent = () => {
    handleSwipeEnd();
  };

  const handleSwipeEnd = () => {
    if (!dragStart || !dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const distance = dragStart - dragEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    const maxItems = Math.min(cafes.length || 1, 5);

    if (isLeftSwipe) {
      setCarouselIndex((prev) => (prev + 1) % maxItems);
    } else if (isRightSwipe) {
      setCarouselIndex((prev) => (prev === 0 ? maxItems - 1 : prev - 1));
    }

    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (featuredCafe) onSelectCafe(featuredCafe);
  };

  const isIstanbul = useMemo(() => {
    const loc = selectedLocation.toLowerCase();
    return loc.includes('istanbul') || ['kadıköy', 'moda', 'beşiktaş', 'üsküdar', 'galata', 'beyoğlu', 'şişli', 'ortaköy', 'bebek'].some(d => loc.includes(d)) ||
      (selectedLocation === 'Mevcut Konumun' && userLocation && userLocation.lat >= 40.85 && userLocation.lat <= 41.25 && userLocation.lng >= 28.8 && userLocation.lng <= 29.5);
  }, [selectedLocation, userLocation]);

  const dynamicShortcuts = useMemo(() => {
    const base = [
      { id: 'work', label: 'Çalışma', icon: <Laptop className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'view', label: 'Manzara', icon: <Mountain className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'garden', label: 'Bahçe', icon: <Trees className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'botanical', label: 'Botanik', icon: <Sprout className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'creative', label: 'Konsept', icon: <Palette className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'breakfast', label: 'Kahvaltı', icon: <Utensils className="w-3.5 h-3.5" />, color: '#BC4749' }
    ];
    if (isIstanbul) {
      base.push({ id: 'bosphorus', label: 'Boğaz', icon: <Ship className="w-3.5 h-3.5" />, color: '#BC4749' });
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

  const nearbyCafes = useMemo(() => {
    return discoveryCafes
      .filter(cafe => {
        // Strict distance guard (API already queried at 500m, but keep exact check)
        if (!cafe.coordinates) return false;

        const center = userLocation || DEFAULT_CENTER;
        const dist = haversineDistanceMeters(center.lat, center.lng, cafe.coordinates.lat, cafe.coordinates.lng);
        return dist <= 500;
      })
      .sort(sortByRatingThenReviews);
  }, [discoveryCafes, userLocation]);

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
            <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8" />
          </button>
        </div>

        <div
          onClickCapture={handleCardClick}
          onTouchStart={onTouchStartContent}
          onTouchMove={onTouchMoveContent}
          onTouchEnd={onTouchEndContent}
          onMouseDown={onMouseDownContent}
          onMouseMove={onMouseMoveContent}
          onMouseUp={onMouseUpContent}
          onMouseLeave={onMouseUpContent}
          className="relative h-60 w-full rounded-[3rem] overflow-hidden shadow-2xl active:scale-[0.99] transition-all cursor-pointer group select-none touch-pan-y"
        >
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-30 h-8 items-start">
            {cafes.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCarouselIndex(idx);
                }}
                className="flex-1 h-full cursor-pointer flex items-start pt-2 px-0.5"
              >
                <div className="w-full h-1.5 rounded-full relative overflow-hidden bg-black/20 backdrop-blur-md">
                  {idx < carouselIndex && <div className="absolute inset-0 bg-white" />}
                  {idx === carouselIndex && <div key={`active-${carouselIndex}`} className="absolute inset-0 bg-white origin-left" style={{ animation: 'storyProgress 5s linear forwards' }} />}
                </div>
              </div>
            ))}
          </div>

          {featuredCafe && (
            <img src={featuredCafe.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt={featuredCafe.name} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
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

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-8 py-2">
          {dynamicShortcuts.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-[1.5rem] transition-all duration-300 font-black text-[10px] uppercase tracking-wider active:scale-95 group relative overflow-hidden ${isActive
                  ? 'text-white shadow-[0_10px_20px_rgba(27,67,50,0.2)]'
                  : 'bg-white/70 backdrop-blur-xl border border-white/80 text-[#1B4332] shadow-sm hover:shadow-md'
                  } `}
                style={{
                  background: isActive ? filter.color : undefined
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
                )}
                <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''} `} style={{ color: !isActive ? filter.color : undefined }}>
                  {filter.icon}
                </span>
                <span className="relative z-10">{filter.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-sm" />}
              </button>
            );
          })}
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
