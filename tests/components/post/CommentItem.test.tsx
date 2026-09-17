import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentItem from '@/components/post/CommentItem';
import type { AttractionCommentResponse, CommentResponse } from '@/types/interactions';

function buildComment(overrides: Partial<CommentResponse> = {}): CommentResponse {
  return {
    id: 10,
    postId: 1,
    userId: 2,
    content: 'Nice post!',
    parentCommentId: null,
    replyCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('CommentItem', () => {
  it('renders avatar initial, author name, content and relative time', () => {
    const comment = buildComment();
    render(
      <CommentItem
        comment={comment}
        authorName="Alice"
        layer={1}
        currentUserId={null}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Nice post!')).toBeInTheDocument();
    expect(screen.getByText('just now')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // avatar initial
  });

  it('shows a reply button on layer-1 comments', async () => {
    const comment = buildComment();
    const onReplyClick = vi.fn();
    render(
      <CommentItem
        comment={comment}
        authorName="Alice"
        layer={1}
        currentUserId={1}
        onReplyClick={onReplyClick}
        onDelete={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onReplyClick).toHaveBeenCalledWith(comment);
  });

  it('does not render a reply button on layer-2 comments', () => {
    render(
      <CommentItem
        comment={buildComment({ parentCommentId: 5 })}
        authorName="Bob"
        layer={2}
        currentUserId={1}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
  });

  it('hides the reply button from guests', () => {
    render(
      <CommentItem
        comment={buildComment()}
        authorName="Alice"
        layer={1}
        currentUserId={null}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
  });

  it('shows the "N replies hidden" hint for a layer-2 comment with children', () => {
    render(
      <CommentItem
        comment={buildComment({ parentCommentId: 5, replyCount: 3 })}
        authorName="Bob"
        layer={2}
        currentUserId={1}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('3 replies hidden')).toBeInTheDocument();
  });

  it('does not show the hidden hint on layer-1 comments', () => {
    render(
      <CommentItem
        comment={buildComment({ replyCount: 3 })}
        authorName="Alice"
        layer={1}
        currentUserId={1}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByText(/replies hidden/)).not.toBeInTheDocument();
  });

  it('shows a delete action only for the comment author', async () => {
    const comment = buildComment(); // userId 2
    const onDelete = vi.fn().mockResolvedValue(null);

    const { unmount } = render(
      <CommentItem
        comment={comment}
        authorName="Alice"
        layer={1}
        currentUserId={2}
        onReplyClick={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete comment' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete comment' }));
    expect(onDelete).toHaveBeenCalledWith(10);

    unmount();

    render(
      <CommentItem
        comment={comment}
        authorName="Alice"
        layer={1}
        currentUserId={1} // different user
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Delete comment' })).not.toBeInTheDocument();
  });

  it('shows an inline error when delete fails', async () => {
    const comment = buildComment(); // userId 2
    const onDelete = vi.fn().mockResolvedValue('Could not delete');
    render(
      <CommentItem
        comment={comment}
        authorName="Alice"
        layer={1}
        currentUserId={2}
        onReplyClick={vi.fn()}
        onDelete={onDelete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete comment' }));

    expect(await screen.findByText('Could not delete')).toBeInTheDocument();
  });

  it('renders an attraction-flavored comment through the same tree (CommentView)', () => {
    const attractionComment: AttractionCommentResponse = {
      id: 30,
      attractionId: 5,
      userId: 2,
      content: 'Loved the view!',
      parentCommentId: null,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <CommentItem
        comment={attractionComment}
        authorName="Alice"
        layer={1}
        currentUserId={null}
        onReplyClick={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Loved the view!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
