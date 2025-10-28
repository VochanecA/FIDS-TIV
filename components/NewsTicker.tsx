// components/NewsTicker.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Flight } from '@/types/flight';
import Image from 'next/image';

interface NewsTickerProps {
  arrivals: Flight[];
  departures: Flight[];
  className?: string;
}

interface TickerItem {
  id: string;
  type: 'delay' | 'cancellation' | 'early' | 'boarding' | 'arrived' | 'departed' | 'gate_change' | 'checkin_open' | 'final_call' | 'ai_analysis';
  message: string;
  flightNumber: string;
  airlineName: string;
  airlineICAO: string;
  severity: 'low' | 'medium' | 'high';
  details?: {
    originalTime?: string;
    newTime?: string;
    gate?: string;
    terminal?: string;
    checkInDesks?: string;
    analysis?: string;
  };
}

// Flightaware logo URL generator
const getFlightawareLogoURL = (icaoCode: string): string => {
  if (!icaoCode) {
    return 'https://via.placeholder.com/60x40?text=No+Logo';
  }
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
};

// DeepSeek AI logo
const deepseekLogoURL = 'https://www.deepseek.com/_next/static/media/logo.7f7d0f9f.svg'; // Možeš promijeniti ako imaš bolji URL

// Base64 placeholder image
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzQzQzU0Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTdCNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5ObyBMb2dvPC90ZXh0Pgo8L3N2Zz4K';

