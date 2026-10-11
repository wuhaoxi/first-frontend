import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TravelInfoDialog from '@/components/travel/TravelInfoDialog';
import { getAttractions } from '@/lib/api/attractions';
import { getCurrentWeather, getForecast } from '@/lib/api/weather';
import { getLatestRates } from '@/lib/api/exchangeRates';
import type { ApiResponse } from '@/lib/api/client';
import type { WeatherForecastResponse, WeatherResponse } from '@/types/weather';

vi.mock('@/lib/api/attractions');
vi.mock('@/lib/api/weather');
vi.mock('@/lib/api/exchangeRates');

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

function fail(message: string): ApiResponse<never> {
  return { ok: false, data: null, message };
}

function never<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

function weatherResponse(): WeatherResponse {
  return {
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
}

function forecastResponse(): WeatherForecastResponse {
  return {
    ...weatherResponse(),
    days: 7,
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
}

async function openDialog(): Promise<HTMLElement> {
  render(<TravelInfoDialog />);
  const trigger = screen.getByRole('button', { name: 'Weather & Rates' });
  await userEvent.click(trigger);
  return trigger;
}

describe('TravelInfoDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Nothing resolves by default: the controls must render before any response.
    vi.mocked(getAttractions).mockReturnValue(never());
    vi.mocked(getCurrentWeather).mockReturnValue(never());
    vi.mocked(getForecast).mockReturnValue(never());
    vi.mocked(getLatestRates).mockReturnValue(never());
  });

  it('renders both sections\u2019 controls on open before any response arrives', async () => {
    await openDialog();

    expect(await screen.findByRole('heading', { name: 'Weather & Rates' })).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Base')).toBeInTheDocument();
    expect(screen.getByLabelText('Quote')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert' })).toBeInTheDocument();

    expect(getLatestRates).toHaveBeenCalledWith({});
  });

  it('Escape closes the dialog and focus returns to the trigger', async () => {
    const trigger = await openDialog();
    await screen.findByLabelText('City');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByLabelText('City')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('the close control closes the dialog and focus returns to the trigger', async () => {
    const trigger = await openDialog();
    await screen.findByLabelText('City');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByLabelText('City')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('a failing rates section leaves the weather section and the dialog usable', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue(ok(weatherResponse()));
    vi.mocked(getForecast).mockResolvedValue(ok(forecastResponse()));
    vi.mocked(getLatestRates).mockResolvedValue(fail('Exchange Rate API is unreachable'));

    await openDialog();

    expect(await screen.findByText('Exchange Rate API is unreachable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weather & Rates' })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('City'), 'beijing');
    expect(await screen.findByText('21.4°C')).toBeInTheDocument();
  });

  it('renders no chart, table, or series surface', async () => {
    await openDialog();
    await screen.findByLabelText('City');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeNull();
    expect(document.querySelector('[data-chart]')).toBeNull();
    expect(screen.queryByText(/history/i)).not.toBeInTheDocument();
  });
});
