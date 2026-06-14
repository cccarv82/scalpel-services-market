import { useState } from 'react'
import { rateRequest, transitionRequest, type RequestAction } from '../lib/api'
import { CATEGORY_LABEL, copyToClipboard, formatPrice, timeAgo } from '../lib/format'
import type { RequestItem, RequestStatus } from '../types'
import { btn, btnDanger, btnPrimary } from './ui'

interface Props {
  token: string
  request: RequestItem
  role: 'incoming' | 'outgoing'
  onChanged: () => void
  onToast: (msg: string) => void
}

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: '#f0a020',
  accepted: '#7cc',
  declined: '#888',
  completed: '#8c8',
  cancelled: '#888',
}

export function RequestCard({ token, request, role, onChanged, onToast }: Props) {
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [rated, setRated] = useState(false)

  const act = async (action: RequestAction) => {
    setBusy(true)
    try {
      await transitionRequest(token, request.id, action)
      onChanged()
    } catch (e) {
      onToast(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const submitRating = async (stars: number) => {
    setBusy(true)
    try {
      await rateRequest(token, request.id, stars)
      setRated(true)
      onToast(`Rated ${stars} ★`)
    } catch (e) {
      onToast(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const copyInvite = () => {
    const name = request.counterparty.poeCharName ?? request.requesterCharName
    if (!name) return
    copyToClipboard(`/invite ${name}`)
    onToast(`/invite ${name} copied`)
  }

  const inviteCharName =
    role === 'incoming' ? request.requesterCharName : request.counterparty.poeCharName

  const price = formatPrice(request.service.priceCurrency, request.service.priceMin, request.service.priceMax)
  const status = request.status

  return (
    <div
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: '#f0a020', fontSize: 11, fontWeight: 600 }}>
          {CATEGORY_LABEL[request.service.category as keyof typeof CATEGORY_LABEL]}
        </span>
        <span style={{ color: STATUS_COLOR[status], fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
          {status}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{request.service.title}</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        <strong>{price}</strong>
        <span style={{ opacity: 0.6, marginLeft: 6 }}>
          PoE{request.service.poeVersion} · {request.service.league}
        </span>
      </div>
      <div style={{ fontSize: 11, opacity: 0.65, display: 'grid', gap: 2 }}>
        <span>
          {role === 'incoming' ? 'From' : 'To'}: <strong>{request.counterparty.displayName}</strong>
          {request.counterparty.poeCharName && (
            <span style={{ opacity: 0.7 }}> · {request.counterparty.poeCharName}</span>
          )}
        </span>
        <span>
          Char to invite: <code>{role === 'incoming' ? request.requesterCharName : request.counterparty.poeCharName ?? '—'}</code>
        </span>
        <span>Created {timeAgo(request.createdAt)}</span>
      </div>
      {request.notes && (
        <div style={{ fontSize: 12, opacity: 0.8, fontStyle: 'italic', padding: '4px 0', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
          “{request.notes}”
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {role === 'incoming' && status === 'pending' && (
          <>
            <button type="button" disabled={busy} style={btnPrimary} onClick={() => act('accept')}>
              Accept
            </button>
            <button type="button" disabled={busy} style={btnDanger} onClick={() => act('decline')}>
              Decline
            </button>
          </>
        )}
        {role === 'incoming' && status === 'accepted' && (
          <>
            <button type="button" disabled={busy} style={btnPrimary} onClick={copyInvite}>
              Copy /invite
            </button>
            <button type="button" disabled={busy} style={btn} onClick={() => act('complete')}>
              Mark complete
            </button>
            <button type="button" disabled={busy} style={btnDanger} onClick={() => act('cancel')}>
              Cancel
            </button>
          </>
        )}
        {role === 'outgoing' && status === 'pending' && (
          <button type="button" disabled={busy} style={btnDanger} onClick={() => act('cancel')}>
            Cancel request
          </button>
        )}
        {role === 'outgoing' && status === 'accepted' && (
          <>
            {inviteCharName && (
              <button type="button" disabled={busy} style={btnPrimary} onClick={copyInvite}>
                Copy /invite
              </button>
            )}
            <button type="button" disabled={busy} style={btn} onClick={() => act('complete')}>
              Mark complete
            </button>
            <button type="button" disabled={busy} style={btnDanger} onClick={() => act('cancel')}>
              Cancel
            </button>
          </>
        )}
        {status === 'completed' && !rated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Rate {role === 'incoming' ? 'client' : 'provider'}:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                onMouseEnter={() => setRating(n)}
                onMouseLeave={() => setRating(null)}
                onClick={() => submitRating(n)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: (rating ?? 0) >= n ? '#fc0' : 'rgba(255,255,255,0.3)',
                  fontSize: 16,
                  padding: 2,
                }}
              >
                ★
              </button>
            ))}
          </div>
        )}
        {status === 'completed' && rated && (
          <span style={{ fontSize: 11, color: '#8c8' }}>Rated ✓</span>
        )}
      </div>
    </div>
  )
}
