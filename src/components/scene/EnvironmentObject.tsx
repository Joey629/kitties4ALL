import { Text } from '@react-three/drei';
import type { TimeOfDay } from '../../types/cat';
import type { WorldCat } from '../../types/cat';
import { PALETTE, toonProps } from './materials';

interface EnvironmentObjectProps {
  windowGlow: string;
  warmth: number;
  timeOfDay: TimeOfDay;
  fosteredCats: WorldCat[];
}

function GrassRug() {
  return (
    <group position={[0, 0.015, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} scale={[2.8, 2.4, 1]}>
        <circleGeometry args={[1.3, 48]} />
        <meshStandardMaterial {...toonProps(PALETTE.sage)} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[0.6, 0.005, 0.4]} scale={[0.7, 0.5, 1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial {...toonProps(PALETTE.sageLight)} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, -0.2]} position={[-0.5, 0.005, -0.3]} scale={[0.55, 0.45, 1]}>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial {...toonProps(PALETTE.sageDark)} />
      </mesh>
    </group>
  );
}

function LargeCatTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 1.2, 12]} />
        <meshStandardMaterial {...toonProps(PALETTE.wood)} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.08, 0]} rotation={[0, i * 0.5, 0]}>
          <torusGeometry args={[0.24, 0.018, 6, 16]} />
          <meshStandardMaterial {...toonProps(PALETTE.rope)} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.06, 16]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
      </mesh>
      <mesh castShadow position={[0, 1.32, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
        <meshStandardMaterial {...toonProps(PALETTE.cream)} />
      </mesh>
      <mesh castShadow position={[0.35, 0.06, 0.2]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial {...toonProps(PALETTE.toyBlue)} />
      </mesh>
    </group>
  );
}

function TieredCatTree({ position }: { position: [number, number, number] }) {
  const levels = [
    { y: 0.5, x: 0, z: 0, ry: 0 },
    { y: 1.1, x: 0.3, z: 0.1, ry: 0.3 },
    { y: 1.7, x: -0.2, z: -0.1, ry: -0.2 },
  ];

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.8, 10]} />
        <meshStandardMaterial {...toonProps(PALETTE.wood)} />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.1, 0]}>
          <torusGeometry args={[0.1, 0.012, 4, 12]} />
          <meshStandardMaterial {...toonProps(PALETTE.rope)} />
        </mesh>
      ))}

      {levels.map((lvl, i) => (
        <group key={i} position={[lvl.x, lvl.y, lvl.z]} rotation={[0, lvl.ry, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.06, 8, 20, Math.PI]} />
            <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.35]} />
            <meshStandardMaterial {...toonProps(PALETTE.cream)} />
          </mesh>
        </group>
      ))}

      <mesh castShadow position={[0.4, 1.3, 0.3]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial {...toonProps(PALETTE.toyRed)} />
      </mesh>
    </group>
  );
}

function CatWheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.7, 0.05, 8, 32]} />
        <meshStandardMaterial {...toonProps(PALETTE.wood)} />
      </mesh>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.03, 6, 24]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62]}
            rotation={[0, angle, Math.PI / 2]}
          >
            <boxGeometry args={[0.04, 0.35, 0.06]} />
            <meshStandardMaterial {...toonProps(PALETTE.woodDark)} />
          </mesh>
        );
      })}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.3]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodDark)} />
      </mesh>
    </group>
  );
}

function PlushToy({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial {...toonProps(color)} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial {...toonProps(color)} />
      </mesh>
    </group>
  );
}

function WindowArea({ glow }: { glow: string }) {
  return (
    <group position={[0, 2.5, -5.9]}>
      <mesh>
        <boxGeometry args={[5, 2.8, 0.1]} />
        <meshStandardMaterial {...toonProps(PALETTE.wall)} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[4.4, 2.2, 0.02]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={0.25}
          roughness={0.5}
          transparent
          opacity={0.75}
        />
      </mesh>
      <mesh position={[0, -1.5, 0.3]} receiveShadow>
        <boxGeometry args={[4.5, 0.12, 0.5]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
      </mesh>
      <mesh position={[0, -1.35, 0.35]}>
        <boxGeometry args={[1.5, 0.06, 0.35]} />
        <meshStandardMaterial {...toonProps(PALETTE.cream)} />
      </mesh>
    </group>
  );
}

function FoodBowls({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.05, 14]} />
        <meshStandardMaterial {...toonProps('#c8dce8')} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 14]} />
        <meshStandardMaterial {...toonProps('#c67b3e')} />
      </mesh>
      <mesh castShadow position={[0.35, 0.04, 0]}>
        <cylinderGeometry args={[0.1, 0.09, 0.05, 14]} />
        <meshStandardMaterial {...toonProps('#c8dce8')} />
      </mesh>
      <mesh position={[0.35, 0.07, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 14]} />
        <meshStandardMaterial {...toonProps('#6ab0d4')} />
      </mesh>
    </group>
  );
}

