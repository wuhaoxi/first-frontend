import { authFetch, ApiResponse } from '@/lib/api/client';
import type { ExchangeRateLatestResponse } from '@/types/exchangeRate';

export interface LatestRatesParams {
  base?: string;
  quotes?: string;
}

export function getLatestRates(
  params: LatestRatesParams = {}
): Promise<ApiResponse<ExchangeRateLatestResponse>> {
  const query = new URLSearchParams();
  if (params.base !== undefined) query.set('base', params.base);
  if (params.quotes !== undefined) query.set('quotes', params.quotes);
  const qs = query.toString();

  return authFetch<ExchangeRateLatestResponse>(
    `/api/exchange-rates/latest${qs ? `?${qs}` : ''}`
  );
}
