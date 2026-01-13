// app/lib/flight-api-helpers.ts
import type { Flight, RawFlightData } from '@/types/flight';

// Cache for logo URLs (stores the full URL, not just extension)
const logoCache = new Map<string, string>();

/**
 * Parse gate numbers from comma-separated string
 */
export function parseGateNumbers(gateString: string): string[] {
  if (!gateString || gateString.trim() === '') return [];
  
  return gateString
    .split(',')
    .map(gate => gate.trim())
    .filter(gate => gate !== '');
}

/**
 * Parse check-in desks from comma-separated string
 */
export function parseCheckInDesks(checkInString: string): string[] {
  if (!checkInString || checkInString.trim() === '') return [];
  
  return checkInString
    .split(',')
    .map(desk => desk.trim())
    .filter(desk => desk !== '');
}

/**
 * Check which logo format exists by trying all extensions
 * Returns the URL of the first found logo, or null if none found
 */
async function findExistingLogo(icaoCode: string): Promise<string | null> {
  if (!icaoCode || typeof window === 'undefined') {
    return null;
  }

  const normalizedIcao = icaoCode.trim().toUpperCase();
  const cacheKey = `exists-${normalizedIcao}`;
  
  // Check cache first
  const cached = logoCache.get(cacheKey);
  if (cached !== undefined) {
    return cached === 'none' ? null : cached;
  }

  const extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  
  // Try each extension in order
  for (const ext of extensions) {
    const logoUrl = `/airlines/${normalizedIcao}${ext}`;
    
    try {
      const exists = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = logoUrl;
        setTimeout(() => resolve(false), 100); // Short timeout
      });
      
      if (exists) {
        console.log(`✅ Found logo for ${normalizedIcao}: ${logoUrl}`);
        logoCache.set(cacheKey, logoUrl);
        return logoUrl;
      }
    } catch (error) {
      // Continue to next extension
      continue;
    }
  }

  console.log(`❌ No logo found for ${normalizedIcao}`);
  logoCache.set(cacheKey, 'none');
  return null;
}

/**
 * Get the appropriate logo URL for an airline
 * Checks all formats and returns the first one found
 */
export async function getLogoURL(icaoCode: string): Promise<string> {
  if (!icaoCode || icaoCode.trim() === '') {
    return '/airlines/placeholder.jpg';
  }

  const normalizedIcao = icaoCode.trim().toUpperCase();
  const cacheKey = `url-${normalizedIcao}`;
  
  // Check cache first
  const cachedUrl = logoCache.get(cacheKey);
  if (cachedUrl !== undefined && cachedUrl !== 'none') {
    return cachedUrl;
  }

  // Try to find existing logo in any format
  const existingLogo = await findExistingLogo(normalizedIcao);
  
  if (existingLogo) {
    logoCache.set(cacheKey, existingLogo);
    return existingLogo;
  }

  // Fallback to placeholder
  const placeholder = '/airlines/placeholder.jpg';
  logoCache.set(cacheKey, placeholder);
  return placeholder;
}

/**
 * Simple synchronous version - tries .png first, then .jpg as fallback
 * Use this for initial render, actual checking happens in getLogoURL
 */
export function getSimpleLogoURL(icaoCode: string): string {
  if (!icaoCode || icaoCode.trim() === '') {
    return '/airlines/placeholder.jpg';
  }
  
  const normalizedIcao = icaoCode.trim().toUpperCase();
  
  // Try .png first (most common), then .jpg as backup
  // Actual format checking will happen in getLogoURL async
  return `/airlines/${normalizedIcao}.jpg`;
}

/**
 * Optimized version for check-in page - tries formats in background
 */
