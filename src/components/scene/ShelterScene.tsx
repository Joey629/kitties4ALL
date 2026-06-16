import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { TimeOfDay, WorldCat } from '../../types/cat';
import { getLightingForTime } from '../../hooks/useTimeCycle';
import { getFosteredCats } from '../../hooks/useCatWorldState';
import { CatEntity } from './CatEntity';
import { EnvironmentObject } from './EnvironmentObject';
import { SceneLighting, SceneFog } from './SceneLighting';
import { SceneLoader } from './SceneLoader';

interface ShelterSceneProps {
  cats: WorldCat[];
  selectedCatId: string | null;
  timeOfDay: TimeOfDay;
  prevTime: TimeOfDay;
  transition: number;
  onSelectCat: (cat: WorldCat) => void;
  onDeselect: () => void;
}

function SceneContent({
  cats,
  selectedCatId,
  timeOfDay,
  prevTime,
  transition,
  onSelectCat,
  onDeselect,
}: ShelterSceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const lighting = getLightingForTime(timeOfDay, prevTime, transition);
  const fosteredCats = getFosteredCats(cats);

  return (
    <>
      <color attach="background" args={[lighting.bg]} />
      <SceneFog timeOfDay={timeOfDay} prevTime={prevTime} transition={transition} />
      <SceneLighting
        timeOfDay={timeOfDay}
        prevTime={prevTime}
        transition={transition}
      />

      <EnvironmentObject
        windowGlow={lighting.windowGlow}
        warmth={lighting.warmth}
        timeOfDay={timeOfDay}
        fosteredCats={fosteredCats}
      />

      {cats.map((cat) => (
        <CatEntity
          key={cat.id}
          cat={cat}
          isHovered={hoveredId === cat.id}
          isSelected={selectedCatId === cat.id}
          onHover={setHoveredId}
          onSelect={onSelectCat}
        />
      ))}

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.2}
        scale={12}
        blur={3}
        far={4}
        color="#5c4838"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        onClick={onDeselect}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.6}
        minDistance={8}
        maxDistance={13}
        target={[0, 0.6, 0]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.35}
        zoomSpeed={0.4}
      />
    </>
  );
}

export function ShelterScene(props: ShelterSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [7, 8, 7], fov: 38 }}
      className="w-full h-full"
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <Suspense fallback={<SceneLoader />}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
