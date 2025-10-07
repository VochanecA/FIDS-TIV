'use client';

import { useEffect, useState } from 'react';
import type { Flight } from '@/types/flight';
import { fetchFlightData } from '@/lib/flight-service';
import { AlertCircle, Info, Plane, Clock, MapPin, Luggage } from 'lucide-react';

export default function ArrivalsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>(''); // NEW: State for current time

  useEffect(() => {
    const loadFlights = async () => {
      try {
        setLoading(true);
        const data = await fetchFlightData();
        const filteredFlights = filterArrivedFlights(data.arrivals);
        setFlights(filteredFlights);
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
  }, []);

  // NEW: Effect to update current time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    // Set initial time
    updateTime();

    // Update time every second
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const filterArrivedFlights = (allFlights: Flight[]): Flight[] => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const isArrivedOrDeparted = (status: string): boolean => {
      const statusLower = status.toLowerCase();
      return statusLower.includes('arrived') || 
             statusLower.includes('sletio') || 
             statusLower.includes('departed');
    };

    const getFlightDateTime = (flight: Flight): Date | null => {
      const timeStr = flight.ActualDepartureTime || 
                      flight.EstimatedDepartureTime || 
                      flight.ScheduledDepartureTime;
      if (!timeStr) return null;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const flightDate = new Date(now);
      flightDate.setHours(hours, minutes, 0, 0);

      return flightDate;
    };

    const arrivedFlights: Flight[] = [];
    const activeFlights: Flight[] = [];

    allFlights.forEach(flight => {
      if (isArrivedOrDeparted(flight.StatusEN)) {
        arrivedFlights.push(flight);
      } else {
        activeFlights.push(flight);
      }
    });

    const sortedArrivedFlights = arrivedFlights.sort((a, b) => {
      const timeA = getFlightDateTime(a);
      const timeB = getFlightDateTime(b);
      if (!timeA || !timeB) return 0;
      return timeB.getTime() - timeA.getTime();
    });

    const recentArrivedFlights = sortedArrivedFlights
      .filter(flight => {
        const flightTime = getFlightDateTime(flight);
        return flightTime && flightTime >= thirtyMinutesAgo;
      })
      .slice(0, 2);

    const combinedFlights = [...activeFlights, ...recentArrivedFlights];

    return combinedFlights.sort((a, b) => {
      const timeA = a.EstimatedDepartureTime || a.ScheduledDepartureTime;
      const timeB = b.EstimatedDepartureTime || b.ScheduledDepartureTime;
      if (!timeA) return 1;
      if (!timeB) return -1;
      return timeA.localeCompare(timeB);
    });
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('arrived') || statusLower.includes('sletio')) {
      return 'text-green-400';
    }
    if (statusLower.includes('delay') || statusLower.includes('kasni')) {
      return 'text-red-400';
    }
    if (statusLower.includes('landing') || statusLower.includes('approach')) {
      return 'text-blue-400';
    }
    if (statusLower.includes('on time')) {
      return 'text-yellow-400';
    }
    return 'text-slate-300';
  };

  const shouldBlinkRow = (flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    const isArrived = statusLower.includes('arrived') || 
                     statusLower.includes('sletio') || 
                     statusLower.includes('landed');
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('otkazan');
    
    return isArrived || isCancelled;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    target.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  };

  const formatTerminal = (terminal?: string): string => {
    if (!terminal) return '-';
    return terminal === 'T01' ? 'T1' : terminal === 'T02' ? 'T2' : terminal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white p-2 transition-all duration-500">
      {/* Header */}
      <div className="w-[95%] mx-auto mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ARRIVALS
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time arrival information • Incoming flights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {currentTime || '--:--'} {/* Use state instead of direct Date call */}
              </div>
              {lastUpdate && (
                <div className="text-xs text-slate-400">
                  Updated: {lastUpdate}
                </div>
              )}
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>

        {/* Status Legend - Compact */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {[
            { label: 'On Time', color: 'yellow' },
            { label: 'Delayed', color: 'red' },
            { label: 'Landed', color: 'green' },
            { label: 'Approach', color: 'blue' },
            { label: 'Cancelled', color: 'red' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
              <div className={`w-1.5 h-1.5 rounded-full bg-${item.color}-400`}></div>
              <span className="text-xs font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flight Board - Optimized for 10-12 flights */}
      <div className="w-[95%] mx-auto">
        {loading && flights.length === 0 ? (
          <div className="text-center p-12">
            <div className="inline-flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg text-slate-300">Loading arrival information...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-2 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-sm uppercase tracking-wider">
              <div className="col-span-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Time</span>
              </div>
              <div className="col-span-3">Flight</div>
              <div className="col-span-3 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Origin</span>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Terminal</div>
              <div className="col-span-1 flex items-center gap-1">
                <Luggage className="w-4 h-4" />
                <span>Belt</span>
              </div>
            </div>

            {/* Flight Rows - Compact */}
            <div className="divide-y divide-white/5 max-h-[75vh] overflow-y-auto">
              {flights.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Plane className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <div className="text-base">No arrivals scheduled</div>
                </div>
              ) : (
                flights.map((flight, index) => {
                  const shouldBlink = shouldBlinkRow(flight);
                  const isCancelled = flight.StatusEN.toLowerCase().includes('cancelled') || 
                                    flight.StatusEN.toLowerCase().includes('otkazan');
                  
                  return (
                    <div
                      key={`${flight.FlightNumber}-${index}`}
                      className={`grid grid-cols-12 gap-2 p-1 items-center transition-all duration-300 hover:bg-white/5
                        ${shouldBlink ? 'animate-row-blink' : ''}
                        ${index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'}`}
                      style={{ minHeight: '60px' }} // Consistent row height
                    >
                      {/* Time - Compact */}
                      <div className="col-span-2">
                        <div className="text-4xl font-mono font-bold">
                          {flight.EstimatedDepartureTime ? (
                            <span className="text-yellow-400 animate-blink bg-yellow-400/10 px-1 py-0.5 rounded">
                              {flight.EstimatedDepartureTime}
                            </span>
                          ) : (
                            <span className="text-white">{flight.ScheduledDepartureTime}</span>
                          )}
                        </div>
                        {flight.EstimatedDepartureTime && 
                         flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime && (
                          <div className="text-xs text-slate-500 line-through mt-0.5">
                            {flight.ScheduledDepartureTime}
                          </div>
                        )}
                      </div>

                      {/* Flight Info - Compact */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={flight.AirlineLogoURL}
                            alt={flight.AirlineName}
                            className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow"
                            loading="lazy"
                            onError={handleImageError}
                          />
                          <div>
                            <div className="text-4xl font-black text-white">{flight.FlightNumber}</div>
                            <div className="text-sm text-slate-400 truncate max-w-[120px]">
                              {flight.AirlineName}
                            </div>
                          </div>
                        </div>
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            +{flight.CodeShareFlights.length} codeshare
                          </div>
                        )}
                      </div>

                      {/* Origin - Compact */}
                      <div className="col-span-3">
                        <div className="text-4xl font-bold text-white truncate">
                          {flight.DestinationCityName}
                        </div>
                        <div className="text-sm font-mono text-cyan-400">
                          {flight.DestinationAirportCode}
                        </div>
                      </div>

                      {/* Status - Compact */}
                      <div className="col-span-2">
                        <div className={`text-4xl font-semibold ${getStatusColor(flight.StatusEN)}`}>
                          {isCancelled ? (
                            <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span>Cancelled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {shouldBlink && <Info className="w-3 h-3" />}
                              <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Terminal - Compact */}
                      <div className="col-span-1 text-center">
                        <div className="text-lg font-black text-white bg-slate-800/50 py-1 rounded">
                          {formatTerminal(flight.Terminal)}
                        </div>
                      </div>

                      {/* Baggage - Compact */}
                      <div className="col-span-1 text-center">
                        <div className="text-lg font-black text-white bg-slate-800/50 py-1 rounded">
                          {flight.BaggageReclaim || '-'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Compact */}
      <div className="w-[95%] mx-auto mt-4 text-center">
        <div className="text-slate-500 text-xs">
          <div className="flex items-center justify-center gap-4 mb-1">
            <span>Live Updates</span>
            <span>•</span>
            <span>Auto Refresh</span>
          </div>
          <div>Arrival information updates every minute</div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        @keyframes row-blink {
          0%, 50% { 
            background-color: rgba(251, 191, 36, 0.3);
            box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
          }
          51%, 100% { 
            background-color: inherit;
            box-shadow: none;
          }
        }
        .animate-blink {
          animation: blink 400ms infinite;
        }
        .animate-row-blink {
          animation: row-blink 800ms infinite;
        }
        ::-webkit-scrollbar { 
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        html, body { overflow: hidden; }
      `}</style>
    </div>
  );
}