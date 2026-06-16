import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Cat } from '../../types/cat';
import type { SceneCat } from '../data/sceneCats';
import { ShelterScene } from './ShelterScene';
import { IllustratedCat } from './IllustratedCat';
import { DustParticles } from './DustParticles';
import { SunlightEffect } from './SunlightEffect';

interface IllustratedShelterProps {
  cats: SceneCat[];
  selectedCatId: string | null;
  onSelectCat: (cat: Cat) => void;
  onDeselect: () => void;
}

export function IllustratedShelter({
  cats,
  selectedCatId,
  onSelectCat,
  onDeselect,
}: IllustratedShelterProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full h-dvh overflow-hidden"
      onClick={onDeselect}
    >
      <ShelterScene />
      <SunlightEffect />
      <DustParticles />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {cats.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="absolute"
            style={{
              left: `${cat.spot.x}%`,
              top: `${cat.spot.y}%`,
              transform: 'translate(-50%, -92%)',
              zIndex:
                10 +
                Math.round(cat.spot.y * 0.25) +
                (selectedCatId === cat.id || hoveredId === cat.id ? 5 : 0),
            }}
          >
            <IllustratedCat
              image={cat.image}
              appearance={cat.appearance}
              activity={cat.activity}
              name={cat.name}
              isSelected={selectedCatId === cat.id}
              isHovered={hoveredId === cat.id}
              onClick={() => onSelectCat(cat)}
              onHover={(h) => setHoveredId(h ? cat.id : null)}
              scale={cat.spot.scale}
              flip={cat.spot.flip}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-warm-brown/50 text-center pointer-events-none font-medium"
      >
        Click a cat to discover their story
      </motion.p>
    </div>
  );
}
