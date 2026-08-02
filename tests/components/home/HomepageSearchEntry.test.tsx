import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush } as unknown as AppRouterInstance),
}));

import { HomepageSearchEntry } from '@/components/home/HomepageSearchEntry';

describe('HomepageSearchEntry', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders an input with accessible label', () => {
    render(<HomepageSearchEntry />);
    const input = screen.getByRole('textbox', { name: /search/i });
    expect(input).toBeInTheDocument();
  });

  it('renders a search button', () => {
    render(<HomepageSearchEntry />);
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with a placeholder text', () => {
    render(<HomepageSearchEntry />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('triggers onSearch with trimmed keyword on Enter', async () => {
    const onSearch = vi.fn();
    render(<HomepageSearchEntry onSearch={onSearch} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '  Chengdu  ');
    await userEvent.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('Chengdu');
  });

  it('triggers onSearch on button click', async () => {
    const onSearch = vi.fn();
    render(<HomepageSearchEntry onSearch={onSearch} />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /search/i });

    await userEvent.type(input, 'Chengdu');
    await userEvent.click(button);

    expect(onSearch).toHaveBeenCalledWith('Chengdu');
  });

  it('does NOT call onSearch for empty input', async () => {
    const onSearch = vi.fn();
    render(<HomepageSearchEntry onSearch={onSearch} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '   ');
    await userEvent.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('does NOT call onSearch for whitespace-only input', async () => {
    const onSearch = vi.fn();
    render(<HomepageSearchEntry onSearch={onSearch} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '   ');
    await userEvent.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('default onSearch navigates to /guides?q=...', async () => {
    render(<HomepageSearchEntry />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'Chengdu');
    await userEvent.keyboard('{Enter}');

    expect(mockPush).toHaveBeenCalledWith('/guides?q=Chengdu');
  });

  it('encodes special characters in query param', async () => {
    render(<HomepageSearchEntry />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '成都 攻略');
    await userEvent.keyboard('{Enter}');

    expect(mockPush).toHaveBeenCalledWith('/guides?q=%E6%88%90%E9%83%BD%20%E6%94%BB%E7%95%A5');
  });

  it('keeps focus on input when empty text is submitted', async () => {
    render(<HomepageSearchEntry />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '   ');
    await userEvent.keyboard('{Enter}');

    expect(input).toHaveFocus();
  });
});
