import { useEffect, useState } from 'react'
import { getUserProfile, type PublicProfile as PublicProfileData } from '../lib/api'
import { CATEGORY_LABEL, CURRENCY_LABEL, formatPrice } from '../lib/format'
import { useStore } from '../store'
import { btn, card, label as labelStyle } from './ui'

export function PublicProfile() {
  const userId = useStore((s) => s.publicProfileUserId)
  const setView = useStore((s) => s.setView)
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    getUserProfile(userId)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!userId) return null

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <div>
        <button type="button" style={btn} onClick={() => setView('board')}>
          ← Back
        </button>
      </div>
      {loading && <div style={{ opacity: 0.6, padding: 12 }}>Loading…</div>}
      {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}
      {data && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <strong style={{ fontSize: 16 }}>{data.user.displayName}</strong>
                {data.user.poeCharName && (
                  <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>· {data.user.poeCharName}</span>
                )}
              </div>
              <div style={{ fontSize: 13 }}>
                {data.rating.count > 0 ? (
                  <>
                    <span style={{ color: '#fc0' }}>★</span> {data.rating.average.toFixed(2)}{' '}
                    <span style={{ opacity: 0.5 }}>({data.rating.count})</span>
                  </>
                ) : (
                  <span style={{ opacity: 0.5 }}>no ratings yet</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              <span>{data.stats.activeServices} active services</span>
              <span>{data.stats.completedJobs} completed jobs</span>
              <span>Member since {new Date(data.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {data.rating.count > 0 && (
            <div style={card}>
              <div style={labelStyle}>Rating breakdown</div>
              {([5, 4, 3, 2, 1] as const).map((stars) => {
                const c = data.rating.breakdown[String(stars) as '1' | '2' | '3' | '4' | '5'] ?? 0
                const pct = data.rating.count > 0 ? (c / data.rating.count) * 100 : 0
                return (
                  <div key={stars} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 30px', gap: 6, alignItems: 'center', fontSize: 11 }}>
                    <span>{stars}★</span>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#fc0', borderRadius: 3 }} />
                    </div>
                    <span style={{ opacity: 0.6 }}>{c}</span>
                  </div>
                )
              })}
            </div>
          )}

          {data.activeServices.length > 0 && (
            <div style={card}>
              <div style={labelStyle}>Active services</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                {data.activeServices.map((svc) => (
                  <li
                    key={svc.id}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}
                  >
                    <span>
                      <span style={{ color: '#f0a020' }}>
                        {CATEGORY_LABEL[svc.category as keyof typeof CATEGORY_LABEL] ?? svc.category}
                      </span>{' '}
                      · {svc.title}
                    </span>
                    <span style={{ opacity: 0.75 }}>
                      {formatPrice(
                        svc.priceCurrency as Parameters<typeof formatPrice>[0],
                        svc.priceMin,
                        svc.priceMax,
                        null,
                      )}
                      <span style={{ opacity: 0.5, marginLeft: 6 }}>{CURRENCY_LABEL[svc.priceCurrency as keyof typeof CURRENCY_LABEL]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
