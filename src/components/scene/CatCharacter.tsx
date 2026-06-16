import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { CatActivity, CatAppearance } from '../../types/cat';
import { toonProps } from './materials';

interface CatCharacterProps {
  appearance: CatAppearance;
  activity: CatActivity;
  isHovered: boolean;
  isSelected: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

const SIZE_SCALE = { kitten: 0.85, medium: 1.05, large: 1.25 };

export function CatCharacter({
  appearance,
  activity,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: CatCharacterProps) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const tailRef = useRef<Group>(null);
  const earLRef = useRef<Group>(null);
  const earRRef = useRef<Group>(null);
  const legFL = useRef<Group>(null);
  const legFR = useRef<Group>(null);
  const legBL = useRef<Group>(null);
  const legBR = useRef<Group>(null);
  const pupilL = useRef<Mesh>(null);
  const pupilR = useRef<Mesh>(null);
  const sparkleRef = useRef<Group>(null);

  const scale = SIZE_SCALE[appearance.size];
  const { bodyColor, bellyColor, accentColor, eyeColor, hasStripes } = appearance;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const body = bodyRef.current;
    const head = headRef.current;
    const tail = tailRef.current;
    const root = rootRef.current;
    const sparkle = sparkleRef.current;

    if (!body || !head || !tail || !root) return;

    const breathe = Math.sin(t * 1.8) * 0.012;
    const react = isHovered || isSelected;

    body.scale.set(1, 1, 1);
    body.position.y = 0;
    head.rotation.set(0, 0, 0);
    head.position.set(0.1 * scale, 0.08 * scale, 0);
    tail.rotation.set(0.3, 0, 0.4);

    if (sparkle) {
      sparkle.visible = react;
      sparkle.position.y = 0.55 * scale + Math.sin(t * 3) * 0.03;
      sparkle.rotation.y = t * 0.5;
    }

    switch (activity) {
      case 'sleeping':
        body.rotation.z = 0.12;
        body.position.y = 0.03 + Math.sin(t * 0.8) * 0.006;
        body.scale.set(1.1, 0.6, 0.8);
        head.rotation.x = 0.4;
        head.position.y = 0.04 * scale;
        tail.rotation.z = 0.15 + Math.sin(t * 0.6) * 0.06;
        break;
      case 'stretching':
        body.scale.set(1.05 + Math.sin(t * 1.2) * 0.06, 0.7, 0.75);
        body.position.y = 0.05 + Math.sin(t * 1.2) * 0.015;
        head.rotation.x = -0.3 + Math.sin(t * 1.2) * 0.15;
        head.position.y = (0.15 + Math.sin(t * 1.2) * 0.03) * scale;
        tail.rotation.z = 0.5 + Math.sin(t * 1.5) * 0.12;
        break;
      case 'playing':
        body.position.y = 0.08 + Math.abs(Math.sin(t * 2.5)) * 0.08;
        body.rotation.z = Math.sin(t * 1.8) * 0.06;
        tail.rotation.z = Math.sin(t * 4) * 0.3 + 0.25;
        head.rotation.y = Math.sin(t * 2) * 0.2;
        if (legFL.current) legFL.current.rotation.x = Math.sin(t * 5) * 0.5;
        if (legFR.current) legFR.current.rotation.x = Math.sin(t * 5 + 1) * 0.5;
        break;
      case 'walking':
      case 'exploring':
        body.position.y = 0.08 + Math.abs(Math.sin(t * 3.5)) * 0.02;
        if (legFL.current) legFL.current.rotation.x = Math.sin(t * 3.5) * 0.3;
        if (legFR.current) legFR.current.rotation.x = Math.sin(t * 3.5 + Math.PI) * 0.3;
        if (legBL.current) legBL.current.rotation.x = Math.sin(t * 3.5 + Math.PI) * 0.2;
        if (legBR.current) legBR.current.rotation.x = Math.sin(t * 3.5) * 0.2;
        tail.rotation.z = 0.25 + Math.sin(t * 2.5) * 0.15;
        head.rotation.y = Math.sin(t * 0.6) * 0.12;
        break;
      case 'hiding':
        body.scale.set(0.85, 0.65, 0.7);
        body.position.y = 0.02;
        head.rotation.x = 0.15;
        head.rotation.y = -0.25 + Math.sin(t * 0.5) * 0.08;
        tail.rotation.z = -0.15;
        break;
      case 'looking_around':
        head.rotation.y = Math.sin(t * 0.7) * 0.35;
        body.position.y = 0.08 + breathe;
        tail.rotation.z = 0.25 + Math.sin(t * 1.2) * 0.1;
        break;
      default:
        body.position.y = 0.06 + breathe;
        tail.rotation.z = 0.3 + Math.sin(t * 1) * 0.08;
        head.rotation.y = Math.sin(t * 0.5) * 0.06;
        break;
    }

    if (react) {
      head.rotation.y += 0.2 + Math.sin(t * 2) * 0.04;
      head.rotation.x -= 0.08;
      if (earLRef.current) earLRef.current.rotation.z = 0.2 + Math.sin(t * 4) * 0.04;
      if (earRRef.current) earRRef.current.rotation.z = -0.2 - Math.sin(t * 4) * 0.04;
      root.position.y = Math.sin(t * 2.5) * 0.015;
    }

    if (pupilL.current && pupilR.current) {
      const lookX = react ? 0.012 : Math.sin(t * 0.4) * 0.003;
      pupilL.current.position.x = 0.01 + lookX;
      pupilR.current.position.x = 0.01 + lookX;
    }
  });

  const eyesClosed = activity === 'sleeping';
  const bodyY = activity === 'sleeping' || activity === 'hiding' ? 0.03 : 0.06;

  return (
    <group
      ref={rootRef}
      scale={scale}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onPointerOut();
        document.body.style.cursor = 'default';
      }}
    >
      <group ref={sparkleRef} visible={false} position={[0.15, 0.55 * scale, 0]}>
        <mesh rotation={[0, 0, 0.8]}>
          <boxGeometry args={[0.04, 0.004, 0.04]} />
          <meshBasicMaterial color="#f0c848" />
        </mesh>
        <mesh rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.04, 0.004, 0.04]} />
          <meshBasicMaterial color="#f0c848" />
        </mesh>
      </group>

      <group ref={bodyRef} position={[0, bodyY, 0]}>
        <mesh castShadow scale={[0.85, 0.75, 0.8]}>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial {...toonProps(bodyColor)} />
        </mesh>
        <mesh position={[0, -0.05, 0.03]} scale={[0.55, 0.4, 0.5]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial {...toonProps(bellyColor)} />
        </mesh>

        {hasStripes && (
          <>
            <mesh position={[0, 0.02, 0.1]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.035, 0.14, 0.015]} />
              <meshStandardMaterial {...toonProps(accentColor)} />
            </mesh>
            <mesh position={[-0.04, 0, -0.07]} rotation={[-0.1, 0.3, 0]}>
              <boxGeometry args={[0.025, 0.1, 0.015]} />
              <meshStandardMaterial {...toonProps(accentColor)} />
            </mesh>
          </>
        )}

        <group ref={headRef} position={[0.1, 0.08, 0]} scale={1.35}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial {...toonProps(bodyColor)} />
          </mesh>

          <mesh position={[0.08, -0.03, 0.07]} scale={[0.45, 0.5, 0.35]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial {...toonProps(bellyColor)} />
          </mesh>
          <mesh position={[0.08, -0.03, -0.07]} scale={[0.45, 0.5, 0.35]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial {...toonProps(bellyColor)} />
          </mesh>

          <group ref={earLRef} position={[-0.02, 0.12, 0.09]}>
            <mesh rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.05, 0.1, 6]} />
              <meshStandardMaterial {...toonProps(bodyColor)} />
            </mesh>
            <mesh position={[0, -0.01, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.028, 0.05, 6]} />
              <meshStandardMaterial {...toonProps(accentColor)} />
            </mesh>
          </group>
          <group ref={earRRef} position={[-0.02, 0.12, -0.09]}>
            <mesh rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.05, 0.1, 6]} />
              <meshStandardMaterial {...toonProps(bodyColor)} />
            </mesh>
            <mesh position={[0, -0.01, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.028, 0.05, 6]} />
              <meshStandardMaterial {...toonProps(accentColor)} />
            </mesh>
          </group>

          <group position={[0.1, 0.02, 0.065]}>
            <mesh>
              <sphereGeometry args={[eyesClosed ? 0.006 : 0.038, 10, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            {!eyesClosed && (
              <>
                <mesh ref={pupilL} position={[0.01, -0.005, 0.012]}>
                  <sphereGeometry args={[0.022, 10, 10]} />
                  <meshStandardMaterial color={eyeColor} roughness={0.15} />
                </mesh>
                <mesh position={[0.01, -0.005, 0.018]}>
                  <sphereGeometry args={[0.008, 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </mesh>
              </>
            )}
          </group>
          <group position={[0.1, 0.02, -0.065]}>
            <mesh>
              <sphereGeometry args={[eyesClosed ? 0.006 : 0.038, 10, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            {!eyesClosed && (
              <>
                <mesh ref={pupilR} position={[0.01, -0.005, 0.012]}>
                  <sphereGeometry args={[0.022, 10, 10]} />
                  <meshStandardMaterial color={eyeColor} roughness={0.15} />
                </mesh>
                <mesh position={[0.01, -0.005, 0.018]}>
                  <sphereGeometry args={[0.008, 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </mesh>
              </>
            )}
          </group>

          <mesh position={[0.14, -0.01, 0]}>
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshStandardMaterial {...toonProps(accentColor)} />
          </mesh>
        </group>

        <group ref={tailRef} position={[-0.2, 0.03, 0]} rotation={[0.2, 0, 0.45]}>
          <mesh castShadow rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.03, 0.22, 4, 8]} />
            <meshStandardMaterial {...toonProps(bodyColor)} />
          </mesh>
        </group>

        {[
          { ref: legFL, pos: [0.07, -0.1, 0.07] as const },
          { ref: legFR, pos: [0.07, -0.1, -0.07] as const },
          { ref: legBL, pos: [-0.07, -0.1, 0.07] as const },
          { ref: legBR, pos: [-0.07, -0.1, -0.07] as const },
        ].map(({ ref, pos }, i) => (
          <group key={i} ref={ref} position={pos}>
            <mesh castShadow>
              <capsuleGeometry args={[0.025, 0.07, 4, 6]} />
              <meshStandardMaterial {...toonProps(bodyColor)} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
