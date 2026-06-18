// The Scalpel plugin SDK only exposes the player's currently-detected league
// via ctx.getLeague(). It does not expose the full list of currently-active
// GGG leagues. We maintain a small static catalog of known active league
// names per PoE version, prepended with the user's current league when
// available, and offer an "Other…" option to accept any custom name.
//
// Update this list each time a new league launches. Until the SDK exposes
// the live list (a request worth filing upstream), this is the pragmatic
// floor.

export interface LeagueOption {
  value: string
  label: string
  permanent?: boolean
}

export const POE2_LEAGUES: LeagueOption[] = [
  { value: 'Runes of Aldur', label: 'Runes of Aldur' },
  { value: 'Hardcore Runes of Aldur', label: 'HC Runes of Aldur' },
  { value: 'Standard', label: 'Standard', permanent: true },
  { value: 'Hardcore', label: 'Hardcore', permanent: true },
]

export const POE1_LEAGUES: LeagueOption[] = [
  { value: 'Mercenaries', label: 'Mercenaries' },
  { value: 'Hardcore Mercenaries', label: 'HC Mercenaries' },
  { value: 'Standard', label: 'Standard', permanent: true },
  { value: 'Hardcore', label: 'Hardcore', permanent: true },
]

export function leaguesFor(poeVersion: 1 | 2): LeagueOption[] {
  return poeVersion === 2 ? POE2_LEAGUES : POE1_LEAGUES
}

// Build a dropdown list: detected league (if not already in the catalog) +
// catalog + an "Other…" sentinel.
export const OTHER_LEAGUE_VALUE = '__other__'

export function buildLeagueOptions(poeVersion: 1 | 2, detected?: string | null): LeagueOption[] {
  const catalog = leaguesFor(poeVersion)
  const opts: LeagueOption[] = []
  const seen = new Set<string>()
  if (detected && detected.trim() && !catalog.find((c) => c.value === detected)) {
    opts.push({ value: detected, label: `${detected} (detected)` })
    seen.add(detected)
  }
  for (const c of catalog) {
    if (seen.has(c.value)) continue
    opts.push(c)
    seen.add(c.value)
  }
  opts.push({ value: OTHER_LEAGUE_VALUE, label: 'Other…' })
  return opts
}
