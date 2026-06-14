import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect, useRef, useState } from 'react'
import { getAuthStartUrl, pollAuth } from '../lib/api'
import { persistAuth, useStore } from '../store'
import { btnPrimary, card } from './ui'

interface Props {
  ctx: ScalpelPluginContext
}

type Stage = 'idle' | 'waiting' | 'error'

function randomCode(): string {
  // base64url-like, 12 bytes
  const arr = new Uint8Array(12)
  crypto.getRandomValues(arr)
  let s = ''
  for (const b of arr) s += b.toString(36)
  return s.slice(0, 22)
}

export function Login({ ctx }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<string | null>(null)
  const cancelledRef = useRef(false)
  const setAuth = useStore((s) => s.setAuth)

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  const start = async () => {
    setError(null)
    setStage('waiting')
    const code = randomCode()
    codeRef.current = code
    ctx.openExternal(getAuthStartUrl(code))

    const startedAt = Date.now()
    const TIMEOUT_MS = 10 * 60 * 1000

    while (!cancelledRef.current && Date.now() - startedAt < TIMEOUT_MS) {
      try {
        const res = await pollAuth(code)
        if (cancelledRef.current) return
        if (res.status === 'ready' && res.token && res.user) {
          await persistAuth(ctx.storage, res.token, res.user)
          setAuth(res.token, { user: res.user, rating: { average: 0, count: 0 } })
          return
        }
        if (res.status === 'expired') {
          setError('Login session expired. Try again.')
          setStage('error')
          return
        }
      } catch (e) {
        setError((e as Error).message)
        setStage('error')
        return
      }
      await sleep(2500)
    }
    if (!cancelledRef.current) {
      setError('Timed out waiting for Discord. Try again.')
      setStage('error')
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100%', padding: 16 }}>
      <div style={{ ...card, maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--text, white)' }}>Services Market</h2>
        <p style={{ opacity: 0.75, fontSize: 13, marginTop: 0 }}>
          Currency-only marketplace for in-game services. Sign in with Discord to publish and request services.
        </p>
        <p style={{ opacity: 0.6, fontSize: 11, marginTop: 0 }}>
          By signing in you agree to <strong>no real-money trade</strong>. Violators are banned.
        </p>
        {stage === 'idle' && (
          <button type="button" onClick={start} style={btnPrimary}>
            Connect Discord
          </button>
        )}
        {stage === 'waiting' && (
          <div>
            <p style={{ fontSize: 13 }}>Browser opened. Authorize on Discord, then come back.</p>
            <p style={{ fontSize: 11, opacity: 0.6 }}>Waiting…</p>
            <button
              type="button"
              onClick={() => {
                cancelledRef.current = true
                setStage('idle')
              }}
              style={{ ...btnPrimary, background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
          </div>
        )}
        {stage === 'error' && (
          <div>
            <p style={{ color: '#f88', fontSize: 13 }}>{error}</p>
            <button type="button" onClick={start} style={btnPrimary}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
