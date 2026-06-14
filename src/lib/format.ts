import type { PriceCurrency, ServiceCategory } from '../types'

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  act_carry: 'Act Carry',
  boss_carry: 'Boss Carry',
  leveling_carry: 'Leveling Carry',
  map_hosting: 'Map Hosting',
  trial_carry: 'Trial / Ascendancy',
  ascendancy_carry: 'Trial / Ascendancy',
  other: 'Other',
}

export const CURRENCY_LABEL: Record<PriceCurrency, string> = {
  chaos: 'c',
  divine: 'div',
  exalted: 'ex',
  mirror: 'mirror',
  free_for_vouch: 'free',
}

export function formatPrice(
  currency: PriceCurrency,
  min: string | null,
  max: string | null,
): string {
  if (currency === 'free_for_vouch') return 'Free for vouch'
  const lo = min != null ? trimNum(min) : null
  const hi = max != null ? trimNum(max) : null
  const unit = CURRENCY_LABEL[currency]
  if (lo != null && hi != null) {
    if (lo === hi) return `${lo} ${unit}`
    return `${lo} – ${hi} ${unit}`
  }
  if (lo != null) return `${lo} ${unit}`
  if (hi != null) return `up to ${hi} ${unit}`
  return '—'
}

function trimNum(s: string): string {
  const n = Number(s)
  if (!Number.isFinite(n)) return s
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace(/\.?0+$/, '')
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86_400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86_400)}d ago`
}

export function copyToClipboard(text: string): boolean {
  try {
    void navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
