// 'use client';

// import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
// import { useParams } from 'next/navigation';
// import type { Flight } from '@/types/flight';
// import { 
//   fetchFlightData, 
//   getFlightForSpecificDesk,
//   getCheckInClassType,
//   debugCheckInClassType,
//   EnhancedFlight
// } from '@/lib/flight-service';
// import { getLogoURL } from '@/lib/flight-api-helpers';

// import { 
//   CheckCircle, 
//   Clock, 
//   MapPin, 
//   Users, 
//   AlertCircle, 
//   Info, 
//   Bug
// } from 'lucide-react';
// import Image from 'next/image';
// import { useAdImages } from '@/hooks/useAdImages';
// import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';
// import ChristmasInactiveScreen from '@/components/ChristmasInactiveScreen';

// // Konstante za konfiguraciju
// const INTERVAL_ACTIVE = 30000; // 30 sekundi za aktivan check-in
// const INTERVAL_INACTIVE = 60000; // 60 sekundi za neaktivan
// const AD_SWITCH_INTERVAL = 15000; // 15 sekundi za reklame
// const DEVELOPMENT = process.env.NODE_ENV === 'development';

// // Placeholder za slike
// const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

// export default function CheckInPage() {
//   const params = useParams();
//   const deskNumberParam = params.deskNumber as string;
  
//   const [flight, setFlight] = useState<EnhancedFlight | null>(null);
//   const [currentAdIndex, setCurrentAdIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [lastUpdate, setLastUpdate] = useState<string>('');
//   const [isPortrait, setIsPortrait] = useState(false);
//   const [nextFlight, setNextFlight] = useState<Flight | null>(null);
//   const [debugInfo, setDebugInfo] = useState<any>(null);
//   const [showDebug, setShowDebug] = useState(false);
//   const [classType, setClassType] = useState<'business' | 'economy' | null>(null);
//   const [airlineLogoUrl, setAirlineLogoUrl] = useState<string>('');
  
//   const prevFlightRef = useRef<EnhancedFlight | null>(null);
//   const isMountedRef = useRef(true);
//   const orientationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
//   const { adImages, isLoading: adImagesLoading } = useAdImages();
//   const currentTheme = useSeasonalTheme();

//   // Helper funkcija za dobijanje URL-a za logo aviokompanije
//   const updateAirlineLogoUrl = useCallback(async (flight: EnhancedFlight | null) => {
//     if (!flight) {
//       setAirlineLogoUrl('');
//       return;
//     }
    
//     try {
//       // Koristimo AirlineICAO iz flight podataka
//       const icaoCode = flight.AirlineICAO;
      
//       if (!icaoCode) {
//         // Fallback: ekstraktuj ICAO iz flight broja ako nije u podacima
//         const iataCode = flight.FlightNumber?.substring(0, 2).toUpperCase();
//         // Pozovi getLogoURL sa ICAO kodom (ili IATA kao fallback)
//         const logoUrl = await getLogoURL(icaoCode || iataCode || '');
//         setAirlineLogoUrl(logoUrl);
//       } else {
//         const logoUrl = await getLogoURL(icaoCode);
//         setAirlineLogoUrl(logoUrl);
//       }
      
//       if (DEVELOPMENT) {
//         console.log('Logo URL update:', {
//           flightNumber: flight.FlightNumber,
//           airlineICAO: flight.AirlineICAO,
//           logoUrl: airlineLogoUrl
//         });
//       }
//     } catch (error) {
//       console.error('Error getting airline logo URL:', error);
//       // Fallback na originalni URL
//       setAirlineLogoUrl(flight.AirlineLogoURL || '');
//     }
//   }, []);

//   // Helper funkcija za debug
//   const updateDebugInfo = useCallback(async (flight: EnhancedFlight) => {
//     if (DEVELOPMENT && flight) {
//       const debugResult = debugCheckInClassType(flight, deskNumberParam);
//       console.log('=== CHECK-IN CLASS DEBUG ===');
//       console.log('Flight:', flight.FlightNumber);
//       console.log('CheckInDesk:', flight.CheckInDesk);
//       console.log('Enhanced info:', {
//         allDesks: flight._allDesks,
//         deskIndex: flight._deskIndex
//       });
//       console.log('Current Desk (from URL):', deskNumberParam);
//       console.log('Class Type:', debugResult.classType);
//       console.log('Debug Info:', debugResult.debugInfo);
      
//       // Dodaj informacije o logu
//       console.log('Logo Info:');
//       console.log('- Airline ICAO:', flight.AirlineICAO);
//       console.log('- Airline Code:', flight.AirlineCode);
//       console.log('- Logo URL:', airlineLogoUrl || 'Loading...');
//       console.log('===========================');
      
//       setDebugInfo(debugResult);
//     }
//   }, [deskNumberParam, airlineLogoUrl]);

//   // Funkcija za određivanje klase
//   const determineClassType = useCallback(async (flight: EnhancedFlight | null) => {
//     if (!flight) {
//       setClassType(null);
//       return;
//     }
    
//     try {
//       const type = await getCheckInClassType(flight, deskNumberParam);
//       setClassType(type);
      
//       if (DEVELOPMENT) {
//         console.log('Determined class type:', type);
//       }
//     } catch (error) {
//       console.error('Error determining class type:', error);
//       setClassType(null);
//     }
//   }, [deskNumberParam]);

//   // Debounced orientation check
//   useEffect(() => {
//     const checkOrientation = () => {
//       setIsPortrait(window.innerHeight > window.innerWidth);
//     };

//     checkOrientation();
    
//     const debouncedCheck = () => {
//       if (orientationTimeoutRef.current) {
//         clearTimeout(orientationTimeoutRef.current);
//       }
//       orientationTimeoutRef.current = setTimeout(checkOrientation, 200);
//     };
    
//     window.addEventListener('resize', debouncedCheck);
//     return () => {
//       window.removeEventListener('resize', debouncedCheck);
//       if (orientationTimeoutRef.current) {
//         clearTimeout(orientationTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Memoized status check
//   const shouldShowCheckIn = useMemo(() => {
//     if (!flight) return false;
    
//     const status = flight.StatusEN?.toLowerCase();
//     return status === 'processing' || 
//            status === 'check-in' ||
//            status === 'open' ||
//            status === 'open for check-in';
//   }, [flight]);

//   // Optimized flight loading function
//   const loadFlights = useCallback(async () => {
//     if (!isMountedRef.current) return;
    
//     try {
//       if (DEVELOPMENT) {
//         console.log('🔄 Loading flights for desk:', deskNumberParam);
//       }
      
//       const data = await fetchFlightData();
      
//       let specificFlight: EnhancedFlight | null = null;
//       const deskNumberVariants = [
//         deskNumberParam,
//         deskNumberParam.replace(/^0+/, ''),
//         deskNumberParam.padStart(2, '0'),
//       ];

//       for (const variant of deskNumberVariants) {
//         specificFlight = getFlightForSpecificDesk(data.departures, variant);
//         if (specificFlight) {
//           break;
//         }
//       }

//       const updateTime = new Date().toLocaleTimeString('en-GB');
      
//       if (!specificFlight) {
//         if (isMountedRef.current) {
//           setFlight(null);
//           setNextFlight(null);
//           setLastUpdate(updateTime);
//           setLoading(false);
//           setClassType(null);
//           setAirlineLogoUrl('');
//         }
//         return;
//       }

//       const activeFlight = specificFlight;

//       const previousFlight = prevFlightRef.current;
//       const wasActive = previousFlight && 
//         (previousFlight.StatusEN?.toLowerCase() === 'processing' || 
//          previousFlight.StatusEN?.toLowerCase() === 'check-in' ||
//          previousFlight.StatusEN?.toLowerCase() === 'open' ||
//          previousFlight.StatusEN?.toLowerCase() === 'open for check-in');
      
//       const isNowInactive = !activeFlight && wasActive;

//       if (isNowInactive) {
//         if (isMountedRef.current) {
//           setFlight(null);
//           setNextFlight(null);
//           setCurrentAdIndex(0);
//           setLastUpdate(updateTime);
//           setLoading(false);
//           setClassType(null);
//           setAirlineLogoUrl('');
//         }
//         prevFlightRef.current = null;
//         return;
//       }

//       // Simple next flight calculation
//       const allFlightsForDesk = data.departures.filter(f => 
//         f.CheckInDesk && f.CheckInDesk.includes(deskNumberParam)
//       );
      
//       const nextAvailableFlight = allFlightsForDesk
//         .filter(f => {
//           const status = f.StatusEN?.toLowerCase() || 'scheduled';
//           return status === 'scheduled' || status === 'expected' || status === 'ontime' || status === 'delayed';
//         })
//         .sort((a, b) => {
//           try {
//             const timeA = new Date(`${new Date().toDateString()} ${a.ScheduledDepartureTime}`);
//             const timeB = new Date(`${new Date().toDateString()} ${b.ScheduledDepartureTime}`);
//             return timeA.getTime() - timeB.getTime();
//           } catch {
//             return 0;
//           }
//         })[0] || null;

