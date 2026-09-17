import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttractionGallery from '@/components/attraction/AttractionGallery';

const THREE = ['/fc-1.jpg', '/fc-2.jpg', '/fc-3.jpg'];

function srcOf(): string {
  return screen.getByRole('img').getAttribute('src') ?? '';
}

describe('AttractionGallery', () => {
  it('renders gallery images through next/image with sizes and a fixed-aspect container', () => {
    const { container } = render(
      <AttractionGallery name="Forbidden City" gallery={THREE} coverImageUrl={null} />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Forbidden City');
    expect(srcOf()).toContain('fc-1.jpg');
    expect(img).toHaveAttribute('sizes');
    expect(img.className).toContain('object-cover');

    const gallery = container.querySelector('[data-testid="attraction-gallery"]');
    expect(gallery?.className).toContain('aspect-[4/3]');
    expect(gallery?.className).toContain('lg:aspect-[21/9]');
  });

  it('falls back to the cover when the gallery is empty', () => {
    render(<AttractionGallery name="Forbidden City" gallery={[]} coverImageUrl="/cover.jpg" />);

    expect(srcOf()).toContain('cover.jpg');
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
  });

  it('falls back to the letter placeholder when gallery and cover are both empty', () => {
    render(<AttractionGallery name="Forbidden City" gallery={[]} coverImageUrl={null} />);

    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
  });

  it('renders arrows, one dot per image, the active dot marker and the counter with multiple images', () => {
    render(<AttractionGallery name="Forbidden City" gallery={THREE} coverImageUrl={null} />);

    expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to image 1' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Go to image 2' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Go to image 3' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('renders no carousel controls or counter for a single image', () => {
    render(<AttractionGallery name="Forbidden City" gallery={['/fc-1.jpg']} coverImageUrl={null} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Go to image/ })).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('advances and wraps to the first image when clicking Next on the last', async () => {
    render(<AttractionGallery name="Forbidden City" gallery={THREE} coverImageUrl={null} />);

    const next = screen.getByRole('button', { name: 'Next image' });

    await userEvent.click(next);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(srcOf()).toContain('fc-2.jpg');

    await userEvent.click(next);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    await userEvent.click(next);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(srcOf()).toContain('fc-1.jpg');
  });

  it('wraps to the last image when clicking Previous on the first', async () => {
    render(<AttractionGallery name="Forbidden City" gallery={THREE} coverImageUrl={null} />);

    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(srcOf()).toContain('fc-3.jpg');
  });

  it('jumps to a specific image when clicking a dot and moves the active marker', async () => {
    render(<AttractionGallery name="Forbidden City" gallery={THREE} coverImageUrl={null} />);

    await userEvent.click(screen.getByRole('button', { name: 'Go to image 3' }));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(srcOf()).toContain('fc-3.jpg');
    expect(screen.getByRole('button', { name: 'Go to image 3' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Go to image 1' })).not.toHaveAttribute('aria-current');
  });
});
