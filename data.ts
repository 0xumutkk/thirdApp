
import { Cafe, Filter, CafeCollection, EditorPick, Campaign } from './types';

export const CAFES: Cafe[] = [
  {
    id: '1',
    name: 'Nevada Coffee',
    distance: '450m',
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop',
    amenities: ['WiFi', 'Power Outlet', 'Outdoor'],
    address: 'Caferağa Mah, Mühürdar Cd. No:12',
    description: 'Minimalist bir çalışma alanı. Kömür latte ve sessiz atmosferiyle tanınır. Odaklanmak isteyenler için birebir.',
    isJoined: true,
    stamps: 4,
    maxStamps: 8,
    points: 450,
    wifiSpeed: '50 Mbps',
    powerOutlets: true,
    noiseLevel: 'Sessiz',
    moods: ['Focus', 'Calm'],
    coordinates: { lat: 40.9920, lng: 29.0230 }
  },
  {
    id: '2',
    name: 'Brew & Bloom',
    distance: '800m',
    rating: 4.9,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
    amenities: ['WiFi', 'Plants', 'Pastries'],
    address: 'Moda Bostanı Sk. No:45',
    description: 'Şehrin ortasında bir vaha. Her köşe yeşilliklerle ve taze ekşi maya kokusuyla dolu. Sosyalleşmek için harika bir ortam.',
    isJoined: false,
    stamps: 0,
    maxStamps: 10,
    points: 0,
    wifiSpeed: '35 Mbps',
    powerOutlets: false,
    noiseLevel: 'Orta',
    moods: ['Social', 'Creative'],
    coordinates: { lat: 40.9880, lng: 29.0320 }
  },
  {
    id: '3',
    name: 'The Loft Work',
    distance: '1.2km',
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
    amenities: ['WiFi', 'Quiet Zone', 'Meeting Room'],
    address: 'Galata Mah, No:12',
    description: 'Özellikle freelancerlar için tasarlanmış, ergonomik koltuklara sahip geniş bir alan.',
    isJoined: true,
    stamps: 2,
    maxStamps: 10,
    points: 120,
    wifiSpeed: '100 Mbps',
    powerOutlets: true,
    noiseLevel: 'Sessiz',
    moods: ['Focus', 'Creative'],
    coordinates: { lat: 40.9950, lng: 29.0300 }
  },
  {
    id: '4',
    name: 'Echoes Moda',
    distance: '300m',
    rating: 4.6,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2000&auto=format&fit=crop',
    amenities: ['Vinyl', 'Art', 'Coffee'],
    address: 'Moda Cd. No:18',
    description: 'Plak çalarlar ve vintage dekorasyonuyla ilham veren bir durak.',
    isJoined: false,
    stamps: 0,
    maxStamps: 6,
    points: 0,
    wifiSpeed: '20 Mbps',
    powerOutlets: true,
    noiseLevel: 'Canlı',
    moods: ['Creative', 'Social'],
    coordinates: { lat: 40.9905, lng: 29.0255 }
  },
  {
    id: '5',
    name: 'Quiet Corner',
    distance: '150m',
    rating: 4.5,
    reviews: 42,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1974&auto=format&fit=crop',
    amenities: ['Books', 'WiFi', 'Tea'],
    address: 'Lütfü Bey Sk. No:2',
    description: 'Sadece fısıltıyla konuşulan, huzur dolu bir sığınak.',
    isJoined: false,
    stamps: 0,
    maxStamps: 10,
    points: 0,
    wifiSpeed: '10 Mbps',
    powerOutlets: false,
    noiseLevel: 'Sessiz',
    moods: ['Calm', 'Focus'],
    coordinates: { lat: 40.9912, lng: 29.0285 }
  },
  {
    id: '6',
    name: 'Bebek Kahve',
    distance: '5.2km',
    rating: 4.9,
    reviews: 312,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1974&auto=format&fit=crop',
    amenities: ['WiFi', 'Outdoor', 'Sea View'],
    address: 'Bebek Sahil Yolu No:42',
    description: 'Boğaz kıyısında gün batımını izleyebileceğiniz, martı sesleri eşliğinde kahve keyfi.',
    isJoined: false,
    stamps: 0,
    maxStamps: 10,
    points: 0,
    wifiSpeed: '45 Mbps',
    powerOutlets: true,
    noiseLevel: 'Orta',
    moods: ['Calm', 'Social'],
    hasGarden: true,
    coordinates: { lat: 41.0770, lng: 29.0430 }
  },
  {
    id: '7',
    name: 'Ortaköy Teras',
    distance: '6.1km',
    rating: 4.8,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=2070&auto=format&fit=crop',
    amenities: ['WiFi', 'Outdoor', 'Terrace', 'Sea View'],
    address: 'Ortaköy Meydanı Sk. No:8',
    description: 'Boğaz Köprüsü manzaralı terasında kahve ve tatlı keyfi. Gün batımında eşsiz.',
    isJoined: false,
    stamps: 0,
    maxStamps: 10,
    points: 0,
    wifiSpeed: '30 Mbps',
    powerOutlets: true,
    noiseLevel: 'Canlı',
    moods: ['Social', 'Creative'],
    hasGarden: true,
    coordinates: { lat: 41.0555, lng: 29.0265 }
  }
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp1',
    cafeId: '2',
    title: 'Rainy Day Rescue',
    description: 'Yağmur dinene kadar sıcak çikolata ve kurabiye ikilisi.',
    discount: '%40 OFF',
    timeLeft: '02:15:00',
    color: '#FF006E',
    stickerIcon: '☔',
    claimedCount: 12,
    totalLimit: 20,
    productImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'cmp2',
    cafeId: '1',
    title: 'Power Hour',
    description: '14:00 - 16:00 arası tüm filtre kahvelerde sınırsız dolum.',
    discount: '1+1 FREE',
    timeLeft: '01:45:00',
    color: '#8338EC',
    stickerIcon: '⚡',
    claimedCount: 45,
    totalLimit: 50,
    productImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'cmp3',
    cafeId: '4',
    title: 'Vinyl & Brew',
    description: 'Kendi plağını getir, kahveni indirimli kap.',
    discount: '%30 OFF',
    timeLeft: '04:00:00',
    color: '#3A86FF',
    stickerIcon: '🎵',
    claimedCount: 5,
    totalLimit: 15,
    productImage: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=200&auto=format&fit=crop'
  }
];

