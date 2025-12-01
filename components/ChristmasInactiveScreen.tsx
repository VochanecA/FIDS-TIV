// @/components/ChristmasInactiveScreen.tsx
"use client";

import { CheckCircle, Plane } from 'lucide-react';
import Image from 'next/image';
import type { Flight } from '@/types/flight';

const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export default function ChristmasInactiveScreen({ 
  deskNumberParam, 
  nextFlight, 
  lastUpdate, 
  loading,
  isPortrait,
  displayFlight 
}: { 
  deskNumberParam: string;
  nextFlight: Flight | null;
  lastUpdate: string;
  loading: boolean;
  isPortrait: boolean;
  displayFlight: Flight | null;
}) {
  const wallpaperSrc = isPortrait ? '/wallpaper.jpg' : '/wallpaper-landscape.jpg';
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Wallpaper u pozadini sa novogodišnjim elementima */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={wallpaperSrc}
          alt="Airport Wallpaper"
          fill
          className="object-cover"
          priority
          quality={75}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        
        {/* Novogodišnje snejne pahulje u pozadini */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/30 animate-snow"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                fontSize: `${Math.random() * 15 + 10}px`,
                top: '-30px'
              }}
            >
              ❄
            </div>
          ))}
        </div>
        
        {/* Novogodišnji lampioni u ćoškovima */}
        <div className="absolute top-6 left-6 w-3 h-6 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-400/40"></div>
        <div className="absolute top-6 right-6 w-3 h-6 bg-red-300 rounded-full animate-pulse shadow-lg shadow-red-400/40 delay-500"></div>
        <div className="absolute bottom-6 left-6 w-3 h-6 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-400/40 delay-1000"></div>
        <div className="absolute bottom-6 right-6 w-3 h-6 bg-blue-300 rounded-full animate-pulse shadow-lg shadow-blue-400/40 delay-1500"></div>
      </div>
      
      {/* Sadržaj preko wallpaper-a sa novogodišnjim ukrasima */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <div className={`text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-gold/40 shadow-2xl relative overflow-hidden ${
          isPortrait ? 'max-w-4xl' : 'max-w-6xl'
        } mx-auto`}>
          
          {/* Novogodišnji ukrasi na uglovima kartice */}
          <div className="absolute -top-3 -left-3 text-2xl opacity-70 animate-bounce">🎄</div>
          <div className="absolute -top-3 -right-3 text-2xl opacity-70 animate-bounce delay-300">🌟</div>
          <div className="absolute -bottom-3 -left-3 text-2xl opacity-70 animate-bounce delay-700">🕯️</div>
          <div className="absolute -bottom-3 -right-3 text-2xl opacity-70 animate-bounce delay-1000">❄️</div>
          
          {/* Novogodišnja verzija CheckCircle ikone */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-green-400 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 text-xl animate-bounce">🎅</div>
            <div className="absolute -bottom-2 -left-2 text-xl animate-bounce delay-500">🎁</div>
          </div>
          
          <div className="text-center mb-8">
            <div className={`font-bold text-white/80 mb-4 flex items-center justify-center gap-4 ${
              isPortrait ? 'text-[6rem]' : 'text-[4rem]'
            }`}>
              <span className="text-3xl opacity-80">🎄</span>
              Check-in
              <span className="text-3xl opacity-80">✨</span>
            </div>
            <div className={`font-black bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent leading-none drop-shadow-2xl ${
              isPortrait ? 'text-[20rem]' : 'text-[15rem]'
            }`}>
              {deskNumberParam}
            </div>
          </div>
          
          <div className={`text-white/90 mb-6 font-semibold ${
            isPortrait ? 'text-4xl' : 'text-3xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">⏳</span>
              {displayFlight ? 'Check-in not available' : 'No flights currently checking in here'}
              <span className="text-2xl">🎯</span>
            </div>
          </div>

          {/* Prikaz sledećeg leta sa novogodišnjim stilom */}
          {nextFlight && (
            <div className={`mb-6 font-medium bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 py-4 px-8 rounded-2xl border border-gold/50 shadow-lg ${
              isPortrait ? 'text-3xl' : 'text-2xl'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl animate-pulse">🎁</span>
                <span className="text-orange-300 font-bold">Next Flight</span>
                <span className="text-2xl animate-pulse delay-300">✈️</span>
              </div>
              <div className="text-white font-bold mb-1">
                {nextFlight.FlightNumber} → {nextFlight.DestinationCityName}
              </div>
              <div className="text-yellow-300 text-lg">
                🕒 {nextFlight.ScheduledDepartureTime}
              </div>
            </div>
          )}

          <div className={`text-white/80 mb-6 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            {displayFlight ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">📊</span>
                <span>Status:</span>
                <span className="text-yellow-300 font-semibold">{displayFlight.StatusEN}</span>
                <span className="text-xl">🎄</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">👀</span>
                <span>Please check the main display</span>
                <span className="text-xl animate-pulse">✨</span>
              </div>
            )}
          </div>

          {/* Updated at tekst sa novogodišnjim akcentom */}
          <div className={`text-white/70 mb-4 ${
            isPortrait ? 'text-xl' : 'text-lg'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg">🕒</span>
              <span>Updated at:</span>
              <span className="text-cyan-300 font-mono">{lastUpdate || 'Never'}</span>
              <span className="text-lg">⏰</span>
            </div>
          </div>

          {/* Specijalna novogodišnja poruka */}
          <div className={`text-yellow-300 mb-6 font-semibold bg-gradient-to-r from-red-500/10 to-green-500/10 py-3 px-6 rounded-xl border border-yellow-400/30 ${
            isPortrait ? 'text-2xl' : 'text-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="animate-bounce">🎅</span>
              <span>Season&apos;s Greetings!</span>
              <span className="animate-bounce delay-500">🎄</span>
            </div>
          </div>

          {/* Show subtle loading indicator sa novogodišnjim twistom */}
          {loading && (
            <div className={`text-white/60 mt-4 ${
              isPortrait ? 'text-lg' : 'text-base'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <span>🔄 Updating flight information...</span>
                <span className="animate-spin text-xl">❄️</span>
              </div>
            </div>
          )}

          {/* Dodatni novogodišnji elementi unutar kartice */}
          <div className="absolute top-4 left-4 text-sm text-yellow-300/60 rotate-12">Happy Holidays</div>
          <div className="absolute top-4 right-4 text-sm text-green-300/60 -rotate-12">2026</div>
        </div>
      </div>

      {/* Dodatni novogodišnji elementi izvan kartice */}
      <div className="absolute bottom-10 left-10 text-4xl opacity-20 animate-pulse">🎁</div>
      <div className="absolute top-10 right-10 text-4xl opacity-20 animate-pulse delay-1000">🔔</div>
      <div className="absolute top-1/4 left-10 text-3xl opacity-15 animate-bounce delay-500">⭐</div>
      <div className="absolute bottom-1/4 right-10 text-3xl opacity-15 animate-bounce delay-700">🌟</div>

      <style jsx global>{`
        @keyframes snow {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-snow {
          animation: snow 10s linear infinite;
        }
      `}</style>
    </div>
  );
}