export default function NewsTicker({ arrivals, departures, className = '' }: NewsTickerProps) {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);

  // Format time function
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const cleanTime = timeString.replace(':', '');
    if (cleanTime.length === 4) {
      return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
    }
    return timeString;
  };

  // Format terminal display
  const formatTerminal = (terminal?: string): string => {
    if (!terminal) return '';
    return terminal.replace('T0', '').replace('T', '');
  };

  // Format check-in desks
  const formatCheckInDesks = (checkInDesk: string): string => {
    if (!checkInDesk || checkInDesk === '-') return '';
    
    // Handle multiple check-in desks (e.g., "10,11,12" or "10-12")
    if (checkInDesk.includes(',')) {
      const desks = checkInDesk.split(',').map(d => d.trim());
      if (desks.length > 1) {
        return `counters ${desks.join(', ')}`;
      }
    }
    
    if (checkInDesk.includes('-')) {
      return `counters ${checkInDesk}`;
    }
    
    return `counter ${checkInDesk}`;
  };

  // Get airline name or use default
  const getAirlineName = (flight: Flight): string => {
    return flight.AirlineName || 'The airline';
  };

  // Get origin for arrivals - koristimo DestinationAirportName kao polazište za dolaske
  const getOrigin = (flight: Flight, isArrival: boolean): string => {
    if (isArrival) {
      return flight.DestinationAirportName || flight.DestinationCityName || 'unknown origin';
    }
    return flight.DestinationCityName || flight.DestinationAirportName || 'unknown destination';
  };

  // Check if flight is arrival
  const isArrivalFlight = (flight: Flight): boolean => {
    return arrivals.some(arrival => arrival.FlightNumber === flight.FlightNumber);
  };

  // Check if status is processing
  const isProcessing = (status: string): boolean => {
    const statusLower = status?.toLowerCase() || '';
    return statusLower.includes('processing');
  };

  // Enhanced image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget;
    target.src = placeholderImage;
    target.style.display = 'block';
  };

  // AI Analysis function - analizira letove i generira pametne poruke
  const generateAIAnalysis = (allFlights: Flight[]): TickerItem[] => {
    const aiItems: TickerItem[] = [];
    
    // Analiza kašnjenja
    const delayedFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('delay') || 
      flight.StatusEN?.toLowerCase().includes('kasni')
    );
    
    if (delayedFlights.length > 2) {
      aiItems.push({
        id: 'ai-multiple-delays',
        type: 'ai_analysis',
        message: `🤖 AI ANALYSIS: Multiple delays detected. ${delayedFlights.length} flights are experiencing delays. Consider checking with airlines for updates.`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'medium',
        details: {
          analysis: `Found ${delayedFlights.length} delayed flights in the system`
        }
      });
    }

    // Analiza otkazivanja
    const cancelledFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('cancelled') || 
      flight.StatusEN?.toLowerCase().includes('otkazan')
    );
    
    if (cancelledFlights.length > 0) {
      aiItems.push({
        id: 'ai-cancellations',
        type: 'ai_analysis',
        message: `🤖 AI ALERT: ${cancelledFlights.length} flight(s) cancelled. Affected passengers should contact their airlines for rebooking options.`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'high',
        details: {
          analysis: `${cancelledFlights.length} flight cancellations detected`
        }
      });
    }

    // Analiza boarding
    const boardingFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('boarding') || 
      flight.StatusEN?.toLowerCase().includes('gate open')
    );
    
    if (boardingFlights.length > 0) {
      aiItems.push({
        id: 'ai-boarding',
        type: 'ai_analysis',
        message: `🤖 AI UPDATE: ${boardingFlights.length} flight(s) currently boarding. Passengers should proceed to their gates immediately.`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'medium',
        details: {
          analysis: `${boardingFlights.length} flights in boarding process`
        }
      });
    }

    // General airport status
    const totalFlights = allFlights.length;
    const onTimeFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('on time') || 
      flight.StatusEN?.toLowerCase().includes('na vrijeme') ||
      flight.StatusEN?.toLowerCase().includes('scheduled')
    ).length;

    const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0;
    
    if (onTimePercentage >= 80) {
      aiItems.push({
        id: 'ai-good-status',
        type: 'ai_analysis',
        message: `🤖 AI REPORT: Excellent airport operations! ${onTimePercentage}% of flights are on schedule. Smooth travel experience expected.`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'low',
        details: {
          analysis: `${onTimePercentage}% on-time performance`
        }
      });
    }

    return aiItems;
  };

  // Analiziraj letove i generiraj ticker stavke
  useEffect(() => {
    const items: TickerItem[] = [];

    const allFlights = [...arrivals, ...departures];

    allFlights.forEach((flight) => {
      const statusLower = flight.StatusEN?.toLowerCase() || '';
      const flightNumber = flight.FlightNumber;
      const airlineName = getAirlineName(flight);
      const airlineICAO = flight.AirlineICAO || '';
      const isArrival = isArrivalFlight(flight);
      const origin = getOrigin(flight, true); // Za dolaske, ovo je polazište
      const destination = getOrigin(flight, false); // Za polaske, ovo je odredište

      // Provjeri kašnjenja - samo za polaske
      if (!isArrival && (statusLower.includes('delay') || statusLower.includes('kasni'))) {
        const originalTime = formatTime(flight.ScheduledDepartureTime);
        const newTime = formatTime(flight.EstimatedDepartureTime);
        
        items.push({
          id: `${flightNumber}-delay-${Date.now()}`,
          type: 'delay',
          message: `⏱️ ${airlineName} flight ${flightNumber} to ${destination} is delayed. New departure time: ${newTime}`,
          flightNumber: flightNumber,
          airlineName: airlineName,
          airlineICAO: airlineICAO,
          severity: 'medium',
          details: {
            originalTime: originalTime,
            newTime: newTime
          }
        });
      }

      // Provjeri otkazivanja - za sve letove
      if (statusLower.includes('cancelled') || statusLower.includes('otkazan')) {
        const flightType = isArrival ? 'from' : 'to';
        const location = isArrival ? origin : destination;
        
        items.push({
          id: `${flightNumber}-cancelled-${Date.now()}`,
          type: 'cancellation',
          message: `❌ ${airlineName} flight ${flightNumber} ${flightType} ${location} has been cancelled`,
          flightNumber: flightNumber,
          airlineName: airlineName,
          airlineICAO: airlineICAO,
          severity: 'high'
        });
      }

      // Provjeri ranije dolaske - SAMO ZA DOLASKE KOJI SU VEĆ SLETJELI
      if (isArrival && (statusLower.includes('arrived') || statusLower.includes('sletio') || statusLower.includes('landed'))) {
        if (statusLower.includes('earlier') || statusLower.includes('ranije') || statusLower.includes('prije vremena')) {
          items.push({
            id: `${flightNumber}-early-${Date.now()}`,
            type: 'early',
            message: `🔼 ${airlineName} flight ${flightNumber} from ${origin} arrived ahead of schedule`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low'
          });
        } else {
          // Normalan dolazak
          const baggageInfo = flight.BaggageReclaim && flight.BaggageReclaim !== '-' 
            ? ` Baggage will be available at belt ${flight.BaggageReclaim}.`
            : '';
          
          items.push({
            id: `${flightNumber}-arrived-${Date.now()}`,
            type: 'arrived',
            message: `🛬 ${airlineName} flight ${flightNumber} from ${origin} has arrived at the airport.${baggageInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low'
          });
        }
      }

      // Provjeri boarding - samo za polaske
      if (!isArrival) {
        // Normal boarding
        if ((statusLower.includes('boarding') || statusLower.includes('gate open')) && !statusLower.includes('final')) {
          const terminal = formatTerminal(flight.Terminal);
          const gateInfo = flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA' 
            ? `Gate ${flight.GateNumber}${terminal ? ` in Terminal ${terminal}` : ''}`
            : 'the gate';
          
          items.push({
            id: `${flightNumber}-boarding-${Date.now()}`,
            type: 'boarding',
            message: `🎫 ${airlineName} flight ${flightNumber} to ${destination} is now boarding at ${gateInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low',
            details: {
              gate: flight.GateNumber,
              terminal: flight.Terminal
            }
          });
        }

        // Final call - samo za polaske
        if (statusLower.includes('final call') || statusLower.includes('last call')) {
          const terminal = formatTerminal(flight.Terminal);
          const gateInfo = flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA' 
            ? `Gate ${flight.GateNumber}${terminal ? ` in Terminal ${terminal}` : ''}`
            : 'the gate';
          
          items.push({
            id: `${flightNumber}-final-call-${Date.now()}`,
            type: 'final_call',
            message: `🚨 FINAL CALL: ${airlineName} flight ${flightNumber} to ${destination} will be closing soon at ${gateInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'high',
            details: {
              gate: flight.GateNumber,
              terminal: flight.Terminal
            }
          });
        }

        // Provjeri departed - samo za polaske
        if (statusLower.includes('departed') || statusLower.includes('poletio') || statusLower.includes('took off')) {
          items.push({
            id: `${flightNumber}-departed-${Date.now()}`,
            type: 'departed',
            message: `🛫 ${airlineName} flight ${flightNumber} to ${destination} has departed from the airport`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low'
          });
        }

        // Provjeri gate change - samo za polaske
        if (flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA') {
          const terminal = formatTerminal(flight.Terminal);
          const gateInfo = `Gate ${flight.GateNumber}${terminal ? ` in Terminal ${terminal}` : ''}`;
          
          items.push({
            id: `${flightNumber}-gate-${Date.now()}`,
            type: 'gate_change',
            message: `🚪 ${airlineName} flight ${flightNumber} to ${destination} will be boarding at ${gateInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low',
            details: {
              gate: flight.GateNumber,
              terminal: flight.Terminal
            }
          });
        }

        // Provjeri check-in open - samo za polaske SA PROCESSING STATUSOM
        if (isProcessing(flight.StatusEN) && flight.CheckInDesk && flight.CheckInDesk !== '-' && flight.CheckInDesk !== '') {
          const checkInInfo = formatCheckInDesks(flight.CheckInDesk);
          
          items.push({
            id: `${flightNumber}-checkin-${Date.now()}`,
            type: 'checkin_open',
            message: `🏷️ ${airlineName} flight ${flightNumber} to ${destination} check-in is now open at ${checkInInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low',
            details: {
              checkInDesks: flight.CheckInDesk
            }
          });
        }
      }

      // Za dolaske - samo arrived status (bez early ako nije stvarno sletio)
      if (isArrival && !statusLower.includes('earlier') && !statusLower.includes('ranije') && !statusLower.includes('prije vremena')) {
        if (statusLower.includes('arrived') || statusLower.includes('sletio') || statusLower.includes('landed')) {
          const baggageInfo = flight.BaggageReclaim && flight.BaggageReclaim !== '-' 
            ? ` Baggage will be available at belt ${flight.BaggageReclaim}.`
            : '';
          
          items.push({
            id: `${flightNumber}-arrived-${Date.now()}`,
            type: 'arrived',
            message: `🛬 ${airlineName} flight ${flightNumber} from ${origin} has arrived at the airport.${baggageInfo}`,
            flightNumber: flightNumber,
            airlineName: airlineName,
            airlineICAO: airlineICAO,
            severity: 'low'
          });
        }
      }
    });

    // Dodaj AI analizu ako je omogućena
    if (showAIAnalysis) {
      const aiAnalysisItems = generateAIAnalysis(allFlights);
      items.push(...aiAnalysisItems);
    }

    // Sortiraj po prioritetu (high -> medium -> low)
    const sortedItems = items.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.severity] - priority[a.severity];
    });

    // Ukloni duplikate - samo jednu poruku po letu i tipu
    const uniqueItems = sortedItems.filter((item, index, self) => 
      index === self.findIndex(t => 
        t.flightNumber === item.flightNumber && t.type === item.type
      )
    );

    setTickerItems(uniqueItems);
    setCurrentIndex(0);
  }, [arrivals, departures, showAIAnalysis]);

  // Rotiraj kroz ticker stavke
  useEffect(() => {
    if (tickerItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 6000); // Produženo na 6 sekundi zbog dužih poruka

    return () => clearInterval(interval);
  }, [tickerItems.length]);

  const getSeverityColor = (severity: TickerItem['severity']) => {
    switch (severity) {
      case 'high': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'medium': return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'low': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getSeverityBorder = (severity: TickerItem['severity']) => {
    switch (severity) {
      case 'high': return 'border-red-400';
      case 'medium': return 'border-orange-400';
      case 'low': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };

  const getLogoURL = (item: TickerItem): string => {
    if (item.type === 'ai_analysis') {
      return deepseekLogoURL;
    }
    return getFlightawareLogoURL(item.airlineICAO);
  };

  if (tickerItems.length === 0) {
    return (
      <div className={`bg-gray-800/90 backdrop-blur-sm border-t ${getSeverityBorder('low')} p-4 ${className}`}>
        <div className="text-center text-gray-300 text-xl font-medium">
          ✈️ All flights are operating normally - No alerts at this time
        </div>
      </div>
    );
  }

  const currentItem = tickerItems[currentIndex];
  const logoURL = getLogoURL(currentItem);

  return (
    <div className={`${getSeverityColor(currentItem.severity)} border-t ${getSeverityBorder(currentItem.severity)} p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Airline Logo */}
          <div className="flex-shrink-0">
            <div className={`w-16 h-12 rounded-lg p-1 shadow flex items-center justify-center ${
              currentItem.type === 'ai_analysis' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white'
            }`}>
              <img
                src={logoURL}
                alt={`${currentItem.airlineName} logo`}
                className="object-contain w-full h-full"
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Alert message */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0 text-2xl">
              {currentItem.type === 'delay' ? '⏱️' : 
               currentItem.type === 'cancellation' ? '❌' : 
               currentItem.type === 'early' ? '🔼' : 
               currentItem.type === 'boarding' ? '🎫' : 
               currentItem.type === 'final_call' ? '🚨' :
               currentItem.type === 'arrived' ? '🛬' : 
               currentItem.type === 'departed' ? '🛫' : 
               currentItem.type === 'gate_change' ? '🚪' : 
               currentItem.type === 'checkin_open' ? '🏷️' : 
               currentItem.type === 'ai_analysis' ? '🤖' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <span className="text-white font-bold text-xl leading-relaxed tracking-wide">
                {currentItem.message}
              </span>
              
              {/* Additional details */}
              {currentItem.details && (
                <div className="text-sm text-white/80 mt-2">
                  {currentItem.details.originalTime && currentItem.details.newTime && (
                    <span>Originally scheduled for {currentItem.details.originalTime}</span>
                  )}
                  {currentItem.details.analysis && (
                    <span>Analysis: {currentItem.details.analysis}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Counter and progress indicator */}
        {tickerItems.length > 1 && (
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              {tickerItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-white/70 font-medium bg-black/30 px-3 py-1 rounded-lg">
              {currentIndex + 1}/{tickerItems.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}