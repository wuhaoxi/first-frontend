'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLatestRates } from '@/lib/api/exchangeRates';
import type { LatestRatesParams } from '@/lib/api/exchangeRates';
import { cn } from '@/lib/utils';
import type { ExchangeRateLatestResponse } from '@/types/exchangeRate';

const RATES_ATTRIBUTION_FALLBACK = 'Rates By Exchange Rate API';
const ATTRIBUTION_URL = 'https://www.exchangerate-api.com';
const DEFAULT_BASE = 'CNY';

export default function RatesSection() {
  const [rates, setRates] = useState<ExchangeRateLatestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [base, setBase] = useState(DEFAULT_BASE);
  const [quote, setQuote] = useState('');
  const [amount, setAmount] = useState('');
  const generation = useRef(0);
  const lastParams = useRef<LatestRatesParams>({});

  const loadRates = useCallback(async (params: LatestRatesParams) => {
    lastParams.current = params;
    const ticket = ++generation.current;
    setLoading(true);
    setError(null);

    const result = await getLatestRates(params);

    // A newer request owns the state now — this response is stale.
    if (generation.current !== ticket) return;
    setLoading(false);

    if (!result.ok) {
      // Keep the previously valid rates visible while reporting the failure.
      setError(result.message ?? 'Could not load rates.');
      return;
    }

    setRates(result.data);
  }, []);

  useEffect(() => {
    void loadRates({});
  }, [loadRates]);

  const convert = () => {
    void loadRates({
      base: base.trim().toUpperCase(),
      quotes: quote.trim().toUpperCase(),
    });
  };

  const parsedAmount = Number(amount);
  const hasAmount = amount.trim() !== '' && Number.isFinite(parsedAmount);

  return (
    <section aria-label="Exchange rates" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="rates-base" className="font-medium">
            Base
          </label>
          <input
            id="rates-base"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={base}
            onChange={(event) => setBase(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="rates-quote" className="font-medium">
            Quote
          </label>
          <input
            id="rates-quote"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="rates-amount" className="font-medium">
            Amount
          </label>
          <input
            id="rates-amount"
            className="rounded border border-input bg-background px-2 py-1.5"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className="rounded border border-input px-3 py-1 text-sm"
        onClick={convert}
      >
        Convert
      </button>

      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      )}

      {error && (
        <div className="space-y-2">
          <p className={cn('text-sm', 'text-red-600')}>{error}</p>
          <button
            type="button"
            className="rounded border border-input px-3 py-1 text-sm"
            onClick={() => void loadRates(lastParams.current)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && rates && (
        <div className="space-y-2">
          {rates.quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rates were returned for this pair.</p>
          ) : (
            <ul className="divide-y">
              {rates.quotes.map((quoteRow) => (
                <li
                  key={quoteRow.currency}
                  className="flex items-center justify-between gap-2 py-1 text-sm"
                >
                  <span>{quoteRow.currency}</span>
                  <span>
                    1 {rates.base} = {quoteRow.rate} {quoteRow.currency}
                  </span>
                  {hasAmount && (
                    <span>
                      {amount} {rates.base} = {parsedAmount * quoteRow.rate} {quoteRow.currency}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-muted-foreground">as of {rates.asOfDate}</p>
          <p className="text-xs text-muted-foreground">
            <a href={ATTRIBUTION_URL} className="underline" target="_blank" rel="noreferrer">
              {rates.attribution || RATES_ATTRIBUTION_FALLBACK}
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
