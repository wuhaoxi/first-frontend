import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTodos, getTodoById, createTodo, updateTodo, toggleTodo, deleteTodo } from '@/lib/api/todos';

describe('todos API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getTodos returns todo list', async () => {
    const mockTodos = [{ id: 1, title: 'Test', priority: 'MEDIUM', completed: false, tags: ['work'], createdAt: '', updatedAt: '' }];
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockTodos) });

    const result = await getTodos();
    expect(result).toEqual(mockTodos);
    expect(fetch).toHaveBeenCalledWith('/api/todos');
  });

  it('getTodos with status filter', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });

    await getTodos('active');
    expect(fetch).toHaveBeenCalledWith('/api/todos?status=active');
  });

  it('getTodoById returns single todo', async () => {
    const mockTodo = { id: 1, title: 'Test', priority: 'HIGH', completed: false, tags: [], createdAt: '', updatedAt: '' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(mockTodo) });

    const result = await getTodoById(1);
    expect(result).toEqual(mockTodo);
    expect(fetch).toHaveBeenCalledWith('/api/todos/1');
  });

  it('createTodo sends POST', async () => {
    const req = { title: 'New', tags: ['work'] };
    const created = { id: 1, ...req, priority: 'MEDIUM', completed: false, createdAt: '', updatedAt: '' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(created) });

    const result = await createTodo(req);
    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  });

  it('updateTodo sends PUT', async () => {
    const req = { title: 'Updated' };
    const updated = { id: 1, title: 'Updated', priority: 'MEDIUM', completed: false, tags: [], createdAt: '', updatedAt: '' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(updated) });

    const result = await updateTodo(1, req);
    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith('/api/todos/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  });

  it('toggleTodo sends PATCH', async () => {
    const toggled = { id: 1, title: 'Test', completed: true, completedAt: '2026-07-18T12:00:00' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(toggled) });

    const result = await toggleTodo(1);
    expect(result.completed).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/todos/1/toggle', { method: 'PATCH' });
  });

  it('deleteTodo sends DELETE', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) });

    await deleteTodo(1);
    expect(fetch).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' });
  });

  it('throws on non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found', json: () => Promise.resolve({ message: 'Todo not found with id: 99' }) });

    await expect(getTodoById(99)).rejects.toThrow('404: Todo not found with id: 99');
  });
});
