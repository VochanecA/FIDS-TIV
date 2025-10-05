import type { Flight, FlightData } from '@/types/flight';

const FLIGHT_API_URL = '/api/flights';

export async function fetchFlightData(): Promise<FlightData> {
  try {
    const response = await fetch(FLIGHT_API_URL, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const data = await response.json();

    return {
      departures: Array.isArray(data.departures) ? data.departures : [],
      arrivals: Array.isArray(data.arrivals) ? data.arrivals : [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return {
      departures: [],
      arrivals: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function getFlightsByCheckIn(flights: Flight[], deskNumber: string): Flight[] {
  return flights.filter(flight => {
    if (!flight.CheckInDesk) return false;
    
    // Split comma-separated check-in desks and trim each one
    const checkInDesks = flight.CheckInDesk.split(',').map(desk => desk.trim());
    
    // Check if any desk matches (with normalization)
    return checkInDesks.some(desk => 
      desk === deskNumber || 
      desk.replace(/^0+/, '') === deskNumber.replace(/^0+/, '')
    );
  });
}

export function getFlightsByGate(flights: Flight[], gateNumber: string): Flight[] {
  return flights.filter((flight) => flight.GateNumber === gateNumber);
}

export function getFlightsByBaggage(flights: Flight[], baggageReclaim: string): Flight[] {
  return flights.filter((flight) => flight.BaggageReclaim === baggageReclaim);
}

export function getProcessingFlights(flights: Flight[]): Flight[] {
  return flights.filter(flight => 
    flight.StatusEN?.toLowerCase() === 'processing'
  );
}
