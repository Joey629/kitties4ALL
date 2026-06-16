import { getLightingForTime } from '../../hooks/useTimeCycle';
import type { TimeOfDay } from '../../types/cat';

interface SceneLightingProps {
  timeOfDay: TimeOfDay;
  prevTime?: TimeOfDay;
  transition?: number;
}

export function SceneLighting({
  timeOfDay,
  prevTime,
  transition = 1,
}: SceneLightingProps) {
  const lighting = getLightingForTime(timeOfDay, prevTime, transition);

  return (
    <>
      <ambientLight intensity={lighting.ambient + 0.15} color={lighting.color} />
      <hemisphereLight
        args={[lighting.color, '#d4b896', 0.6]}
      />
      <directionalLight
        position={[4, 8, 6]}
        intensity={lighting.directional * 0.7}
        color={lighting.color}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.001}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight
        position={[-3, 5, -2]}
        intensity={0.25}
        color="#fff8f0"
      />
      <pointLight
        position={[0, 4, 2]}
        intensity={0.15}
        color="#ffffff"
        distance={12}
      />
      {(timeOfDay === 'evening' || timeOfDay === 'night') && (
        <pointLight
          position={[0, 2.5, 0]}
          intensity={timeOfDay === 'night' ? 0.15 : 0.25}
          color="#ffd8a8"
          distance={10}
        />
      )}
    </>
  );
}

export function SceneFog({
  timeOfDay,
  prevTime,
  transition = 1,
}: SceneLightingProps) {
  const lighting = getLightingForTime(timeOfDay, prevTime, transition);
  return <fog attach="fog" args={[lighting.fog, 14, 28]} />;
}
