/** The metal of a pin's rim and back, as the photo processing writes it to `meta.json`. */
export const RIM_METALS = ['gold', 'silver'] as const;

export type RimMetal = (typeof RIM_METALS)[number];

export const isRimMetal = (value: unknown): value is RimMetal => RIM_METALS.includes(value as RimMetal);
