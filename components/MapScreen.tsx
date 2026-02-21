import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navigation, Navigation2, Star, Briefcase, Leaf, Utensils, Coffee, Mountain, Plus, Search, MapPin, Wifi, Clock, ChevronDown, Radio, Sparkles, Laptop, Telescope, Trees, Sprout, Palette, Ship } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { Cafe, MapState } from '../types';
import { fetchNearbyCafesFromPlaces, haversineDistanceMeters } from '../services/places';

const CATEGORY_TERMS: Record<string, string[]> = {
  work: ['work', 'study', 'laptop', 'cowork', 'ofis', 'çalışma', 'wifi', 'internet'],
  view: ['view', 'manzara', 'sea', 'deniz', 'sahil', 'terrace', 'teras', 'panorama'],
  garden: ['garden', 'bahçe', 'outdoor', 'park', 'avlu', 'patio'],
  botanical: ['botanik', 'botanical', 'flora', 'plant', 'bitki', 'green', 'yeşil'],
  creative: ['creative', 'konsept', 'design', 'art', 'studio', 'galeri', 'atelier', 'vintage'],
  breakfast: ['breakfast', 'brunch', 'kahvaltı', 'serpme', 'croissant', 'bakery', 'fırın'],
  bosphorus: ['bosphorus', 'boğaz', 'sahil', 'bebek', 'ortaköy', 'arnavutköy', 'kuruçeşme']
};

const ROUTE_SOURCE_ID = 'route-source';
const ROUTE_LAYER_ID = 'route-line';
const CIRCLE_SOURCE_ID = 'circle-source';
const CIRCLE_FILL_LAYER_ID = 'circle-fill';
const CIRCLE_LINE_LAYER_ID = 'circle-line';

const R = 6371000; // Earth radius in meters

const textForCategory = (cafe: Cafe) => {
  return [
    cafe.name,
    cafe.address,
    cafe.description || '',
    ...(cafe.amenities || []),
    ...(cafe.placeTypes || [])
  ]
    .join(' ')
    .toLowerCase();
};

const matchesCategory = (cafe: Cafe, filterId: string) => {
  const searchable = textForCategory(cafe);
  const terms = CATEGORY_TERMS[filterId] || [filterId];
  const hasTermMatch = terms.some((term) => searchable.includes(term.toLowerCase()));
  const placeTypes = (cafe.placeTypes || []).map((type) => type.toLowerCase());

  if (filterId === 'work') {
    const hasWorkType = placeTypes.some((type) =>
      ['cafe', 'bakery', 'restaurant', 'food'].some((hint) => type.includes(hint))
    );
    const highSignal = cafe.rating >= 4.3 && cafe.reviews >= 40;
    return hasTermMatch || (hasWorkType && highSignal);
  }

  if (filterId === 'breakfast') {
    const hasBreakfastType = placeTypes.some((type) =>
      ['bakery', 'breakfast', 'restaurant', 'meal_takeaway', 'food'].some((hint) => type.includes(hint))
    );
    return hasTermMatch || hasBreakfastType;
  }

  if (filterId === 'creative') {
    const hasCreativeType = placeTypes.some((type) =>
      ['art_gallery', 'book_store', 'museum'].some((hint) => type.includes(hint))
    );
    return hasTermMatch || hasCreativeType;
  }

  if (filterId === 'bosphorus') {
    if (hasTermMatch) return true;
    if (!cafe.coordinates) return false;
    return cafe.coordinates.lat >= 40.99 && cafe.coordinates.lat <= 41.16 && cafe.coordinates.lng >= 28.95 && cafe.coordinates.lng <= 29.16;
  }

  return hasTermMatch;
};

function createCirclePolygon(lat: number, lng: number, radiusMeters: number): GeoJSON.Polygon {
  const points: [number, number][] = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const bearing = (i / n) * 360;
    const rad = (bearing * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const δ = radiusMeters / R;
    const φ2 = Math.asin(
      Math.sin(latRad) * Math.cos(δ) + Math.cos(latRad) * Math.sin(δ) * Math.cos(rad)
    );
    const λ2 =
      lngRad +
      Math.atan2(
        Math.sin(rad) * Math.sin(δ) * Math.cos(latRad),
        Math.cos(δ) - Math.sin(latRad) * Math.sin(φ2)
      );
    points.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
  }
  return { type: 'Polygon', coordinates: [points] };
}

