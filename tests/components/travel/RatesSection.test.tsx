import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatesSection from '@/components/travel/RatesSection';
import { getLatestRates } from '@/lib/api/exchangeRates';
import type { ApiResponse } from '@/lib/api/client';
import type { ExchangeRateLatestResponse } from '@/types/exchangeRate';

vi.mock('@/lib/api/exchangeRates');

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, message: null };
}

function fail(message: string): ApiResponse<never> {
  return { ok: false, data: null, message };
}

function rates(overrides: Partial<ExchangeRateLatestResponse> = {}): ExchangeRateLatestResponse {
  return {
    base: 'CNY',
    asOfDate: '2026-10-05',
    quotes: [
      { currency: 'USD', rate: 0.14 },
      { currency: 'EUR', rate: 0.13 },
      { currency: 'JPY', rate: 20.5 },
      { currency: 'KRW', rate: 190.2 },
    ],
    attribution: 'Rates By Exchange Rate API',
    ...overrides,
  };
}

describe('RatesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLatestRates).mockResolvedValue(ok(rates()));
  });

  it('auto-loads the curated CNY rates with no user input and labels them as of a date', async () => {
    const { container } = render(<RatesSection />);

    expect(await screen.findByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('JPY')).toBeInTheDocument();
    expect(screen.getByText('KRW')).toBeInTheDocument();
    expect(screen.getByText('1 CNY = 0.14 USD')).toBeInTheDocument();
    expect(screen.getByText('as of 2026-10-05')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Rates By Exchange Rate API' });
    expect(link).toHaveAttribute('href', 'https://www.exchangerate-api.com');

    expect(getLatestRates).toHaveBeenCalledTimes(1);
    expect(getLatestRates).toHaveBeenCalledWith({});

    const text = (container.textContent ?? '').toLowerCase();
    expect(text).not.toContain('live');
    expect(text).not.toContain('real-time');
    expect(text).not.toContain('current rate');
  });

  it('converts a free-form pair and amount from the returned rate', async () => {
    vi.mocked(getLatestRates)
      .mockResolvedValueOnce(ok(rates()))
      .mockResolvedValueOnce(ok(rates({ quotes: [{ currency: 'GBP', rate: 0.125 }] })));

    render(<RatesSection />);
    await screen.findByText('USD');

    await userEvent.type(screen.getByLabelText('Quote'), 'GBP');
    await userEvent.type(screen.getByLabelText('Amount'), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Convert' }));

    expect(await screen.findByText('1 CNY = 0.125 GBP')).toBeInTheDocument();
    expect(screen.getByText('100 CNY = 12.5 GBP')).toBeInTheDocument();
    expect(getLatestRates).toHaveBeenLastCalledWith({ base: 'CNY', quotes: 'GBP' });
  });

  it('keeps the previous rates visible and reports the server message when a code is rejected', async () => {
    vi.mocked(getLatestRates)
      .mockResolvedValueOnce(ok(rates()))
      .mockResolvedValueOnce(fail('ABC is not a supported currency'));

    render(<RatesSection />);
    await screen.findByText('USD');

    await userEvent.type(screen.getByLabelText('Quote'), 'ABC');
    await userEvent.click(screen.getByRole('button', { name: 'Convert' }));

    expect(await screen.findByText('ABC is not a supported currency')).toBeInTheDocument();
    expect(screen.getByText('1 CNY = 0.14 USD')).toBeInTheDocument();
    expect(screen.getByText('as of 2026-10-05')).toBeInTheDocument();
    expect(getLatestRates).toHaveBeenLastCalledWith({ base: 'CNY', quotes: 'ABC' });
  });

  it('shows an empty message without Retry and the fallback attribution when no quotes arrive', async () => {
    vi.mocked(getLatestRates).mockResolvedValue(ok(rates({ quotes: [], attribution: '' })));

    render(<RatesSection />);

    expect(await screen.findByText('No rates were returned for this pair.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rates By Exchange Rate API' })).toBeInTheDocument();
  });

  it('shows the failure message with Retry and re-issues the identical request', async () => {
    vi.mocked(getLatestRates)
      .mockResolvedValueOnce(fail('Exchange Rate API is unreachable'))
      .mockResolvedValueOnce(ok(rates()));

    render(<RatesSection />);

    expect(await screen.findByText('Exchange Rate API is unreachable')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('USD')).toBeInTheDocument();
    expect(getLatestRates).toHaveBeenNthCalledWith(1, {});
    expect(getLatestRates).toHaveBeenNthCalledWith(2, {});
    expect(getLatestRates).toHaveBeenCalledTimes(2);
  });
});
