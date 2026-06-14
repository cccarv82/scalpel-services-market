import { useCallback, useEffect, useState } from 'react'
import { deleteService, listServices, updateService } from '../lib/api'
import { useStore } from '../store'
import type { ServiceListItem } from '../types'
import { ServiceCard } from './ServiceCard'
import { ServiceForm } from './ServiceForm'
import { btnPrimary } from './ui'

export function MyServices() {
  const token = useStore((s) => s.token)
  const user = useStore((s) => s.user)
  const myServices = useStore((s) => s.myServices)
  const setMyServices = useStore((s) => s.setMyServices)

  const [editing, setEditing] = useState<ServiceListItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await listServices(token, { mine: true, includeInactive: true, pageSize: 50 })
      setMyServices(res.services)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token, setMyServices])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleActive = async (svc: ServiceListItem) => {
    if (!token) return
    try {
      await updateService(token, svc.id, { active: !svc.active })
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const remove = async (svc: ServiceListItem) => {
    if (!token) return
    if (!confirm(`Delete "${svc.title}"? This cannot be undone.`)) return
    try {
      await deleteService(token, svc.id)
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!user || !token) return null

  if (creating || editing) {
    return (
      <ServiceForm
        token={token}
        existing={editing ?? undefined}
        defaultLeague={user.defaultLeague ?? ''}
        defaultPoeVersion={(user.poeVersion as 1 | 2) ?? 2}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={async () => {
          setCreating(false)
          setEditing(null)
          await refresh()
        }}
      />
    )
  }

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          {myServices.filter((s) => s.active).length} active · {myServices.length} total
        </div>
        <button type="button" style={btnPrimary} onClick={() => setCreating(true)}>
          + New service
        </button>
      </div>

      {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
        }}
      >
        {myServices.map((svc) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            ownerView
            onToggleActive={() => toggleActive(svc)}
            onEdit={() => setEditing(svc)}
            onDelete={() => remove(svc)}
          />
        ))}
        {myServices.length === 0 && !loading && (
          <div style={{ opacity: 0.55, padding: 24, gridColumn: '1 / -1', textAlign: 'center' }}>
            You haven't published any services yet.
          </div>
        )}
      </div>

    </div>
  )
}
