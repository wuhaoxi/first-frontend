import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostForm } from '@/components/PostForm';
import { suggestTags, suggestTitles, streamPostPolish } from '@/lib/api/postAssist';
import type { ApiResponse } from '@/lib/api/client';
import type {
  PostAssistRequest,
  PostPolishStreamHandlers,
  PostPolishStreamOptions,
  TagSuggestionsResponse,
  TitleSuggestionsResponse,
} from '@/types/postAssist';

vi.mock('@/lib/api/postAssist', () => ({
  suggestTitles: vi.fn(),
  suggestTags: vi.fn(),
  streamPostPolish: vi.fn(),
}));

vi.mock('@uiw/react-md-editor', () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (val?: string) => void }) => (
    <textarea
      aria-label="Content"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

type AuthState = {
  user: { id: number; name: string; email: string } | null;
  isLoading: boolean;
};

const { mockPush, mockAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockAuth: vi.fn<() => AuthState>(() => ({
    user: { id: 1, name: 'Alice', email: 'a@x.com' },
    isLoading: false,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

const mockedSuggestTitles = vi.mocked(suggestTitles);
const mockedSuggestTags = vi.mocked(suggestTags);
const mockedStreamPostPolish = vi.mocked(streamPostPolish);

interface RecordedPolishCall {
  request: PostAssistRequest;
  handlers: PostPolishStreamHandlers;
  options?: PostPolishStreamOptions;
}

let polishCalls: RecordedPolishCall[];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const titleInput = () => screen.getByLabelText('Title *');
const contentBox = () => screen.getByLabelText('Content');
const tagsInput = () => screen.getByLabelText('Tags (comma-separated)');

describe('PostForm AI assist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    polishCalls = [];
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
    mockedStreamPostPolish.mockImplementation((request, handlers, options) => {
      polishCalls.push({ request, handlers, options });
      return Promise.resolve();
    });
  });

  it('suggests titles with a loading state, then fills the title input from a clicked candidate', async () => {
    const pending = deferred<ApiResponse<TitleSuggestionsResponse>>();
    mockedSuggestTitles.mockReturnValue(pending.promise);

    render(<PostForm />);
    await userEvent.type(titleInput(), 'My trip');
    await userEvent.type(contentBox(), 'A post');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest titles' }));

    expect(mockedSuggestTitles).toHaveBeenCalledWith({ title: 'My trip', content: 'A post' });
    expect(screen.getByRole('button', { name: 'Suggesting…' })).toBeDisabled();
    expect(contentBox()).toBeEnabled();

    await act(async () => {
      pending.resolve({
        ok: true,
        data: { suggestions: ['Golden Route', 'Quiet Coast'] },
        message: null,
      });
    });

    expect(screen.getByRole('button', { name: 'Suggest titles' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Golden Route' }));

    expect(titleInput()).toHaveValue('Golden Route');
    expect(screen.queryByRole('button', { name: 'Golden Route' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quiet Coast' })).not.toBeInTheDocument();
  });

  it('appends a clicked tag chip and skips tags already present', async () => {
    mockedSuggestTags.mockResolvedValue({
      ok: true,
      data: { tags: ['food', 'history'] },
      message: null,
    });

    render(<PostForm />);
    await userEvent.type(contentBox(), 'A post');
    await userEvent.type(tagsInput(), 'food');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest tags' }));

    expect(mockedSuggestTags).toHaveBeenCalledWith({ title: '', content: 'A post' });

    await userEvent.click(await screen.findByRole('button', { name: 'food' }));
    expect(tagsInput()).toHaveValue('food');

    await userEvent.click(screen.getByRole('button', { name: 'history' }));
    expect(tagsInput()).toHaveValue('food, history');
  });

  it('streams polish deltas into the editor and restores the original on demand', async () => {
    render(<PostForm />);
    await userEvent.type(contentBox(), 'Original draft');

    await userEvent.click(screen.getByRole('button', { name: 'Polish' }));

    expect(polishCalls).toHaveLength(1);
    expect(polishCalls[0].request).toEqual({ title: '', content: 'Original draft' });
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();

    act(() => polishCalls[0].handlers.onDelta('Polished '));
    act(() => polishCalls[0].handlers.onDelta('draft'));
    expect(contentBox()).toHaveValue('Polished draft');

    act(() => polishCalls[0].handlers.onDone());
    expect(screen.getByRole('button', { name: 'Polish' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Restore original' }));

    expect(contentBox()).toHaveValue('Original draft');
    expect(screen.queryByRole('button', { name: 'Restore original' })).not.toBeInTheDocument();
  });

  it('stopping mid-stream aborts the request and keeps the partial text restorable', async () => {
    render(<PostForm />);
    await userEvent.type(contentBox(), 'Original draft');
    await userEvent.click(screen.getByRole('button', { name: 'Polish' }));

    act(() => polishCalls[0].handlers.onDelta('Half polished'));

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(polishCalls[0].options?.signal?.aborted).toBe(true);
    expect(contentBox()).toHaveValue('Half polished');

    act(() => polishCalls[0].handlers.onDelta(' — late'));

    expect(contentBox()).toHaveValue('Half polished');
    expect(screen.getByRole('button', { name: 'Restore original' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Polish' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('shows a sanitized inline error when titles fail and keeps the form usable', async () => {
    mockedSuggestTitles.mockResolvedValue({
      ok: false,
      data: null,
      message: 'The assistant is temporarily unavailable. Please try again.',
    });

    render(<PostForm />);
    await userEvent.type(contentBox(), 'A post');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest titles' }));

    expect(
      await screen.findByText('The assistant is temporarily unavailable. Please try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suggest titles' })).toBeEnabled();

    await userEvent.type(titleInput(), 'My trip');
    expect(titleInput()).toHaveValue('My trip');
  });

  it('keeps the partial text and shows a sanitized inline error when the polish stream fails', async () => {
    render(<PostForm />);
    await userEvent.type(contentBox(), 'Original draft');
    await userEvent.click(screen.getByRole('button', { name: 'Polish' }));

    act(() => polishCalls[0].handlers.onDelta('Half polished'));
    act(() =>
      polishCalls[0].handlers.onError('The assistant is temporarily unavailable. Please try again.')
    );

    expect(
      screen.getByText('The assistant is temporarily unavailable. Please try again.')
    ).toBeInTheDocument();
    expect(contentBox()).toHaveValue('Half polished');
    expect(screen.getByRole('button', { name: 'Polish' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restore original' })).toBeInTheDocument();
  });

  it('redirects to login when a polish stream reports 401', async () => {
    render(<PostForm />);
    await userEvent.type(contentBox(), 'A post');
    await userEvent.click(screen.getByRole('button', { name: 'Polish' }));

    act(() => polishCalls[0].handlers.onUnauthorized());

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when a suggest call is unauthorized', async () => {
    mockedSuggestTags.mockResolvedValue({
      ok: false,
      data: null,
      message: 'Authentication required',
    });

    render(<PostForm />);
    await userEvent.type(contentBox(), 'A post');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest tags' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('disables the suggest-tags control while its request is in flight', async () => {
    const pending = deferred<ApiResponse<TagSuggestionsResponse>>();
    mockedSuggestTags.mockReturnValue(pending.promise);

    render(<PostForm />);
    await userEvent.type(contentBox(), 'A post');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest tags' }));

    expect(screen.getByRole('button', { name: 'Suggesting…' })).toBeDisabled();
    expect(tagsInput()).toBeEnabled();

    await act(async () => {
      pending.resolve({ ok: true, data: { tags: ['food'] }, message: null });
    });

    expect(screen.getByRole('button', { name: 'Suggest tags' })).toBeEnabled();
  });
});
