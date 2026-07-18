export interface IWeatherForecast {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  aqi: number;
}

export const fetchWeatherForecast = async (lat: number, lng: number): Promise<IWeatherForecast> => {
  const baseTemp = lat > 40 ? 12 : lat < 15 ? 28 : 22;
  const randomFactor = Math.floor(Math.random() * 6) - 3;
  const isRainy = Math.sin(lat * 10 + lng * 10) > 0.4;

  return {
    temp: baseTemp + randomFactor,
    condition: isRainy ? 'Rainy' : ['Sunny', 'Clear', 'Cloudy', 'Windy'][Math.abs(Math.floor(lat * 10)) % 4],
    humidity: isRainy ? 85 : 55,
    windSpeed: 10 + Math.floor(Math.random() * 8),
    rainChance: isRainy ? 80 : 10,
    aqi: Math.round(40 + Math.random() * 70)
  };
};
