import { useState } from 'react'
import { ApiError, createService, updateService } from '../lib/api'
import { CATEGORY_LABEL, CURRENCY_LABEL } from '../lib/format'
import { useStore } from '../store'
import type { PriceCurrency, PriceTier, ServiceCategory, ServiceListItem } from '../types'
import { btn, btnPrimary, card, input, label as labelStyle } from './ui'

interface Props {
  token: string
  existing?: ServiceListItem
  defaultLeague: string
  defaultPoeVersion: 1 | 2
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES: ServiceCategory[] = [
  'act_carry',
  'boss_carry',
  'leveling_carry',
  'map_hosting',
  'trial_carry',
  'campaign_carry',
  'other',
]

const CAMPAIGN_TIER_PRESETS: PriceTier[] = [
  { label: 'Per act', price: 0 },
  { label: 'Act 1 + Act 2 + Act 3', price: 0 },
  { label: 'Full campaign (Acts 1-4 + Interlude)', price: 0 },
]

const CURRENCIES: PriceCurrency[] = ['chaos', 'divine', 'exalted', 'mirror', 'free_for_vouch']

export function ServiceForm({ token, existing, defaultLeague, defaultPoeVersion, onClose, onSaved }: Props) {
  const user = useStore((s) => s.user)
  const [category, setCategory] = useState<ServiceCategory>((existing?.category as ServiceCategory) ?? 'boss_carry')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>(
    (existing?.priceCurrency as PriceCurrency) ?? 'divine',
  )
  const [priceMin, setPriceMin] = useState(existing?.priceMin ?? '')
  const [priceMax, setPriceMax] = useState(existing?.priceMax ?? '')
  const [tiers, setTiers] = useState<PriceTier[]>(
    existing?.priceTiers?.length
      ? existing.priceTiers
      : (existing?.category ?? 'boss_carry') === 'campaign_carry'
        ? CAMPAIGN_TIER_PRESETS
        : [],
  )
  const [tagsInput, setTagsInput] = useState((existing?.tags ?? []).join(', '))
  const [league, setLeague] = useState(existing?.league ?? defaultLeague)
  const [poeVersion, setPoeVersion] = useState<1 | 2>((existing?.poeVersion as 1 | 2) ?? defaultPoeVersion)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseTags = (): string[] =>
    tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6)

  const usingTiers = tiers.length > 0

