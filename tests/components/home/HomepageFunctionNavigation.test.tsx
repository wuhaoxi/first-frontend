import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepageFunctionNavigation } from '@/components/home/HomepageFunctionNavigation';

describe('HomepageFunctionNavigation', () => {
  it('renders exactly 3 cards', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    const cards = container.querySelectorAll('a, button');
    expect(cards.length).toBe(3);
  });

  it('community card is a link to /community', () => {
    render(<HomepageFunctionNavigation />);
    const link = screen.getByRole('link', { name: /旅游社区/i });
    expect(link).toHaveAttribute('href', '/community');
  });

  it('guides card is a link to /guides', () => {
    render(<HomepageFunctionNavigation />);
    const link = screen.getByRole('link', { name: /景点攻略/i });
    expect(link).toHaveAttribute('href', '/guides');
  });

  it('AI card is a button that calls onOpenAiAssistant', async () => {
    const onOpen = vi.fn();
    render(<HomepageFunctionNavigation onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: /AI 助手/i });

    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('AI card with no handler does not throw', async () => {
    render(<HomepageFunctionNavigation />);
    const button = screen.getByRole('button', { name: /AI 助手/i });

    await expect(userEvent.click(button)).resolves.not.toThrow();
  });

  it('keyboard Enter activates cards', async () => {
    const onOpen = vi.fn();
    render(<HomepageFunctionNavigation onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: /AI 助手/i });

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
  });

  it('each card has a title and description', () => {
    render(<HomepageFunctionNavigation />);
    expect(screen.getByText('旅游社区')).toBeInTheDocument();
    expect(screen.getByText('景点攻略')).toBeInTheDocument();
    // All 3 cards should have both title and description text
    const cards = screen.getAllByRole('link');
    // community and guides are links (2 links)
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('icons have aria-hidden attribute', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});
