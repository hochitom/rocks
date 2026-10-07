export type Continent =
  | 'Africa'
  | 'Antarctica'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America';

/** ISO 3166-1 alpha-2 codes by continent, following the UN M49 regions (plus Kosovo, `XK`). */
const CODES_BY_CONTINENT: Record<Continent, string> = {
  Africa:
    'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW IO KE KM LR LS LY MA MG ML MR MU MW MZ ' +
    'NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TF TG TN TZ UG YT ZA ZM ZW',
  Antarctica: 'AQ',
  Asia:
    'AE AF AM AZ BD BH BN BT CN CY GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM ' +
    'PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  Europe:
    'AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK ' +
    'MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
  'North America':
    'AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC ' +
    'TT US VC VG VI',
  Oceania: 'AS AU CC CK CX FJ FM GU HM KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF',
  'South America': 'AR BO BR BV CL CO EC FK GF GS GY PE PY SR UY VE',
};

/** All continents, alphabetically. */
export const CONTINENTS = Object.keys(CODES_BY_CONTINENT).sort() as Continent[];

const CONTINENT_BY_CODE = new Map(
  Object.entries(CODES_BY_CONTINENT).flatMap(([continent, codes]) =>
    codes.split(' ').map((code) => [code, continent as Continent] as const),
  ),
);

/** Where the English name from `Intl` reads oddly on a pin plaque. */
const NAME_OVERRIDES: Record<string, string> = {
  HK: 'Hong Kong',
  MO: 'Macao',
  PS: 'Palestine',
};

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const isCountryCode = (code: string): boolean => CONTINENT_BY_CODE.has(code);

export function continentOf(code: string): Continent {
  const continent = CONTINENT_BY_CODE.get(code);
  if (!continent) throw new Error(`Unknown country code "${code}"`);
  return continent;
}

export const countryName = (code: string): string => NAME_OVERRIDES[code] ?? regionNames.of(code) ?? code;

/** Countries whose English name takes "the" in a sentence ("from the United States"). */
const WITH_ARTICLE = new Set(['AE', 'BS', 'CF', 'DO', 'GB', 'GM', 'KM', 'MH', 'MV', 'NL', 'PH', 'SB', 'SC', 'US', 'VA']);

/** The country's name as it reads inside a sentence: "the United States", "Germany". */
export const countryInSentence = (code: string): string =>
  WITH_ARTICLE.has(code) ? `the ${countryName(code)}` : countryName(code);
