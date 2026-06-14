import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect, useRef, useState } from 'react'
import { getMe, updateMe } from '../lib/api'
import { persistAuth, useStore } from '../store'
import { btn, btnDanger, btnPrimary, card, input, label as labelStyle } from './ui'

interface Props {
  ctx: ScalpelPluginContext
}

export function Profile({ ctx }: Props) {
  const user = useStore((s) => s.user)
  const rating = useStore((s) => s.rating)
  const token = useStore((s) => s.token)
  const setMe = useStore((s) => s.setMe)
  const logout = useStore((s) => s.logout)

  const [poeCharName, setPoeCharName] = useState(user?.poeCharName ?? '')
  const [defaultLeague, setDefaultLeague] = useState(user?.defaultLeague ?? ctx.getLeague() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  if (!user || !token) return null

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateMe(token, {
        poeCharName: poeCharName.trim() || null,
        defaultLeague: defaultLeague.trim() || null,
      })
      const fresh = await getMe(token)
      setMe(fresh)
      await persistAuth(ctx.storage, token, fresh.user)
      setSavedAt(Date.now())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const doLogout = async () => {
    if (confirmingLogout) {
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
      setConfirmingLogout(false)
      await persistAuth(ctx.storage, null, null)
      logout()
      return
    }
    setConfirmingLogout(true)
    logoutTimer.current = setTimeout(() => setConfirmingLogout(false), 3000)
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: 12, maxWidth: 520 }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <strong style={{ fontSize: 15 }}>{user.displayName}</strong>
            <span style={{ marginLeft: 8, opacity: 0.55, fontSize: 12 }}>@{user.discordUsername}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            {rating.count > 0 ? (
              <span>
                <span style={{ color: '#fc0' }}>★</span> {rating.average.toFixed(2)}{' '}
                <span style={{ opacity: 0.5 }}>({rating.count})</span>
              </span>
            ) : (
              <span style={{ opacity: 0.5 }}>no ratings yet</span>
            )}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 11, opacity: 0.55, lineHeight: 1.4 }}>
            Your display name mirrors your Discord identity and cannot be changed here. It re-syncs from Discord on every login.
          </div>
          <div>
            <div style={labelStyle}>PoE character name (shown on your services)</div>
            <input style={input} maxLength={40} value={poeCharName} onChange={(e) => setPoeCharName(e.target.value)} placeholder="e.g. MyChar_HC" />
          </div>
          <div>
            <div style={labelStyle}>Default league</div>
            <input style={input} maxLength={60} value={defaultLeague} onChange={(e) => setDefaultLeague(e.target.value)} placeholder="e.g. Settlers" />
          </div>
          {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}
          {savedAt && !error && <div style={{ color: '#8c8', fontSize: 12 }}>Saved.</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <button type="button" style={btnPrimary} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" style={btnDanger} onClick={doLogout}>
              {confirmingLogout ? 'Click again to confirm' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...card, opacity: 0.7, fontSize: 12 }}>
        <div style={labelStyle}>Discord ID</div>
        <code style={{ fontSize: 11 }}>{user.discordUsername}</code>
        <p style={{ marginTop: 8 }}>
          Signing out removes the local token. Your published services stay live and can be managed by signing in again.
        </p>
        <button
          type="button"
          style={btn}
          onClick={() => ctx.openExternal('https://github.com/cccarv82/scalpel-services-market')}
        >
          Plugin source
        </button>
      </div>
    </div>
  )
}
