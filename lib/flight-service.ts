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
  if (!flights || !deskNumber) return [];
  
  return flights.filter(flight => {
    // Check if flight has check-in desks array and if it includes the requested desk
    if (flight.CheckInDesks && flight.CheckInDesks.length > 0) {
      return flight.CheckInDesks.some(desk => 
        desk === deskNumber || 
        desk === deskNumber.padStart(2, '0') ||
        desk === deskNumber.replace(/^0+/, '')
      );
    }
    
    // Fallback to original logic for backward compatibility
    const normalizedDesk = deskNumber.replace(/^0+/, '');
    const deskVariants = [
      deskNumber,
      normalizedDesk,
      deskNumber.padStart(2, '0'),
    ];
    
    return deskVariants.some(variant => 
      flight.CheckInDesk && flight.CheckInDesk.includes(variant)
    );
  });
}

export function getFlightsByGate(flights: Flight[], gateNumber: string): Flight[] {
  if (!flights || !gateNumber) return [];
  
  return flights.filter(flight => {
    // Check if flight has gate numbers array and if it includes the requested gate
    if (flight.GateNumbers && flight.GateNumbers.length > 0) {
      return flight.GateNumbers.some(gate => 
        gate === gateNumber || 
        gate === gateNumber.padStart(2, '0') ||
        gate === gateNumber.replace(/^0+/, '')
      );
    }
    
    // Fallback to original logic for backward compatibility
    const normalizedGate = gateNumber.replace(/^0+/, '');
    const gateVariants = [
      gateNumber,
      normalizedGate,
      gateNumber.padStart(2, '0'),
    ];
    
    return gateVariants.some(variant => 
      flight.GateNumber && flight.GateNumber.includes(variant)
    );
  });
}


export function getFlightsByBaggage(flights: Flight[], baggageReclaim: string): Flight[] {
  return flights.filter((flight) => flight.BaggageReclaim === baggageReclaim);
}

export function getProcessingFlights(flights: Flight[]): Flight[] {
  return flights.filter(flight => 
    flight.StatusEN?.toLowerCase() === 'processing'
  );
}
