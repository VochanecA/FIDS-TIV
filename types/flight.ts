export interface Flight {
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
  GateNumbers?: string[]; // Dodajte ovo
  CheckInDesk: string;
  CheckInDesks?: string[]; // Dodajte ovo
  BaggageReclaim: string;
  CodeShareFlights: string[];
  AirlineLogoURL: string;
  FlightType: 'departure' | 'arrival';
  DestinationCityName: string;
}

export interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
  lastUpdated: string;
  source?: 'live' | 'cached' | 'fallback';
  error?: string;
}