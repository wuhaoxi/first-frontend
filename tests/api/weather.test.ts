import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import * as weatherApi from '@/lib/api/weather';
import type { WeatherResponse, WeatherForecastResponse } from '@/types/weather';

const mockCurrent: WeatherResponse = {
  citySlug: 'beijing',
  attractionSlug: null,
  locationName: 'Beijing',
  latitude: 39.9042,
  longitude: 116.4074,
  timezone: 'Asia/Shanghai',
  observedAt: '2026-10-05T12:00',
  current: {
    temperatureC: 21.4,
    apparentTemperatureC: 21.9,
    humidityPercent: 45,
    precipitationMm: 0,
    windSpeedKmh: 8.2,
    windDirectionDegrees: 180,
    weatherCode: 1,
  },
  attribution: 'Weather data by Open-Meteo (CC BY 4.0)',
};

const mockForecast: WeatherForecastResponse = {
  ...mockCurrent,
  days: 5,
  daily: [
    {
      date: '2026-10-05',
      temperatureMaxC: 24.1,
      temperatureMinC: 14.2,
      precipitationSumMm: 0,
      precipitationProbabilityPercent: 5,
      windSpeedMaxKmh: 12.3,
      weatherCode: 1,
    },
  ],
};

function fetchOkJson<T>(data: T) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(data) });
}

describe('weather API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports only getCurrentWeather and getForecast — no history surface', () => {
    expect(Object.keys(weatherApi).sort()).toEqual(['getCurrentWeather', 'getForecast']);
  });

  it('getCurrentWeather sends only the defined selector and unwraps ok data', async () => {
    globalThis.fetch = fetchOkJson(mockCurrent);

    const result = await getCurrentWeather({ citySlug: 'beijing' });

    expect(result).toEqual({ ok: true, data: mockCurrent, message: null });
    expect(fetch).toHaveBeenCalledWith(
      '/api/weather/current?citySlug=beijing',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getCurrentWeather with an attraction selector sends no citySlug segment', async () => {
    globalThis.fetch = fetchOkJson(mockCurrent);

    await getCurrentWeather({ attractionSlug: 'forbidden-city' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/weather/current?attractionSlug=forbidden-city',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getForecast appends days only when defined', async () => {
    globalThis.fetch = fetchOkJson(mockForecast);

    const withDays = await getForecast({ citySlug: 'beijing', days: 5 });
    expect(withDays).toEqual({ ok: true, data: mockForecast, message: null });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/weather/forecast?citySlug=beijing&days=5',
      expect.objectContaining({ credentials: 'include' })
    );

    await getForecast({ citySlug: 'beijing' });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/weather/forecast?citySlug=beijing',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('resolves a 502 as ok:false with the server message — never throws', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: () =>
        Promise.resolve({
          message: 'Open-Meteo refused the connection',
          status: 502,
          timestamp: '2026-10-05T12:00:00',
        }),
    });

    const result = await getCurrentWeather({ citySlug: 'beijing' });

    expect(result).toEqual({
      ok: false,
      data: null,
      message: 'Open-Meteo refused the connection',
    });
  });

  it('resolves a network failure as ok:false Network error — never throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await getForecast({ citySlug: 'beijing' });

    expect(result).toEqual({ ok: false, data: null, message: 'Network error' });
  });
});
