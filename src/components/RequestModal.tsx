import { useState } from 'react'
import { ApiError, createRequest } from '../lib/api'
import type { ServiceListItem } from '../types'
import { btn, btnPrimary, card, input, label as labelStyle } from './ui'

interface Props {
  service: ServiceListItem
  token: string
  defaultCharName: string
  onClose: () => void
  onCreated: (id: string) => void
}

export function RequestModal({ service, token, defaultCharName, onClose, onCreated }: Props) {
  const [charName, setCharName] = useState(defaultCharName)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (charName.trim().length < 1) {
      setError('Character name required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await createRequest(token, service.id, {
        requesterCharName: charName.trim(),
        notes: notes.trim() || undefined,
      })
      onCreated(res.id)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('You already have an open request for this service.')
      } else if (e instanceof ApiError && (e.body as { error?: string })?.error === 'rmt_blocked') {
        setError(`Request rejected: contains blocked term "${(e.body as { match?: string }).match}".`)
      } else {
        setError((e as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...card, width: 'min(420px, 90vw)', display: 'grid', gap: 10 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: 14 }}>Request service</strong>
          <button type="button" style={btn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{service.title}</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>by {service.providerName}</div>
        <div>
          <div style={labelStyle}>Your character name (provider will whisper this name)</div>
          <input
            style={input}
            maxLength={40}
            value={charName}
            onChange={(e) => setCharName(e.target.value)}
            placeholder="MyChar_HC"
            autoFocus
          />
        </div>
        <div>
          <div style={labelStyle}>Notes (optional)</div>
          <textarea
            style={{ ...input, minHeight: 80, resize: 'vertical' }}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the provider needs to know"
          />
        </div>
        {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={btnPrimary} disabled={busy} onClick={submit}>
            {busy ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
