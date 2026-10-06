/** A number with its noun in the right form: `count(1, 'pin', 'pins')` → "1 pin", `count(3, …)` → "3 pins". */
export const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
