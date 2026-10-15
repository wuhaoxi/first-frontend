import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantProvider } from '@/components/assistant/AssistantProvider';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import {
  AssistantEntryTrigger,
  AssistantNavigationTrigger,
} from '@/components/assistant/AssistantTriggers';
import { streamAssistantMessage } from '@/lib/api/assistant';
import type {
  AssistantChatRequest,
  AssistantStreamHandlers,
  AssistantStreamOptions,
} from '@/types/assistant';

vi.mock('@/lib/api/assistant', () => ({
  streamAssistantMessage: vi.fn(),
}));

const mockedStream = vi.mocked(streamAssistantMessage);

interface RecordedCall {
  request: AssistantChatRequest;
  handlers: AssistantStreamHandlers;
  options?: AssistantStreamOptions;
}

let calls: RecordedCall[];

beforeEach(() => {
  calls = [];
  mockedStream.mockReset();
  mockedStream.mockImplementation((request, handlers, options) => {
    calls.push({ request, handlers, options });
    return Promise.resolve();
  });
});

function renderAssistant() {
  return render(
    <AssistantProvider>
      <AssistantEntryTrigger />
      <AssistantNavigationTrigger />
      <AssistantPanel />
    </AssistantProvider>
  );
}

const input = () => screen.getByLabelText('Message');

async function openFromEntry() {
  await userEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));
}

async function sendMessage(text: string) {
  await userEvent.type(input(), text);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('AssistantPanel', () => {
  it('is not rendered before a trigger is used', () => {
    renderAssistant();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from the floating entry with focus in the input', async () => {
    renderAssistant();
    await openFromEntry();

    expect(screen.getByRole('dialog', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it('opens from the function navigation card', async () => {
    renderAssistant();
    await userEvent.click(screen.getByRole('button', { name: /plan your trip/i }));

    expect(screen.getByRole('dialog', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it('keeps the panel open and refocuses the input when re-triggered', async () => {
    renderAssistant();
    await openFromEntry();
    input().blur();

    await openFromEntry();

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(input()).toHaveFocus();
  });

  it('closes on Escape and can be reopened from the trigger', async () => {
    renderAssistant();
    await openFromEntry();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openFromEntry();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on the close button while streaming and aborts the request', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');

    expect(calls).toHaveLength(1);
    expect(calls[0].options?.signal?.aborted).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(calls[0].options?.signal?.aborted).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // The aborted turn must not leave the provider stuck in streaming state.
    await openFromEntry();
    expect(input()).toBeEnabled();
  });

  it('shows the user bubble and a thinking indicator until the first delta arrives', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();

    act(() => calls[0].handlers.onDelta('Hello'));

    expect(screen.queryByText(/thinking/i)).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('appends deltas progressively inside an aria-live region', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');

    act(() => calls[0].handlers.onDelta('北京 '));
    act(() => calls[0].handlers.onDelta('晴'));

    const reply = screen.getByText('北京 晴');
    expect(reply.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('disables the input while streaming and re-enables it on done', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');

    expect(input()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    act(() => calls[0].handlers.onDone('c1'));

    expect(input()).toBeEnabled();
  });

  it('stores the done conversationId and carries it on the next send', async () => {
    renderAssistant();
    await openFromEntry();

    await sendMessage('first');
    expect(calls[0].request.conversationId).toBeUndefined();
    act(() => calls[0].handlers.onDone('conv-9'));

    await sendMessage('second');

    expect(calls[1].request.message).toBe('second');
    expect(calls[1].request.conversationId).toBe('conv-9');
  });

  it('keeps the transcript when closed and reopened', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');
    act(() => calls[0].handlers.onDelta('Hello'));
    act(() => calls[0].handlers.onDone('c1'));

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await openFromEntry();

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows a login prompt and disables the input on 401', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('Hi');

    act(() => calls[0].handlers.onUnauthorized());

    const link = screen.getByRole('link', { name: /log in/i });
    expect(link).toHaveAttribute('href', '/login');
    expect(input()).toBeDisabled();
    expect(screen.queryByText(/thinking/i)).not.toBeInTheDocument();
  });

  it('shows an error banner and Try again re-sends the last message without duplicating the user bubble', async () => {
    renderAssistant();
    await openFromEntry();
    await sendMessage('What about rain?');
    act(() => calls[0].handlers.onDelta('Partial'));

    act(() => calls[0].handlers.onError('Network error'));

    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    expect(screen.getByText('Partial')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(calls).toHaveLength(2);
    expect(calls[1].request.message).toBe('What about rain?');
    expect(screen.getAllByText('What about rain?')).toHaveLength(1);
    expect(screen.queryByText('Partial')).not.toBeInTheDocument();

    act(() => calls[1].handlers.onDelta('Fresh answer'));

    expect(screen.getByText('Fresh answer')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps Send disabled for blank input', async () => {
    renderAssistant();
    await openFromEntry();

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    await userEvent.type(input(), '   ');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    await userEvent.type(input(), 'Hi');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('blocks messages over 2000 characters and shows the limit hint', async () => {
    renderAssistant();
    await openFromEntry();

    fireEvent.change(input(), { target: { value: 'a'.repeat(2001) } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByText(/limited to 2000/i)).toBeInTheDocument();

    fireEvent.change(input(), { target: { value: 'a'.repeat(2000) } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.queryByText(/limited to 2000/i)).not.toBeInTheDocument();
  });
});