export async function getLogoURLWithFallback(icaoCode: string, fallbackUrl?: string): Promise<string> {
  if (!icaoCode || icaoCode.trim() === '') {
    return fallbackUrl || '/airlines/placeholder.jpg';
  }

  const normalizedIcao = icaoCode.trim().toUpperCase();
  const cacheKey = `optimized-${normalizedIcao}`;
  
  // Check cache first
  const cachedUrl = logoCache.get(cacheKey);
  if (cachedUrl !== undefined && cachedUrl !== 'none') {
    return cachedUrl;
  }

  // Start checking in background without waiting
  const checkLogo = async () => {
    try {
      const existingLogo = await findExistingLogo(normalizedIcao);
      if (existingLogo) {
        logoCache.set(cacheKey, existingLogo);
      }
    } catch (error) {
      // Silent fail for background check
    }
  };
  
  // Don't wait for the check - run it in background
  if (typeof window !== 'undefined') {
    void checkLogo();
  }

  // Return the most likely URL (.png) immediately
  // If it doesn't exist, Image onError will handle fallback
  return `/airlines/${normalizedIcao}.jpg`;
}

/**
 * Format time string from HHMM to HH:MM
 */
export function formatTime(time: string): string {
  if (!time || time.length !== 4) return '';
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

/**
 * Map raw flight data from API to application format
 */
export async function mapRawFlight(raw: RawFlightData): Promise<Flight> {
  const flightType = raw.TipLeta === 'O' ? 'departure' : 'arrival';
  const codeShareFlights = raw.CodeShare 
    ? raw.CodeShare.split(',').map(f => f.trim()).filter(Boolean)
    : [];

  // Use optimized version that checks in background
  const airlineLogoURL = await getLogoURLWithFallback(raw.KompanijaICAO);

  return {
    FlightNumber: `${raw.Kompanija}${raw.BrojLeta}`,
    AirlineCode: raw.Kompanija,
    AirlineICAO: raw.KompanijaICAO,
    AirlineName: raw.KompanijaNaziv,
    DestinationAirportName: raw.Aerodrom,
    DestinationAirportCode: raw.IATA,
    ScheduledDepartureTime: formatTime(raw.Planirano),
    EstimatedDepartureTime: formatTime(raw.Predvidjeno),
    ActualDepartureTime: formatTime(raw.Aktuelno),
    StatusEN: raw.StatusEN || '',
    StatusMN: raw.StatusMN || '',
    Terminal: raw.Terminal || '',
    GateNumber: raw.Gate || '',
    GateNumbers: parseGateNumbers(raw.Gate),
    CheckInDesk: raw.CheckIn || '',
    CheckInDesks: parseCheckInDesks(raw.CheckIn),
    BaggageReclaim: raw.Karusel || '',
    CodeShareFlights: codeShareFlights,
    AirlineLogoURL: airlineLogoURL,
    FlightType: flightType,
    DestinationCityName: raw.Grad
  };
}

/**
 * Create duplicate flight records for multiple gates/desks
 */
export function expandFlightForMultipleGates(flight: Flight): Flight[] {
  const flights: Flight[] = [flight];
  
  const gateNumbers = flight.GateNumbers || parseGateNumbers(flight.GateNumber);
  
  if (gateNumbers.length > 1) {
    for (let i = 1; i < gateNumbers.length; i++) {
      const duplicateFlight = {
        ...flight,
        GateNumber: gateNumbers[i]
      };
      flights.push(duplicateFlight);
    }
    
    flights[0].GateNumber = gateNumbers[0];
  }
  
  const checkInDesks = flight.CheckInDesks || parseCheckInDesks(flight.CheckInDesk);
  
  if (checkInDesks.length > 1) {
    const expandedFlights: Flight[] = [];
    
    for (const existingFlight of flights) {
      for (let i = 1; i < checkInDesks.length; i++) {
        const duplicateFlight = {
          ...existingFlight,
          CheckInDesk: checkInDesks[i]
        };
        expandedFlights.push(duplicateFlight);
      }
      
      existingFlight.CheckInDesk = checkInDesks[0];
    }
    
    flights.push(...expandedFlights);
  }
  
  return flights;
}

/**
 * Sort flights by departure time (estimated or scheduled)
 */
export function sortFlightsByTime(flights: Flight[]): Flight[] {
  return flights.sort((a, b) => {
    const timeA = a.EstimatedDepartureTime || a.ScheduledDepartureTime;
    const timeB = b.EstimatedDepartureTime || b.ScheduledDepartureTime;
    
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    return timeA.localeCompare(timeB);
  });
}

/**
 * Filter flights for today only
 */
export function filterTodayFlights(flights: Flight[]): Flight[] {
  return flights;
}
