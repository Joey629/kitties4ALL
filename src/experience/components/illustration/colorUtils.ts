function parseHex(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** factor < 0 darkens, factor > 0 lightens */
export function shade(hex: string, factor: number): string {
  const { r, g, b } = parseHex(hex);
  const mix = (channel: number) =>
    Math.min(255, Math.max(0, Math.round(channel + (factor < 0 ? channel * factor : (255 - channel) * factor))));
  return toHex(mix(r), mix(g), mix(b));
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
