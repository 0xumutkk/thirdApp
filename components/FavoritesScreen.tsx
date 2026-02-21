import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, MapPin, ArrowRight, ChevronDown, Sparkles, Map, Pause, Play, LayoutGrid } from 'lucide-react';
import { CAFES, COLLECTIONS } from '../data';
import { Cafe, CafeCollection } from '../types';

interface FavoritesScreenProps {
  onSelectCafe: (cafe: Cafe) => void;
  onSelectCollection: (collection: CafeCollection) => void;
  cafes?: Cafe[];
}

type StoryTransitionDirection = 'next' | 'prev';

interface StoryTransitionState {
  fromId: string;
  toId: string;
  direction: StoryTransitionDirection;
}

const CARD_TRANSITION_MS = 320;

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onSelectCafe, onSelectCollection, cafes }) => {
  const [currentLocation, setCurrentLocation] = useState("İstanbul");
  const favoriteCafes = (cafes && cafes.length > 0) ? cafes : CAFES.filter(c => c.rating >= 4.7);
  const dynamicCollections = COLLECTIONS.filter(c => {
    if (c.type !== 'DYNAMIC') return false;
    if (c.city && c.city !== currentLocation) return false;
    return true;
  });
  const [activeCollectionId, setActiveCollectionId] = useState(dynamicCollections[0]?.id ?? '');
  const [isPaused, setIsPaused] = useState(false);
  const [showSpotlightView, setShowSpotlightView] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [storyTransition, setStoryTransition] = useState<StoryTransitionState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCollection = dynamicCollections.find(c => c.id === activeCollectionId) || dynamicCollections[0];
  const activeCollectionIndex = dynamicCollections.findIndex(c => c.id === activeCollectionId);

  const clearTransitionTimeout = useCallback(() => {
    if (!transitionTimeoutRef.current) return;
    clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    const stillExists = dynamicCollections.some(c => c.id === activeCollectionId);
    if (!stillExists && dynamicCollections.length > 0) {
      setStoryTransition(null);
      setActiveCollectionId(dynamicCollections[0].id);
    }
  }, [currentLocation, dynamicCollections, activeCollectionId]);

  useEffect(() => {
    return () => clearTransitionTimeout();
  }, [clearTransitionTimeout]);

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector('[data-active="true"]');
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCollectionId]);

  const navigateToCollection = useCallback((targetId: string, direction?: StoryTransitionDirection) => {
    if (dynamicCollections.length === 0 || !targetId || targetId === activeCollectionId) return;

    const currentIndex = activeCollectionIndex >= 0 ? activeCollectionIndex : 0;
    const targetIndex = dynamicCollections.findIndex(c => c.id === targetId);
    if (targetIndex < 0) return;

    const fromId = dynamicCollections[currentIndex]?.id ?? activeCollectionId ?? targetId;
    const resolvedDirection = direction ?? (targetIndex >= currentIndex ? 'next' : 'prev');

    setStoryTransition({
      fromId,
      toId: targetId,
      direction: resolvedDirection
    });
    setActiveCollectionId(targetId);
    clearTransitionTimeout();
    transitionTimeoutRef.current = setTimeout(() => {
      setStoryTransition((prev) => (prev?.toId === targetId ? null : prev));
      transitionTimeoutRef.current = null;
    }, CARD_TRANSITION_MS);
  }, [activeCollectionId, activeCollectionIndex, clearTransitionTimeout, dynamicCollections]);

  const handleNextCollection = useCallback(() => {
    if (dynamicCollections.length === 0) return;
    const currentIndex = activeCollectionIndex >= 0 ? activeCollectionIndex : 0;
    const nextIndex = (currentIndex + 1) % dynamicCollections.length;
    navigateToCollection(dynamicCollections[nextIndex]?.id ?? '', 'next');
  }, [activeCollectionIndex, dynamicCollections, navigateToCollection]);

  const handlePreviousCollection = useCallback(() => {
    if (dynamicCollections.length === 0) return;
    const currentIndex = activeCollectionIndex >= 0 ? activeCollectionIndex : 0;
    const prevIndex = currentIndex === 0 ? dynamicCollections.length - 1 : currentIndex - 1;
    navigateToCollection(dynamicCollections[prevIndex]?.id ?? '', 'prev');
  }, [activeCollectionIndex, dynamicCollections, navigateToCollection]);

  const handleSelectCollectionByIndex = useCallback((index: number) => {
    const selected = dynamicCollections[index];
    if (!selected) return;
    const currentIndex = activeCollectionIndex >= 0 ? activeCollectionIndex : 0;
    if (index === currentIndex) return;
    navigateToCollection(selected.id, index > currentIndex ? 'next' : 'prev');
  }, [activeCollectionIndex, dynamicCollections, navigateToCollection]);

  const handleSwipeEnd = useCallback((finalClientX?: number) => {
    const endPoint = finalClientX ?? dragEnd;
    if (dragStart === null || endPoint === null) {
      setDragStart(null);
      setDragEnd(null);
      isDraggingRef.current = false;
      return;
    }

    const distance = dragStart - endPoint;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextCollection();
      isDraggingRef.current = true;
    } else if (isRightSwipe) {
      handlePreviousCollection();
      isDraggingRef.current = true;
    }

    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, handleNextCollection, handlePreviousCollection]);

  const onTouchStartSpotlight = (e: React.TouchEvent<HTMLDivElement>) => {
    setDragEnd(null);
    setDragStart(e.targetTouches[0].clientX);
    isDraggingRef.current = false;
  };

  const onTouchMoveSpotlight = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStart !== null) {
      setDragEnd(e.targetTouches[0].clientX);
      if (Math.abs(e.targetTouches[0].clientX - dragStart) > 10) {
        isDraggingRef.current = true;
      }
    }
  };

  const onMouseDownSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragEnd(null);
    setDragStart(e.clientX);
    isDraggingRef.current = false;
  };

  const onMouseMoveSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStart !== null) {
      setDragEnd(e.clientX);
      if (Math.abs(e.clientX - dragStart) > 10) {
        isDraggingRef.current = true;
      }
    }
  };

  const handleSpotlightCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = false;
      return;
    }
    if (activeCollection) onSelectCollection(activeCollection);
  };

  const handleToggleView = () => {
    setShowSpotlightView((v) => !v);
    if (!showSpotlightView) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favoritesToShow = showSpotlightView ? favoriteCafes.slice(0, 2) : favoriteCafes;
  const transitionFromCollection = storyTransition
    ? dynamicCollections.find(c => c.id === storyTransition.fromId)
    : null;
  const transitionToCollection = storyTransition
    ? dynamicCollections.find(c => c.id === storyTransition.toId) || activeCollection
    : activeCollection;
  const transitionFromIndex = storyTransition
    ? dynamicCollections.findIndex(c => c.id === storyTransition.fromId)
    : activeCollectionIndex;
  const transitionToIndex = storyTransition
    ? dynamicCollections.findIndex(c => c.id === storyTransition.toId)
    : activeCollectionIndex;

  const FavoriteCafeCard: React.FC<{ cafe: Cafe }> = ({ cafe }) => (
    <div
      onClick={() => onSelectCafe(cafe)}
      className="bg-white rounded-[2rem] p-3 flex gap-3 border border-gray-50 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
    >
      <img src={cafe.image} className="w-14 h-14 rounded-[1.2rem] object-cover shrink-0" alt={cafe.name} />
      <div className="flex flex-col justify-center min-w-0">
        <h3 className="font-outfit text-sm font-bold text-[#1B4332] truncate">{cafe.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <Star className="w-3 h-3 text-[#BC4749] fill-[#BC4749] shrink-0" />
          <span className="text-[10px] font-black text-[#1B4332]">{cafe.rating}</span>
          {cafe.reviews > 0 && (
            <span className="text-[9px] font-bold text-gray-400">({cafe.reviews})</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={scrollRef} className="h-full w-full flex flex-col overflow-y-auto no-scrollbar pb-32 bg-[#FAF9F6]">
      {/* Header + görünüm ikonu */}
      <div className="px-8 pt-16 pb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#BC4749]/10 rounded-2xl flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-[#BC4749] fill-[#BC4749]" />
            </div>
            <div>
              <h1 className="font-outfit text-3xl font-bold text-[#1B4332]">Favorilerim</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Kişisel kahve arşivin</p>
            </div>
          </div>
          <button
            onClick={handleToggleView}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors active:scale-95 ${showSpotlightView ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-100 text-[#1B4332]'}`}
            title={showSpotlightView ? 'Tüm listeyi göster' : 'Şehrin Enleri görünümü'}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kaydettiklerin: 2'şer alt alta. Spotlight modunda sadece ilk 2, geri kalanı gizli */}
      <div className="px-8 space-y-4 mb-8">
        <h2 className="font-outfit text-sm font-black text-[#1B4332]/40 uppercase tracking-widest px-1">Kaydettiklerin</h2>
        <div className="grid grid-cols-2 gap-3 pb-2">
          {favoritesToShow.map((cafe) => (
            <FavoriteCafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
        {showSpotlightView && favoriteCafes.length > 2 && (
          <p className="text-[10px] font-bold text-gray-400 px-1">Şehrin Enleri görünümünde listeleniyor.</p>
        )}
      </div>

      {/* Şehrin Enleri - spotlight modunda üstte (2 mekanın hemen altında), list modunda en altta */}
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
        <div ref={tabsRef} className="px-8 flex gap-2 overflow-x-auto no-scrollbar mb-4 scroll-smooth">
          {dynamicCollections.map((col) => {
            const isActive = col.id === activeCollectionId;
            return (
              <button
                key={col.id}
                data-active={isActive ? "true" : "false"}
                onClick={() => { navigateToCollection(col.id); }}
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
            className="w-full aspect-[4/5] relative rounded-[3rem] shadow-2xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-all duration-500 ease-out select-none touch-pan-y"
            onClick={handleSpotlightCardClick}
            onTouchStart={onTouchStartSpotlight}
            onTouchMove={onTouchMoveSpotlight}
            onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0]?.clientX)}
            onMouseDown={onMouseDownSpotlight}
            onMouseMove={onMouseMoveSpotlight}
            onMouseUp={(e) => handleSwipeEnd(e.clientX)}
            onMouseLeave={() => handleSwipeEnd()}
          >
            {storyTransition && transitionFromCollection && transitionToCollection ? (
              <>
                <div
                  className={`absolute inset-0 pointer-events-none ${storyTransition.direction === 'next' ? 'animate-story-card-out-next' : 'animate-story-card-out-prev'
                    }`}
                >
                  <SpotlightCardContent
                    collection={transitionFromCollection}
                    collectionIndex={transitionFromIndex >= 0 ? transitionFromIndex : 0}
                    totalCollections={dynamicCollections.length}
                    isPaused={isPaused}
                    onStoryEnd={handleNextCollection}
                    onProgressSelect={handleSelectCollectionByIndex}
                    isInteractive={false}
                    showProgress={false}
                  />
                </div>
                <div
                  className={`absolute inset-0 ${storyTransition.direction === 'next' ? 'animate-story-card-in-next' : 'animate-story-card-in-prev'
                    }`}
                >
                  <SpotlightCardContent
                    collection={transitionToCollection}
                    collectionIndex={transitionToIndex >= 0 ? transitionToIndex : 0}
                    totalCollections={dynamicCollections.length}
                    isPaused={isPaused}
                    onStoryEnd={handleNextCollection}
                    onProgressSelect={handleSelectCollectionByIndex}
                  />
                </div>
              </>
            ) : (
              <SpotlightCardContent
                collection={activeCollection}
                collectionIndex={activeCollectionIndex >= 0 ? activeCollectionIndex : 0}
                totalCollections={dynamicCollections.length}
                isPaused={isPaused}
                onStoryEnd={handleNextCollection}
                onProgressSelect={handleSelectCollectionByIndex}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const IMAGE_DURATION_MS = 3500;

// Sub-component to handle image rotation WITHIN the single active card
const SpotlightCardContent: React.FC<{
  collection: CafeCollection;
  collectionIndex: number;
  totalCollections: number;
  isPaused: boolean;
  onStoryEnd: () => void;
  onProgressSelect: (index: number) => void;
  isInteractive?: boolean;
  showProgress?: boolean;
}> = ({
  collection,
  collectionIndex,
  totalCollections,
  isPaused,
  onStoryEnd,
  onProgressSelect,
  isInteractive = true,
  showProgress = true
}) => {
  const [imageProgress, setImageProgress] = useState(0);

  // Reset progress when collection changes
  useEffect(() => {
    setImageProgress(0);
  }, [collection.id]);

  // Handle progression for the current collection (one slide per filter)
  useEffect(() => {
    if (!isInteractive || totalCollections === 0) return;
    if (isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / IMAGE_DURATION_MS) * 100, 100);
      setImageProgress(progress);
    }, 50);

    const timeout = setTimeout(() => {
      onStoryEnd();
      setImageProgress(0);
    }, IMAGE_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [collection.id, isPaused, isInteractive, onStoryEnd, totalCollections]);

  return (
    <>
      {/* Background Image (First image of the collection) */}
      <div className="absolute inset-0 bg-black">
        {collection.images.slice(0, 1).map((img) => (
          <img
            key={`${collection.id}-${img}`}
            src={img}
            className="absolute inset-0 w-full h-full object-cover scale-110 saturate-[1.1] animate-slow-zoom"
            alt={collection.title}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Progress Bar (Story Style) - Now reflects filters, not inner images */}
      {showProgress && (
        <div className="absolute top-6 left-6 right-6 flex gap-1.5 z-20">
          {Array.from({ length: totalCollections }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onProgressSelect(idx);
              }}
              className="h-4 flex-1 flex items-center cursor-pointer"
              aria-label={`${idx + 1}. kartı göster`}
            >
              <span className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <span
                  className="h-full block bg-white rounded-full transition-[width] duration-75 ease-linear"
                  style={{
                    width: idx < collectionIndex ? '100%' : idx === collectionIndex ? `${imageProgress}%` : '0%'
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Floating Sentiment Badge */}
      <div className="absolute top-10 right-6 animate-page-in delay-100 z-20">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-1 rounded-[1.2rem] shadow-2xl">
          <div className="bg-white px-3 py-2 rounded-[1rem] flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[#BC4749] fill-[#BC4749]" />
              <span className="text-xs font-black text-[#1B4332]">{collection.ratingSummary?.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <div className="flex flex-col gap-1 mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-[#BC4749] px-3 py-1 rounded-lg shadow-xl shadow-[#BC4749]/20 transform -rotate-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{collection.sentiment?.replace('En Çok Övülen:', '').trim()}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-outfit text-5xl font-black text-white leading-[0.85] mb-5 drop-shadow-2xl">
          {collection.title.split(' ').map((word, i) => (
            <span key={i} className="block last:text-[#BC4749] last:drop-shadow-none">{word}</span>
          ))}
        </h2>

        <div className="relative mb-8">
          <p className="text-white/95 text-[15px] font-medium line-clamp-3 leading-relaxed max-w-[90%] border-l-2 border-[#BC4749]/50 pl-4">
            {collection.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {collection.cafeIds.slice(0, 3).map((id) => (
                <div key={id} className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md overflow-hidden ring-4 ring-black/10">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} alt="" className="w-full h-full opacity-90" />
                </div>
              ))}
              {collection.cafeIds.length > 3 && (
                <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-[#1B4332] flex items-center justify-center ring-4 ring-black/10">
                  <span className="text-[11px] font-black text-white">+{collection.cafeIds.length - 3}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-50">Önerilen Mekanlar</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">{collection.tag}</p>
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center active:scale-90 transition-all shadow-2xl group-hover:bg-[#BC4749] group-hover:text-white group-hover:rotate-12">
            <ArrowRight className="w-7 h-7 text-[#1B4332] group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </>
  );
}


export default FavoritesScreen;