export const COLLECTIONS: CafeCollection[] = [
  {
    id: 'dyn1',
    title: 'Manzara',
    description: 'Şehrin kaosundan uzaklaşıp gün batımını izleyebileceğiniz en iyi noktalar.',
    images: [
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=2070&auto=format&fit=crop'
    ],
    cafeIds: ['2', '4', '6', '7'],
    type: 'DYNAMIC',
    tag: 'MANZARA',
    sentiment: 'En Çok Övülen: Gün Batımı',
    ratingSummary: '4.9 Ort.'
  },
  {
    id: 'dyn2',
    title: 'Bahçe',
    description: 'Betonların arasında yeşile ve sessizliğe doyacağınız vahalar.',
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop'
    ],
    cafeIds: ['1', '2', '6', '7'],
    type: 'DYNAMIC',
    tag: 'BAHÇE',
    sentiment: 'En Çok Övülen: Huzur',
    ratingSummary: '4.8 Ort.'
  },
  {
    id: 'dyn3',
    title: 'Botanik',
    description: 'Bitkilerle çevrili, doğayla iç içe kahve durakları.',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop'
    ],
    cafeIds: ['1', '2', '5'],
    type: 'DYNAMIC',
    tag: 'BOTANİK',
    sentiment: 'En Çok Övülen: Yeşillik',
    ratingSummary: '4.7 Ort.'
  },
  {
    id: 'dyn4',
    title: 'Konsept',
    description: 'Vinyl, sanat ve özgün atmosferiyle fark yaratan mekanlar.',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517502884422-41e157d44305?q=80&w=2064&auto=format&fit=crop'
    ],
    cafeIds: ['3', '4', '5'],
    type: 'DYNAMIC',
    tag: 'KONSEPT',
    sentiment: 'En Çok Övülen: Atmosfer',
    ratingSummary: '4.7 Ort.'
  },
  {
    id: 'dyn5',
    title: 'Çalışma',
    description: 'Priz, hızlı wifi ve odaklanmak için ideal mekanlar.',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517502884422-41e157d44305?q=80&w=2064&auto=format&fit=crop'
    ],
    cafeIds: ['1', '3', '6'],
    type: 'DYNAMIC',
    tag: 'ÇALIŞMA',
    sentiment: 'En Çok Övülen: Odaklanma',
    ratingSummary: '4.8 Ort.'
  },
  {
    id: 'dyn6',
    title: 'Boğaz',
    description: 'Boğaz manzaralı, martı sesleri eşliğinde kahve keyfi.',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1974&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=2070&auto=format&fit=crop'
    ],
    cafeIds: ['6', '7'],
    type: 'DYNAMIC',
    tag: 'BOĞAZ',
    sentiment: 'En Çok Övülen: Manzara',
    ratingSummary: '4.9 Ort.',
    city: 'İstanbul'
  }
];

export const EDITOR_PICKS: EditorPick[] = [
  {
    id: 'p1',
    editorName: 'Melis E.',
    editorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
    title: 'Boğazın Gizli Balkonu',
    location: 'Beyoğlu',
    readTime: '2 dk',
    blurb: 'Beyoğlu’nun kalabalığından kaçıp, sadece martı seslerini duyabileceğiniz o gizli balkonu buldum. Laptopu kapıp gitmelisiniz.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'p2',
    editorName: 'Can B.',
    editorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
    title: 'Moda’da Bir Plak Gecesi',
    location: 'Kadıköy',
    readTime: '3 dk',
    blurb: 'Cumartesi akşamları burası bir kafeden çok, 70’lerin Londra’sındaki bir müzik kulübüne dönüşüyor. Filtre kahve ve caz bir arada.',
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'p3',
    editorName: 'Sarah J.',
    editorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150',
    title: 'Digital Nomad Guide: Istanbul',
    location: 'Karaköy',
    readTime: '5 dk',
    blurb: 'Fastest wifi in Karaköy? I spent 2 weeks testing 15 different spots. Here is my final roadmap for high-speed focus.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop'
  }
];

export const FILTERS: Filter[] = [
  { id: 'Focus', label: 'Odaklan', icon: 'Laptop', description: 'Work & Deep focus' },
  { id: 'Calm', label: 'Huzur', icon: 'Moon', description: 'Quiet & Relax' },
  { id: 'Social', label: 'Sosyal', icon: 'Users', description: 'Lively & Friends' },
  { id: 'Creative', label: 'Yaratıcı', icon: 'Palette', description: 'Inspiring spaces' }
];
