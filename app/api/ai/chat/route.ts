// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { Flight } from '@/types/flight';

// Define interfaces for type safety
interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Global cache za AI analizu
let cachedAIAnalysis: {
  analysis: string;
  timestamp: number;
} | null = null;

const ANALYSIS_CACHE_DURATION = 60 * 60 * 1000; // 60 minuta

/**
 * Dohvati real-time flight data direktno iz flights API-ja
 */
async function getRealTimeFlightData(): Promise<{ arrivals: Flight[]; departures: Flight[] }> {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://fids-tiv.vercel.app'
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/flights`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const flightData = await response.json();
    return {
      arrivals: flightData.arrivals || [],
      departures: flightData.departures || []
    };
  } catch (error) {
    console.error('Error fetching real-time flight data:', error);
    return { arrivals: [], departures: [] };
  }
}

/**
 * Osnovna analiza flight data (fallback kada AI ne radi)
 */
function performBasicAnalysis(flightData: { arrivals: Flight[]; departures: Flight[] }): string {
  try {
    const { arrivals, departures } = flightData;
    const allFlights: Flight[] = [...arrivals, ...departures];

    if (allFlights.length === 0) {
      return "🚫 **Trenutno stanje:** Nema dostupnih podataka o letovima. Sistem će se uskoro oporaviti.";
    }

    const delayedFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('delay') || 
      flight.StatusEN?.toLowerCase().includes('kasni')
    );

    const cancelledFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('cancelled') || 
      flight.StatusEN?.toLowerCase().includes('otkazan')
    );

    const boardingFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('boarding') || 
      flight.StatusEN?.toLowerCase().includes('gate open')
    );

    const arrivedFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('arrived') || 
      flight.StatusEN?.toLowerCase().includes('sletio')
    );

    const departedFlights = allFlights.filter(flight => 
      flight.StatusEN?.toLowerCase().includes('departed') || 
      flight.StatusEN?.toLowerCase().includes('poletio')
    );

    const onTimePercentage = allFlights.length > 0 
      ? Math.round(((allFlights.length - delayedFlights.length - cancelledFlights.length) / allFlights.length) * 100)
      : 0;

    // Generiraj detailed analizu
    let analysis = `🤖 **ANALIZA STANJA AERODROMA**\n\n`;

    if (delayedFlights.length > 0) {
      analysis += `⚠️ **Kašnjenja:** ${delayedFlights.length} letova kasni\n`;
    }

    if (cancelledFlights.length > 0) {
      analysis += `❌ **Otkazivanja:** ${cancelledFlights.length} letova otkazano\n`;
    }

    if (boardingFlights.length > 0) {
      analysis += `🎫 **Boardingu:** ${boardingFlights.length} letova u procesu ukrcaja\n`;
    }

    analysis += `\n📊 *Statistika:*\n`;
    analysis += `• Ukupno danas: ${allFlights.length}\n`;
    analysis += `• Polazaka: ${departures.length}\n`;
    analysis += `• Dolazaka: ${arrivals.length}\n`;
    analysis += `• Tačnost: ${onTimePercentage}% letova po rasporedu\n\n`;

    analysis += `🕒 **Preporuke:**\n`;
    
    if (delayedFlights.length > 3) {
      analysis += `• Putnici sa letovima koji kasne - kontaktirajte avio-kompaniju\n`;
    }
    
    if (boardingFlights.length > 0) {
      analysis += `• Putnici na ukrcaju - prijavite se na izlaz\n`;
    }

    analysis += `\n_Osnovna analiza • Ažurirano: ${new Date().toLocaleTimeString()}_`;

    return analysis;

  } catch (error) {
    console.error('Basic analysis error:', error);
    return "🤖 **Informacija:** Trenutno analiziram podatke o letovima. Stanje aerodroma je normalno.";
  }
}

/**
 * Glavna analiza flight data sa caching-om
 */
async function analyzeFlightDataWithAI(): Promise<string> {
  // Proveri cache
  const now = Date.now();
  if (cachedAIAnalysis && (now - cachedAIAnalysis.timestamp) < ANALYSIS_CACHE_DURATION) {
    return cachedAIAnalysis.analysis;
  }

  try {
    // Dohvati real-time podatke
    const flightData = await getRealTimeFlightData();
    
    // Prvo probaj sa AI analizom
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const aiAnalysis = await performDeepSeekAnalysis(flightData);
        
        // Update cache
        cachedAIAnalysis = {
          analysis: aiAnalysis,
          timestamp: now
        };

        return aiAnalysis;
      } catch (aiError) {
        console.error('AI analysis failed, using basic analysis:', aiError);
        // Fallback na osnovnu analizu
      }
    }

    // Koristi osnovnu analizu kao fallback
    const basicAnalysis = performBasicAnalysis(flightData);
    
    // Update cache sa osnovnom analizom
    cachedAIAnalysis = {
      analysis: basicAnalysis,
      timestamp: now
    };

    return basicAnalysis;

  } catch (error) {
    console.error('Flight data analysis error:', error);
    return "🤖 **Informacija:** Sistem analize je privremeno nedostupan. Stanje aerodroma je normalno.";
  }
}

/**
 * Formatiraj vrijeme za prikaz
 */
function formatTime(timeString: string): string {
  if (!timeString || timeString.trim() === '') return '';
  const cleanTime = timeString.replace(':', '');
  if (cleanTime.length === 4) {
    return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
  }
  return timeString;
}

/**
 * DeepSeek AI analiza sa kompletnim podacima o letovima
 */
async function performDeepSeekAnalysis(flightData: { arrivals: Flight[]; departures: Flight[] }): Promise<string> {
  try {
    const { arrivals, departures } = flightData;
    const allFlights = [...arrivals, ...departures];

    if (allFlights.length === 0) {
      return performBasicAnalysis(flightData);
    }

    // Detaljna analiza letova
    const delayedFlights = allFlights.filter(f => 
      f.StatusEN?.toLowerCase().includes('delay') || f.StatusEN?.toLowerCase().includes('kasni')
    );
    
    const cancelledFlights = allFlights.filter(f => 
      f.StatusEN?.toLowerCase().includes('cancelled') || f.StatusEN?.toLowerCase().includes('otkazan')
    );
    
    const boardingFlights = allFlights.filter(f => 
      f.StatusEN?.toLowerCase().includes('boarding') || f.StatusEN?.toLowerCase().includes('gate open')
    );

    const arrivedFlights = allFlights.filter(f => 
      f.StatusEN?.toLowerCase().includes('arrived') || f.StatusEN?.toLowerCase().includes('sletio')
    );

    const departedFlights = allFlights.filter(f => 
      f.StatusEN?.toLowerCase().includes('departed') || f.StatusEN?.toLowerCase().includes('poletio')
    );

    // Analiza po destinacijama
    const destinationStats: Record<string, number> = {};
    departures.forEach(flight => {
      const destination = flight.DestinationAirportName || flight.DestinationCityName || 'Unknown';
      destinationStats[destination] = (destinationStats[destination] || 0) + 1;
    });

    // Pronađi top 2 destinacije
    const topDestinations = Object.entries(destinationStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([name, count]) => `${name} (${count} flights)`);

    // Analiza po avio kompanijama
    const airlineStats: Record<string, number> = {};
    allFlights.forEach(flight => {
      const airline = flight.AirlineName || 'Unknown';
      airlineStats[airline] = (airlineStats[airline] || 0) + 1;
    });

    const topAirlines = Object.entries(airlineStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`);

    // Kreiraj detaljan pregled aktivnih letova
    const activeDepartures = departures.filter(f => 
      !f.StatusEN?.toLowerCase().includes('departed') && 
      !f.StatusEN?.toLowerCase().includes('arrived') &&
      !f.StatusEN?.toLowerCase().includes('cancelled')
    );

    const recentArrivals = arrivals.filter(f => 
      f.StatusEN?.toLowerCase().includes('arrived') || 
      f.StatusEN?.toLowerCase().includes('sletio')
    ).slice(0, 5); // Zadnjih 5 dolazaka

    const recentDepartures = departures.filter(f => 
      f.StatusEN?.toLowerCase().includes('departed') || 
      f.StatusEN?.toLowerCase().includes('poletio')
    ).slice(0, 5); // Zadnjih 5 polazaka

    // Kreiraj prompt za DeepSeek AI
    const systemPrompt = `Ti si ekspert za analizu aerodromskih operacija. Analiziraj sve dostupne podatke o letovima i pruži kratak, informativan pregled stanja aerodroma.Ne prikazuj, u odgovoru,tekst AIRPORT STATUS OVERVIEW** i  **Recent activity** 

KLJUČNE SMJERNICE:
- Budi koncizan (maksimalno 2-3 rečenice)
- Fokusiraj se na najvažnije informacije za putnike
- Ne Koristi emoji
- Na engleskom jeziku
- Ne spominji ukupan broj letova eksplicitno
- Istakni ključne destinacije i stanje operacija
- Uključi informacije o nedavno sletjelim i poletjelim letovima

Analiziraj sve letove - uključujući one koji su već sletjeli ili poletjeli.`;

    const userPrompt = `**KOMPLETNA ANALIZA AERODROMA**

TRENUTNE OPERACIJE:
- Polazni letovi u toku: ${activeDepartures.length}
- Letovi u kašnjenju: ${delayedFlights.length}
- Otkazani letovi: ${cancelledFlights.length}
- Letovi u boarding procesu: ${boardingFlights.length}

DESTINACIJE:
${topDestinations.length > 0 ? `Vodeće destinacije: ${topDestinations.join(', ')}` : 'Nema podataka o destinacijama'}

AVIO-KOMPANIJE:
${topAirlines.length > 0 ? `Najaktivnije kompanije: ${topAirlines.join(', ')}` : 'Nema podataka o kompanijama'}

NEDAVNO ZAVRŠENE OPERACIJE:
- Nedavno sletjeli letovi: ${recentArrivals.length}
- Nedavno poletjeli letovi: ${recentDepartures.length}

${
  recentArrivals.length > 0 ? 
  `Zadnji dolasci: ${recentArrivals.map(f => `${f.AirlineName} ${f.FlightNumber} iz ${f.DestinationCityName}`).join(', ')}` : 
  ''
}

${
  recentDepartures.length > 0 ? 
  `Zadnji polasci: ${recentDepartures.map(f => `${f.AirlineName} ${f.FlightNumber} za ${f.DestinationCityName}`).join(', ')}` : 
  ''
}

Pruži kratak, informativan pregled stanja aerodroma sa fokusom na putničko iskustvo:`;

    console.log('Sending to AI:', {
      activeDepartures: activeDepartures.length,
      delayed: delayedFlights.length,
      cancelled: cancelledFlights.length,
      boarding: boardingFlights.length,
      recentArrivals: recentArrivals.length,
      recentDepartures: recentDepartures.length,
      topDestinations,
      topAirlines
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://fids-tiv.vercel.app',
        'X-Title': 'Flight Analysis AI',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || performBasicAnalysis(flightData);
    
    return `🤖 AI * \n\n${aiResponse}\n\n• Analyzed at: ${new Date().toLocaleTimeString()}`;

  } catch (error) {
    console.error('DeepSeek analysis error:', error);
    throw error;
  }
}

