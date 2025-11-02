// 'use client';

// import { JSX, useEffect, useState, useCallback, useMemo } from 'react';
// import type { Flight } from '@/types/flight';
// import { fetchFlightData, getUniqueDeparturesWithDeparted } from '@/lib/flight-service';
// import { AlertCircle, Info, Plane, Clock, MapPin, Users, Luggage, DoorOpen } from 'lucide-react';
// import WeatherIcon from '@/components/weather-icon';
// import { useWeather } from '@/hooks/use-weather';

// interface FlightDataResponse {
//   departures: Flight[];
//   arrivals: Flight[];
//   lastUpdated: string;
//   source?: 'live' | 'cached' | 'fallback';
//   error?: string;
//   warning?: string;
// }

// // Language configuration
// const LANGUAGE_CONFIG = {
//   en: { 
//     arrivals: 'ARRIVALS', 
//     departures: 'DEPARTURES',
//     realTimeInfo: 'Real-time flight information',
//     incomingFlights: 'Incoming flights',
//     outgoingFlights: 'Outgoing flights',
//     tableHeaders: {
//       scheduled: 'Scheduled',
//       estimated: 'Estimated',
//       flight: 'Flight',
//       from: 'From',
//       destination: 'Destination',
//       terminal: 'Ter.',
//       checkIn: 'Check-In',
//       gate: 'Gate',
//       status: 'Status',
//       baggageBelt: 'Baggage Belt'
//     }
//   },
//   bs: { 
//     arrivals: 'DOLASCI', 
//     departures: 'POLASCI',
//     realTimeInfo: 'Informacije o letovima u realnom vremenu',
//     incomingFlights: 'Dolazni letovi',
//     outgoingFlights: 'Odlazni letovi',
//     tableHeaders: {
//       scheduled: 'Planirano',
//       estimated: 'Očekivano',
//       flight: 'Let',
//       from: 'Od',
//       destination: 'Destinacija',
//       terminal: 'Ter.',
//       checkIn: 'Check-In',
//       gate: 'Izlaz',
//       status: 'Status',
//       baggageBelt: 'Traka za prtljag'
//     }
//   },
//   de: { 
//     arrivals: 'ANKÜNFTE', 
//     departures: 'ABFLÜGE',
//     realTimeInfo: 'Echtzeit-Fluginformationen',
//     incomingFlights: 'Ankommende Flüge',
//     outgoingFlights: 'Abfliegende Flüge',
//     tableHeaders: {
//       scheduled: 'Geplant',
//       estimated: 'Geschätzt',
//       flight: 'Flug',
//       from: 'Von',
//       destination: 'Ziel',
//       terminal: 'Ter.',
//       checkIn: 'Check-In',
//       gate: 'Gate',
//       status: 'Status',
//       baggageBelt: 'Gepäckband'
//     }
//   },
//   fr: { 
//     arrivals: 'ARRIVÉES', 
//     departures: 'DÉPARTS',
//     realTimeInfo: 'Informations de vol en temps réel',
//     incomingFlights: 'Vols entrants',
//     outgoingFlights: 'Vols sortants',
//     tableHeaders: {
//       scheduled: 'Prévu',
//       estimated: 'Estimé',
//       flight: 'Vol',
//       from: 'De',
//       destination: 'Destination',
//       terminal: 'Ter.',
//       checkIn: 'Enregist.',
//       gate: 'Porte',
//       status: 'Statut',
//       baggageBelt: 'Tapis à bagages'
//     }
//   },
//   he: { 
//     arrivals: 'טיסות נכנסות', 
//     departures: 'טיסות יוצאות',
//     realTimeInfo: 'מידע טיסות בזמן אמת',
//     incomingFlights: 'טיסות נכנסות',
//     outgoingFlights: 'טיסות יוצאות',
//     tableHeaders: {
//       scheduled: 'מתוכנן',
//       estimated: 'משוער',
//       flight: 'טיסה',
//       from: 'מ',
//       destination: 'יעד',
//       terminal: 'טרמינל',
//       checkIn: 'צ׳ק-אין',
//       gate: 'שער',
//       status: 'סטטוס',
//       baggageBelt: 'מסוע מזוודות'
//     }
//   },
//   tr: { 
//     arrivals: 'Varış', 
//     departures: 'Kalkış',
//     realTimeInfo: 'Gerçek Zamanlı Uçuş Bilgisi',
//     incomingFlights: 'Varış Uçuşları',
//     outgoingFlights: 'Kalkış Uçuşları',
//     tableHeaders: {
//       scheduled: 'Planlanan',
//       estimated: 'Tahmini',
//       flight: 'Uçuş',
//       from: 'Kalkış Yeri',
//       destination: 'Varış Yeri',
//       terminal: 'Ter.',
//       checkIn: 'Check-in',
//       gate: 'Kapı',
//       status: 'Durum',
//       baggageBelt: 'Bagaj Bandı'
//     }
//   }
// };

// // Flightaware logo URL generator
// const getFlightawareLogoURL = (icaoCode: string): string => {
//   if (!icaoCode) return 'https://via.placeholder.com/180x120?text=No+Logo';
//   return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
// };

// // Placeholder image
// const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzQzQzU0Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTdCNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiPk5vIExvZ288L3RleHQ+Cjwvc3ZnPgo=';

// // Weather Display komponenta
// // const WeatherDisplay = ({ flight, isArrival }: { flight: Flight; isArrival: boolean }) => {
// //   const destination = {
// //     cityName: flight.DestinationCityName,
// //     airportCode: flight.DestinationAirportCode,
// //     airportName: flight.DestinationAirportName
// //   };
  
// //   const weather = useWeather(destination);
  
// //   // Ne prikazuj weather ako se učitava ili je greška
// //   if (weather.loading || weather.error) {
// //     return null;
// //   }
  
// //   return (
// //     <div className="flex items-center ml-2">
// // <WeatherIcon 
// //   code={weather.weatherCode} 
// //   temperature={weather.temperature}
// //   size={18}        // Veličina ikonice
// //   textSize={24}    // Veličina teksta temperature
// // />
// //     </div>
// //   );
// // };

// export default function CombinedPage(): JSX.Element {
//   const [arrivals, setArrivals] = useState<Flight[]>([]);
//   const [departures, setDepartures] = useState<Flight[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [showArrivals, setShowArrivals] = useState<boolean>(true);
//   const [lastUpdate, setLastUpdate] = useState<string>('');
//   const [currentTime, setCurrentTime] = useState<string>('');
//   const [ledState, setLedState] = useState<boolean>(false);
//   const [currentLanguageIndex, setCurrentLanguageIndex] = useState<number>(0);

//   // Time formatter
//   const formatTime = useCallback((timeString: string): string => {
//     if (!timeString) return '';
//     const cleanTime = timeString.replace(':', '');
//     if (cleanTime.length === 4) {
//       return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
//     }
//     return timeString;
//   }, []);

//   // Sort flights
//   const sortFlightsByScheduledTime = useCallback((flights: Flight[]): Flight[] => {
//     return [...flights].sort((a, b) => {
//       const timeA = a.ScheduledDepartureTime || '99:99';
//       const timeB = b.ScheduledDepartureTime || '99:99';
//       return timeA.localeCompare(timeB);
//     });
//   }, []);

//   // Time & LED & Language intervals
//   useEffect(() => {
//     setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
//     const timeInterval = setInterval(() => {
//       setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
//     }, 1000);
//     return () => clearInterval(timeInterval);
//   }, []);

//   useEffect(() => {
//     const ledInterval = setInterval(() => setLedState(prev => !prev), 500);
//     return () => clearInterval(ledInterval);
//   }, []);

