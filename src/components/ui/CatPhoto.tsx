import { cn } from '@/admin/lib/utils';
import { getCatImageUrl } from '@/shared/catImages';
import { IllustratedCatPortrait } from '@/experience/components/IllustratedCat';

interface CatPhotoProps {
  catId: string;
  name: string;
  image?: string;
  accentColor?: string;
  className?: string;
  frameClassName?: string;
}

export function CatPhoto({
  catId,
  name,
  image,
  accentColor = '#9AA0A8',
  className,
  frameClassName,
}: CatPhotoProps) {
  const src = getCatImageUrl(catId) ?? image ?? null;

  return (
    <div
      className={cn(
        'flex shrink-0 items-end justify-center overflow-hidden rounded-xl border border-warm-brown/10',
        frameClassName,
      )}
      style={{ backgroundColor: accentColor + '33' }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('h-full w-full object-contain object-bottom', className)}
        />
      ) : (
        <IllustratedCatPortrait image={image ?? ''} size={56} />
      )}
    </div>
  );
}
