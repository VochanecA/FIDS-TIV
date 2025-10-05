import { NextResponse } from 'next/server';

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

function formatTime(time: string): string {
  if (!time || time.length !== 4) return '';
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

function getLogoURL(icaoCode: string): string {
  if (!icaoCode) return 'https://via.placeholder.com/180x120?text=No+Logo';
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
}

function mapRawFlight(raw: RawFlightData): MappedFlight {
  const flightType = raw.TipLeta === 'O' ? 'departure' : 'arrival';
  const codeShareFlights = raw.CodeShare 
    ? raw.CodeShare.split(',').map(f => f.trim()).filter(Boolean)
    : [];

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
    AirlineLogoURL: getLogoURL(raw.KompanijaICAO),
    FlightType: flightType,
    DestinationCityName: raw.Grad
  };
}

function sortFlightsByTime(flights: MappedFlight[]): MappedFlight[] {
  return flights.sort((a, b) => {
    const timeA = a.EstimatedDepartureTime || a.ScheduledDepartureTime;
    const timeB = b.EstimatedDepartureTime || b.ScheduledDepartureTime;
    
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    return timeA.localeCompare(timeB);
  });
}

export async function GET() {
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

    const mappedFlights = rawData.map(mapRawFlight);

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