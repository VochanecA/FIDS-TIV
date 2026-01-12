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
  console.log('=== SERVICE: createAirline ===');
  console.log('Data to send:', JSON.stringify(data, null, 2));
  
  const response = await fetch(`${API_BASE}/airlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Service error response:', error);
    throw new Error(error.error || 'Greška pri kreiranju avio kompanije');
  }
  
  const result = await response.json();
  console.log('Service success result:', result);
  return result;
}

export async function updateAirline(iataCode: string, data: any) {
  console.log('=== SERVICE: updateAirline ===');
  console.log('IATA Code:', iataCode);
  console.log('Data to send:', JSON.stringify(data, null, 2));
  
  const response = await fetch(`${API_BASE}/airlines/${iataCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Service error response:', error);
    throw new Error(error.error || 'Greška pri ažuriranju avio kompanije');
  }
  
  const result = await response.json();
  console.log('Service success result:', result);
  return result;
}

export async function deleteAirline(iataCode: string) {
  console.log('=== SERVICE: deleteAirline ===');
  console.log('IATA Code:', iataCode);
  
  const response = await fetch(`${API_BASE}/airlines/${iataCode}`, {
    method: 'DELETE'
  });
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Service error response:', error);
    throw new Error(error.error || 'Greška pri brisanju avio kompanije');
  }
  
  const result = await response.json();
  console.log('Service success result:', result);
  return result;
}

// Letovi - napravite slične API rute za flights i destinations
export async function getAllSpecificFlights() {
  // Implementirajte API poziv
  console.log('=== SERVICE: getAllSpecificFlights ===');
  return [];
}

export async function createSpecificFlight(data: any) {
  console.log('=== SERVICE: createSpecificFlight ===');
  console.log('Data:', data);
  return data;
}

export async function updateSpecificFlight(flightNumber: string, data: any) {
  console.log('=== SERVICE: updateSpecificFlight ===');
  console.log('Flight Number:', flightNumber);
  console.log('Data:', data);
  return data;
}

export async function deleteSpecificFlight(flightNumber: string) {
  console.log('=== SERVICE: deleteSpecificFlight ===');
  console.log('Flight Number:', flightNumber);
  return { success: true };
}

// Destinacije
export async function getAllDestinations() {
  // Implementirajte API poziv
  console.log('=== SERVICE: getAllDestinations ===');
  return [];
}

export async function getDestinationsByAirline(airlineIata: string) {
  console.log('=== SERVICE: getDestinationsByAirline ===');
  console.log('Airline IATA:', airlineIata);
  return [];
}

export async function createDestination(data: any) {
  console.log('=== SERVICE: createDestination ===');
  console.log('Data:', data);
  return data;
}

export async function updateDestination(destinationCode: string, airlineIata: string, data: any) {
  console.log('=== SERVICE: updateDestination ===');
  console.log('Destination Code:', destinationCode);
  console.log('Airline IATA:', airlineIata);
  console.log('Data:', data);
  return data;
}

export async function deleteDestination(destinationCode: string, airlineIata: string) {
  console.log('=== SERVICE: deleteDestination ===');
  console.log('Destination Code:', destinationCode);
  console.log('Airline IATA:', airlineIata);
  return { success: true };
}

// Sezona
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  return (month >= 4 && month <= 10) ? 'summer' : 'winter';
}

// Inicijalizacija podataka
export async function initializeDefaultData() {
  console.log('=== SERVICE: initializeDefaultData ===');
  // Ovo će pozvati API za inicijalizaciju
  return { success: true };
}