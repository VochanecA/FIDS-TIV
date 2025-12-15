// app/lib/flight-api-helpers.ts
import type { Flight, RawFlightData } from '@/types/flight';

// Cache for logo existence checks
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
 * Check if a local airline logo exists
 */
export async function findLocalLogoExtension(icaoCode: string): Promise<string | null> {
  if (!icaoCode) return null;

  const cachedExtension = logoCache.get(icaoCode);
  if (cachedExtension) {
    return cachedExtension === 'none' ? null : cachedExtension;
  }

  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fids-tiv.vercel.app'
    : 'http://localhost:3000';
  
  for (const ext of extensions) {
    try {
      const logoUrl = `${baseUrl}/airlines/${icaoCode}${ext}`;
      
      const response = await fetch(logoUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        logoCache.set(icaoCode, ext);
        return ext;
      }
    } catch (error) {
      continue;
    }
  }

  logoCache.set(icaoCode, 'none');
  return null;
}

/**
 * Check if external FlightAware logo exists
 */
export async function checkExternalLogo(icaoCode: string): Promise<boolean> {
  try {
    const externalUrl = `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
    const response = await fetch(externalUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get the appropriate logo URL for an airline
 */
export async function getLogoURL(icaoCode: string): Promise<string> {
  if (!icaoCode) {
    return '/airlines/placeholder.jpg';
  }

  const localExtension = await findLocalLogoExtension(icaoCode);
  
  if (localExtension) {
    return `/airlines/${icaoCode}${localExtension}`;
  }

  const externalLogoExists = await checkExternalLogo(icaoCode);
  
  if (externalLogoExists) {
    return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
  }

  return '/airlines/placeholder.jpg';
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

  const airlineLogoURL = await getLogoURL(raw.KompanijaICAO);

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
  // You can add date filtering logic here if your API returns dates
  return flights; // For now, accept all flights
}