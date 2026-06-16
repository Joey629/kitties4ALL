import * as THREE from 'three';

export const PALETTE = {
  wood: '#d4b896',
  woodDark: '#b8956a',
  woodLight: '#e8d4b8',
  rope: '#f5f0e8',
  sage: '#7daa82',
  sageDark: '#5c8a65',
  sageLight: '#a8c8a8',
  cream: '#faf6f0',
  wall: '#f5ebe0',
  toyBlue: '#6ab0d4',
  toyRed: '#e85a5a',
  toyGreen: '#6bc96b',
  toyYellow: '#f0c848',
};

export function softMaterial(color: string, opts?: { emissive?: string; emissiveIntensity?: number }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.02,
    emissive: opts?.emissive ?? color,
    emissiveIntensity: opts?.emissiveIntensity ?? 0.04,
  });
}

export function woodMaterial(color = PALETTE.wood) {
  return softMaterial(color, { emissive: color, emissiveIntensity: 0.06 });
}

export function toonProps(color: string) {
  return { color, roughness: 0.78, metalness: 0.01 };
}
