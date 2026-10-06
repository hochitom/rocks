// The plectrum pin (public/logo.svg) as PNG, for places that can't show the SVG: the iOS
// home-screen icon and the preview images.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { palette } from './palette';

/** Width ÷ height of the plectrum, from the SVG's viewBox (120 × 132). */
export const LOGO_ASPECT = 120 / 132;

export const TOUCH_ICON_SIZE = 180;

/** The plectrum, `height` px high, on a transparent ground. */
export async function logoPng(height: number): Promise<Buffer> {
  // The build runs in the project folder, so public/ resolves from there, wherever the bundled code lands.
  const svg = await readFile(resolve('public/logo.svg'));
  // Rendered at a density that is at least the target size, so the curves stay sharp.
  return sharp(svg, { density: Math.max(72, Math.ceil((72 * height) / 132)) })
    .resize({ height })
    .png()
    .toBuffer();
}

/** The iOS home-screen icon: the plectrum on solid velvet (iOS rounds the corners itself). */
export async function touchIcon(): Promise<Buffer> {
  const height = 140;
  const width = Math.round(height * LOGO_ASPECT);
  return sharp({
    create: { width: TOUCH_ICON_SIZE, height: TOUCH_ICON_SIZE, channels: 3, background: palette.velvet },
  })
    .composite([
      {
        input: await logoPng(height),
        left: Math.round((TOUCH_ICON_SIZE - width) / 2),
        top: Math.round((TOUCH_ICON_SIZE - height) / 2),
      },
    ])
    .removeAlpha()
    .png()
    .toBuffer();
}
