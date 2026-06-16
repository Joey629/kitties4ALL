import { motion } from 'framer-motion';
import type { CatActivity, CatAppearance } from '../../types/cat';

interface IllustratedCatProps {
  image: string;
  appearance: CatAppearance;
  activity: CatActivity;
  name: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  scale?: number;
  flip?: boolean;
}

const BREED_SCALE = { kitten: 0.96, medium: 1, large: 1.04 };
const BASE_HEIGHT = 104;

export function IllustratedCat({
  image,
  appearance,
  activity,
  name,
  isSelected,
  isHovered,
  onClick,
  onHover,
  scale = 1,
  flip = false,
}: IllustratedCatProps) {
  const sleeping = activity === 'sleeping' || activity === 'resting';
  const hiding = activity === 'hiding';
  const renderScale = scale * BREED_SCALE[appearance.size];
  const imgHeight = BASE_HEIGHT * renderScale;

  return (
    <div className="relative" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <motion.button
        type="button"
        className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
        style={{ transformOrigin: 'center bottom' }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        whileHover={{ scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        aria-label={`Meet ${name}`}
      >
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-white text-[11px] font-semibold text-warm-brown shadow-sm border border-warm-brown/15 z-10"
          >
            {name}
          </motion.div>
        )}

        {isSelected && (
          <div className="absolute -inset-2 rounded-full border-2 border-soft-orange/45 pointer-events-none" />
        )}

        <CatImage
          src={image}
          height={imgHeight}
          sleeping={sleeping}
          hiding={hiding}
        />
      </motion.button>
    </div>
  );
}

function CatImage({
  src,
  height,
  sleeping,
  hiding,
}: {
  src: string;
  height: number;
  sleeping: boolean;
  hiding: boolean;
}) {
  return (
    <div
      className="relative flex items-end justify-center"
      style={{ height, minWidth: height * 0.75 }}
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%] bg-[#3D3020]/12 blur-[2px]"
        style={{ width: height * 0.55, height: height * 0.08 }}
        aria-hidden
      />
      <img
        src={src}
        alt=""
        draggable={false}
        className={`relative z-[1] h-full w-auto max-w-none object-contain object-bottom select-none pointer-events-none drop-shadow-[0_10px_18px_rgba(61,48,32,0.22)] transition-opacity duration-300 ${
          hiding ? 'opacity-70 scale-95' : ''
        } ${sleeping ? 'brightness-[0.97] saturate-[0.92]' : ''}`}
      />
    </div>
  );
}

export function IllustratedCatPortrait({
  image,
  size = 96,
}: {
  image: string;
  size?: number;
}) {
  return (
    <img
      src={image}
      alt=""
      draggable={false}
      className="h-full w-full object-contain object-bottom select-none pointer-events-none"
      style={{ maxHeight: size, maxWidth: size }}
    />
  );
}