//       if (isMountedRef.current) {
//         setFlight(activeFlight);
//         setNextFlight(nextAvailableFlight);
//         setLastUpdate(updateTime);
//         setLoading(false);
//         prevFlightRef.current = activeFlight;
        
//         // Odredi class type
//         await determineClassType(activeFlight);
//         // Update logo URL
//         await updateAirlineLogoUrl(activeFlight);
//         updateDebugInfo(activeFlight);
//       }

//     } catch (error) {
//       if (DEVELOPMENT) {
//         console.error('❌ Error:', error);
//       }
//       if (isMountedRef.current) {
//         setLastUpdate(new Date().toLocaleTimeString('en-GB'));
//         setLoading(false);
//       }
//     }
//   }, [deskNumberParam, updateDebugInfo, determineClassType, updateAirlineLogoUrl]);

//   // Effect za debug kada se promeni flight
//   useEffect(() => {
//     if (flight && DEVELOPMENT) {
//       updateDebugInfo(flight);
//     }
//   }, [flight, updateDebugInfo]);

//   // Main data loading effect
//   useEffect(() => {
//     isMountedRef.current = true;
    
//     const loadInitialData = async () => {
//       await loadFlights();
//     };
    
//     loadInitialData();
    
//     const interval = setInterval(loadFlights, INTERVAL_INACTIVE);
    
//     return () => {
//       isMountedRef.current = false;
//       clearInterval(interval);
//     };
//   }, [loadFlights]);

//   // Active check-in interval
//   useEffect(() => {
//     if (!shouldShowCheckIn) return;
    
//     const activeInterval = setInterval(loadFlights, INTERVAL_ACTIVE);
//     return () => clearInterval(activeInterval);
//   }, [shouldShowCheckIn, loadFlights]);

//   // Effect za određivanje klase kada se promeni flight
//   useEffect(() => {
//     if (flight) {
//       determineClassType(flight);
//     }
//   }, [flight, determineClassType]);

//   // Effect za ažuriranje logoa kada se promeni flight
//   useEffect(() => {
//     if (flight) {
//       updateAirlineLogoUrl(flight);
//     }
//   }, [flight, updateAirlineLogoUrl]);

//   // Ad interval
//   useEffect(() => {
//     if (adImages.length === 0) return;
    
//     const adInterval = setInterval(() => {
//       setCurrentAdIndex((prev) => (prev + 1) % adImages.length);
//     }, AD_SWITCH_INTERVAL);
    
//     return () => clearInterval(adInterval);
//   }, [adImages.length]);

//   // Keyboard shortcut za debug (Alt+D)
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.altKey && e.key === 'd') {
//         setShowDebug(prev => !prev);
//       }
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, []);

//   // Show loading only if we have NO data at all
//   if (loading && !flight && !nextFlight) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <div className="text-2xl text-slate-300">Loading check-in information...</div>
//         </div>
//       </div>
//     );
//   }

//   // Christmas theme inactive screen
//   if (!shouldShowCheckIn && currentTheme === 'christmas') {
//     return (
//       <ChristmasInactiveScreen
//         deskNumberParam={deskNumberParam}
//         nextFlight={nextFlight}
//         lastUpdate={lastUpdate}
//         loading={loading}
//         isPortrait={isPortrait}
//         displayFlight={flight}
//       />
//     );
//   }

//   // Regular inactive screen (sa ikonicama koje rade)
//   if (!shouldShowCheckIn) {
//     const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
    
//     return (
//       <div className="min-h-screen relative">
//         <div className="absolute inset-0 z-0">
//           <Image
//             src={wallpaperSrc}
//             alt="Airport Wallpaper"
//             fill
//             className="object-cover"
//             priority
//             quality={90}
//             placeholder="blur"
//             blurDataURL={BLUR_DATA_URL}
//           />
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
//         </div>
        
//         <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white">
//           <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl ${
//             isPortrait ? 'max-w-4xl' : 'max-w-6xl'
//           } mx-auto`}>
//             <CheckCircle className="w-32 h-32 text-white/60 mx-auto mb-8" />
            
//             <div className="text-center mb-8">
//               <div className={`font-bold text-white/80 mb-4 ${
//                 isPortrait ? 'text-[6rem]' : 'text-[4rem]'
//               }`}>
//                 Check-in
//               </div>
//               <div className={`font-black text-orange-400 leading-none drop-shadow-2xl ${
//                 isPortrait ? 'text-[20rem]' : 'text-[15rem]'
//               }`}>
//                 {deskNumberParam}
//               </div>
//             </div>
            
//             <div className={`text-white/90 mb-6 font-semibold ${
//               isPortrait ? 'text-4xl' : 'text-3xl'
//             }`}>
//               {flight ? 'Check-in not available' : 'No flights currently checking in here'}
//             </div>

//             {nextFlight && (
//               <div className={`text-orange-300 mb-6 font-medium bg-black/30 py-3 px-6 rounded-2xl ${
//                 isPortrait ? 'text-3xl' : 'text-2xl'
//               }`}>
//                 Next flight: {nextFlight.FlightNumber} to {nextFlight.DestinationCityName} at {nextFlight.ScheduledDepartureTime}
//               </div>
//             )}

//             <div className={`text-white/80 mb-6 ${
//               isPortrait ? 'text-2xl' : 'text-xl'
//             }`}>
//               {flight ? `Status: ${flight.StatusEN}` : 'Please check the main display'}
//             </div>

//             <div className={`text-white/70 mb-4 ${
//               isPortrait ? 'text-xl' : 'text-lg'
//             }`}>
//               Updated at: {lastUpdate || 'Never'}
//             </div>

//             {loading && (
//               <div className={`text-white/60 mt-4 ${
//                 isPortrait ? 'text-lg' : 'text-base'
//               }`}>
//                 Updating...
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // At this point, shouldShowCheckIn je true
//   const safeDisplayFlight = flight!;

//   // Debug Panel komponenta
//   const DebugPanel = () => (
//     <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-md border border-yellow-500/50">
//       <div className="flex justify-between items-center mb-2">
//         <div className="font-bold flex items-center gap-2">
//           <Bug className="w-4 h-4" />
//           Debug Panel (Alt+D to toggle)
//         </div>
//         <button 
//           onClick={() => setShowDebug(false)}
//           className="text-xs bg-red-500/50 hover:bg-red-500 px-2 py-1 rounded"
//         >
//           ✕
//         </button>
//       </div>
      
//       {debugInfo && (
//         <>
//           <div className="mb-2">
//             <div className="text-yellow-400 font-semibold">Class Type Result:</div>
//             <div className="font-mono">{classType || 'null'}</div>
//           </div>
          
//           <div className="mb-2">
//             <div className="text-yellow-400 font-semibold">Flight Info:</div>
//             <div>Flight: {safeDisplayFlight.FlightNumber}</div>
//             <div>Check-in: {safeDisplayFlight.CheckInDesk}</div>
//             <div>All Desks: {safeDisplayFlight._allDesks?.join(', ') || 'N/A'}</div>
//             <div>Desk Index: {safeDisplayFlight._deskIndex ?? 'N/A'}</div>
//             <div>Desk from URL: {deskNumberParam}</div>
//           </div>
          
//           <div className="mb-2">
//             <div className="text-yellow-400 font-semibold">Logo Info:</div>
//             <div>Airline ICAO: {safeDisplayFlight.AirlineICAO || 'N/A'}</div>
//             <div>Airline Code: {safeDisplayFlight.AirlineCode || 'N/A'}</div>
//             <div>Logo URL: {airlineLogoUrl || 'Loading...'}</div>
//             <div>Original URL: {safeDisplayFlight.AirlineLogoURL || 'N/A'}</div>
//           </div>
          
//           <div className="mb-2">
//             <div className="text-yellow-400 font-semibold">Debug Details:</div>
//             <div>Airline Code: {debugInfo.debugInfo?.airlineCode}</div>
//             <div>Has Business: {debugInfo.debugInfo?.hasBusinessClass ? 'Yes' : 'No'}</div>
//             <div>Desk Count: {debugInfo.debugInfo?.deskCount}</div>
//             <div>Enhanced Info: {debugInfo.debugInfo?.hasEnhancedInfo ? 'Yes' : 'No'}</div>
//             <div>Enhanced Index: {debugInfo.debugInfo?.enhancedIndex ?? 'N/A'}</div>
//           </div>
//         </>
//       )}
      
//       {!debugInfo && (
//         <div className="text-slate-400">No debug info available</div>
//       )}
//     </div>
//   );

//   // Portrait mod za aktivan check-in
//   if (isPortrait) {
//     return (
//       <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex flex-col">
        
