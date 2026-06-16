import { getCatImageUrl } from '@/shared/catImages';

export interface CatGalleryPhoto {
  id: string;
  src: string | null;
  label: string;
  fallbackEmoji: string;
  /** Visual variation when reusing the same asset */
  imageClassName?: string;
}

const GALLERY_SCENES = [
  { label: 'Profile', imageClassName: 'object-contain object-bottom scale-100' },
  { label: 'Intake photo', imageClassName: 'object-cover object-center scale-105' },
  { label: 'Play area', imageClassName: 'object-cover object-[center_35%] scale-110' },
  { label: 'Weekly check-in', imageClassName: 'object-contain object-top scale-95' },
] as const;

export function getCatGalleryPhotos(catId: string, fallbackEmoji = '🐱'): CatGalleryPhoto[] {
  const primary = getCatImageUrl(catId);

  return GALLERY_SCENES.map((scene, index) => ({
    id: `${catId}-photo-${index}`,
    src: primary,
    label: scene.label,
    fallbackEmoji,
    imageClassName: scene.imageClassName,
  }));
}
