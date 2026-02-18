
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Settings, QrCode, Star, Coffee, ChevronRight, Award, ShieldCheck, CreditCard, X, Zap, Camera, CheckCircle2, Loader2, Sparkles, MapPin, Navigation2, Footprints, Map as MapIcon, ArrowRight } from 'lucide-react';
import { CAFES } from '../data';
import { Cafe } from '../types';
import { summarizeDailyJourney } from '../services/gemini';
import ProfileJourneyMap, { JourneyPin } from './ProfileJourneyMap';

interface ProfileScreenProps {
  onBack: () => void;
  cafes: Cafe[];
  userLocation: { lat: number; lng: number } | null;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <div className="relative">
    <Star className={`w-5 h-5 transition-all duration-500 ${filled ? 'text-[#BC4749] fill-[#BC4749]' : 'text-gray-200'}`} />
    {filled && (
      <div className="absolute inset-0 bg-[#BC4749]/20 blur-sm rounded-full animate-pulse" />
    )}
  </div>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, cafes, userLocation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [journeyPins, setJourneyPins] = useState<JourneyPin[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const joinedCafes = cafes.filter(c => c.isJoined);
  const joinedCafeCoords = joinedCafes
    .filter((c) => c.coordinates)
    .map((c) => ({ lat: c.coordinates!.lat, lng: c.coordinates!.lng }));

  useEffect(() => {
    const getAnalysis = async () => {
      setLoadingSummary(true);
      try {
        const result = await summarizeDailyJourney(joinedCafes);
        setAnalysis(result);
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        setLoadingSummary(false);
      }
    };
    if (joinedCafes.length > 0) getAnalysis();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Kamera donanımı bulunamadı.");
      setIsScanning(true);
      return;
    }

    setIsScanning(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setTimeout(() => handleScanSuccess(), 3000);
    } catch (err) {
      setCameraError("Erişim reddedildi.");
    }
  };

  const handleScanSuccess = () => {
    setScanSuccess(true);
    setTimeout(() => {
      setScanSuccess(false);
      stopCamera();
    }, 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF9F6] overflow-y-auto no-scrollbar pb-32">
      {/* Profile Header */}
      <div className="px-6 pt-12 pb-8 bg-white rounded-b-[4rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#1B4332] active:scale-90 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#1B4332]">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-[2rem] bg-[#1B4332] p-1 shadow-xl">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200" className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-[#FAF9F6]">
              <Award className="w-4 h-4 text-[#BC4749]" />
            </div>
          </div>
          <h1 className="font-outfit text-xl font-bold text-[#1B4332]">Ahmet Yılmaz</h1>
          <p className="text-[9px] font-black text-[#BC4749] uppercase tracking-[0.2em] mt-1">Seviye 12 • Kahve Gurmesi</p>
        </div>
      </div>

      {/* AI Daily Companion Section */}
      <div className="px-6 mt-8">
        <div className="bg-[#1B4332] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#BC4749]" />
            <h2 className="font-outfit text-xs font-black text-white/50 uppercase tracking-[0.2em]">Yoldaş Analizi</h2>
          </div>

          {loadingSummary ? (
            <div className="py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <p className="text-[10px] text-white/40 font-bold uppercase">Veriler işleniyor...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <p className="text-sm text-white font-medium leading-relaxed italic">
                "{analysis.summary}"
              </p>

              {/* Mini Stats Table */}
              <div className="grid grid-cols-3 gap-0.5 bg-white/10 rounded-2xl overflow-hidden border border-white/5">
                <div className="bg-white/5 p-3 flex flex-col items-center">
                  <span className="text-[8px] font-black text-white/40 uppercase mb-1">Mesafe</span>
                  <span className="text-xs font-bold text-white">{analysis.distanceKm} KM</span>
                </div>
                <div className="bg-white/5 p-3 flex flex-col items-center border-x border-white/5">
                  <span className="text-[8px] font-black text-white/40 uppercase mb-1">Durak</span>
                  <span className="text-xs font-bold text-white">{analysis.venueCount} Mekan</span>
                </div>
                <div className="bg-white/5 p-3 flex flex-col items-center">
                  <span className="text-[8px] font-black text-white/40 uppercase mb-1">Bölge</span>
                  <span className="text-[10px] font-bold text-white truncate w-full text-center">{analysis.neighborhoods}</span>
                </div>
              </div>

              {/* Routine Change Interaction */}
              {analysis.isRoutineChange && (
                <div className="bg-[#BC4749] rounded-2xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white/70 uppercase mb-1">Rutin Dışı Tespit!</p>
                    <p className="text-xs font-bold text-white">{analysis.interactivePrompt}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              )}

            </div>
          ) : (
            <p className="text-[10px] text-white/30 text-center py-4">Henüz günlük yolculuk verisi yok.</p>
          )}

          {/* Harita - her zaman göster */}
          <div className="mt-4">
            <ProfileJourneyMap
              userLocation={userLocation}
              pins={journeyPins}
              onPinsChange={setJourneyPins}
              joinedCafeCoords={joinedCafeCoords}
            />
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="px-6 mt-8 space-y-5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1B4332]" />
            <h2 className="font-outfit text-lg font-bold text-[#1B4332]">Cüzdanım</h2>
          </div>
          <button onClick={startCamera} className="w-10 h-10 bg-[#1B4332] rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {joinedCafes.map((cafe) => (
            <div key={cafe.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex gap-4">
              <img src={cafe.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-outfit font-bold text-[#1B4332]">{cafe.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#BC4749] fill-[#BC4749]" />
                    <span className="text-[10px] font-black text-[#1B4332]">{cafe.stamps}/{cafe.maxStamps}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#BC4749] transition-all duration-1000"
                    style={{ width: `${(cafe.stamps / cafe.maxStamps) * 100}%` }}
                  />
                </div>
                <p className="text-[8px] font-black text-gray-400 uppercase mt-2">{cafe.points} Toplam Puan</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
          <div className="relative w-full aspect-square max-w-xs mb-8 rounded-[2rem] overflow-hidden border-2 border-white/20">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-[#BC4749] rounded-[2rem] animate-pulse m-8" />
          </div>
          <button onClick={stopCamera} className="bg-white/10 p-5 rounded-full text-white backdrop-blur-xl active:scale-90 transition-all">
            <X className="w-6 h-6" />
          </button>
          {scanSuccess && (
            <div className="absolute inset-0 bg-[#1B4332] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-20 h-20 text-white mb-4" />
              <p className="font-outfit text-xl font-bold text-white uppercase tracking-widest">Puan İşlendi!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