//         {/* Debug toggle button */}
//         {DEVELOPMENT && !showDebug && (
//           <button
//             onClick={() => setShowDebug(true)}
//             className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
//             title="Show Debug (Alt+D)"
//           >
//             <Bug className="w-5 h-5" />
//           </button>
//         )}
        
//         {/* Debug Panel */}
//         {DEVELOPMENT && showDebug && <DebugPanel />}
        
//         {/* Header */}
//         <div className="flex-shrink-0 p-2 bg-white/5 backdrop-blur-lg border-b border-white/10 mt-[0.3cm]">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
//                 <CheckCircle className="w-6 h-6 text-green-400" />
//               </div>
//               <div>
//                 <h1 className="text-[4rem] font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
//                   CHECK-IN {deskNumberParam}
//                 </h1>
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-xs text-slate-400">Updated</div>
//               <div className="text-sm font-mono text-slate-300">{lastUpdate}</div>
//               {loading && (
//                 <div className="text-xs text-slate-500 mt-0.5">Updating...</div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Glavni sadržaj */}
//         <div className="flex-1 flex flex-col px-2 py-1 min-h-0">
          
//           {/* Flight Info Card */}
//           <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            
//             {/* Airline Logo sa prilagođenim card-om za business class */}
//             <div className="flex flex-col items-center mb-4">
//               {/* Uvijek pokaži logo container - koristimo airlineLogoUrl iz state-a */}
//               {airlineLogoUrl && (
//                 <div className="relative w-full max-w-[90vw] h-48 bg-white rounded-xl p-3 flex items-center justify-center overflow-hidden shadow-lg mb-3">
//                   <div className="relative w-full h-full">
//                     <Image
//                       src={airlineLogoUrl}
//                       alt={safeDisplayFlight.AirlineName || 'Airline Logo'}
//                       fill
//                       className="object-contain"
//                       priority
//                       quality={85}
//                       sizes="90vw"
//                       placeholder="blur"
//                       blurDataURL={BLUR_DATA_URL}
//                       onError={(e) => {
//                         // Fallback na originalni URL ako lokalni logo ne postoji
//                         if (safeDisplayFlight.AirlineLogoURL && e.currentTarget.src !== safeDisplayFlight.AirlineLogoURL) {
//                           e.currentTarget.src = safeDisplayFlight.AirlineLogoURL;
//                         }
//                       }}
//                     />
//                   </div>
//                 </div>
//               )}
              
//               {/* CLASS BADGE - BUSINESS/ECONOMY KLASA sa prilagođenom širinom */}
//               {classType && (
//                 <div className="w-full max-w-[90vw] mb-3">
//                   <div className={`rounded-xl px-6 py-3 text-center shadow-lg ${
//                     classType === 'business' 
//                       ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400' 
//                       : 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400'
//                   }`}>
//                     <h1 className="text-7xl font-black text-white tracking-wider">
//                       {classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
//                     </h1>
//                   </div>
//                 </div>
//               )}
              
//               {/* Flight Number */}
//               <div className="text-center w-full">
//                 <div className="text-[13rem] font-black text-yellow-500 leading-tight">
//                   {safeDisplayFlight.FlightNumber}
//                 </div>
//               </div>
//             </div>

//             {/* Code Share */}
//             {safeDisplayFlight.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
//               <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 mb-3">
//                 <Users className="w-5 h-5 text-blue-400" />
//                 <div className="text-sm text-blue-300">
//                   Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
//                 </div>
//               </div>
//             )}

//             {/* Destination sa slikom grada */}
//             <div className="flex items-end gap-4 mb-3">
//               <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl flex-shrink-0 mb-3">
//                 <Image
//                   src={`/city-images/${safeDisplayFlight.DestinationAirportCode?.toLowerCase()}.jpg`}
//                   alt={safeDisplayFlight.DestinationCityName}
//                   fill
//                   className="object-cover"
//                   priority
//                   quality={90}
//                   sizes="224px"
//                   placeholder="blur"
//                   blurDataURL={BLUR_DATA_URL}
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
//               </div>
              
//               <div className="flex-1 text-right">
//                 <div className="text-[9rem] font-bold text-white mb-1 leading-tight">
//                   {safeDisplayFlight.DestinationCityName}
//                 </div>
//                 <div className="text-8xl font-bold text-cyan-400 flex items-center justify-end gap-3 mb-2">
//                   <span className="text-[1.25rem] bg-orange-500 text-white px-3 py-1 rounded-full font-semibold">
//                     Airport IATA code:
//                   </span>
//                   {safeDisplayFlight.DestinationAirportCode}
//                 </div>
//               </div>
              
//               <MapPin className="w-10 h-10 text-cyan-400 flex-shrink-0 mb-3" />
//             </div>

//             {/* Warning text */}
//             <div className="flex items-center justify-center gap-2 mt-1 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 backdrop-blur-sm mx-auto w-fit">
//               <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
//               <div className="text-[1.36rem] font-bold text-yellow-300 text-center">
//                 Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
//               </div>
//             </div>
//           </div>

//           {/* Times Card */}
//           <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
//             <div className="grid grid-cols-2 gap-4">
              
//               {/* Scheduled Time */}
//               <div className="text-center">
//                 <div className="flex items-center justify-center gap-2 mb-2">
//                   <Clock className="w-5 h-5 text-slate-400" />
//                   <div className="text-sm text-slate-400">Scheduled</div>
//                 </div>
//                 <div className="text-8xl font-mono font-bold text-white">
//                   {safeDisplayFlight.ScheduledDepartureTime}
//                 </div>
//               </div>

//               {/* Estimated Time */}
//               {safeDisplayFlight.EstimatedDepartureTime && 
//                safeDisplayFlight.EstimatedDepartureTime !== safeDisplayFlight.ScheduledDepartureTime && (
//                 <div className="text-center">
//                   <div className="flex items-center justify-center gap-2 mb-2">
//                     <AlertCircle className="w-5 h-5 text-yellow-400" />
//                     <div className="text-sm text-yellow-400">Expected</div>
//                   </div>
//                   <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse">
//                     {safeDisplayFlight.EstimatedDepartureTime}
//                   </div>
//                 </div>
//               )}

//               {/* Gate Info */}
//               {safeDisplayFlight.GateNumber && (
//                 <div className="col-span-2 text-center mt-2">
//                   <div className="text-3xl text-slate-400 mb-0">
//                     Gate Information
//                   </div>
//                   <div className="text-5xl font-bold text-white">
//                     Gate {safeDisplayFlight.GateNumber}
//                   </div>
//                   <div className="flex items-center justify-center gap-1 text-3xl text-slate-300 mt-0">
//                     <Info className="w-5 h-5 text-yellow-400" />
//                     <span>After check-in please proceed to gate {safeDisplayFlight.GateNumber}</span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Ad Image */}
//           {adImages.length > 0 && (
//             <div className="flex-1 min-h-[400px] bg-slate-800 rounded-xl overflow-hidden flex items-stretch">
//               <div className="relative w-full">
//                 <Image
//                   src={adImages[currentAdIndex]}
//                   alt="Advertisement"
//                   fill
//                   className="object-fill"
//                   priority
//                   quality={80}
//                   sizes="100vw"
//                   placeholder="blur"
//                   blurDataURL={BLUR_DATA_URL}
//                 />
//               </div>
//             </div>
//           )}

//           {/* Footer */}
//           <div className="flex-shrink-0 flex justify-center items-center space-x-2 text-xs font-inter py-1">
//             <Image
//               src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACz0lEQVR4nO2YPWhUQRDHYzSRREHUiILRxspCBIUYC20sxMJSEtTC1lYJfqWwUGOTIGiIYieIiBiEoI1WgoWFoBIRRBD8ACV+gaA5Nf5k4hiGx91l571971K8Hxy8e7s7O/+73Z3ZaWoqKSnJDDAf2AocB24Cz4DPwE/9yPO4tkmfbqB5Lji+BjgLvMXPH2AA6GwE4xuAS0CF7FSAEaCjKOf3Ap+Iz0egN0/HW4DL5M9FmSu28+3AHYrjtswZ85cv0vn/3AVaYwgoYtnUYiSr8/toPD1pnV8PrDNae/6deP4jVs/5usJwmggbI0hV4xjwSFOKUCZdEVvTg7yYPolmAhc5xA57EzNvbHAHagL7ZOibm8vA6KAHUrNLLTOQEruchgOhKESBZm9MkxncA7wP7evkaImDUa7WKjd0hffFzI0TAeFYBaudKDgKehghxp8o17CzTjRdTwESIAPf5nxi/yjzvAv5EFDBZhICxeslgRgHfc19C+uqA+S5R96Xpvj+DgHe5b2J99VXSEfNuh1lKX4C1eW7i0QgChHvAPPP+gmm7rxHfy9UiApnlYOJa+sK0HXa7D30hArojCvgGrDTt24Apk2F62RwioLna+Z1SgPBAlotpHyQdr+ySnE2EVMxipsiHjG3JWp+nEHAqyHmdpNMZD2TfLAZO1Gj/Aaw39rcAvx32ZfzKYAE6iZT7YvIQWGDsn3GMPe9yXidYlsOlvt/ybwWeBIyR1HypW4BO0htZgCzLjcb+Ji2/72NPKufNJFKrjMljW3EDTtbpO5TJeVNalFplTE4n7D+q0mfM7pmsItoji/hl77fAhkRguxWlLpoQ0RL5ZJJY0GbsS71InC6w8ZrwZ59uR8auJHf7cnO8St10OGU+Y/kCtHvdqkz/Zs8AAAAASUVORK5CYII="
//               alt="nextjs"
//               width={20}
//               height={20}
//               unoptimized
//               className="inline-block"
//             />
//             <a
//               href="mailto:alen.vocanec@apm.co.me"
//               className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent hover:underline"
//             >
//               code by Tivat Airport, 2025
//             </a>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Landscape mod za aktivan check-in
//   return (
//     <div className="w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden">
      
