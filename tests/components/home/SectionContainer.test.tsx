import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionContainer } from '@/components/home/SectionContainer';

describe('SectionContainer', () => {
  const defaultProps = {
    id: 'editors-picks' as const,
    state: { status: 'idle' as const },
  };

  it('renders a <section> element with the correct id', () => {
    const { container } = render(
      <SectionContainer {...defaultProps}>
        <div>Content</div>
      </SectionContainer>
    );
    const section = container.querySelector('section#editors-picks');
    expect(section).toBeInTheDocument();
  });

  it('renders an <h2> title when title prop is provided', () => {
    render(
      <SectionContainer {...defaultProps} title="Editor's Picks">
        <div>Content</div>
      </SectionContainer>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("Editor's Picks");
  });

  it('does not render an <h2> when title is not provided', () => {
    render(
      <SectionContainer {...defaultProps}>
        <div>Content</div>
      </SectionContainer>
    );
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders children when state is success', () => {
    render(
      <SectionContainer
        id="editors-picks"
        state={{ status: 'success', data: [] }}
      >
        <div>Success content</div>
      </SectionContainer>
    );
    expect(screen.getByText('Success content')).toBeInTheDocument();
  });

  it('renders SectionSkeleton when state is loading', () => {
    const { container } = render(
      <SectionContainer
        id="editors-picks"
        state={{ status: 'loading' }}
      >
        <div>Should not render</div>
      </SectionContainer>
    );
    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });

  it('renders SectionError when state is error', () => {
    const onRetry = vi.fn();
    render(
      <SectionContainer
        id="editors-picks"
        state={{ status: 'error', message: 'Failed to load' }}
        onRetry={onRetry}
      >
        <div>Should not render</div>
      </SectionContainer>
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });

  it('renders nothing visible when state is idle and no children', () => {
    const { container } = render(
      <SectionContainer id="editors-picks" state={{ status: 'idle' }} />
    );
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('maps section id to correct skeleton variant for grid sections', () => {
    const { container } = render(
      <SectionContainer
        id="popular-destinations"
        state={{ status: 'loading' }}
      />
    );
    const skeletons = container.querySelectorAll('[data-skeleton]');
    expect(skeletons.length).toBe(6); // grid variant default
  });

  it('supports custom className', () => {
    const { container } = render(
      <SectionContainer {...defaultProps} className="custom-class">
        <div>Content</div>
      </SectionContainer>
    );
    expect(container.querySelector('section')?.className).toContain('custom-class');
  });
});
