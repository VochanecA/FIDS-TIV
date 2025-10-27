// app/api/flights/route.ts
import { NextResponse } from 'next/server';

const FLIGHT_API_URL = 'https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv';

// Retry konfiguracija
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 sekunda

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

interface Flight {
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

interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
  lastUpdated: string;
}

// Cache for logo existence checks
const logoCache = new Map<string, string>(); // Cache format: ICAO -> extension (npr. "AUA" -> ".png")

/**
 * Retry funkcija sa eksponencijalnim backoff-om
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Ako je response OK, vrati ga
    if (response.ok) {
      return response;
    }
    
    // Ako ima još pokušaja i status nije 404, pokušaj ponovo
    if (retries > 0 && response.status !== 404) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1); // Eksponencijalni backoff
      console.log(`Retrying fetch... ${retries} attempts left, delay: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    // Ako nema više pokušaja, baci error
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
  } catch (error) {
    if (retries > 0) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      console.log(`Retrying after error... ${retries} attempts left, delay: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Parse gate numbers from comma-separated string and create individual flight records
 */
function parseGateNumbers(gateString: string): string[] {
  if (!gateString || gateString.trim() === '') return [];
  
  return gateString
    .split(',')
    .map(gate => gate.trim())
    .filter(gate => gate !== '');
}

/**
 * Parse check-in desks from comma-separated string and create individual flight records
 */
function parseCheckInDesks(checkInString: string): string[] {
  if (!checkInString || checkInString.trim() === '') return [];
  
  return checkInString
    .split(',')
    .map(desk => desk.trim())
    .filter(desk => desk !== '');
}

/**
 * Hardcodirana lista poznatih ICAO kodova za koje imamo lokalne logoe
 */
function getKnownLocalLogos(): Set<string> {
  return new Set([
    'AUA', 'BAW', 'DLH', 'AFR', 'KLM', 'RYR', 'EZY', 'WZZ', 'SAS',
    'IBE', 'AFL', 'QTR', 'ETH', 'TAP', 'SWR', 'AZA', 'BER', 'EIN',
    'VLG', 'NAX', 'FIN', 'AEE', 'ACA', 'UAE', 'SIA', 'THY', 'ANA',
    'JAL', 'CPA', 'CAL', 'AMX', 'AVA', 'ANZ', 'QFA', 'RAM', 'TRA',
    // Dodaj ostale ICAO kodove koje imaš u public/airlines folderu
  ]);
}

/**
 * Check if a local airline logo exists and return the correct extension
 */
async function findLocalLogoExtension(icaoCode: string): Promise<string | null> {
  if (!icaoCode) return null;

  // Koristi cached rezultat ako postoji
  const cachedExtension = logoCache.get(icaoCode);
  if (cachedExtension) {
    return cachedExtension === 'none' ? null : cachedExtension;
  }

  // Lista ekstenzija koje provjeravamo (prioritetni redoslijed)
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
  
  // U development modu, koristi fetch za provjeru
  if (process.env.NODE_ENV === 'development') {
    for (const ext of extensions) {
      try {
        const logoUrl = `/airlines/${icaoCode}${ext}`;
        const fullUrl = `http://localhost:3000${logoUrl}`;
        const response = await fetch(fullUrl, { method: 'HEAD' });
        
        if (response.ok) {
          console.log(`✅ Found local logo: ${icaoCode}${ext}`);
          logoCache.set(icaoCode, ext);
          return ext;
        }
      } catch (error) {
        // Nastavi sa sljedećom ekstenzijom
        continue;
      }
    }
  } else {
    // U production modu, koristi hardcodiranu listu poznatih logo-a
    const knownLogos = getKnownLocalLogos();
    if (knownLogos.has(icaoCode)) {
      // Ako znamo da logo postoji, vrati .png kao default
      console.log(`✅ Using known local logo: ${icaoCode}.png`);
      logoCache.set(icaoCode, '.png');
      return '.png';
    }
  }

  console.log(`❌ No local logo found for: ${icaoCode}`);
  logoCache.set(icaoCode, 'none');
  return null;
}

/**
 * Get the appropriate logo URL for an airline
 */
async function getLogoURL(icaoCode: string): Promise<string> {
  if (!icaoCode) {
    return 'https://via.placeholder.com/180x120?text=No+Logo';
  }

  // Prvo provjeri lokalne logoe
  const localExtension = await findLocalLogoExtension(icaoCode);
  
  if (localExtension) {
    return `/airlines/${icaoCode}${localExtension}`;
  }

  // Fallback na eksterni logo
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
}

/**
 * Format time string from HHMM to HH:MM
 */
function formatTime(time: string): string {
  if (!time || time.length !== 4) return '';
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

/**
 * Map raw flight data from API to application format
 */
async function mapRawFlight(raw: RawFlightData): Promise<Flight> {
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
 * Create duplicate flight records for multiple gates/desks
 */
function expandFlightForMultipleGates(flight: Flight): Flight[] {
  const flights: Flight[] = [flight];
  
  const gateNumbers = parseGateNumbers(flight.GateNumber);
  
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
  
  const checkInDesks = parseCheckInDesks(flight.CheckInDesk);
  
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
function sortFlightsByTime(flights: Flight[]): Flight[] {
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
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('Fetching flight data from external API...');
    
    const response = await fetchWithRetry(FLIGHT_API_URL, {
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
    }, MAX_RETRIES);

    if (!response.ok) {
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const rawData: RawFlightData[] = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format received');
    }

    console.log(`Successfully fetched ${rawData.length} flights`);

    // Map all flights with async logo checking
    const mappedFlights = await Promise.all(
      rawData.map(raw => mapRawFlight(raw))
    );

    // Expand flights that have multiple gates or check-in desks
    const expandedFlights: Flight[] = [];
    mappedFlights.forEach(flight => {
      const expanded = expandFlightForMultipleGates(flight);
      expandedFlights.push(...expanded);
    });

    const departures = sortFlightsByTime(
      expandedFlights.filter(f => f.FlightType === 'departure')
    );

    const arrivals = sortFlightsByTime(
      expandedFlights.filter(f => f.FlightType === 'arrival')
    );

    const flightData: FlightData = {
      departures,
      arrivals,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`Processed ${departures.length} departures and ${arrivals.length} arrivals`);

    return NextResponse.json(flightData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Error fetching flight data:', error);
    
    const errorData: FlightData = {
      departures: [],
      arrivals: [],
      lastUpdated: new Date().toISOString(),
    };
    
    // Vrati 200 status sa praznim podacima umjesto 500
    return NextResponse.json(errorData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  }
}