
export type MoodType = 'Focus' | 'Calm' | 'Social' | 'Creative';

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface Cafe {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  address: string;
  description: string;
  isJoined: boolean;
  stamps: number;
  maxStamps: number;
  points: number;
  wifiSpeed?: string;
  powerOutlets?: boolean;
  noiseLevel?: 'Sessiz' | 'Orta' | 'Canlı';
  hasGarden?: boolean;
  isOpenNow?: boolean;
  moods: MoodType[];
  coordinates: {
    lat: number;
    lng: number;
  };
  groundingLinks?: GroundingLink[];
}

export interface Campaign {
  id: string;
  cafeId: string;
  title: string;
  description: string;
  discount: string;
  timeLeft: string; // e.g. "02:14:50"
  color: string; // Background color for the graffiti card
  stickerIcon: string; // Emoji or simple graphic representation
  claimedCount: number;
  totalLimit: number;
  productImage: string;
}

export interface CafeCollection {
  id: string;
  title: string;
  description: string;
  images: string[]; // Changed from single image to array for slideshow
  cafeIds: string[];
  type: 'TIMLESS' | 'CONTEXTUAL' | 'BREAKFAST' | 'PRAISED' | 'ICONIC' | 'DYNAMIC';
  tag?: string;
  sentiment?: string; // e.g. "En çok övülen: Manzara"
  ratingSummary?: string; // e.g. "4.8 Ort."
  city?: string; // e.g. "İstanbul" - sadece bu şehir seçiliyken göster
}

export interface EditorPick {
  id: string;
  editorName: string;
  editorImage: string;
  title: string;
  blurb: string;
  image: string;
  location: string;
  readTime: string;
}

export type AppScreen = 'AUTH' | 'HOME' | 'MAP' | 'DETAIL' | 'PROFILE' | 'FAVES' | 'COLLECTION_DETAIL' | 'ARTICLE';

export interface MapState {
  pinLocation: { lat: number; lng: number };
  selectedRadius: number | null;
  mapCafes: Cafe[];
  hasPinBeenPlaced: boolean;
  userLocation: { lat: number; lng: number };
  activeFilters: string[];
  searchQuery: string;
  searchError: string | null;
}

export interface Filter {
  id: MoodType;
  label: string;
  icon: string;
  description: string;
}
