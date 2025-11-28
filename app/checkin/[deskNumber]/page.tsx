'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getFlightsByCheckIn, getProcessingFlights } from '@/lib/flight-service';
import { CheckCircle, Clock, MapPin, Users, AlertCircle, Plane, Info } from 'lucide-react';
import Image from 'next/image';
import { useAdImages } from '@/hooks/useAdImages';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';

// ChristmasInactiveScreen komponenta (OSTAJE ISTA)
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
      {/* Wallpaper u pozadini sa novogodišnjim elementima */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={wallpaperSrc}
          alt="Airport Wallpaper"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        
        {/* Novogodišnje snejne pahulje u pozadini */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(25)].map((_, i) => (
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
        
        {/* Novogodišnji lampioni u ćoškovima */}
        <div className="absolute top-6 left-6 w-3 h-6 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-400/40"></div>
        <div className="absolute top-6 right-6 w-3 h-6 bg-red-300 rounded-full animate-pulse shadow-lg shadow-red-400/40 delay-500"></div>
        <div className="absolute bottom-6 left-6 w-3 h-6 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-400/40 delay-1000"></div>
        <div className="absolute bottom-6 right-6 w-3 h-6 bg-blue-300 rounded-full animate-pulse shadow-lg shadow-blue-400/40 delay-1500"></div>
      </div>
      
      {/* Sadržaj preko wallpaper-a sa novogodišnjim ukrasima */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-gold/40 shadow-2xl relative overflow-hidden ${
          isPortrait ? 'max-w-4xl' : 'max-w-6xl'
        } mx-auto`}>
          
          {/* Novogodišnji ukrasi na uglovima kartice */}
          <div className="absolute -top-3 -left-3 text-2xl opacity-70 animate-bounce">🎄</div>
          <div className="absolute -top-3 -right-3 text-2xl opacity-70 animate-bounce delay-300">🌟</div>
          <div className="absolute -bottom-3 -left-3 text-2xl opacity-70 animate-bounce delay-700">🕯️</div>
          <div className="absolute -bottom-3 -right-3 text-2xl opacity-70 animate-bounce delay-1000">❄️</div>
          
          {/* Novogodišnja verzija CheckCircle ikone */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-green-400 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 text-xl animate-bounce">🎅</div>
            <div className="absolute -bottom-2 -left-2 text-xl animate-bounce delay-500">🎁</div>
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
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl animate-pulse">🎁</span>
                <span className="text-orange-300 font-bold">Next Flight</span>
                <span className="text-2xl animate-pulse delay-300">✈️</span>
              </div>
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
            {displayFlight ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">📊</span>
                <span>Status:</span>
                <span className="text-yellow-300 font-semibold">{displayFlight.StatusEN}</span>
                <span className="text-xl">🎄</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">👀</span>
                <span>Please check the main display</span>
                <span className="text-xl animate-pulse">✨</span>
              </div>
            )}
          </div>

          {/* Updated at tekst sa novogodišnjim akcentom */}
          <div className={`text-white/70 mb-4 ${
            isPortrait ? 'text-xl' : 'text-lg'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg">🕒</span>
              <span>Updated at:</span>
              <span className="text-cyan-300 font-mono">{lastUpdate || 'Never'}</span>
              <span className="text-lg">⏰</span>
            </div>
          </div>

          {/* Specijalna novogodišnja poruka */}
          <div className={`text-yellow-300 mb-6 font-semibold bg-gradient-to-r from-red-500/10 to-green-500/10 py-3 px-6 rounded-xl border border-yellow-400/30 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="animate-bounce">🎅</span>
              <span>Season&apos;s Greetings!</span>
              <span className="animate-bounce delay-500">🎄</span>
            </div>
          </div>

          {/* Show subtle loading indicator sa novogodišnjim twistom */}
          {loading && (
            <div className={`text-white/60 mt-4 ${
              isPortrait ? 'text-lg' : 'text-base'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <span>🔄 Updating flight information...</span>
                <span className="animate-spin text-xl">❄️</span>
              </div>
            </div>
          )}

          {/* Dodatni novogodišnji elementi unutar kartice */}
          <div className="absolute top-4 left-4 text-sm text-yellow-300/60 rotate-12">Happy Holidays</div>
          <div className="absolute top-4 right-4 text-sm text-green-300/60 -rotate-12">2026</div>
        </div>
      </div>

      {/* Dodatni novogodišnji elementi izvan kartice */}
      <div className="absolute bottom-10 left-10 text-4xl opacity-20 animate-pulse">🎁</div>
      <div className="absolute top-10 right-10 text-4xl opacity-20 animate-pulse delay-1000">🔔</div>
      <div className="absolute top-1/4 left-10 text-3xl opacity-15 animate-bounce delay-500">⭐</div>
      <div className="absolute bottom-1/4 right-10 text-3xl opacity-15 animate-bounce delay-700">🌟</div>
    </div>
  );
}

export default function CheckInPage() {
  const params = useParams();
  const deskNumberParam = params.deskNumber as string;
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isPortrait, setIsPortrait] = useState(false);
  const [nextFlight, setNextFlight] = useState<Flight | null>(null);
  
  const { adImages, isLoading: adImagesLoading } = useAdImages();
  const currentTheme = useSeasonalTheme();

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    const loadFlights = async () => {
      try {
        console.log('🔄 Loading flights for desk:', deskNumberParam, new Date().toLocaleTimeString());
        const data = await fetchFlightData();
        
        // KLJUČNA ISPRAVKA: Koristimo getFlightsByCheckIn direktno umesto dodatnog filtera
        let deskFlights: Flight[] = [];
        
        // Pokušaj prvo sa exact match varijantama
        const deskNumberVariants = [
          deskNumberParam, // original (npr. "01")
          deskNumberParam.replace(/^0+/, ''), // bez leading zeros (npr. "1")
          deskNumberParam.padStart(2, '0'), // sa leading zeros (npr. "01")
        ];

        // Probaj svaku varijantu dok ne nađeš letove
        for (const variant of deskNumberVariants) {
          const flightsForVariant = getFlightsByCheckIn(data.departures, variant);
          if (flightsForVariant.length > 0) {
            deskFlights = flightsForVariant;
            console.log('✅ Found flights for variant:', variant, 'Flights:', deskFlights.map(f => f.FlightNumber));
            break;
          }
        }

        console.log('📊 Final flights found:', deskFlights.map(f => `${f.FlightNumber} (${f.StatusEN}) - Desk: ${f.CheckInDesk}`));

        setLastUpdate(new Date().toLocaleTimeString('en-GB'));

        if (deskFlights.length === 0) {
          console.log('❌ No matching flights found');
          setFlight(null);
          setNextFlight(null);
          setLoading(false);
          return;
        }

        // PRONAĐI AKTIVAN LET
        const activeFlight = deskFlights.find(flight => {
          const status = flight.StatusEN?.toLowerCase();
          const isActive = status === 'processing' || 
                         status === 'check-in' || 
                         status === 'open' ||
                         status === 'open for check-in';
          console.log(`🔍 Checking ${flight.FlightNumber}: ${status} -> ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
          return isActive;
        });

        // Status change check
        const previousFlight = flight;
        const wasActive = previousFlight && 
          (previousFlight.StatusEN?.toLowerCase() === 'processing' || 
           previousFlight.StatusEN?.toLowerCase() === 'check-in' ||
           previousFlight.StatusEN?.toLowerCase() === 'open' ||
           previousFlight.StatusEN?.toLowerCase() === 'open for check-in');
        
        const isNowInactive = !activeFlight && wasActive;

        console.log('🔄 Status change check:', {
          previous: previousFlight?.FlightNumber,
          previousStatus: previousFlight?.StatusEN,
          current: activeFlight?.FlightNumber, 
          currentStatus: activeFlight?.StatusEN,
          wasActive,
          isNowInactive
        });

        // Reset stanja ako je prešao iz aktivnog u neaktivan
        if (isNowInactive) {
          setFlight(null);
          setNextFlight(null);
          setCurrentAdIndex(0);
          setLastUpdate(new Date().toLocaleTimeString('en-GB'));
          return;
        }

        // PRONAĐI SLEDEĆI LET
        const nextAvailableFlight = deskFlights
          .filter(flight => {
            const status = flight.StatusEN?.toLowerCase() || 'scheduled';
            const validNextFlightStatuses = [
              'scheduled', 'expected', 'ontime', 'delayed', 
              '', undefined, null
            ];
            return validNextFlightStatuses.includes(status);
          })
          .sort((a, b) => {
            try {
              const timeA = new Date(`${new Date().toDateString()} ${a.ScheduledDepartureTime}`);
              const timeB = new Date(`${new Date().toDateString()} ${b.ScheduledDepartureTime}`);
              return timeA.getTime() - timeB.getTime();
            } catch (error) {
              return 0;
            }
          })[0] || null;

        console.log('🎯 Active flight:', activeFlight?.FlightNumber);
        console.log('➡️ Next flight:', nextAvailableFlight?.FlightNumber);

        setFlight(activeFlight || null);
        setNextFlight(nextAvailableFlight);

      } catch (error) {
        console.error('❌ Error:', error);
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
    const interval = setInterval(loadFlights, 40000);
    return () => clearInterval(interval);
  }, [deskNumberParam, flight]);

  useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
    }, 15000);
    return () => clearInterval(adInterval);
  }, [adImages.length]);

  const displayFlight = flight;
  const shouldShowCheckIn = displayFlight && 
    (displayFlight.StatusEN?.toLowerCase() === 'processing' || 
     displayFlight.StatusEN?.toLowerCase() === 'check-in' ||
     displayFlight.StatusEN?.toLowerCase() === 'open' ||
     displayFlight.StatusEN?.toLowerCase() === 'open for check-in');

  console.log('🎯 Current state:', {
    deskNumber: deskNumberParam,
    displayFlight: displayFlight?.FlightNumber,
    status: displayFlight?.StatusEN,
    shouldShowCheckIn,
    loading,
    currentTheme
  });

  // Show loading only if we have NO data at all
  if (loading && !displayFlight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-2xl text-slate-300">Loading check-in information...</div>
        </div>
      </div>
    );
  }

  // KLJUČNA ISPRAVKA: Koristite shouldShowCheckIn za oba moda
  if (!shouldShowCheckIn) {
    const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
    
    console.log('🔄 Rendering INACTIVE screen for desk:', deskNumberParam, 'Theme:', currentTheme);
    
    // PROVERA ZA NOVOGODIŠNU TEMU
    if (currentTheme === 'christmas') {
      return (
        <ChristmasInactiveScreen
          deskNumberParam={deskNumberParam}
          nextFlight={nextFlight}
          lastUpdate={lastUpdate}
          loading={loading}
          isPortrait={isPortrait}
          displayFlight={displayFlight}
        />
      );
    }
    
    // Regularni inactive screen (OSTAJE ISTA)
    return (
      <div className="min-h-screen relative">
        {/* Wallpaper u pozadini */}
        <div className="absolute inset-0 z-0">
          <Image
            src={wallpaperSrc}
            alt="Airport Wallpaper"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        </div>
        
        {/* Sadržaj preko wallpaper-a */}
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
              {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
            </div>

            {/* Prikaz sledećeg leta */}
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
              {displayFlight ? `Status: ${displayFlight.StatusEN}` : 'Please check the main display'}
            </div>

            {/* Updated at tekst */}
            <div className={`text-white/70 mb-4 ${
              isPortrait ? 'text-xl' : 'text-lg'
            }`}>
              Updated at: {lastUpdate || 'Never'}
            </div>

            {/* Show subtle loading indicator if background refresh is happening */}
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

  // At this point, shouldShowCheckIn je true, što znači da displayFlight postoji i status je aktivan
  const safeDisplayFlight = displayFlight!;

  console.log('🎯 Rendering ACTIVE screen for flight:', safeDisplayFlight.FlightNumber, safeDisplayFlight.StatusEN);

  // OSTATAK KODA ZA AKTIVAN CHECK-IN OSTAJE POTPUNO ISTI...
  // Portrait mod za aktivan check-in
  if (isPortrait) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex flex-col">
        
        {/* Header sa mt-[1cm] - FIXED visina */}
        <div className="flex-shrink-0 p-3 bg-white/5 backdrop-blur-lg border-b border-white/10 mt-[1cm]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-[5rem] font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Updated</div>
              <div className="text-sm font-mono text-slate-300">{lastUpdate}</div>
              {loading && (
                <div className="text-xs text-slate-500 mt-1">Updating...</div>
              )}
            </div>
          </div>
        </div>

        {/* Glavni sadržaj */}
        <div className="flex-1 flex flex-col px-2 py-2 min-h-0">
          
          {/* Flight Info Card */}
          <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            
            {/* Airline Logo - 80% width */}
            <div className="flex flex-col items-center mb-8">
              {safeDisplayFlight.AirlineLogoURL && (
                <div className="relative w-[80vw] h-48 bg-white rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-lg mb-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={safeDisplayFlight.AirlineLogoURL}
                      alt={safeDisplayFlight.AirlineName || 'Airline Logo'}
                      fill
                      className="object-contain scale-100"
                      priority
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                      }}
                    />
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

            {/* Destination */}
            <div className="flex items-center gap-4 mb-6 justify-end">
              <div className="text-right">
                <div className="text-[9rem] font-bold text-white mb-1 leading-tight">
                  {safeDisplayFlight.DestinationCityName}
                </div>
                <div className="text-4xl font-bold text-cyan-400">
                  {safeDisplayFlight.DestinationAirportCode}
                </div>
              </div>
              <MapPin className="w-8 h-8 text-cyan-400" />
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
          <div className="flex-1 min-h-[500px] bg-slate-800 rounded-2xl overflow-hidden flex items-stretch">
            <div className="relative w-full">
              <Image
                src={adImages[currentAdIndex]}
                alt="Advertisement"
                fill
                className="object-fill w-full h-full"
                priority
                sizes="100vw"
                onError={(e) => {
                  console.error('Failed to load ad image:', adImages[currentAdIndex]);
                  setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-center items-center space-x-2 text-sm font-inter py-2">
            <Image
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACz0lEQVR4nO2YPWhUQRDHYzSRREHUiILRxspCBIUYC20sxMJSEtTC1lYJfqWwUGOTIGiIYieIiBiEoI1WgoWFoBIRRBD8ACV+gaA5Nf5k4hiGx91l571971K8Hxy8e7s7O/+73Z3ZaWoqKSnJDDAf2AocB24Cz4DPwE/9yPO4tkmfbqB5Lji+BjgLvMXPG2AA6GyE4xuAS0CF7FSAEaCjKOf3Ap+Iz0egN0/HW4DL5M9FmSu28+3AHYrjtswZ85cv0vn/3AVaYwgoYtnUYiSr8/toPD1pnV8PrDNae/6deP4jVs/5ucJwmggbI0hV4xiwSFOKUCZdEVvTg7yYPlmAhc5xA57EzNvbHAHagL7ZOibm8vA6KAHUrNLLTOQEruchgOhKESBZm9MkxncA7wP7evkaImDUa7WKjd0hffFzI0TAeFYBaudKDgKehghxp8o17CzRjRdTwESIAPf5nxi/yjzvAv5EFDBZhICxeslgRgHfc19C+uqA+S5R96Xpvj+DgHe5b2J99VXSEfNuh1lKX4C1eW7i0QgChHvAPPP+gmm7rxHfy9UiApnlYOJa+sK0HXa7D30hArojCvgGrDNt24Apk2F62RwioLna+Z1SgPBAlotpHyQdr+ySnE2EVMxipsiHjG3JWp+nEHAqyHmdpNMZD2TfLAZO1Gj/Aaw39rcAvx32ZfzKYAE6iZT7YvIQWGDsn3GMPe9yXidYlsOlvt/YbwWeBIyR1HypW4BO0htZgCzLjcb+Ji2/72NPKufNJFKrjMljW3EDTtbpO5TJeVNalFplTE4n7D+q0mfM7pmsItoji/hl77fAhkRguxWlLpoQ0RL5ZJJY0GbsS71IOBe9vJ4Q0hPxdBoydiW525mb41XqpsMp8xnLFLC9EKdrCFmtaYcrdzK5Tb+9gjZSiCSAXVK3kdKHXDz0ZlfRf+mDBq1rWr2biQUlJSVNmfgLh4ZsWnm0WoMAAAAASUVORK5CYII="
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

  // Landscape mod za aktivan check-in (OSTAJE ISTA)
  return (
    <div className="w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden">
      
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
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
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

            <div className="flex items-center gap-6">
              <MapPin className="w-12 h-12 text-cyan-400" />
              <div>
                <div className="text-8xl font-bold text-white mb-2">
                  {safeDisplayFlight.DestinationCityName}
                </div>
                <div className="text-8xl font-bold text-cyan-400">
                  {safeDisplayFlight.DestinationAirportCode}
                </div>
              </div>
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

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        /* Kompletan reset za scroll */
        html, body, #__next {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw;
          height: 100vh;
          overflow: hidden !important;
          background: #0f172a;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          position: fixed;
        }

        /* WebKit browsers - sakrivanje scrollbara */
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        #__next::-webkit-scrollbar,
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        }
        
        /* Dodatna zaštita za sve elemente */
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        *::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
}