//   useEffect(() => {
//     const languageInterval = setInterval(() => {
//       setCurrentLanguageIndex(prev => (prev + 1) % Object.keys(LANGUAGE_CONFIG).length);
//     }, 4000);
//     return () => clearInterval(languageInterval);
//   }, []);

//   // Filter arrived flights
//   const filterArrivedFlights = useCallback((allFlights: Flight[]): Flight[] => {
//     const now = new Date();
//     const isArrived = (status: string): boolean => status.toLowerCase().includes('arrived') || status.toLowerCase().includes('sletio') || status.toLowerCase().includes('landed');

//     const getFlightDateTime = (flight: Flight): Date | null => {
//       const timeStr = flight.EstimatedDepartureTime || flight.ScheduledDepartureTime;
//       if (!timeStr) return null;
//       const cleanTime = timeStr.replace(':', '');
//       if (cleanTime.length === 4) {
//         const [hours, minutes] = [cleanTime.substring(0, 2), cleanTime.substring(2, 4)].map(Number);
//         const flightDate = new Date(now);
//         flightDate.setHours(hours, minutes, 0, 0);
//         return flightDate;
//       }
//       return null;
//     };

//     const getFifteenMinutesAfterFlight = (flight: Flight): Date | null => {
//       const flightTime = getFlightDateTime(flight);
//       return flightTime ? new Date(flightTime.getTime() + 15 * 60 * 1000) : null;
//     };

//     const arrivedFlights: Flight[] = [];
//     const activeFlights: Flight[] = [];

//     allFlights.forEach((flight) => {
//       if (isArrived(flight.StatusEN)) arrivedFlights.push(flight);
//       else activeFlights.push(flight);
//     });

//     const sortedArrivedFlights = arrivedFlights.sort((a, b) => {
//       const timeA = getFlightDateTime(a);
//       const timeB = getFlightDateTime(b);
//       if (!timeA || !timeB) return 0;
//       return timeB.getTime() - timeA.getTime();
//     });

//     const recentArrivedFlights = sortedArrivedFlights.filter((flight) => {
//       const fifteenMinutesAfter = getFifteenMinutesAfterFlight(flight);
//       return fifteenMinutesAfter && fifteenMinutesAfter >= now;
//     });

//     return sortFlightsByScheduledTime([...activeFlights, ...recentArrivedFlights]);
//   }, [sortFlightsByScheduledTime]);

//   // Load flights
//   useEffect(() => {
//     const loadFlights = async (): Promise<void> => {
//       try {
//         setLoading(true);
//         const data: FlightDataResponse = await fetchFlightData();
//         const filteredArrivals = filterArrivedFlights(data.arrivals).slice(0, 12);
//         const filteredDepartures = getUniqueDeparturesWithDeparted(data.departures).slice(0, 12);
//         setArrivals(filteredArrivals);
//         setDepartures(filteredDepartures);
//         setLastUpdate(new Date().toLocaleTimeString('en-GB'));
//       } catch (error) {
//         console.error('Failed to load flights:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadFlights();
//     const fetchInterval = setInterval(loadFlights, 60000);
//     return () => clearInterval(fetchInterval);
//   }, [filterArrivedFlights]);

//   // Auto-switch
//   useEffect(() => {
//     const switchInterval = setInterval(() => setShowArrivals(prev => !prev), 20000);
//     return () => clearInterval(switchInterval);
//   }, []);

//   // Image error handler
//   const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
//     e.currentTarget.src = placeholderImage;
//     e.currentTarget.style.display = 'block';
//   }, []);

//   // Status color
//   const getStatusColor = useCallback((status: string, isArrival: boolean): string => {
//     const s = status.toLowerCase();
//     if (s.includes('cancelled') || s.includes('otkazan')) return 'text-red-500';
//     if (s.includes('processing')) return 'text-yellow-300';
//     if (isArrival) {
//       if (s.includes('arrived') || s.includes('sletio')) return 'text-green-400';
//     } else {
//       if (s.includes('departed') || s.includes('poletio')) return 'text-green-400';
//       if (s.includes('boarding') || s.includes('gate open')) return 'text-blue-400';
//     }
//     if (s.includes('delay') || s.includes('kasni')) return 'text-red-400';
//     if (s.includes('on time') || s.includes('na vrijeme')) return 'text-yellow-400';
//     return 'text-slate-100';
//   }, []);

//   // Status checks
//   const isDelayed = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('delay') || f.StatusEN.toLowerCase().includes('kasni'), []);
//   const isBoarding = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('boarding') || f.StatusEN.toLowerCase().includes('gate open'), []);
//   const isProcessing = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('processing'), []);
//   const isEarly = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('earlier') || f.StatusEN.toLowerCase().includes('ranije'), []);
//   const isCancelled = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('cancelled') || f.StatusEN.toLowerCase().includes('otkazan'), []);
//   const isOnTime = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('on time') || f.StatusEN.toLowerCase().includes('na vrijeme'), []);
//   const isDiverted = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes('diverted') || f.StatusEN.toLowerCase().includes('preusmjeren'), []);

//   const shouldBlinkRow = useCallback((flight: Flight, isArrival: boolean): boolean => {
//     const s = flight.StatusEN.toLowerCase();
//     const arrived = isArrival && (s.includes('arrived') || s.includes('sletio') || s.includes('landed'));
//     const departed = !isArrival && (s.includes('departed') || s.includes('poletio'));
//     return arrived || departed || isCancelled(flight) || isDelayed(flight) || isDiverted(flight);
//   }, [isDelayed, isCancelled, isDiverted]);

//   const formatTerminal = useCallback((terminal?: string): string => {
//     if (!terminal) return '-';
//     return terminal.replace('T0', 'T').replace('T', 'T ');
//   }, []);

//   // Memoized values
//   const currentFlights = useMemo(() => showArrivals ? arrivals : departures, [showArrivals, arrivals, departures]);
//   const sortedCurrentFlights = useMemo(() => sortFlightsByScheduledTime(currentFlights).slice(0, 9), [currentFlights, sortFlightsByScheduledTime]);
//   const currentLanguage = useMemo(() => {
//     const languages = Object.keys(LANGUAGE_CONFIG);
//     return LANGUAGE_CONFIG[languages[currentLanguageIndex] as keyof typeof LANGUAGE_CONFIG];
//   }, [currentLanguageIndex]);
//   const title = useMemo(() => showArrivals ? currentLanguage.arrivals : currentLanguage.departures, [showArrivals, currentLanguage]);
//   const subtitle = useMemo(() => showArrivals ? currentLanguage.incomingFlights : currentLanguage.outgoingFlights, [showArrivals, currentLanguage]);
//   const bgColor = useMemo(() => showArrivals ? 'bg-gradient-to-br from-blue-700 via-blue-900 to-blue-700' : 'bg-gradient-to-br from-[#490056] via-[#6f107f] to-[#490056]', [showArrivals]);

