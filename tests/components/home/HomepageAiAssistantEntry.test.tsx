import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepageAiAssistantEntry } from '@/components/home/HomepageAiAssistantEntry';

describe('HomepageAiAssistantEntry', () => {
  it('renders a button with aria-label="AI Assistant"', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });
    expect(button).toBeInTheDocument();
  });

  it('shows the visible "AI Assistant" label next to the Bot icon', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    expect(button).toHaveTextContent('AI Assistant');
    expect(button.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders as a branded pill', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    expect(button.className).toContain('h-12');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('px-5');
    expect(button.className).toContain('gap-2');
    expect(button.className).toContain('bg-primary');
  });

  it('button has fixed position classes', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('z-50');
  });

  it('calls onOpenAiAssistant when clicked', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without onOpenAiAssistant', async () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    await expect(userEvent.click(button)).resolves.not.toThrow();
  });

  it('keyboard Enter triggers the callback', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
  });

  it('keyboard Space triggers the callback', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });

    button.focus();
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenCalled();
  });

  it('decorative icon is aria-hidden', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI Assistant' });
    const icon = button.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
