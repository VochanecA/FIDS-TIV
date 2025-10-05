'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image'; // ✅ import Next.js Image
import type { Flight } from '@/types/flight';
import { fetchFlightData } from '@/lib/flight-service';
import { AlertCircle, Info, Plane, Clock, MapPin, Luggage } from 'lucide-react';

export default function ArrivalsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

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
    if (statusLower.includes('arrived') || statusLower.includes('sletio')) return 'text-green-400';
    if (statusLower.includes('delay') || statusLower.includes('kasni')) return 'text-red-400';
    if (statusLower.includes('landing') || statusLower.includes('approach')) return 'text-blue-400';
    if (statusLower.includes('on time')) return 'text-yellow-400';
    return 'text-slate-300';
  };

  const shouldBlinkRow = (flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    const isArrived = statusLower.includes('arrived') || statusLower.includes('sletio') || statusLower.includes('landed');
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('otkazan');
    return isArrived || isCancelled;
  };

  const formatTerminal = (terminal?: string): string => {
    if (!terminal) return '-';
    return terminal === 'T01' ? 'T1' : terminal === 'T02' ? 'T2' : terminal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white p-4 transition-all duration-500 overflow-hidden">
      {/* ...header section unchanged... */}

      <div className="w-[95%] mx-auto">
        {!loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-sm uppercase tracking-wider">
              <div className="col-span-2 flex items-center gap-1"><Clock className="w-4 h-4" /><span>Time</span></div>
              <div className="col-span-3">Flight</div>
              <div className="col-span-3 flex items-center gap-1"><MapPin className="w-4 h-4" /><span>Origin</span></div>
              <div className="col-span-2 md:col-span-2 sm:col-span-1">Status</div> {/* ✅ narrower in portrait */}
              <div className="col-span-1">Terminal</div>
              <div className="col-span-1 flex items-center gap-1"><Luggage className="w-4 h-4" /><span>Belt</span></div>
            </div>

            {/* Flight Rows */}
            <div className="divide-y divide-white/5 max-h-[75vh] overflow-y-auto no-scrollbar">
              {flights.map((flight, index) => {
                const shouldBlink = shouldBlinkRow(flight);
                const isCancelled = flight.StatusEN.toLowerCase().includes('cancelled') || flight.StatusEN.toLowerCase().includes('otkazan');

                return (
                  <div
                    key={`${flight.FlightNumber}-${index}`}
                    className={`grid grid-cols-12 gap-2 p-3 items-center transition-all duration-300 hover:bg-white/5
                      ${shouldBlink ? 'animate-row-blink' : ''}`}
                  >
                    {/* ✅ Next.js Image instead of <img> */}
                    <div className="col-span-3 flex items-center gap-2">
                      <Image
                        src={flight.AirlineLogoURL || 'https://via.placeholder.com/180x120?text=No+Logo'}
                        alt={flight.AirlineName}
                        width={40}
                        height={40}
                        className="object-contain bg-white rounded-lg p-1 shadow w-8 h-8"
                        onError={() => console.warn('Logo not found')}
                      />
                      <div>
                        <div className="text-lg font-black text-white">{flight.FlightNumber}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[120px]">
                          {flight.AirlineName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Hide scrollbars globally */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (orientation: portrait) {
          .col-span-2.md\\:col-span-2.sm\\:col-span-1 {
            grid-column: span 1 / span 1;
          }
        }
      `}</style>
    </div>
  );
}