/**
 * POST handler for AI chat endpoint
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body: ChatRequest = await req.json();
    const { messages, model, temperature, maxTokens } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    // Check if user is asking about flight status
    const userMessage = lastUserMessage?.content.toLowerCase() || '';
    const isFlightQuery = userMessage.includes('flight') || 
                         userMessage.includes('let') || 
                         userMessage.includes('status') || 
                         userMessage.includes('delay') || 
                         userMessage.includes('cancelled') ||
                         userMessage.includes('airport') ||
                         userMessage.includes('aerodrom') ||
                         userMessage.includes('analiza') ||
                         userMessage.includes('analysis');

    if (isFlightQuery) {
      // Analyze flight data with AI fallback
      const flightAnalysis = await analyzeFlightDataWithAI();
      
      return NextResponse.json({
        content: flightAnalysis,
      });
    }

    // For non-flight related queries, use OpenRouter API
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    // Call OpenRouter API for general queries
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://fids-tiv.vercel.app',
        'X-Title': 'AI Service',
      },
      body: JSON.stringify({
        model: model || 'deepseek/deepseek-chat',
        messages,
        max_tokens: maxTokens || 1000,
        temperature: temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI service error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      content: data.choices[0]?.message?.content || 'No response generated',
      usage: data.usage || null,
    });
  } catch (error) {
    console.error('API /api/ai/chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}