//   // UJEDNAČENE ŠIRINE – SMANJENA VREMENA
//   const tableHeaders = useMemo(() => {
//     if (showArrivals) {
//       return [
//         { label: currentLanguage.tableHeaders.scheduled, width: '220px', icon: Clock },
//         { label: currentLanguage.tableHeaders.estimated, width: '220px', icon: Clock },
//         { label: currentLanguage.tableHeaders.flight, width: '200px', icon: Plane },
//         { label: currentLanguage.tableHeaders.from, width: '400px', icon: MapPin },
//         { label: currentLanguage.tableHeaders.status, width: '400px', icon: Info },
//         { label: currentLanguage.tableHeaders.baggageBelt, width: '330px', icon: Luggage }
//       ];
//     } else {
//       return [
//         { label: currentLanguage.tableHeaders.scheduled, width: '220px', icon: Clock },
//         { label: currentLanguage.tableHeaders.estimated, width: '220px', icon: Clock },
//         { label: currentLanguage.tableHeaders.flight, width: '400px', icon: Plane },
//         { label: currentLanguage.tableHeaders.destination, width: '400px', icon: MapPin },
//         { label: currentLanguage.tableHeaders.terminal, width: '150px', icon: DoorOpen },
//         { label: currentLanguage.tableHeaders.checkIn, width: '300px', icon: Users },
//         { label: currentLanguage.tableHeaders.gate, width: '270px', icon: DoorOpen },
//         { label: currentLanguage.tableHeaders.status, width: '450px', icon: Info }
//       ];
//     }
//   }, [showArrivals, currentLanguage]);

//   const LEDIndicator = useCallback(({ color, isActive }: { color: 'blue' | 'green' | 'orange' | 'red' | 'yellow'; isActive: boolean }) => {
//     const colors = {
//       blue: isActive ? 'bg-blue-400' : 'bg-blue-800',
//       green: isActive ? 'bg-green-400' : 'bg-green-800',
//       orange: isActive ? 'bg-orange-400' : 'bg-orange-800',
//       red: isActive ? 'bg-red-400' : 'bg-red-800',
//       yellow: isActive ? 'bg-yellow-400' : 'bg-yellow-800'
//     };
//     return <div className={`w-3 h-3 rounded-full ${colors[color]}`} />;
//   }, []);

//   const handleClose = useCallback(() => {
//     if ((window as any).electronAPI?.quitApp) {
//       (window as any).electronAPI.quitApp();
//       return;
//     }
//     if ((window as any).chrome?.webview) {
//       try { (window as any).chrome.webview.postMessage('APP_QUIT'); return; } catch (e) {}
//     }
//     window.postMessage({ type: 'ELECTRON_APP_QUIT' }, '*');
//     try { if (window.parent !== window) window.parent.postMessage({ type: 'ELECTRON_APP_QUIT' }, '*'); } catch (e) {}
//     window.location.reload();
//   }, []);

//   return (
//     <div className={`h-screen ${bgColor} text-white p-2 transition-colors duration-500 flex flex-col`}>
//       {/* Close Button */}
//       <button onClick={handleClose} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600/30 hover:bg-blue-700/50 active:bg-blue-800/50 text-white shadow-lg cursor-pointer z-50 transition-all duration-200 hover:scale-110 active:scale-95 select-none border-none outline-none" title="Close App">
//         <span className="text-xl font-bold text-white leading-none flex items-center justify-center w-full h-full pointer-events-none">X</span>
//       </button>

//       {/* Header */}
//       <div className="w-[95%] mx-auto mb-2 flex-shrink-0">
//         <div className="flex flex-col lg:flex-row justify-between items-center gap-2 mb-2">
//           <div className="flex items-center gap-2">
//             <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
//               <Plane className="w-10 h-10 text-blue-400" />
//             </div>
//             <div>
//               <h1 className="text-5xl lg:text-[6.3rem] font-black bg-gradient-to-r text-yellow-300 bg-clip-text text-transparent">
//                 {title}
//               </h1>
//               <p className="text-yellow-400 text-xl mt-0.5">
//                 {currentLanguage.realTimeInfo} • {subtitle}
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="text-right">
//               <div className="text-[7rem] font-bold text-white">{currentTime || '--:--'}</div>
//               {/* {lastUpdate && <div className="text-xs text-slate-400">Updated: {lastUpdate}</div>} */}
//             </div>
//             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//           </div>
//         </div>
//       </div>

//       {/* Flight Board */}
//       <div className="w-[98%] mx-auto flex-1 min-h-0">
//         {loading && sortedCurrentFlights.length === 0 ? (
//           <div className="text-center p-6 h-full flex items-center justify-center">
//             <div className="inline-flex items-center gap-3">
//               <div className={`w-6 h-6 border-4 ${showArrivals ? 'border-blue-400' : 'border-yellow-400'} border-t-transparent rounded-full animate-spin`} />
//               <span className="text-base text-slate-300">Loading flight information...</span>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
//             {/* Table Header */}
//             <div className="flex gap-1 p-0 bg-yellow-300 border-b border-white/10 font-bold text-black text-[1.6rem] uppercase tracking-wider flex-shrink-0">
//               {tableHeaders.map((header) => {
//                 const IconComponent = header.icon;
//                 return (
//                   <div key={header.label} className="flex items-center justify-center gap-1 px-2" style={{ width: header.width }}>
//                     <IconComponent className="w-4 h-4" />
//                     <span className="truncate">{header.label}</span>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Flight Rows - ALTERNATE COLORS */}
//             <div className="flex-1 overflow-y-auto">
//               {sortedCurrentFlights.length === 0 ? (
//                 <div className="p-6 text-center text-slate-400 h-full flex items-center justify-center">
//                   <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
//                   <div className="text-sm">No {title.toLowerCase()} scheduled</div>
//                 </div>
//               ) : (
//                 sortedCurrentFlights.map((flight, index) => {
//                   const shouldBlink = shouldBlinkRow(flight, showArrivals);
//                   const isCancelledFlight = isCancelled(flight);
//                   const isDelayedFlight = isDelayed(flight);
//                   const isBoardingFlight = !showArrivals && isBoarding(flight);
//                   const isProcessingFlight = isProcessing(flight);
//                   const isEarlyFlight = showArrivals && isEarly(flight);
//                   const isOnTimeFlight = isOnTime(flight);
//                   const isDivertedFlight = isDiverted(flight);
//                   const flightawareLogoURL = getFlightawareLogoURL(flight.AirlineICAO);

//                   // ALTERNATE ROW COLORS
//                   const rowColorClass = index % 2 === 0 
//                     ? 'bg-white/20'  // svaki drugi red - svjetlija pozadina
//                     : 'bg-white/5';  // svaki drugi red - tamnija pozadina

//                   return (
//                     <div
//                       key={`${flight.FlightNumber}-${index}-${flight.ScheduledDepartureTime}`}
//                       className={`flex gap-1 p-1 transition-all duration-300 hover:bg-white/10
//                         ${shouldBlink ? 'animate-row-blink' : ''}
//                         ${rowColorClass}`}
//                       style={{ minHeight: '60px' }}
//                     >
//                       {/* Scheduled */}
//                       <div className="flex items-center justify-center" style={{ width: '220px' }}>
//                         <div className="text-5xl font-bold text-white">
//                           {flight.ScheduledDepartureTime ? formatTime(flight.ScheduledDepartureTime) : <span className="text-slate-400">--:--</span>}
//                         </div>
//                       </div>

//                       {/* Estimated */}
//                       <div className="flex items-center justify-center" style={{ width: '250px' }}>
//                         {flight.EstimatedDepartureTime && flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime ? (
//                           <div className="text-5xl font-bold text-yellow-400">
//                             {formatTime(flight.EstimatedDepartureTime)}
//                           </div>
//                         ) : (
//                           <div className="text-lg text-slate-500">-</div>
//                         )}
//                       </div>

//                       {/* Flight Info */}
//                       <div className="flex items-center" style={{ width: showArrivals ? '300px' : '400px' }}>
//                         <div className="flex items-center gap-3">
//                           <div className="relative w-[80px] h-12 bg-white rounded-lg p-1 shadow flex items-center justify-center">
//                             <img src={flightawareLogoURL} alt={`${flight.AirlineName} logo`} className="object-contain w-full h-full" onError={handleImageError} />
//                           </div>
//                           <div className="text-[2.7rem] font-black text-white">{flight.FlightNumber}</div>
//                         </div>
//                         {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
//                           <div className="text-xs text-slate-500 ml-1">+{flight.CodeShareFlights.length}</div>
//                         )}
//                       </div>

