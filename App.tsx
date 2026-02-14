
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import MapScreen from './components/MapScreen';
import CafeDetailScreen from './components/CafeDetailScreen';
import ProfileScreen from './components/ProfileScreen';
import FavoritesScreen from './components/FavoritesScreen';
import BottomNavigation from './components/BottomNavigation';
import GroupDetailScreen from './components/GroupDetailScreen';
import EditorArticleScreen from './components/EditorArticleScreen';
import { AppScreen, Cafe, CafeCollection, EditorPick, MapState } from './types';
import { CAFES, COLLECTIONS } from './data';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [cafes, setCafes] = useState<Cafe[]>(CAFES);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe>(CAFES[0]);
  const [activeCollection, setActiveCollection] = useState<CafeCollection | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<EditorPick | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [routeToCafe, setRouteToCafe] = useState<Cafe | null>(null);
  const [screenBeforeDetail, setScreenBeforeDetail] = useState<AppScreen | null>(null);
  const [lastMapState, setLastMapState] = useState<MapState | null>(null);

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
          // Fallback to default if needed, or just stay as null
        }
      );
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentScreen('HOME');
  };

  const toggleFavorite = (cafeId: string) => {
    setFavorites(prev =>
      prev.includes(cafeId) ? prev.filter(id => id !== cafeId) : [...prev, cafeId]
    );
  };

  const joinCafe = (cafeId: string) => {
    setCafes(prev => prev.map(c =>
      c.id === cafeId ? { ...c, isJoined: true } : c
    ));
    const updatedCafe = cafes.find(c => c.id === cafeId);
    if (updatedCafe) setSelectedCafe({ ...updatedCafe, isJoined: true });
    setCurrentScreen('PROFILE');
  };

  const navigateToDetail = (cafe: Cafe, mapState?: MapState) => {
    setSelectedCafe(cafe);
    if (mapState) setLastMapState(mapState);
    setScreenBeforeDetail(currentScreen);
    setCurrentScreen('DETAIL');
  };

  const navigateToCollection = (collection: CafeCollection) => {
    setActiveCollection(collection);
    setCurrentScreen('COLLECTION_DETAIL');
  };

  const navigateToArticle = (article: EditorPick) => {
    setSelectedArticle(article);
    setCurrentScreen('ARTICLE');
  };

  if (!isAuthenticated) {
    return (
      <div className="relative h-screen w-full flex flex-col max-w-md mx-auto shadow-2xl bg-[#FAF9F6] overflow-hidden">
        <AuthScreen onLogin={handleLogin} />
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'HOME':
        return <HomeScreen
          onSelectCafe={navigateToDetail}
          onOpenWallet={() => setCurrentScreen('PROFILE')}
          onSelectCollection={navigateToCollection}
          onSelectArticle={navigateToArticle}
          cafes={cafes}
        />;
      case 'MAP':
        return (
          <MapScreen
            onSelectCafe={navigateToDetail}
            cafes={cafes}
            userLocation={userLocation}
            routeToCafe={routeToCafe}
            onRouteDone={() => setRouteToCafe(null)}
            initialMapState={lastMapState}
          />
        );
      case 'DETAIL':
        return (
          <CafeDetailScreen
            cafe={cafes.find(c => c.id === selectedCafe.id) || selectedCafe}
            isFavorite={favorites.includes(selectedCafe.id)}
            onToggleFavorite={() => toggleFavorite(selectedCafe.id)}
            onBack={() => setCurrentScreen(activeCollection ? 'COLLECTION_DETAIL' : (screenBeforeDetail ?? 'HOME'))}
            onJoin={() => joinCafe(selectedCafe.id)}
            onGoToMap={(cafe) => {
              setRouteToCafe(cafe);
              setLastMapState(null);
              setCurrentScreen('MAP');
            }}
          />
        );
      case 'PROFILE':
        return <ProfileScreen cafes={cafes} onBack={() => setCurrentScreen('HOME')} />;
      case 'COLLECTION_DETAIL':
        return activeCollection ? (
          <GroupDetailScreen
            collection={activeCollection}
            onBack={() => { setActiveCollection(null); setCurrentScreen('HOME'); }}
            onSelectCafe={navigateToDetail}
            cafes={cafes}
          />
        ) : null;
      case 'FAVES':
        return <FavoritesScreen
          onSelectCafe={navigateToDetail}
          onSelectCollection={navigateToCollection}
          cafes={cafes.filter(c => favorites.includes(c.id))}
        />;
      case 'ARTICLE':
        return selectedArticle ? (
          <EditorArticleScreen
            article={selectedArticle}
            onBack={() => setCurrentScreen('HOME')}
          />
        ) : null;
      default:
        return <HomeScreen
          onSelectCafe={navigateToDetail}
          onOpenWallet={() => setCurrentScreen('PROFILE')}
          onSelectCollection={navigateToCollection}
          cafes={cafes}
        />;
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col max-w-md mx-auto shadow-2xl bg-[#FAF9F6] overflow-hidden">
      <main key={currentScreen} className="flex-1 relative overflow-hidden animate-page-in">
        {renderScreen()}
      </main>

      {(currentScreen === 'HOME' || currentScreen === 'MAP' || currentScreen === 'PROFILE' || currentScreen === 'FAVES') && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={(s) => {
            setActiveCollection(null);
            if (currentScreen === 'MAP' && s !== 'MAP') setLastMapState(null);
            setCurrentScreen(s);
            if (s !== 'MAP') setRouteToCafe(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
