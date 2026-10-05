/** How a pin came into the collection. */
export const PIN_ORIGINS = ['bought', 'traded', 'gift'] as const;

export type PinOrigin = (typeof PIN_ORIGINS)[number];
