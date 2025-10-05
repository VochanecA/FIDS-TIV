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
          setCurrentData(newFlight);
          console.log('🎯 Selected flight:', {
            flight: newFlight.FlightNumber,
            destination: newFlight.DestinationCityName,
            checkIn: newFlight.CheckInDesk,
            status: newFlight.StatusEN
          });
        } else {
          setFlight(null);
          console.log('❌ No valid processing flights found');
        }
        
      } catch (error) {
        console.error('❌ Error loading flight data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
    const interval = setInterval(loadFlights, 60000);
    return () => clearInterval(interval);
  }, [deskNumberParam, deskNumberNormalized]);

  useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % AD_IMAGES.length);
    }, 15000);
    return () => clearInterval(adInterval);
  }, []);

  const displayFlight = currentData || flight;
  const shouldShowCheckIn = displayFlight && displayFlight.StatusEN?.toLowerCase() === 'processing';

  // Show loading state only on initial load
  if (loading && !displayFlight) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center landscape:bg-slate-900 landscape:text-white">
        <div className="text-center landscape:w-full landscape:h-full landscape:flex landscape:flex-col landscape:items-center landscape:justify-center">
          <div className="text-8xl font-bold text-slate-900 mb-6 landscape:text-4k-desk">{deskNumberParam}</div>
          <div className="text-3xl text-slate-600 landscape:text-4k-loading">Loading...</div>
        </div>
      </div>
    );
  }

  // Show desk number only when no processing flight found
  if (!shouldShowCheckIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center landscape:bg-slate-900 landscape:text-white">
        <div className="text-center landscape:w-full landscape:h-full landscape:flex landscape:flex-col landscape:items-center landscape:justify-center">
          <div className="text-9xl font-bold text-slate-900 mb-6 landscape:text-4k-desk-large">{deskNumberParam}</div>
          <div className="text-3xl text-slate-600 landscape:text-4k-status">
            {displayFlight ? 'Check-in not available' : 'No flights found'}
          </div>
          <div className="text-xl text-slate-500 mt-4 landscape:text-4k-substatus">
            {displayFlight ? `Status: ${displayFlight.StatusEN}` : 'No flight assigned to this desk'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col landscape:flex-row landscape:h-screen landscape:overflow-hidden">
      {/* Flight Info Section */}
      <div className="flex-[2] flex flex-col items-center justify-center p-8 bg-slate-900 text-white landscape:w-[80vw] landscape:h-screen landscape:overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-between landscape:justify-center landscape:space-y-8 landscape:py-12">
          
          {/* Top Row: Airline Logo + Flight Info - Moved higher in portrait */}
          <div className="flex items-center justify-between w-full max-w-7xl landscape:mb-8 portrait-1080:mt-8 portrait-1080:mb-4">
            {/* Airline logo */}
            {displayFlight.AirlineLogoURL && (
              <div className="bg-white p-6 rounded-2xl shadow-2xl landscape:logo-container portrait-1080:p-4">
                <Image
                  src={displayFlight.AirlineLogoURL}
                  alt={displayFlight.AirlineName || 'Airline Logo'}
                  width={400}
                  height={200}
                  className="object-contain landscape:logo-image portrait-1080:w-[180px] portrait-1080:h-[90px]"
                  onError={(e) => {
                    console.log('❌ Failed to load airline logo:', displayFlight.AirlineLogoURL);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Flight number and Codeshare - Moved higher */}
            <div className="flex-1 text-center landscape:mx-8 portrait-1080:mx-4">
              <div className="text-8xl font-bold mb-4 landscape:text-4k-flight portrait-1080:text-7xl portrait-1080:mb-2">{displayFlight.FlightNumber}</div>
              {displayFlight.CodeShareFlights && displayFlight.CodeShareFlights.length > 0 && (
                <div className="text-4xl text-slate-400 landscape:text-4k-codeshare portrait-1080:text-2xl">
                  {displayFlight.CodeShareFlights.join(' / ')}
                </div>
              )}
            </div>

            {/* Spacer for balance */}
            <div className="landscape:logo-spacer portrait-1080:w-[180px]"></div>
          </div>

          {/* Destination - Slightly bigger in portrait */}
          <div className="text-center w-full landscape:my-8 portrait-1080:my-4">
            <div className="text-7xl font-bold text-blue-400 landscape:text-4k-destination leading-tight portrait-1080:text-6xl">
              {displayFlight.DestinationCityName}
            </div>
            <div className="text-6xl font-bold text-blue-300 landscape:text-4k-airport mt-6 portrait-1080:text-5xl portrait-1080:mt-4">
              ({displayFlight.DestinationAirportCode})
            </div>
          </div>

          {/* Check-in status */}
          <div className="flex items-center gap-6 text-6xl font-bold text-green-500 my-8 landscape:text-4k-checkin landscape:my-12 portrait-1080:text-5xl portrait-1080:my-6">
            <span className="w-10 h-10 rounded-full bg-green-400 animate-blink landscape:led-indicator portrait-1080:w-8 portrait-1080:h-8" />
            CHECK-IN OPEN
          </div>

          {/* Times and Gate Info Row - Smaller labels in portrait */}
          <div className="grid grid-cols-3 gap-16 w-full max-w-6xl landscape:gap-20 landscape:max-w-7xl landscape:mb-8 portrait-1080:gap-8 portrait-1080:max-w-4xl">
            {/* Scheduled Time */}
            <div className="text-center">
              <div className="text-4xl text-slate-400 landscape:text-4k-label mb-4 portrait-1080:text-2xl portrait-1080:mb-2">SCHEDULED</div>
              <div className="text-6xl font-mono landscape:text-4k-time portrait-1080:text-4xl">{displayFlight.ScheduledDepartureTime}</div>
            </div>

            {/* Expected Time */}
            {displayFlight.EstimatedDepartureTime && displayFlight.EstimatedDepartureTime !== displayFlight.ScheduledDepartureTime && (
              <div className="text-center">
                <div className="text-4xl text-yellow-400 landscape:text-4k-label mb-4 portrait-1080:text-2xl portrait-1080:mb-2">EXPECTED</div>
                <div className="text-6xl font-mono landscape:text-4k-time portrait-1080:text-4xl">{displayFlight.EstimatedDepartureTime}</div>
              </div>
            )}

            {/* Gate Info */}
            {displayFlight.GateNumber && (
              <div className="text-center">
                <div className="text-4xl text-slate-400 landscape:text-4k-label mb-4 portrait-1080:text-2xl portrait-1080:mb-2">GATE</div>
                <div className="text-7xl font-bold text-yellow-400 landscape:text-4k-gate portrait-1080:text-5xl">{displayFlight.GateNumber}</div>
              </div>
            )}
          </div>

          {/* Gate instruction - Adjusted for portrait */}
          {displayFlight.GateNumber && (
            <div className="text-center mt-8 landscape:mt-12 portrait-1080:mt-6">
              <div className="text-4xl text-slate-400 landscape:text-4k-instruction portrait-1080:text-2xl">
                After check-in please proceed to gate {displayFlight.GateNumber}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad Section */}
      <div className="flex-1 relative bg-slate-800 landscape:w-[20vw] landscape:h-screen landscape:flex-shrink-0">
        <Image
          src={AD_IMAGES[currentAdIndex]}
          alt="Advertisement"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* High-resolution optimized styles */}
      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.2; }
          100% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        /* Base styles for all resolutions */
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* 1080x1920 Portrait Mode Specific Adjustments */
        @media (orientation: portrait) and (min-height: 1080px) and (max-height: 1920px) {
          .portrait-1080\\:mt-8 { margin-top: 2rem; }
          .portrait-1080\\:mb-4 { margin-bottom: 1rem; }
          .portrait-1080\\:mb-2 { margin-bottom: 0.5rem; }
          .portrait-1080\\:my-4 { margin-top: 1rem; margin-bottom: 1rem; }
          .portrait-1080\\:my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
          .portrait-1080\\:mt-6 { margin-top: 1.5rem; }
          .portrait-1080\\:mx-4 { margin-left: 1rem; margin-right: 1rem; }
          .portrait-1080\\:p-4 { padding: 1rem; }
          .portrait-1080\\:w-\\[180px\\] { width: 180px; }
          .portrait-1080\\:h-\\[90px\\] { height: 90px; }
          .portrait-1080\\:text-7xl { font-size: 4.5rem; }
          .portrait-1080\\:text-6xl { font-size: 3.75rem; }
          .portrait-1080\\:text-5xl { font-size: 3rem; }
          .portrait-1080\\:text-4xl { font-size: 2.25rem; }
          .portrait-1080\\:text-2xl { font-size: 1.5rem; }
          .portrait-1080\\:w-8 { width: 2rem; }
          .portrait-1080\\:h-8 { height: 2rem; }
          .portrait-1080\\:gap-8 { gap: 2rem; }
          .portrait-1080\\:max-w-4xl { max-width: 56rem; }
        }

        /* 2K Cinema: 2048x1080 */
        @media (min-width: 2048px) and (min-height: 1080px) {
          .landscape\\:text-4k-desk { font-size: 18rem; }
          .landscape\\:text-4k-desk-large { font-size: 22rem; }
          .landscape\\:text-4k-loading { font-size: 4rem; }
          .landscape\\:text-4k-status { font-size: 4rem; }
          .landscape\\:text-4k-substatus { font-size: 3rem; }
          .landscape\\:text-4k-flight { font-size: 12rem; }
          .landscape\\:text-4k-codeshare { font-size: 5rem; }
          .landscape\\:text-4k-destination { font-size: 9rem; }
          .landscape\\:text-4k-airport { font-size: 8rem; }
          .landscape\\:text-4k-checkin { font-size: 5.5rem; }
          .landscape\\:text-4k-label { font-size: 4.5rem; }
          .landscape\\:text-4k-time { font-size: 7rem; }
          .landscape\\:text-4k-gate { font-size: 9rem; }
          .landscape\\:text-4k-instruction { font-size: 4rem; }
          .landscape\\:led-indicator { width: 1.2rem; height: 1.2rem; }
          .landscape\\:logo-container { min-width: 450px; padding: 8px; }
          .landscape\\:logo-image { width: 450px; height: 225px; }
          .landscape\\:logo-spacer { width: 450px; min-width: 450px; }
        }

        /* QHD: 2560x1440 */
        @media (min-width: 2560px) and (min-height: 1440px) {
          .landscape\\:text-4k-desk { font-size: 20rem; }
          .landscape\\:text-4k-desk-large { font-size: 25rem; }
          .landscape\\:text-4k-loading { font-size: 4.5rem; }
          .landscape\\:text-4k-status { font-size: 4.5rem; }
          .landscape\\:text-4k-substatus { font-size: 3.5rem; }
          .landscape\\:text-4k-flight { font-size: 14rem; }
          .landscape\\:text-4k-codeshare { font-size: 5.5rem; }
          .landscape\\:text-4k-destination { font-size: 10rem; }
          .landscape\\:text-4k-airport { font-size: 9rem; }
          .landscape\\:text-4k-checkin { font-size: 6rem; }
          .landscape\\:text-4k-label { font-size: 5rem; }
          .landscape\\:text-4k-time { font-size: 8rem; }
          .landscape\\:text-4k-gate { font-size: 10rem; }
          .landscape\\:text-4k-instruction { font-size: 4.5rem; }
          .landscape\\:led-indicator { width: 1.4rem; height: 1.4rem; }
          .landscape\\:logo-container { min-width: 500px; padding: 10px; }
          .landscape\\:logo-image { width: 500px; height: 250px; }
          .landscape\\:logo-spacer { width: 500px; min-width: 500px; }
        }

        /* 4K UHD: 3840x2160 */
        @media (min-width: 3840px) and (min-height: 2160px) {
          .landscape\\:text-4k-desk { font-size: 30rem; }
          .landscape\\:text-4k-desk-large { font-size: 35rem; }
          .landscape\\:text-4k-loading { font-size: 6rem; }
          .landscape\\:text-4k-status { font-size: 6rem; }
          .landscape\\:text-4k-substatus { font-size: 4.5rem; }
          .landscape\\:text-4k-flight { font-size: 20rem; }
          .landscape\\:text-4k-codeshare { font-size: 7rem; }
          .landscape\\:text-4k-destination { font-size: 14rem; }
          .landscape\\:text-4k-airport { font-size: 12rem; }
          .landscape\\:text-4k-checkin { font-size: 8rem; }
          .landscape\\:text-4k-label { font-size: 6.5rem; }
          .landscape\\:text-4k-time { font-size: 11rem; }
          .landscape\\:text-4k-gate { font-size: 14rem; }
          .landscape\\:text-4k-instruction { font-size: 6rem; }
          .landscape\\:led-indicator { width: 2rem; height: 2rem; }
          .landscape\\:logo-container { min-width: 700px; padding: 12px; }
          .landscape\\:logo-image { width: 700px; height: 350px; }
          .landscape\\:logo-spacer { width: 700px; min-width: 700px; }
        }

        /* DCI-4K: 4096x2160 */
        @media (min-width: 4096px) and (min-height: 2160px) {
          .landscape\\:text-4k-desk { font-size: 32rem; }
          .landscape\\:text-4k-desk-large { font-size: 38rem; }
          .landscape\\:text-4k-loading { font-size: 6.5rem; }
          .landscape\\:text-4k-status { font-size: 6.5rem; }
          .landscape\\:text-4k-substatus { font-size: 5rem; }
          .landscape\\:text-4k-flight { font-size: 22rem; }
          .landscape\\:text-4k-codeshare { font-size: 7.5rem; }
          .landscape\\:text-4k-destination { font-size: 15rem; }
          .landscape\\:text-4k-airport { font-size: 13rem; }
          .landscape\\:text-4k-checkin { font-size: 8.5rem; }
          .landscape\\:text-4k-label { font-size: 7rem; }
          .landscape\\:text-4k-time { font-size: 12rem; }
          .landscape\\:text-4k-gate { font-size: 15rem; }
          .landscape\\:text-4k-instruction { font-size: 6.5rem; }
          .landscape\\:led-indicator { width: 2.2rem; height: 2.2rem; }
          .landscape\\:logo-container { min-width: 750px; padding: 14px; }
          .landscape\\:logo-image { width: 750px; height: 375px; }
          .landscape\\:logo-spacer { width: 750px; min-width: 750px; }
        }
      `}</style>
    </div>
  );
}