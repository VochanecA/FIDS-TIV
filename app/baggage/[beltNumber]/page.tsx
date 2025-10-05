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
        const baggageFlights = getFlightsByBaggage(data.arrivals, beltNumber);
        setFlights(baggageFlights);
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
    if (statusLower.includes('arrived') || statusLower.includes('sletio')) {
      return 'text-green-400';
    }
    if (statusLower.includes('landed') || statusLower.includes('approach')) {
      return 'text-blue-400';
    }
    if (statusLower.includes('delay')) {
      return 'text-red-400';
    }
    return 'text-yellow-400';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    target.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="w-[85%] mx-auto mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Luggage className="w-12 h-12 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                BAGGAGE CLAIM
              </h1>
              <p className="text-slate-400 text-lg mt-2">
                Real-time baggage information • Belt assignment
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-8xl lg:text-9xl font-black text-yellow-400 mb-2">
              {beltNumber}
            </div>
            <div className="text-xl font-bold text-slate-300">BELT</div>
            {lastUpdate && (
              <div className="text-sm text-slate-400 mt-2">
                Updated: {lastUpdate}
              </div>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {[
            { label: 'Arrived', color: 'green' },
            { label: 'Landed', color: 'blue' },
            { label: 'Delayed', color: 'red' },
            { label: 'In Progress', color: 'yellow' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className={`w-3 h-3 rounded-full bg-${item.color}-400`}></div>
              <span className="text-base font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content - Table Layout */}
      <div className="w-[85%] mx-auto">
        {loading ? (
          <div className="text-center p-16">
            <div className="inline-flex items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-2xl text-slate-300">Loading baggage information...</span>
            </div>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center p-16 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
            <Luggage className="w-24 h-24 mx-auto mb-6 text-slate-400 opacity-50" />
            <div className="text-3xl text-slate-400 mb-4">No Active Flights</div>
            <div className="text-xl text-slate-500">
              No flights are currently assigned to Belt {beltNumber}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-6 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-lg uppercase tracking-wider">
              <div className="col-span-2 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                <span>Flight</span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Origin</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Time</span>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Details</div>
              <div className="col-span-1 flex items-center gap-2">
                <Luggage className="w-5 h-5" />
                <span>Belt</span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/5">
              {flights.map((flight, index) => (
                <div
                  key={`${flight.FlightNumber}-${index}`}
                  className="grid grid-cols-12 gap-4 p-6 items-center transition-all duration-300 hover:bg-white/5"
                  style={{ minHeight: '80px' }}
                >
                  {/* Flight Info */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={flight.AirlineLogoURL}
                        alt={flight.AirlineName}
                        className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow"
                        onError={handleImageError}
                      />
                      <div>
                        <div className="text-2xl font-black text-white">{flight.FlightNumber}</div>
                        <div className="text-sm text-slate-400">{flight.AirlineName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Origin */}
                  <div className="col-span-3">
                    <div className="text-xl font-bold text-white">
                      {flight.DestinationCityName}
                    </div>
                    <div className="text-lg font-mono text-cyan-400">
                      {flight.DestinationAirportCode}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="col-span-2">
                    <div className="text-xl font-mono font-bold text-white">
                      {flight.EstimatedDepartureTime || flight.ScheduledDepartureTime}
                    </div>
                    {flight.EstimatedDepartureTime && flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime && (
                      <div className="text-sm text-slate-400 line-through">
                        {flight.ScheduledDepartureTime}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className={`text-lg font-semibold ${getStatusColor(flight.StatusEN)}`}>
                      {flight.StatusEN}
                    </div>
                    {flight.StatusEN.toLowerCase().includes('delay') && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Delayed</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-300">
                            +{flight.CodeShareFlights.length}
                          </span>
                        </div>
                      )}
                      
                      {flight.Terminal && (
                        <div className="bg-orange-500/20 px-2 py-1 rounded border border-orange-500/30">
                          <div className="text-xs font-bold text-orange-300">
                            T{flight.Terminal.replace('T0', '').replace('T', '')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Belt Number */}
                  <div className="col-span-1 text-center">
                    <div className="text-3xl font-black text-yellow-400 bg-yellow-400/10 py-2 rounded-lg">
                      {beltNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Baggage Status Banner */}
      {flights.length > 0 && (
        <div className="w-[85%] mx-auto mt-8">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg rounded-2xl border border-yellow-400/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Luggage className="w-8 h-8 text-yellow-400 animate-pulse" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">Baggage Delivery Active</div>
                  <div className="text-lg text-yellow-300">
                    Luggage is being delivered to Belt {beltNumber}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-yellow-300">Last Updated</div>
                <div className="text-lg font-mono text-yellow-400">{lastUpdate}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="w-[85%] mx-auto mt-8 text-center">
        <div className="text-slate-500 text-sm">
          <div className="flex items-center justify-center gap-6 mb-2">
            <span>Live Updates</span>
            <span>•</span>
            <span>Automatic Refresh</span>
            <span>•</span>
            <span>Official Source</span>
          </div>
          <div>Baggage information updates every minute</div>
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
        html, body { overflow-x: hidden; }
      `}</style>
    </div>
  );
}