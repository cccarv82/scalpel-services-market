import { CATEGORY_LABEL, formatPrice, timeAgo } from '../lib/format'
import type { ServiceListItem } from '../types'
import { btn, btnPrimary } from './ui'

interface Props {
  service: ServiceListItem
  ownerView?: boolean
  onRequest?: () => void
  onCopyInvite?: () => void
  onToggleActive?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ServiceCard({ service, ownerView, onRequest, onCopyInvite, onToggleActive, onEdit, onDelete }: Props) {
  const price = formatPrice(service.priceCurrency, service.priceMin, service.priceMax)
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
        opacity: service.active ? 1 : 0.55,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ opacity: 0.6, fontSize: 11 }}>{timeAgo(service.createdAt)}</span>
        <span style={{ color: '#f0a020', fontSize: 11, fontWeight: 600 }}>{CATEGORY_LABEL[service.category]}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, white)' }}>{service.title}</div>
      {service.description && (
        <div
          style={{
            fontSize: 12,
            opacity: 0.75,
            maxHeight: 60,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {service.description}
        </div>
      )}
      {service.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {service.tags.map((t) => (
            <span
              key={t}
              style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 6px',
                borderRadius: 3,
                fontSize: 10,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontSize: 12 }}>
          <strong>{price}</strong>
          <span style={{ opacity: 0.5, marginLeft: 8 }}>
            PoE{service.poeVersion} · {service.league}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11 }}>
        <span style={{ opacity: 0.7 }}>
          {service.providerName}
          {service.providerCharName && <span style={{ opacity: 0.5 }}> · {service.providerCharName}</span>}
        </span>
        {service.ratingCount > 0 && (
          <span>
            <span style={{ color: '#fc0' }}>★</span> {service.ratingAvg.toFixed(2)}{' '}
            <span style={{ opacity: 0.5 }}>({service.ratingCount})</span>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {ownerView ? (
          <>
            {onToggleActive && (
              <button type="button" style={btn} onClick={onToggleActive}>
                {service.active ? 'Pause' : 'Activate'}
              </button>
            )}
            {onEdit && (
              <button type="button" style={btn} onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" style={btn} onClick={onDelete}>
                Delete
              </button>
            )}
          </>
        ) : (
          <>
            {onRequest && (
              <button type="button" style={btnPrimary} onClick={onRequest}>
                Request service
              </button>
            )}
            {onCopyInvite && service.providerCharName && (
              <button type="button" style={btn} onClick={onCopyInvite} title={`Copy /invite ${service.providerCharName}`}>
                Copy /invite
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
