import type { PluginActivate, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from './components/App'
import { TAB_ICON } from './components/icons'
import { OverlayNotif } from './components/OverlayNotif'
import { getMe, listEvents } from './lib/api'
import { loadFromStorage, persistAuth, persistLastEventTs, useStore } from './store'

const POLL_INTERVAL_MS = 5_000

let audioCtx: AudioContext | null = null
function beep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const ctx = audioCtx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.start()
    o.stop(ctx.currentTime + 0.35)
  } catch {}
}

const activate: PluginActivate = async (ctx: ScalpelPluginContext) => {
  const stored = await loadFromStorage(ctx.storage)
  useStore.getState().hydrate(stored)

  if (stored.token) {
    try {
      const me = await getMe(stored.token)
      useStore.getState().setAuth(stored.token, me)
      await persistAuth(ctx.storage, stored.token, me.user)
    } catch {
      await persistAuth(ctx.storage, null, null)
      useStore.getState().logout()
    }
  }

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  const pollEvents = async () => {
    const s = useStore.getState()
    if (!s.token) return
    try {
      const res = await listEvents(s.token, s.lastEventTs || undefined)
      if (res.events.length > 0) {
        const hadNewRequest = res.events.some((e) => e.kind === 'new_request')
        const hadActionable = res.events.some(
          (e) =>
            e.kind === 'new_request' ||
            e.kind === 'request_accepted' ||
            e.kind === 'request_completed' ||
            e.kind === 'request_declined' ||
            e.kind === 'request_cancelled',
        )
        s.pushEvents(res.events, res.serverTime)
        await persistLastEventTs(ctx.storage, res.serverTime)
        if (hadActionable) {
          try {
            ctx.openOverlay()
          } catch {}
        }
        if (hadNewRequest) beep()
      } else if (res.serverTime !== s.lastEventTs) {
        await persistLastEventTs(ctx.storage, res.serverTime)
      }
    } catch {}
  }
  const schedulePoll = () => {
    pollTimer = setTimeout(async () => {
      await pollEvents()
      schedulePoll()
    }, POLL_INTERVAL_MS)
  }
  schedulePoll()

  let root: Root | null = null
  ctx.registerTab({
    label: 'Services Market',
    icon: TAB_ICON,
    render: (container) => {
      root = createRoot(container)
      root.render(
        <StrictMode>
          <App ctx={ctx} />
        </StrictMode>,
      )
      return () => {
        root?.unmount()
        root = null
      }
    },
  })

  let overlayRoot: Root | null = null
  ctx.registerOverlay(
    {
      title: 'Services Market — Notifications',
      icon: TAB_ICON,
      hotkeyLabel: 'Toggle notifications',
      defaultSize: { width: 360, height: 280 },
    },
    (container) => {
      overlayRoot = createRoot(container)
      overlayRoot.render(
        <StrictMode>
          <OverlayNotif ctx={ctx} />
        </StrictMode>,
      )
      return () => {
        overlayRoot?.unmount()
        overlayRoot = null
      }
    },
  )

  return () => {
    if (pollTimer) clearTimeout(pollTimer)
    root?.unmount()
    overlayRoot?.unmount()
  }
}

export default activate