  const submit = async () => {
    setError(null)
    if (!title.trim()) return setError('Title required')
    if (!description.trim()) return setError('Description required')
    if (!league.trim()) return setError('League required')
    if (title.trim().length < 3 || title.length > 80) return setError('Title 3–80 chars')
    if (description.length > 2000) return setError('Description too long (max 2000)')

    let cleanedTiers: PriceTier[] = []
    let min: number | null = null
    let max: number | null = null

    if (usingTiers && priceCurrency !== 'free_for_vouch') {
      cleanedTiers = tiers
        .map((t) => ({ label: t.label.trim(), price: Number(t.price) }))
        .filter((t) => t.label.length > 0)
      if (cleanedTiers.length === 0) return setError('Add at least one price tier or remove all to use min/max')
      for (const t of cleanedTiers) {
        if (!Number.isFinite(t.price) || t.price < 0) return setError(`Tier "${t.label}" needs a non-negative price`)
        if (t.label.length > 60) return setError(`Tier label too long: ${t.label.slice(0, 60)}…`)
      }
      if (cleanedTiers.length > 8) return setError('Max 8 tiers')
    } else {
      min = priceMin.trim() === '' ? null : Number(priceMin)
      max = priceMax.trim() === '' ? null : Number(priceMax)
      if (min != null && !Number.isFinite(min)) return setError('Price min must be a number')
      if (max != null && !Number.isFinite(max)) return setError('Price max must be a number')
      if (priceCurrency !== 'free_for_vouch' && min == null && max == null) {
        return setError('Set a price (min or max), add price tiers, or use "free for vouch"')
      }
      if (min != null && max != null && min > max) return setError('min > max')
    }

    const payload = {
      category,
      title: title.trim(),
      description: description.trim(),
      priceCurrency,
      priceMin: min,
      priceMax: max,
      priceTiers: cleanedTiers,
      tags: parseTags(),
      poeVersion,
      league: league.trim(),
    }

    setBusy(true)
    try {
      if (existing) {
        await updateService(token, existing.id, payload)
      } else {
        await createService(token, payload)
      }
      onSaved()
    } catch (e) {
      if (e instanceof ApiError && (e.body as { error?: string })?.error === 'rmt_blocked') {
        setError(`Rejected: blocked term "${(e.body as { match?: string }).match}".`)
      } else if (e instanceof ApiError && e.status === 429) {
        setError('You already have 10 active services. Pause one before publishing another.')
      } else {
        setError((e as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...card, width: '100%', maxWidth: 560, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: 14 }}>{existing ? 'Edit service' : 'New service'}</strong>
          <button type="button" style={btn} onClick={onClose}>
            ← Back
          </button>
        </div>

        <div>
          <div style={labelStyle}>Category</div>
          <select
            style={input as React.CSSProperties}
            value={category}
            onChange={(e) => {
              const next = e.target.value as ServiceCategory
              setCategory(next)
              if (next === 'campaign_carry' && tiers.length === 0) setTiers(CAMPAIGN_TIER_PRESETS)
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={labelStyle}>Title</div>
          <input style={input} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <div style={labelStyle}>Description</div>
          <textarea
            style={{ ...input, minHeight: 100, resize: 'vertical' }}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div style={labelStyle}>Currency</div>
          <select
            style={input as React.CSSProperties}
            value={priceCurrency}
            onChange={(e) => setPriceCurrency(e.target.value as PriceCurrency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABEL[c]} ({c})
              </option>
            ))}
          </select>
        </div>

        {priceCurrency !== 'free_for_vouch' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={labelStyle}>{usingTiers ? 'Price tiers' : 'Price range'}</span>
              <button
                type="button"
                style={btn}
                onClick={() => {
                  if (usingTiers) setTiers([])
                  else
                    setTiers(
                      category === 'campaign_carry'
                        ? CAMPAIGN_TIER_PRESETS
                        : [{ label: '', price: 0 }],
                    )
                }}
              >
                {usingTiers ? 'Use simple min/max' : 'Use tiered pricing'}
              </button>
            </div>

            {usingTiers ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {tiers.map((t, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 30px', gap: 6 }}>
                    <input
                      style={input}
                      maxLength={60}
                      placeholder={`Tier ${i + 1} label (e.g. Act 1+2)`}
                      value={t.label}
                      onChange={(e) =>
                        setTiers((prev) => prev.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))
                      }
                    />
                    <input
                      style={input}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="price"
                      value={t.price}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, price: Number(e.target.value) || 0 } : p)),
                        )
                      }
                    />
                    <button
                      type="button"
                      style={{ ...btn, padding: '0 6px' }}
                      onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {tiers.length < 8 && (
                  <button
                    type="button"
                    style={btn}
                    onClick={() => setTiers((prev) => [...prev, { label: '', price: 0 }])}
                  >
                    + Add tier
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={labelStyle}>Min</div>
                  <input
                    style={input}
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </div>
                <div>
                  <div style={labelStyle}>Max (optional)</div>
                  <input
                    style={input}
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <div style={labelStyle}>Tags (comma-separated, max 6)</div>
          <input
            style={input}
            value={tagsInput}
            placeholder="e.g. fast, afk, eu"
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <div>
            <div style={labelStyle}>League</div>
            <input style={input} value={league} onChange={(e) => setLeague(e.target.value)} />
          </div>
          <div>
            <div style={labelStyle}>PoE version</div>
            <select
              style={input as React.CSSProperties}
              value={poeVersion}
              onChange={(e) => setPoeVersion(Number(e.target.value) as 1 | 2)}
            >
              <option value={1}>PoE 1</option>
              <option value={2}>PoE 2</option>
            </select>
          </div>
        </div>

        {!user?.poeCharName && (
          <div style={{ fontSize: 11, color: '#fc0' }}>
            Tip: set your character name in Profile so clients can /invite you.
          </div>
        )}

        {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={btnPrimary} disabled={busy} onClick={submit}>
            {busy ? 'Saving…' : existing ? 'Save' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
