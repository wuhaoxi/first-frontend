import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SectionSkeleton } from '@/components/home/SectionSkeleton';

describe('SectionSkeleton', () => {
  it('renders hero variant with exactly 1 skeleton item', () => {
    const { container } = render(<SectionSkeleton variant="hero" />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(1);
  });

  it('renders grid variant with 6 skeleton items by default', () => {
    const { container } = render(<SectionSkeleton variant="grid" />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(6);
  });

  it('renders grid variant with custom itemCount', () => {
    const { container } = render(<SectionSkeleton variant="grid" itemCount={4} />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(4);
  });

  it('renders list variant with 5 skeleton items', () => {
    const { container } = render(<SectionSkeleton variant="list" />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(5);
  });

  it('renders banner variant with 1 skeleton item', () => {
    const { container } = render(<SectionSkeleton variant="banner" />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(1);
  });

  it('clamps itemCount to maximum of 12', () => {
    const { container } = render(<SectionSkeleton variant="grid" itemCount={15} />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBeLessThanOrEqual(12);
  });

  it('clamps itemCount to minimum of 1', () => {
    const { container } = render(<SectionSkeleton variant="grid" itemCount={0} />);
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });
});
