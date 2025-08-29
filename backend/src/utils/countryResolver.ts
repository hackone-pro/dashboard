// src/utils/countryResolver.ts
import countriesRaw from 'world-countries';

type Country = typeof countriesRaw[number];

const COUNTRIES: Country[] = countriesRaw as Country[];

// Alguns aliases comuns que chegam “fora do padrão” no log/agg
const ALIASES: Record<string, string> = {
  'russian federation': 'Russia',
  'united states of america': 'United States',
  'united states': 'United States',
  'u.s.a.': 'United States',
  'usa': 'United States',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'south korea': 'Korea, Republic of',
  'north korea': "Korea, Democratic People's Republic of",
  'iran': 'Iran, Islamic Republic of',
  'viet nam': 'Vietnam',
  'bolivia': 'Bolivia (Plurinational State of)',
  'tanzania': 'Tanzania, United Republic of',
  'moldova': 'Moldova, Republic of',
  'syria': 'Syrian Arab Republic',
  'laos': "Lao People's Democratic Republic",
  'brunei': 'Brunei Darussalam',
  'cape verde': 'Cabo Verde',
  'czech republic': 'Czechia',
  'macedonia': 'North Macedonia',
  'palestine': 'Palestine, State of',
  'uae': 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates'
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export type CountryCoord = {
  lat: number;
  lng: number;
  cca2?: string;
  cca3?: string;
  name: string; // nome "bonito" pra exibir se precisar
};

/**
 * Resolve lat/lng a partir do nome do país (robusto a variações comuns).
 * Retorna null se não encontrar.
 */
export function resolveCountryCoords(input: string): CountryCoord | null {
  if (!input) return null;

  // 1) aplicar alias se existir
  const alias = ALIASES[norm(input)];
  const target = alias || input;

  // 2) tentar match exato por name.common / name.official
  let found = COUNTRIES.find(
    c =>
      c.name.common.toLowerCase() === target.toLowerCase() ||
      c.name.official.toLowerCase() === target.toLowerCase()
  );

  // 3) tentar por altSpellings
  if (!found) {
    const n = norm(target);
    found = COUNTRIES.find(c => (c.altSpellings || []).some(a => norm(a) === n));
  }

  if (!found || !Array.isArray(found.latlng) || found.latlng.length < 2) return null;

  const [lat, lng] = found.latlng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return { lat, lng, cca2: found.cca2, cca3: found.cca3, name: found.name.common };
}