//       {/* Debug toggle button */}
//       {DEVELOPMENT && !showDebug && (
//         <button
//           onClick={() => setShowDebug(true)}
//           className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
//           title="Show Debug (Alt+D)"
//         >
//           <Bug className="w-5 h-5" />
//         </button>
//       )}
      
//       {/* Debug Panel */}
//       {DEVELOPMENT && showDebug && <DebugPanel />}
      
//       <div className="h-full grid grid-cols-12 gap-8 p-3 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        
//         <div className="col-span-7 flex flex-col justify-between">
          
//           <div className="mb-8">
//             <div className="flex items-center gap-6 mb-6">
//               <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
//                 <CheckCircle className="w-12 h-12 text-green-400" />
//               </div>
//               <div>
//                 <h1 className="text-8xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
//                   CHECK-IN {deskNumberParam}
//                 </h1>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-8 flex-1">
//             <div className="flex items-center gap-8 mb-10">
//               {/* Logo container - koristimo airlineLogoUrl iz state-a */}
//               {airlineLogoUrl && (
//                 <div className="relative w-64 h-40 bg-white rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-lg">
//                   <Image
//                     src={airlineLogoUrl}
//                     alt={safeDisplayFlight.AirlineName || 'Airline Logo'}
//                     width={300}
//                     height={180}
//                     className="object-contain"
//                     priority
//                     quality={85}
//                     onError={(e) => {
//                       // Fallback na originalni URL ako lokalni logo ne postoji
//                       if (safeDisplayFlight.AirlineLogoURL && e.currentTarget.src !== safeDisplayFlight.AirlineLogoURL) {
//                         e.currentTarget.src = safeDisplayFlight.AirlineLogoURL;
//                       }
//                     }}
//                   />
//                 </div>
//               )}
              
//               {/* CLASS BADGE - LANDSCAPE VERSION */}
//               {classType && (
//                 <div className="mb-6">
//                   <div className={`rounded-xl px-6 py-3 text-center shadow-lg ${
//                     classType === 'business' 
//                       ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400' 
//                       : 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400'
//                   }`}>
//                     <h1 className="text-5xl font-black text-white tracking-wider">
//                       {classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
//                     </h1>
//                   </div>
//                 </div>
//               )}
              
//               <div className="flex-1">
//                 <div className="text-[12rem] font-black text-yellow-500 mb-2">
//                   {safeDisplayFlight.FlightNumber}
//                 </div>
//                 <div className="text-lg text-slate-400">{safeDisplayFlight.AirlineName}</div>
//               </div>
//             </div>

//             {safeDisplayFlight.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
//               <div className="flex items-center gap-4 bg-blue-500/20 px-6 py-3 rounded-3xl border border-blue-500/30">
//                 <Users className="w-8 h-8 text-blue-400" />
//                 <div className="text-2xl text-blue-300">
//                   Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
//                 </div>
//               </div>
//             )}

//             <div className="flex items-center gap-8">
//               <div className="relative w-80 h-80 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0">
//                 <Image
//                   src={`/city-images/${safeDisplayFlight.DestinationAirportCode?.toLowerCase()}.jpg`}
//                   alt={safeDisplayFlight.DestinationCityName}
//                   fill
//                   className="object-cover"
//                   priority
//                   quality={90}
//                   sizes="320px"
//                   placeholder="blur"
//                   blurDataURL={BLUR_DATA_URL}
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
//               </div>
              
//               <div className="flex-1">
//                 <div className="text-8xl font-bold text-white mb-2">
//                   {safeDisplayFlight.DestinationCityName}
//                 </div>
//                 <div className="text-8xl font-bold text-cyan-400">
//                   {safeDisplayFlight.DestinationAirportCode}
//                 </div>
                
//                 {/* Warning text za landscape */}
//                 <div className="flex items-center gap-2 mt-4 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 backdrop-blur-sm">
//                   <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
//                   <div className="text-lg font-semibold text-yellow-300">
//                     Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
//                   </div>
//                 </div>
//               </div>
              
//               <MapPin className="w-12 h-12 text-cyan-400" />
//             </div>
//           </div>

//           <div className="mt-8">
//             <div className="text-xl text-slate-400">Last Updated</div>
//             <div className="text-2xl font-mono text-slate-300">{lastUpdate}</div>
//             {loading && (
//               <div className="text-sm text-slate-500 mt-1">Updating data...</div>
//             )}
//           </div>
//         </div>

//         <div className="col-span-5 flex flex-col justify-between border-l-2 border-white/10 pl-8">
          
//           <div className="space-y-8">
//             <div className="text-right">
//               <div className="flex items-center justify-end gap-4 mb-4">
//                 <Clock className="w-10 h-10 text-slate-400" />
//                 <div className="text-2xl text-slate-400">Scheduled Departure</div>
//               </div>
//               <div className="text-7xl font-mono font-bold text-white leading-tight">
//                 {safeDisplayFlight.ScheduledDepartureTime}
//               </div>
//             </div>

//             {safeDisplayFlight.EstimatedDepartureTime && 
//              safeDisplayFlight.EstimatedDepartureTime !== safeDisplayFlight.ScheduledDepartureTime && (
//               <div className="text-right">
//                 <div className="flex items-center justify-end gap-4 mb-4">
//                   <AlertCircle className="w-10 h-10 text-yellow-400" />
//                   <div className="text-2xl text-yellow-400">Expected Departure</div>
//                 </div>
//                 <div className="text-6xl font-mono font-bold text-yellow-400 animate-pulse leading-tight">
//                   {safeDisplayFlight.EstimatedDepartureTime}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="text-right space-y-6">
//             <div>
//               <div className="text-6xl font-bold text-green-400 leading-tight animate-pulse">
//                 CHECK-IN OPEN
//               </div>
//               <div className="text-4xl text-green-400 mt-2">
//                 Please proceed to check-in
//               </div>
//             </div>

//             {safeDisplayFlight.GateNumber && (
//               <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
//                 <div className="text-2xl text-slate-400 mb-3">Gate Information</div>
//                 <div className="text-4xl font-bold text-white">
//                   Gate {safeDisplayFlight.GateNumber}
//                 </div>
//                 <div className="flex items-center justify-end gap-2 text-xl text-slate-300 mt-2">
//                   <Info className="w-6 h-6 text-yellow-400" />
//                   <span>After check-in please proceed to gate {safeDisplayFlight.GateNumber}</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


///flicker free

'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { 
  fetchFlightData, 
  getFlightForSpecificDesk,
  getCheckInClassType,
  debugCheckInClassType,
  type EnhancedFlight
} from '@/lib/flight-service';
import { getLogoURL } from '@/lib/flight-api-helpers';

import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle, 
  Info, 
  Bug
} from 'lucide-react';
import Image from 'next/image';
import { useAdImages } from '@/hooks/useAdImages';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';
import ChristmasInactiveScreen from '@/components/ChristmasInactiveScreen';

// Konstante za konfiguraciju
const INTERVAL_ACTIVE = 10000;
const INTERVAL_INACTIVE = 30000;
const AD_SWITCH_INTERVAL = 15000;
const DEVELOPMENT = process.env.NODE_ENV === 'development';

// CSS animacije kao konstanta
const CSS_ANIMATIONS = `
  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    will-change: opacity, transform;
  }
  
  .aspect-ratio-box {
    position: relative;
    overflow: hidden;
  }
  
  .aspect-ratio-box::before {
    content: '';
    display: block;
    padding-bottom: 62.5%; /* 16:10 ratio */
  }
  
  .aspect-ratio-box > div {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .ad-image-container {
    position: relative;
    overflow: hidden;
  }
  
  .ad-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.5s ease-in-out;
    will-change: opacity;
  }
  
  .ad-image.active {
    opacity: 1;
    z-index: 2;
  }
  
  .ad-image.inactive {
    opacity: 0;
    z-index: 1;
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .fade-out {
    animation: fadeOut 0.3s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
  
  .flight-number-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .city-name-transition {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .logo-transition {
    transition: opacity 0.3s ease-in-out;
  }
  
  .logo-transition.opacity-0 {
    opacity: 0;
  }
  
  .logo-transition.opacity-100 {
    opacity: 1;
  }
  
  .transition-guard {
    pointer-events: none;
    opacity: 0.95;
  }
`;

