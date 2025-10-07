'use client';

import { JSX, useEffect, useState, useCallback, useMemo } from 'react';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getUniqueDeparturesWithDeparted } from '@/lib/flight-service';
import { AlertCircle, Info, Plane, Clock, MapPin, Users, Luggage, DoorOpen } from 'lucide-react';

interface FlightDataResponse {
  departures: Flight[];
  arrivals: Flight[];
  lastUpdated: string;
  source?: 'live' | 'cached' | 'fallback';
  error?: string;
  warning?: string;
}

export default function CombinedPage(): JSX.Element {
  const [arrivals, setArrivals] = useState<Flight[]>([]);
  const [departures, setDepartures] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showArrivals, setShowArrivals] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Memoized time formatter
  const formatTime = useCallback((timeString: string): string => {
    if (!timeString || timeString.length !== 4) return '';
    return `${timeString.substring(0, 2)}:${timeString.substring(2, 4)}`;
  }, []);

  // Sort flights by scheduled time (earliest to latest)
  const sortFlightsByScheduledTime = useCallback((flights: Flight[]): Flight[] => {
    return [...flights].sort((a, b) => {
      const timeA = a.ScheduledDepartureTime || '99:99';
      const timeB = b.ScheduledDepartureTime || '99:99';
      return timeA.localeCompare(timeB);
    });
  }, []);

  // Set up time interval
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Filter and process flights
  const filterArrivedFlights = useCallback((allFlights: Flight[]): Flight[] => {
    const now = new Date();

    const isArrived = (status: string): boolean => {
      const statusLower = status.toLowerCase();
      return statusLower.includes('arrived') || statusLower.includes('sletio') || statusLower.includes('landed');
    };

    const getFlightDateTime = (flight: Flight): Date | null => {
      const timeStr = flight.EstimatedDepartureTime || flight.ScheduledDepartureTime;
      if (!timeStr) return null;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const flightDate = new Date(now);
      flightDate.setHours(hours, minutes, 0, 0);
      return flightDate;
    };

    const getFifteenMinutesAfterFlight = (flight: Flight): Date | null => {
      const flightTime = getFlightDateTime(flight);
      return flightTime ? new Date(flightTime.getTime() + 15 * 60 * 1000) : null;
    };

    const arrivedFlights: Flight[] = [];
    const activeFlights: Flight[] = [];

    allFlights.forEach((flight) => {
      if (isArrived(flight.StatusEN)) {
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

    const recentArrivedFlights = sortedArrivedFlights.filter((flight) => {
      const fifteenMinutesAfter = getFifteenMinutesAfterFlight(flight);
      return fifteenMinutesAfter && fifteenMinutesAfter >= now;
    });

    const combinedFlights = [...activeFlights, ...recentArrivedFlights];
    return sortFlightsByScheduledTime(combinedFlights);
  }, [sortFlightsByScheduledTime]);

  // Load flights data
  useEffect(() => {
    const loadFlights = async (): Promise<void> => {
      try {
        setLoading(true);
        const data: FlightDataResponse = await fetchFlightData();
        const filteredArrivals = filterArrivedFlights(data.arrivals);
        // KORISTITE NOVU FUNKCIJU ZA DEPARTURES
        const filteredDepartures = getUniqueDeparturesWithDeparted(data.departures);
        setArrivals(filteredArrivals);
        setDepartures(filteredDepartures);
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
      } catch (error) {
        console.error('Failed to load flights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlights().catch((error) => {
      console.error('Failed to load flights:', error);
    });

    const fetchInterval = setInterval(loadFlights, 60000);
    return () => clearInterval(fetchInterval);
  }, [filterArrivedFlights]);

  // Auto-switch between arrivals/departures
  useEffect(() => {
    const switchInterval = setInterval(() => {
      setShowArrivals((prev) => !prev);
    }, 30000);

    return () => clearInterval(switchInterval);
  }, []);

  // Status color mapping
  const getStatusColor = useCallback((status: string, isArrival: boolean): string => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('cancelled') || statusLower.includes('otkazan')) {
      return 'text-red-500';
    }
    if (statusLower.includes('processing')) {
      return 'text-green-400';
    }
    if (isArrival) {
      if (statusLower.includes('arrived') || statusLower.includes('sletio')) {
        return 'text-green-500';
      }
    } else {
      if (statusLower.includes('departed') || statusLower.includes('poletio')) {
        return 'text-green-500';
      }
      if (statusLower.includes('boarding') || statusLower.includes('gate open')) {
        return 'text-blue-400';
      }
    }
    if (statusLower.includes('delay') || statusLower.includes('kasni')) {
      return 'text-red-400';
    }
    if (statusLower.includes('on time')) {
      return 'text-yellow-400';
    }
    return 'text-slate-300';
  }, []);

  // Blink row for important statuses
  const shouldBlinkRow = useCallback((flight: Flight, isArrival: boolean): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    const isArrived = isArrival && (
      statusLower.includes('arrived') || 
      statusLower.includes('sletio') || 
      statusLower.includes('landed')
    );
    const isDeparted = !isArrival && (
      statusLower.includes('departed') || 
      statusLower.includes('poletio')
    );
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('otkazan');
    
    return isArrived || isDeparted || isCancelled;
  }, []);

  // Image error handling
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  }, []);

  // Format terminal display
  const formatTerminal = useCallback((terminal?: string): string => {
    if (!terminal) return '-';
    return terminal.replace('T0', 'T').replace('T', 'T ');
  }, []);

  // Memoized current flights and title
  const currentFlights = useMemo(() => 
    showArrivals ? arrivals : departures, 
    [showArrivals, arrivals, departures]
  );

  const title = useMemo(() => 
    showArrivals ? 'ARRIVALS' : 'DEPARTURES', 
    [showArrivals]
  );

  const bgColor = useMemo(() => 
    showArrivals 
      ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
      : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900', 
    [showArrivals]
  );

  return (
    <div className={`h-screen ${bgColor} text-white p-2 transition-colors duration-500 flex flex-col`}>
      {/* Header - Reduced margin */}
      <div className="w-[95%] mx-auto mb-2 flex-shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-orange-400 text-lg mt-0.5">
                Real-time flight information • {showArrivals ? 'Incoming flights' : 'Outgoing flights'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[4rem] font-bold text-cyan-300">
                {currentTime || '--:--'}
              </div>
              {lastUpdate && (
                <div className="text-xs text-slate-400">
                  Updated: {lastUpdate}
                </div>
              )}
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Flight Board - Maximum height */}
      <div className="w-[95%] mx-auto flex-1 min-h-0">
        {loading && currentFlights.length === 0 ? (
          <div className="text-center p-8 h-full flex items-center justify-center">
            <div className="inline-flex items-center gap-3">
              <div className={`w-6 h-6 border-4 ${showArrivals ? 'border-blue-400' : 'border-yellow-400'} border-t-transparent rounded-full animate-spin`} />
              <span className="text-base text-slate-300">Loading flight information...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 p-1 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-xs uppercase tracking-wider flex-shrink-0">
              <div className="col-span-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Time</span>
              </div>
              <div className="col-span-2 text-center">Flight</div>
              <div className="col-span-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{showArrivals ? 'Origin' : 'Destination'}</span>
              </div>
              <div className="col-span-2 text-center">Status</div>
              {showArrivals ? (
                <div className="col-span-3 flex items-center gap-1">
                  <Luggage className="w-3 h-3" />
                  <span>Baggage Belt</span>
                </div>
              ) : (
                <>
                  <div className="col-span-1 text-center">Terminal</div>
                  <div className="col-span-1 flex items-center gap-1">
                    <DoorOpen className="w-3 h-3" />
                    <span>Gate</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Check-In</span>
                  </div>
                </>
              )}
            </div>

            {/* Flight Rows - Maximum height with scrolling */}
            <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
              {currentFlights.length === 0 ? (
                <div className="p-6 text-center text-slate-400 h-full flex items-center justify-center">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No {title.toLowerCase()} scheduled</div>
                </div>
              ) : (
                currentFlights.map((flight, index) => {
                  const shouldBlink = shouldBlinkRow(flight, showArrivals);
                  const isCancelled = flight.StatusEN.toLowerCase().includes('cancelled') || 
                                    flight.StatusEN.toLowerCase().includes('otkazan');
                  
                  return (
                    <div
                      key={`${flight.FlightNumber}-${index}`}
                      className={`grid grid-cols-12 gap-1 p-1 items-center transition-all duration-300 hover:bg-white/5
                        ${shouldBlink ? 'animate-row-blink' : ''}
                        ${index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'}`}
                      style={{ minHeight: '45px' }}
                    >
                      {/* Time - Compact */}
                      <div className="col-span-2">
                        <div className="text-3xl font-mono font-bold">
                          {flight.ScheduledDepartureTime ? (
                            <span className="text-white">
                              {flight.ScheduledDepartureTime}
                            </span>
                          ) : (
                            <span className="text-slate-400">--:--</span>
                          )}
                        </div>
                        {flight.EstimatedDepartureTime && 
                         flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime && (
                          <div className="text-lg text-yellow-400 animate-blink mt-0">
                            Est: {flight.EstimatedDepartureTime}
                          </div>
                        )}
                      </div>

                      {/* Flight Info */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <img
                            src={flight.AirlineLogoURL}
                            alt={flight.AirlineName}
                            className="w-8 h-8 object-contain bg-white rounded p-0.5 shadow"
                            loading="lazy"
                            onError={handleImageError}
                          />
                          <div>
                            <div className="text-2xl font-black text-white">{flight.FlightNumber}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[90px]">
                              {flight.AirlineName}
                            </div>
                          </div>
                        </div>
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0">
                            +{flight.CodeShareFlights.length} codeshare
                          </div>
                        )}
                      </div>

                      {/* Destination/Origin */}
                      <div className="col-span-3">
                        <div className="text-3xl font-bold text-white truncate">
                          {flight.DestinationCityName}
                        </div>
                        <div className="text-lg font-mono text-orange-400 font-bold">
                          {flight.DestinationAirportCode}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <div className={`text-2xl font-semibold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
                          {isCancelled ? (
                            <div className="flex items-center gap-1 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">
                              <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                              <span>Cancelled</span>
                            </div>
                          ) : flight.StatusEN?.toLowerCase() === 'processing' ? (
                            <div className="flex items-center gap-1 bg-green-400/10 px-1 py-0.5 rounded border border-green-400/20">
                              <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-blink" />
                              <span>Check-in Open</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {shouldBlink && <Info className="w-2.5 h-2.5" />}
                              <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {showArrivals ? (
                        /* Baggage */
                        <div className="col-span-3 text-center">
                          <div className="text-xl font-black text-white bg-slate-800/50 py-0.5 rounded">
                            {flight.BaggageReclaim || '-'}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Terminal */}
                          <div className="col-span-1 text-center">
                            <div className={`
                              inline-flex items-center justify-center 
                              w-8 h-8 rounded-full
                              font-bold text-sm
                              ${flight.Terminal === 'T1' || flight.Terminal === 'T01' 
                                ? 'bg-blue-500 text-white' 
                                : flight.Terminal === 'T2' || flight.Terminal === 'T02'
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800/50 text-white'
                              }
                            `}>
                              {formatTerminal(flight.Terminal)}
                            </div>
                          </div>

                          {/* Gate */}
                          <div className="col-span-1 text-center">
                            <div className="text-base font-black text-white bg-slate-800/50 py-0.5 rounded">
                              {flight.GateNumber || '-'}
                            </div>
                          </div>

                          {/* Check-In */}
                          <div className="col-span-1 text-center">
                            <div className="text-base font-black text-white bg-slate-800/50 py-0.5 rounded">
                              {flight.CheckInDesk || '-'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Reduced height */}
      <div className="w-[95%] mx-auto mt-1 text-center flex-shrink-0">
        <div className="text-slate-500 text-xs py-1">
          <div className="flex items-center justify-center gap-2 mb-0">
            <span>Code by: alen.vocanec@apm.co.me</span>
            <span>•</span>
            <span>Auto Refresh</span>
          </div>
          <div>Flight information updates every minute • Switches every 30s</div>
        </div>
      </div>

      {/* Custom animations - SVIJETLO PLAVA BOJA ZA BLINKANJE */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        @keyframes row-blink {
          0%, 50% { 
            background-color: rgba(96, 165, 250, 0.4); /* Svijetlo plava boja */
            box-shadow: 0 0 12px rgba(96, 165, 250, 0.6); /* Jači sjaj */
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
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        html, body { 
          overflow: hidden;
          margin: 0;
          padding: 0;
          height: 100vh;
        }
        #__next {
          height: 100vh;
        }
      `}</style>
    </div>
  );
}