//                       {showArrivals ? (
//                         <>
//                           {/* From sa vremenom */}
//                           <div className="flex-1 flex items-center ml-2" style={{ minWidth: '330px' }}>
//                             <div className="flex items-center gap-2">
//                               <div className="text-[3.1rem] font-bold text-white truncate">
//                                 {flight.DestinationCityName || flight.DestinationAirportName}
//                               </div>
//                               {/* <WeatherDisplay flight={flight} isArrival={true} /> */}
//                             </div>
//                           </div>

//                           {/* Status */}
//                           <div className="flex items-center justify-left" style={{ width: '440px' }}>
//                             <div className={`text-4xl font-bold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
//                               {isCancelledFlight ? (
//                                 <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="red" isActive={ledState} />
//                                     <LEDIndicator color="red" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-red-500" />
//                                   <span>Cancelled</span>
//                                 </div>
//                               ) : isDivertedFlight ? (
//                                 <div className="flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="red" isActive={ledState} />
//                                     <LEDIndicator color="red" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-red-400" />
//                                   <span>Diverted</span>
//                                 </div>
//                               ) : isDelayedFlight ? (
//                                 <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="orange" isActive={ledState} />
//                                     <LEDIndicator color="orange" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-orange-400" />
//                                   <span>Delayed</span>
//                                 </div>
//                               ) : isEarlyFlight ? (
//                                 <div className="flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="green" isActive={ledState} />
//                                     <LEDIndicator color="green" isActive={!ledState} />
//                                   </div>
//                                   <span>Earlier</span>
//                                 </div>
//                               ) : isOnTimeFlight ? (
//                                 <div className="flex items-center gap-1 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="yellow" isActive={ledState} />
//                                     <LEDIndicator color="yellow" isActive={!ledState} />
//                                   </div>
//                                   <span>On Time</span>
//                                 </div>
//                               ) : flight.StatusEN?.toLowerCase().includes('arrived') ? (
//                                 <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
//                                   <span className="w-3 h-3 rounded-full bg-green-500 animate-blink" />
//                                   <span>Arrived</span>
//                                 </div>
//                               ) : (
//                                 <div className="flex items-center gap-1">
//                                   {shouldBlink && <Info className="w-4 h-4" />}
//                                   <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
//                                 </div>
//                               )}
//                             </div>
//                           </div>

//                           {/* Baggage */}
//                           <div className="flex items-center justify-left" style={{ width: '250px' }}>
//                             <div className="text-4xl font-black text-white bg-slate-800/50 py-1 px-2 rounded">
//                               {flight.BaggageReclaim || '-'}
//                             </div>
//                           </div>
//                         </>
//                       ) : (
//                         <>
//                           {/* Destination sa vremenom */}
//                           <div className="flex items-center" style={{ width: '400px' }}>
//                             <div className="flex items-center gap-2">
//                               <div className="text-[3.1rem] font-bold text-white truncate">
//                                 {flight.DestinationCityName || flight.DestinationAirportName}
//                               </div>
//                               {/* <WeatherDisplay flight={flight} isArrival={false} /> */}
//                             </div>
//                           </div>

//                           {/* Terminal */}
//                           <div className="flex items-center justify-left" style={{ width: '100px' }}>
//                             <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full font-bold text-3xl
//                               ${flight.Terminal === 'T1' || flight.Terminal === 'T01' ? 'bg-blue-500 text-white' 
//                               : flight.Terminal === 'T2' || flight.Terminal === 'T02' ? 'bg-orange-500 text-white'
//                               : 'bg-slate-800/50 text-white'}`}>
//                               {formatTerminal(flight.Terminal)}
//                             </div>
//                           </div>

//                           {/* Check-In */}
//                           <div className="flex items-center justify-center" style={{ width: '270px' }}>
//                             <div className="text-3xl font-black text-white bg-slate-800/50 py-1 px-2 rounded">
//                               {flight.CheckInDesk || '-'}
//                             </div>
//                           </div>

//                           {/* Gate */}
//                           <div className="flex items-center justify-center" style={{ width: '270px' }}>
//                             <div className="text-3xl font-black text-white bg-slate-800/50 py-1 px-2 rounded">
//                               {flight.GateNumber || '-'}
//                             </div>
//                           </div>

//                           {/* Status */}
//                           <div className="flex items-center justify-center" style={{ width: '400px' }}>
//                             <div className={`text-4xl font-semibold ${getStatusColor(flight.StatusEN, showArrivals)}`}>
//                               {isCancelledFlight ? (
//                                 <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="red" isActive={ledState} />
//                                     <LEDIndicator color="red" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-red-500" />
//                                   <span>Cancelled</span>
//                                 </div>
//                               ) : isDivertedFlight ? (
//                                 <div className="flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="red" isActive={ledState} />
//                                     <LEDIndicator color="red" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-red-400" />
//                                   <span>Diverted</span>
//                                 </div>
//                               ) : isDelayedFlight ? (
//                                 <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="orange" isActive={ledState} />
//                                     <LEDIndicator color="orange" isActive={!ledState} />
//                                   </div>
//                                   <AlertCircle className="w-4 h-4 text-orange-400" />
//                                   <span>Delayed</span>
//                                 </div>
//                               ) : isProcessingFlight ? (
//                                 <div className="flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="yellow" isActive={ledState} />
//                                     <LEDIndicator color="yellow" isActive={!ledState} />
//                                   </div>
//                                   <span>Check-in Open</span>
//                                 </div>
//                               ) : isBoardingFlight ? (
//                                 <div className="flex items-center gap-1">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="blue" isActive={ledState} />
//                                     <LEDIndicator color="blue" isActive={!ledState} />
//                                   </div>
//                                   <span className="truncate">{flight.StatusEN || 'Boarding'}</span>
//                                 </div>
//                               ) : isOnTimeFlight ? (
//                                 <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
//                                   <div className="flex gap-1">
//                                     <LEDIndicator color="yellow" isActive={ledState} />
//                                     <LEDIndicator color="yellow" isActive={!ledState} />
//                                   </div>
//                                   <span>On Time</span>
//                                 </div>
//                               ) : flight.StatusEN?.toLowerCase().includes('departed') ? (
//                                 <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
//                                   <span className="w-3 h-3 rounded-full bg-green-500 animate-blink" />
//                                   <span>Departed</span>
//                                 </div>
//                               ) : (
//                                 <div className="flex items-center gap-1">
//                                   {shouldBlink && <Info className="w-4 h-4" />}
//                                   <span className="truncate">{flight.StatusEN || 'Scheduled'}</span>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         )}
//       </div>

// {/* Footer */}
// {/* Footer */}
// <div className="w-[95%] mx-auto mt-1 text-center flex-shrink-0">
//   <div className="text-slate-400 text-xs py-1">
//     {/* Prvi red - Info */}
//     <div className="flex items-center justify-center gap-1 mb-1">
//       <span className="text-slate-300">Code: alen.vocanec@apm.co.me</span>
//       <span>•</span>
//       <span>Auto Refresh</span>
//       <span>•</span>
//       <span>Updates: 1min</span>
//       <span>•</span>
//       <span>Switches: 20s</span>
//     </div>
    
