import { Todo, CreateTodoRequest, UpdateTodoRequest } from '@/types/todo';

const BASE_URL = '/api/todos';

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

export async function getTodos(status?: string): Promise<Todo[]> {
  const url = status ? `${BASE_URL}?status=${status}` : BASE_URL;
  const response = await fetch(url);
  return handleResponse<Todo[]>(response);
}

export async function getTodoById(id: number): Promise<Todo> {
  const response = await fetch(`${BASE_URL}/${id}`);
  return handleResponse<Todo>(response);
}

export async function createTodo(data: CreateTodoRequest): Promise<Todo> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(response);
}

export async function updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(response);
}

export async function toggleTodo(id: number): Promise<Todo> {
  const response = await fetch(`${BASE_URL}/${id}/toggle`, { method: 'PATCH' });
  return handleResponse<Todo>(response);
}

export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  return handleResponse<void>(response);
}
