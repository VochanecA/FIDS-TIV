import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FLIGHT_API_URL = 'https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv';

const userAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
};

interface RawFlightData {
  Updateovano: string;
  Datum: string;
  Dan: string;
  TipLeta: string;
  KompanijaNaziv: string;
  Logo: string;
  Kompanija: string;
  KompanijaICAO: string;
  BrojLeta: string;
  CodeShare: string;
  IATA: string;
  Grad: string;
  Planirano: string;
  Predvidjeno: string;
  Aktuelno: string;
  Terminal: string;
  Karusel: string;
  CheckIn: string;
  Gate: string;
  Aerodrom: string;
  Status: string;
  Via: string;
  StatusEN: string;
  StatusMN: string;
}

interface MappedFlight {
  FlightNumber: string;
  AirlineCode: string;
  AirlineICAO: string;
  AirlineName: string;
  DestinationAirportName: string;
  DestinationAirportCode: string;
  ScheduledDepartureTime: string;
  EstimatedDepartureTime: string;
  ActualDepartureTime: string;
  StatusEN: string;
  Terminal: string;
  GateNumber: string;
  CheckInDesk: string;
  BaggageReclaim: string;
  CodeShareFlights: string[];
  AirlineLogoURL: string;
  FlightType: 'departure' | 'arrival';
  DestinationCityName: string;
}

// Cache for logo existence checks
const logoCache = new Map<string, boolean>();

/**
 * Check if a local airline logo exists in public/airlines folder
 * @param icaoCode - ICAO code of the airline
 * @returns Promise<boolean> - true if local logo exists
 */
async function checkLocalLogoExists(icaoCode: string): Promise<boolean> {
  if (!icaoCode) return false;

  // Check cache first
  if (logoCache.has(icaoCode)) {
    return logoCache.get(icaoCode) as boolean;
  }

  try {
    const publicPath = path.join(process.cwd(), 'public', 'airlines', `${icaoCode}.png`);
    await fs.access(publicPath);
    logoCache.set(icaoCode, true);
    return true;
  } catch {
    // File doesn't exist
    logoCache.set(icaoCode, false);
    return false;
  }
}

/**
 * Get the appropriate logo URL for an airline
 * Priority: Local logo > FlightAware logo > Placeholder
 * @param icaoCode - ICAO code of the airline
 * @returns Promise<string> - URL to the airline logo
 */
async function getLogoURL(icaoCode: string): Promise<string> {
  if (!icaoCode) {
    return 'https://via.placeholder.com/180x120?text=No+Logo';
  }

  // Check if local logo exists
  const hasLocalLogo = await checkLocalLogoExists(icaoCode);
  
  if (hasLocalLogo) {
    // Return local path (relative to public folder)
    return `/airlines/${icaoCode}.png`;
  }

  // Fallback to FlightAware CDN
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
}

/**
 * Format time string from HHMM to HH:MM
 * @param time - Time string in HHMM format
 * @returns Formatted time string HH:MM
 */
function formatTime(time: string): string {
  if (!time || time.length !== 4) return '';
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

/**
 * Map raw flight data from API to application format
 * @param raw - Raw flight data from API
 * @returns Promise<MappedFlight> - Mapped flight data
 */
async function mapRawFlight(raw: RawFlightData): Promise<MappedFlight> {
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
    Terminal: raw.Terminal || '',
    GateNumber: raw.Gate || '',
    CheckInDesk: raw.CheckIn || '',
    BaggageReclaim: raw.Karusel || '',
    CodeShareFlights: codeShareFlights,
    AirlineLogoURL: airlineLogoURL,
    FlightType: flightType,
    DestinationCityName: raw.Grad
  };
}

/**
 * Sort flights by departure time (estimated or scheduled)
 * @param flights - Array of flights to sort
 * @returns Sorted array of flights
 */
function sortFlightsByTime(flights: MappedFlight[]): MappedFlight[] {
  return flights.sort((a, b) => {
    const timeA = a.EstimatedDepartureTime || a.ScheduledDepartureTime;
    const timeB = b.EstimatedDepartureTime || b.ScheduledDepartureTime;
    
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    return timeA.localeCompare(timeB);
  });
}

/**
 * GET endpoint to fetch and process flight data
 * @returns NextResponse with flight data (departures and arrivals)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(FLIGHT_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': userAgents.chrome,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://montenegroairports.com/',
        'Origin': 'https://montenegroairports.com',
        'Connection': 'keep-alive',
        'DNT': '1'
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const rawData: RawFlightData[] = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format received');
    }

    // Map all flights with async logo checking
    const mappedFlights = await Promise.all(
      rawData.map(raw => mapRawFlight(raw))
    );

    const departures = sortFlightsByTime(
      mappedFlights.filter(f => f.FlightType === 'departure')
    );

    const arrivals = sortFlightsByTime(
      mappedFlights.filter(f => f.FlightType === 'arrival')
    );

    return NextResponse.json({
      departures,
      arrivals,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return NextResponse.json(
      {
        departures: [],
        arrivals: [],
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to fetch flight data'
      },
      { status: 500 }
    );
  }
}