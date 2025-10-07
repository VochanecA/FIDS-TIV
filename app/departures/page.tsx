'use client';

import { useEffect, useState } from 'react';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getUniqueDeparturesWithDeparted } from '@/lib/flight-service';
import { AlertCircle, Info, Plane, Clock, MapPin, Users, DoorOpen } from 'lucide-react';

export default function DeparturesPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const loadFlights = async () => {
      try {
        setLoading(true);
        const data = await fetchFlightData();
        
        // KORISTITE NOVU FUNKCIJU UMJESTO filterDepartedFlights
        const filteredFlights = getUniqueDeparturesWithDeparted(data.departures);
        
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

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('departed') || statusLower.includes('poletio')) return 'text-green-500';
    if (statusLower.includes('delay') || statusLower.includes('kasni')) return 'text-red-400';
    if (statusLower.includes('boarding') || statusLower.includes('gate open')) return 'text-blue-400';
    if (statusLower.includes('on time')) return 'text-yellow-400';
    if (statusLower.includes('processing')) return 'text-green-400';
    return 'text-slate-300';
  };

  const shouldBlinkRow = (flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    const isDeparted = statusLower.includes('departed') || statusLower.includes('poletio');
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('otkazan');
    
    return isDeparted || isCancelled;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = 'https://via.placeholder.com/180x120?text=No+Logo';
  };

  const formatTerminal = (terminal?: string): string => {
    if (!terminal) return '-';
    return terminal.replace('T0', 'T').replace('T', 'T ');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-2 transition-all duration-500 flex flex-col">
      {/* Header - Reduced margin */}
      <div className="w-[95%] mx-auto mb-2 flex-shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                DEPARTURES
              </h1>
              <p className="text-orange-400 text-lg mt-0.5">
                Real-time departure information • Outgoing flights
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
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Flight Board - Maximum height */}
      <div className="w-[95%] mx-auto flex-1 min-h-0">
        {loading && flights.length === 0 ? (
          <div className="text-center p-8 h-full flex items-center justify-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base text-slate-300">Loading departure information...</span>
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
                <span>Destination</span>
              </div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center">Terminal</div>
              <div className="col-span-1 flex items-center gap-1">
                <DoorOpen className="w-3 h-3" />
                <span>Gate</span>
              </div>
              <div className="col-span-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Check-In</span>
              </div>
            </div>

            {/* Flight Rows - Maximum height with scrolling */}
            <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
              {flights.length === 0 ? (
                <div className="p-6 text-center text-slate-400 h-full flex items-center justify-center">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No departures scheduled</div>
                </div>
              ) : (
                flights.map((flight, index) => {
                  const shouldBlink = shouldBlinkRow(flight);
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

                      {/* Destination */}
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
                        <div className={`text-2xl font-semibold ${getStatusColor(flight.StatusEN)}`}>
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
          <div>Departure information updates every minute</div>
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