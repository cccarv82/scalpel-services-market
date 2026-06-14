import { useEffect, useMemo, useState } from 'react'
import { listServices } from '../lib/api'
import { copyToClipboard } from '../lib/format'
import { useStore } from '../store'
import type { ServiceCategory, ServiceListItem } from '../types'
import { RequestModal } from './RequestModal'
import { ServiceCard } from './ServiceCard'
import { btn, input } from './ui'

const CATEGORIES: { value: ServiceCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'act_carry', label: 'Act' },
  { value: 'boss_carry', label: 'Boss' },
  { value: 'leveling_carry', label: 'Leveling' },
  { value: 'map_hosting', label: 'Map host' },
  { value: 'trial_carry', label: 'Trial' },
  { value: 'other', label: 'Other' },
]

export function ServiceBoard() {
  const token = useStore((s) => s.token)
  const user = useStore((s) => s.user)
  const services = useStore((s) => s.services)
  const setServices = useStore((s) => s.setServices)

  const [category, setCategory] = useState<ServiceCategory | ''>('')
  const [league, setLeague] = useState(user?.defaultLeague ?? '')
  const [poeVersion, setPoeVersion] = useState<1 | 2>((user?.poeVersion as 1 | 2) ?? 2)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ServiceListItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchList = useMemo(
    () => async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await listServices(token, {
          category: category || undefined,
          league: league || undefined,
          poeVersion,
          q: q.trim() || undefined,
          pageSize: 50,
        })
        setServices(res.services)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [token, category, league, poeVersion, q, setServices],
  )

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const flashToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  if (modal && token && user) {
    return (
      <RequestModal
        service={modal}
        token={token}
        defaultCharName={user.poeCharName ?? ''}
        onClose={() => setModal(null)}
        onCreated={() => {
          setModal(null)
          flashToast('Request sent. Wait for provider to accept.')
        }}
      />
    )
  }

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            style={{ ...btn, ...(category === c.value ? { background: '#f0a020', color: '#000' } : {}) }}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" style={btn} onClick={fetchList}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input
          style={{ ...input, width: 200, flex: '1 1 200px' }}
          placeholder="Search title or description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          style={{ ...input, width: 140 }}
          placeholder="League"
          value={league}
          onChange={(e) => setLeague(e.target.value)}
        />
        <select
          style={{ ...input, width: 80 } as React.CSSProperties}
          value={poeVersion}
          onChange={(e) => setPoeVersion(Number(e.target.value) as 1 | 2)}
        >
          <option value={1}>PoE 1</option>
          <option value={2}>PoE 2</option>
        </select>
      </div>

      {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
        }}
      >
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            onRequest={token ? () => setModal(svc) : undefined}
            onCopyInvite={
              svc.providerCharName
                ? () => {
                    copyToClipboard(`/invite ${svc.providerCharName}`)
                    flashToast(`/invite ${svc.providerCharName} copied`)
                  }
                : undefined
            }
          />
        ))}
        {services.length === 0 && !loading && (
          <div style={{ opacity: 0.55, padding: 24, gridColumn: '1 / -1', textAlign: 'center' }}>
            No services match these filters.
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,25,0.95)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: 4,
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
