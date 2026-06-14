import { useState } from 'react'
import { ApiError, reportService } from '../lib/api'
import type { ServiceListItem } from '../types'
import { btn, btnDanger, card, input, label as labelStyle } from './ui'

interface Props {
  token: string
  service: ServiceListItem
  onClose: () => void
  onReported: () => void
}

const REASONS = [
  { value: 'rmt', label: 'Real-money trade attempt' },
  { value: 'scam', label: 'Scam / dishonest pricing' },
  { value: 'harassment', label: 'Harassment in description' },
  { value: 'misleading', label: 'Misleading / impossible service' },
  { value: 'other', label: 'Other' },
] as const

export function ReportForm({ token, service, onClose, onReported }: Props) {
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('rmt')
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      const text = `${reason}${detail.trim() ? ` — ${detail.trim()}` : ''}`
      await reportService(token, service.id, text)
      onReported()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('You already reported this service.')
      } else {
        setError((e as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...card, width: '100%', maxWidth: 460, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: 14 }}>Report service</strong>
          <button type="button" style={btn} onClick={onClose}>
            ← Back
          </button>
        </div>
        <div style={{ fontSize: 13 }}>{service.title}</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>by {service.providerName}</div>

        <div>
          <div style={labelStyle}>Reason</div>
          <select
            style={input as React.CSSProperties}
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Details (optional)</div>
          <textarea
            style={{ ...input, minHeight: 80, resize: 'vertical' }}
            maxLength={250}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="What did you observe?"
          />
        </div>
        {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={btnDanger} disabled={busy} onClick={submit}>
            {busy ? 'Reporting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
