import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect, useState } from 'react'
import { listEvents, markEventRead } from '../lib/api'
import { copyToClipboard } from '../lib/format'
import type { EventItem } from '../types'

interface Props {
  ctx: ScalpelPluginContext
}

const POLL_MS = 8000

function describeEvent(e: EventItem): { title: string; body: string; charName: string | null } {
  const p = e.payload as Record<string, unknown>
  switch (e.kind) {
    case 'new_request':
      return {
        title: 'New service request',
        body: `${asString(p.requesterName) || 'Someone'} requested "${asString(p.serviceTitle) || 'your service'}"`,
        charName: asString(p.requesterCharName) || null,
      }
    case 'request_accepted':
      return { title: 'Request accepted', body: 'Your request was accepted. Get ready to party.', charName: null }
    case 'request_declined':
      return { title: 'Request declined', body: 'Your request was declined.', charName: null }
    case 'request_completed':
      return { title: 'Service completed', body: 'Service marked complete. Time to rate.', charName: null }
    case 'request_cancelled':
      return { title: 'Request cancelled', body: 'The other side cancelled.', charName: null }
    case 'new_rating':
      return { title: 'New rating', body: `You received ${asString(p.stars)} ★`, charName: null }
    default:
      return { title: 'Event', body: e.kind, charName: null }
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

export function OverlayNotif({ ctx }: Props) {
  const [unread, setUnread] = useState<EventItem[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const token = await ctx.storage.get<string>('token')
      if (cancelled || !token) return
      try {
        const res = await listEvents(token, undefined, true)
        if (cancelled) return
        setUnread(res.events.slice(0, 5))
      } catch {}
    }
    void poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [ctx])

  const dismiss = async (id: string) => {
    const token = await ctx.storage.get<string>('token')
    if (!token) return
    try {
      await markEventRead(token, id)
    } catch {}
    setUnread((prev) => prev.filter((e) => e.id !== id))
  }

  const flashToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  if (unread.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 12, opacity: 0.5, fontFamily: 'system-ui, sans-serif' }}>
        No new events.
      </div>
    )
  }

  return (
    <div style={{ padding: 8, display: 'grid', gap: 6, fontFamily: 'system-ui, sans-serif' }}>
      {unread.map((ev) => {
        const d = describeEvent(ev)
        return (
          <div
            key={ev.id}
            style={{
              background: 'rgba(20,20,25,0.95)',
              border: '1px solid #f0a020',
              borderRadius: 6,
              padding: 10,
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ color: '#f0a020', fontSize: 12 }}>{d.title}</strong>
              <button
                type="button"
                onClick={() => dismiss(ev.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12 }}>{d.body}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  ctx.openTab()
                  ctx.closeOverlay()
                }}
                style={btnStyle}
              >
                View
              </button>
              {d.charName && (
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(`/invite ${d.charName}`)
                    flashToast('Copied')
                  }}
                  style={btnStyle}
                >
                  Copy /invite {d.charName}
                </button>
              )}
            </div>
          </div>
        )
      })}
      {toast && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#8c8' }}>{toast}</div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
