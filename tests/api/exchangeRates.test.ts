import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLatestRates } from '@/lib/api/exchangeRates';
import * as exchangeRatesApi from '@/lib/api/exchangeRates';
import type { ExchangeRateLatestResponse } from '@/types/exchangeRate';

const mockLatest: ExchangeRateLatestResponse = {
  base: 'CNY',
  asOfDate: '2026-10-04',
  quotes: [
    { currency: 'USD', rate: 0.1402 },
    { currency: 'EUR', rate: 0.1195 },
  ],
  attribution: 'Rates By Exchange Rate API',
};

function fetchOkJson<T>(data: T) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(data) });
}

describe('exchange rates API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports only getLatestRates — no history surface', () => {
    expect(Object.keys(exchangeRatesApi)).toEqual(['getLatestRates']);
  });

  it('getLatestRates with no params hits the bare latest path and unwraps ok data', async () => {
    globalThis.fetch = fetchOkJson(mockLatest);

    const result = await getLatestRates();

    expect(result).toEqual({ ok: true, data: mockLatest, message: null });
    expect(fetch).toHaveBeenCalledWith(
      '/api/exchange-rates/latest',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getLatestRates appends only the defined params', async () => {
    globalThis.fetch = fetchOkJson(mockLatest);

    await getLatestRates({ base: 'CNY' });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/exchange-rates/latest?base=CNY',
      expect.objectContaining({ credentials: 'include' })
    );

    await getLatestRates({ base: 'CNY', quotes: 'USD,EUR' });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/exchange-rates/latest?base=CNY&quotes=USD%2CEUR',
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
          message: 'EXCHANGE_RATE_API_KEY is not set',
          status: 502,
          timestamp: '2026-10-05T12:00:00',
        }),
    });

    const result = await getLatestRates();

    expect(result).toEqual({
      ok: false,
      data: null,
      message: 'EXCHANGE_RATE_API_KEY is not set',
    });
  });

  it('resolves a network failure as ok:false Network error — never throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await getLatestRates();

    expect(result).toEqual({ ok: false, data: null, message: 'Network error' });
  });
});
