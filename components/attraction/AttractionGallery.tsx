'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttractionGalleryProps {
  name: string;
  gallery: string[];
  coverImageUrl: string | null;
}

export default function AttractionGallery({ name, gallery, coverImageUrl }: AttractionGalleryProps) {
  const [index, setIndex] = useState(0);

  const images = gallery.length > 0 ? gallery : coverImageUrl ? [coverImageUrl] : [];
  const total = images.length;
  const current = index < total ? index : 0;
  const hasControls = total >= 2;

  const goTo = (nextIndex: number) => setIndex(((nextIndex % total) + total) % total);

  return (
    <div
      data-testid="attraction-gallery"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted lg:aspect-[21/9]"
    >
      {total > 0 ? (
        <>
          <Image
            src={images[current]}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
            className="object-cover"
          />

          {hasControls && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => goTo(current - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => goTo(current + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {images.map((url, i) => (
                  <button
                    key={`${i}-${url}`}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    aria-current={i === current ? 'true' : undefined}
                    onClick={() => goTo(i)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      i === current ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                    )}
                  />
                ))}
              </div>

              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                {current + 1} / {total}
              </span>
            </>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-medium text-muted-foreground">{name.charAt(0)}</span>
        </div>
      )}
    </div>
  );
}
