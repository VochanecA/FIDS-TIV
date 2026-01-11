// Ova servisna funkcija sada koristi API rute umesto direktnog pristupa bazi

const API_BASE = '/api/admin';

// Avio kompanije
export async function getAllAirlines() {
  const response = await fetch(`${API_BASE}/airlines`);
  if (!response.ok) throw new Error('Greška pri učitavanju avio kompanija');
  return response.json();
}

export async function getAirlineByIata(iataCode: string) {
  const response = await fetch(`${API_BASE}/airlines/${iataCode}`);
  if (!response.ok) throw new Error('Avio kompanija nije pronađena');
  return response.json();
}

export async function createAirline(data: any) {
  const response = await fetch(`${API_BASE}/airlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Greška pri kreiranju avio kompanije');
  }
  return response.json();
}

export async function updateAirline(iataCode: string, data: any) {
  const response = await fetch(`${API_BASE}/airlines/${iataCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Greška pri ažuriranju avio kompanije');
  }
  return response.json();
}

export async function deleteAirline(iataCode: string) {
  const response = await fetch(`${API_BASE}/airlines/${iataCode}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Greška pri brisanju avio kompanije');
  }
  return response.json();
}

// Letovi - napravite slične API rute za flights i destinations
export async function getAllSpecificFlights() {
  // Implementirajte API poziv
  return [];
}

export async function createSpecificFlight(data: any) {
  return data;
}

export async function updateSpecificFlight(flightNumber: string, data: any) {
  return data;
}

export async function deleteSpecificFlight(flightNumber: string) {
  return { success: true };
}

// Destinacije
export async function getAllDestinations() {
  // Implementirajte API poziv
  return [];
}

export async function getDestinationsByAirline(airlineIata: string) {
  return [];
}

export async function createDestination(data: any) {
  return data;
}

export async function updateDestination(destinationCode: string, airlineIata: string, data: any) {
  return data;
}

export async function deleteDestination(destinationCode: string, airlineIata: string) {
  return { success: true };
}

// Sezona
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  return (month >= 4 && month <= 10) ? 'summer' : 'winter';
}

// Inicijalizacija podataka
export async function initializeDefaultData() {
  // Ovo će pozvati API za inicijalizaciju
  return { success: true };
}