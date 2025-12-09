"use client";

import { 
  CheckCircle, 
  Clock, 
  Plane, 
  TreePine, 
  Star, 
  Snowflake, 
  Gift, 
  Bell, 
  AlertCircle, 
  Hourglass, 
  Eye, 
  CircleDot,
  Target,
  BarChart,
  Zap,
  Sparkles,
  Heart,
  Flame
} from 'lucide-react';
import Image from 'next/image';
import type { Flight } from '@/types/flight';

interface ChristmasInactiveScreenProps {
  deskNumberParam: string;
  nextFlight: Flight | null;
  lastUpdate: string;
  loading: boolean;
  isPortrait: boolean;
  displayFlight: Flight | null;
}

export default function ChristmasInactiveScreen({
  deskNumberParam,
  nextFlight,
  lastUpdate,
  loading,
  isPortrait,
  displayFlight
}: ChristmasInactiveScreenProps) {
  const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Wallpaper u pozadini */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={wallpaperSrc}
          alt="Airport Wallpaper"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        
        {/* Snejne pahulje sa SVG ikonicama */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/30 animate-snow"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                top: '-30px'
              }}
            >
              <Snowflake className="w-8 h-8" />
            </div>
          ))}
        </div>
        
        {/* Lampioni u ćoškovima */}
        <div className="absolute top-6 left-6 w-4 h-8 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-400/40"></div>
        <div className="absolute top-6 right-6 w-4 h-8 bg-red-300 rounded-full animate-pulse shadow-lg shadow-red-400/40 delay-500"></div>
        <div className="absolute bottom-6 left-6 w-4 h-8 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-400/40 delay-1000"></div>
        <div className="absolute bottom-6 right-6 w-4 h-8 bg-blue-300 rounded-full animate-pulse shadow-lg shadow-blue-400/40 delay-1500"></div>
      </div>
      
      {/* Sadržaj */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-yellow-400/40 shadow-2xl relative overflow-hidden ${
          isPortrait ? 'max-w-4xl' : 'max-w-6xl'
        } mx-auto`}>
          
          {/* Ukrasi na uglovima kartice */}
          <div className="absolute -top-3 -left-3 opacity-70 animate-bounce">
            <TreePine className="w-10 h-10 text-green-400" />
          </div>
          <div className="absolute -top-3 -right-3 opacity-70 animate-bounce delay-300">
            <Star className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="absolute -bottom-3 -left-3 opacity-70 animate-bounce delay-700">
            <Flame className="w-10 h-10 text-orange-400" /> {/* Umesto Candle */}
          </div>
          <div className="absolute -bottom-3 -right-3 opacity-70 animate-bounce delay-1000">
            <Snowflake className="w-10 h-10 text-blue-400" />
          </div>
          
          {/* CheckCircle ikonica sa novogodišnjim ukrasima */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-green-400 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Heart className="w-8 h-8 text-red-400" /> {/* Umesto 🎅 */}
            </div>
            <div className="absolute -bottom-2 -left-2 animate-bounce delay-500">
              <Gift className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="text-center mb-4">
            <div className={`font-bold text-white/80 mb-2 flex items-center justify-center gap-4 ${
              isPortrait ? 'text-[5rem]' : 'text-[3.5rem]'
            }`}>
              <TreePine className="w-12 h-12 text-green-400 opacity-80" />
              Check-in
              <Sparkles className="w-12 h-12 text-yellow-400 opacity-80" /> {/* Umesto ✨ */}
            </div>
            <div className={`font-black bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent leading-none drop-shadow-2xl ${
              isPortrait ? 'text-[18rem]' : 'text-[13rem]'
            }`}>
              {deskNumberParam}
            </div>
          </div>
          
          <div className={`text-white/90 mb-6 font-semibold ${
            isPortrait ? 'text-4xl' : 'text-3xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <Hourglass className="w-10 h-10 text-white" /> {/* Umesto ⏳ */}
              {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
              <Target className="w-10 h-10 text-white" /> {/* Umesto 🎯 */}
            </div>
          </div>

          {/* Prikaz sledećeg leta */}
          {nextFlight && (
            <div className={`mb-6 font-medium bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 py-4 px-8 rounded-2xl border border-yellow-400/50 shadow-lg ${
              isPortrait ? 'text-3xl' : 'text-2xl'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Gift className="w-8 h-8 text-yellow-400 animate-pulse" />
                <span className="text-orange-300 font-bold">Next Flight</span>
                <Plane className="w-8 h-8 text-blue-400 animate-pulse delay-300" />
              </div>
              <div className="text-white font-bold mb-1">
                {nextFlight.FlightNumber} → {nextFlight.DestinationCityName}
              </div>
              <div className="text-yellow-300 text-lg flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                {nextFlight.ScheduledDepartureTime}
              </div>
            </div>
          )}

          <div className={`text-white/80 mb-6 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            {displayFlight ? (
              <div className="flex items-center justify-center gap-3">
                <BarChart className="w-8 h-8 text-white" /> {/* Umesto 📊 */}
                <span>Status:</span>
                <span className="text-yellow-300 font-semibold">{displayFlight.StatusEN}</span>
                <TreePine className="w-8 h-8 text-green-400" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Eye className="w-8 h-8 text-white" /> {/* Umesto 👀 */}
                <span>Please check the main display</span>
                <Zap className="w-8 h-8 text-yellow-400 animate-pulse" /> {/* Umesto ✨ */}
              </div>
            )}
          </div>

          {/* Updated at tekst */}
          <div className={`text-white/70 mb-4 ${
            isPortrait ? 'text-xl' : 'text-lg'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6 text-white" />
              <span>Updated at:</span>
              <span className="text-cyan-300 font-mono">{lastUpdate || 'Never'}</span>
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Specijalna poruka */}
          <div className={`text-yellow-300 mb-6 font-semibold bg-gradient-to-r from-red-500/10 to-green-500/10 py-3 px-6 rounded-xl border border-yellow-400/30 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <Heart className="w-8 h-8 text-red-400 animate-bounce" /> {/* Umesto 🎅 */}
              <span>Season&apos;s Greetings!</span>
              <TreePine className="w-8 h-8 text-green-400 animate-bounce delay-500" />
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className={`text-white/60 mt-4 ${
              isPortrait ? 'text-lg' : 'text-base'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <span>Updating flight information...</span>
                <Snowflake className="w-6 h-6 animate-spin" /> {/* Umesto ❄️ */}
              </div>
            </div>
          )}

          {/* Dodatni elementi unutar kartice */}
          <div className="absolute top-4 left-4 text-sm text-yellow-300/60 rotate-12">Happy Holidays</div>
          <div className="absolute top-4 right-4 text-sm text-green-300/60 -rotate-12">2026</div>
        </div>
      </div>

      {/* Dodatni elementi izvan kartice */}
      <div className="absolute bottom-10 left-10 opacity-20 animate-pulse">
        <Gift className="w-16 h-16" />
      </div>
      <div className="absolute top-10 right-10 opacity-20 animate-pulse delay-1000">
        <Bell className="w-16 h-16" />
      </div>
      <div className="absolute top-1/4 left-10 opacity-15 animate-bounce delay-500">
        <Star className="w-14 h-14" />
      </div>
      <div className="absolute bottom-1/4 right-10 opacity-15 animate-bounce delay-700">
        <Star className="w-14 h-14" />
      </div>

      <style jsx global>{`
        @keyframes snow {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(calc(100vh + 30px)) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-snow {
          animation: snow linear infinite;
          animation-duration: 8s;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        /* Delay klase za animacije */
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .delay-1500 {
          animation-delay: 1500ms;
        }
      `}</style>
    </div>
  );
}