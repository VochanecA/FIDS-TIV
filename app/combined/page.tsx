'use client';

import { JSX, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
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


// Language configuration
const LANGUAGE_CONFIG = {
  en: { 
    arrivals: 'ARRIVALS', 
    departures: 'DEPARTURES',
    realTimeInfo: 'Real-time flight information',
    incomingFlights: 'Incoming flights',
    outgoingFlights: 'Outgoing flights',
    tableHeaders: {
      scheduled: 'Scheduled',
      estimated: 'Estimated',
      flight: 'Flight',
      from: 'From',
      destination: 'Destination',
      terminal: 'Terminal',
      checkIn: 'Check-In',
      gate: 'Gate',
      status: 'Status',
      baggageBelt: 'Baggage Belt'
    }
  },
  bs: { 
    arrivals: 'DOLASCI', 
    departures: 'POLASCI',
    realTimeInfo: 'Informacije o letovima u realnom vremenu',
    incomingFlights: 'Dolazni letovi',
    outgoingFlights: 'Odlazni letovi',
    tableHeaders: {
      scheduled: 'Planirano',
      estimated: 'Očekivano',
      flight: 'Let',
      from: 'Od',
      destination: 'Destinacija',
      terminal: 'Terminal',
      checkIn: 'Check-In',
      gate: 'Izlaz',
      status: 'Status',
      baggageBelt: 'Traka za prtljag'
    }
  },
  de: { 
    arrivals: 'ANKÜNFTE', 
    departures: 'ABFLÜGE',
    realTimeInfo: 'Echtzeit-Fluginformationen',
    incomingFlights: 'Ankommende Flüge',
    outgoingFlights: 'Abfliegende Flüge',
    tableHeaders: {
      scheduled: 'Geplant',
      estimated: 'Geschätzt',
      flight: 'Flug',
      from: 'Von',
      destination: 'Ziel',
      terminal: 'Terminal',
      checkIn: 'Check-In',
      gate: 'Gate',
      status: 'Status',
      baggageBelt: 'Gepäckband'
    }
  },
  fr: { 
    arrivals: 'ARRIVÉES', 
    departures: 'DÉPARTS',
    realTimeInfo: 'Informations de vol en temps réel',
    incomingFlights: 'Vols entrants',
    outgoingFlights: 'Vols sortants',
    tableHeaders: {
      scheduled: 'Prévu',
      estimated: 'Estimé',
      flight: 'Vol',
      from: 'De',
      destination: 'Destination',
      terminal: 'Terminal',
      checkIn: 'Enregist.',
      gate: 'Porte',
      status: 'Statut',
      baggageBelt: 'Tapis à bagages'
    }
  },
  he: { 
    arrivals: 'טיסות נכנסות', 
    departures: 'טיסות יוצאות',
    realTimeInfo: 'מידע טיסות בזמן אמת',
    incomingFlights: 'טיסות נכנסות',
    outgoingFlights: 'טיסות יוצאות',
    tableHeaders: {
      scheduled: 'מתוכנן',
      estimated: 'משוער',
      flight: 'טיסה',
      from: 'מ',
      destination: 'יעד',
      terminal: 'טרמינל',
      checkIn: 'צ׳ק-אין',
      gate: 'שער',
      status: 'סטטוס',
      baggageBelt: 'מסוע מזוודות'
    }
  },
  // ko: { 
  //   arrivals: '도착', 
  //   departures: '출발',
  //   realTimeInfo: '실시간 항공 정보',
  //   incomingFlights: '도착 항공편',
  //   outgoingFlights: '출발 항공편',
  //   tableHeaders: {
  //     scheduled: '예정',
  //     estimated: '예상',
  //     flight: '항공편',
  //     from: '출발지',
  //     destination: '도착지',
  //     terminal: '터미널',
  //     checkIn: '체크인',
  //     gate: '게이트',
  //     status: '상태',
  //     baggageBelt: '수하물 벨트'
  //   }
  // }
  tr: { 
  arrivals: 'Varış', 
  departures: 'Kalkış',
  realTimeInfo: 'Gerçek Zamanlı Uçuş Bilgisi',
  incomingFlights: 'Varış Uçuşları',
  outgoingFlights: 'Kalkış Uçuşları',
  tableHeaders: {
    scheduled: 'Planlanan',
    estimated: 'Tahmini',
    flight: 'Uçuş',
    from: 'Kalkış Yeri',
    destination: 'Varış Yeri',
    terminal: 'Terminal',
    checkIn: 'Check-in',
    gate: 'Kapı',
    status: 'Durum',
    baggageBelt: 'Bagaj Bandı'
  }
}

};

// Base64 placeholder image
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzQzQzU0Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTdCNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiPk5vIExvZ288L3RleHQ+Cjwvc3ZnPgo=';

export default function CombinedPage(): JSX.Element {
  const [arrivals, setArrivals] = useState<Flight[]>([]);
  const [departures, setDepartures] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showArrivals, setShowArrivals] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [ledState, setLedState] = useState<boolean>(false);
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState<number>(0);

  
  // Memoized time formatter - improved version
  const formatTime = useCallback((timeString: string): string => {
    if (!timeString) return '';
    // Handle both "HHmm" and "HH:mm" formats
    const cleanTime = timeString.replace(':', '');
    if (cleanTime.length === 4) {
      return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
    }
    return timeString; // Return original if format doesn't match
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

  // LED blinking effect for various statuses
  useEffect(() => {
    const ledInterval = setInterval(() => {
      setLedState(prev => !prev);
    }, 500); // Blink every 500ms

    return () => clearInterval(ledInterval);
  }, []);

  // Language rotation effect
  useEffect(() => {
    const languageInterval = setInterval(() => {
      setCurrentLanguageIndex(prev => (prev + 1) % Object.keys(LANGUAGE_CONFIG).length);
    }, 4000); // Change language every 5 seconds

    return () => clearInterval(languageInterval);
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

      const cleanTime = timeStr.replace(':', '');
      if (cleanTime.length === 4) {
        const [hours, minutes] = [cleanTime.substring(0, 2), cleanTime.substring(2, 4)].map(Number);
        const flightDate = new Date(now);
        flightDate.setHours(hours, minutes, 0, 0);
        return flightDate;
      }
      return null;
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
        
        // Limit flights to maximum 12
        const filteredArrivals = filterArrivedFlights(data.arrivals).slice(0, 12);
        const filteredDepartures = getUniqueDeparturesWithDeparted(data.departures).slice(0, 12);
        
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
    }, 20000);

    return () => clearInterval(switchInterval);
  }, []);
  // Dodajte ovaj useEffect u combined/page.tsx (nakon drugih useEffect-ova)

// Check if Electron API is available on mount
// Enhanced Electron detection
useEffect(() => {
  const detectElectron = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    
    console.log('🎯 Electron Environment Check:');
    console.log('  User Agent:', navigator.userAgent);
    console.log('  Is Electron:', isElectron);
    console.log('  window.electronAPI:', window.electronAPI);
    console.log('  window.require:', !!(window as any).require);
    console.log('  process.versions:', !!(window as any).process?.versions);
    
    if (isElectron) {
      console.log('🚀 Running in Electron environment');
      
      // Testiraj electronAPI ako je dostupan
      if (window.electronAPI) {
        console.log('✅ electronAPI is available with methods:', Object.keys(window.electronAPI));
        
        // Testiraj quitApp metod
        setTimeout(() => {
          if (window.electronAPI?.test) {
            try {
              const testResult = window.electronAPI.test();
              console.log('✅ electronAPI test successful:', testResult);
            } catch (err) {
              console.error('❌ electronAPI test failed:', err);
            }
          }
        }, 1000);
      } else {
        console.warn('⚠️ electronAPI is not available on window object');
        
        // Pokusaj da pronadjes API na drugim mestima
        if ((window as any).electron) {
          console.log('✅ Found electron API on window.electron');
          window.electronAPI = (window as any).electron;
        }
      }
    } else {
      console.log('🌐 Running in regular browser environment');
    }
  };

  // Pokreni detekciju odmah
  detectElectron();

  // Ponovi detekciju nakon sto se stranica fully load
  window.addEventListener('load', detectElectron);
  
  // Ponovi detekciju nakon 3 sekunde (fallback)
  const timeoutId = setTimeout(detectElectron, 3000);

  return () => {
    window.removeEventListener('load', detectElectron);
    clearTimeout(timeoutId);
  };
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
    if (statusLower.includes('on time')|| statusLower.includes('na vrijeme')) {
      return 'text-yellow-400';
    }
    return 'text-slate-300';
  }, []);

  // Check if flight is delayed
  const isDelayed = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('delay') || statusLower.includes('kasni');
  }, []);

  // Check if flight is boarding (for LED effect)
  const isBoarding = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('boarding') || statusLower.includes('gate open');
  }, []);

  // Check if flight is processing
  const isProcessing = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('processing');
  }, []);

  // Check if flight is early (for arrivals)
  const isEarly = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('earlier') || statusLower.includes('ranije') || statusLower.includes('prije vremena');
  }, []);

  // Check if flight is cancelled
  const isCancelled = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('cancelled') || statusLower.includes('otkazan');
  }, []);

  // Check if flight is on time
  const isOnTime = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('on time') || statusLower.includes('na vrijeme');
  }, []);

  // Check if flight is diverted
  const isDiverted = useCallback((flight: Flight): boolean => {
    const statusLower = flight.StatusEN.toLowerCase();
    return statusLower.includes('diverted') || statusLower.includes('preusmjeren');
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
    const isCancelledFlight = isCancelled(flight);
    const isDelayedFlight = isDelayed(flight);
    const isDivertedFlight = isDiverted(flight);

    return isArrived || isDeparted || isCancelledFlight || isDelayedFlight || isDivertedFlight;
  }, [isDelayed, isCancelled, isDiverted]);

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

  const sortedCurrentFlights = useMemo(() => 
    sortFlightsByScheduledTime(currentFlights).slice(0, 12), // Ensure max 12 flights
  [currentFlights, sortFlightsByScheduledTime]
  );

  // Get current language configuration
  const currentLanguage = useMemo(() => {
    const languages = Object.keys(LANGUAGE_CONFIG);
    const currentLang = languages[currentLanguageIndex] as keyof typeof LANGUAGE_CONFIG;
    return LANGUAGE_CONFIG[currentLang];
  }, [currentLanguageIndex]);

  const title = useMemo(() => 
    showArrivals ? currentLanguage.arrivals : currentLanguage.departures, 
    [showArrivals, currentLanguage]
  );

  const subtitle = useMemo(() => 
    showArrivals ? currentLanguage.incomingFlights : currentLanguage.outgoingFlights, 
    [showArrivals, currentLanguage]
  );

  const bgColor = useMemo(() => 
    showArrivals 
      ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
      : 'bg-gradient-to-br from-[#12001A] via-[#2A0040] to-[#12001A]', 

      //'bg-gradient-to-br from-[#12001A] via-[#2A0040] to-[#12001A]'
      //'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'

    [showArrivals]
  );

  // Header configuration for different views
  const tableHeaders = useMemo(() => {
    if (showArrivals) {
      return [
        { label: currentLanguage.tableHeaders.scheduled, span: 1, icon: Clock },
        { label: currentLanguage.tableHeaders.estimated, span: 1, icon: Clock },
        { label: currentLanguage.tableHeaders.flight, span: 2, icon: Plane },
        { label: currentLanguage.tableHeaders.from, span: 3, icon: MapPin },
        { label: currentLanguage.tableHeaders.status, span: 3, icon: Info },
        { label: currentLanguage.tableHeaders.baggageBelt, span: 2, icon: Luggage }
      ];
    } else {
      return [
        { label: currentLanguage.tableHeaders.scheduled, span: 1, icon: Clock },
        { label: currentLanguage.tableHeaders.estimated, span: 1, icon: Clock },
        { label: currentLanguage.tableHeaders.flight, span: 2, icon: Plane },
        { label: currentLanguage.tableHeaders.destination, span: 2, icon: MapPin },
        { label: currentLanguage.tableHeaders.terminal, span: 1, icon: DoorOpen },
        { label: currentLanguage.tableHeaders.checkIn, span: 1, icon: Users },
        { label: currentLanguage.tableHeaders.gate, span: 1, icon: DoorOpen },
        { label: currentLanguage.tableHeaders.status, span: 3, icon: Info }
      ];
    }
  }, [showArrivals, currentLanguage]);

  // LED indicator component
  const LEDIndicator = useCallback(({ 
    color, 
    isActive 
  }: { 
    color: 'blue' | 'green' | 'orange' | 'red' | 'yellow';
    isActive: boolean;
  }) => {
    const colorClasses = {
      blue: isActive ? 'bg-blue-400' : 'bg-blue-800',
      green: isActive ? 'bg-green-400' : 'bg-green-800',
      orange: isActive ? 'bg-orange-400' : 'bg-orange-800',
      red: isActive ? 'bg-red-400' : 'bg-red-800',
      yellow: isActive ? 'bg-yellow-400' : 'bg-yellow-800'
    };

    return (
      <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
    );
  }, []);
   // --- Electron Close ---
