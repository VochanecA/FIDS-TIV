"use client";

import Image from 'next/image';
import type { Flight } from '@/types/flight';

// Inline SVG komponente za SVE ikonice
const TreeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L4 14h3l-2 6h14l-2-6h3L12 2z"/>
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const SnowflakeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 7l-5 5-5-5M17 17l-5-5-5 5M2 12h20M7 7l5 5 5-5M7 17l5-5 5 5"/>
  </svg>
);

const GiftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="12" rx="1"/>
    <path d="M12 8v12M3 12h18"/>
    <path d="M8 8V6a2 2 0 012-2h0a2 2 0 012 2v2"/>
    <path d="M14 8V6a2 2 0 012-2h0a2 2 0 012 2v2"/>
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const FlameIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2s-4 4.5-4 8c0 3.5 2 6 4 6s4-2.5 4-6c0-3.5-4-8-4-8z"/>
    <path d="M12 16c-1 0-2-1-2-2.5S11 11 12 11s2 1.5 2 3.5-1 2.5-2 2.5z" opacity="0.5"/>
  </svg>
);

const HourglassIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 2h14M5 22h14M6 6l6 6-6 6M18 6l-6 6 6 6"/>
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18M7 16V9M12 16V6M17 16v-3"/>
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM18 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
  </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"/>
  </svg>
);

// Ovo su ikonice koje trebate da kreirate (umesto lucide)
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <path d="M22 4L12 14.01l-3-3"/>
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const PlaneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 1 1-3v-3l6.5-5.9c.3-.3.8-.5 1.3-.3l.5.2c.4.3.6.7.5 1.2L16 11"/>
  </svg>
);

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
        
        {/* Snejne pahulje */}
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
              <SnowflakeIcon className="w-8 h-8" />
            </div>
          ))}
        </div>
        
        {/* Lampioni */}
        <div className="absolute top-6 left-6 w-4 h-8 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-400/40"></div>
        <div className="absolute top-6 right-6 w-4 h-8 bg-red-300 rounded-full animate-pulse shadow-lg shadow-red-400/40 delay-500"></div>
        <div className="absolute bottom-6 left-6 w-4 h-8 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-400/40 delay-1000"></div>
        <div className="absolute bottom-6 right-6 w-4 h-8 bg-blue-300 rounded-full animate-pulse shadow-lg shadow-blue-400/40 delay-1500"></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-yellow-400/40 shadow-2xl relative overflow-hidden ${
          isPortrait ? 'max-w-4xl' : 'max-w-6xl'
        } mx-auto`}>
          
          {/* Ukrasi na uglovima */}
          <div className="absolute -top-3 -left-3 opacity-70 animate-bounce">
            <TreeIcon className="w-10 h-10 text-green-400" />
          </div>
          <div className="absolute -top-3 -right-3 opacity-70 animate-bounce delay-300">
            <StarIcon className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="absolute -bottom-3 -left-3 opacity-70 animate-bounce delay-700">
            <FlameIcon className="w-10 h-10 text-orange-400" />
          </div>
          <div className="absolute -bottom-3 -right-3 opacity-70 animate-bounce delay-1000">
            <SnowflakeIcon className="w-10 h-10 text-blue-400" />
          </div>
          
          {/* Glavna ikonica */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-green-400 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
              <CheckCircleIcon className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <HeartIcon className="w-8 h-8 text-red-400" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-bounce delay-500">
              <GiftIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="text-center mb-4">
            <div className={`font-bold text-white/80 mb-2 flex items-center justify-center gap-4 ${
              isPortrait ? 'text-[5rem]' : 'text-[3.5rem]'
            }`}>
              <TreeIcon className="w-12 h-12 text-green-400 opacity-80" />
              Check-in
              <SparklesIcon className="w-12 h-12 text-yellow-400 opacity-80" />
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
              <HourglassIcon className="w-10 h-10 text-white" />
              {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
              <TargetIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          {nextFlight && (
            <div className={`mb-6 font-medium bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 py-4 px-8 rounded-2xl border border-yellow-400/50 shadow-lg ${
              isPortrait ? 'text-3xl' : 'text-2xl'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <GiftIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
                <span className="text-orange-300 font-bold">Next Flight</span>
                <PlaneIcon className="w-8 h-8 text-blue-400 animate-pulse delay-300" />
              </div>
              <div className="text-white font-bold mb-1">
                {nextFlight.FlightNumber} → {nextFlight.DestinationCityName}
              </div>
              <div className="text-yellow-300 text-lg flex items-center justify-center gap-2">
                <ClockIcon className="w-6 h-6" />
                {nextFlight.ScheduledDepartureTime}
              </div>
            </div>
          )}

          <div className={`text-white/80 mb-6 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            {displayFlight ? (
              <div className="flex items-center justify-center gap-3">
                <ChartIcon className="w-8 h-8 text-white" />
                <span>Status:</span>
                <span className="text-yellow-300 font-semibold">{displayFlight.StatusEN}</span>
                <TreeIcon className="w-8 h-8 text-green-400" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <EyeIcon className="w-8 h-8 text-white" />
                <span>Please check the main display</span>
                <ZapIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>

          <div className={`text-white/70 mb-4 ${
            isPortrait ? 'text-xl' : 'text-lg'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <ClockIcon className="w-6 h-6 text-white" />
              <span>Updated at:</span>
              <span className="text-cyan-300 font-mono">{lastUpdate || 'Never'}</span>
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className={`text-yellow-300 mb-6 font-semibold bg-gradient-to-r from-red-500/10 to-green-500/10 py-3 px-6 rounded-xl border border-yellow-400/30 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <HeartIcon className="w-8 h-8 text-red-400 animate-bounce" />
              <span>Season&apos;s Greetings!</span>
              <TreeIcon className="w-8 h-8 text-green-400 animate-bounce delay-500" />
            </div>
          </div>

          {loading && (
            <div className={`text-white/60 mt-4 ${
              isPortrait ? 'text-lg' : 'text-base'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <span>Updating flight information...</span>
                <SnowflakeIcon className="w-6 h-6 animate-spin" />
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 text-sm text-yellow-300/60 rotate-12">Happy Holidays</div>
          <div className="absolute top-4 right-4 text-sm text-green-300/60 -rotate-12">2026</div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 opacity-20 animate-pulse">
        <GiftIcon className="w-16 h-16 text-white" />
      </div>
      <div className="absolute top-10 right-10 opacity-20 animate-pulse delay-1000">
        <BellIcon className="w-16 h-16 text-white" />
      </div>
      <div className="absolute top-1/4 left-10 opacity-15 animate-bounce delay-500">
        <StarIcon className="w-14 h-14 text-white" />
      </div>
      <div className="absolute bottom-1/4 right-10 opacity-15 animate-bounce delay-700">
        <StarIcon className="w-14 h-14 text-white" />
      </div>

      <style jsx global>{`
        @keyframes snow {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(calc(100vh + 30px)) rotate(360deg); opacity: 0; }
        }
        .animate-snow { animation: snow linear infinite; animation-duration: 8s; }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 1s infinite; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s infinite; }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
        .delay-1000 { animation-delay: 1000ms; }
        .delay-1500 { animation-delay: 1500ms; }
      `}</style>
    </div>
  );
}