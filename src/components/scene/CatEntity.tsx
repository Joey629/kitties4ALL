import { Text } from '@react-three/drei';
import type { WorldCat } from '../../types/cat';
import { CatCharacter } from './CatCharacter';

interface CatEntityProps {
  cat: WorldCat;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (cat: WorldCat) => void;
}

export function CatEntity({
  cat,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}: CatEntityProps) {
  if (!cat.isPresent) return null;

  const { position, appearance, activity, name, preferredSpot } = cat;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[0, position.rotation ?? 0, 0]}
    >
      <CatCharacter
        appearance={appearance}
        activity={activity}
        isHovered={isHovered}
        isSelected={isSelected}
        onPointerOver={() => onHover(cat.id)}
        onPointerOut={() => onHover(null)}
        onClick={() => onSelect(cat)}
      />

      {(isHovered || isSelected) && (
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.1}
          color={isSelected ? '#5c8a65' : '#8b6f47'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#faf6f0"
          maxWidth={1.4}
          textAlign="center"
        >
          {isSelected ? preferredSpot : name}
        </Text>
      )}
    </group>
  );
}
