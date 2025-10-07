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

export function getFlightsByBaggage(flights: Flight[], baggageReclaim: string): Flight[] {
  return flights.filter((flight) => flight.BaggageReclaim === baggageReclaim);
}

export function getProcessingFlights(flights: Flight[]): Flight[] {
  return flights.filter(flight => 
    flight.StatusEN?.toLowerCase() === 'processing'
  );
}