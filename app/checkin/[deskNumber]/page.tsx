'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { 
  fetchFlightData, 
  getFlightForSpecificDesk, // PROMENJENO: getFlightsByCheckIn -> getFlightForSpecificDesk
  getCheckInClassType,
  hasBusinessClassCheckIn,
  debugCheckInClassType,
  EnhancedFlight // DODATO: import EnhancedFlight tipa
} from '@/lib/flight-service';
import { CheckCircle, Clock, MapPin, Users, AlertCircle, Info, Bug } from 'lucide-react';
import Image from 'next/image';
import { useAdImages } from '@/hooks/useAdImages';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';

// Konstante za konfiguraciju
const INTERVAL_ACTIVE = 30000; // 30 sekundi za aktivan check-in
const INTERVAL_INACTIVE = 60000; // 60 sekundi za neaktivan
const AD_SWITCH_INTERVAL = 15000; // 15 sekundi za reklame
const DEVELOPMENT = process.env.NODE_ENV === 'development';

// Placeholder za slike
const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

// ChristmasInactiveScreen komponenta
function ChristmasInactiveScreen({ 
  deskNumberParam, 
  nextFlight, 
  lastUpdate, 
  loading,
  isPortrait,
  displayFlight 
}: { 
  deskNumberParam: string;
  nextFlight: Flight | null;
  lastUpdate: string;
  loading: boolean;
  isPortrait: boolean;
  displayFlight: Flight | null;
}) {
  const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={wallpaperSrc}
          alt="Airport Wallpaper"
          fill
          className="object-cover"
          priority
          quality={90}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        {/* Novogodišnje snejne pahulje u pozadini */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/30 animate-snow"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                fontSize: `${Math.random() * 15 + 10}px`,
                top: '-30px'
              }}
            >
              ❄
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-gold/40 shadow-2xl relative overflow-hidden ${
          isPortrait ? 'max-w-4xl' : 'max-w-6xl'
        } mx-auto`}>
          
          {/* Novogodišnja verzija CheckCircle ikone */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-green-400 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <div className={`font-bold text-white/80 mb-4 flex items-center justify-center gap-4 ${
              isPortrait ? 'text-[6rem]' : 'text-[4rem]'
            }`}>
              <span className="text-3xl opacity-80">🎄</span>
              Check-in
              <span className="text-3xl opacity-80">✨</span>
            </div>
            <div className={`font-black bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent leading-none drop-shadow-2xl ${
              isPortrait ? 'text-[20rem]' : 'text-[15rem]'
            }`}>
              {deskNumberParam}
            </div>
          </div>
          
          <div className={`text-white/90 mb-6 font-semibold ${
            isPortrait ? 'text-4xl' : 'text-3xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">⏳</span>
              {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
              <span className="text-2xl">🎯</span>
            </div>
          </div>

          {/* Prikaz sledećeg leta sa novogodišnjim stilom */}
          {nextFlight && (
            <div className={`mb-6 font-medium bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 py-4 px-8 rounded-2xl border border-gold/50 shadow-lg ${
              isPortrait ? 'text-3xl' : 'text-2xl'
            }`}>
              <div className="text-white font-bold mb-1">
                {nextFlight.FlightNumber} → {nextFlight.DestinationCityName}
              </div>
              <div className="text-yellow-300 text-lg">
                🕒 {nextFlight.ScheduledDepartureTime}
              </div>
            </div>
          )}

          <div className={`text-white/80 mb-6 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">👀</span>
              <span>Please check the main display</span>
              <span className="text-xl">✨</span>
            </div>
          </div>

          {/* Updated at tekst */}
          <div className={`text-white/70 mb-4 ${
            isPortrait ? 'text-xl' : 'text-lg'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg">🕒</span>
              <span>Updated at: {lastUpdate || 'Never'}</span>
            </div>
          </div>

          {loading && (
            <div className={`text-white/60 mt-4 ${
              isPortrait ? 'text-lg' : 'text-base'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <span>🔄 Updating flight information...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes snow {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(calc(100vh + 30px)) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-snow {
          animation: snow linear infinite;
          animation-duration: 8s;
        }
      `}</style>
    </div>
  );
}

export default function CheckInPage() {
  const params = useParams();
  const deskNumberParam = params.deskNumber as string;
  
  const [flight, setFlight] = useState<EnhancedFlight | null>(null); // PROMENJENO: Flight -> EnhancedFlight
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isPortrait, setIsPortrait] = useState(false);
  const [nextFlight, setNextFlight] = useState<Flight | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const prevFlightRef = useRef<EnhancedFlight | null>(null); // PROMENJENO: Flight -> EnhancedFlight
  const isMountedRef = useRef(true);
  const orientationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { adImages, isLoading: adImagesLoading } = useAdImages();
  const currentTheme = useSeasonalTheme();

  // Helper funkcija za debug
  const updateDebugInfo = useCallback((flight: EnhancedFlight) => { // PROMENJENO: Flight -> EnhancedFlight
    if (DEVELOPMENT && flight) {
      const debugResult = debugCheckInClassType(flight, deskNumberParam);
      console.log('=== CHECK-IN CLASS DEBUG ===');
      console.log('Flight:', flight.FlightNumber);
      console.log('CheckInDesk:', flight.CheckInDesk);
      console.log('Enhanced info:', {
        allDesks: flight._allDesks,
        deskIndex: flight._deskIndex
      });
      console.log('Current Desk (from URL):', deskNumberParam);
      console.log('Class Type:', debugResult.classType);
      console.log('Debug Info:', debugResult.debugInfo);
      console.log('===========================');
      
      setDebugInfo(debugResult);
    }
  }, [deskNumberParam]);

  // Debounced orientation check
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    
    const debouncedCheck = () => {
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
      orientationTimeoutRef.current = setTimeout(checkOrientation, 200);
    };
    
    window.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
    };
  }, []);

  // Memoized status check
  const shouldShowCheckIn = useMemo(() => {
    if (!flight) return false;
    
    const status = flight.StatusEN?.toLowerCase();
    return status === 'processing' || 
           status === 'check-in' ||
           status === 'open' ||
           status === 'open for check-in';
  }, [flight]);

  // Optimized flight loading function
  const loadFlights = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (DEVELOPMENT) {
        console.log('🔄 Loading flights for desk:', deskNumberParam);
      }
      
      const data = await fetchFlightData();
      
      let specificFlight: EnhancedFlight | null = null; // PROMENJENO
      const deskNumberVariants = [
        deskNumberParam,
        deskNumberParam.replace(/^0+/, ''),
        deskNumberParam.padStart(2, '0'),
      ];

      // PROMENJENO: Koristimo getFlightForSpecificDesk umesto getFlightsByCheckIn
      for (const variant of deskNumberVariants) {
        specificFlight = getFlightForSpecificDesk(data.departures, variant);
        if (specificFlight) {
          break;
        }
      }

      const updateTime = new Date().toLocaleTimeString('en-GB');
      
      if (!specificFlight) {
        if (isMountedRef.current) {
          setFlight(null);
          setNextFlight(null);
          setLastUpdate(updateTime);
          setLoading(false);
        }
        return;
      }

      const activeFlight = specificFlight; // specificFlight je već EnhancedFlight

      const previousFlight = prevFlightRef.current;
      const wasActive = previousFlight && 
        (previousFlight.StatusEN?.toLowerCase() === 'processing' || 
         previousFlight.StatusEN?.toLowerCase() === 'check-in' ||
         previousFlight.StatusEN?.toLowerCase() === 'open' ||
         previousFlight.StatusEN?.toLowerCase() === 'open for check-in');
      
      const isNowInactive = !activeFlight && wasActive;

      if (isNowInactive) {
        if (isMountedRef.current) {
          setFlight(null);
          setNextFlight(null);
          setCurrentAdIndex(0);
          setLastUpdate(updateTime);
          setLoading(false);
        }
        prevFlightRef.current = null;
        return;
      }

      // Simple next flight calculation - za slučaj da nemamo aktivni let
      // Ova logika će se koristiti samo za nextFlight (ne za glavni prikaz)
      const allFlightsForDesk = data.departures.filter(f => 
        f.CheckInDesk && f.CheckInDesk.includes(deskNumberParam)
      );
      
      const nextAvailableFlight = allFlightsForDesk
        .filter(f => {
          const status = f.StatusEN?.toLowerCase() || 'scheduled';
          return status === 'scheduled' || status === 'expected' || status === 'ontime' || status === 'delayed';
        })
        .sort((a, b) => {
          try {
            const timeA = new Date(`${new Date().toDateString()} ${a.ScheduledDepartureTime}`);
            const timeB = new Date(`${new Date().toDateString()} ${b.ScheduledDepartureTime}`);
            return timeA.getTime() - timeB.getTime();
          } catch {
            return 0;
          }
        })[0] || null;

      if (isMountedRef.current) {
        setFlight(activeFlight);
        setNextFlight(nextAvailableFlight);
        setLastUpdate(updateTime);
        setLoading(false);
        prevFlightRef.current = activeFlight;
        
        // Update debug info kada se promeni flight
        updateDebugInfo(activeFlight);
      }

    } catch (error) {
      if (DEVELOPMENT) {
        console.error('❌ Error:', error);
      }
      if (isMountedRef.current) {
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
        setLoading(false);
      }
    }
  }, [deskNumberParam, updateDebugInfo]);

  // Effect za debug kada se promeni flight
  useEffect(() => {
    if (flight && DEVELOPMENT) {
      updateDebugInfo(flight);
    }
  }, [flight, updateDebugInfo]);

  // Main data loading effect
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadInitialData = async () => {
      await loadFlights();
    };
    
    loadInitialData();
    
    const interval = setInterval(loadFlights, INTERVAL_INACTIVE);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadFlights]);

  // Active check-in interval
  useEffect(() => {
    if (!shouldShowCheckIn) return;
    
    const activeInterval = setInterval(loadFlights, INTERVAL_ACTIVE);
    return () => clearInterval(activeInterval);
  }, [shouldShowCheckIn, loadFlights]);

  // Ad interval
  useEffect(() => {
    if (adImages.length === 0) return;
    
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
    }, AD_SWITCH_INTERVAL);
    
    return () => clearInterval(adInterval);
  }, [adImages.length]);

  // Keyboard shortcut za debug (Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading only if we have NO data at all
  if (loading && !flight && !nextFlight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-2xl text-slate-300">Loading check-in information...</div>
        </div>
      </div>
    );
  }

  // Christmas theme inactive screen
  if (!shouldShowCheckIn && currentTheme === 'christmas') {
    return (
      <ChristmasInactiveScreen
        deskNumberParam={deskNumberParam}
        nextFlight={nextFlight}
        lastUpdate={lastUpdate}
        loading={loading}
        isPortrait={isPortrait}
        displayFlight={flight}
      />
    );
  }

  // Regular inactive screen
  if (!shouldShowCheckIn) {
    const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
    
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 z-0">
          <Image
            src={wallpaperSrc}
            alt="Airport Wallpaper"
            fill
            className="object-cover"
            priority
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white">
          <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl ${
            isPortrait ? 'max-w-4xl' : 'max-w-6xl'
          } mx-auto`}>
            <CheckCircle className="w-32 h-32 text-white/60 mx-auto mb-8" />
            
            <div className="text-center mb-8">
              <div className={`font-bold text-white/80 mb-4 ${
                isPortrait ? 'text-[6rem]' : 'text-[4rem]'
              }`}>
                Check-in
              </div>
              <div className={`font-black text-orange-400 leading-none drop-shadow-2xl ${
                isPortrait ? 'text-[20rem]' : 'text-[15rem]'
              }`}>
                {deskNumberParam}
              </div>
            </div>
            
            <div className={`text-white/90 mb-6 font-semibold ${
              isPortrait ? 'text-4xl' : 'text-3xl'
            }`}>
              {flight ? 'Check-in not available' : 'No flights currently checking in here'}
            </div>

            {nextFlight && (
              <div className={`text-orange-300 mb-6 font-medium bg-black/30 py-3 px-6 rounded-2xl ${
                isPortrait ? 'text-3xl' : 'text-2xl'
              }`}>
                Next flight: {nextFlight.FlightNumber} to {nextFlight.DestinationCityName} at {nextFlight.ScheduledDepartureTime}
              </div>
            )}

            <div className={`text-white/80 mb-6 ${
              isPortrait ? 'text-2xl' : 'text-xl'
            }`}>
              {flight ? `Status: ${flight.StatusEN}` : 'Please check the main display'}
            </div>

            <div className={`text-white/70 mb-4 ${
              isPortrait ? 'text-xl' : 'text-lg'
            }`}>
              Updated at: {lastUpdate || 'Never'}
            </div>

            {loading && (
              <div className={`text-white/60 mt-4 ${
                isPortrait ? 'text-lg' : 'text-base'
              }`}>
                Updating...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // At this point, shouldShowCheckIn je true
  const safeDisplayFlight = flight!;
  const classType = getCheckInClassType(safeDisplayFlight, deskNumberParam);

  // Debug Panel komponenta
  const DebugPanel = () => (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-md border border-yellow-500/50">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold flex items-center gap-2">
          <Bug className="w-4 h-4" />
          Debug Panel (Alt+D to toggle)
        </div>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-xs bg-red-500/50 hover:bg-red-500 px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>
      
      {debugInfo && (
        <>
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Class Type Result:</div>
            <div className="font-mono">{classType || 'null'}</div>
          </div>
          
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Flight Info:</div>
            <div>Flight: {safeDisplayFlight.FlightNumber}</div>
            <div>Check-in: {safeDisplayFlight.CheckInDesk}</div>
            <div>All Desks: {safeDisplayFlight._allDesks?.join(', ') || 'N/A'}</div>
            <div>Desk Index: {safeDisplayFlight._deskIndex ?? 'N/A'}</div>
            <div>Desk from URL: {deskNumberParam}</div>
          </div>
          
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Debug Details:</div>
            <div>Airline Code: {debugInfo.debugInfo?.airlineCode}</div>
            <div>Has Business: {debugInfo.debugInfo?.hasBusinessClass ? 'Yes' : 'No'}</div>
            <div>Desk Count: {debugInfo.debugInfo?.deskCount}</div>
            <div>Enhanced Info: {debugInfo.debugInfo?.hasEnhancedInfo ? 'Yes' : 'No'}</div>
            <div>Enhanced Index: {debugInfo.debugInfo?.enhancedIndex ?? 'N/A'}</div>
          </div>
        </>
      )}
      
      {!debugInfo && (
        <div className="text-slate-400">No debug info available</div>
      )}
    </div>
  );

  // Portrait mod za aktivan check-in
  if (isPortrait) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex flex-col">
        
        {/* Debug toggle button */}
        {DEVELOPMENT && !showDebug && (
          <button
            onClick={() => setShowDebug(true)}
            className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
            title="Show Debug (Alt+D)"
          >
            <Bug className="w-5 h-5" />
          </button>
        )}
        
        {/* Debug Panel */}
        {DEVELOPMENT && showDebug && <DebugPanel />}
        
        {/* Header */}
        <div className="flex-shrink-0 p-2 bg-white/5 backdrop-blur-lg border-b border-white/10 mt-[0.5cm]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-[4rem] font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Updated</div>
              <div className="text-sm font-mono text-slate-300">{lastUpdate}</div>
              {loading && (
                <div className="text-xs text-slate-500 mt-0.5">Updating...</div>
              )}
            </div>
          </div>
        </div>

        {/* Glavni sadržaj */}
        <div className="flex-1 flex flex-col px-2 py-2 min-h-0">
          
          {/* Flight Info Card */}
          <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            
            {/* Airline Logo */}
            <div className="flex flex-col items-center mb-8">
              {safeDisplayFlight.AirlineLogoURL && (
                <div className="relative w-[80vw] h-48 bg-white rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-lg mb-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={safeDisplayFlight.AirlineLogoURL}
                      alt={safeDisplayFlight.AirlineName || 'Airline Logo'}
                      fill
                      className="object-contain"
                      priority
                      quality={85}
                      sizes="80vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  </div>
                </div>
              )}
              
              {/* CLASS BADGE - BUSINESS/ECONOMY KLASA */}
              {classType && (
                <div className="w-full mb-6">
                  <div className={`rounded-2xl px-8 py-4 text-center shadow-lg ${
                    classType === 'business' 
                      ? 'bg-red-600 border-2 border-red-400' 
                      : 'bg-blue-600 border-2 border-blue-400'
                  }`}>
                    <h1 className="text-6xl font-black text-white tracking-wider">
                      {classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
                    </h1>
                  </div>
                </div>
              )}
              
              {/* Flight Number */}
              <div className="text-center w-full">
                <div className="text-[12rem] font-black text-yellow-500 leading-tight">
                  {safeDisplayFlight.FlightNumber}
                </div>
              </div>
            </div>

            {/* Code Share */}
            {safeDisplayFlight.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-blue-300">
                  Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            {/* Destination sa slikom grada */}
            <div className="flex items-end gap-6 mb-4">
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0 mb-4">
                <Image
                  src={`/city-images/${safeDisplayFlight.DestinationAirportCode?.toLowerCase()}.jpg`}
                  alt={safeDisplayFlight.DestinationCityName}
                  fill
                  className="object-cover"
                  priority
                  quality={90}
                  sizes="256px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <div className="flex-1 text-right">
                <div className="text-[9rem] font-bold text-white mb-1 leading-tight">
                  {safeDisplayFlight.DestinationCityName}
                </div>
                <div className="text-8xl font-bold text-cyan-400 flex items-center justify-end gap-3 mb-2">
                  <span className="text-xl bg-orange-500 text-white px-4 py-2 rounded-full font-semibold">
                    Airport IATA code:
                  </span>
                  {safeDisplayFlight.DestinationAirportCode}
                </div>
              </div>
              
              <MapPin className="w-12 h-12 text-cyan-400 flex-shrink-0 mb-4" />
            </div>

            {/* Warning text */}
            <div className="flex items-center justify-center gap-2 mt-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-6 py-3 backdrop-blur-sm mx-auto w-fit">
              <AlertCircle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
              <div className="text-xl font-bold text-yellow-300 text-center">
                Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
              </div>
            </div>
          </div>

          {/* Times Card */}
          <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Scheduled Time */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div className="text-sm text-slate-400">Scheduled</div>
                </div>
                <div className="text-9xl font-mono font-bold text-white">
                  {safeDisplayFlight.ScheduledDepartureTime}
                </div>
              </div>

              {/* Estimated Time */}
              {safeDisplayFlight.EstimatedDepartureTime && 
               safeDisplayFlight.EstimatedDepartureTime !== safeDisplayFlight.ScheduledDepartureTime && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="text-sm text-yellow-400">Expected</div>
                  </div>
                  <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse">
                    {safeDisplayFlight.EstimatedDepartureTime}
                  </div>
                </div>
              )}

              {/* Gate Info */}
              {safeDisplayFlight.GateNumber && (
                <div className="col-span-2 text-center mt-2">
                  <div className="text-3xl text-slate-400 mb-0">
                    Gate Information
                  </div>
                  <div className="text-5xl font-bold text-white">
                    Gate {safeDisplayFlight.GateNumber}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-2xl text-slate-300 mt-0">
                    <Info className="w-6 h-6 text-yellow-400" />
                    <span>After check-in please proceed to gate {safeDisplayFlight.GateNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ad Image */}
          {adImages.length > 0 && (
            <div className="flex-1 min-h-[500px] bg-slate-800 rounded-2xl overflow-hidden flex items-stretch">
              <div className="relative w-full">
                <Image
                  src={adImages[currentAdIndex]}
                  alt="Advertisement"
                  fill
                  className="object-fill"
                  priority
                  quality={80}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-center items-center space-x-2 text-sm font-inter py-2">
            <Image
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACz0lEQVR4nO2YPWhUQRDHYzSRREHUiILRxspCBIUYC20sxMJSEtTC1lYJfqWwUGOTIGiIYieIiBiEoI1WgoWFoBIRRBD8ACV+gaA5Nf5k4hiGx91l571971K8Hxy8e7s7O/+73Z3ZaWoqKSnJDDAf2AocB24Cz4DPwE/9yPO4tkmfbqB5Lji+BjgLvMXPH2AA6GwE4xuAS0CF7FSAEaCjKOf3Ap+Iz0egN0/HW4DL5M9FmSu28+3AHYrjtswZ85cv0vn/3AVaYwgoYtnUYiSr8/toPD1pnV8PrDNae/6deP4jVs/5usJwmggbI0hV4xjwSFOKUCZdEVvTg7yYPolmAhc5xA57EzNvbHAHagL7ZOibm8vA6KAHUrNLLTOQEruchgOhKESBZm9MkxncA7wP7evkaImDUa7WKjd0hffFzI0TAeFYBaudKDgKehghxp8o17CzRjRdTwESIAPf5nxi/yjzvAv5EFDBZhICxeslgRgHfc19C+uqA+S5R96Xpvj+DgHe5b2J99VXSEfNuh1lKX4C1eW7i0QgChHvAPPP+gmm7rxHfy9UiApnlYOJa+sK0HXa7D30hArojCvgGrDTt24Apk2F62RwioLna+Z1SgPBAlotpHyQdr+ySnE2EVMxipsiHjG3JWp+nEHAqyHmdpNMZD2TfLAZO1Gj/Aaw39rcAvx32ZfzKYAE6iZT7YvIQWGDsn3GMPe9yXidYlsOlvt/ybwWeBIyR1HypW4BO0htZgCzLjcb+Ji2/72NPKufNJFKrjMljW3EDTtbpO5TJeVNalFplTE4n7D+q0mfM7pmsItoji/hl77fAhkRguxWlLpoQ0RL5ZJJY0GbsS71InC6w8ZrwZ59uR8auJHf7cnO8St10OGU+Y/kCtHvdqkz/Zs8AAAAASUVORK5CYII="
              alt="nextjs"
              width={25}
              height={25}
              unoptimized
              className="inline-block"
            />
            <a
              href="mailto:alen.vocanec@apm.co.me"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent hover:underline"
            >
              code by Tivat Airport, 2025
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Landscape mod za aktivan check-in
  return (
    <div className="w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden">
      
      {/* Debug toggle button */}
      {DEVELOPMENT && !showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
          title="Show Debug (Alt+D)"
        >
          <Bug className="w-5 h-5" />
        </button>
      )}
      
      {/* Debug Panel */}
      {DEVELOPMENT && showDebug && <DebugPanel />}
      
      <div className="h-full grid grid-cols-12 gap-8 p-3 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        
        <div className="col-span-7 flex flex-col justify-between">
          
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <div>
                <h1 className="text-8xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-8 mb-10">
              {safeDisplayFlight.AirlineLogoURL && (
                <div className="relative w-64 h-40 bg-white rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-lg">
                  <Image
                    src={safeDisplayFlight.AirlineLogoURL}
                    alt={safeDisplayFlight.AirlineName || 'Airline Logo'}
                    width={300}
                    height={180}
                    className="object-contain"
                    priority
                    quality={85}
                  />
                </div>
              )}
              
              {/* CLASS BADGE - LANDSCAPE VERSION */}
              {classType && (
                <div className="mb-6">
                  <div className={`rounded-xl px-6 py-3 text-center shadow-lg ${
                    classType === 'business' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400'
                  }`}>
                    <h1 className="text-5xl font-black text-white tracking-wider">
                      {classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
                    </h1>
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <div className="text-[12rem] font-black text-yellow-500 mb-2">
                  {safeDisplayFlight.FlightNumber}
                </div>
                <div className="text-lg text-slate-400">{safeDisplayFlight.AirlineName}</div>
              </div>
            </div>

            {safeDisplayFlight.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-4 bg-blue-500/20 px-6 py-3 rounded-3xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="text-2xl text-blue-300">
                  Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            <div className="flex items-center gap-8">
              <div className="relative w-80 h-80 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0">
                <Image
                  src={`/city-images/${safeDisplayFlight.DestinationAirportCode?.toLowerCase()}.jpg`}
                  alt={safeDisplayFlight.DestinationCityName}
                  fill
                  className="object-cover"
                  priority
                  quality={90}
                  sizes="320px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <div className="flex-1">
                <div className="text-8xl font-bold text-white mb-2">
                  {safeDisplayFlight.DestinationCityName}
                </div>
                <div className="text-8xl font-bold text-cyan-400">
                  {safeDisplayFlight.DestinationAirportCode}
                </div>
                
                {/* Warning text za landscape */}
                <div className="flex items-center gap-2 mt-4 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div className="text-lg font-semibold text-yellow-300">
                    Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
                  </div>
                </div>
              </div>
              
              <MapPin className="w-12 h-12 text-cyan-400" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xl text-slate-400">Last Updated</div>
            <div className="text-2xl font-mono text-slate-300">{lastUpdate}</div>
            {loading && (
              <div className="text-sm text-slate-500 mt-1">Updating data...</div>
            )}
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-between border-l-2 border-white/10 pl-8">
          
          <div className="space-y-8">
            <div className="text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
                <div className="text-2xl text-slate-400">Scheduled Departure</div>
              </div>
              <div className="text-7xl font-mono font-bold text-white leading-tight">
                {safeDisplayFlight.ScheduledDepartureTime}
              </div>
            </div>

            {safeDisplayFlight.EstimatedDepartureTime && 
             safeDisplayFlight.EstimatedDepartureTime !== safeDisplayFlight.ScheduledDepartureTime && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-4 mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-400" />
                  <div className="text-2xl text-yellow-400">Expected Departure</div>
                </div>
                <div className="text-6xl font-mono font-bold text-yellow-400 animate-pulse leading-tight">
                  {safeDisplayFlight.EstimatedDepartureTime}
                </div>
              </div>
            )}
          </div>

          <div className="text-right space-y-6">
            <div>
              <div className="text-6xl font-bold text-green-400 leading-tight animate-pulse">
                CHECK-IN OPEN
              </div>
              <div className="text-4xl text-green-400 mt-2">
                Please proceed to check-in
              </div>
            </div>

            {safeDisplayFlight.GateNumber && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                <div className="text-2xl text-slate-400 mb-3">Gate Information</div>
                <div className="text-4xl font-bold text-white">
                  Gate {safeDisplayFlight.GateNumber}
                </div>
                <div className="flex items-center justify-end gap-2 text-xl text-slate-300 mt-2">
                  <Info className="w-6 h-6 text-yellow-400" />
                  <span>After check-in please proceed to gate {safeDisplayFlight.GateNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}