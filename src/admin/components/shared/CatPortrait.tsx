import { cn } from '@/admin/lib/utils';
import { cats } from '@/data/cats';
import { IllustratedCatPortrait } from '@/experience/components/IllustratedCat';

interface CatPortraitProps {
  catId: string;
  photo?: string;
  size?: number;
  className?: string;
}

export function CatPortrait({ catId, photo = '🐱', size = 112, className }: CatPortraitProps) {
  const publicCat = cats.find((c) => c.id === catId);

  if (publicCat?.appearance) {
    const { appearance } = publicCat;
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-border shadow-sm shrink-0 overflow-hidden',
          className
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: `${appearance.accentColor}22`,
        }}
        aria-hidden
      >
        <IllustratedCatPortrait image={publicCat.image} size={Math.round(size * 0.9)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl bg-primary/8 border border-border shrink-0',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {photo}
    </div>
  );
}