// LRU Cache klasa za preloaded slike
class LRUCache {
  private cache: Map<string, boolean>;
  private maxSize: number;
  
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  set(key: string, value: boolean): void {
    // Ako cache premašuje max size, ukloni najstariji element
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    // Ako ključ već postoji, prvo ga ukloni da bi bio na vrhu
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    this.cache.set(key, value);
  }
  
  get size(): number {
    return this.cache.size;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Placeholder za slike
const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

// Preload funkcija za slike (radi samo na klijentskoj strani)
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') {
      resolve();
      return;
    }
    
    // Koristimo window.Image za klijentsku stranu
    const img = new window.Image();
    img.src = src;
    
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      resolve(); // Ne odbij promise, samo loguj
    };
    
    // Timeout za slučaj da se slika nikad ne učita
    setTimeout(() => resolve(), 2000);
  });
};

// Globalni cache objekti
const preloadedImages = new LRUCache(50);
const pendingPreloads = new Map<string, Promise<void>>();

// Atomic state interface
interface FlightDisplayState {
  flight: EnhancedFlight | null;
  logoUrl: string;
  cityUrl: string;
  classType: 'business' | 'economy' | null;
  airlineName: string;
  destinationCity: string;
  flightNumber: string;
  destinationCode: string;
  scheduledTime: string;
  estimatedTime: string;
  gateNumber: string;
}

interface NextFlightData {
  flight: EnhancedFlight | null;
  logoUrl: string;
  cityUrl: string;
  classType: 'business' | 'economy' | null;
}