interface MapScreenProps {
  onSelectCafe: (cafe: Cafe, mapState?: MapState) => void;
  cafes: Cafe[];
  userLocation: { lat: number, lng: number } | null;
  routeToCafe?: Cafe | null;
  onRouteDone?: () => void;
  initialMapState?: MapState | null;
}

const MapScreen: React.FC<MapScreenProps> = ({ onSelectCafe, cafes, userLocation: propUserLocation, routeToCafe, onRouteDone, initialMapState }) => {
  const defaultCenter = propUserLocation || { lat: 40.9910, lng: 29.0270 };
  const initialCenter = initialMapState
    ? (initialMapState.hasPinBeenPlaced ? initialMapState.pinLocation : initialMapState.userLocation)
    : defaultCenter;
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number }>(() => initialMapState?.userLocation ?? defaultCenter);
  const [pinLocation, setPinLocation] = useState<{ lat: number, lng: number }>(() => initialMapState?.pinLocation ?? defaultCenter);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [mapCafes, setMapCafes] = useState<Cafe[]>(() => initialMapState?.mapCafes ?? []);
  const [allFetchedCafes, setAllFetchedCafes] = useState<Cafe[]>(() => initialMapState?.mapCafes ?? []);
  const lastSearchRef = useRef<{ lat: number; lng: number; radius: number } | null>(
    initialMapState?.mapCafes?.length && initialMapState?.selectedRadius
      ? {
        lat: (initialMapState.hasPinBeenPlaced ? initialMapState.pinLocation : initialMapState.userLocation).lat,
        lng: (initialMapState.hasPinBeenPlaced ? initialMapState.pinLocation : initialMapState.userLocation).lng,
        radius: initialMapState.selectedRadius,
      }
      : null
  );
  const [mapReady, setMapReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(() => initialMapState?.activeFilters ?? []);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(() => initialMapState?.selectedRadius ?? 500);
  const [searchQuery, setSearchQuery] = useState(() => initialMapState?.searchQuery ?? '');
  const [pinModeActive, setPinModeActive] = useState(false);
  const [hasPinBeenPlaced, setHasPinBeenPlaced] = useState(() => initialMapState?.hasPinBeenPlaced ?? false);
  const [currentTime] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(() => initialMapState?.searchError ?? null);
  const [isNudging, setIsNudging] = useState(false);



  const routeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pinMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pinModeActiveRef = useRef(false);
  const mapStateRef = useRef<MapState | null>(null);
  const routeToCafeRef = useRef<Cafe | null>(null);
  const handleSearchRef = useRef<() => void>(() => { });
  const renderMarkersRef = useRef<() => void>(() => { });
  const mapLoadTimeRef = useRef<number>(0);

  useEffect(() => {
    routeToCafeRef.current = routeToCafe ?? null;
  }, [routeToCafe]);

  useEffect(() => {
    pinModeActiveRef.current = pinModeActive;
  }, [pinModeActive]);

  useEffect(() => {
    mapStateRef.current = {
      pinLocation,
      selectedRadius,
      mapCafes,
      hasPinBeenPlaced,
      userLocation,
      activeFilters,
      searchQuery,
      searchError,
    };
  }, [pinLocation, selectedRadius, mapCafes, hasPinBeenPlaced, userLocation, activeFilters, searchQuery, searchError]);

  const circleCenter = hasPinBeenPlaced ? pinLocation : userLocation;

  const isIstanbul = useMemo(() => {
    const lat = circleCenter.lat;
    const lng = circleCenter.lng;
    return lat >= 40.85 && lat <= 41.25 && lng >= 28.8 && lng <= 29.5;
  }, [circleCenter.lat, circleCenter.lng]);

  const categoryShortcuts = useMemo(() => {
    const base = [
      { id: 'work', label: 'Çalışma', icon: <Laptop className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'view', label: 'Manzara', icon: <Mountain className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'garden', label: 'Bahçe', icon: <Trees className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'botanical', label: 'Botanik', icon: <Sprout className="w-3.5 h-3.5" />, color: '#BC4749' },
      { id: 'creative', label: 'Konsept', icon: <Palette className="w-3.5 h-3.5" />, color: '#BC4749' }
    ];
    if (isIstanbul) {
      base.push({ id: 'bosphorus', label: 'Boğaz', icon: <Ship className="w-3.5 h-3.5" />, color: '#BC4749' });
    }
    return base;
  }, [isIstanbul]);

  const filteredCafes = useMemo(() => {
    let list = mapCafes;
    if (activeFilters.length > 0) {
      list = list.filter((cafe) =>
        activeFilters.every((filterId) => matchesCategory(cafe, filterId))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (cafe) =>
          cafe.name.toLowerCase().includes(q) || cafe.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [mapCafes, activeFilters, searchQuery]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
      setPinLocation(propUserLocation);
    }
  }, [propUserLocation]);

  const filterByRadius = useCallback((cafes: Cafe[], center: { lat: number; lng: number }, radiusM: number) =>
    cafes.filter(c => {
      if (!c.coordinates) return false;
      const dist = haversineDistanceMeters(center.lat, center.lng, c.coordinates.lat, c.coordinates.lng);
      const tolerance = radiusM < 1000 ? 80 : radiusM * 0.08;
      return dist <= radiusM + tolerance;
    }), []);

  const handleSearch = useCallback(async () => {
    if (!mapReady || !circleCenter || selectedRadius === null) return;

    const last = lastSearchRef.current;
    const sameCenter = last && Math.abs(last.lat - circleCenter.lat) < 1e-5 && Math.abs(last.lng - circleCenter.lng) < 1e-5;

    if (sameCenter && selectedRadius <= last.radius && allFetchedCafes.length > 0) {
      const filtered = filterByRadius(allFetchedCafes, circleCenter, selectedRadius);
      setMapCafes(filtered);
      setSearchError(filtered.length === 0 ? "Bu yarıçapta mekan bulunamadı." : null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const fetchRadius = Math.max(selectedRadius, 2000);
      const results = await fetchNearbyCafesFromPlaces(
        circleCenter.lat,
        circleCenter.lng,
        fetchRadius
      );
      const withinSelectedRadius = filterByRadius(results, circleCenter, selectedRadius);
      lastSearchRef.current = { lat: circleCenter.lat, lng: circleCenter.lng, radius: fetchRadius };
      setAllFetchedCafes(results);
      setMapCafes(withinSelectedRadius);
      if (withinSelectedRadius.length === 0) {
        setSearchError("Bu bölgede uygun mekan bulunamadı.");
      }
    } catch (err: any) {
      console.error(err);
      setSearchError("Arama hatası. API anahtarını kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  }, [mapReady, circleCenter, selectedRadius, allFetchedCafes.length, filterByRadius]);

  useEffect(() => {
    handleSearchRef.current = handleSearch;
  }, [handleSearch]);


  useEffect(() => {
    if (!circleCenter || selectedRadius === null) return;
    const last = lastSearchRef.current;
    const sameCenter = last && Math.abs(last.lat - circleCenter.lat) < 1e-6 && Math.abs(last.lng - circleCenter.lng) < 1e-6;

    const justLoaded = Date.now() - mapLoadTimeRef.current < 2500;
    if (justLoaded && !sameCenter) return;

    if (sameCenter && allFetchedCafes.length > 0 && selectedRadius <= last!.radius) {
      const filtered = filterByRadius(allFetchedCafes, circleCenter, selectedRadius);
      setMapCafes(filtered);
      setSearchError(filtered.length === 0 ? "Bu yarıçapta mekan bulunamadı." : null);
    } else if (sameCenter && selectedRadius > (last?.radius ?? 0) && !isLoading) {
      handleSearch();
    }
  }, [selectedRadius, circleCenter.lat, circleCenter.lng, allFetchedCafes, filterByRadius, handleSearch, isLoading]);

  useEffect(() => {
    if (!mapReady || !selectedRadius) return;
    const map = mapInstance.current;
    if (map && map.isStyleLoaded()) {
      const lat = circleCenter.lat;
      const lng = circleCenter.lng;
      const radiusMeters = selectedRadius;
      const latRadian = lat * (Math.PI / 180);
      const degLat = radiusMeters / 111319.9;
      const degLng = radiusMeters / (111319.9 * Math.cos(latRadian));

      const bounds = new maplibregl.LngLatBounds(
        [lng - degLng, lat - degLat],
        [lng + degLng, lat + degLat]
      );

      const timer = setTimeout(() => {
        if (map.isStyleLoaded()) {
          map.fitBounds(bounds, {
            padding: 80,
            duration: 1200,
            essential: true
          });
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [selectedRadius, circleCenter.lat, circleCenter.lng, mapReady]);

  useEffect(() => {
    if (mapCafes.length > 0) {
      setIsNudging(true);
      const timer = setTimeout(() => setIsNudging(false), 800);
      return () => clearTimeout(timer);
    }
  }, [mapCafes]);



  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const clusterIndex = useRef<Supercluster | null>(null);

  const renderMarkers = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    let clusters: any[] = [];
    if (selectedRadius === 2000 && clusterIndex.current) {
      const bounds = map.getBounds();
      const zoom = Math.floor(map.getZoom());
      clusters = clusterIndex.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom
      );
    } else {
      clusters = filteredCafes.map(cafe => ({
        type: 'Feature' as const,
        properties: { cluster: false, cafeId: cafe.id, rating: cafe.rating },
        geometry: { type: 'Point' as const, coordinates: [cafe.coordinates.lng, cafe.coordinates.lat] as [number, number] }
      }));
    }


    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    clusters.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const { cluster, point_count: pointCount, cafeId, rating } = feature.properties;

      const el = document.createElement('div');
      const stopMapGesture = (e: Event) => {
        e.stopPropagation();
      };
      if (cluster) {
        el.className = 'cluster-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.innerText = pointCount.toString();
        ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(ev => el.addEventListener(ev, stopMapGesture));
        el.onclick = () => {
          const expansionZoom = clusterIndex.current!.getClusterExpansionZoom(feature.id as number);
          map.flyTo({ center: [lng, lat], zoom: expansionZoom });
        };
      } else {
        el.className = 'custom-marker';
        el.style.width = '42px';
        el.style.height = '42px';
        el.style.backgroundColor = '#1B4332';
        el.style.borderRadius = '12px';
        el.style.border = '3px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.transform = 'rotate(45deg)';
        el.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        el.style.pointerEvents = 'auto';
        el.innerHTML = `<div style="transform: rotate(-45deg); color: white; font-weight: 800; font-size: 10px; pointer-events: none;">${rating}</div>`;

        const cafe = filteredCafes.find(c => c.id === cafeId);
        el.style.cursor = 'pointer';
        ['mousedown', 'touchstart', 'pointerdown'].forEach(ev => el.addEventListener(ev, stopMapGesture));
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (cafe) onSelectCafe(cafe, mapStateRef.current ?? undefined);
        });
      }

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [onSelectCafe, filteredCafes, selectedRadius]);

  useEffect(() => {
    renderMarkersRef.current = renderMarkers;
  }, [renderMarkers]);

  useEffect(() => {
    if (!mapContainer.current) return;
    setMapReady(false);

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14.5,

      attributionControl: false,
    });

    mapInstance.current = map;

    map.on('load', () => {
      const userEl = document.createElement('div');
      userEl.innerHTML = `<div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);"></div>`;
      new maplibregl.Marker({ element: userEl }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);

      const pinEl = document.createElement('div');
      pinEl.innerHTML = `<div style="width: 36px; height: 36px; background: #BC4749; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(188,71,73,0.5); display: flex; align-items: center; justify-content: center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`;
      pinEl.style.cursor = 'grab';
      const pinMarker = new maplibregl.Marker({ element: pinEl, draggable: true }).setLngLat([pinLocation.lng, pinLocation.lat]);
      pinMarkerRef.current = pinMarker;

      pinMarker.on('dragend', () => {
        const lngLat = pinMarker.getLngLat();
        setPinLocation({ lat: lngLat.lat, lng: lngLat.lng });
      });

      map.on('click', (e) => {
        if (pinModeActiveRef.current) {
          setPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          pinMarker.setLngLat(e.lngLat);
          setPinModeActive(false);
          setHasPinBeenPlaced(true);
        }
      });

      mapLoadTimeRef.current = Date.now();
      setMapReady(true);

      if (selectedRadius !== null) {
        setTimeout(() => handleSearchRef.current(), 100);
      }

      const cafe = routeToCafeRef.current;
      if (cafe?.coordinates) {
        const origin = propUserLocation ?? userLocation;
        const { lat: uLat, lng: uLng } = origin;
        const { lat: cLat, lng: cLng } = cafe.coordinates;
        const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${cLng},${cLat}?overview=full&geometries=geojson`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (!mapInstance.current?.isStyleLoaded()) return;
            if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) return;
            const coords = data.routes[0].geometry.coordinates as [number, number][];
            const geojson = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: coords } };
            const m = mapInstance.current!;
            if (m.getSource(ROUTE_SOURCE_ID)) {
              (m.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
            } else {
              m.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson });
              m.addLayer({
                id: ROUTE_LAYER_ID,
                type: 'line',
                source: ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3B82F6', 'line-width': 6, 'line-opacity': 0.8 },
              });
            }
            const bounds = new maplibregl.LngLatBounds();
            coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
            bounds.extend([uLng, uLat]);
            bounds.extend([cLng, cLat]);
            setTimeout(() => { if (m.isStyleLoaded()) m.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 1500 }); }, 100);
            routeMarkerRef.current?.remove();
            const destEl = document.createElement('div');
            destEl.style.cssText = 'width:36px;height:36px;background:#3B82F6;border-radius:10px;border:3px solid white;box-shadow:0 0 20px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;cursor:pointer;';
            destEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
            destEl.onclick = () => onSelectCafe(cafe, mapStateRef.current ?? undefined);
            routeMarkerRef.current = new maplibregl.Marker({ element: destEl }).setLngLat([cLng, cLat]).addTo(m);
          })
          .catch((err) => console.error('[Routing] Error:', err));
      }
    });

    map.on('moveend', () => {
      if (Date.now() - mapLoadTimeRef.current < 3500) return;
      if (clusterIndex.current && mapInstance.current?.isStyleLoaded()) renderMarkersRef.current();
    });

    return () => {
      pinMarkerRef.current?.remove();
      pinMarkerRef.current = null;
      routeMarkerRef.current?.remove();
      routeMarkerRef.current = null;
      if (mapInstance.current) mapInstance.current.remove();
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current?.isStyleLoaded()) return;
    const points = filteredCafes.map(cafe => ({
      type: 'Feature' as const,
      properties: { cluster: false, cafeId: cafe.id, rating: cafe.rating },
      geometry: { type: 'Point' as const, coordinates: [cafe.coordinates.lng, cafe.coordinates.lat] as [number, number] }
    }));
    clusterIndex.current = new Supercluster({ radius: 40, maxZoom: 16 }).load(points);

    renderMarkers();
  }, [filteredCafes, mapReady, renderMarkers]);

  useEffect(() => {
    if (!mapReady || !circleCenter) return;
    const map = mapInstance.current;
    if (!map?.isStyleLoaded()) return;

    if (selectedRadius === null) {
      if (map.getLayer(CIRCLE_LINE_LAYER_ID)) map.removeLayer(CIRCLE_LINE_LAYER_ID);
      if (map.getLayer(CIRCLE_FILL_LAYER_ID)) map.removeLayer(CIRCLE_FILL_LAYER_ID);
      if (map.getSource(CIRCLE_SOURCE_ID)) map.removeSource(CIRCLE_SOURCE_ID);
      setMapCafes([]);
      return;
    }

    if (!map.getSource(CIRCLE_SOURCE_ID)) {
      map.addSource(CIRCLE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: createCirclePolygon(circleCenter.lat, circleCenter.lng, selectedRadius) },
      });
      map.addLayer({
        id: CIRCLE_FILL_LAYER_ID,
        type: 'fill',
        source: CIRCLE_SOURCE_ID,
        paint: { 'fill-color': '#BC4749', 'fill-opacity': 0.15 },

      });
      map.addLayer({
        id: CIRCLE_LINE_LAYER_ID,
        type: 'line',
        source: CIRCLE_SOURCE_ID,
        paint: { 'line-color': '#BC4749', 'line-width': 2 },
      });
    } else {
      const geo = createCirclePolygon(circleCenter.lat, circleCenter.lng, selectedRadius);
      (map.getSource(CIRCLE_SOURCE_ID) as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: geo,
      });
    }
  }, [circleCenter.lat, circleCenter.lng, selectedRadius, mapReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !pinMarkerRef.current) return;
    if (hasPinBeenPlaced) {
      pinMarkerRef.current.setLngLat([pinLocation.lng, pinLocation.lat]);
      pinMarkerRef.current.addTo(map);
    } else {
      pinMarkerRef.current.remove();
    }
  }, [hasPinBeenPlaced, pinLocation.lat, pinLocation.lng, mapReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const removeRoute = () => {
      const m = mapInstance.current;
      if (!m || !m.getStyle()) return;
      if (m.getSource(ROUTE_SOURCE_ID)) {
        if (m.getLayer(ROUTE_LAYER_ID)) m.removeLayer(ROUTE_LAYER_ID);
        m.removeSource(ROUTE_SOURCE_ID);
      }
      routeMarkerRef.current?.remove();
      routeMarkerRef.current = null;
    };

    if (!routeToCafe) {
      removeRoute();
      return;
    }

    const routeOrigin = propUserLocation ?? userLocation;
    const { lat: uLat, lng: uLng } = routeOrigin;
    const { lat: cLat, lng: cLng } = routeToCafe.coordinates;

    console.log(`[Routing] Fetching blue route: from [${uLat}, ${uLng}] to [${cLat}, ${cLng}]`);

    const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${cLng},${cLat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const m = mapInstance.current;
        if (!m || !m.isStyleLoaded()) return;

        if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
          console.warn("[Routing] No route found:", data);
          removeRoute();
          return;
        }

        const coords = data.routes[0].geometry.coordinates as [number, number][];
        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: coords },
        };

        if (m.getSource(ROUTE_SOURCE_ID)) {
          (m.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
        } else {
          m.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson });
          m.addLayer({
            id: ROUTE_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#3B82F6', // Blue route
              'line-width': 6,
              'line-opacity': 0.8
            },
          });
        }

        const bounds = new maplibregl.LngLatBounds();
        coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        bounds.extend([uLng, uLat]);
        bounds.extend([cLng, cLat]);

        // Add a slight delay to ensure the layer is rendered before fitting
        setTimeout(() => {
          if (m.isStyleLoaded()) {
            m.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 1500 });
          }
        }, 100);

        routeMarkerRef.current?.remove();
        const destEl = document.createElement('div');
        destEl.style.width = '36px';
        destEl.style.height = '36px';
        destEl.style.backgroundColor = '#3B82F6'; // Matching blue
        destEl.style.borderRadius = '10px';
        destEl.style.border = '3px solid white';
        destEl.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        destEl.style.cursor = 'pointer';
        destEl.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>';
        destEl.onclick = () => onSelectCafe(routeToCafe, mapStateRef.current ?? undefined);

        routeMarkerRef.current = new maplibregl.Marker({ element: destEl })
          .setLngLat([cLng, cLat])
          .addTo(m);
      })
      .catch((err) => {
        console.error("[Routing] Error:", err);
        removeRoute();
      });

    return removeRoute;
  }, [routeToCafe, mapReady, propUserLocation, userLocation.lat, userLocation.lng]);

  const RADIUS_OPTIONS = [
    { label: '500m', value: 500 },
    { label: '1km', value: 1000 },
    { label: '2km', value: 2000 },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F0EFEB]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      <div className="absolute top-10 left-0 right-0 px-6 z-20 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 px-4 py-3">
            <Search className="w-4 h-4 text-[#BC4749] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mekan veya adres ara..."
              className="flex-1 bg-transparent text-sm font-medium text-[#1B4332] placeholder:text-gray-400 outline-none min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedRadius((prev) => (prev === opt.value ? null : opt.value))}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${selectedRadius === opt.value ? 'bg-[#1B4332] text-white shadow-md' : 'text-[#1B4332]/60 hover:text-[#1B4332]'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              title="Bu bölgede ara"
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black transition-all active:scale-95 ${isLoading ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#1B4332] text-white shadow-md hover:bg-[#2d5a45]'}`}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              {isLoading ? '...' : 'Bölgede ara'}
            </button>
          </div>

          {pinModeActive && (
            <p className="text-[9px] font-bold text-[#BC4749]">Haritaya tıklayın, pin yerleşsin</p>
          )}

          {searchError && (
            <div className="bg-red-50 border border-red-100 p-2 rounded-xl">
              <p className="text-[10px] text-red-600 font-bold text-center">{searchError}</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => mapInstance.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 16 })}
        className="absolute bottom-[300px] right-6 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-[#1B4332] z-10 active:scale-90"
      >
        <Navigation className="w-5 h-5 fill-[#1B4332]" />
      </button>

      <button
        onClick={() => setPinModeActive((on) => !on)}
        className={`absolute bottom-[300px] right-[5.5rem] w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center z-10 active:scale-90 transition-all ${pinModeActive ? 'bg-[#BC4749] text-white' : 'bg-white text-[#1B4332]'}`}
        title="Pin yerleştir"
      >
        <MapPin className="w-5 h-5" />
      </button>

      <div className={`absolute left-0 right-0 bottom-0 bg-white/95 backdrop-blur-2xl rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 z-30 overflow-hidden ${isPanelExpanded ? 'h-[85%]' : 'h-[280px]'} ${isNudging ? 'animate-bump' : ''}`}>

        <div className="w-full pt-6 pb-2 flex flex-col items-center cursor-pointer" onClick={() => setIsPanelExpanded(!isPanelExpanded)}>
          <div className="w-16 h-1.5 bg-[#1B4332]/10 rounded-full" />
        </div>

        <div className="h-full overflow-y-auto px-8 pb-40 no-scrollbar">
          <div className="mt-4 mb-6">
            <h3 className="font-outfit text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Kategoriler</h3>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
              {categoryShortcuts.map((filter) => {
                const isActive = activeFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-[1.5rem] transition-all duration-300 font-black text-[10px] uppercase tracking-wider active:scale-95 group relative overflow-hidden ${isActive
                      ? 'text-white shadow-[0_10px_20px_rgba(27,67,50,0.2)]'
                      : 'bg-white/70 backdrop-blur-xl border border-white/80 text-[#1B4332] shadow-sm hover:shadow-md'
                      }`}
                    style={{
                      background: isActive ? filter.color : undefined
                    }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
                    )}
                    <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} style={{ color: !isActive ? filter.color : undefined }}>
                      {filter.icon}
                    </span>
                    <span className="relative z-10">{filter.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-outfit text-xs font-black text-gray-400 uppercase tracking-widest">
              Çemberdeki Mekanlar
              {selectedRadius !== null && ` (${selectedRadius === 500 ? '500m' : selectedRadius === 1000 ? '1km' : '2km'})`}
            </h3>
            {filteredCafes.map(cafe => (
              <button
                key={cafe.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCafe(cafe, mapStateRef.current ?? undefined);
                }}
                className="w-full text-left bg-white rounded-[2rem] p-3 flex gap-4 border border-gray-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              >
                <img src={cafe.image} className="w-16 h-16 rounded-2xl object-cover shrink-0" alt={cafe.name} />
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h4 className="font-bold text-[#1B4332] text-sm">{cafe.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-bold text-gray-400">{cafe.distance}</span>
                    <span className="text-[10px] font-black text-[#BC4749]">{cafe.rating} ★ {cafe.reviews > 0 && `(${cafe.reviews})`}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div >
      </div >
    </div >
  );
};

export default MapScreen;
