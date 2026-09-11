import type {
  PostListResponse,
  GetPostsParams,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
} from '@/types/post';

const BASE_URL = '/api/posts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`${response.status}: ${body.message || response.statusText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function getPosts(params: GetPostsParams = {}): Promise<PostListResponse> {
  const query = new URLSearchParams();
  if (params.sort !== undefined) query.set('sort', params.sort);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.cursor !== undefined) query.set('cursor', params.cursor);
  const queryString = query.toString();
  const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
  const response = await fetch(url, { credentials: 'include' });
  return handleResponse<PostListResponse>(response);
}

export async function getPostById(id: number): Promise<PostResponse> {
  const response = await fetch(`${BASE_URL}/${id}`, { credentials: 'include' });
  return handleResponse<PostResponse>(response);
}

export async function createPost(data: CreatePostRequest): Promise<PostResponse> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<PostResponse>(response);
}

export async function updatePost(id: number, data: UpdatePostRequest): Promise<PostResponse> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<PostResponse>(response);
}
