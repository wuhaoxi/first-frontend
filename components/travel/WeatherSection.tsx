'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CITY_OPTIONS } from '@/lib/attraction-meta';
import { getAttractions } from '@/lib/api/attractions';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import { cn } from '@/lib/utils';
import type { AttractionSummary } from '@/types/attraction';
import type { WeatherForecastResponse, WeatherResponse } from '@/types/weather';

const FORECAST_WINDOW_OPTIONS = [3, 4, 5, 6, 7];
const DEFAULT_WINDOW_DAYS = 7;
const ATTRIBUTION_FALLBACK = 'Weather data by Open-Meteo (CC BY 4.0)';
const CATALOG_PAGE_SIZE = 100;

interface Selection {
  citySlug?: string;
  attractionSlug?: string;
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function WeatherSection() {
  const [attractions, setAttractions] = useState<AttractionSummary[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW_DAYS);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getAttractions({ size: CATALOG_PAGE_SIZE })
      .then((page) => {
        if (!cancelled) setAttractions(page.content);
      })
      .catch(() => {
        // The city picker still works when the attraction catalog is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (next: Selection, days: number) => {
    const ticket = ++generation.current;
    setStatus('loading');
    setMessage(null);

    const [currentResult, forecastResult] = await Promise.all([
      getCurrentWeather(next),
      getForecast({ ...next, days }),
    ]);

    // A newer selection owns the state now — this response is stale.
    if (generation.current !== ticket) return;

    if (!currentResult.ok || !forecastResult.ok) {
      setStatus('error');
      setMessage(currentResult.message ?? forecastResult.message ?? 'Could not load the weather.');
      return;
    }

    setCurrentWeather(currentResult.data);
    setForecast(forecastResult.data);
    setStatus('ready');
  }, []);

  const pickCity = (slug: string) => {
    if (!slug) return;
    const next: Selection = { citySlug: slug };
    setSelection(next);
    void load(next, windowDays);
  };

  const pickAttraction = (slug: string) => {
    if (!slug) return;
    const next: Selection = { attractionSlug: slug };
    setSelection(next);
    void load(next, windowDays);
  };

  const pickWindow = (value: string) => {
    const days = Number(value);
    setWindowDays(days);
    if (selection) void load(selection, days);
  };

  return (
    <section aria-label="Weather" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="weather-city" className="font-medium">
            City
          </label>
          <select
            id="weather-city"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={selection?.citySlug ?? ''}
            onChange={(event) => pickCity(event.target.value)}
          >
            <option value="">Select a city</option>
            {CITY_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="weather-attraction" className="font-medium">
            Attraction
          </label>
          <select
            id="weather-attraction"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={selection?.attractionSlug ?? ''}
            onChange={(event) => pickAttraction(event.target.value)}
          >
            <option value="">Select an attraction</option>
            {attractions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="weather-days" className="font-medium">
            Forecast days
          </label>
          <select
            id="weather-days"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={windowDays}
            onChange={(event) => pickWindow(event.target.value)}
          >
            {FORECAST_WINDOW_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days} days
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'idle' && (
        <p className="text-sm text-muted-foreground">Pick a city or attraction to see the weather.</p>
      )}

      {status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className={cn('text-sm', 'text-red-600')}>{message}</p>
          <button
            type="button"
            className="rounded border border-input px-3 py-1 text-sm"
            onClick={() => selection && void load(selection, windowDays)}
          >
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && currentWeather && forecast && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{currentWeather.locationName}</h3>

          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Temperature</dt>
              <dd className="font-medium">{currentWeather.current.temperatureC}°C</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Feels like</dt>
              <dd className="font-medium">{currentWeather.current.apparentTemperatureC}°C</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Humidity</dt>
              <dd className="font-medium">{currentWeather.current.humidityPercent}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Precipitation</dt>
              <dd className="font-medium">{currentWeather.current.precipitationMm} mm</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Wind</dt>
              <dd className="font-medium">{currentWeather.current.windSpeedKmh} km/h</dd>
            </div>
          </dl>

          <ul className="divide-y">
            {forecast.daily.map((day) => (
              <li key={day.date} className="flex items-center justify-between py-1 text-sm">
                <span>{day.date}</span>
                <span>
                  {day.temperatureMaxC}° / {day.temperatureMinC}°
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            {currentWeather.attribution || ATTRIBUTION_FALLBACK}
          </p>
        </div>
      )}
    </section>
  );
}