//     {/* Drugi red - Trčeći tekst sa sigurnosnim porukama */}
//     <div className="overflow-hidden relative">
//       <div className=" whitespace-nowrap">
//         <span className="text-yellow-300 font-semibold text-lg mx-4">
//           ⚠️ DEAR PASSENGERS, PLEASE DO NOT LEAVE YOUR BAGGAGE UNATTENDED AT THE AIRPORT - UNATTENDED BAGGAGE WILL BE CONFISCATED AND DESTROYED • 
//         </span>
       
//       </div>
//     </div>
//   </div>
// </div>

// <style jsx global>{`
//   @keyframes marquee {
//     0% { transform: translateX(100%); }
//     100% { transform: translateX(-100%); }
//   }
//   .animate-marquee {
//     animation: marquee 180s linear infinite;
//     display: inline-block;
//   }
// `}</style>

// {/* Dodajte ovaj CSS u vaš postojeći style tag */}
// <style jsx global>{`
//   @keyframes marquee {
//     0% { transform: translateX(100%); }
//     100% { transform: translateX(-100%); }
//   }
//   .animate-marquee {
//     animation: marquee 120s linear infinite;
//     display: inline-block;
//   }
// `}</style>
//      {/* Animations */}
// <style jsx global>{`
//   @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.3; } }
//   @keyframes row-blink { 
//     0%, 50% { 
//       background-color: rgba(255, 255, 255, 0.3); 
//     } 
//     51%, 100% { 
//       background-color: rgba(255, 255, 255, 0.2); 
//     } 
//   }
//   .animate-blink { animation: blink 800ms infinite; }
//   .animate-row-blink { animation: row-blink 800ms infinite; }
//   ::-webkit-scrollbar { width: 4px; }
//   ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
//   ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 2px; }
//   ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.5); }
//   html, body { overflow: hidden; margin: 0; padding: 0; height: 100vh; }
//   #__next { height: 100vh; }
// `}</style>
//     </div>
//   );
// }
"use client"

import type React from "react"
import { type JSX, useEffect, useState, useCallback, useMemo } from "react"
import type { Flight } from "@/types/flight"
import { fetchFlightData, getUniqueDeparturesWithDeparted } from "@/lib/flight-service"
import { AlertCircle, Info, Plane, Clock, MapPin, Users, Luggage, DoorOpen, Cloud } from "lucide-react"
import WeatherIcon from "@/components/weather-icon"
import { useWeather } from "@/hooks/use-weather"

// ⚡⚡⚡ OVDJE MOŽETE PROMIJENITI POZADINSKE BOJE ⚡⚡⚡
const COLOR_CONFIG = {
  arrivals: {
    background: "bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950",
    accent: "bg-cyan-400",
    header: "bg-white",
    title: "text-white",
    subtitle: "text-cyan-200",
    border: "border-cyan-400",
  },
  departures: {
    background: "bg-gradient-to-br from-[#490029] via-[#7D185E] to-[#390018]",
    accent: "bg-purple-500",
    header: "bg-yellow-400",
    title: "text-yellow-400",
    subtitle: "text-purple-200",
    border: "border-purple-500",
  },
}

interface FlightDataResponse {
  departures: Flight[]
  arrivals: Flight[]
  lastUpdated: string
  source?: "live" | "cached" | "fallback"
  error?: string
  warning?: string
}

// Language configuration
const LANGUAGE_CONFIG = {
  en: {
    arrivals: "ARRIVALS",
    departures: "DEPARTURES",
    realTimeInfo: "Real-time flight information",
    incomingFlights: "Incoming flights",
    outgoingFlights: "Outgoing flights",
    tableHeaders: {
      scheduled: "Scheduled",
      estimated: "Estimated",
      flight: "Flight",
      from: "From",
      destination: "Destination",
      weather: "Weather",
      terminal: "Ter.",
      checkIn: "Check-In",
      gate: "Gate",
      status: "Status",
      baggageBelt: "Baggage Belt",
    },
  },
  bs: {
    arrivals: "DOLASCI",
    departures: "POLASCI",
    realTimeInfo: "Informacije o letovima u realnom vremenu",
    incomingFlights: "Dolazni letovi",
    outgoingFlights: "Odlazni letovi",
    tableHeaders: {
      scheduled: "Planirano",
      estimated: "Očekivano",
      flight: "Let",
      from: "Od",
      destination: "Destinacija",
      weather: "Vrijeme",
      terminal: "Ter.",
      checkIn: "Check-In",
      gate: "Izlaz",
      status: "Status",
      baggageBelt: "Traka za prtljag",
    },
  },
  // ... ostali jezici
}

