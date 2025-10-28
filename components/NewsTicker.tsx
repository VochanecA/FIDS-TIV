// components/NewsTicker.tsx
'use client';

import { useEffect, useState, useCallback, JSX } from 'react';
import type { Flight } from '@/types/flight';

interface NewsTickerProps {
  arrivals: Flight[];
  departures: Flight[];
  className?: string;
}

interface TickerItem {
  id: string;
  type: 'delay' | 'cancellation' | 'early' | 'boarding' | 'arrived' | 'departed' | 'gate_change' | 'checkin_open' | 'final_call' | 'ai_analysis' | 'scheduled' | 'gate_info';
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
    lastUpdated?: string;
  };
}

type SeverityType = 'low' | 'medium' | 'high';
type TickerItemType = TickerItem['type'];

// Flightaware logo URL generator
const getFlightawareLogoURL = (icaoCode: string): string => {
  if (!icaoCode || icaoCode.trim() === '') {
    return '/airlines/placeholder.jpg';
  }
  return `https://www.flightaware.com/images/airline_logos/180px/${icaoCode}.png`;
};

// DeepSeek AI logo
const DEEPSEEK_LOGO_URL = '/deepseek-logo-01.png';

// Base64 placeholder image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzQzQzU0Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTdCNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj5ObyBMb2dvPC90ZXh0Pgo8L3N2Zz4K';

