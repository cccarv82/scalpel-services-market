import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect } from 'react'
import { markEventRead } from '../lib/api'
import { useStore } from '../store'
import { Login } from './Login'
import { MyServices } from './MyServices'
import { Profile } from './Profile'
import { Requests } from './Requests'
import { ServiceBoard } from './ServiceBoard'
import { btn } from './ui'

const INCOMING_KINDS = ['new_request'] as const
const OUTGOING_KINDS = [
  'request_accepted',
  'request_declined',
  'request_completed',
  'request_cancelled',
] as const

interface Props {
  ctx: ScalpelPluginContext
}

export function App({ ctx }: Props) {
  const ready = useStore((s) => s.ready)
  const view = useStore((s) => s.view)
  const user = useStore((s) => s.user)
  const setView = useStore((s) => s.setView)
  const events = useStore((s) => s.events)
  const token = useStore((s) => s.token)
  const markEventsReadByKind = useStore((s) => s.markEventsReadByKind)
  const unreadIncoming = events.filter((e) => !e.read && (INCOMING_KINDS as readonly string[]).includes(e.kind)).length
  const unreadOutgoing = events.filter((e) => !e.read && (OUTGOING_KINDS as readonly string[]).includes(e.kind)).length

  useEffect(() => {
    if (!token) return
    let kinds: readonly string[] = []
    if (view === 'incoming') kinds = INCOMING_KINDS
    else if (view === 'outgoing') kinds = OUTGOING_KINDS
    if (kinds.length === 0) return
    const toMark = events.filter((e) => !e.read && kinds.includes(e.kind))
    if (toMark.length === 0) return
    markEventsReadByKind(kinds as unknown as Parameters<typeof markEventsReadByKind>[0])
    for (const e of toMark) {
      void markEventRead(token, e.id).catch(() => {})
    }
  }, [view, token, events, markEventsReadByKind])

  if (!ready) return null
  if (!user) return <Login ctx={ctx} />

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          padding: '8px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <strong style={{ marginRight: 12, color: 'var(--text)', fontSize: 14 }}>Services Market</strong>
        <Tab label="Board" active={view === 'board'} onClick={() => setView('board')} />
        <Tab label="Mine" active={view === 'mine'} onClick={() => setView('mine')} />
        <Tab
          label={`Incoming${unreadIncoming ? ` (${unreadIncoming})` : ''}`}
          active={view === 'incoming'}
          onClick={() => setView('incoming')}
        />
        <Tab
          label={`Outgoing${unreadOutgoing ? ` (${unreadOutgoing})` : ''}`}
          active={view === 'outgoing'}
          onClick={() => setView('outgoing')}
        />
        <div style={{ flex: 1 }} />
        <Tab label={user.displayName} active={view === 'profile'} onClick={() => setView('profile')} />
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {view === 'board' && <ServiceBoard />}
        {view === 'mine' && <MyServices />}
        {view === 'incoming' && <Requests role="incoming" />}
        {view === 'outgoing' && <Requests role="outgoing" />}
        {view === 'profile' && <Profile ctx={ctx} />}
      </main>
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...btn,
        background: active ? 'var(--accent, #f0a020)' : 'transparent',
        color: active ? '#000' : 'var(--text)',
        border: '1px solid ' + (active ? 'var(--accent, #f0a020)' : 'rgba(255,255,255,0.1)'),
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

