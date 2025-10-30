// components/weather-icon.tsx
import React from 'react';

interface WeatherIconProps {
  code: number;
  temperature: number;
  size?: number;
  textSize?: number;
  showText?: boolean;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ 
  code, 
  temperature, 
  size = 20,
  textSize = 14,
  showText = false 
}) => {
  const getWeatherInfo = (weatherCode: number) => {
    // WMO Weather interpretation codes (WW)
    const weatherMap: Record<number, { icon: string; description: string; color: string }> = {
      // Clear sky
      0: { icon: '☀️', description: 'Vedro', color: 'text-yellow-300' },
      
      // Mainly clear, partly cloudy, and overcast
      1: { icon: '🌤️', description: 'Uglavnom vedro', color: 'text-yellow-200' },
      2: { icon: '⛅', description: 'Djelomično oblačno', color: 'text-blue-200' },
      3: { icon: '☁️', description: 'Oblačno', color: 'text-gray-300' },
      
      // Fog and depositing rime fog
      45: { icon: '🌫️', description: 'Magla', color: 'text-gray-400' },
      48: { icon: '🌫️', description: 'Smrznuta magla', color: 'text-blue-100' },
      
      // Drizzle: Light, moderate, and dense intensity
      51: { icon: '🌦️', description: 'Slaba kiša', color: 'text-blue-300' },
      53: { icon: '🌦️', description: 'Umjerena kiša', color: 'text-blue-400' },
      55: { icon: '🌧️', description: 'Jaka kiša', color: 'text-blue-500' },
      
      // Freezing Drizzle: Light and dense intensity
      56: { icon: '🌧️', description: 'Smrzavajuća kiša', color: 'text-blue-200' },
      57: { icon: '🌧️', description: 'Jaka smrzavajuća kiša', color: 'text-blue-300' },
      
      // Rain: Slight, moderate and heavy intensity
      61: { icon: '🌧️', description: 'Slaba kiša', color: 'text-blue-400' },
      63: { icon: '🌧️', description: 'Umjerena kiša', color: 'text-blue-500' },
      65: { icon: '🌧️', description: 'Jaka kiša', color: 'text-blue-600' },
      
      // Freezing Rain: Light and heavy intensity
      66: { icon: '🌧️', description: 'Smrzavajuća kiša', color: 'text-blue-300' },
      67: { icon: '🌧️', description: 'Jaka smrzavajuća kiša', color: 'text-blue-400' },
      
      // Snow fall: Slight, moderate, and heavy intensity
      71: { icon: '🌨️', description: 'Slab snijeg', color: 'text-blue-100' },
      73: { icon: '🌨️', description: 'Umjeren snijeg', color: 'text-blue-200' },
      75: { icon: '🌨️', description: 'Jak snijeg', color: 'text-blue-300' },
      77: { icon: '❄️', description: 'Sniježne pahulje', color: 'text-white' },
      
      // Rain showers: Slight, moderate, and violent
      80: { icon: '🌦️', description: 'Slabi pljuskovi', color: 'text-blue-400' },
      81: { icon: '🌦️', description: 'Umjereni pljuskovi', color: 'text-blue-500' },
      82: { icon: '🌧️', description: 'Jaki pljuskovi', color: 'text-blue-600' },
      
      // Snow showers slight and heavy
      85: { icon: '🌨️', description: 'Sniježni pljuskovi', color: 'text-blue-200' },
      86: { icon: '🌨️', description: 'Jaki sniježni pljuskovi', color: 'text-blue-300' },
      
      // Thunderstorm: Slight or moderate
      95: { icon: '⛈️', description: 'Grmljavina', color: 'text-purple-400' },
      
      // Thunderstorm with slight and heavy hail
      96: { icon: '⛈️', description: 'Grmljavina sa gradom', color: 'text-purple-500' },
      99: { icon: '⛈️', description: 'Jaka grmljavina sa gradom', color: 'text-purple-600' },
    };

    return weatherMap[weatherCode] || { icon: '🌤️', description: 'Nepoznato', color: 'text-gray-300' };
  };

  const weatherInfo = getWeatherInfo(code);
  const roundedTemp = Math.round(temperature);

  return (
    <div 
      className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1 border border-white/20 backdrop-blur-sm"
      title={`${weatherInfo.description}, ${roundedTemp}°C`}
    >
      <span 
        style={{ fontSize: `${size}px` }}
        className={weatherInfo.color}
      >
        {weatherInfo.icon}
      </span>
      <span 
        style={{ fontSize: `${textSize}px` }}
        className="text-white font-bold whitespace-nowrap drop-shadow-sm"
      >
        {roundedTemp}°
      </span>
      {showText && (
        <span 
          style={{ fontSize: `${textSize - 2}px` }}
          className="text-white opacity-80 hidden lg:block ml-1"
        >
          {weatherInfo.description}
        </span>
      )}
    </div>
  );
};

export default WeatherIcon;