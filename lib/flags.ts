// Maps each tournament team name to an ISO 3166 flag code used by flagcdn.com.
// Knockout placeholders ("Group A winners", "Match 74 winners", "TBD") have no
// flag and return null so the UI can show a neutral badge instead.
const FLAG_CODES: Record<string, string> = {
  Mexico: 'mx',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Czech Republic': 'cz',
  Czechia: 'cz',
  Canada: 'ca',
  'Bosnia & Herzegovina': 'ba',
  Qatar: 'qa',
  Switzerland: 'ch',
  Brazil: 'br',
  Morocco: 'ma',
  Haiti: 'ht',
  Scotland: 'gb-sct',
  USA: 'us',
  Paraguay: 'py',
  Australia: 'au',
  Turkey: 'tr',
  Germany: 'de',
  Curacao: 'cw',
  'Ivory Coast': 'ci',
  Ecuador: 'ec',
  Netherlands: 'nl',
  Japan: 'jp',
  Sweden: 'se',
  Tunisia: 'tn',
  Spain: 'es',
  'Cape Verde': 'cv',
  'Saudi Arabia': 'sa',
  Uruguay: 'uy',
  Belgium: 'be',
  Egypt: 'eg',
  Iran: 'ir',
  'New Zealand': 'nz',
  France: 'fr',
  Senegal: 'sn',
  Iraq: 'iq',
  Norway: 'no',
  Argentina: 'ar',
  Algeria: 'dz',
  Austria: 'at',
  Jordan: 'jo',
  Portugal: 'pt',
  'DR Congo': 'cd',
  Uzbekistan: 'uz',
  Colombia: 'co',
  England: 'gb-eng',
  Croatia: 'hr',
  Ghana: 'gh',
  Panama: 'pa',
};

export function flagCode(team: string): string | null {
  return FLAG_CODES[team.trim()] ?? null;
}

export function flagUrl(team: string, size: 'w40' | 'w80' | 'w160' = 'w80'): string | null {
  const code = flagCode(team);
  return code ? `https://flagcdn.com/${size}/${code}.png` : null;
}
