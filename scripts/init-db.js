// scripts/init-db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Kreirajte data folder ako ne postoji
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Putanja do SQLite baze
const dbPath = path.join(dataDir, 'flights.db');
console.log(`Creating database at: ${dbPath}`);

// Kreirajte bazu
const db = new Database(dbPath);

// Kreirajte tabele
console.log('Creating tables...');
db.exec(`
  CREATE TABLE IF NOT EXISTS airlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iata_code TEXT NOT NULL UNIQUE,
    airline_name TEXT NOT NULL,
    has_business_class INTEGER DEFAULT 0,
    winter_schedule TEXT DEFAULT '{"hasBusinessClass":false,"specificFlights":[],"daysOfWeek":[],"startDate":null,"endDate":null}',
    summer_schedule TEXT DEFAULT '{"hasBusinessClass":false,"specificFlights":[],"daysOfWeek":[],"startDate":null,"endDate":null}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS specific_flights (
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
  
  CREATE TABLE IF NOT EXISTS destinations (
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
db.prepare(`
  INSERT OR IGNORE INTO airlines (iata_code, airline_name, has_business_class, winter_schedule, summer_schedule)
  VALUES (?, ?, ?, ?, ?)
`).run(
  'JU',
  'Air Serbia',
  1,
  JSON.stringify({
    hasBusinessClass: true,
    specificFlights: ['JU152', 'JU153', 'JU154', 'JU155'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: null,
    endDate: null
  }),
  JSON.stringify({
    hasBusinessClass: true,
    specificFlights: ['JU152', 'JU153', 'JU154', 'JU155', 'JU156'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: null,
    endDate: null
  })
);

// Turkish Airlines
db.prepare(`
  INSERT OR IGNORE INTO airlines (iata_code, airline_name, has_business_class, winter_schedule, summer_schedule)
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

// Dodajte nekoliko specifičnih letova
db.prepare(`
  INSERT OR IGNORE INTO specific_flights 
  (flight_number, airline_iata, always_business_class, winter_only, summer_only, days_of_week, valid_from, valid_until)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('JU152', 'JU', 1, 0, 0, JSON.stringify([0, 1, 2, 3, 4, 5, 6]), null, null);

db.prepare(`
  INSERT OR IGNORE INTO specific_flights 
  (flight_number, airline_iata, always_business_class, winter_only, summer_only, days_of_week, valid_from, valid_until)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('JU153', 'JU', 1, 0, 0, JSON.stringify([0, 1, 2, 3, 4, 5, 6]), null, null);

db.prepare(`
  INSERT OR IGNORE INTO specific_flights 
  (flight_number, airline_iata, always_business_class, winter_only, summer_only, days_of_week, valid_from, valid_until)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run('TK1021', 'TK', 1, 0, 0, JSON.stringify([0, 1, 2, 3, 4, 5]), null, null);

// Dodajte nekoliko destinacija
db.prepare(`
  INSERT OR IGNORE INTO destinations 
  (destination_code, destination_name, airline_iata, has_business_class, winter_schedule, summer_schedule)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('BEG', 'Beograd', 'JU', 1, 
  JSON.stringify({hasBusinessClass: true, startDate: null, endDate: null}),
  JSON.stringify({hasBusinessClass: true, startDate: null, endDate: null}));

db.prepare(`
  INSERT OR IGNORE INTO destinations 
  (destination_code, destination_name, airline_iata, has_business_class, winter_schedule, summer_schedule)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('IST', 'Istanbul', 'TK', 1,
  JSON.stringify({hasBusinessClass: true, startDate: null, endDate: null}),
  JSON.stringify({hasBusinessClass: true, startDate: null, endDate: null}));

// Proverite podatke
console.log('\n=== Database Summary ===');
const airlineCount = db.prepare('SELECT COUNT(*) as count FROM airlines').get();
const flightCount = db.prepare('SELECT COUNT(*) as count FROM specific_flights').get();
const destCount = db.prepare('SELECT COUNT(*) as count FROM destinations').get();

console.log(`Airlines: ${airlineCount.count}`);
console.log(`Specific flights: ${flightCount.count}`);
console.log(`Destinations: ${destCount.count}`);

db.close();
console.log('\n✅ Database initialized successfully!');
console.log(`Database file: ${dbPath}`);