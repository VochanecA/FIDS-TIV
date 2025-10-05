'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Flight } from '@/types/flight';
import { fetchFlightData, getFlightsByCheckIn, getProcessingFlights } from '@/lib/flight-service';
import Image from 'next/image';

const AD_IMAGES = [
  'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg',
  'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
  'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
];

export default function CheckInPage() {
  const params = useParams();
  const deskNumberParam = params.deskNumber as string;
  
  // Normalize desk number - remove leading zeros for consistent comparison
  const deskNumberNormalized = deskNumberParam.replace(/^0+/, '');
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<Flight | null>(null);

  useEffect(() => {
    const loadFlights = async () => {
      try {
        console.log('🔄 Loading flights for desk:', {
          original: deskNumberParam,
          normalized: deskNumberNormalized
        });
        
        const data = await fetchFlightData();
        console.log('📊 All departures count:', data.departures?.length || 0);
        
        // Try multiple desk number formats to find matches
        let deskFlights: Flight[] = [];
        const deskNumberVariants = [
          deskNumberParam,           // Original from URL (e.g., "09")
          deskNumberNormalized,      // Normalized (e.g., "9")
          deskNumberNormalized.padStart(2, '0'), // Ensure 2-digit format
        ];

        // Remove duplicates
        const uniqueVariants = Array.from(new Set(deskNumberVariants));

        console.log('🔍 Trying desk number variants:', uniqueVariants);

        for (const variant of uniqueVariants) {
          const flightsForVariant = getFlightsByCheckIn(data.departures, variant);
          console.log(`📋 Found ${flightsForVariant.length} flights for desk "${variant}"`);
          
          if (flightsForVariant.length > 0) {
            deskFlights = flightsForVariant;
            console.log(`✅ Using variant: ${variant}`);
            break;
          }
        }

        if (deskFlights.length === 0) {
          console.log('❌ No flights found for any desk number variant');
          setLoading(false);
          return;
        }

        // Log all found flights and their statuses for debugging
        console.log('📋 All matching flights:', deskFlights.map(f => ({
          flight: f.FlightNumber,
          checkIn: f.CheckInDesk,
          status: f.StatusEN
        })));

        const processingFlights = getProcessingFlights(deskFlights);
        console.log('🔄 Processing flights:', processingFlights);
        
        // Additional safety check - ensure status is "Processing"
        const validProcessingFlights = processingFlights.filter(
          flight => flight.StatusEN?.toLowerCase() === 'processing'
        );
        
        console.log('✅ Valid processing flights:', validProcessingFlights);
        
        if (validProcessingFlights.length > 0) {
          const newFlight = validProcessingFlights[0];
          setFlight(newFlight);
          setCurrentData(newFlight); // Update current data without clearing
          console.log('🎯 Selected flight:', {
            flight: newFlight.FlightNumber,
            destination: newFlight.DestinationCityName,
            checkIn: newFlight.CheckInDesk,
            status: newFlight.StatusEN
          });
        } else {
          // Only clear if we definitely have no processing flights
          // Don't clear currentData to avoid flickering
          setFlight(null);
          console.log('❌ No valid processing flights found');
        }
        
      } catch (error) {
        console.error('❌ Error loading flight data:', error);
        // Don't clear current data on error to avoid flickering
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadFlights();
    
    // Set up refresh interval - but don't clear existing data during refresh
    const interval = setInterval(loadFlights, 60000);
    return () => clearInterval(interval);
  }, [deskNumberParam, deskNumberNormalized]);

  useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % AD_IMAGES.length);
    }, 15000);
    return () => clearInterval(adInterval);
  }, []);

  // Use currentData to avoid flickering - only show loading on initial load
  const displayFlight = currentData || flight;
  const shouldShowCheckIn = displayFlight && displayFlight.StatusEN?.toLowerCase() === 'processing';

  // Show loading state only on initial load
  if (loading && !displayFlight) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center landscape:bg-slate-900 landscape:text-white">
        <div className="text-center landscape:w-full landscape:h-full landscape:flex landscape:flex-col landscape:items-center landscape:justify-center">
          <div className="text-6xl font-bold text-slate-900 mb-4 landscape:text-8xl landscape:text-white">{deskNumberParam}</div>
          <div className="text-xl text-slate-600 landscape:text-3xl">Loading...</div>
        </div>
      </div>
    );
  }

  // Show desk number only when no processing flight found
  if (!shouldShowCheckIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center landscape:bg-slate-900 landscape:text-white">
        <div className="text-center landscape:w-full landscape:h-full landscape:flex landscape:flex-col landscape:items-center landscape:justify-center">
          <div className="text-9xl font-bold text-slate-900 mb-4 landscape:text-[15rem] landscape:text-white">{deskNumberParam}</div>
          <div className="text-xl text-slate-600 landscape:text-3xl">
            {displayFlight ? 'Check-in not available' : 'No flights found'}
          </div>
          <div className="text-sm text-slate-500 mt-2 landscape:text-xl">
            {displayFlight ? `Status: ${displayFlight.StatusEN}` : 'No flight assigned to this desk'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col landscape:flex-row landscape:h-screen landscape:overflow-hidden">
      {/* Flight Info Section - Full 80% width with proper edge mapping */}
      <div className="flex-[2] flex flex-col items-center justify-center p-4 bg-slate-900 text-white landscape:w-[80vw] landscape:h-screen landscape:overflow-hidden landscape:p-2">
        <div className="w-full h-full flex flex-col items-center justify-between landscape:justify-center landscape:space-y-4 landscape:p-4">
          
          {/* Top Row: Airline Logo + Flight Info - Full width */}
          <div className="flex items-center justify-between w-full landscape:mb-4 landscape:px-4">
            {/* Airline logo */}
            {displayFlight.AirlineLogoURL && (
              <div className="bg-white p-2 rounded-xl shadow-xl landscape:min-w-[200px] landscape:p-3">
                <Image
                  src={displayFlight.AirlineLogoURL}
                  alt={displayFlight.AirlineName || 'Airline Logo'}
                  width={200}
                  height={100}
                  className="object-contain landscape:w-[200px] landscape:h-[100px]"
                  onError={(e) => {
                    console.log('❌ Failed to load airline logo:', displayFlight.AirlineLogoURL);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Flight number and Codeshare - Centered */}
            <div className="flex-1 text-center landscape:mx-4">
              <div className="text-6xl font-bold mb-2 landscape:text-7xl landscape:mb-3">{displayFlight.FlightNumber}</div>
              {displayFlight.CodeShareFlights && displayFlight.CodeShareFlights.length > 0 && (
                <div className="text-2xl text-slate-400 landscape:text-3xl">
                  {displayFlight.CodeShareFlights.join(' / ')}
                </div>
              )}
            </div>

            {/* Spacer for balance */}
            <div className="w-[200px] landscape:min-w-[200px]"></div>
          </div>

          {/* Destination - Centered and prominent */}
          <div className="text-center w-full landscape:my-4">
            <div className="text-5xl font-bold text-blue-400 landscape:text-6xl leading-tight">
              {displayFlight.DestinationCityName}
            </div>
            <div className="text-4xl font-bold text-blue-300 landscape:text-5xl mt-2">
              ({displayFlight.DestinationAirportCode})
            </div>
          </div>

          {/* Check-in status with blinking LED */}
          <div className="flex items-center gap-4 text-4xl font-bold text-green-500 my-4 landscape:text-5xl landscape:my-6">
            <span className="w-6 h-6 rounded-full bg-green-400 animate-blink landscape:w-8 landscape:h-8" />
            CHECK-IN OPEN
          </div>

          {/* Times and Gate Info Row - Full width */}
          <div className="grid grid-cols-3 gap-4 w-full landscape:gap-6 landscape:max-w-5xl landscape:mb-4">
            {/* Scheduled Time */}
            <div className="text-center">
              <div className="text-2xl text-slate-400 landscape:text-3xl mb-2">SCHEDULED</div>
              <div className="text-4xl font-mono landscape:text-5xl">{displayFlight.ScheduledDepartureTime}</div>
            </div>

            {/* Expected Time (if different) */}
            {displayFlight.EstimatedDepartureTime && displayFlight.EstimatedDepartureTime !== displayFlight.ScheduledDepartureTime && (
              <div className="text-center">
                <div className="text-2xl text-yellow-400 landscape:text-3xl mb-2">EXPECTED</div>
                <div className="text-4xl font-mono landscape:text-5xl">{displayFlight.EstimatedDepartureTime}</div>
              </div>
            )}

            {/* Gate Info */}
            {displayFlight.GateNumber && (
              <div className="text-center">
                <div className="text-2xl text-slate-400 landscape:text-3xl mb-2">GATE</div>
                <div className="text-5xl font-bold text-yellow-400 landscape:text-6xl">{displayFlight.GateNumber}</div>
              </div>
            )}
          </div>

          {/* Gate instruction */}
          {displayFlight.GateNumber && (
            <div className="text-center mt-4 landscape:mt-6">
              <div className="text-2xl text-slate-400 landscape:text-3xl">
                After check-in please proceed to gate {displayFlight.GateNumber}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad Section - Exact 20% width */}
      <div className="flex-1 relative bg-slate-800 landscape:w-[20vw] landscape:h-screen landscape:flex-shrink-0">
        <Image
          src={AD_IMAGES[currentAdIndex]}
          alt="Advertisement"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Blinking animation */}
      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.2; }
          100% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        /* Ensure no scrollbars and perfect edge mapping */
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}