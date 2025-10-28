'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getFlightsByGateWithPriority, shouldDisplayFlight } from '@/lib/flight-service';
import { Plane, Clock, MapPin, Users, AlertCircle, DoorOpen } from 'lucide-react';

// Flightaware logo URL generator
const getFlightawareLogoURL = (icaoCode: string): string => {
  if (!icaoCode) {
    return 'https://via.placeholder.com/180x120?text=No+Logo';
  }
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
};

export default function GatePage() {
  const params = useParams();
  const gateNumber = params.gateNumber as string;
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [nextUpdate, setNextUpdate] = useState<string>('');
  
  // Ref za sprečavanje nepotrebnih re-rendera
  const previousFlightRef = useRef<Flight | null>(null);
  const hasInitialDataRef = useRef(false);

  useEffect(() => {
    const loadFlights = async () => {
      try {
        // Ne postavljaj loading na true ako već imamo podatke
        if (!hasInitialDataRef.current) {
          setLoading(true);
        }
        
        const data = await fetchFlightData();
        
        // KORISTIMO NOVU FUNKCIJU SA PRIORITETOM
        const gateFlights = getFlightsByGateWithPriority(data.departures, gateNumber);
        
        // Uzmi prvi let (već je sortiran po prioritetu)
        const activeOrNextFlight = gateFlights[0] || null;
        
        // Ažuriraj samo ako su se podaci promijenili
        if (JSON.stringify(activeOrNextFlight) !== JSON.stringify(previousFlightRef.current)) {
          setFlight(activeOrNextFlight);
          previousFlightRef.current = activeOrNextFlight;
          hasInitialDataRef.current = true;
        }
        
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
        
        // Set next update time
        const nextUpdateTime = new Date(Date.now() + 60000);
        setNextUpdate(nextUpdateTime.toLocaleTimeString('en-GB'));
      } catch (error) {
        console.error('Failed to load gate information:', error);
        // Ne resetuj podatke na error - koristi prethodne
        if (!hasInitialDataRef.current) {
          setLoading(false);
        }
      } finally {
        if (!hasInitialDataRef.current) {
          setLoading(false);
        }
      }
    };

    loadFlights();
    const interval = setInterval(loadFlights, 60000);

    return () => clearInterval(interval);
  }, [gateNumber]);

  // Dodajte funkciju za proveru da li je let aktivan
  const isFlightActive = (flight: Flight | null): boolean => {
    if (!flight) return false;
    return shouldDisplayFlight(flight);
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase().trim();
    
    if (statusLower.includes('boarding') || statusLower.includes('gate open')) {
      return 'text-green-400';
    }
    if (statusLower.includes('final call')) {
      return 'text-red-400';
    }
    if (statusLower.includes('delay')) {
      return 'text-red-400';
    }
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
      return 'text-red-600 line-through';
    }
    if (statusLower.includes('departed') || statusLower.includes('diverted')) {
      return 'text-gray-500 line-through';
    }
    return 'text-yellow-400';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    target.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  };

  if (loading && !hasInitialDataRef.current) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <div className="text-3xl text-slate-300">Loading gate information...</div>
          <div className="text-lg text-slate-500 mt-4">Checking for active flights</div>
        </div>
      </div>
    );
  }

  // Prikaži prazan ekran SAMO ako nema letova uopšte
  if (!flight) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <DoorOpen className="w-32 h-32 text-slate-400 mx-auto mb-8 opacity-50" />
          <div className="text-8xl font-bold text-slate-400 mb-2">Gate</div>
          <div className="text-[32rem] font-black text-orange-500 leading-none mb-6">
            {gateNumber}
          </div>
          <div className="text-4xl text-slate-500 mb-4">No flights scheduled</div>
          <div className="text-2xl text-slate-500 mb-8">
            No flights are currently assigned to this gate.
          </div>
          <div className="text-lg text-slate-700">
            Last updated: {lastUpdate} | Next update: {nextUpdate}
          </div>
          {/* Indikator background refresh-a */}
          {loading && (
            <div className="text-sm text-slate-600 mt-4">Updating data...</div>
          )}
        </div>
      </div>
    );
  }

  // Proveri da li je let aktivan za prikaz statusa
  const isActive = isFlightActive(flight);

  return (
    <div className="w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden">
      
      {/* Main Content Grid */}
      <div className="h-full grid grid-cols-12 gap-8 p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        
        {/* Left Section - Gate and Flight Info (6 columns) */}
        <div className="col-span-6 flex flex-col justify-between">
          
          {/* Gate Header */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <DoorOpen className="w-12 h-12 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-8xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
                  GATE {gateNumber}
                </h1>
                {/* Indikator da li je let aktivan */}
                {!isActive && (
                  <div className="text-2xl text-slate-400 mt-4">
                    Next Scheduled Flight
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flight Information */}
          <div className="space-y-8 flex-1">
            {/* Flight Number and Airline - BIGGER LOGO */}
            <div className="flex items-center gap-8">
              <div className="w-64 h-48 bg-white rounded-3xl p-6 shadow-2xl flex items-center justify-center">
                <img
                  src={getFlightawareLogoURL(flight.AirlineICAO)}
                  alt={flight.AirlineName}
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                />
              </div>
              <div>
                <div className="text-[11rem] font-black text-white mb-4 leading-tight">
                  {flight.FlightNumber}
                </div>
              </div>
            </div>

            {/* Codeshare Flights */}
            {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-4 bg-blue-500/20 px-6 py-3 rounded-2xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="text-2xl text-blue-300">
                  Also: {flight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="flex items-center gap-6">
              <MapPin className="w-12 h-12 text-cyan-400" />
              <div>
                <div className="text-[10rem] font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight mb-2">
                  {flight.DestinationCityName}
                </div>
                <div className="text-5xl font-semibold text-cyan-400">
                  {flight.DestinationAirportCode}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8">
            <div className="text-sm text-slate-400">Last Updated</div>
            <div className="text-xl font-mono text-slate-300">{lastUpdate}</div>
            <div className="text-sm text-slate-600">Next update: {nextUpdate}</div>
            {/* Indikator background refresh-a */}
            {loading && (
              <div className="text-xs text-slate-500 mt-1">Updating data...</div>
            )}
          </div>
        </div>

        {/* Right Section - Timing and Status (6 columns) */}
        <div className="col-span-6 flex flex-col justify-between pl-12">
          
          {/* Time Information */}
          <div className="space-y-12">
            {/* Scheduled Time */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
                <div className="text-3xl text-slate-400">Scheduled Departure</div>
              </div>
              <div className="text-9xl font-mono font-bold text-white leading-tight">
                {flight.ScheduledDepartureTime}
              </div>
            </div>

            {/* Estimated Time */}
            {flight.EstimatedDepartureTime && 
             flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-4 mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-400" />
                  <div className="text-3xl text-yellow-400">Expected Departure</div>
                </div>
                <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse leading-tight">
                  {flight.EstimatedDepartureTime}
                </div>
              </div>
            )}
          </div>

          {/* Status Section */}
          <div className="text-right space-y-8">
            {/* Main Status */}
            <div>
              <div className={`text-7xl font-bold ${getStatusColor(flight.StatusEN)} leading-tight`}>
                {flight.StatusEN}
              </div>
              
              {/* Status Messages - prikaži samo za aktívne letove */}
              {isActive && (
                <>
                  {flight.StatusEN.toLowerCase().includes('boarding') && (
                    <div className="text-4xl text-green-400 mt-4 animate-pulse">
                      Please proceed to gate
                    </div>
                  )}
                  {flight.StatusEN.toLowerCase().includes('final call') && (
                    <div className="text-4xl text-red-400 mt-4 animate-pulse">
                      Final boarding call
                    </div>
                  )}
                  {flight.StatusEN.toLowerCase().includes('delay') && (
                    <div className="text-3xl text-red-400 mt-4">
                      Flight delayed - Please wait for updates
                    </div>
                  )}
                </>
              )}
              
              {/* Poruka za neaktívne letove */}
              {!isActive && (
                <div className="text-3xl text-slate-400 mt-4">
                  Next scheduled flight for this gate
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-8">
              {flight.Terminal && (
                <div className="text-center bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                  <div className="text-2xl text-slate-400 mb-3">Terminal</div>
                  <div className="text-5xl font-bold text-white">
                    {flight.Terminal.replace('T0', 'T').replace('T', 'T ')}
                  </div>
                </div>
              )}
              
              {flight.GateNumber && (
                <div className="text-center bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                  <div className="text-2xl text-slate-400 mb-3">Gate</div>
                  <div className="text-5xl font-bold text-white">{flight.GateNumber}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        /* Remove all default margins and padding */
        html, body, #__next {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0f172a; /* Fallback color */
        }
        
        /* Center the main container */
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        }
        
        /* Hide portrait layout completely for this gate display */
        .lg\\:hidden {
          display: none !important;
        }
      `}</style>
    </div>
  );
}