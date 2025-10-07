'use client';

import { useEffect, useState } from 'react';
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
  
  const { adImages, isLoading: adImagesLoading } = useAdImages();

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

        if (deskFlights.length === 0) {
          setLoading(false);
          return;
        }

        const processingFlights = getProcessingFlights(deskFlights);
        
        const validProcessingFlights = processingFlights.filter(
          flight => flight.StatusEN?.toLowerCase() === 'processing'
        );
        
        if (validProcessingFlights.length > 0) {
          const newFlight = validProcessingFlights[0];
          setFlight(newFlight);
          setCurrentData(newFlight);
        } else {
          setFlight(null);
        }
        
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
      } catch (error) {
        console.error('❌ Error loading flight data:', error);
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

  if (!shouldShowCheckIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-slate-400 mx-auto mb-6 opacity-50" />
          <div className="text-center">
            <div className="text-[8rem] font-bold text-slate-400 mb-2">Check-in</div>
            <div className="text-[36rem] font-black text-orange-500 leading-none">
              {deskNumberParam}
            </div>
          </div>
          <div className="text-2xl text-slate-500 mb-2">
            {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
          </div>
          <div className="text-lg text-slate-600">
            {displayFlight ? `Status: ${displayFlight.StatusEN}` : 'Please check the main display'}
          </div>
        </div>
      </div>
    );
  }

  if (isPortrait) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col">
        
        <div className="p-6 bg-white/5 backdrop-blur-lg border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-[6rem] font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Updated</div>
              <div className="text-sm font-mono text-slate-300">{lastUpdate}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          
          <div className="m-4 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-8 mb-10">
              {displayFlight.AirlineLogoURL && (
                <div className="relative w-80 h-48 bg-white rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-lg">
                  <div className="relative w-full h-full">
                    <Image
                      src={displayFlight.AirlineLogoURL}
                      alt={displayFlight.AirlineName || 'Airline Logo'}
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
              <div className="flex-1">
                <div className="text-[9rem] font-black text-yellow-500 mb-2">
                  {displayFlight.FlightNumber}
                </div>
              </div>
            </div>

            {displayFlight.CodeShareFlights && displayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-blue-300">
                  Also: {displayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <MapPin className="w-8 h-8 text-cyan-400" />
              <div className="flex-1">
                <div className="text-[10rem] font-bold text-white mb-1">
                  {displayFlight.DestinationCityName}
                </div>
                <div className="text-8xl font-bold text-cyan-400">
                  {displayFlight.DestinationAirportCode}
                </div>
              </div>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center mb-4">
              <div className="text-8xl font-bold text-green-400 mb-2 animate-pulse">
                CHECK-IN OPEN
              </div>
              <div className="text-lg text-green-300">
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
                  {displayFlight.ScheduledDepartureTime}
                </div>
              </div>

              {displayFlight.EstimatedDepartureTime && 
               displayFlight.EstimatedDepartureTime !== displayFlight.ScheduledDepartureTime && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="text-sm text-yellow-400">Expected</div>
                  </div>
                  <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse">
                    {displayFlight.EstimatedDepartureTime}
                  </div>
                </div>
              )}

              {displayFlight.GateNumber && (
                <div className="col-span-2 text-center mt-4">
                  <div className="text-4xl text-slate-400 mb-1">Gate Information</div>
                  <div className="text-6xl font-bold text-white">
                    Gate {displayFlight.GateNumber}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-4xl text-slate-300 mt-1">
                    <Info className="w-8 h-8 text-yellow-400" />
                    <span>After check-in please proceed to gate {displayFlight.GateNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="m-4 bg-slate-800 rounded-2xl overflow-hidden">
            <div className="relative h-[640px] w-full">
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden">
      
      <div className="h-full grid grid-cols-12 gap-8 p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        
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
              {displayFlight.AirlineLogoURL && (
                <div className="relative w-64 h-40 bg-white rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-lg">
                  <Image
                    src={displayFlight.AirlineLogoURL}
                    alt={displayFlight.AirlineName || 'Airline Logo'}
                    width={200}
                    height={120}
                    className="object-contain scale-100"
                    priority
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="text-[8rem] font-black text-yellow-500 mb-2">
                  {displayFlight.FlightNumber}
                </div>
                {/* <div className="text-lg text-slate-400">{displayFlight.AirlineName}</div> */}
              </div>
            </div>

            {displayFlight.CodeShareFlights && displayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-4 bg-blue-500/20 px-6 py-3 rounded-2xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="text-2xl text-blue-300">
                  Also: {displayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            <div className="flex items-center gap-6">
              <MapPin className="w-12 h-12 text-cyan-400" />
              <div>
                <div className="text-[6rem] font-bold text-white mb-2">
                  {displayFlight.DestinationCityName}
                </div>
                <div className="text-5xl font-bold text-cyan-400">
                  {displayFlight.DestinationAirportCode}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xl text-slate-400">Last Updated</div>
            <div className="text-2xl font-mono text-slate-300">{lastUpdate}</div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-between border-l-2 border-white/10 pl-8">
          
          <div className="space-y-8">
            <div className="text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
                <div className="text-2xl text-slate-400">Scheduled Departure</div>
              </div>
              <div className="text-8xl font-mono font-bold text-white leading-tight">
                {displayFlight.ScheduledDepartureTime}
              </div>
            </div>

            {displayFlight.EstimatedDepartureTime && 
             displayFlight.EstimatedDepartureTime !== displayFlight.ScheduledDepartureTime && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-4 mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-400" />
                  <div className="text-2xl text-yellow-400">Expected Departure</div>
                </div>
                <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse leading-tight">
                  {displayFlight.EstimatedDepartureTime}
                </div>
              </div>
            )}
          </div>

          <div className="text-right space-y-6">
            <div>
              <div className="text-4xl font-bold text-green-400 leading-tight animate-pulse">
                CHECK-IN OPEN
              </div>
              <div className="text-2xl text-green-400 mt-4">
                Please proceed to check-in
              </div>
            </div>

            {displayFlight.GateNumber && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                <div className="text-2xl text-slate-400 mb-3">Gate Information</div>
                <div className="text-4xl font-bold text-white">
                  Gate {displayFlight.GateNumber}
                </div>
                <div className="flex items-center justify-end gap-2 text-xl text-slate-300 mt-2">
                  <Info className="w-6 h-6 text-yellow-400" />
                  <span>After check-in please proceed to gate {displayFlight.GateNumber}</span>
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