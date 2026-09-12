import { describe, it, expect } from 'vitest';
import { formatCompact } from '@/lib/format';

describe('formatCompact', () => {
  it('renders values below 1000 as-is', () => {
    expect(formatCompact(999)).toBe('999');
  });

  it('renders values from 1000 to 9999 rounded to one decimal with a k suffix', () => {
    expect(formatCompact(1000)).toBe('1.0k');
    expect(formatCompact(1200)).toBe('1.2k');
    expect(formatCompact(1250)).toBe('1.3k');
    expect(formatCompact(1999)).toBe('2.0k');
  });

  it('renders values of 10000 and above rounded to an integer with a k suffix', () => {
    expect(formatCompact(10000)).toBe('10k');
    expect(formatCompact(12450)).toBe('12k');
    expect(formatCompact(125000)).toBe('125k');
  });

  it('accepts the 9999 boundary artifact', () => {
    expect(formatCompact(9999)).toBe('10.0k');
  });
});
