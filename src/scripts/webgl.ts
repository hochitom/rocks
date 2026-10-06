/**
 * True if the browser can run Three.js, which needs WebGL 2 (WebGL 1 alone is not enough).
 * Used by the 3D pin and, before the first paint, by the map page — which inlines this very function
 * with `toString()`, so it must stay self-contained: no imports, no names from outside.
 */
export function hasWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    // Give the probe's context back right away: browsers allow only a few at a time.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
