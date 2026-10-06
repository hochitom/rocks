/**
 * The site's colours for code that can't read CSS variables: the globe (Three.js) and the preview
 * images (satori). Must match the tokens in `src/styles/global.css` (see docs/design.md).
 */
export const palette = {
  /** --velvet */
  velvet: '#1c1315',
  /** --felt */
  felt: '#2b1b1f',
  /** --brass */
  brass: '#c9a24b',
  /** --bone */
  bone: '#ede3d1',
  /** --smoke */
  smoke: '#9a8c84',
  /** --lamp: only as the light cone, never as a surface. */
  lamp: '#ffe7b8',
  /** --brass-highlight */
  brassHighlight: '#e3c27a',
  /** --globe-velvet: the globe's sphere, a shade lighter than the velvet behind it. */
  globeVelvet: '#24171a',
} as const;

/** A palette colour (`#rrggbb`) with transparency, as CSS `rgba()`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
