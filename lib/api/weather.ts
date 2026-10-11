import { authFetch, ApiResponse } from '@/lib/api/client';
import type { WeatherForecastResponse, WeatherResponse } from '@/types/weather';

export interface WeatherSelector {
  citySlug?: string;
  attractionSlug?: string;
}

export interface ForecastParams extends WeatherSelector {
  days?: number;
}

function selectorQuery(params: ForecastParams): string {
  const query = new URLSearchParams();
  if (params.citySlug !== undefined) query.set('citySlug', params.citySlug);
  if (params.attractionSlug !== undefined) query.set('attractionSlug', params.attractionSlug);
  if (params.days !== undefined) query.set('days', String(params.days));
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export function getCurrentWeather(selector: WeatherSelector): Promise<ApiResponse<WeatherResponse>> {
  return authFetch<WeatherResponse>(`/api/weather/current${selectorQuery(selector)}`);
}

export function getForecast(params: ForecastParams): Promise<ApiResponse<WeatherForecastResponse>> {
  return authFetch<WeatherForecastResponse>(`/api/weather/forecast${selectorQuery(params)}`);
}