function CozyNook({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.9]} />
        <meshStandardMaterial {...toonProps(PALETTE.cream)} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1, 0.04, 0.7]} />
        <meshStandardMaterial {...toonProps('#e8d0e0')} />
      </mesh>
    </group>
  );
}

function AdoptionWall({ fosteredCats }: { fosteredCats: WorldCat[] }) {
  return (
    <group position={[5.9, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[2, 1.4, 0.06]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
      </mesh>
      <Text position={[0, 0.55, 0.04]} fontSize={0.12} color={PALETTE.woodDark} anchorX="center">
        Adoption Wall
      </Text>
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.04]}>
          <boxGeometry args={[0.4, 0.5, 0.02]} />
          <meshStandardMaterial {...toonProps(PALETTE.cream)} />
        </mesh>
      ))}
      {fosteredCats.slice(0, 1).map((cat) => (
        <Text
          key={cat.id}
          position={[0, -0.45, 0.05]}
          fontSize={0.055}
          color={PALETTE.sageDark}
          anchorX="center"
          maxWidth={1.4}
          textAlign="center"
        >
          {`${cat.name} — in foster care ♥`}
        </Text>
      ))}
    </group>
  );
}

function VolunteerBoard() {
  const notes = ['Feed AM', 'Play time!', 'Litter PM', 'Willow ♥'];
  const colors = ['#fff8b8', '#ffc8c8', '#c8e8c8', '#c8d8f8'];
  return (
    <group position={[-5.9, 1.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[1.2, 0.9, 0.05]} />
        <meshStandardMaterial {...toonProps(PALETTE.wood)} />
      </mesh>
      <Text position={[0, 0.38, 0.03]} fontSize={0.08} color={PALETTE.woodDark} anchorX="center">
        Volunteers
      </Text>
      {notes.map((note, i) => (
        <group key={i} position={[-0.3 + (i % 2) * 0.55, 0.05 - Math.floor(i / 2) * 0.28, 0.03]}>
          <mesh rotation={[0, 0, (i - 1.5) * 0.06]}>
            <boxGeometry args={[0.3, 0.18, 0.01]} />
            <meshStandardMaterial color={colors[i]} roughness={0.9} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.04} color="#555" anchorX="center" anchorY="middle">
            {note}
          </Text>
        </group>
      ))}
    </group>
  );
}

export function EnvironmentObject({
  windowGlow,
  fosteredCats,
}: EnvironmentObjectProps) {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial {...toonProps(PALETTE.woodLight)} />
      </mesh>

      <GrassRug />

      <mesh receiveShadow position={[0, 3.5, -6]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial {...toonProps(PALETTE.wall)} />
      </mesh>
      <mesh receiveShadow position={[-7, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial {...toonProps('#ede4d8')} />
      </mesh>
      <mesh receiveShadow position={[7, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial {...toonProps('#ede4d8')} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 3.5, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial {...toonProps('#faf6f0')} />
      </mesh>

      <WindowArea glow={windowGlow} />
      <LargeCatTree position={[-3.5, 0, -1.5]} />
      <TieredCatTree position={[3.8, 0, -0.5]} />
      <CatWheel position={[0, 0.7, -3.5]} />

      <PlushToy position={[0.8, 0.08, 0.6]} color={PALETTE.toyBlue} />
      <PlushToy position={[-0.5, 0.08, 1.2]} color={PALETTE.toyRed} />
      <PlushToy position={[1.5, 0.08, -0.3]} color={PALETTE.toyGreen} />
      <PlushToy position={[-1.2, 0.08, -0.8]} color={PALETTE.toyYellow} />
      <PlushToy position={[0.2, 0.08, -1]} color={PALETTE.toyRed} />

      <FoodBowls position={[-2.5, 0, 2.8]} />
      <CozyNook position={[3.5, 0, 2.5]} />
      <AdoptionWall fosteredCats={fosteredCats} />
      <VolunteerBoard />
    </group>
  );
}
