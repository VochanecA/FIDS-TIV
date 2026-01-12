// app/api/flights/route.ts
import { NextResponse } from 'next/server';
import { FlightBackupService } from '@/lib/backup/flight-backup-service';
import { FlightAutoProcessor, type AutoProcessedFlight } from '@/lib/backup/flight-auto-processor';
import type { Flight, FlightData, RawFlightData } from '@/types/flight';
import {
  mapRawFlight,
  expandFlightForMultipleGates,
  sortFlightsByTime,
  filterTodayFlights
} from '@/lib/flight-api-helpers';

const FLIGHT_API_URL = 'https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv';

// Retry konfiguracija
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const userAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
};

/**
 * Brzi fetch sa minimalnim retry-ima
 */
async function fetchWithQuickRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      if (attempt < retries) {
        console.log(`Quick retry ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Quick retry after error ${attempt}/${retries}...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  throw new Error(`Live API fetch failed after ${retries} attempts`);
}

/**
 * Type-safe emergency fetch function
 */
async function performEmergencyFetch(): Promise<Flight[] | null> {
  try {
    const emergencyResponse = await fetch(FLIGHT_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': userAgents.chrome,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!emergencyResponse.ok) {
      return null;
    }

    const emergencyRawData: RawFlightData[] = await emergencyResponse.json();
    
    if (!Array.isArray(emergencyRawData) || emergencyRawData.length === 0) {
      return null;
    }

    // Process emergency data (limit to 5 flights)
    const emergencyMappedFlights = await Promise.all(
      emergencyRawData.slice(0, 5).map(raw => mapRawFlight(raw))
    );
    
    const emergencyFlights: Flight[] = [];
    emergencyMappedFlights.forEach((flight: Flight) => {
      const expanded = expandFlightForMultipleGates(flight);
      emergencyFlights.push(...expanded);
    });
    
    return emergencyFlights;
  } catch (error) {
    console.error('❌ Emergency fetch failed:', error);
    return null;
  }
}

/**
 * GET endpoint koji UVJEK vraća podatke
 */
export async function GET(): Promise<NextResponse> {
  const backupService = FlightBackupService.getInstance();
  let source: 'live' | 'backup' | 'auto-processed' | 'emergency' = 'live';
  let backupTimestamp: string | undefined;
  let autoProcessedCount = 0;
  let isOfflineMode = false;

  // PRVI POKUŠAJ: Live API fetch
  try {
    console.log('🔄 Attempting LIVE API fetch...');
    
    const response = await fetchWithQuickRetry(FLIGHT_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': userAgents.chrome,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://montenegroairports.com/',
        'Origin': 'https://montenegroairports.com',
        'Connection': 'keep-alive',
        'DNT': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData: RawFlightData[] = await response.json();

    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format received');
    }

    console.log(`✅ LIVE fetch successful: ${rawData.length} flights`);

    // Process live data
    const mappedFlights = await Promise.all(
      rawData.map((raw: RawFlightData) => mapRawFlight(raw))
    );

    const expandedFlights: Flight[] = [];
    mappedFlights.forEach((flight: Flight) => {
      const expanded = expandFlightForMultipleGates(flight);
      expandedFlights.push(...expanded);
    });

    const todayFlights = filterTodayFlights(expandedFlights);

    // UVJEK save backup kada imamo live data
    try {
      const backupId = backupService.saveBackup(todayFlights);
      console.log(`💾 Backup saved from live data: ${backupId}`);
    } catch (backupError: unknown) {
      const errorMessage = backupError instanceof Error ? backupError.message : 'Unknown backup error';
      console.error('⚠️ Backup save failed:', errorMessage);
    }

    const departures = sortFlightsByTime(
      todayFlights.filter((f: Flight) => f.FlightType === 'departure')
    );

    const arrivals = sortFlightsByTime(
      todayFlights.filter((f: Flight) => f.FlightType === 'arrival')
    );

    const totalFlights = departures.length + arrivals.length;
    
    // 👇 VAŽNO: Sada totalFlights je REQUIRED
    const flightData: FlightData = {
      departures,
      arrivals,
      lastUpdated: new Date().toISOString(),
      source: 'live',
      totalFlights, // 👈 OVO JE SADA REQUIRED
      isOfflineMode: false
    };

    console.log(`📊 LIVE data ready: ${departures.length} departures, ${arrivals.length} arrivals, total: ${flightData.totalFlights}`);

    return NextResponse.json(flightData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Data-Source': 'live',
        'X-Backup-Available': 'true',
        'X-Total-Flights': flightData.totalFlights.toString()
      }
    });

  } catch (liveError: unknown) {
    const errorMessage = liveError instanceof Error ? liveError.message : 'Unknown live API error';
    console.error('❌ LIVE API fetch failed:', errorMessage);
    console.log('🔄 Switching to BACKUP + AUTO-PROCESSING mode...');
    
    isOfflineMode = true;
    source = 'auto-processed';

    // DRUGI POKUŠAJ: UVJEK koristimo backup
    try {
      const latestBackup = backupService.getLatestBackup();
      
      if (latestBackup.flights.length > 0) {
        console.log(`✅ Using BACKUP data from ${latestBackup.timestamp} (${latestBackup.flights.length} flights)`);
        
        // Apply auto-processing to backup data
        const processor = new FlightAutoProcessor(latestBackup.flights);
        const processedFlights = processor.processFlights();
        
        // Simulate real-time progress
        const simulatedFlights = FlightAutoProcessor.simulateRealTimeProgress(processedFlights);
        
        const autoProcessedDepartures = sortFlightsByTime(
          simulatedFlights.filter((f: AutoProcessedFlight) => f.FlightType === 'departure')
        );
        
        const autoProcessedArrivals = sortFlightsByTime(
          simulatedFlights.filter((f: AutoProcessedFlight) => f.FlightType === 'arrival')
        );
        
        // Count auto-processed flights
        autoProcessedCount = simulatedFlights.filter((f: AutoProcessedFlight) => f.AutoProcessed).length;
        
        // Determine source based on auto-processing
        source = autoProcessedCount > 0 ? 'auto-processed' : 'backup';
        
        const totalFlights = autoProcessedDepartures.length + autoProcessedArrivals.length;
        
        // 👇 VAŽNO: Sada totalFlights je REQUIRED
        const flightData: FlightData = {
          departures: autoProcessedDepartures,
          arrivals: autoProcessedArrivals,
          lastUpdated: latestBackup.timestamp,
          source,
          backupTimestamp: latestBackup.timestamp,
          autoProcessedCount,
          isOfflineMode: true,
          totalFlights, // 👈 OVO JE SADA REQUIRED
          warning: 'Using backup data. Live API temporarily unavailable.'
        };

        console.log(`📊 BACKUP data ready: ${autoProcessedDepartures.length} departures, ${autoProcessedArrivals.length} arrivals, total: ${flightData.totalFlights}`);

        return NextResponse.json(flightData, {
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
            'X-Data-Source': source,
            'X-Offline-Mode': 'true',
            'X-Backup-Timestamp': latestBackup.timestamp,
            'X-Total-Flights': flightData.totalFlights.toString()
          }
        });
      } else {
        // Backup je prazan - pokušaj emergency fetch
        console.log('⚠️ Backup is empty, attempting emergency fetch...');
        
        const emergencyFlights = await performEmergencyFetch();
        
        if (emergencyFlights && emergencyFlights.length > 0) {
          // Save emergency backup
          backupService.saveBackup(emergencyFlights);
          
          // Process with auto-processor
          const processor = new FlightAutoProcessor(emergencyFlights);
          const processedFlights = processor.processFlights();
          
          const departures = sortFlightsByTime(
            processedFlights.filter((f: AutoProcessedFlight) => f.FlightType === 'departure')
          );
          
          const arrivals = sortFlightsByTime(
            processedFlights.filter((f: AutoProcessedFlight) => f.FlightType === 'arrival')
          );
          
          const totalFlights = departures.length + arrivals.length;
          
          // 👇 VAŽNO: Sada totalFlights je REQUIRED
          const flightData: FlightData = {
            departures,
            arrivals,
            lastUpdated: new Date().toISOString(),
            source: 'emergency',
            isOfflineMode: true,
            totalFlights, // 👈 OVO JE SADA REQUIRED
            warning: 'Emergency mode: Using directly fetched data with auto-processing.'
          };
          
          console.log(`🚨 EMERGENCY data ready: ${departures.length} departures, ${arrivals.length} arrivals, total: ${flightData.totalFlights}`);
          
          return NextResponse.json(flightData, {
            headers: {
              'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
              'X-Data-Source': 'emergency',
              'X-Offline-Mode': 'true',
              'X-Emergency': 'true',
              'X-Total-Flights': flightData.totalFlights.toString()
            }
          });
        }
        
        // Apsolutni last resort - prazni podaci sa objašnjenjem
        console.log('🚨 CRITICAL: All data sources failed');
        
        const emptyData: FlightData = {
          departures: [],
          arrivals: [],
          lastUpdated: new Date().toISOString(),
          source: 'emergency',
          isOfflineMode: true,
          totalFlights: 0, // 👈 OVO JE SADA REQUIRED
          error: 'All data sources unavailable. Please check your connection.',
          warning: 'System will recover when connection is restored.'
        };
        
        return NextResponse.json(emptyData, {
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Data-Source': 'critical-emergency',
            'X-Offline-Mode': 'true',
            'X-Emergency': 'true',
            'X-Total-Flights': '0'
          }
        });
      }
      
    } catch (backupError: unknown) {
      const errorMessage = backupError instanceof Error ? backupError.message : 'Unknown backup system error';
      console.error('❌ CRITICAL: Backup system failed:', errorMessage);
      
      // Apsolutni last resort
      const emergencyData: FlightData = {
        departures: [],
        arrivals: [],
        lastUpdated: new Date().toISOString(),
        source: 'emergency',
        isOfflineMode: true,
        totalFlights: 0, // 👈 OVO JE SADA REQUIRED
        error: 'CRITICAL: All data systems failed',
        warning: 'System in emergency recovery mode. Please refresh.'
      };

      return NextResponse.json(emergencyData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Data-Source': 'critical-emergency',
          'X-Offline-Mode': 'true',
          'X-Emergency': 'true',
          'X-Total-Flights': '0'
        }
      });
    }
  }
}

// ESLint compliant: dodaj ovo ako koristiš Next.js 13+ app router
export const dynamic = 'force-dynamic';
export const revalidate = 0;