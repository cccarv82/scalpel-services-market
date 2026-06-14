import { describe, expect, it } from 'vitest'
import { CATEGORY_LABEL, formatPrice, timeAgo } from './format'

describe('formatPrice', () => {
  it('free_for_vouch', () => {
    expect(formatPrice('free_for_vouch', null, null)).toBe('Free for vouch')
  })
  it('single min', () => {
    expect(formatPrice('divine', '5', null)).toBe('5 div')
  })
  it('range', () => {
    expect(formatPrice('divine', '5', '10')).toBe('5 – 10 div')
  })
  it('equal min/max collapses', () => {
    expect(formatPrice('chaos', '50', '50')).toBe('50 c')
  })
  it('trims trailing zeros', () => {
    expect(formatPrice('divine', '1.50', null)).toBe('1.5 div')
  })
  it('tiers show "from <lowest>"', () => {
    const tiers = [
      { label: 'Per act', price: 35 },
      { label: 'Acts 1-3', price: 100 },
      { label: 'Full', price: 300 },
    ]
    expect(formatPrice('divine', null, null, tiers)).toBe('from 35 div')
  })
  it('no price returns dash', () => {
    expect(formatPrice('chaos', null, null)).toBe('—')
  })
})

describe('CATEGORY_LABEL', () => {
  it('campaign_carry has label', () => {
    expect(CATEGORY_LABEL.campaign_carry).toBe('Campaign Carry')
  })
  it('trial and ascendancy share label', () => {
    expect(CATEGORY_LABEL.trial_carry).toBe(CATEGORY_LABEL.ascendancy_carry)
  })
})

describe('timeAgo', () => {
  it('seconds', () => {
    const t = new Date(Date.now() - 10_000).toISOString()
    expect(timeAgo(t)).toMatch(/s ago/)
  })
  it('minutes', () => {
    const t = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(timeAgo(t)).toMatch(/m ago/)
  })
})
