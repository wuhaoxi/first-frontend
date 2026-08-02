import type { FeaturedGuide, PopularCity, HotPost } from '@/types/home';

const BASE_URL = '/api/home';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  return response.json();
}

export async function getFeaturedGuides(): Promise<FeaturedGuide[]> {
  const response = await fetch(`${BASE_URL}/featured-guides`);
  return handleResponse<FeaturedGuide[]>(response);
}

export async function getPopularDestinations(): Promise<PopularCity[]> {
  const response = await fetch(`${BASE_URL}/popular-destinations`);
  return handleResponse<PopularCity[]>(response);
}

export async function getHotPosts(): Promise<HotPost[]> {
  const response = await fetch(`${BASE_URL}/hot-posts`);
  return handleResponse<HotPost[]>(response);
}
