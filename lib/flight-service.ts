import type { Flight, FlightData } from '@/types/flight';

const FLIGHT_API_URL = '/api/flights';

// Cache za sprečavanje previše requesta i fallback podatke
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 30000; // 30 sekundi

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
    
    // Provjeri da li CheckInDesk sadrži traženi desk
    return deskVariants.some(variant => 
      flight.CheckInDesk.includes(variant)
    );
  });
  
  // SPECIFIČAN FILTER ZA CHECK-IN: processing ILI boarding letovi koji nisu completed I nisu closed
  return filterCheckInFlights(checkInFlights);
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