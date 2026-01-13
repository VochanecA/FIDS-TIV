// lib/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Kreirajte data folder ako ne postoji
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Putanja do SQLite baze
const dbPath = path.join(dataDir, 'flights.db');

// Kreirajte SQLite konekciju
const sqlite = new Database(dbPath);

// Kreirajte Drizzle instancu
export const db = drizzle(sqlite, { schema });

// Helper funkcije za inicijalizaciju baze
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Proverite da li postoje tabele
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('airlines', 'specific_flights', 'destinations')
    `).all();
    
    if (tables.length === 0) {
      console.log('Creating tables...');
      
      // Kreirajte tabele
      sqlite.exec(`
        CREATE TABLE airlines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          iata_code TEXT NOT NULL UNIQUE,
          airline_name TEXT NOT NULL,
          has_business_class INTEGER DEFAULT 0,
          winter_schedule TEXT DEFAULT '{"hasBusinessClass":false,"specificFlights":[],"daysOfWeek":[],"startDate":null,"endDate":null}',
          summer_schedule TEXT DEFAULT '{"hasBusinessClass":false,"specificFlights":[],"daysOfWeek":[],"startDate":null,"endDate":null}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE specific_flights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          flight_number TEXT NOT NULL,
          airline_iata TEXT NOT NULL,
          always_business_class INTEGER DEFAULT 0,
          winter_only INTEGER DEFAULT 0,
          summer_only INTEGER DEFAULT 0,
          days_of_week TEXT DEFAULT '[]',
          valid_from DATETIME,
          valid_until DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE destinations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          destination_code TEXT NOT NULL,
          destination_name TEXT NOT NULL,
          airline_iata TEXT NOT NULL,
          has_business_class INTEGER DEFAULT 0,
          winter_schedule TEXT DEFAULT '{"hasBusinessClass":false,"startDate":null,"endDate":null}',
          summer_schedule TEXT DEFAULT '{"hasBusinessClass":false,"startDate":null,"endDate":null}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(destination_code, airline_iata)
        );
      `);
      
      // Dodajte podrazumevane podatke
      console.log('Adding default data...');
      
      // Air Serbia
      sqlite.prepare(`
        INSERT INTO airlines (iata_code, airline_name, has_business_class, winter_schedule, summer_schedule)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'JU',
        'Air Serbia',
        1,
        JSON.stringify({
          hasBusinessClass: true,
          specificFlights: ['JU683'],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startDate: null,
          endDate: null
        }),
        JSON.stringify({
          hasBusinessClass: true,
          specificFlights: ['JU683'],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startDate: null,
          endDate: null
        })
      );
      
      // Turkish Airlines
      sqlite.prepare(`
        INSERT INTO airlines (iata_code, airline_name, has_business_class, winter_schedule, summer_schedule)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'TK',
        'Turkish Airlines',
        1,
        JSON.stringify({
          hasBusinessClass: true,
          specificFlights: ['TK1021', 'TK1022'],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startDate: null,
          endDate: null
        }),
        JSON.stringify({
          hasBusinessClass: true,
          specificFlights: ['TK1021', 'TK1022', 'TK1023'],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startDate: null,
          endDate: null
        })
      );
      
      console.log('Database initialized successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Eksportujte i shemu za lakši pristup
export { airlinesTable, specificFlightsTable, destinationsTable, changeLogTable } from './schema';
export type { Airline, SpecificFlight, Destination } from './schema';