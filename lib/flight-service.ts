import type { Flight, FlightData } from '@/types/flight';

const FLIGHT_API_URL = '/api/flights';
const BUSINESS_CLASS_AIRLINES = ['TK', 'LH', 'EW','4O','40', 'SK', 'OS','BA', 'AZ', 'AF', 'KL', 'QR', 'EK','FZ','LY','SU','ET', ];

// Cache za sprečavanje previše requesta i fallback podatke
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 30000; // 30 sekundi

// Enhanced Flight type sa dodatnim poljima za desk tracking
export type EnhancedFlight = Flight & { 
  _allDesks?: string[]; 
  _deskIndex?: number;
};


export async function fetchFlightData(): Promise<FlightData> {
  // Sprečavamo previše česte requeste
  const now = Date.now();
  if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
    console.log('Skipping fetch - too soon after last request');
    return getCachedData();
  }

  try {
    console.log('Fetching flight data from API...');
    
    const response = await fetch(FLIGHT_API_URL, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const data = await response.json();
    
    // Validiraj podatke
    if (data && (Array.isArray(data.departures) || Array.isArray(data.arrivals))) {
      // Sačuvaj vrijeme uspješnog fetcha
      lastFetchTime = Date.now();
      // Cache podatke
      cacheData(data);
      return {
        departures: Array.isArray(data.departures) ? data.departures : [],
        arrivals: Array.isArray(data.arrivals) ? data.arrivals : [],
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: 'live'
      };
    } else {
      throw new Error('Invalid data format received from API');
    }
  } catch (error) {
    console.error('Error fetching flight data:', error);
    
    // Vrati cached podatke ako postoje
    const cached = getCachedData();
    if (cached.departures.length > 0 || cached.arrivals.length > 0) {
      console.log('Returning cached data due to error');
      return {
        ...cached,
        source: 'cached',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Fallback na prazne podatke
    return {
      departures: [],
      arrivals: [],
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Failed to fetch flight data'
    };
  }
}

// Cache funkcije
function cacheData(data: FlightData): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('flightData_cache', JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Could not cache flight data:', e);
    }
  }
}

