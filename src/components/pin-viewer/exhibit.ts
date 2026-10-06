import { getImage } from 'astro:assets';
import type { CatalogPin } from '../../lib/catalog';
import type { RimMetal } from '../../lib/rim-metal';

/**
 * Everything the browser needs to show a pin in the case: the cut-out photo (shown first and
 * without WebGL) and the files the 3D model is built from. Plain strings, so a page can also hand
 * a whole list to a script (the hero picks a random pin).
 */
export interface Exhibit {
  slug: string;
  city: string;
  /** Alt text of the photo and label of the 3D view. */
  alt: string;
  /** The cut-out photo. */
  src: string;
  srcset: string;
  outline: string;
  texture: string;
  normal: string;
  rim: RimMetal;
}

/** The exhibit's fields the viewer builds the 3D model from. */
const MODEL_FIELDS = ['outline', 'texture', 'normal', 'rim'] as const satisfies readonly (keyof Exhibit)[];

/**
 * The model's files as `data-*` attributes of `<pin-viewer>`. The hero's script swaps in another
 * pin by copying every one of these from the exhibit, so a new field needs adding only here.
 */
export const modelData = (exhibit: Exhibit) =>
  Object.fromEntries(MODEL_FIELDS.map((field) => [`data-${field}`, exhibit[field]]));

/** Sizes of the photo in the case: the stage is at most 560 px high, 340 px on phones. */
export const EXHIBIT_SIZES = '(max-width: 760px) 84vw, 480px';

export async function exhibitOf(pin: CatalogPin): Promise<Exhibit> {
  const [photo, texture, normal] = await Promise.all([
    getImage({ src: pin.cutout, widths: [360, 480, 720, 960], format: 'webp' }),
    getImage({ src: pin.model.texture, format: 'webp', quality: 85 }),
    // A WebP of the relief map is about a sixth of the PNG and looks the same under the enamel.
    getImage({ src: pin.model.normal, format: 'webp', quality: 90 }),
  ]);
  return {
    slug: pin.slug,
    city: pin.city,
    alt: pin.alt,
    src: photo.src,
    srcset: photo.srcSet.attribute,
    outline: pin.model.outline,
    texture: texture.src,
    normal: normal.src,
    rim: pin.model.rim,
  };
}
