export interface ExchangeRateQuote {
  currency: string;
  rate: number;
}

export interface ExchangeRateLatestResponse {
  base: string;
  asOfDate: string;
  quotes: ExchangeRateQuote[];
  attribution: string;
}