export default function CheckInPage() {
  const params = useParams();
  const deskNumberParam = params.deskNumber as string;
  
  // Atomic state za flight display
  const [flightDisplay, setFlightDisplay] = useState<FlightDisplayState>({
    flight: null,
    logoUrl: '',
    cityUrl: '',
    classType: null,
    airlineName: '',
    destinationCity: '',
    flightNumber: '',
    destinationCode: '',
    scheduledTime: '',
    estimatedTime: '',
    gateNumber: '',
  });
  
  // Background loading states
  const [nextFlightData, setNextFlightData] = useState<NextFlightData>({
    flight: null,
    logoUrl: '',
    cityUrl: '',
    classType: null,
  });
  
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [nextAdIndex, setNextAdIndex] = useState(1);
  const [isAdTransitioning, setIsAdTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isPortrait, setIsPortrait] = useState(false);
  const [nextScheduledFlight, setNextScheduledFlight] = useState<Flight | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const prevFlightRef = useRef<EnhancedFlight | null>(null);
  const isMountedRef = useRef(true);
  const orientationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoCacheRef = useRef<Map<string, string>>(new Map());
  const cityImageCacheRef = useRef<Map<string, string>>(new Map());
  const transitionQueueRef = useRef<EnhancedFlight[]>([]);
  const isProcessingQueueRef = useRef(false);
  const transitionGuardRef = useRef(false);
  const adTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { adImages, isLoading: adImagesLoading } = useAdImages();
  const currentTheme = useSeasonalTheme();

  // Helper funkcija za dobijanje URL-a za logo aviokompanije sa cache-om
  const getAirlineLogoUrl = useCallback(async (flight: EnhancedFlight | null): Promise<string> => {
    if (!flight) {
      return '';
    }
    
    try {
      const cacheKey = flight.AirlineICAO || flight.FlightNumber?.substring(0, 2).toUpperCase() || '';
      
      // Proveri cache
      if (logoCacheRef.current.has(cacheKey)) {
        return logoCacheRef.current.get(cacheKey) || '';
      }
      
      // Koristimo AirlineICAO iz flight podataka
      const icaoCode = flight.AirlineICAO;
      const logoUrl = await getLogoURL(icaoCode || flight.FlightNumber?.substring(0, 2).toUpperCase() || '');
      
      // Cache-uj rezultat
      logoCacheRef.current.set(cacheKey, logoUrl);
      
      return logoUrl;
    } catch (error) {
      console.error('Error getting airline logo URL:', error);
      // Fallback na originalni URL
      return flight.AirlineLogoURL || '';
    }
  }, []);

  // Helper funkcija za dobijanje city image URL-a
  const getCityImageUrl = useCallback((flight: EnhancedFlight | null): string => {
    if (!flight?.DestinationAirportCode) {
      return '';
    }
    
    const cityKey = flight.DestinationAirportCode.toLowerCase();
    
    // Proveri cache
    if (cityImageCacheRef.current.has(cityKey)) {
      return cityImageCacheRef.current.get(cityKey) || '';
    }
    
    const cityUrl = `/city-images/${cityKey}.jpg`;
    cityImageCacheRef.current.set(cityKey, cityUrl);
    
    return cityUrl;
  }, []);

  // Helper funkcija za preload svih slika za flight
  const preloadFlightImages = useCallback(async (flight: EnhancedFlight): Promise<{
    logoUrl: string;
    cityUrl: string;
  }> => {
    const results = {
      logoUrl: '',
      cityUrl: '',
    };
    
    try {
      const promises: Promise<void>[] = [];
      
      // Dobavi logo URL i preload-uj
      results.logoUrl = await getAirlineLogoUrl(flight);
      if (results.logoUrl && !preloadedImages.has(`logo:${results.logoUrl}`)) {
        const cacheKey = `logo:${results.logoUrl}`;
        if (!pendingPreloads.has(cacheKey)) {
          const promise = preloadImage(results.logoUrl).then(() => {
            preloadedImages.set(cacheKey, true);
            pendingPreloads.delete(cacheKey);
          });
          pendingPreloads.set(cacheKey, promise);
          promises.push(promise);
        }
      }
      
      // Dobavi city URL i preload-uj
      results.cityUrl = getCityImageUrl(flight);
      if (results.cityUrl && !preloadedImages.has(`city:${results.cityUrl}`)) {
        const cacheKey = `city:${results.cityUrl}`;
        if (!pendingPreloads.has(cacheKey)) {
          const promise = preloadImage(results.cityUrl).then(() => {
            preloadedImages.set(cacheKey, true);
            pendingPreloads.delete(cacheKey);
          });
          pendingPreloads.set(cacheKey, promise);
          promises.push(promise);
        }
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.warn('Error preloading flight images:', error);
    }
    
    return results;
  }, [getAirlineLogoUrl, getCityImageUrl]);

  // Funkcija za procesiranje transition queue
  const processTransitionQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || transitionGuardRef.current) {
      return;
    }
    
    if (transitionQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingQueueRef.current = true;
    transitionGuardRef.current = true;
    setIsTransitioning(true);
    
    try {
      const nextFlight = transitionQueueRef.current.shift();
      
      // Ako je nextFlight null ili undefined, resetujte stanje
      if (!nextFlight) {
        setFlightDisplay({
          flight: null,
          logoUrl: '',
          cityUrl: '',
          classType: null,
          airlineName: '',
          destinationCity: '',
          flightNumber: '',
          destinationCode: '',
          scheduledTime: '',
          estimatedTime: '',
          gateNumber: '',
        });
        
        // Reset next flight data
        setNextFlightData({
          flight: null,
          logoUrl: '',
          cityUrl: '',
          classType: null,
        });
        
        return;
      }
      
      // Preload sve slike
      const { logoUrl, cityUrl } = await preloadFlightImages(nextFlight);
      
      // Odredi class type
      const classType = await getCheckInClassType(nextFlight, deskNumberParam)
        .catch(() => null);
      
      // Atomic update flight display state
      setFlightDisplay({
        flight: nextFlight,
        logoUrl,
        cityUrl,
        classType,
        airlineName: nextFlight.AirlineName || '',
        destinationCity: nextFlight.DestinationCityName || '',
        flightNumber: nextFlight.FlightNumber || '',
        destinationCode: nextFlight.DestinationAirportCode || '',
        scheduledTime: nextFlight.ScheduledDepartureTime || '',
        estimatedTime: nextFlight.EstimatedDepartureTime || '',
        gateNumber: nextFlight.GateNumber || '',
      });
      
      // Reset next flight data
      setNextFlightData({
        flight: null,
        logoUrl: '',
        cityUrl: '',
        classType: null,
      });
      
      // Sačekaj malo pre nego što dozvoliš sledeći transition
      await new Promise(resolve => {
        setTimeout(resolve, 300);
      });
      
    } catch (error) {
      console.error('Error processing transition queue:', error);
    } finally {
      isProcessingQueueRef.current = false;
      
      // Reset transition guard nakon kraćeg vremena
      setTimeout(() => {
        transitionGuardRef.current = false;
        setIsTransitioning(false);
        
        // Procesiraj sledeći u queue-u ako postoji
        if (transitionQueueRef.current.length > 0) {
          setTimeout(() => {
            void processTransitionQueue();
          }, 100);
        }
      }, 500);
    }
  }, [deskNumberParam, preloadFlightImages]);

  // Funkcija za queue novog flighta
  const queueFlightTransition = useCallback(async (newFlight: EnhancedFlight | null) => {
    // Ako je flight null, samo resetujte display state
    if (!newFlight) {
      setFlightDisplay({
        flight: null,
        logoUrl: '',
        cityUrl: '',
        classType: null,
        airlineName: '',
        destinationCity: '',
        flightNumber: '',
        destinationCode: '',
        scheduledTime: '',
        estimatedTime: '',
        gateNumber: '',
      });
      return;
    }
    
    // Dodaj u queue samo ako nije null
    transitionQueueRef.current.push(newFlight);
    
    // Ako nema aktivnog procesiranja, pokreni ga
    if (!isProcessingQueueRef.current && !transitionGuardRef.current) {
      void processTransitionQueue();
    }
  }, [processTransitionQueue]);

  // Helper funkcija za debug
  const updateDebugInfo = useCallback((flight: EnhancedFlight) => {
    if (DEVELOPMENT && flight) {
      const debugResult = debugCheckInClassType(flight, deskNumberParam);
      console.log('=== CHECK-IN CLASS DEBUG ===');
      console.log('Flight:', flight.FlightNumber);
      console.log('CheckInDesk:', flight.CheckInDesk);
      console.log('Enhanced info:', {
        allDesks: flight._allDesks,
        deskIndex: flight._deskIndex
      });
     
      console.log('Transition State:');
      console.log('- Queue length:', transitionQueueRef.current.length);
      console.log('- Is processing:', isProcessingQueueRef.current);
      console.log('- Transition guard:', transitionGuardRef.current);
      console.log('- UI Transitioning:', isTransitioning);
      console.log('- Preloaded images:', preloadedImages.size);
      console.log('===========================');
      
      setDebugInfo(debugResult);
    }
  }, [deskNumberParam, isTransitioning]);

  // CSS injection effect
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.id = "checkin-animations";
    styleSheet.textContent = CSS_ANIMATIONS;
    
    if (!document.getElementById("checkin-animations")) {
      document.head.appendChild(styleSheet);
    }
    
    return () => {
      const existing = document.getElementById("checkin-animations");
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // Debounced orientation check
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    
    const debouncedCheck = () => {
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
      orientationTimeoutRef.current = setTimeout(checkOrientation, 200);
    };
    
    window.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
    };
  }, []);

  // Memoized status check
  const shouldShowCheckIn = useMemo(() => {
    if (!flightDisplay.flight) return false;
    
    const status = flightDisplay.flight.StatusEN?.toLowerCase();
    return status === 'processing' || 
           status === 'check-in' ||
           status === 'open' ||
           status === 'open for check-in';
  }, [flightDisplay.flight]);

  // Optimized flight loading function (učitava u pozadini)
  const loadFlights = useCallback(async () => {
    if (!isMountedRef.current || transitionGuardRef.current) {
      return;
    }
    
    try {
      if (DEVELOPMENT) {
        console.log('🔄 Background loading flights for desk:', deskNumberParam);
      }
      
      const data = await fetchFlightData();
      
      let specificFlight: EnhancedFlight | null = null;
      const deskNumberVariants = [
        deskNumberParam,
        deskNumberParam.replace(/^0+/, ''),
        deskNumberParam.padStart(2, '0'),
      ];

      for (const variant of deskNumberVariants) {
        specificFlight = getFlightForSpecificDesk(data.departures, variant);
        if (specificFlight) {
          break;
        }
      }

      const updateTime = new Date().toLocaleTimeString('en-GB');
      
      if (!specificFlight) {
        if (isMountedRef.current) {
          setLastUpdate(updateTime);
          setLoading(false);
          
          // Ako trenutno nema flighta na ekranu, resetujte stanje
          if (!flightDisplay.flight && !transitionGuardRef.current) {
            await queueFlightTransition(null);
          }
        }
        return;
      }

      const newFlight = specificFlight;

      // Proveri da li se flight promenio
      const hasFlightChanged = !flightDisplay.flight || 
        flightDisplay.flight.FlightNumber !== newFlight.FlightNumber ||
        flightDisplay.flight.StatusEN !== newFlight.StatusEN ||
        flightDisplay.flight.CheckInDesk !== newFlight.CheckInDesk;

      if (hasFlightChanged) {
        if (DEVELOPMENT) {
          console.log('🔄 Flight changed, adding to queue');
          console.log('Current:', flightDisplay.flight?.FlightNumber);
          console.log('New:', newFlight.FlightNumber);
        }
        
        // Dodaj u queue za transition
        await queueFlightTransition(newFlight);
        
        // Update debug info
        if (flightDisplay.flight) {
          updateDebugInfo(flightDisplay.flight);
        }
      }
      
      // Simple next scheduled flight calculation
      const allFlightsForDesk = data.departures.filter(f => 
        f.CheckInDesk && f.CheckInDesk.includes(deskNumberParam)
      );
      
      const nextAvailableFlight = allFlightsForDesk
        .filter(f => {
          const status = f.StatusEN?.toLowerCase() || 'scheduled';
          return status === 'scheduled' || status === 'expected' || status === 'ontime' || status === 'delayed';
        })
        .sort((a, b) => {
          try {
            const timeA = new Date(`${new Date().toDateString()} ${a.ScheduledDepartureTime}`);
            const timeB = new Date(`${new Date().toDateString()} ${b.ScheduledDepartureTime}`);
            return timeA.getTime() - timeB.getTime();
          } catch {
            return 0;
          }
        })[0] || null;

      if (isMountedRef.current) {
        setLastUpdate(updateTime);
        setLoading(false);
        setNextScheduledFlight(nextAvailableFlight);
      }

    } catch (error) {
      if (DEVELOPMENT) {
        console.error('❌ Error loading flights:', error);
      }
      if (isMountedRef.current) {
        setLastUpdate(new Date().toLocaleTimeString('en-GB'));
        setLoading(false);
      }
    }
  }, [deskNumberParam, flightDisplay.flight, queueFlightTransition, updateDebugInfo]);

  // Main data loading effect
  useEffect(() => {
    isMountedRef.current = true;
    
    // Preload prve reklame (samo na klijentskoj strani)
    if (typeof window !== 'undefined' && adImages.length > 0) {
      void preloadImage(adImages[0]);
      if (adImages.length > 1) {
        void preloadImage(adImages[1]);
      }
    }
    
    const loadInitialData = async () => {
      await loadFlights();
    };
    
    void loadInitialData();
    
    const interval = setInterval(() => {
      void loadFlights();
    }, INTERVAL_INACTIVE);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (adTransitionTimeoutRef.current) {
        clearTimeout(adTransitionTimeoutRef.current);
      }
    };
  }, [loadFlights, adImages]);

  // Active check-in interval
  useEffect(() => {
    if (!shouldShowCheckIn) return;
    
    const activeInterval = setInterval(() => {
      void loadFlights();
    }, INTERVAL_ACTIVE);
    return () => clearInterval(activeInterval);
  }, [shouldShowCheckIn, loadFlights]);

  // Ad transition effect
  useEffect(() => {
    if (adImages.length < 2) return;
    
    const adInterval = setInterval(() => {
      setIsAdTransitioning(true);
      
      // Preload sledeću reklamu
      const nextAd = adImages[(currentAdIndex + 2) % adImages.length];
      if (nextAd && typeof window !== 'undefined') {
        void preloadImage(nextAd);
      }
      
      // Crossfade transition
      setTimeout(() => {
        setNextAdIndex((currentAdIndex + 1) % adImages.length);
        
        setTimeout(() => {
          setCurrentAdIndex(prev => (prev + 1) % adImages.length);
          setIsAdTransitioning(false);
        }, 300);
      }, 100);
    }, AD_SWITCH_INTERVAL);
    
    return () => clearInterval(adInterval);
  }, [adImages, currentAdIndex]);

  // Keyboard shortcut za debug (Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Kiosk mode optimizacije
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Effect za update debug info kada se promeni flight
  useEffect(() => {
    if (flightDisplay.flight && DEVELOPMENT) {
      updateDebugInfo(flightDisplay.flight);
    }
  }, [flightDisplay.flight, updateDebugInfo]);

  // Show loading only if we have NO data at all
  if (loading && !flightDisplay.flight && !nextScheduledFlight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-2xl text-slate-300">Loading check-in information...</div>
        </div>
      </div>
    );
  }

  // Christmas theme inactive screen
  if (!shouldShowCheckIn && currentTheme === 'christmas') {
    return (
      <ChristmasInactiveScreen
        deskNumberParam={deskNumberParam}
        nextFlight={nextScheduledFlight}
        lastUpdate={lastUpdate}
        loading={loading}
        isPortrait={isPortrait}
        displayFlight={flightDisplay.flight}
      />
    );
  }

  // Regular inactive screen
  if (!shouldShowCheckIn) {
    const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
    
    return (
      <div className={`min-h-screen relative gpu-accelerated ${isTransitioning ? 'transition-guard' : ''}`}>
        <div className="absolute inset-0 z-0">
          <Image
            src={wallpaperSrc}
            alt="Airport Wallpaper"
            fill
            className="object-cover"
            priority
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white">
          <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl ${
            isPortrait ? 'max-w-4xl' : 'max-w-6xl'
          } mx-auto`}>
            <CheckCircle className="w-32 h-32 text-white/60 mx-auto mb-8" />
            
            <div className="text-center mb-8">
              <div className={`font-bold text-white/80 mb-4 ${
                isPortrait ? 'text-[6rem]' : 'text-[4rem]'
              }`}>
                Check-in
              </div>
              <div className={`font-black text-orange-400 leading-none drop-shadow-2xl ${
                isPortrait ? 'text-[20rem]' : 'text-[15rem]'
              }`}>
                {deskNumberParam}
              </div>
            </div>
            
            <div className={`text-white/90 mb-6 font-semibold ${
              isPortrait ? 'text-4xl' : 'text-3xl'
            }`}>
              {flightDisplay.flight ? 'Check-in not available' : 'No flights currently checking in here'}
            </div>

            {nextScheduledFlight && (
              <div className={`text-orange-300 mb-6 font-medium bg-black/30 py-3 px-6 rounded-2xl ${
                isPortrait ? 'text-3xl' : 'text-2xl'
              }`}>
                Next flight: {nextScheduledFlight.FlightNumber} to {nextScheduledFlight.DestinationCityName} at {nextScheduledFlight.ScheduledDepartureTime}
              </div>
            )}

            <div className={`text-white/80 mb-6 ${
              isPortrait ? 'text-2xl' : 'text-xl'
            }`}>
              {flightDisplay.flight ? `Status: ${flightDisplay.flight.StatusEN}` : 'Please check the main display'}
            </div>

            <div className={`text-white/70 mb-4 ${
              isPortrait ? 'text-xl' : 'text-lg'
            }`}>
              Updated at: {lastUpdate || 'Never'}
            </div>

            {loading && (
              <div className={`text-white/60 mt-4 ${
                isPortrait ? 'text-lg' : 'text-base'
              }`}>
                Checking for updates...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // At this point, shouldShowCheckIn je true
  const safeDisplayFlight = flightDisplay.flight;

  // Debug Panel komponenta
  const DebugPanel = () => (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-md border border-yellow-500/50">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold flex items-center gap-2">
          <Bug className="w-4 h-4" />
          Debug Panel (Alt+D to toggle)
        </div>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-xs bg-red-500/50 hover:bg-red-500 px-2 py-1 rounded"
          type="button"
        >
          ✕
        </button>
      </div>
      
      {debugInfo && (
        <>
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Display Flight:</div>
            <div className="font-mono">{flightDisplay.flightNumber}</div>
            <div>Status: {safeDisplayFlight?.StatusEN}</div>
            <div>Transitioning: {isTransitioning ? 'Yes' : 'No'}</div>
          </div>
          
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Queue State:</div>
            <div>Queue length: {transitionQueueRef.current.length}</div>
            <div>Is processing: {isProcessingQueueRef.current ? 'Yes' : 'No'}</div>
            <div>Transition guard: {transitionGuardRef.current ? 'Active' : 'Inactive'}</div>
          </div>
          
          <div className="mb-2">
            <div className="text-yellow-400 font-semibold">Cache Stats:</div>
            <div>Preloaded images: {preloadedImages.size}</div>
            <div>Pending preloads: {pendingPreloads.size}</div>
            <div>Logo cache: {logoCacheRef.current.size}</div>
            <div>City cache: {cityImageCacheRef.current.size}</div>
          </div>
        </>
      )}
      
      {!debugInfo && (
        <div className="text-slate-400">No debug info available</div>
      )}
    </div>
  );

  // Portrait mod za aktivan check-in
  if (isPortrait) {
    return (
      <div className={`h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex flex-col ${isTransitioning ? 'transition-guard' : ''}`}>
        
        {/* Debug toggle button */}
        {DEVELOPMENT && !showDebug && (
          <button
            onClick={() => setShowDebug(true)}
            className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
            title="Show Debug (Alt+D)"
            type="button"
          >
            <Bug className="w-5 h-5" />
          </button>
        )}
        
        {/* Debug Panel */}
        {DEVELOPMENT && showDebug && <DebugPanel />}
        
        {/* Header */}
        <div className="flex-shrink-0 p-2 bg-white/5 backdrop-blur-lg border-b border-white/10 mt-[0.3cm] gpu-accelerated">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-[4rem] font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Updated</div>
              <div className="text-sm font-mono text-slate-300">{lastUpdate}</div>
              {loading && (
                <div className="text-xs text-slate-500 mt-0.5">Updating...</div>
              )}
            </div>
          </div>
        </div>

        {/* Glavni sadržaj */}
        <div className="flex-1 flex flex-col px-2 py-1 min-h-0">
          
          {/* Flight Info Card */}
          <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 gpu-accelerated">
            
            {/* Airline Logo sa prilagođenim card-om za business class */}
            <div className="flex flex-col items-center mb-4">
              {/* Logo container - Fixed aspect ratio box */}
              {flightDisplay.logoUrl && (
<div className="relative w-full max-w-[90vw] h-[220px] bg-white rounded-xl shadow-lg mb-3">
  <Image
    src={flightDisplay.logoUrl}
    alt={flightDisplay.airlineName}
    fill={true}
    sizes="(max-width: 768px) 90vw, 800px"
    className="object-contain p-4"
    priority
  />
</div>


              )}
              
              {/* CLASS BADGE - BUSINESS/ECONOMY KLASA sa prilagođenom širinom */}
              {flightDisplay.classType && (
                <div className="w-full max-w-[90vw] mb-3">
                  <div className={`rounded-xl px-6 py-3 text-center shadow-lg ${
                    flightDisplay.classType === 'business' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400'
                  }`}>
                    <h1 className="text-7xl font-black text-white tracking-wider">
                      {flightDisplay.classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
                    </h1>
                  </div>
                </div>
              )}
              
              {/* Flight Number */}
              <div className="text-center w-full">
                <div className="text-[13rem] font-black text-yellow-500 leading-tight flight-number-transition">
                  {flightDisplay.flightNumber}
                </div>
              </div>
            </div>

            {/* Code Share */}
            {safeDisplayFlight?.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 mb-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-blue-300">
                  Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            {/* Destination sa slikom grada */}
            <div className="flex items-end gap-4 mb-3">
              {/* Fixed aspect ratio city image box */}
              <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl flex-shrink-0 mb-3 aspect-ratio-box">
                {flightDisplay.cityUrl && (
                  <Image
                    src={flightDisplay.cityUrl}
                    alt={flightDisplay.destinationCity}
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                    sizes="224px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <div className="flex-1 text-right">
                <div className="text-[9rem] font-bold text-white mb-1 leading-tight city-name-transition">
                  {flightDisplay.destinationCity}
                </div>
                <div className="text-8xl font-bold text-cyan-400 flex items-center justify-end gap-3 mb-2">
                  <span className="text-[1.25rem] bg-orange-500 text-white px-3 py-1 rounded-full font-semibold">
                    Airport IATA code:
                  </span>
                  {flightDisplay.destinationCode}
                </div>
              </div>
              
              <MapPin className="w-10 h-10 text-cyan-400 flex-shrink-0 mb-3" />
            </div>

            {/* Warning text */}
            <div className="flex items-center justify-center gap-2 mt-1 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 backdrop-blur-sm mx-auto w-fit">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div className="text-[1.36rem] font-bold text-yellow-300 text-center">
                Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
              </div>
            </div>
          </div>

          {/* Times Card */}
          <div className="mb-2 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 gpu-accelerated">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Scheduled Time */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div className="text-sm text-slate-400">Scheduled</div>
                </div>
                <div className="text-8xl font-mono font-bold text-white">
                  {flightDisplay.scheduledTime}
                </div>
              </div>

              {/* Estimated Time */}
              {flightDisplay.estimatedTime && 
               flightDisplay.estimatedTime !== flightDisplay.scheduledTime && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="text-sm text-yellow-400">Expected</div>
                  </div>
                  <div className="text-8xl font-mono font-bold text-yellow-400 animate-pulse">
                    {flightDisplay.estimatedTime}
                  </div>
                </div>
              )}

              {/* Gate Info */}
              {flightDisplay.gateNumber && (
                <div className="col-span-2 text-center mt-2">
                  <div className="text-3xl text-slate-400 mb-0">
                    Gate Information
                  </div>
                  <div className="text-5xl font-bold text-white">
                    Gate {flightDisplay.gateNumber}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-3xl text-slate-300 mt-0">
                    <Info className="w-5 h-5 text-yellow-400" />
                    <span>After check-in please proceed to gate {flightDisplay.gateNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ad Image sa crossfade */}
          {adImages.length > 0 && (
            <div className="flex-1 min-h-[400px] bg-slate-800 rounded-xl overflow-hidden flex items-stretch ad-image-container">
              <div className={`ad-image ${isAdTransitioning ? 'inactive' : 'active'}`}>
                <Image
                  src={adImages[currentAdIndex]}
                  alt="Advertisement"
                  fill
                  className="object-fill"
                  priority
                  quality={80}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
              <div className={`ad-image ${isAdTransitioning ? 'active' : 'inactive'}`}>
                <Image
                  src={adImages[nextAdIndex]}
                  alt="Advertisement"
                  fill
                  className="object-fill"
                  priority
                  quality={80}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-center items-center space-x-2 text-xs font-inter py-1">
            <Image
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACz0lEQVR4nO2YPWhUQRDHYzSRREHUiILRxspCBIUYC20sxMJSEtTC1lYJfqWwUGOTIGiIYieIiBiEoI1WgoWFoBIRRBD8ACV+gaA5Nf5k4hiGx91l571971K8Hxy8e7s7O/+73Z3ZaWoqKSnJDDAf2AocB24Cz4DPwE/9yPO4tkmfbqB5Lji+BjgLvMXPH2AA6GwE4xuAS0CF7FSAEaCjKOf3Ap+Iz0egN0/HW4DL5M9FmSu28+3AHYrjtswZ85cv0vn/3AVaYwgoYtnUYiSr8/toPD1pnV8PtDNae/6deP4jVs/5usJwmggbI0hV4xjwSFOKUCZdEVvTg7yYPolmAhc5xA57EzNvbHAHagL7ZOibm8vA6KAHUrNLLTOQEruchgOhKESBZm9MkxvdA7wP7evkaImDUa7WKjd0hffFzI0TAeFYBaudKDgKehghxp8o17CzTjRdTwESIAPf5nxi/yjzvAv5EFDBZhICxeslgRgHfc19C+uqA+S5R96Xpvj+DgHe5b2J99VXSEfNuh1lKX4C1eW7i0QgChHvAPPP+gmm7rxHfy9UiApnlYOJa+sK0HXa7D30hArojCvgGrDTt24Apk2F62RwioLna+Z1SgPBAlotpHyQdr+ySnE2EVMxipsiHjG3JWp+nEHAqyHmdpNMZD2TfLAZO1Gj/Aaw39rcAvx32ZfzKYAE6iZT7YvIQWGDsn3GMPe9yXidYlsOlvt/ybwWeBIyR1HypW4BO0htZgCzLjcb+Ji2/72NPKufNJFKrjMljW3EDTtbpO5TJeVNalFplTE4n7D+q0mfM7pmsItoji/hl77fAhkRguxWlLpoQ0RL5ZJJY0GbsS71InC6y8ZrwZ59uR8auJHf7cnO8St10OGU+Y/kCtHvdqkz/Zs8AAAAASUVORK5CYII="
              alt="nextjs"
              width={20}
              height={20}
              unoptimized
              className="inline-block"
            />
            <a
              href="mailto:alen.vocanec@apm.co.me"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent hover:underline"
            >
              code by Tivat Airport, 2025
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Landscape mod za aktivan check-in
  return (
    <div className={`w-[95vw] h-[95vh] mx-auto bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden gpu-accelerated ${isTransitioning ? 'transition-guard' : ''}`}>
      
      {/* Debug toggle button */}
      {DEVELOPMENT && !showDebug && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed top-4 left-4 bg-black/70 hover:bg-black text-white p-2 rounded-full z-50"
          title="Show Debug (Alt+D)"
          type="button"
        >
          <Bug className="w-5 h-5" />
        </button>
      )}
      
      {/* Debug Panel */}
      {DEVELOPMENT && showDebug && <DebugPanel />}
      
      <div className="h-full grid grid-cols-12 gap-8 p-3 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        
        <div className="col-span-7 flex flex-col justify-between">
          
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <div>
                <h1 className="text-8xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                  CHECK-IN {deskNumberParam}
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-8 mb-10">
              {/* Logo container - Fixed aspect ratio box */}
              {flightDisplay.logoUrl && (
         <div className="w-72 h-36 bg-white rounded-2xl p-3 shadow-lg flex items-center justify-center">
  <Image
    src={flightDisplay.logoUrl}
    alt={flightDisplay.airlineName}
    width={360}
    height={120}
    className="object-contain"
    priority
  />
</div>

              )}
              
              {/* CLASS BADGE - LANDSCAPE VERSION */}
              {flightDisplay.classType && (
                <div className="mb-6">
                  <div className={`rounded-xl px-6 py-3 text-center shadow-lg ${
                    flightDisplay.classType === 'business' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400'
                  }`}>
                    <h1 className="text-5xl font-black text-white tracking-wider">
                      {flightDisplay.classType === 'business' ? 'BUSINESS CLASS' : 'ECONOMY CLASS'}
                    </h1>
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <div className="text-[12rem] font-black text-yellow-500 mb-2 flight-number-transition">
                  {flightDisplay.flightNumber}
                </div>
                <div className="text-lg text-slate-400">{flightDisplay.airlineName}</div>
              </div>
            </div>

            {safeDisplayFlight?.CodeShareFlights && safeDisplayFlight.CodeShareFlights.length > 0 && (
              <div className="flex items-center gap-4 bg-blue-500/20 px-6 py-3 rounded-3xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="text-2xl text-blue-300">
                  Also: {safeDisplayFlight.CodeShareFlights.join(', ')}
                </div>
              </div>
            )}

            <div className="flex items-center gap-8">
              {/* Fixed aspect ratio city image box */}
              <div className="relative w-80 h-80 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0 aspect-ratio-box">
                {flightDisplay.cityUrl && (
                  <Image
                    src={flightDisplay.cityUrl}
                    alt={flightDisplay.destinationCity}
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                    sizes="320px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <div className="flex-1">
                <div className="text-8xl font-bold text-white mb-2 city-name-transition">
                  {flightDisplay.destinationCity}
                </div>
                <div className="text-8xl font-bold text-cyan-400">
                  {flightDisplay.destinationCode}
                </div>
                
                {/* Warning text za landscape */}
                <div className="flex items-center gap-2 mt-4 bg-yellow-500/20 border border-yellow-400/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div className="text-lg font-semibold text-yellow-300">
                    Portable chargers: CABIN BAGGAGE ONLY! Not in overhead bins. No charging during flight.
                  </div>
                </div>
              </div>
              
              <MapPin className="w-12 h-12 text-cyan-400" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xl text-slate-400">Last Updated</div>
            <div className="text-2xl font-mono text-slate-300">{lastUpdate}</div>
            {loading && (
              <div className="text-sm text-slate-500 mt-1">Updating data...</div>
            )}
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-between border-l-2 border-white/10 pl-8">
          
          <div className="space-y-8">
            <div className="text-right">
              <div className="flex items-center justify-end gap-4 mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
                <div className="text-2xl text-slate-400">Scheduled Departure</div>
              </div>
              <div className="text-7xl font-mono font-bold text-white leading-tight">
                {flightDisplay.scheduledTime}
              </div>
            </div>

            {flightDisplay.estimatedTime && 
             flightDisplay.estimatedTime !== flightDisplay.scheduledTime && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-4 mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-400" />
                  <div className="text-2xl text-yellow-400">Expected Departure</div>
                </div>
                <div className="text-6xl font-mono font-bold text-yellow-400 animate-pulse leading-tight">
                  {flightDisplay.estimatedTime}
                </div>
              </div>
            )}
          </div>

          <div className="text-right space-y-6">
            <div>
              <div className="text-6xl font-bold text-green-400 leading-tight animate-pulse">
                CHECK-IN OPEN
              </div>
              <div className="text-4xl text-green-400 mt-2">
                Please proceed to check-in
              </div>
            </div>

            {flightDisplay.gateNumber && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                <div className="text-2xl text-slate-400 mb-3">Gate Information</div>
                <div className="text-4xl font-bold text-white">
                  Gate {flightDisplay.gateNumber}
                </div>
                <div className="flex items-center justify-end gap-2 text-xl text-slate-300 mt-2">
                  <Info className="w-6 h-6 text-yellow-400" />
                  <span>After check-in please proceed to gate {flightDisplay.gateNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}