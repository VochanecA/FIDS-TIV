'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getFlightsByBaggage } from '@/lib/flight-service';
import { Plane, Luggage, MapPin, Clock, AlertCircle, Users } from 'lucide-react';

export default function BaggagePage() {
  const params = useParams();
  const beltNumber = params.beltNumber as string;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const loadFlights = async () => {
      try {
        setLoading(true);
        const data = await fetchFlightData();
        let baggageFlights = getFlightsByBaggage(data.arrivals, beltNumber);

        const now = new Date();

        // Zadrži arrived letove unutar 20 minuta od sletanja
        baggageFlights = baggageFlights.filter(flight => {
          const statusLower = flight.StatusEN?.toLowerCase() || '';
          if (statusLower.includes('arrived') || statusLower.includes('sletio')) {
            const timeStr = flight.EstimatedDepartureTime || flight.ScheduledDepartureTime;
            if (!timeStr) return true;
            const [hoursStr, minutesStr] = timeStr.split(':');
            const flightTime = new Date(now);
            flightTime.setHours(Number(hoursStr), Number(minutesStr), 0, 0);
            return flightTime.getTime() + 30 * 60 * 1000 >= now.getTime();
          }
          return true;
        });

        // Sortiraj po vremenu
        baggageFlights.sort((a, b) => {
          const timeA = a.EstimatedDepartureTime || a.ScheduledDepartureTime || '99:99';
          const timeB = b.EstimatedDepartureTime || b.ScheduledDepartureTime || '99:99';
          return timeA.localeCompare(timeB);
        });

        // Prikaži maksimalno 7 letova
        setFlights(baggageFlights.slice(0, 7));
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
      } catch (error) {
        console.error('Failed to load flights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
    const interval = setInterval(loadFlights, 60000);
    return () => clearInterval(interval);
  }, [beltNumber]);

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('arrived') || statusLower.includes('sletio')) return 'text-green-400';
    if (statusLower.includes('landed') || statusLower.includes('approach')) return 'text-blue-400';
    if (statusLower.includes('delay')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    target.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-3">
      {/* Header */}
      <div className="w-[90%] mx-auto mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Luggage className="w-10 h-10 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                BAGGAGE CLAIM
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time baggage information • Belt assignment
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-7xl lg:text-8xl font-black text-yellow-400 mb-1">
              {beltNumber}
            </div>
            <div className="text-lg font-bold text-slate-300">BELT</div>
            {lastUpdate && (
              <div className="text-xs text-slate-400 mt-1">
                Updated: {lastUpdate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Table */}
      <div className="w-[90%] mx-auto">
        {loading ? (
          <div className="text-center p-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-slate-300">Loading baggage information...</span>
            </div>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
            <Luggage className="w-20 h-20 mx-auto mb-4 text-slate-400 opacity-50" />
            <div className="text-2xl text-slate-400 mb-2">No Active Flights</div>
            <div className="text-lg text-slate-500">
              No flights are currently assigned to Belt {beltNumber}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-sm uppercase tracking-wider">
              <div className="col-span-2 flex items-center gap-1">
                <Plane className="w-4 h-4" />
                <span>Flight</span>
              </div>
              <div className="col-span-3 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Origin</span>
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Time</span>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Details</div>
              <div className="col-span-1 flex items-center gap-1">
                <Luggage className="w-4 h-4" />
                <span>Belt</span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/5">
              {flights.map((flight, index) => {
                const isArrived = flight.StatusEN.toLowerCase().includes('arrived') || flight.StatusEN.toLowerCase().includes('sletio');
                const ledSize = '1em'; // možeš promeniti za proporcionalnu veličinu prema fontu statusa
                return (
                  <div
                    key={`${flight.FlightNumber}-${index}`}
                    className="grid grid-cols-12 gap-2 p-3 items-center transition-all duration-300 hover:bg-white/5"
                    style={{ minHeight: '60px' }}
                  >
                    {/* Flight Info */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={flight.AirlineLogoURL}
                          alt={flight.AirlineName}
                          className="w-10 h-10 object-contain bg-white rounded-lg p-1 shadow"
                          onError={handleImageError}
                        />
                        <div>
                          <div className="text-3xl font-black text-white">{flight.FlightNumber}</div>
                          <div className="text-lg text-slate-400">{flight.AirlineName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Origin */}
                    <div className="col-span-3">
                      <div className="text-5xl font-bold text-white">
                        {flight.DestinationCityName}
                      </div>
                      <div className="text-lg font-bold text-cyan-400">
                        {flight.DestinationAirportCode}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="col-span-2">
                      <div className="text-4xl font-bold text-yellow-400">
                        {flight.EstimatedDepartureTime || flight.ScheduledDepartureTime}
                      </div>
                      {flight.EstimatedDepartureTime && flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime && (
                        <div className="text-lg text-slate-400 line-through">
                          {flight.ScheduledDepartureTime}
                        </div>
                      )}
                    </div>

                    {/* Status */}

<div className="col-span-2 flex items-center gap-2">
  {isArrived && (
    <>
      <div className="led led1" style={{ width: ledSize, height: ledSize }} />
      <div className="led led2" style={{ width: ledSize, height: ledSize }} />
    </>
  )}
  <div className={`text-4xl font-bold ${getStatusColor(flight.StatusEN)} ${isArrived ? 'blink-text' : ''}`}>
    {flight.StatusEN}
  </div>
</div>


                    {/* Details */}
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="flex items-center gap-1 bg-blue-500/20 px-1 py-0.5 rounded border border-blue-500/30">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span className="text-[12px] text-blue-300">
                              +{flight.CodeShareFlights.length}
                            </span>
                          </div>
                        )}
                        {flight.Terminal && (
                          <div className="bg-orange-500/20 px-1 py-0.5 rounded border border-orange-500/30">
                            <div className="text-[32px] font-bold text-orange-600">
                              T{flight.Terminal.replace('T0', '').replace('T', '')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Belt Number */}
                    <div className="col-span-1 text-center">
                      <div className="text-3xl font-black text-yellow-400 bg-yellow-400/10 py-1 rounded-lg">
                        {beltNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Baggage Status Banner */}
      {flights.length > 0 && (
        <div className="w-[90%] mx-auto mt-4">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg rounded-2xl border border-yellow-400/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Luggage className="w-6 h-6 text-yellow-400 animate-pulse" />
                <div>
                  <div className="text-xl font-bold text-yellow-400">Baggage Delivery Active</div>
                  <div className="text-sm text-yellow-300">
                    Luggage is being delivered to Belt {beltNumber}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-yellow-300">Last Updated</div>
                <div className="text-sm font-mono text-yellow-400">{lastUpdate}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="w-[90%] mx-auto mt-4 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-4 mb-1">
          <span>Live Updates</span>
          <span>•</span>
          <span>Automatic Refresh</span>
          <span>•</span>
          <span>Official Source</span>
        </div>
        <div>Baggage information updates every minute</div>
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

        .led {
          border-radius: 50%;
          background-color: limegreen;
        }
        .led1 {
          animation: led1-blink 1s infinite;
        }
        .led2 {
          animation: led2-blink 1s infinite;
        }
        @keyframes led1-blink {
          0%,50%,100% { opacity: 1; }
          25%,75% { opacity: 0.2; }
        }
        @keyframes led2-blink {
          0%,50%,100% { opacity: 0.2; }
          25%,75% { opacity: 1; }
        }
          .blink-text {
  animation: blink 2s infinite;
}

@keyframes blink {
  0%,50%,100% { opacity: 1; }
  25%,75% { opacity: 0.1; }
}


        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
