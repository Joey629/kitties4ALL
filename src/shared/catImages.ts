import { cats } from '@/data/cats';

const imageById = new Map(cats.map((cat) => [cat.id, cat.image]));

export function getCatImageUrl(catId: string | null | undefined): string | null {
  if (!catId) return null;
  const url = imageById.get(catId);
  return url?.trim() ? url : null;
}
