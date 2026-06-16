import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { getCatGalleryPhotos } from '@/shared/catGallery';
import type { AdminCat } from '@/admin/types';

interface CatPhotoGalleryProps {
  cat: AdminCat;
  className?: string;
}

export function CatPhotoGallery({ cat, className }: CatPhotoGalleryProps) {
  const photos = useMemo(
    () => getCatGalleryPhotos(cat.id, cat.photo),
    [cat.id, cat.photo],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = photos[activeIndex] ?? photos[0];

  if (!activePhoto) return null;

  const goTo = (index: number) => {
    setActiveIndex((index + photos.length) % photos.length);
  };

  return (
    <div className={cn('w-full sm:w-60 lg:w-72', className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted/30">
        {activePhoto.src ? (
          <img
            key={activePhoto.id}
            src={activePhoto.src}
            alt={`${cat.name} — ${activePhoto.label}`}
            className={cn('h-full w-full transition-transform duration-300', activePhoto.imageClassName)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-7xl" aria-hidden>
              {activePhoto.fallbackEmoji}
            </span>
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground shadow-sm">
              {activeIndex + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-colors',
                  selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                )}
                aria-label={`View ${photo.label}`}
                aria-current={selected}
              >
                {photo.src ? (
                  <img
                    src={photo.src}
                    alt=""
                    className={cn('h-full w-full', photo.imageClassName)}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-muted/40 text-xl">
                    {photo.fallbackEmoji}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-center text-xs text-muted-foreground">{activePhoto.label}</p>
    </div>
  );
}
