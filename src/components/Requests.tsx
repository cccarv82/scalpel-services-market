import { useCallback, useEffect, useState } from 'react'
import { listRequests } from '../lib/api'
import { useStore } from '../store'
import type { RequestStatus } from '../types'
import { RequestCard } from './RequestCard'
import { btn } from './ui'

interface Props {
  role: 'incoming' | 'outgoing'
}

const STATUSES: { value: '' | RequestStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function Requests({ role }: Props) {
  const token = useStore((s) => s.token)
  const incoming = useStore((s) => s.incoming)
  const outgoing = useStore((s) => s.outgoing)
  const setIncoming = useStore((s) => s.setIncoming)
  const setOutgoing = useStore((s) => s.setOutgoing)

  const [status, setStatus] = useState<'' | RequestStatus>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await listRequests(token, role, status || undefined)
      if (role === 'incoming') setIncoming(res.requests)
      else setOutgoing(res.requests)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token, role, status, setIncoming, setOutgoing])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const flashToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const list = role === 'incoming' ? incoming : outgoing

  if (!token) return null

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            style={{ ...btn, ...(status === s.value ? { background: '#f0a020', color: '#000' } : {}) }}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" style={btn} onClick={refresh}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>

      {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {list.map((r) => (
          <RequestCard
            key={r.id}
            token={token}
            request={r}
            role={role}
            onChanged={refresh}
            onToast={flashToast}
          />
        ))}
        {list.length === 0 && !loading && (
          <div style={{ opacity: 0.55, padding: 24, gridColumn: '1 / -1', textAlign: 'center' }}>
            No requests here.
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
