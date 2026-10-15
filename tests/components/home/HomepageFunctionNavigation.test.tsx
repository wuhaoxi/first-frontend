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

  it('community card links to the post community at /posts', () => {
    render(<HomepageFunctionNavigation />);
    const link = screen.getByRole('link', { name: /Community/ });
    expect(link).toHaveAttribute('href', '/posts');
  });

  it('attractions card links to /attractions', () => {
    render(<HomepageFunctionNavigation />);
    const link = screen.getByRole('link', { name: /Attractions/ });
    expect(link).toHaveAttribute('href', '/attractions');
  });

  it('uses English titles for all three cards', () => {
    render(<HomepageFunctionNavigation />);

    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Attractions')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.queryByText('旅游社区')).not.toBeInTheDocument();
    expect(screen.queryByText('景点攻略')).not.toBeInTheDocument();
    expect(screen.queryByText('AI 助手')).not.toBeInTheDocument();
  });

  it('does not link to the never-delivered /community route', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    expect(container.querySelector('a[href="/community"]')).toBeNull();
  });

  it('card descriptions match their destinations', () => {
    render(<HomepageFunctionNavigation />);

    expect(screen.getByText('Share travel stories and tips with fellow travelers')).toBeInTheDocument();
    expect(screen.getByText('Browse top attractions across China')).toBeInTheDocument();
    expect(screen.getByText('Plan your trip with our intelligent assistant')).toBeInTheDocument();
  });

  it('renders each card with a brand icon chip', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    const cards = container.querySelectorAll('a, button');

    cards.forEach((card) => {
      const chip = card.querySelector('[class*="bg-primary/10"]');
      expect(chip).not.toBeNull();
      expect(chip?.className).toContain('text-primary');
      expect(chip?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('applies the brand hover treatment to every card', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    const cards = container.querySelectorAll('a, button');

    cards.forEach((card) => {
      expect(card.className).toContain('hover:border-primary/30');
      expect(card.className).toContain('hover:-translate-y-0.5');
    });
  });

  it('AI card is a button that calls onOpenAiAssistant', async () => {
    const onOpen = vi.fn();
    render(<HomepageFunctionNavigation onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: /AI Assistant/i });

    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('AI card with no handler does not throw', async () => {
    render(<HomepageFunctionNavigation />);
    const button = screen.getByRole('button', { name: /AI Assistant/i });

    await expect(userEvent.click(button)).resolves.not.toThrow();
  });

  it('keyboard Enter activates the AI card', async () => {
    const onOpen = vi.fn();
    render(<HomepageFunctionNavigation onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: /AI Assistant/i });

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
  });

  it('icons are decorative and hidden from assistive tech', () => {
    const { container } = render(<HomepageFunctionNavigation />);
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});
