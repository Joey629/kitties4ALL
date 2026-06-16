import { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { PICKUP_PHOTO_COUNT } from '../lib/pickupPhotos';

interface PickupPhotoCaptureProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

function toSlots(photos: string[]) {
  return Array.from({ length: PICKUP_PHOTO_COUNT }, (_, index) => photos[index] ?? null);
}

function fromSlots(slots: Array<string | null>) {
  return slots.filter((photo): photo is string => Boolean(photo));
}

export function PickupPhotoCapture({ photos, onChange, disabled }: PickupPhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextSlotRef = useRef(0);
  const [slots, setSlots] = useState<Array<string | null>>(() => toSlots(photos));

  useEffect(() => {
    setSlots(toSlots(photos));
  }, [photos]);

  const updateSlots = (nextSlots: Array<string | null>) => {
    setSlots(nextSlots);
    onChange(fromSlots(nextSlots));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    const slot = nextSlotRef.current;
    const next: Array<string | null> = [...slots];
    next[slot] = preview;
    updateSlots(next);

    event.target.value = '';
  };

  const openPicker = (slot: number) => {
    if (disabled) return;
    nextSlotRef.current = slot;
    fileInputRef.current?.click();
  };

  const removePhoto = (slot: number) => {
    const next: Array<string | null> = [...slots];
    next[slot] = null;
    updateSlots(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Field photos
        </p>
        <p className="text-xs text-muted-foreground">
          {fromSlots(slots).length}/{PICKUP_PHOTO_COUNT}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Take 3 photos at pickup — face, full body, and carrier or location for shelter comparison.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-3 gap-2">
        {slots.map((photo, slot) => {
          const labels = ['Face', 'Full body', 'Carrier / scene'];

          return (
            <div
              key={slot}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border border-dashed border-border bg-muted/30',
                disabled && 'opacity-60',
              )}
            >
              {photo ? (
                <>
                  <img src={photo} alt={`Pickup photo ${slot + 1}`} className="h-full w-full object-cover" />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removePhoto(slot)}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow-sm"
                      aria-label={`Remove photo ${slot + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => openPicker(slot)}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center active:scale-[0.98]"
                >
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">{labels[slot]}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
