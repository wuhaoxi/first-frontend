export interface WeatherCurrent {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  weatherCode: number;
}

export interface WeatherDaily {
  date: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityPercent: number;
  windSpeedMaxKmh: number;
  weatherCode: number;
}

export interface WeatherResponse {
  citySlug: string | null;
  attractionSlug: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  observedAt: string;
  current: WeatherCurrent;
  attribution: string;
}

export interface WeatherForecastResponse {
  citySlug: string | null;
  attractionSlug: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  days: number;
  timezone: string;
  observedAt: string;
  current: WeatherCurrent;
  daily: WeatherDaily[];
  attribution: string;
}