export default function NewsTicker({ arrivals, departures, className = '' }: NewsTickerProps): JSX.Element {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showAIAnalysis, setShowAIAnalysis] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Format time function
  const formatTime = useCallback((timeString: string): string => {
    if (!timeString || timeString.trim() === '') {
      return '';
    }
    const cleanTime: string = timeString.replace(':', '');
    if (cleanTime.length === 4) {
      return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
    }
    return timeString;
  }, []);

  // Format terminal display
  const formatTerminal = useCallback((terminal?: string): string => {
    if (!terminal || terminal.trim() === '') {
      return '';
    }
    return terminal.replace('T0', '').replace('T', '');
  }, []);

  // Format check-in desks
  const formatCheckInDesks = useCallback((checkInDesk: string): string => {
    if (!checkInDesk || checkInDesk === '-' || checkInDesk.trim() === '') {
      return '';
    }
    
    if (checkInDesk.includes(',')) {
      const desks: string[] = checkInDesk.split(',').map((d: string) => d.trim());
      if (desks.length > 1) {
        return `counters ${desks.join(', ')}`;
      }
    }
    
    if (checkInDesk.includes('-')) {
      return `counters ${checkInDesk}`;
    }
    
    return `counter ${checkInDesk}`;
  }, []);

  // Get airline name or use default
  const getAirlineName = useCallback((flight: Flight): string => {
    return flight.AirlineName || 'The airline';
  }, []);

  // Get origin for arrivals
  const getOrigin = useCallback((flight: Flight, isArrival: boolean): string => {
    if (isArrival) {
      return flight.DestinationAirportName || flight.DestinationCityName || 'unknown origin';
    }
    return flight.DestinationCityName || flight.DestinationAirportName || 'unknown destination';
  }, []);

  // Check if flight is arrival
  const isArrivalFlight = useCallback((flight: Flight): boolean => {
    return arrivals.some((arrival: Flight) => arrival.FlightNumber === flight.FlightNumber);
  }, [arrivals]);

  // Enhanced image error handler
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.currentTarget as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.style.display = 'block';
  }, []);

  // Fetch AI Analysis from your chat API - POBOLJŠANA VERZIJA
  const fetchAIAnalysis = useCallback(async (): Promise<TickerItem[]> => {
    try {
      const baseUrl: string = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || 'https://fids-tiv.vercel.app'
        : 'http://localhost:3000';
      
      console.log('Fetching AI analysis from:', `${baseUrl}/api/ai/chat`);
      
      const response: Response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Provide a brief current flight analysis for the news ticker. Focus on key insights like delays, cancellations, and overall airport status. Keep it concise but informative.'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: { content: string } = await response.json();
      
      if (!data.content) {
        throw new Error('No content in AI response');
      }

      const analysisText: string = data.content;

      // Za AI analizu, koristimo cijeli tekst umjesto skraćivanja
      // AI će generirati koncizan odgovor zahvaljujući poboljšanom promptu
      const fullMessage: string = analysisText;

      return [{
        id: `ai-analysis-${Date.now()}`,
        type: 'ai_analysis',
        message: fullMessage,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'low',
        details: {
          analysis: 'Real-time airport intelligence',
          lastUpdated: new Date().toLocaleTimeString()
        }
      }];
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      
      // Fallback AI item kada API ne radi
      return [{
        id: `ai-fallback-${Date.now()}`,
        type: 'ai_analysis',
        message: 'Airport operations monitoring active. All systems normal with regular flight schedules.',
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'System AI',
        airlineICAO: 'SYS',
        severity: 'low',
        details: {
          analysis: 'Basic monitoring mode',
          lastUpdated: new Date().toLocaleTimeString()
        }
      }];
    }
  }, []);

  // Enhanced AI Analysis function - uses real-time data
  const generateAIAnalysis = useCallback(async (allFlights: Flight[]): Promise<TickerItem[]> => {
    const aiItems: TickerItem[] = [];
    
    // Basic analysis
    const delayedFlights: Flight[] = allFlights.filter((flight: Flight) => {
      const statusLower: string = flight.StatusEN?.toLowerCase() || '';
      return statusLower.includes('delay') || statusLower.includes('kasni');
    });
    
    const cancelledFlights: Flight[] = allFlights.filter((flight: Flight) => {
      const statusLower: string = flight.StatusEN?.toLowerCase() || '';
      return statusLower.includes('cancelled') || statusLower.includes('otkazan');
    });
    
    const boardingFlights: Flight[] = allFlights.filter((flight: Flight) => {
      const statusLower: string = flight.StatusEN?.toLowerCase() || '';
      return statusLower.includes('boarding') || statusLower.includes('gate open');
    });

    // Add basic AI items - BEZ EMOJI U PORUKAMA (emoji će biti dodani u prikazu)
    if (delayedFlights.length > 2) {
      aiItems.push({
        id: `ai-multiple-delays-${Date.now()}`,
        type: 'ai_analysis',
        message: `Traffic Alert: ${delayedFlights.length} flights experiencing delays across the airport`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'medium',
        details: {
          analysis: `${delayedFlights.length} delayed flights detected`
        }
      });
    }

    if (cancelledFlights.length > 0) {
      aiItems.push({
        id: `ai-cancellations-${Date.now()}`,
        type: 'ai_analysis',
        message: `Disruption: ${cancelledFlights.length} flight(s) cancelled - check with your airline`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'high',
        details: {
          analysis: `${cancelledFlights.length} flight cancellations`
        }
      });
    }

    if (boardingFlights.length > 0) {
      aiItems.push({
        id: `ai-boarding-${Date.now()}`,
        type: 'ai_analysis',
        message: `Active Boarding: ${boardingFlights.length} flight(s) currently boarding`,
        flightNumber: 'AI-ANALYSIS',
        airlineName: 'DeepSeek AI',
        airlineICAO: 'DSAI',
        severity: 'low',
        details: {
          analysis: `${boardingFlights.length} flights in boarding process`
        }
      });
    }

    // Add advanced AI analysis from chat API
    if (showAIAnalysis) {
      try {
        const chatAIAnalysis: TickerItem[] = await fetchAIAnalysis();
        aiItems.push(...chatAIAnalysis);
      } catch (error) {
        console.error('Advanced AI analysis failed, using basic analysis');
      }
    }

    return aiItems;
  }, [fetchAIAnalysis, showAIAnalysis]);

  // Remove duplicate flights caused by expandFlightForMultipleGates - KONAČNA VERZIJA
  const removeDuplicateFlights = useCallback((flights: Flight[]): Flight[] => {
    const flightMap = new Map<string, Flight>();
    
    flights.forEach((flight: Flight) => {
      // Kreiraj jedinstveni ključ koji IGNORIŠE gate i check-in desk
      // Ovo će ukloniti duplikate nastale zbog expandFlightForMultipleGates
      const flightKey = `${flight.FlightNumber}-${flight.AirlineName}-${flight.DestinationAirportName}-${flight.ScheduledDepartureTime}-${flight.FlightType}`;
      
      // Ako let već postoji, zadrži originalni (prvi) let
      if (!flightMap.has(flightKey)) {
        flightMap.set(flightKey, flight);
      }
    });
    
    const uniqueFlights = Array.from(flightMap.values());
    console.log(`Removed duplicates: ${flights.length} -> ${uniqueFlights.length} flights`);
    
    return uniqueFlights;
  }, []);

  // Generate flight items - POBOLJŠANA VERZIJA KOJA PRIKAZUJE SVE LETOVE
  const generateFlightItems = useCallback((allFlights: Flight[]): TickerItem[] => {
    const items: TickerItem[] = [];
    
    // Prvo ukloni duplikate letova
    const uniqueFlights: Flight[] = removeDuplicateFlights(allFlights);

    uniqueFlights.forEach((flight: Flight) => {
      const statusLower: string = flight.StatusEN?.toLowerCase() || '';
      const flightNumber: string = flight.FlightNumber;
      const airlineName: string = getAirlineName(flight);
      const airlineICAO: string = flight.AirlineICAO || '';
      const isArrival: boolean = isArrivalFlight(flight);
      const origin: string = getOrigin(flight, true);
      const destination: string = getOrigin(flight, false);
      const scheduledTime: string = formatTime(flight.ScheduledDepartureTime);
      const estimatedTime: string = formatTime(flight.EstimatedDepartureTime);

      // 1. Delays - only for departures
      if (!isArrival && (statusLower.includes('delay') || statusLower.includes('kasni'))) {
        items.push({
          id: `${flightNumber}-delay-${Date.now()}`,
          type: 'delay',
          message: `${airlineName} flight ${flightNumber} to ${destination} delayed. New time: ${estimatedTime}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'medium',
          details: {
            originalTime: scheduledTime,
            newTime: estimatedTime
          }
        });
      }

      // 2. Cancellations
      if (statusLower.includes('cancelled') || statusLower.includes('otkazan')) {
        const flightType: string = isArrival ? 'from' : 'to';
        const location: string = isArrival ? origin : destination;
        
        items.push({
          id: `${flightNumber}-cancelled-${Date.now()}`,
          type: 'cancellation',
          message: `${airlineName} flight ${flightNumber} ${flightType} ${location} CANCELLED`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'high'
        });
      }

      // 3. Boarding
      if (!isArrival && (statusLower.includes('boarding') || statusLower.includes('gate open')) && !statusLower.includes('final')) {
        const terminal: string = formatTerminal(flight.Terminal);
        const gateInfo: string = flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA' 
          ? `Gate ${flight.GateNumber}${terminal ? ` (T${terminal})` : ''}`
          : 'the gate';
        
        items.push({
          id: `${flightNumber}-boarding-${Date.now()}`,
          type: 'boarding',
          message: `NOW BOARDING: ${airlineName} ${flightNumber} to ${destination} at ${gateInfo}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'low',
          details: {
            gate: flight.GateNumber,
            terminal: flight.Terminal
          }
        });
      }

      // 4. Final call
      if (!isArrival && (statusLower.includes('final call') || statusLower.includes('last call'))) {
        const terminal: string = formatTerminal(flight.Terminal);
        const gateInfo: string = flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA' 
          ? `Gate ${flight.GateNumber}${terminal ? ` (T${terminal})` : ''}`
          : 'the gate';
        
        items.push({
          id: `${flightNumber}-final-call-${Date.now()}`,
          type: 'final_call',
          message: `FINAL CALL: ${airlineName} ${flightNumber} to ${destination} closing at ${gateInfo}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'high',
          details: {
            gate: flight.GateNumber,
            terminal: flight.Terminal
          }
        });
      }

      // 5. Arrivals
      if (isArrival && (statusLower.includes('arrived') || statusLower.includes('sletio') || statusLower.includes('landed'))) {
        const baggageInfo: string = flight.BaggageReclaim && flight.BaggageReclaim !== '-' 
          ? ` • Baggage belt ${flight.BaggageReclaim}`
          : '';
        
        items.push({
          id: `${flightNumber}-arrived-${Date.now()}`,
          type: 'arrived',
          message: `${airlineName} ${flightNumber} from ${origin} has arrived${baggageInfo}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'low'
        });
      }

      // 6. Departures
      if (!isArrival && (statusLower.includes('departed') || statusLower.includes('poletio') || statusLower.includes('took off'))) {
        items.push({
          id: `${flightNumber}-departed-${Date.now()}`,
          type: 'departed',
          message: `${airlineName} ${flightNumber} to ${destination} has departed`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'low'
        });
      }

      // 7. Gate information for scheduled flights
      if (!isArrival && flight.GateNumber && flight.GateNumber !== '-' && flight.GateNumber !== 'TBA') {
        const terminal: string = formatTerminal(flight.Terminal);
        const gateInfo: string = `Gate ${flight.GateNumber}${terminal ? ` (T${terminal})` : ''}`;
        
        items.push({
          id: `${flightNumber}-gate-${Date.now()}`,
          type: 'gate_info',
          message: `${airlineName} ${flightNumber} to ${destination} scheduled for ${scheduledTime} at ${gateInfo}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'low',
          details: {
            gate: flight.GateNumber,
            terminal: flight.Terminal
          }
        });
      }

      // 8. General scheduled flights (fallback)
      if (items.length === 0 || !items.some(item => item.flightNumber === flightNumber)) {
        const flightType: string = isArrival ? 'from' : 'to';
        const location: string = isArrival ? origin : destination;
        
        items.push({
          id: `${flightNumber}-scheduled-${Date.now()}`,
          type: 'scheduled',
          message: `${airlineName} ${flightNumber} ${flightType} ${location} scheduled for ${scheduledTime}`,
          flightNumber,
          airlineName,
          airlineICAO,
          severity: 'low',
          details: {
            originalTime: scheduledTime
          }
        });
      }
    });

    console.log(`Generated ${items.length} ticker items from ${uniqueFlights.length} unique flights`);
    return items;
  }, [formatTime, formatTerminal, getAirlineName, getOrigin, isArrivalFlight, removeDuplicateFlights]);

  // Improved interleave function - osigurava da AI analiza bude između svaka 2 leta
  const interleaveItems = useCallback((flightItems: TickerItem[], aiItems: TickerItem[]): TickerItem[] => {
    const result: TickerItem[] = [];
    
    // Ako nema AI stavki, vrati samo flight stavke
    if (aiItems.length === 0) {
      return flightItems;
    }

    // Koristimo prvu AI stavku za interleave
    const mainAIAnalysis = {...aiItems[0]};

    let flightIndex = 0;
    let itemsSinceLastAI = 0;
    
    // Dodaj flight stavke sa AI analizom između svaka 2 leta
    while (flightIndex < flightItems.length) {
      // Dodaj flight stavku
      result.push(flightItems[flightIndex++]);
      itemsSinceLastAI++;

      // Nakon svaka 2 leta, dodaj AI analizu
      if (itemsSinceLastAI >= 2 && flightIndex < flightItems.length) {
        result.push({
          ...mainAIAnalysis,
          id: `ai-analysis-${Date.now()}-${flightIndex}`
        });
        itemsSinceLastAI = 0;
      }
    }

    // Dodaj AI analizu na kraju ako je potrebno
    if (itemsSinceLastAI > 0) {
      result.push({
        ...mainAIAnalysis,
        id: `ai-analysis-${Date.now()}-end`
      });
    }

    return result;
  }, []);

  // Analyze flights and generate ticker items
  useEffect(() => {
    const analyzeFlights = async (): Promise<void> => {
      setIsLoading(true);
      
      try {
        const allFlights: Flight[] = [...arrivals, ...departures];
        console.log('=== FLIGHT DATA ANALYSIS ===');
        console.log(`Raw data - Arrivals: ${arrivals.length}, Departures: ${departures.length}, Total: ${allFlights.length}`);
        
        const flightItems: TickerItem[] = generateFlightItems(allFlights);
        const aiAnalysisItems: TickerItem[] = await generateAIAnalysis(allFlights);
        
        // Interleave AI analysis between every 2 flight items
        const interleavedItems: TickerItem[] = interleaveItems(flightItems, aiAnalysisItems);
        console.log(`Final result: ${interleavedItems.length} ticker items (${flightItems.length} flights + AI analysis)`);
        console.log('=== END ANALYSIS ===');

        setTickerItems(interleavedItems);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error analyzing flights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeFlights();
  }, [
    arrivals, 
    departures, 
    showAIAnalysis, 
    generateFlightItems, 
    generateAIAnalysis,
    interleaveItems
  ]);

  // Rotate through ticker items - PRODUŽENO VRIJEME ZBOG AI ANALIZE
  useEffect(() => {
    if (tickerItems.length <= 1 || isLoading) {
      return;
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % tickerItems.length);
    }, 16000); // 16 sekundi za sve stavke (duže za AI)

    return (): void => clearInterval(interval);
  }, [tickerItems.length, isLoading]);

  const getSeverityColor = useCallback((severity: SeverityType): string => {
    switch (severity) {
      case 'high': 
        return 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse';
      case 'medium': 
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'low': 
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default: 
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  }, []);

  const getSeverityBorder = useCallback((severity: SeverityType): string => {
    switch (severity) {
      case 'high': 
        return 'border-red-400 border-2';
      case 'medium': 
        return 'border-orange-400';
      case 'low': 
        return 'border-blue-400';
      default: 
        return 'border-gray-400';
    }
  }, []);

  const getLogoURL = useCallback((item: TickerItem): string => {
    if (item.type === 'ai_analysis') {
      return DEEPSEEK_LOGO_URL;
    }
    return getFlightawareLogoURL(item.airlineICAO);
  }, []);

  const getEmoji = useCallback((type: TickerItemType): string => {
    const emojiMap: Record<TickerItemType, string> = {
      delay: '⏱️',
      cancellation: '❌',
      early: '🔼',
      boarding: '🎫',
      final_call: '🚨',
      arrived: '🛬',
      departed: '🛫',
      gate_change: '🚪',
      checkin_open: '🏷️',
      ai_analysis: '🤖',
      scheduled: '🕒',
      gate_info: '🚪'
    };
    
    return emojiMap[type] || 'ℹ️';
  }, []);

  // Format message with emoji - samo jedan emoji na početku
  const formatMessageWithEmoji = useCallback((item: TickerItem): string => {
    const emoji: string = getEmoji(item.type);
    return `${emoji} ${item.message}`;
  }, [getEmoji]);

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-blue-600 border-t border-blue-400 p-4 ${className}`}>
        <div className="text-center text-white text-2xl font-medium">
          🔄 Loading flight information...
        </div>
      </div>
    );
  }

  if (tickerItems.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-green-500 to-emerald-600 border-t border-green-400 p-4 ${className}`}>
        <div className="text-center text-white text-2xl font-medium">
          ✅ All flights operating normally - No alerts at this time
        </div>
      </div>
    );
  }

  const currentItem: TickerItem = tickerItems[currentIndex];
  const logoURL: string = getLogoURL(currentItem);
  const formattedMessage: string = formatMessageWithEmoji(currentItem);

  return (
    <div className={`${getSeverityColor(currentItem.severity)} border-t ${getSeverityBorder(currentItem.severity)} p-4 shadow-2xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className={`w-16 h-12 rounded-lg p-1 shadow-lg flex items-center justify-center ${
              currentItem.type === 'ai_analysis' 
                ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                : 'bg-white'
            }`}>
              <img
                src={logoURL}
                alt={`${currentItem.airlineName} logo`}
                className="object-contain w-full h-full rounded"
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Message - POBOLJŠANI PRIKAZ ZBOG AI ANALIZE */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              {/* AI analiza dobija poseban stil sa više redova */}
              {currentItem.type === 'ai_analysis' ? (
                <div className="space-y-1">
                  <div className="text-white font-bold text-xl leading-tight tracking-wide">
                    {formattedMessage}
                  </div>
                  {/* Dodatni red za timestamp ako je potrebno */}
                  {currentItem.details?.lastUpdated && (
                    <div className="text-sm text-white/70">
                      Updated: {currentItem.details.lastUpdated}
                    </div>
                  )}
                </div>
              ) : (
                // Standardni prikaz za ostale letove
                <div className="text-white font-bold text-xl leading-tight tracking-wide truncate">
                  {formattedMessage}
                </div>
              )}
              
              {/* Details - samo za non-AI stavke */}
              {currentItem.details && currentItem.type !== 'ai_analysis' && (
                <div className="text-sm text-white/80 mt-1 flex flex-wrap gap-2">
                  {currentItem.details.originalTime && currentItem.details.newTime && (
                    <span>Original: {currentItem.details.originalTime}</span>
                  )}
                  {currentItem.details.gate && (
                    <span>Gate: {currentItem.details.gate}</span>
                  )}
                  {currentItem.details.lastUpdated && (
                    <span>Updated: {currentItem.details.lastUpdated}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {tickerItems.length > 1 && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex space-x-1">
              {tickerItems.map((_: TickerItem, index: number) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-white/70 font-medium bg-black/30 px-2 py-1 rounded">
              {currentIndex + 1}/{tickerItems.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}