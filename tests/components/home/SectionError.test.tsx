import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionError } from '@/components/home/SectionError';

describe('SectionError', () => {
  it('renders default title when no title prop', () => {
    render(<SectionError onRetry={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<SectionError title="Failed to load" onRetry={vi.fn()} />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<SectionError message="Network error" onRetry={vi.fn()} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('has role="alert" attribute', () => {
    const { container } = render(<SectionError onRetry={vi.fn()} />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it('triggers onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    render(<SectionError onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('retry button has accessible aria-label', () => {
    render(<SectionError onRetry={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAccessibleName();
  });
});