const handleClose = useCallback(() => {
  console.log('🔴 Close button clicked!');
  
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  console.log('Electron environment:', isElectron);
  console.log('electronAPI available:', !!window.electronAPI);
  
  if (!isElectron) {
    console.log('⚠️ Not in Electron - ignoring close');
    return;
  }

  // Glavna metoda: koristi electronAPI iz preload.js
  if (window.electronAPI?.quitApp) {
    console.log('✅ Using electronAPI.quitApp()');
    try {
      window.electronAPI.quitApp();
      return;
    } catch (error) {
      console.error('❌ electronAPI.quitApp failed:', error);
    }
  }

  // Fallback metoda
  console.log('🔄 electronAPI not available, using fallback');
  
  // Probaj window.electron (alternativni exposure)
  if ((window as any).electron?.quitApp) {
    console.log('✅ Using window.electron.quitApp()');
    (window as any).electron.quitApp();
    return;
  }

  // Finalni fallback - postMessage
  console.log('🔄 Using postMessage fallback');
  window.postMessage({ type: 'ELECTRON_QUIT_APP' }, '*');
  
}, []);


  return (
    <div className={`h-screen ${bgColor} text-white p-2 transition-colors duration-500 flex flex-col`}>
    {/* === CLOSE BUTTON (Electron quit) === */}
{/* === CLOSE BUTTON - small size === */}
<button 
  onClick={handleClose}
  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600/80 hover:bg-blue-700/80 active:bg-blue-800/80 text-white shadow-md cursor-pointer z-50 transition-all duration-200 hover:scale-110 active:scale-95 select-none"
  title="Close App"
  style={{ 
    border: 'none',
    outline: 'none'
  }}
  type="button"
>
  <span className="text-xl font-bold leading-none flex items-center justify-center w-full h-full">
    ×
  </span>
</button>


      {/* Header - Reduced margin */}
      <div className="w-[95%] mx-auto mb-2 flex-shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-orange-400 text-xl mt-0.5">
                {currentLanguage.realTimeInfo} • {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[5rem] font-bold text-cyan-300">
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
        {loading && sortedCurrentFlights.length === 0 ? (
          <div className="text-center p-8 h-full flex items-center justify-center">
            <div className="inline-flex items-center gap-3">
              <div className={`w-6 h-6 border-4 ${showArrivals ? 'border-blue-400' : 'border-yellow-400'} border-t-transparent rounded-full animate-spin`} />
              <span className="text-base text-slate-300">Loading flight information...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 p-1 bg-white/10 border-b border-white/10 font-semibold text-slate-300 text-xl uppercase tracking-wider flex-shrink-0">
              {tableHeaders.map((header) => {
                const IconComponent = header.icon;
                return (
                  <div 
                    key={header.label}
                    className={`col-span-${header.span} flex items-center gap-1 justify-center`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{header.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Flight Rows - Maximum height with scrolling */}
            <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
              {sortedCurrentFlights.length === 0 ? (
                <div className="p-6 text-center text-slate-400 h-full flex items-center justify-center">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No {title.toLowerCase()} scheduled</div>
                </div>
              ) : (
                sortedCurrentFlights.map((flight, index) => {
                  const shouldBlink = shouldBlinkRow(flight, showArrivals);
                  const isCancelledFlight = isCancelled(flight);
                  const isDelayedFlight = isDelayed(flight);
                  const isBoardingFlight = !showArrivals && isBoarding(flight);
                  const isProcessingFlight = isProcessing(flight);
                  const isEarlyFlight = showArrivals && isEarly(flight);
                  const isOnTimeFlight = isOnTime(flight);
                  const isDivertedFlight = isDiverted(flight);

                  return (
                    <div
                      key={`${flight.FlightNumber}-${index}-${flight.ScheduledDepartureTime}`}
                      className={`grid grid-cols-12 gap-1 p-1 items-center transition-all duration-300 hover:bg-white/5
                        ${shouldBlink ? 'animate-row-blink' : ''}
                        ${index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'}`}
                      style={{ minHeight: '45px' }}
                    >
                      {/* Scheduled Time - FIXED */}
                      <div className="col-span-1 text-center">
                        <div className="text-4xl font-mono font-bold text-white">
                          {flight.ScheduledDepartureTime ? (
                            formatTime(flight.ScheduledDepartureTime)
                          ) : (
                            <span className="text-slate-400">--:--</span>
                          )}
                        </div>
                      </div>

                      {/* Estimated Time */}
                      <div className="col-span-1 text-center">
                        {flight.EstimatedDepartureTime && 
                         flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime ? (
                          <div className="text-4xl font-mono font-bold text-yellow-400">
                            {formatTime(flight.EstimatedDepartureTime)}
                          </div>
                        ) : (
                          <div className="text-lg text-slate-500">-</div>
                        )}
                      </div>

                      {/* Flight Info with Next.js Image */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <div className="relative w-8 h-8 bg-white rounded p-0.5 shadow">
                            <Image
                              src={flight.AirlineLogoURL || placeholderImage}
                              alt={`${flight.AirlineName} logo`}
                              width={32}
                              height={32}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.src = placeholderImage;
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-4xl font-black text-white">{flight.FlightNumber}</div>
                            {/* <div className="text-xs text-slate-400 truncate max-w-[90px]">
                              {flight.AirlineName}
                            </div> */}
                          </div>
                        </div>
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0">
                            +{flight.CodeShareFlights.length} codeshare
                          </div>
                        )}
                      </div>

                      {showArrivals ? (
                        <>
                          {/* Origin - Using available properties */}
                          <div className="col-span-3">
                            <div className="text-4xl font-bold text-white truncate">
                              {flight.DestinationCityName || flight.DestinationAirportName}
                            </div>
                            <div className="text-lg font-mono text-orange-400 font-bold">
                              {flight.DestinationAirportCode}
                            </div>
                          </div>

                          {/* Status with LED indicators for ARRIVALS */}
                          <div className="col-span-3">
                            <div className={`text-4xl font-semibold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
                              {isCancelledFlight ? (
                                <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 justify-center">
                                  {/* Red LED indicators for cancelled */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="red" isActive={ledState} />
                                    <LEDIndicator color="red" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span>Cancelled</span>
                                </div>
                              ) : isDivertedFlight ? (
                                <div className="flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded border border-red-400/20 justify-center">
                                  {/* Red LED indicators for diverted */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="red" isActive={ledState} />
                                    <LEDIndicator color="red" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                  <span>Diverted</span>
                                </div>
                              ) : isDelayedFlight ? (
                                <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 justify-center">
                                  {/* Orange LED indicators for delay */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="orange" isActive={ledState} />
                                    <LEDIndicator color="orange" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-orange-400" />
                                  <span>Delayed</span>
                                </div>
                              ) : isEarlyFlight ? (
                                <div className="flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 justify-center">
                                  {/* Green LED indicators for early */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="green" isActive={ledState} />
                                    <LEDIndicator color="green" isActive={!ledState} />
                                  </div>
                                  <span>Earlier</span>
                                </div>
                              ) : isOnTimeFlight ? (
                                <div className="flex items-center gap-1 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20 justify-center">
                                  {/* <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 justify-center">  */}
                                  {/* Yellow LED indicators for on time */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="yellow" isActive={ledState} />
                                    <LEDIndicator color="yellow" isActive={!ledState} />
                                  </div>
                                  <span>On Time</span>
                                </div>
                              ) : flight.StatusEN?.toLowerCase().includes('arrived') || 
                                  flight.StatusEN?.toLowerCase().includes('sletio') ? (
                                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 justify-center">
                                  <span className="w-3 h-3 rounded-full bg-green-500 animate-blink" />
                                  <span>Arrived</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 justify-center">
                                  {shouldBlink && <Info className="w-4 h-4" />}
                                  <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Baggage Belt */}
                          <div className="col-span-2 text-center">
                            <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
                              {flight.BaggageReclaim || '-'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Destination */}
                          <div className="col-span-2">
                            <div className="text-4xl font-bold text-white truncate">
                              {flight.DestinationCityName}
                            </div>
                            <div className="text-lg font-mono text-orange-400 font-bold">
                              {flight.DestinationAirportCode}
                            </div>
                          </div>

                          {/* Terminal */}
                          <div className="col-span-1 text-center">
                            <div className={`
                              inline-flex items-center justify-center 
                              w-10 h-10 rounded-full
                              font-bold text-xl
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

                          {/* Check-In */}
                          <div className="col-span-1 text-center">
                            <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
                              {flight.CheckInDesk || '-'}
                            </div>
                          </div>

                          {/* Gate */}
                          <div className="col-span-1 text-center">
                            <div className="text-2xl font-black text-white bg-slate-800/50 py-1 rounded">
                              {flight.GateNumber || '-'}
                            </div>
                          </div>

                          {/* Status with LED indicators for DEPARTURES */}
                          <div className="col-span-3">
                            <div className={`text-4xl font-semibold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
                              {isCancelledFlight ? (
                                <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 justify-center">
                                  {/* Red LED indicators for cancelled */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="red" isActive={ledState} />
                                    <LEDIndicator color="red" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span>Cancelled</span>
                                </div>
                              ) : isDivertedFlight ? (
                                <div className="flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded border border-red-400/20 justify-center">
                                  {/* Red LED indicators for diverted */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="red" isActive={ledState} />
                                    <LEDIndicator color="red" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                  <span>Diverted</span>
                                </div>
                              ) : isDelayedFlight ? (
                                <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 justify-center">
                                  {/* Orange LED indicators for delay */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="orange" isActive={ledState} />
                                    <LEDIndicator color="orange" isActive={!ledState} />
                                  </div>
                                  <AlertCircle className="w-4 h-4 text-orange-400" />
                                  <span>Delayed</span>
                                </div>
                              ) : isProcessingFlight ? (
                                <div className="flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 justify-center">
                                  {/* Green LED indicators for processing */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="green" isActive={ledState} />
                                    <LEDIndicator color="green" isActive={!ledState} />
                                  </div>
                                  <span>Check-in Open</span>
                                </div>
                              ) : isBoardingFlight ? (
                                <div className="flex items-center gap-1 justify-center">
                                  {/* Blue LED indicators for boarding */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="blue" isActive={ledState} />
                                    <LEDIndicator color="blue" isActive={!ledState} />
                                  </div>
                                  <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                                </div>
                              ) : isOnTimeFlight ? (
                                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 justify-center">
                                  {/* Yellow LED indicators for on time */}
                                  <div className="flex gap-1 mr-2">
                                    <LEDIndicator color="yellow" isActive={ledState} />
                                    <LEDIndicator color="yellow" isActive={!ledState} />
                                  </div>
                                  <span>On Time</span>
                                </div>
                              ) : flight.StatusEN?.toLowerCase().includes('departed') || 
                                  flight.StatusEN?.toLowerCase().includes('poletio') ? (
                                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 justify-center">
                                  <span className="w-3 h-3 rounded-full bg-green-500 animate-blink" />
                                  <span>Departed</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 justify-center">
                                  {shouldBlink && <Info className="w-4 h-4" />}
                                  <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
                                </div>
                              )}
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
          <div>Flight information updates every minute • Switches every 20s</div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        }
        .animate-blink {
          animation: blink 800ms infinite;
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