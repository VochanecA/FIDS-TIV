'use client';

import { JSX, useEffect, useState, useCallback, useMemo } from 'react';
import type { Flight } from '@/types/flight';
import { fetchFlightData } from '@/lib/flight-service';
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

  const filterDepartedFlights = useCallback((allFlights: Flight[]): Flight[] => {
    const now = new Date();

    const isDeparted = (status: string): boolean => {
      const statusLower = status.toLowerCase();
      return statusLower.includes('departed') || statusLower.includes('otisao');
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

    const departedFlights: Flight[] = [];
    const activeFlights: Flight[] = [];

    allFlights.forEach((flight) => {
      if (isDeparted(flight.StatusEN)) {
        departedFlights.push(flight);
      } else {
        activeFlights.push(flight);
      }
    });

    const sortedDepartedFlights = departedFlights.sort((a, b) => {
      const timeA = getFlightDateTime(a);
      const timeB = getFlightDateTime(b);
      if (!timeA || !timeB) return 0;
      return timeB.getTime() - timeA.getTime();
    });

    const recentDepartedFlights = sortedDepartedFlights.filter((flight) => {
      const fifteenMinutesAfter = getFifteenMinutesAfterFlight(flight);
      return fifteenMinutesAfter && fifteenMinutesAfter >= now;
    });

    const combinedFlights = [...activeFlights, ...recentDepartedFlights];
    return sortFlightsByScheduledTime(combinedFlights);
  }, [sortFlightsByScheduledTime]);

  // Load flights data
  useEffect(() => {
    const loadFlights = async (): Promise<void> => {
      try {
        setLoading(true);
        const data: FlightDataResponse = await fetchFlightData();
        const filteredArrivals = filterArrivedFlights(data.arrivals);
        const filteredDepartures = filterDepartedFlights(data.departures);
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
  }, [filterArrivedFlights, filterDepartedFlights]);

  // Auto-switch between arrivals/departures
  useEffect(() => {
    const switchInterval = setInterval(() => {
      setShowArrivals((prev) => !prev);
    }, 25000);

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
        return 'text-green-400';
      }
    } else {
      if (statusLower.includes('departed') || statusLower.includes('otisao')) {
        return 'text-green-400';
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
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('otkazan');
    
    return isArrived || isCancelled;
  }, []);

  // Image error handling with stable white background
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    // Use transparent SVG to maintain white background container
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48L3N2Zz4=';
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

  // Status legend items
  const statusLegendItems = useMemo(() => [
    { label: 'On Time', color: 'yellow' },
    { label: 'Delayed', color: 'red' },
    { 
      label: showArrivals ? 'Landed' : 'Boarding', 
      color: showArrivals ? 'green' : 'blue' 
    },
    { 
      label: showArrivals ? 'Arrived' : 'Departed', 
      color: 'green' 
    },
    { label: 'Cancelled', color: 'red' },
  ], [showArrivals]);

  return (
    <div className={`min-h-screen ${bgColor} text-white p-4 transition-colors duration-500`}>
      {/* Header */}
      <div className="w-[95%] mx-auto mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className={`text-4xl lg:text-5xl font-black ${showArrivals ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-yellow-400 to-orange-400'} bg-clip-text text-transparent`}>
                {title}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time flight information • {showArrivals ? 'Incoming flights' : 'Outgoing flights'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-cyan-400">
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

        {/* Status Legend */}
        <div className="flex flex-wrap gap-2 mb-3 justify-center">
          {statusLegendItems.map((item) => (
            <div 
              key={item.label} 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10"
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-${item.color}-400`} />
              <span className="text-xs font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flight Board */}
      <div className="w-[95%] mx-auto">
        {loading && currentFlights.length === 0 ? (
          <div className="text-center p-8">
            <div className="inline-flex items-center gap-4">
              <div className={`w-8 h-8 border-4 ${showArrivals ? 'border-blue-400' : 'border-yellow-400'} border-t-transparent rounded-full animate-spin`} />
              <span className="text-lg text-slate-300">Loading flight information...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 p-3 bg-white/10 border-b border-white/10 font-bold text-slate-300 text-base uppercase tracking-wide">
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>TIME</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                <span>FLIGHT</span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{showArrivals ? 'ORIGIN' : 'DESTINATION'}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span>STATUS</span>
              </div>
              {showArrivals ? (
                <div className="col-span-3 flex items-center gap-2">
                  <Luggage className="w-5 h-5" />
                  <span>BAGGAGE BELT</span>
                </div>
              ) : (
                <>
                  <div className="col-span-1 flex items-center gap-2">
                    <span>TERMINAL</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    <DoorOpen className="w-5 h-5" />
                    <span>GATE</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>CHECK-IN</span>
                  </div>
                </>
              )}
            </div>

            {/* Flight Rows */}
            <div className="divide-y divide-white/5 max-h-[75vh] overflow-y-auto">
              {currentFlights.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Plane className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <div className="text-lg">No {title.toLowerCase()} scheduled</div>
                </div>
              ) : (
                currentFlights.map((flight, index) => {
                  const shouldBlink = shouldBlinkRow(flight, showArrivals);
                  const isCancelled = flight.StatusEN.toLowerCase().includes('cancelled') || 
                                    flight.StatusEN.toLowerCase().includes('otkazan');
                  
                  return (
                    <div
                      key={`${flight.FlightNumber}-${index}`}
                      className={`grid grid-cols-12 gap-3 p-2 items-center transition-all duration-200 hover:bg-white/5
                        ${shouldBlink ? 'animate-row-blink' : ''}
                        ${index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'}`}
                      style={{ minHeight: '55px' }}
                    >
                      {/* Time */}
                      <div className="col-span-2">
                        <div className="text-2xl font-mono font-bold">
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
                          <div className="text-sm text-yellow-400 animate-blink mt-0.5 font-semibold">
                            Est: {flight.EstimatedDepartureTime}
                          </div>
                        )}
                      </div>

                      {/* Flight Info with Stable White Background */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg p-1 shadow flex items-center justify-center">
                            <img
                              src={flight.AirlineLogoURL}
                              alt={flight.AirlineName}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={handleImageError}
                            />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">{flight.FlightNumber}</div>
                            <div className="text-sm text-slate-400 truncate max-w-[120px] font-medium">
                              {flight.AirlineName}
                            </div>
                          </div>
                        </div>
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            +{flight.CodeShareFlights.length} codeshare
                          </div>
                        )}
                      </div>

                      {/* Destination/Origin */}
                      <div className="col-span-3">
                        <div className="text-xl font-bold text-white truncate">
                          {flight.DestinationCityName}
                        </div>
                        <div className={`text-lg font-mono font-bold ${showArrivals ? 'text-cyan-400' : 'text-orange-400'}`}>
                          {flight.DestinationAirportCode}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <div className={`text-base font-semibold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
                          {isCancelled ? (
                            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded border border-red-500/20">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span>Cancelled</span>
                            </div>
                          ) : flight.StatusEN?.toLowerCase() === 'processing' ? (
                            <div className="flex items-center gap-2 bg-green-400/10 px-3 py-1 rounded border border-green-400/20">
                              <span className="w-3 h-3 rounded-full bg-green-400 animate-blink" />
                              <span>Check-in Open</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {shouldBlink && <Info className="w-4 h-4" />}
                              <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {showArrivals ? (
                        /* Baggage */
                        <div className="col-span-3 text-center">
                          <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
                            {flight.BaggageReclaim || '-'}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Terminal */}
                          <div className="col-span-1 text-center">
                            <div className={`
                              inline-flex items-center justify-center 
                              w-12 h-12 rounded-full 
                              font-black text-xl
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
                            <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
                              {flight.GateNumber || '-'}
                            </div>
                          </div>

                          {/* Check-In */}
                          <div className="col-span-1 text-center">
                            <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
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

      {/* Footer */}
      <div className="w-[95%] mx-auto mt-3 text-center">
        <div className="text-slate-500 text-xs">
          <div className="flex items-center justify-center gap-4 mb-1">
            <span>Live Updates</span>
            <span>•</span>
            <span>Auto Refresh</span>
            <span>•</span>
            <span>Switches every 25s</span>
          </div>
          <div>Flight information updates every minute • Shows arrived/departed flights for 15 minutes</div>
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
      `}</style>
    </div>
  );
}