import { describe, it, expect, vi } from 'vitest';
import { formatRelativeTime } from '@/lib/time';

describe('formatRelativeTime', () => {
  it('returns "just now" for ≤ 1 minute ago', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const createdAt = new Date('2026-08-02T11:59:30Z').toISOString();
    expect(formatRelativeTime(createdAt, now)).toBe('just now');
  });

  it('returns "1 h ago" for < 1 day ago', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const createdAt = new Date('2026-08-02T10:00:00Z').toISOString();
    expect(formatRelativeTime(createdAt, now)).toBe('2 h ago');
  });

  it('returns "N h ago" for hours within same day', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const createdAt = new Date('2026-08-02T06:00:00Z').toISOString();
    expect(formatRelativeTime(createdAt, now)).toBe('6 h ago');
  });

  it('returns "N days ago" for ≥ 1 day', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const createdAt = new Date('2026-08-01T12:00:00Z').toISOString();
    expect(formatRelativeTime(createdAt, now)).toBe('1 days ago');
  });

  it('returns "N days ago" for multiple days', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const createdAt = new Date('2026-07-29T12:00:00Z').toISOString();
    expect(formatRelativeTime(createdAt, now)).toBe('4 days ago');
  });

  it('uses current time when now is not provided', () => {
    const justNow = new Date().toISOString();
    expect(formatRelativeTime(justNow)).toBe('just now');
  });
});