function getCachedData(): FlightData {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('flightData_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Provjeri da li je cache stariji od 10 minuta
        const cachedAt = new Date(parsed.cachedAt);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (cachedAt > tenMinutesAgo) {
          console.log('Using cached flight data');
          return {
            departures: Array.isArray(parsed.departures) ? parsed.departures : [],
            arrivals: Array.isArray(parsed.arrivals) ? parsed.arrivals : [],
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Could not retrieve cached flight data:', e);
    }
  }
  
  return {
    departures: [],
    arrivals: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Helper funkcije za filtriranje letova
/**
 * Filter out flights that should not be displayed (departed, cancelled, diverted, etc.)
 */
export function filterActiveFlights(flights: Flight[]): Flight[] {
  if (!flights || flights.length === 0) return [];

  return flights.filter(flight => shouldDisplayFlight(flight));
}

/**
 * Check if a specific flight should be displayed
 * IMPROVED VERSION with exact word matching
 */
export function shouldDisplayFlight(flight: Flight): boolean {
  if (!flight || !flight.StatusEN) return false;
  
  const status = flight.StatusEN.toLowerCase().trim();
  
  // Lista statusa koji se NE prikazuju
  const excludedStatuses = [
    'departed',
    'cancelled', 
    'canceled',
    'diverted',
    'completed',
    'arrived',
    'landed',
    'poletio',
    'otkazan',
    'preusmjeren'
  ];
  
  // Provjeri da li status sadrži bilo koju od zabranjenih riječi
  const hasExcludedStatus = excludedStatuses.some(excluded => {
    // Exact word matching - traži cijelu riječ
    const regex = new RegExp(`\\b${excluded}\\b`, 'i');
    return regex.test(status);
  });
  
  return !hasExcludedStatus;
}

/**
 * Check if flight has a completed status (for more precise matching)
 */
export function isFlightCompleted(flight: Flight): boolean {
  if (!flight || !flight.StatusEN) return false;
  
  const status = flight.StatusEN.toLowerCase().trim();
  
  const completedStatuses = [
    'departed',
    'cancelled', 
    'canceled',
    'diverted',
    'completed',
    'arrived',
    'landed',
    'poletio',
    'otkazan',
    'preusmjeren'
  ];
  
  // Exact word matching
  return completedStatuses.some(completed => {
    const regex = new RegExp(`\\b${completed}\\b`, 'i');
    return regex.test(status);
  });
}

/**
 * Check if flight should be displayed on check-in counters
 * PROŠIRENA VERZIJA: prikazuje processing I boarding letove koji nisu departed I nisu closed
 */
export function shouldDisplayOnCheckIn(flight: Flight): boolean {
  if (!flight || !flight.StatusEN) return false;
  
  const status = flight.StatusEN.toLowerCase().trim();
  
  // Check-in prikazuje letove sa "processing" ILI "boarding" statusom
  const isProcessingOrBoarding = status.includes('processing') || status.includes('boarding');
  
  // I koji NISU departed/cancelled/diverted
  const isNotCompleted = !isFlightCompleted(flight);
  
  // I koji NISU closed/gate closed
  const isNotClosed = !status.includes('closed') && !status.includes('gate closed');
  
  return isProcessingOrBoarding && isNotCompleted && isNotClosed;
}

/**
 * Filter flights specifically for check-in display
 */
export function filterCheckInFlights(flights: Flight[]): Flight[] {
  if (!flights || flights.length === 0) return [];

  return flights.filter(flight => shouldDisplayOnCheckIn(flight));
}

// Funkcije za dobijanje letova po različitim kriterijima
export function getFlightsByCheckIn(flights: Flight[], deskNumber: string): Flight[] {
  if (!flights || !deskNumber) return [];
  
  const normalizedDesk = deskNumber.replace(/^0+/, '');
  const deskVariants = [
    deskNumber,
    normalizedDesk,
    deskNumber.padStart(2, '0'),
  ];
  
  const checkInFlights = flights.filter(flight => {
    if (!flight.CheckInDesk) return false;
    
    // KLJUČNA ISPRAVKA: EXACT matching
    return deskVariants.some(variant => {
      // Provjeri exact match
      const exactMatch = flight.CheckInDesk === variant;
      // Ili ako je string koji sadrži exact match (npr. "1,2,3" -> provjeri da li sadrži "1" kao exact segment)
      const containsExact = typeof flight.CheckInDesk === 'string' && 
        flight.CheckInDesk.split(',').map(s => s.trim()).includes(variant);
      
      return exactMatch || containsExact;
    });
  });
  
  // NOVO: Kombinuj letove sa istim brojem leta u jedan
  const combinedFlights = combineFlightsWithSameNumber(checkInFlights);
  
  // SPECIFIČAN FILTER ZA CHECK-IN
  return filterCheckInFlights(combinedFlights);
}
// Zatim dodajte ovu funkciju posle getFlightsByCheckIn funkcije:

/**
 * Get flight for specific check-in desk with exact desk matching
 * Returns enhanced flight with desk position information
 */
export function getFlightForSpecificDesk(
  flights: Flight[], 
  deskNumber: string
): EnhancedFlight | null {
  if (!flights || !deskNumber || flights.length === 0) {
    return null;
  }
  
  // Group flights by flight number
  const flightsByNumber = new Map<string, Flight[]>();
  
  flights.forEach((flight: Flight) => {
    if (!flight.CheckInDesk) {
      return;
    }
    
    const key = flight.FlightNumber;
    const flightList = flightsByNumber.get(key) || [];
    flightList.push(flight);
    flightsByNumber.set(key, flightList);
  });
  
  // For each flight group, find desk and determine position
  const flightEntries = Array.from(flightsByNumber.entries());
  for (const [flightNumber, flightGroup] of flightEntries) {
    if (flightGroup.length === 0) {
      continue;
    }
    
    // Extract all unique desks from this flight group
    const allDesks: string[] = [];
    
    flightGroup.forEach((flight: Flight) => {
      if (flight.CheckInDesk) {
        const desks = flight.CheckInDesk
          .split(',')
          .map((d: string) => d.trim())
          .filter((d: string) => d !== '');
        
        desks.forEach((desk: string) => {
          if (!allDesks.includes(desk)) {
            allDesks.push(desk);
          }
        });
      }
    });
    
    // Sort desks numerically
    allDesks.sort((a: string, b: string): number => {
      const numA = parseInt(normalizeDeskNumber(a), 10) || 0;
      const numB = parseInt(normalizeDeskNumber(b), 10) || 0;
      return numA - numB;
    });
    

    
    if (allDesks.length === 0) {
      continue;
    }
    
    // Check if requested desk exists in this group
    const deskVariants = getDeskNumberVariants(deskNumber);
    
    for (const variant of deskVariants) {
      const foundIndex = allDesks.findIndex((desk: string): boolean => {
        const normalizedDesk = normalizeDeskNumber(desk);
        return normalizedDesk === variant;
      });
      
      if (foundIndex !== -1) {
        // Found the desk! Return first flight from group with enhanced info
        const firstFlight = flightGroup[0];
        
        const enhancedFlight: EnhancedFlight = {
          ...firstFlight,
          CheckInDesk: allDesks[foundIndex],
          _allDesks: allDesks,
          _deskIndex: foundIndex
        };
        

        
        return enhancedFlight;
      }
    }
  }
  
  return null;
}

/**
 * Kombinuje više letova sa istim brojem u jedan let sa svim šalterima
 */
function combineFlightsWithSameNumber(flights: Flight[]): Flight[] {
  const flightMap = new Map<string, Flight>();
  
  flights.forEach(flight => {
    const key = flight.FlightNumber;
    
    if (!flightMap.has(key)) {
      // Prvi put vidimo ovaj let
      flightMap.set(key, { ...flight });
    } else {
      // Već imamo ovaj let, kombinuj šaltere
      const existingFlight = flightMap.get(key)!;
      
      // Kombinuj CheckInDesk
      const existingDesks = existingFlight.CheckInDesk.split(',')
        .map(d => d.trim())
        .filter(d => d !== '');
      
      const newDesks = flight.CheckInDesk.split(',')
        .map(d => d.trim())
        .filter(d => d !== '');
      
      // Dodaj nove šaltere koji već nisu prisutni
      newDesks.forEach(desk => {
        if (!existingDesks.includes(desk)) {
          existingDesks.push(desk);
        }
      });
      
      // Sortiraj i spoj
      existingDesks.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      
      existingFlight.CheckInDesk = existingDesks.join(', ');
    }
  });
  
  return Array.from(flightMap.values());
}

export function getFlightsByGate(flights: Flight[], gateNumber: string): Flight[] {
  if (!flights || !gateNumber) return [];
  
  const normalizedGate = gateNumber.replace(/^0+/, '');
  const gateVariants = [
    gateNumber,
    normalizedGate,
    gateNumber.padStart(2, '0'),
  ];
  
  const gateFlights = flights.filter(flight => {
    if (!flight.GateNumber) return false;
    
    // Provjeri da li GateNumber sadrži traženi gate
    return gateVariants.some(variant => 
      flight.GateNumber.includes(variant)
    );
  });
  
  // FILTER OUT FLIGHTS THAT SHOULDN'T BE DISPLAYED
  return filterActiveFlights(gateFlights);
}

export function getFlightsByBaggage(flights: Flight[], baggageReclaim: string): Flight[] {
  const baggageFlights = flights.filter((flight) => flight.BaggageReclaim === baggageReclaim);
  
  // FILTER OUT FLIGHTS THAT SHOULDN'T BE DISPLAYED - DODANO ZA BAGGAGE
  return filterActiveFlights(baggageFlights);
}

export function getProcessingFlights(flights: Flight[]): Flight[] {
  const processingFlights = flights.filter(flight => 
    flight.StatusEN?.toLowerCase() === 'processing'
  );
  
  // FILTER OUT FLIGHTS THAT SHOULDN'T BE DISPLAYED - DODANO ZA PROCESSING
  return filterActiveFlights(processingFlights);
}

// Ostale pomoćne funkcije
export function removeDuplicateFlights(flights: Flight[]): Flight[] {
  const seenFlights = new Map<string, Flight>();
  
  flights.forEach(flight => {
    const key = flight.FlightNumber + '_' + flight.ScheduledDepartureTime;
    
    if (!seenFlights.has(key)) {
      // First time seeing this flight, add it
      seenFlights.set(key, flight);
    } else {
      const existingFlight = seenFlights.get(key)!;
      
      // Combine check-in desks
      if (flight.CheckInDesk && existingFlight.CheckInDesk !== flight.CheckInDesk) {
        // Create array of all unique check-in desks
        const allDesks = [
          ...(existingFlight.CheckInDesk?.split(',') || []),
          ...(flight.CheckInDesk?.split(',') || [])
        ]
          .map(desk => desk.trim())
          .filter(desk => desk !== '')
          .filter((desk, index, array) => array.indexOf(desk) === index) // Remove duplicates
          .sort();
        
        existingFlight.CheckInDesk = allDesks.join(', ');
      }
      
      // Combine gate numbers
      if (flight.GateNumber && existingFlight.GateNumber !== flight.GateNumber) {
        // Create array of all unique gate numbers
        const allGates = [
          ...(existingFlight.GateNumber?.split(',') || []),
          ...(flight.GateNumber?.split(',') || [])
        ]
          .map(gate => gate.trim())
          .filter(gate => gate !== '')
          .filter((gate, index, array) => array.indexOf(gate) === index) // Remove duplicates
          .sort();
        
        existingFlight.GateNumber = allGates.join(', ');
      }
      
      // Update the existing flight with combined data
      seenFlights.set(key, existingFlight);
    }
  });
  
  return Array.from(seenFlights.values());
}

/**
 * Get unique flights for departures page (no duplicates from multiple gates/check-ins)
 */
export function getUniqueDepartures(flights: Flight[]): Flight[] {
  const uniqueFlights = removeDuplicateFlights(flights);
  
  return uniqueFlights.sort((a, b) => {
    const timeA = a.ScheduledDepartureTime;
    const timeB = b.ScheduledDepartureTime;
    
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    return timeA.localeCompare(timeB);
  });
}

/**
 * Get unique departures with departed flights logic (removes duplicates and handles departed flights)
 */
export function getUniqueDeparturesWithDeparted(flights: Flight[]): Flight[] {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const isDeparted = (status: string): boolean => {
    const statusLower = status.toLowerCase();
    return statusLower.includes('departed') || statusLower.includes('poletio');
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

  const departedFlights: Flight[] = [];
  const activeFlights: Flight[] = [];

  // First remove duplicates
  const uniqueFlights = removeDuplicateFlights(flights);

  // Separate departed and active flights
  uniqueFlights.forEach(flight => {
    if (isDeparted(flight.StatusEN)) {
      departedFlights.push(flight);
    } else {
      activeFlights.push(flight);
    }
  });

  // Sort departed flights by time (most recent first)
  const sortedDepartedFlights = departedFlights.sort((a, b) => {
    const timeA = getFlightDateTime(a);
    const timeB = getFlightDateTime(b);
    if (!timeA || !timeB) return 0;
    return timeB.getTime() - timeA.getTime();
  });

  // Keep only recent departed flights (last 30 minutes)
  const recentDepartedFlights = sortedDepartedFlights
    .filter(flight => {
      const flightTime = getFlightDateTime(flight);
      return flightTime && flightTime >= thirtyMinutesAgo;
    })
    .slice(0, 2);

  // Combine active flights with recent departed flights
  const allFilteredFlights = [...activeFlights, ...recentDepartedFlights];
  
  // Sort all flights by scheduled departure time (earliest first)
  return allFilteredFlights.sort((a, b) => {
    const timeA = a.ScheduledDepartureTime;
    const timeB = b.ScheduledDepartureTime;
    
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    return timeA.localeCompare(timeB);
  });
}

/**
 * Get flights for gate with priority: active flights first, then scheduled flights
 */
export function getFlightsByGateWithPriority(flights: Flight[], gateNumber: string): Flight[] {
  if (!flights || !gateNumber) return [];
  
  const normalizedGate = gateNumber.replace(/^0+/, '');
  const gateVariants = [
    gateNumber,
    normalizedGate,
    gateNumber.padStart(2, '0'),
  ];
  
  const gateFlights = flights.filter(flight => {
    if (!flight.GateNumber) return false;
    
    // Provjeri da li GateNumber sadrži traženi gate
    return gateVariants.some(variant => 
      flight.GateNumber.includes(variant)
    );
  });
  
  // Prvo pokušaj da nađeš aktívne letove
  const activeFlights = filterActiveFlights(gateFlights);
  
  if (activeFlights.length > 0) {
    return activeFlights;
  }
  
  // Ako nema aktivnih, vrati sledeći let po rasporedu (najraniji)
  if (gateFlights.length > 0) {
    const nextScheduledFlight = gateFlights
      .filter(flight => flight.ScheduledDepartureTime)
      .sort((a, b) => a.ScheduledDepartureTime.localeCompare(b.ScheduledDepartureTime))[0];
    
    return nextScheduledFlight ? [nextScheduledFlight] : [];
  }
  
  return [];
}

export function hasBusinessClassCheckIn(flightNumber: string): boolean {
  if (!flightNumber) return false;
  
  // Extract airline code (first 2 characters)
  const airlineCode = flightNumber.substring(0, 2).toUpperCase();
  
  return BUSINESS_CLASS_AIRLINES.includes(airlineCode);
}

/**
 * Get check-in class type for specific desk number
 * Returns 'business', 'economy', or null
 */
/**
 * Get check-in class type for specific desk number
 * Returns 'business', 'economy', or null
 * IMPROVED VERSION with better normalization and exact matching
 */

/**
 * Get check-in class type for specific desk number
 * Returns 'business', 'economy', or null
 * IMPROVED VERSION with better normalization and exact matching
 */
export function getCheckInClassType(
  flight: Flight | EnhancedFlight, 
  currentDeskNumber: string
): 'business' | 'economy' | null {
  if (!flight || !flight.FlightNumber || !flight.CheckInDesk) {
    return null;
  }
  
  // Check if this airline has business class check-in
  if (!hasBusinessClassCheckIn(flight.FlightNumber)) {
    return null;
  }
  
  // Check if we have enhanced information
  const enhancedFlight = flight as EnhancedFlight;
  if (enhancedFlight._allDesks && enhancedFlight._deskIndex !== undefined) {
    console.log('DEBUG getCheckInClassType (enhanced):');
    console.log('Flight:', flight.FlightNumber);
    console.log('All desks:', enhancedFlight._allDesks);
    console.log('Desk index:', enhancedFlight._deskIndex);
    console.log('Current desk from URL:', currentDeskNumber);
    
    // If we have only one desk, it's BUSINESS
    if (enhancedFlight._allDesks.length === 1) {
      console.log('Single desk - BUSINESS CLASS');
      return 'business';
    }
    
    // If we have multiple desks, first is BUSINESS, others ECONOMY
    const result = enhancedFlight._deskIndex === 0 ? 'business' : 'economy';
    console.log(`Multiple desks (${enhancedFlight._allDesks.length}) - ${result}`);
    return result;
  }
  
  // Fallback: old logic if we don't have enhanced information
  console.log('DEBUG getCheckInClassType (fallback):');
  console.log('Flight:', flight.FlightNumber);
  console.log('CheckInDesk:', flight.CheckInDesk);
  
  const deskString = flight.CheckInDesk as string;
  
  // Normalize current desk number
  const normalizedCurrent = normalizeDeskNumber(currentDeskNumber);
  const currentVariants = getDeskNumberVariants(currentDeskNumber);
  
  // Parse all check-in desks
  const allDesks = deskString
    .split(/[,;]/) // Split by comma or semicolon
    .map(desk => desk.trim())
    .filter(desk => desk !== '')
    .map(desk => normalizeDeskNumber(desk));
  
  console.log('DEBUG - All desks:', allDesks);
  console.log('DEBUG - Current desk (normalized):', normalizedCurrent);
  console.log('DEBUG - Current variants:', currentVariants);
  
  if (allDesks.length === 0) {
    return null;
  }
  
  // Find position of current desk
  let currentIndex = -1;
  currentIndex = allDesks.findIndex(desk => desk === normalizedCurrent);
  
  if (currentIndex === -1) {
    for (const variant of currentVariants) {
      currentIndex = allDesks.findIndex(desk => desk === variant);
      if (currentIndex !== -1) break;
    }
  }
  
  if (currentIndex === -1) {
    return null;
  }
  
  // Business/Economy logic
  return allDesks.length === 1 ? 'business' : 
         currentIndex === 0 ? 'business' : 'economy';
}

/**
 * Helper function to normalize desk numbers
 * Removes leading zeros and standardizes format
 */
function normalizeDeskNumber(deskNumber: string): string {
  if (!deskNumber) return '';
  
  // Remove all non-digit characters first
  const digitsOnly = deskNumber.replace(/\D/g, '');
  
  // Remove leading zeros
  const withoutLeadingZeros = digitsOnly.replace(/^0+/, '');
  
  // Return original if removing zeros results in empty string
  return withoutLeadingZeros || digitsOnly || deskNumber;
}

/**
 * Get all possible variants of a desk number for matching
 */
function getDeskNumberVariants(deskNumber: string): string[] {
  const variants = new Set<string>();
  
  if (!deskNumber) return [];
  
  // Original
  variants.add(deskNumber);
  
  // Without leading zeros
  variants.add(deskNumber.replace(/^0+/, ''));
  
  // With leading zeros (2 digits)
  if (deskNumber.length === 1) {
    variants.add(`0${deskNumber}`);
  }
  
  // Numeric version only
  const numericMatch = deskNumber.match(/\d+/);
  if (numericMatch) {
    const numeric = numericMatch[0];
    variants.add(numeric);
    variants.add(numeric.replace(/^0+/, ''));
    if (numeric.length === 1) {
      variants.add(`0${numeric}`);
    }
  }
  
  return Array.from(variants);
}

/**
 * DEBUG function to check why class type is not showing
 */
/**
 * DEBUG function to check why class type is not showing
 */
export function debugCheckInClassType(
  flight: Flight | EnhancedFlight, 
  currentDeskNumber: string
): {
  classType: 'business' | 'economy' | null;
  debugInfo: {
    flightNumber: string;
    airlineCode: string;
    hasBusinessClass: boolean;
    checkInDesk: string;
    normalizedDesks: string[];
    currentDesk: string;
    normalizedCurrent: string;
    currentVariants: string[];
    currentIndex: number;
    deskCount: number;
    hasEnhancedInfo: boolean;
    enhancedDesks?: string[];
    enhancedIndex?: number;
  };
} {
  const enhancedFlight = flight as EnhancedFlight;
  const debugInfo = {
    flightNumber: flight?.FlightNumber || '',
    airlineCode: flight?.FlightNumber ? flight.FlightNumber.substring(0, 2).toUpperCase() : '',
    hasBusinessClass: false,
    checkInDesk: flight?.CheckInDesk || '',
    normalizedDesks: [] as string[],
    currentDesk: currentDeskNumber || '',
    normalizedCurrent: '',
    currentVariants: [] as string[],
    currentIndex: -1,
    deskCount: 0,
    hasEnhancedInfo: !!(enhancedFlight?._allDesks && enhancedFlight._deskIndex !== undefined),
    enhancedDesks: enhancedFlight?._allDesks,
    enhancedIndex: enhancedFlight?._deskIndex,
  };
  
  if (!flight || !flight.FlightNumber) {
    return { classType: null, debugInfo };
  }
  
  debugInfo.hasBusinessClass = hasBusinessClassCheckIn(flight.FlightNumber);
  debugInfo.normalizedCurrent = normalizeDeskNumber(currentDeskNumber);
  debugInfo.currentVariants = getDeskNumberVariants(currentDeskNumber);
  
  // Parse all check-in desks
  if (flight.CheckInDesk) {
    const allDesks = flight.CheckInDesk
      .split(',')
      .map(desk => desk.trim())
      .filter(desk => desk !== '')
      .map(desk => normalizeDeskNumber(desk));
    
    debugInfo.normalizedDesks = allDesks;
    debugInfo.deskCount = allDesks.length;
    
    // Find position
    let currentIndex = allDesks.findIndex(desk => desk === debugInfo.normalizedCurrent);
    
    if (currentIndex === -1) {
      for (const variant of debugInfo.currentVariants) {
        currentIndex = allDesks.findIndex(desk => desk === variant);
        if (currentIndex !== -1) break;
      }
    }
    
    debugInfo.currentIndex = currentIndex;
  }
  
  // Determine class type
  let classType: 'business' | 'economy' | null = null;
  
  if (debugInfo.hasEnhancedInfo && debugInfo.enhancedDesks && debugInfo.enhancedIndex !== undefined) {
    classType = debugInfo.enhancedIndex === 0 ? 'business' : 'economy';
  } else if (debugInfo.hasBusinessClass && debugInfo.deskCount >= 1) {
    classType = debugInfo.deskCount === 1 ? 'business' : 
                debugInfo.currentIndex === 0 ? 'business' : 'economy';
  }
  
  return { classType, debugInfo };
}

/**
 * Get all check-in desks with their class types
 */
export function getCheckInDesksWithClasses(flight: Flight): Array<{
  deskNumber: string;
  classType: 'business' | 'economy';
}> {
  if (!flight || !flight.CheckInDesk || !hasBusinessClassCheckIn(flight.FlightNumber)) {
    return [];
  }
  
  const allDesks = flight.CheckInDesk
    .split(',')
    .map(desk => desk.trim())
    .filter(desk => desk !== '');
  
  if (allDesks.length < 2) {
    return [];
  }
  
  return allDesks.map((desk, index) => ({
    deskNumber: desk,
    classType: index === 0 ? 'business' : 'economy'
  }));
}