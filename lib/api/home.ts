import type { FeaturedGuide, HotPost } from '@/types/home';

// Server Components use the direct backend URL so that fetch does not get
// short-circuited by Next.js internal resolution (which bypasses rewrites).
// Client Components use the relative URL which goes through the Next.js proxy.
const BASE_URL = process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL}/api/home`
  : '/api/home';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  return response.json();
}

export async function getFeaturedGuides(): Promise<FeaturedGuide[]> {
  const response = await fetch(`${BASE_URL}/featured-guides`, { cache: 'no-store' });
  return handleResponse<FeaturedGuide[]>(response);
}

export async function getHotPosts(): Promise<HotPost[]> {
  const response = await fetch(`${BASE_URL}/hot-posts`, { cache: 'no-store' });
  return handleResponse<HotPost[]>(response);
}
