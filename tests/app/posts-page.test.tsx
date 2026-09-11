import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostsPage from '@/app/posts/page';
import { getPosts } from '@/lib/api/posts';
import type { PostListResponse, PostSummary } from '@/types/post';

vi.mock('@/lib/api/posts');

type AuthState = {
  user: { id: number; name: string; email: string } | null;
  isLoading: boolean;
};

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => AuthState>(() => ({ user: null, isLoading: false })),
}));

vi.mock('@/components/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

function makePost(id: number, title: string): PostSummary {
  return {
    id,
    title,
    coverImage: null,
    tags: [],
    authorId: 1,
    commentCount: 0,
    upVoteCount: 0,
    bookmarkCount: 0,
    createdAt: '2026-09-03T00:45:47.631831',
    updatedAt: '2026-09-03T00:45:47.631831',
  };
}

function makeEnvelope(overrides: Partial<PostListResponse> = {}): PostListResponse {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    nextCursor: null,
    hasMore: false,
    ...overrides,
  };
}

describe('PostsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPosts).mockReset();
    mockAuth.mockImplementation(() => ({ user: null, isLoading: false }));
  });

  it('fetches the latest page and renders items in order', async () => {
    vi.mocked(getPosts).mockResolvedValue(
      makeEnvelope({ content: [makePost(2, 'Newest story'), makePost(1, 'Older story')] })
    );

    render(<PostsPage />);

    expect(await screen.findByText('Newest story')).toBeInTheDocument();
    expect(screen.getByText('Older story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenCalledWith({ sort: 'latest', page: 0, size: 20 });

    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Newest story');
    expect(titles[1]).toHaveTextContent('Older story');
  });

  it('switches sort tabs and refetches page 0', async () => {
    vi.mocked(getPosts)
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(2, 'Newest story')] }))
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(3, 'Most liked story')] }))
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(4, 'Most commented story')] }));

    render(<PostsPage />);
    await screen.findByText('Newest story');

    await userEvent.click(screen.getByRole('button', { name: 'Most Liked' }));

    expect(await screen.findByText('Most liked story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenLastCalledWith({ sort: 'upvotes', page: 0, size: 20 });
    expect(screen.queryByText('Newest story')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Most Liked' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Most Commented' }));

    expect(await screen.findByText('Most commented story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenLastCalledWith({ sort: 'comments', page: 0, size: 20 });
    expect(screen.queryByText('Most liked story')).not.toBeInTheDocument();
  });

  it('loads more with the cursor for the latest sort', async () => {
    vi.mocked(getPosts)
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makePost(2, 'Newest story')],
          totalElements: 2,
          totalPages: 2,
          nextCursor: 'CURSOR1',
          hasMore: true,
        })
      )
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(1, 'Older story')] }));

    render(<PostsPage />);
    await screen.findByText('Newest story');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Older story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenLastCalledWith({ sort: 'latest', size: 20, cursor: 'CURSOR1' });
    expect(screen.getByText('Newest story')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('loads more by page number for count sorts', async () => {
    vi.mocked(getPosts)
      .mockResolvedValueOnce(makeEnvelope())
      .mockResolvedValueOnce(
        makeEnvelope({
          content: [makePost(3, 'Liked A')],
          totalElements: 2,
          totalPages: 2,
          hasMore: true,
        })
      )
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(4, 'Liked B')] }));

    render(<PostsPage />);
    await waitFor(() => expect(getPosts).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: 'Most Liked' }));
    await screen.findByText('Liked A');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Liked B')).toBeInTheDocument();
    expect(getPosts).toHaveBeenLastCalledWith({ sort: 'upvotes', page: 1, size: 20 });
    expect(screen.getByText('Liked A')).toBeInTheDocument();
  });

  it('resets the list when the sort changes', async () => {
    vi.mocked(getPosts)
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makePost(2, 'Newest story')], nextCursor: 'CURSOR1', hasMore: true })
      )
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(1, 'Older story')] }))
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(3, 'Most liked story')] }));

    render(<PostsPage />);
    await screen.findByText('Newest story');
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('Older story');

    await userEvent.click(screen.getByRole('button', { name: 'Most Liked' }));

    expect(await screen.findByText('Most liked story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenLastCalledWith({ sort: 'upvotes', page: 0, size: 20 });
    expect(screen.queryByText('Newest story')).not.toBeInTheDocument();
    expect(screen.queryByText('Older story')).not.toBeInTheDocument();
  });

  it('shows an inline error when loading more fails and keeps the button usable', async () => {
    vi.mocked(getPosts)
      .mockResolvedValueOnce(
        makeEnvelope({ content: [makePost(2, 'Newest story')], nextCursor: 'CURSOR1', hasMore: true })
      )
      .mockRejectedValueOnce(new Error('500: Load failed'))
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(1, 'Older story')] }));

    render(<PostsPage />);
    await screen.findByText('Newest story');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('500: Load failed')).toBeInTheDocument();
    expect(screen.getByText('Newest story')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Older story')).toBeInTheDocument();
    expect(screen.queryByText('500: Load failed')).not.toBeInTheDocument();
  });

  it('shows the empty state with a create link', async () => {
    vi.mocked(getPosts).mockResolvedValue(makeEnvelope());

    render(<PostsPage />);

    expect(await screen.findByText(/No posts yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a Post' })).toHaveAttribute(
      'href',
      '/posts/create'
    );
  });

  it('shows an error message and retries on demand', async () => {
    vi.mocked(getPosts)
      .mockRejectedValueOnce(new Error('500: Server error'))
      .mockResolvedValueOnce(makeEnvelope({ content: [makePost(2, 'Recovered story')] }));

    render(<PostsPage />);

    expect(await screen.findByText('500: Server error')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Recovered story')).toBeInTheDocument();
    expect(getPosts).toHaveBeenCalledTimes(2);
  });

  it('shows skeleton placeholders while loading', () => {
    vi.mocked(getPosts).mockReturnValue(new Promise<PostListResponse>(() => {}));

    const { container } = render(<PostsPage />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('links guests to login', async () => {
    vi.mocked(getPosts).mockResolvedValue(makeEnvelope());

    render(<PostsPage />);
    await screen.findByText(/No posts yet/);

    expect(screen.getByRole('link', { name: 'Log in to post' })).toHaveAttribute('href', '/login');
  });

  it('links authenticated users to the create page', async () => {
    mockAuth.mockImplementation(() => ({
      user: { id: 1, name: 'Alice', email: 'a@x.com' },
      isLoading: false,
    }));
    vi.mocked(getPosts).mockResolvedValue(makeEnvelope());

    render(<PostsPage />);
    await screen.findByText(/No posts yet/);

    expect(screen.getByRole('link', { name: 'New Post' })).toHaveAttribute(
      'href',
      '/posts/create'
    );
  });
});
