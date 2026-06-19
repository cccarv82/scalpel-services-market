import { useMemo, useState } from 'react'
import { buildLeagueOptions, OTHER_LEAGUE_VALUE } from '../lib/leagues'
import { useStore } from '../store'
import { input } from './ui'

interface Props {
  poeVersion: 1 | 2
  value: string
  onChange: (v: string) => void
  detected?: string | null
  width?: number
}

export function LeagueSelect({ poeVersion, value, onChange, detected, width }: Props) {
  const leagues = useStore((s) => (poeVersion === 1 ? s.leaguesPoe1 : s.leaguesPoe2))
  const options = useMemo(() => buildLeagueOptions(leagues, detected ?? ''), [leagues, detected])
  const isKnown = options.some((o) => o.value === value)
  const [isOther, setIsOther] = useState(!isKnown && !!value)
  const style = width ? { ...input, width } : input

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <select
        style={style as React.CSSProperties}
        value={isOther ? OTHER_LEAGUE_VALUE : value || ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === OTHER_LEAGUE_VALUE) {
            setIsOther(true)
            onChange('')
          } else {
            setIsOther(false)
            onChange(v)
          }
        }}
      >
        <option value="">Any league</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isOther && (
        <input
          style={style}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom league name"
        />
      )}
    </div>
  )
}
