// Preview images for sharing links (Open Graph): drawn with satori, rasterised with sharp, at build time.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type { ImageMetadata } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import type { CatalogPin, Stats } from './catalog';
import { palette, withAlpha } from './palette';
import { yearOf } from './pin-date';

export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 630;

const color = {
  ...palette,
  // Lamp only as the light cone.
  lamp: (alpha: number) => withAlpha(palette.lamp, alpha),
};

// Satori falls back from font to font only across families, so each subset is a family of its own.
/** Big Shoulders Display: only for city names and years (docs/design.md). */
const DISPLAY = 'Big Shoulders Display, Big Shoulders Display Ext';
/** Newsreader: everything else. */
const SERIF = 'Newsreader, Newsreader Ext';

/** The preview image of one pin: the cut-out pin in the lamp light, its city large beside it. */
export async function pinPreview(pin: CatalogPin): Promise<Buffer> {
  const photo = await cutout(pin.cutout, 520);
  // As large as fits beside the pin (Big Shoulders is about half as wide as high).
  const cityFont = Math.round(Math.max(84, Math.min(190, 560 / (0.52 * pin.city.length))));
  return render(
    el('div', { ...stage, alignItems: 'center' }, [
      lampAt(905),
      el('div', { flexDirection: 'column', width: 660, paddingLeft: 72 }, [
        el('div', { fontSize: cityFont, fontWeight: 900, lineHeight: 0.92, color: color.brass }, pin.city),
        el(
          'div',
          { marginTop: 26, fontFamily: SERIF, fontSize: 44, fontWeight: 400, lineHeight: 1.2, color: color.smoke },
          `${pin.countryName}, ${yearOf(pin.date)}`,
        ),
      ]),
      el('img', { position: 'absolute', left: 645, top: 55, width: 520, height: 520 }, [], { src: photo }),
      mark(),
    ]),
  );
}

/** The preview image of every other page: the site's name and the newest pins in the lamp light. */
export async function sitePreview(newest: CatalogPin[], stats: Stats): Promise<Buffer> {
  const shown = newest.slice(0, 3);
  const photos = await Promise.all(shown.map((pin) => cutout(pin.cutout, 350)));
  // Fanned out like pins on a banner; the newest in front, in the middle.
  const spots = [
    { left: 815, top: 135, size: 350, rotate: 0 },
    { left: 712, top: 205, size: 280, rotate: -8 },
    { left: 925, top: 205, size: 280, rotate: 8 },
  ];
  const pins = photos
    .map((src, i) => {
      const { left, top, size, rotate } = spots[i];
      return el(
        'img',
        { position: 'absolute', left, top, width: size, height: size, transform: `rotate(${rotate}deg)` },
        [],
        { src },
      );
    })
    .reverse();
  return render(
    el('div', { ...stage, alignItems: 'center' }, [
      lampAt(990),
      ...pins,
      el('div', { flexDirection: 'column', paddingLeft: 72, width: 700 }, [
        wordmark(100, 900),
        el(
          'div',
          { flexDirection: 'column', marginTop: 28, fontFamily: SERIF, fontSize: 46, fontWeight: 400, lineHeight: 1.2, color: color.smoke },
          [el('div', {}, 'Hard Rock Cafe pins,'), el('div', {}, `collected since ${stats.firstYear}`)],
        ),
      ]),
    ]),
  );
}

const stage = {
  position: 'relative',
  display: 'flex',
  width: PREVIEW_WIDTH,
  height: PREVIEW_HEIGHT,
  backgroundColor: color.velvet,
  fontFamily: DISPLAY,
} as const;

/** The light cone falling from above onto the pin, centred at `x`. */
const lampAt = (x: number) =>
  el('div', {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    backgroundImage: `radial-gradient(ellipse 420px 520px at ${x}px 180px, ${color.lamp(0.24)}, ${color.lamp(0.08)} 55%, ${color.lamp(0)} 100%)`,
  });

/** The small site name in the corner, like the wordmark in the header. */
const mark = () =>
  el('div', { position: 'absolute', left: 72, bottom: 44 }, [wordmark(38, 800)]);

/** "hochitom.rocks" with the brass ending, as in the header. */
const wordmark = (fontSize: number, fontWeight: 800 | 900) =>
  el('div', { fontSize, fontWeight, lineHeight: 1 }, [
    el('span', { color: color.bone, flexShrink: 0 }, 'hochitom'),
    el('span', { color: color.brass, flexShrink: 0 }, '.rocks'),
  ]);

/** The pin's cut-out photo (from the Katalog), scaled down, as a data URL. */
async function cutout(image: ImageMetadata, size: number): Promise<string> {
  const png = await sharp(sourceFile(image))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * The file an imported image was read from. Astro keeps it on the import as `fsPath` (in the build
 * and on the dev server); the dev server's `/@fs/…` URL is the fallback.
 */
function sourceFile(image: ImageMetadata): string {
  const fsPath = (image as ImageMetadata & { fsPath?: unknown }).fsPath;
  if (typeof fsPath === 'string') return fsPath;
  const dev = /^\/@fs(\/[^?]+)/.exec(image.src);
  if (dev) return decodeURIComponent(dev[1]);
  throw new Error(`Can't find the file of image ${image.src} for the preview image`);
}

async function render(node: Node): Promise<Buffer> {
  const svg = await satori(node as Parameters<typeof satori>[0], {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    fonts: await fonts(),
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

type Node = { type: string; props: Record<string, unknown> };

const el = (type: string, style: Record<string, unknown>, children: Node[] | string = [], attrs = {}): Node => ({
  type,
  // Satori lays out boxes with flexbox only.
  props: { style: type === 'div' ? { display: 'flex', ...style } : style, children, ...attrs },
});

// Satori reads WOFF but not WOFF2, so the static Fontsource packages (which ship both) are used here,
// not the variable Newsreader of the pages. Latin first, Latin Extended for the rest (e.g. "Łódź").
// The build runs in the project folder, so the packages resolve from there, wherever the bundled code lands.
const FONT_FILES = [
  { name: 'Big Shoulders Display', package: 'big-shoulders-display', weights: [800, 900] },
  { name: 'Newsreader', package: 'newsreader', weights: [400] },
] as const;

let loaded: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;
function fonts() {
  const require = createRequire(resolve('package.json'));
  loaded ??= Promise.all(
    FONT_FILES.flatMap((font) =>
      (['latin', 'latin-ext'] as const).flatMap((subset) =>
        font.weights.map(async (weight) => ({
          name: subset === 'latin' ? font.name : `${font.name} Ext`,
          data: await readFile(
            require.resolve(`@fontsource/${font.package}/files/${font.package}-${subset}-${weight}-normal.woff`),
          ),
          weight,
          style: 'normal' as const,
        })),
      ),
    ),
  );
  return loaded;
}
