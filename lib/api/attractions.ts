import type {
  AttractionResponse,
  AttractionSummary,
  GetAttractionsParams,
} from '@/types/attraction';
import type { PageResponse } from '@/types/interactions';

// Server Components use the direct backend URL so that fetch does not get
// short-circuited by Next.js internal resolution (which bypasses rewrites).
// Client Components use the relative URL which goes through the Next.js proxy.
const BASE_URL = process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL}/api/attractions`
  : '/api/attractions';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  return response.json();
}

export async function getAttractions(
  params: GetAttractionsParams = {}
): Promise<PageResponse<AttractionSummary>> {
  const query = new URLSearchParams();
  if (params.city !== undefined) query.set('city', params.city);
  if (params.category !== undefined) query.set('category', params.category);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));

  const qs = query.toString();
  const response = await fetch(`${BASE_URL}${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  return handleResponse<PageResponse<AttractionSummary>>(response);
}

export async function getPopularAttractions(limit?: number): Promise<AttractionSummary[]> {
  const qs = limit !== undefined ? `?limit=${limit}` : '';
  const response = await fetch(`${BASE_URL}/popular${qs}`, { cache: 'no-store' });
  return handleResponse<AttractionSummary[]>(response);
}

export async function getAttractionBySlug(slug: string): Promise<AttractionResponse> {
  const response = await fetch(`${BASE_URL}/${slug}`, { cache: 'no-store' });
  return handleResponse<AttractionResponse>(response);
}
