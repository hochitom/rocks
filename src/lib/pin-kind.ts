/** What a pin is: from a Hard Rock Cafe, or a side find from somewhere else (a museum, a sight …). */
export const PIN_KINDS = ['hard-rock', 'side-find'] as const;

export type PinKind = (typeof PIN_KINDS)[number];
