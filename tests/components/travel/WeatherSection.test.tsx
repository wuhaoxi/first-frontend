import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherSection from '@/components/travel/WeatherSection';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import { getAttractions } from '@/lib/api/attractions';
import type { ApiResponse } from '@/lib/api/client';
import type { AttractionSummary } from '@/types/attraction';
import type { PageResponse } from '@/types/interactions';
import type { WeatherDaily, WeatherForecastResponse, WeatherResponse } from '@/types/weather';

vi.mock('@/lib/api/weather');
vi.mock('@/lib/api/attractions');

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

function fail(message: string): ApiResponse<never> {
  return { ok: false, data: null, message };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function current(overrides: Partial<WeatherResponse['current']> = {}): WeatherResponse['current'] {
  return {
    temperatureC: 21.4,
    apparentTemperatureC: 21.9,
    humidityPercent: 45,
    precipitationMm: 0,
    windSpeedKmh: 8.2,
    windDirectionDegrees: 180,
    weatherCode: 1,
    ...overrides,
  };
}

function weather(overrides: Partial<WeatherResponse> = {}): WeatherResponse {
  return {
    citySlug: 'beijing',
    attractionSlug: null,
    locationName: 'Beijing',
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: 'Asia/Shanghai',
    observedAt: '2026-10-05T12:00',
    current: current(),
    attribution: 'Weather data by Open-Meteo (CC BY 4.0)',
    ...overrides,
  };
}

function daily(overrides: Partial<WeatherDaily> = {}): WeatherDaily {
  return {
    date: '2026-10-05',
    temperatureMaxC: 24.1,
    temperatureMinC: 14.2,
    precipitationSumMm: 0,
    precipitationProbabilityPercent: 5,
    windSpeedMaxKmh: 12.3,
    weatherCode: 1,
    ...overrides,
  };
}

function forecast(overrides: Partial<WeatherForecastResponse> = {}): WeatherForecastResponse {
  return {
    ...weather(),
    days: 7,
    daily: [daily()],
    ...overrides,
  };
}

function attraction(overrides: Partial<AttractionSummary> = {}): AttractionSummary {
  return {
    id: 1,
    createdAt: '2026-09-01T12:00:00Z',
    slug: 'forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    category: 'HISTORICAL_SITE',
    tags: ['unesco'],
    city: 'Beijing',
    citySlug: 'beijing',
    summary: 'Imperial palace at the heart of Beijing.',
    coverImageUrl: null,
    bookingRequired: true,
    ratingScore: 4.9,
    favoriteCount: 5100,
    heatScore: 98,
    ...overrides,
  };
}

function attractionsPage(): PageResponse<AttractionSummary> {
  return {
    content: [
      attraction(),
      attraction({ id: 2, slug: 'west-lake', name: 'West Lake', city: 'Hangzhou', citySlug: 'hangzhou' }),
    ],
    page: 0,
    size: 100,
    totalElements: 2,
    totalPages: 1,
  };
}

describe('WeatherSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttractions).mockResolvedValue(attractionsPage());
    vi.mocked(getCurrentWeather).mockResolvedValue(ok(weather()));
    vi.mocked(getForecast).mockResolvedValue(ok(forecast()));
  });

  it('renders the pickers and issues no weather request while idle', async () => {
    render(<WeatherSection />);

    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Forecast days')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Forbidden City' })).toBeInTheDocument();
    expect(screen.getByText(/pick a city or attraction/i)).toBeInTheDocument();

    expect(getCurrentWeather).not.toHaveBeenCalled();
    expect(getForecast).not.toHaveBeenCalled();
  });

  it('a city pick calls current and forecast with citySlug only and renders the values', async () => {
    render(<WeatherSection />);

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');

    expect(await screen.findByText('21.4°C')).toBeInTheDocument();
    expect(getCurrentWeather).toHaveBeenCalledWith({ citySlug: 'beijing' });
    expect(getForecast).toHaveBeenCalledWith({ citySlug: 'beijing', days: 7 });
    expect(getCurrentWeather).toHaveBeenCalledTimes(1);
    expect(getForecast).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('heading', { name: 'Beijing' })).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('2026-10-05')).toBeInTheDocument();
    expect(screen.getByText('Weather data by Open-Meteo (CC BY 4.0)')).toBeInTheDocument();
  });

  it('an attraction pick replaces the city selection and issues attractionSlug only', async () => {
    render(<WeatherSection />);

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');
    await screen.findByText('21.4°C');

    vi.mocked(getCurrentWeather).mockResolvedValue(
      ok(weather({ citySlug: null, attractionSlug: 'forbidden-city', locationName: 'Forbidden City', current: current({ temperatureC: 19.8 }) }))
    );

    await userEvent.selectOptions(await screen.findByLabelText('Attraction'), 'forbidden-city');

    expect(await screen.findByText('19.8°C')).toBeInTheDocument();
    expect(getCurrentWeather).toHaveBeenLastCalledWith({ attractionSlug: 'forbidden-city' });
    expect(getForecast).toHaveBeenLastCalledWith({ attractionSlug: 'forbidden-city', days: 7 });
    expect((screen.getByLabelText('City') as HTMLSelectElement).value).toBe('');
    expect(screen.getByRole('heading', { name: 'Forbidden City' })).toBeInTheDocument();
  });

  it('offers only 3–7 day forecast windows and re-requests the forecast on change', async () => {
    render(<WeatherSection />);

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');
    await screen.findByText('21.4°C');

    const select = screen.getByLabelText('Forecast days');
    const values = Array.from(select.querySelectorAll('option')).map(
      (option) => (option as HTMLOptionElement).value
    );
    expect(values).toEqual(['3', '4', '5', '6', '7']);

    await userEvent.selectOptions(select, '3');
    await waitFor(() =>
      expect(getForecast).toHaveBeenLastCalledWith({ citySlug: 'beijing', days: 3 })
    );
  });

  it('discards a stale in-flight response after the selection changes', async () => {
    const cityCurrent = deferred<ApiResponse<WeatherResponse>>();
    vi.mocked(getCurrentWeather)
      .mockImplementationOnce(() => cityCurrent.promise)
      .mockResolvedValueOnce(
        ok(weather({ citySlug: null, attractionSlug: 'forbidden-city', locationName: 'Forbidden City', current: current({ temperatureC: 19.8 }) }))
      );

    render(<WeatherSection />);

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');
    await userEvent.selectOptions(await screen.findByLabelText('Attraction'), 'forbidden-city');

    expect(await screen.findByText('19.8°C')).toBeInTheDocument();

    cityCurrent.resolve(ok(weather()));

    await waitFor(() => {
      expect(screen.getByText('19.8°C')).toBeInTheDocument();
      expect(screen.queryByText('21.4°C')).not.toBeInTheDocument();
    });
  });

  it('shows the failure message with Retry and recovers on the identical request', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValueOnce(fail('Open-Meteo refused the connection'));

    render(<WeatherSection />);

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');

    expect(await screen.findByText('Open-Meteo refused the connection')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('21.4°C')).toBeInTheDocument();
    expect(getCurrentWeather).toHaveBeenNthCalledWith(1, { citySlug: 'beijing' });
    expect(getCurrentWeather).toHaveBeenNthCalledWith(2, { citySlug: 'beijing' });
    expect(getForecast).toHaveBeenNthCalledWith(2, { citySlug: 'beijing', days: 7 });
  });
});
