import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomepageAiAssistantEntry } from '@/components/home/HomepageAiAssistantEntry';

describe('HomepageAiAssistantEntry', () => {
  it('renders a button with aria-label="AI 助手"', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI 助手' });
    expect(button).toBeInTheDocument();
  });

  it('button has fixed position classes', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI 助手' });
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('z-50');
  });

  it('calls onOpenAiAssistant when clicked', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI 助手' });

    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without onOpenAiAssistant', async () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI 助手' });

    await expect(userEvent.click(button)).resolves.not.toThrow();
  });

  it('keyboard Enter triggers the callback', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI 助手' });

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
  });

  it('keyboard Space triggers the callback', async () => {
    const onOpen = vi.fn();
    render(<HomepageAiAssistantEntry onOpenAiAssistant={onOpen} />);
    const button = screen.getByRole('button', { name: 'AI 助手' });

    button.focus();
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenCalled();
  });

  it('decorative icon is aria-hidden', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI 助手' });
    const icon = button.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('has minimum tap target of 44px', () => {
    render(<HomepageAiAssistantEntry />);
    const button = screen.getByRole('button', { name: 'AI 助手' });
    expect(button.className).toContain('min-h-');
  });
});
