// export interface Flight {
//   FlightNumber: string;
//   AirlineCode: string;
//   AirlineICAO: string;
//   AirlineName: string;
//   DestinationAirportName: string;
//   DestinationAirportCode: string;
//   ScheduledDepartureTime: string;
//   EstimatedDepartureTime: string;
//   ActualDepartureTime: string;
//   StatusEN: string;
//   Terminal: string;
//   GateNumber: string;
//   GateNumbers?: string[]; // Dodajte ovo
//   CheckInDesk: string;
//   CheckInDesks?: string[]; // Dodajte ovo
//   BaggageReclaim: string;
//   CodeShareFlights: string[];
//   AirlineLogoURL: string;
//   FlightType: 'departure' | 'arrival';
//   DestinationCityName: string;
// }

// export interface FlightData {
//   departures: Flight[];
//   arrivals: Flight[];
//   lastUpdated: string;
//   source?: 'live' | 'cached' | 'fallback';
//   error?: string;
// }

// types/flight.ts
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
  StatusMN?: string;
  Terminal: string;
  GateNumber: string;
  GateNumbers?: string[];
  CheckInDesk: string;
  CheckInDesks?: string[];
  BaggageReclaim: string;
  CodeShareFlights: string[];
  AirlineLogoURL: string;
  FlightType: 'departure' | 'arrival';
  DestinationCityName: string;
  
  // Nova polja za backup i auto-processing sistem
  IsBackupData?: boolean;
  AutoProcessed?: boolean;
  ProcessingStage?: 'none' | 'checkin' | 'boarding' | 'closed' | 'departed' | 'arrived';
  LastStatusUpdate?: string;
  OriginalStatus?: string;
  IsOfflineMode?: boolean;
  BackupTimestamp?: string;
}

export interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
  lastUpdated: string;
  source?: 'live' | 'cached' | 'fallback' | 'backup' | 'auto-processed' | 'emergency';
  error?: string;
  warning?: string;
  backupTimestamp?: string;
  autoProcessedCount?: number;
  isOfflineMode?: boolean;
  totalFlights?: number;
}

export interface RawFlightData {
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