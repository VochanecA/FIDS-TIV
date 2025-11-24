'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getFlightsByCheckIn, getProcessingFlights } from '@/lib/flight-service';
import { CheckCircle, Clock, MapPin, Users, AlertCircle, Plane, Info } from 'lucide-react';
import Image from 'next/image';
import { useAdImages } from '@/hooks/useAdImages';

export default function CheckInPage() {
  const params = useParams();
  const deskNumberParam = params.deskNumber as string;
  
  const deskNumberNormalized = deskNumberParam.replace(/^0+/, '');
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<Flight | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isPortrait, setIsPortrait] = useState(false);
  const [nextFlight, setNextFlight] = useState<Flight | null>(null);
  
  const { adImages, isLoading: adImagesLoading } = useAdImages();

  // Simple ref to prevent unnecessary re-renders
  const previousFlightRef = useRef<Flight | null>(null);

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
        const data = await fetchFlightData();
        
        let deskFlights: Flight[] = [];
        const deskNumberVariants = [
          deskNumberParam,
          deskNumberNormalized,
          deskNumberNormalized.padStart(2, '0'),
        ];

        const uniqueVariants = Array.from(new Set(deskNumberVariants));

        for (const variant of uniqueVariants) {
          const flightsForVariant = getFlightsByCheckIn(data.departures, variant);
          if (flightsForVariant.length > 0) {
            deskFlights = flightsForVariant;
            break;
          }
        }

        // **ISPRAVKA: Postavi lastUpdate ČAK I KADA NEMA LETOVA**
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));

        if (deskFlights.length === 0) {
          setNextFlight(null);
          setLoading(false);
          return;
        }

        const processingFlights = getProcessingFlights(deskFlights);
        
        const validProcessingFlights = processingFlights.filter(
          flight => flight.StatusEN?.toLowerCase() === 'processing'
        );
        
        // Pronađi sledeći let (prvi let koji nije "processing")
        const nextAvailableFlight = deskFlights.find(
          flight => flight.StatusEN?.toLowerCase() !== 'processing'
        );
        setNextFlight(nextAvailableFlight || null);

        if (validProcessingFlights.length > 0) {
          const newFlight = validProcessingFlights[0];
          
          // Prevent unnecessary state updates if data hasn't changed
          if (JSON.stringify(newFlight) !== JSON.stringify(previousFlightRef.current)) {
            setFlight(newFlight);
            setCurrentData(newFlight);
            previousFlightRef.current = newFlight;
          }
        } else {
          setFlight(null);
          setCurrentData(null);
        }
      } catch (error) {
        console.error('❌ Error loading flight data:', error);
        // **ISPRAVKA: Postavi lastUpdate ČAK I KADA IMAMO ERROR**
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
    const interval = setInterval(loadFlights, 60000);
    return () => clearInterval(interval);
  }, [deskNumberParam, deskNumberNormalized]);

  useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
    }, 15000);
    return () => clearInterval(adInterval);
  }, [adImages.length]);

  const displayFlight = currentData || flight;
  const shouldShowCheckIn = displayFlight && displayFlight.StatusEN?.toLowerCase() === 'processing';

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

  // If we shouldn't show check-in, but we have previous data, show the inactive state
  if (!shouldShowCheckIn) {
    // **DODAT: Odabir wallpaper-a na osnovu orijentacije**
    const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
    
    return (
      <div className="min-h-screen relative">
        {/* DODAT: Wallpaper u pozadini - RAZLIČITI ZA PORTRAIT I LANDSCAPE */}
        <div className="absolute inset-0 z-0">
          <Image
            src={wallpaperSrc}
            alt="Airport Wallpaper"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Overlay za bolju čitljivost teksta */}
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

            {/* DODAT: Prikaz sledećeg leta */}
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

            {/* DODAT: Updated at tekst - SADA ĆE SE PRIKAZIVATI */}
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

  // At this point, displayFlight is guaranteed to be non-null due to shouldShowCheckIn check
  const safeDisplayFlight = displayFlight!;

  if (isPortrait) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col">
        
        {/* PROMENA: Dodat margin-top 1cm na header */}
        <div className="p-3 bg-white/5 backdrop-blur-lg border-b border-white/10 mt-[1cm]">
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

        <div className="flex-1 overflow-y-auto">
          
          <div className="m-4 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            {/* AIRLINE LOGO CONTAINER - 80% WIDTH */}
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
              
              {/* FLIGHT NUMBER - CENTRALIZED BELOW LOGO CONTAINER */}
              <div className="text-center w-full">
                <div className="text-[12rem] font-black text-yellow-500 leading-tight">
                  {safeDisplayFlight.FlightNumber}
                </div>
              </div>
            </div>

            {safeDisplayFlight.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-blue-300">
                  Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

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

            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-2 text-center mb-4">
              <div className="text-8xl font-bold text-green-400 mb-2 animate-pulse">
                CHECK-IN OPEN
              </div>
              <div className="text-base text-green-300">
                Please proceed to check-in
              </div>
            </div>
          </div>

          <div className="m-4 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="grid grid-cols-2 gap-4">
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div className="text-sm text-slate-400">Scheduled</div>
                </div>
                <div className="text-8xl font-mono font-bold text-white">
                  {safeDisplayFlight.ScheduledDepartureTime}
                </div>
              </div>

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

              {safeDisplayFlight.GateNumber && (
                <div className="col-span-2 text-center mt-4">
                  <div className="text-4xl text-slate-400 mb-1">Gate Information</div>
                  <div className="text-6xl font-bold text-white">
                    Gate {safeDisplayFlight.GateNumber}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-4xl text-slate-300 mt-1">
                    <Info className="w-8 h-8 text-yellow-400" />
                    <span>After check-in please proceed to gate {safeDisplayFlight.GateNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="m-4 bg-slate-800 rounded-2xl overflow-hidden">
            <div className="relative h-[580px] w-full">
              <Image
                src={adImages[currentAdIndex]}
                alt="Advertisement"
                fill
                className="object-fill w-full h-full"
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
                onError={(e) => {
                  console.error('Failed to load ad image:', adImages[currentAdIndex]);
                  setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
                }}
              />
            </div>
          </div>

          <div className="flex justify-center items-center space-x-2 text-sm font-inter mb-4">
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACz0lEQVR4nO2YPWhUQRDHYzSRREHUiILRxspCBIUYC20sxMJSEtTC1lYJfqWwUGOTIGiIYieIiBiEoI1WgoWFoBIRRBD8ACV+gaA5Nf5k4hiGx91l571971K8Hxy8e7s7O/+73Z3ZaWoqKSnJDDAf2AocB24Cz4DPwE/9yPO4tkmfbqB5Lji+BjgLvMXPG2AA6GyE4xuAS0CF7FSAEaCjKOf3Ap+Iz0egN0/HW4DL5M9FmSu28+3AHYrjtswZ85cv0vn/3AVaYwgoYtnUYiSr8/toPD1pnV8PrDNae/6deP4jVs/5ucJwmggbI0hV4xiwSFOKUCZdEVvTg7yYPlmAhc5xA57EzJvbHAHagL7ZOibm8vA6KAHUrNLLTOQEruchgOhKESBZm9MkxncA7wP7evkaImDUa7WKjd0hffFzI0TAeFYBaudKDgKehghwp8o17CzRjRdTwESIAPf5nxi/yjzvAv5EFDBZhICxeslgRgHfc19C+uqA+S5R96Xpvj+DgHe5b2J99VXSEfNuh1lKX4C1eW7i0QgChHvAPPP+gmm7rxHfy9UiApnlYOJa+sK0HXa7D30hArojCvgGrDNt24Apk2F62RwioLna+Z1SgPBAlotpHyQdr+ySnE2EVMxipsiHjG3JWp+nEHAqyHmdpNMZD2TfLAZO1Gj/Aaw39rcAvx32ZfzKYAE6iZT7YvIQWGDsn3GMPe9yXidYlsOlvt/YbwWeBIyR1HypW4BO0htZgCzLjcb+Ji2/12NPKufNJFKrjMljW3EDTtbpO5TJeVNalFplTE4n7D+q0mfM7pmsItoji/hl77fAhkRguxWlLpoQ0RL5ZJJY0GbsS71IOBe9vJ4Q0hPxdBoydiW525mb41XqpsMp8xnLFLC9EKdrCFmtaYcrdzK5Tb+9gjZSiCSAXVK3kdKHXDz0ZlfRf+mDBq1rWr2biQUlJSVNmfgLh4ZsWnm0WoMAAAAASUVORK5CYII="
              alt="nextjs"
              width={25}
              height={25}
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
              <div className="text-4xl text-green-400 mt-4">
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
        
        html, body, #__next {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0f172a;
        }
        
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        }
      `}</style>
    </div>
  );
}