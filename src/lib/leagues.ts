// League names come live from ctx.getLeagues(version) since plugin SDK 0.8.0.
// We cache them in the zustand store at activation and expose helpers to
// build the dropdown options. The user's detected league is pulled
// separately via ctx.getLeague().

export const OTHER_LEAGUE_VALUE = '__other__'

export interface LeagueOption {
  value: string
  label: string
}

export function buildLeagueOptions(leagues: readonly string[], detected?: string | null): LeagueOption[] {
  const opts: LeagueOption[] = []
  const seen = new Set<string>()

  // 1. Detected league first (if not already in the live list)
  if (detected && detected.trim() && !leagues.includes(detected)) {
    opts.push({ value: detected, label: `${detected} (detected)` })
    seen.add(detected)
  }

  // 2. Live list from ctx.getLeagues()
  for (const name of leagues) {
    if (seen.has(name)) continue
    const label = detected && name === detected ? `${name} (detected)` : name
    opts.push({ value: name, label })
    seen.add(name)
  }

  // 3. Fallback for custom names
  opts.push({ value: OTHER_LEAGUE_VALUE, label: 'Other…' })

  return opts
}