const getFlightawareLogoURL = (icaoCode: string): string => {
  if (!icaoCode) return "https://via.placeholder.com/180x120?text=No+Logo"
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`
}

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzQzQzU0Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTdCNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiPk5vIExvZ288L3RleHQ+Cjwvc3ZnPgo="

// OPTIMIZIRANA WeatherDisplay komponenta za Electron
const WeatherDisplay = ({ flight, isArrival }: { flight: Flight; isArrival: boolean }) => {
  const destination = useMemo(() => ({
    cityName: flight.DestinationCityName,
    airportCode: flight.DestinationAirportCode,
    airportName: flight.DestinationAirportName,
  }), [flight.DestinationCityName, flight.DestinationAirportCode, flight.DestinationAirportName])

  // Provide the second numeric argument required by useWeather (e.g. 0 to disable auto-refresh)
  const weather = useWeather(destination, 0)

  // Poboljšano učitavanje za Electron
  if (weather.loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (weather.error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Cloud className="w-5 h-5 text-white/30" />
      </div>
    )
  }

  // Dodajte provjeru za validne weather podatke
  if (!weather.weatherCode || weather.temperature == null) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Cloud className="w-5 h-5 text-white/30" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <WeatherIcon 
        code={weather.weatherCode} 
        temperature={weather.temperature}
        size={18}
        textSize={24}
      />
    </div>
  )
}

// LED Indicator komponenta
const LEDIndicator = ({ 
  color, 
  isActive,
  size = "w-3 h-3"
}: { 
  color: "blue" | "green" | "orange" | "red" | "yellow" | "cyan" | "purple" | "lime"; 
  isActive: boolean;
  size?: string;
}) => {
  const colors = {
    blue: isActive ? "bg-blue-400 shadow-lg shadow-blue-400/50" : "bg-blue-900",
    green: isActive ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-green-900",
    orange: isActive ? "bg-orange-400 shadow-lg shadow-orange-400/50" : "bg-orange-900",
    red: isActive ? "bg-red-400 shadow-lg shadow-red-400/50" : "bg-red-900",
    yellow: isActive ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" : "bg-yellow-900",
    cyan: isActive ? "bg-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-cyan-900",
    purple: isActive ? "bg-purple-400 shadow-lg shadow-purple-400/50" : "bg-purple-900",
    lime: isActive ? "bg-lime-400 shadow-lg shadow-lime-400/50" : "bg-lime-900",
  }
  return <div className={`${size} rounded-full ${colors[color]} transition-all duration-200`} />
}

export default function CombinedPage(): JSX.Element {
  const [arrivals, setArrivals] = useState<Flight[]>([])
  const [departures, setDepartures] = useState<Flight[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showArrivals, setShowArrivals] = useState<boolean>(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [ledState, setLedState] = useState<boolean>(false)
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState<number>(0)

  const currentColors = useMemo(() => (showArrivals ? COLOR_CONFIG.arrivals : COLOR_CONFIG.departures), [showArrivals])

  const formatTime = useCallback((timeString: string): string => {
    if (!timeString) return ""
    const cleanTime = timeString.replace(":", "")
    if (cleanTime.length === 4) {
      return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`
    }
    return timeString
  }, [])

  const sortFlightsByScheduledTime = useCallback((flights: Flight[]): Flight[] => {
    return [...flights].sort((a, b) => {
      const timeA = a.ScheduledDepartureTime || "99:99"
      const timeB = b.ScheduledDepartureTime || "99:99"
      return timeA.localeCompare(timeB)
    })
  }, [])

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    const ledInterval = setInterval(() => {
      setLedState((prev) => !prev)
    }, 500)
    return () => clearInterval(ledInterval)
  }, [])

  useEffect(() => {
    const languageInterval = setInterval(() => {
      setCurrentLanguageIndex((prev) => (prev + 1) % Object.keys(LANGUAGE_CONFIG).length)
    }, 4000)
    return () => clearInterval(languageInterval)
  }, [])

  const filterArrivedFlights = useCallback(
    (allFlights: Flight[]): Flight[] => {
      const now = new Date()
      const isArrived = (status: string): boolean =>
        status.toLowerCase().includes("arrived") ||
        status.toLowerCase().includes("sletio") ||
        status.toLowerCase().includes("landed")

      const getFlightDateTime = (flight: Flight): Date | null => {
        const timeStr = flight.EstimatedDepartureTime || flight.ScheduledDepartureTime
        if (!timeStr) return null
        const cleanTime = timeStr.replace(":", "")
        if (cleanTime.length === 4) {
          const [hours, minutes] = [cleanTime.substring(0, 2), cleanTime.substring(2, 4)].map(Number)
          const flightDate = new Date(now)
          flightDate.setHours(hours, minutes, 0, 0)
          return flightDate
        }
        return null
      }

      const getFifteenMinutesAfterFlight = (flight: Flight): Date | null => {
        const flightTime = getFlightDateTime(flight)
        return flightTime ? new Date(flightTime.getTime() + 15 * 60 * 1000) : null
      }

      const arrivedFlights: Flight[] = []
      const activeFlights: Flight[] = []

      allFlights.forEach((flight) => {
        if (isArrived(flight.StatusEN)) arrivedFlights.push(flight)
        else activeFlights.push(flight)
      })

      const sortedArrivedFlights = arrivedFlights.sort((a, b) => {
        const timeA = getFlightDateTime(a)
        const timeB = getFlightDateTime(b)
        if (!timeA || !timeB) return 0
        return timeB.getTime() - timeA.getTime()
      })

      const recentArrivedFlights = sortedArrivedFlights.filter((flight) => {
        const fifteenMinutesAfter = getFifteenMinutesAfterFlight(flight)
        return fifteenMinutesAfter && fifteenMinutesAfter >= now
      })

      return sortFlightsByScheduledTime([...activeFlights, ...recentArrivedFlights])
    },
    [sortFlightsByScheduledTime],
  )

  // POBOLJŠAN useEffect za Electron
  useEffect(() => {
    let isMounted = true

    const loadFlights = async (): Promise<void> => {
      if (!isMounted) return

      try {
        setLoading(true)
        const data: FlightDataResponse = await fetchFlightData()
        
        if (!isMounted) return

        const filteredArrivals = filterArrivedFlights(data.arrivals).slice(0, 9)
        const filteredDepartures = getUniqueDeparturesWithDeparted(data.departures).slice(0, 9)
        
        setArrivals(filteredArrivals)
        setDepartures(filteredDepartures)
        setLastUpdate(new Date().toLocaleTimeString("en-GB"))
      } catch (error) {
        console.error("Failed to load flights:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFlights()
    const fetchInterval = setInterval(loadFlights, 60000)

    return () => {
      isMounted = false
      clearInterval(fetchInterval)
    }
  }, [filterArrivedFlights])

  useEffect(() => {
    const switchInterval = setInterval(() => setShowArrivals((prev) => !prev), 20000)
    return () => clearInterval(switchInterval)
  }, [])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = placeholderImage
    e.currentTarget.style.display = "block"
  }, [])

  const getStatusColor = useCallback((status: string, isArrival: boolean): string => {
    const s = status.toLowerCase()
    if (s.includes("cancelled") || s.includes("otkazan")) return "text-red-400"
    if (s.includes("processing")) return "text-lime-500"
    if (isArrival) {
      if (s.includes("arrived") || s.includes("sletio")) return "text-lime-500"
    } else {
      if (s.includes("departed") || s.includes("poletio")) return "text-lime-500"
      if (s.includes("boarding") || s.includes("gate open")) return "text-cyan-300"
    }
    if (s.includes("delay") || s.includes("kasni")) return "text-white"
    if (s.includes("on time") || s.includes("na vrijeme")) return "text-yellow-400"
    return "text-white"
  }, [])

  const isDelayed = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("delay") || f.StatusEN.toLowerCase().includes("kasni"),
    [],
  )
  const isBoarding = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("boarding") || f.StatusEN.toLowerCase().includes("gate open"),
    [],
  )
  const isProcessing = useCallback((f: Flight) => f.StatusEN.toLowerCase().includes("processing"), [])
  const isEarly = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("earlier") || f.StatusEN.toLowerCase().includes("ranije"),
    [],
  )
  const isCancelled = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("cancelled") || f.StatusEN.toLowerCase().includes("otkazan"),
    [],
  )
  const isOnTime = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("on time") || f.StatusEN.toLowerCase().includes("na vrijeme"),
    [],
  )
  const isDiverted = useCallback(
    (f: Flight) => f.StatusEN.toLowerCase().includes("diverted") || f.StatusEN.toLowerCase().includes("preusmjeren"),
    [],
  )

  const shouldBlinkStatus = useCallback(
    (flight: Flight, isArrival: boolean): boolean => {
      const s = flight.StatusEN.toLowerCase()
      const arrived = isArrival && (s.includes("arrived") || s.includes("sletio") || s.includes("landed"))
      const cancelled = isCancelled(flight)
      const boarding = !isArrival && isBoarding(flight)
      return arrived || cancelled || boarding
    },
    [isCancelled, isBoarding],
  )

  const formatTerminal = useCallback((terminal?: string): string => {
    if (!terminal) return "-"
    return terminal.replace("T0", "T").replace("T", "T ")
  }, [])

  const currentFlights = useMemo(() => (showArrivals ? arrivals : departures), [showArrivals, arrivals, departures])
  const sortedCurrentFlights = useMemo(
    () => sortFlightsByScheduledTime(currentFlights).slice(0, 9),
    [currentFlights, sortFlightsByScheduledTime],
  )
  const currentLanguage = useMemo(() => {
    const languages = Object.keys(LANGUAGE_CONFIG)
    return LANGUAGE_CONFIG[languages[currentLanguageIndex] as keyof typeof LANGUAGE_CONFIG]
  }, [currentLanguageIndex])
  const title = useMemo(
    () => (showArrivals ? currentLanguage.arrivals : currentLanguage.departures),
    [showArrivals, currentLanguage],
  )
  const subtitle = useMemo(
    () => (showArrivals ? currentLanguage.incomingFlights : currentLanguage.outgoingFlights),
    [showArrivals, currentLanguage],
  )

  const tableHeaders = useMemo(() => {
    if (showArrivals) {
      return [
        { label: currentLanguage.tableHeaders.scheduled, width: "180px", icon: Clock },
        { label: currentLanguage.tableHeaders.estimated, width: "180px", icon: Clock },
        { label: currentLanguage.tableHeaders.flight, width: "240px", icon: Plane },
        { label: currentLanguage.tableHeaders.from, width: "380px", icon: MapPin },
        { label: currentLanguage.tableHeaders.weather, width: "120px", icon: Cloud },
        { label: currentLanguage.tableHeaders.status, width: "380px", icon: Info },
        { label: currentLanguage.tableHeaders.baggageBelt, width: "200px", icon: Luggage },
      ]
    } else {
      return [
        { label: currentLanguage.tableHeaders.scheduled, width: "180px", icon: Clock },
        { label: currentLanguage.tableHeaders.estimated, width: "180px", icon: Clock },
        { label: currentLanguage.tableHeaders.flight, width: "240px", icon: Plane },
        { label: currentLanguage.tableHeaders.destination, width: "380px", icon: MapPin },
        { label: currentLanguage.tableHeaders.terminal, width: "120px", icon: DoorOpen },
        { label: currentLanguage.tableHeaders.checkIn, width: "280px", icon: Users },
        { label: currentLanguage.tableHeaders.gate, width: "160px", icon: DoorOpen },
        { label: currentLanguage.tableHeaders.status, width: "360px", icon: Info },
      ]
    }
  }, [showArrivals, currentLanguage])

  const handleClose = useCallback(() => {
    if ((window as any).electronAPI?.quitApp) {
      ;(window as any).electronAPI.quitApp()
      return
    }
    if ((window as any).chrome?.webview) {
      try {
        ;(window as any).chrome.webview.postMessage("APP_QUIT")
        return
      } catch (e) {}
    }
    window.postMessage({ type: "ELECTRON_APP_QUIT" }, "*")
    try {
      if (window.parent !== window) window.parent.postMessage({ type: "ELECTRON_APP_QUIT" }, "*")
    } catch (e) {}
    window.location.reload()
  }, [])

  // Status pill styling configuration with LED indicators
  const getStatusPillStyle = useCallback((flight: Flight, isArrival: boolean) => {
    const isCancelledFlight = isCancelled(flight)
    const isDelayedFlight = isDelayed(flight)
    const isBoardingFlight = !isArrival && isBoarding(flight)
    const isProcessingFlight = isProcessing(flight)
    const isEarlyFlight = isEarly(flight)
    const isOnTimeFlight = isOnTime(flight)
    const isDivertedFlight = isDiverted(flight)
    const shouldBlink = shouldBlinkStatus(flight, isArrival)

    let backgroundColor = "bg-white/10"
    let borderColor = "border-white/30"
    let textColor = "text-white"
    let blinkClass = ""
    let ledColor1: "blue" | "green" | "orange" | "red" | "yellow" | "cyan" | "purple" | "lime" = "blue"
    let ledColor2: "blue" | "green" | "orange" | "red" | "yellow" | "cyan" | "purple" | "lime" = "green"

    if (isCancelledFlight) {
      backgroundColor = "bg-red-500/20"
      borderColor = "border-red-500/50"
      textColor = "text-red-100"
      ledColor1 = "red"
      ledColor2 = "orange"
      blinkClass = shouldBlink ? "animate-pill-blink" : ""
    } else if (isDelayedFlight) {
      backgroundColor = "bg-yellow-500/20"
      borderColor = "border-yellow-500/50"
      textColor = "text-yellow-100"
      ledColor1 = "yellow"
      ledColor2 = "orange"
    } else if (isBoardingFlight) {
      backgroundColor = "bg-cyan-500/20"
      borderColor = "border-cyan-500/50"
      textColor = "text-cyan-100"
      ledColor1 = "cyan"
      ledColor2 = "blue"
      blinkClass = shouldBlink ? "animate-pill-blink" : ""
    } else if (isProcessingFlight) {
      backgroundColor = "bg-green-500/20"
      borderColor = "border-green-500/50"
      textColor = "text-green-100"
      ledColor1 = "green"
      ledColor2 = "lime"
    } else if (isEarlyFlight) {
      backgroundColor = "bg-purple-500/20"
      borderColor = "border-purple-500/50"
      textColor = "text-purple-100"
      ledColor1 = "purple"
      ledColor2 = "blue"
    } else if (isDivertedFlight) {
      backgroundColor = "bg-orange-500/20"
      borderColor = "border-orange-500/50"
      textColor = "text-orange-100"
      ledColor1 = "orange"
      ledColor2 = "red"
    } else if (isOnTimeFlight) {
      backgroundColor = "bg-lime-500/20"
      borderColor = "border-lime-500/50"
      textColor = "text-lime-100"
      ledColor1 = "lime"
      ledColor2 = "green"
    } else if (shouldBlink) {
      backgroundColor = "bg-green-500/20"
      borderColor = "border-green-500/50"
      textColor = "text-green-100"
      ledColor1 = "green"
      ledColor2 = "lime"
      blinkClass = "animate-pill-blink"
    }

    return {
      className: `w-[90%] flex items-center justify-center gap-3 text-[2rem] font-bold rounded-2xl border-2 px-3 py-1.5 transition-all duration-300 ${backgroundColor} ${borderColor} ${textColor} ${blinkClass}`,
      textColor,
      ledColor1,
      ledColor2
    }
  }, [isCancelled, isDelayed, isBoarding, isProcessing, isEarly, isOnTime, isDiverted, shouldBlinkStatus])

  return (
    <div className={`h-screen ${currentColors.background} text-white p-4 transition-colors duration-700 flex flex-col`}>
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 text-white shadow-2xl cursor-pointer z-50 transition-all duration-200 hover:scale-110 active:scale-95 select-none border-2 border-white/20"
        title="Close App"
      >
        <span className="text-2xl font-bold text-white leading-none flex items-center justify-center w-full h-full pointer-events-none">
          ×
        </span>
      </button>

      <div className="w-full mx-auto mb-4 flex-shrink-0">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className={`p-4 ${currentColors.accent} rounded-3xl shadow-2xl`}>
              <Plane className="w-16 h-16 text-black" />
            </div>
            <div>
              <h1
                className={`text-[6rem] font-black ${currentColors.title} leading-none tracking-tight drop-shadow-2xl`}
              >
                {title}
              </h1>
              <p className={`${currentColors.subtitle} text-2xl mt-2 font-semibold`}>{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[7rem] font-black text-white drop-shadow-2xl leading-none">
                {currentTime || "--:--"}
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full ${currentColors.accent} animate-pulse shadow-2xl`} />
          </div>
        </div>
      </div>

      {/* Flight Board */}
      <div className="w-full mx-auto flex-1 min-h-0">
        {loading && sortedCurrentFlights.length === 0 ? (
          <div className="text-center p-8 h-full flex items-center justify-center">
            <div className="inline-flex items-center gap-4">
              <div
                className={`w-8 h-8 border-4 ${currentColors.border} border-t-transparent rounded-full animate-spin`}
              />
              <span className="text-2xl text-white font-semibold">Loading flight information...</span>
            </div>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border-4 border-white/20 shadow-2xl overflow-hidden h-full flex flex-col">
            <div
              className={`flex gap-2 p-2 ${currentColors.header} border-b-4 border-black/30 font-black text-black text-[1.3rem] uppercase tracking-wider flex-shrink-0 shadow-xl`}
            >
              {tableHeaders.map((header) => {
                const IconComponent = header.icon
                return (
                  <div
                    key={header.label}
                    className="flex items-stretch justify-center gap-1 px-1 h-full"
                    style={{ width: header.width }}
                  >
                    <IconComponent className="w-5 h-5 self-center" />
                    <span className="truncate self-center">{header.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              {sortedCurrentFlights.length === 0 ? (
                <div className="p-8 text-center text-white/60 h-full flex flex-col items-center justify-center">
                  <Plane className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div className="text-2xl font-semibold">No {title.toLowerCase()} scheduled</div>
                </div>
              ) : (
                sortedCurrentFlights.map((flight, index) => {
                  const flightawareLogoURL = getFlightawareLogoURL(flight.AirlineICAO)
                  const rowColorClass = index % 2 === 0 ? "bg-white/15" : "bg-white/5"
                  const statusPillStyle = getStatusPillStyle(flight, showArrivals)

                  return (
                    <div
                      key={`${flight.FlightNumber}-${index}-${flight.ScheduledDepartureTime}`}
                      className={`flex gap-2 p-1 transition-all duration-300 hover:bg-white/20 border-b border-white/10 ${rowColorClass}`}
                      style={{ minHeight: "68px" }}
                    >
                      {/* Scheduled */}
                      <div
                        className="flex items-center justify-center"
                        style={{ width: showArrivals ? "180px" : "180px" }}
                      >
                        <div className="text-[2.5rem] font-black text-white drop-shadow-lg">
                          {flight.ScheduledDepartureTime ? (
                            formatTime(flight.ScheduledDepartureTime)
                          ) : (
                            <span className="text-white/40">--:--</span>
                          )}
                        </div>
                      </div>

                      {/* Estimated */}
                      <div
                        className="flex items-center justify-center"
                        style={{ width: showArrivals ? "180px" : "180px" }}
                      >
                        {flight.EstimatedDepartureTime &&
                        flight.EstimatedDepartureTime !== flight.ScheduledDepartureTime ? (
                          <div className={`text-[2.5rem] font-black ${currentColors.title} drop-shadow-lg`}>
                            {formatTime(flight.EstimatedDepartureTime)}
                          </div>
                        ) : (
                          <div className="text-2xl text-white/30 font-bold">-</div>
                        )}
                      </div>

                      {/* Flight Info */}
                      <div className="flex items-center gap-3" style={{ width: showArrivals ? "240px" : "240px" }}>
                        <div className="relative w-[70px] h-11 bg-white rounded-xl p-1 shadow-xl">
                          <img
                            src={flightawareLogoURL || "/placeholder.svg"}
                            alt={`${flight.AirlineName} logo`}
                            className="object-contain w-full h-full"
                            onError={handleImageError}
                          />
                        </div>
                        <div className="text-[2.4rem] font-black text-white drop-shadow-lg">{flight.FlightNumber}</div>
                        {flight.CodeShareFlights && flight.CodeShareFlights.length > 0 && (
                          <div className="text-sm text-white/50 font-bold">+{flight.CodeShareFlights.length}</div>
                        )}
                      </div>

                      {showArrivals ? (
                        <>
                          {/* From */}
                          <div className="flex items-center" style={{ width: "380px" }}>
                            <div className="text-[3.3rem] font-black text-white truncate drop-shadow-lg">
                              {flight.DestinationCityName || flight.DestinationAirportName}
                            </div>
                          </div>

                          {/* Weather - OPTIMIZIRANO ZA ELECTRON */}
                          <div className="flex items-center justify-center" style={{ width: "120px" }}>
                            <WeatherDisplay flight={flight} isArrival={true} />
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-center" style={{ width: "380px" }}>
                            <div className={statusPillStyle.className}>
                              <div className="flex items-center gap-1">
                                <LEDIndicator 
                                  color={statusPillStyle.ledColor1} 
                                  isActive={ledState}
                                  size="w-4 h-4"
                                />
                                <LEDIndicator 
                                  color={statusPillStyle.ledColor2} 
                                  isActive={!ledState}
                                  size="w-4 h-4"
                                />
                              </div>
                              {flight.StatusEN}
                            </div>
                          </div>

                          {/* Baggage */}
                          <div className="flex items-center justify-center" style={{ width: "200px" }}>
                            <div className="text-[2.5rem] font-black text-white bg-black/40 py-2 px-4 rounded-xl border-2 border-white/20 shadow-xl">
                              {flight.BaggageReclaim || "-"}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Destination */}
                          <div className="flex items-center" style={{ width: "380px" }}>
                            <div className="text-[3.3rem] font-black text-white truncate drop-shadow-lg">
                              {flight.DestinationCityName || flight.DestinationAirportName}
                            </div>
                          </div>

                          {/* Terminal */}
                          <div className="flex items-center justify-center" style={{ width: "120px" }}>
                            <div
                              className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-black text-[1.8rem] shadow-xl border-4
                              ${
                                flight.Terminal === "T1" || flight.Terminal === "T01"
                                  ? "bg-cyan-500 text-white border-cyan-300"
                                  : flight.Terminal === "T2" || flight.Terminal === "T02"
                                    ? "bg-orange-500 text-white border-orange-300"
                                    : "bg-black/40 text-white border-white/20"
                              }`}
                            >
                              {formatTerminal(flight.Terminal)}
                            </div>
                          </div>

                          {/* Check-In */}
                          <div className="flex items-center justify-center" style={{ width: "280px" }}>
                            {flight.CheckInDesk && flight.CheckInDesk !== "-" ? (
                              <div className="text-[2.5rem] font-black text-white bg-black/40 py-2 px-3 rounded-xl border-2 border-white/20 shadow-xl">
                                {flight.CheckInDesk}
                              </div>
                            ) : (
                              <div className="text-[2.5rem] font-black text-white/0 bg-transparent py-2 px-3 rounded-xl border-2 border-transparent">
                                -
                              </div>
                            )}
                          </div>

                          {/* Gate */}
                          <div className="flex items-center justify-center" style={{ width: "160px" }}>
                            {flight.GateNumber && flight.GateNumber !== "-" ? (
                              <div className="text-[2.5rem] font-black text-white bg-black/40 py-2 px-3 rounded-xl border-2 border-white/20 shadow-xl">
                                {flight.GateNumber}
                              </div>
                            ) : (
                              <div className="text-[2.5rem] font-black text-white/0 bg-transparent py-2 px-3 rounded-xl border-2 border-transparent">
                                -
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-center" style={{ width: "360px" }}>
                            <div className={statusPillStyle.className}>
                              <div className="flex items-center gap-1">
                                <LEDIndicator 
                                  color={statusPillStyle.ledColor1} 
                                  isActive={ledState}
                                  size="w-4 h-4"
                                />
                                <LEDIndicator 
                                  color={statusPillStyle.ledColor2} 
                                  isActive={!ledState}
                                  size="w-4 h-4"
                                />
                              </div>
                              {flight.StatusEN}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-full mx-auto mt-4 text-center flex-shrink-0">
        <div className="text-white/70 text-base py-2">
          <div className="overflow-hidden relative bg-black/30 rounded-full py-2 border-2 border-white/10">
            <div className="whitespace-nowrap">
              <span className={`${currentColors.title} font-bold text-xl mx-4`}>
                ⚠️ DEAR PASSENGERS, PLEASE DO NOT LEAVE YOUR BAGGAGE UNATTENDED AT THE AIRPORT - UNATTENDED BAGGAGE WILL
                BE CONFISCATED AND DESTROYED •
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes blink { 
          0%, 50% { opacity: 1; } 
          51%, 100% { opacity: 0.3; } 
        }
        @keyframes pill-blink { 
          0%, 50% { 
            opacity: 1;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          } 
          51%, 100% { 
            opacity: 0.8;
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          } 
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-blink { animation: blink 800ms infinite; }
        .animate-pill-blink { animation: pill-blink 800ms infinite; }
        .animate-marquee {
          animation: marquee 120s linear infinite;
          display: inline-block;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.4); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.6); }
        html, body { overflow: hidden; margin: 0; padding: 0; height: 100vh; }
        #__next { height: 100vh; }
      `}</style>
    </div>
  )
}