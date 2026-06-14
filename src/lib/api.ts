import type {
  EventItem,
  MeResponse,
  RequestItem,
  RequestStatus,
  ServiceCreatePayload,
  ServiceListItem,
  ServiceUpdatePayload,
} from '../types'

export const API_BASE = 'https://scalpel-services-market-api.vercel.app'

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

interface RequestOpts {
  method?: string
  body?: unknown
  token?: string | null
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  let json: unknown = null
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      json = await res.json()
    } catch {}
  }

  if (!res.ok) {
    const msg =
      (json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : null) ?? `HTTP ${res.status}`
    throw new ApiError(res.status, json, msg)
  }
  return json as T
}

// --- Auth ---

export interface PollResponse {
  status: 'pending' | 'ready' | 'expired'
  token?: string
  user?: MeResponse['user']
}

export function getAuthStartUrl(deviceCode: string): string {
  return `${API_BASE}/api/auth/start?device=${encodeURIComponent(deviceCode)}`
}

// Pre-creates the device code on the server and returns the Discord URL.
// Eliminates the race where poll() runs before the browser opens the URL.
export async function initAuth(deviceCode: string): Promise<{ code: string; authorizeUrl: string }> {
  const res = await fetch(`${API_BASE}/api/auth/start?device=${encodeURIComponent(deviceCode)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new ApiError(res.status, null, `HTTP ${res.status}`)
  return res.json()
}

export async function pollAuth(deviceCode: string): Promise<PollResponse> {
  try {
    return await api<PollResponse>(`/api/auth/poll?code=${encodeURIComponent(deviceCode)}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 202) {
      return { status: 'pending' }
    }
    if (e instanceof ApiError && e.status === 404) {
      return { status: 'expired' }
    }
    throw e
  }
}

// --- Me ---

export async function getMe(token: string): Promise<MeResponse> {
  return api<MeResponse>('/api/me', { token })
}

export async function updateMe(
  token: string,
  patch: {
    displayName?: string
    poeCharName?: string | null
    defaultLeague?: string | null
    poeVersion?: 1 | 2
  },
): Promise<{ ok: true }> {
  return api<{ ok: true }>('/api/me', { method: 'PATCH', body: patch, token })
}

// --- Services ---

export interface ListServicesQuery {
  league?: string
  poeVersion?: 1 | 2
  category?: string
  q?: string
  page?: number
  pageSize?: number
  mine?: boolean
  includeInactive?: boolean
}

export async function listServices(
  token: string | null,
  query: ListServicesQuery = {},
): Promise<{ services: ServiceListItem[]; page: number; pageSize: number; total: number }> {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== '') sp.set(k, String(v))
  }
  const qs = sp.toString()
  return api(`/api/services${qs ? `?${qs}` : ''}`, { token })
}

export async function getService(
  token: string | null,
  id: string,
): Promise<{ service: ServiceListItem }> {
  return api(`/api/services/${id}`, { token })
}

export async function createService(token: string, payload: ServiceCreatePayload): Promise<{ id: string }> {
  return api('/api/services', { method: 'POST', body: payload, token })
}

export async function updateService(
  token: string,
  id: string,
  patch: ServiceUpdatePayload,
): Promise<{ ok: true }> {
  return api(`/api/services/${id}`, { method: 'PATCH', body: patch, token })
}

export async function deleteService(token: string, id: string): Promise<{ ok: true }> {
  return api(`/api/services/${id}`, { method: 'DELETE', token })
}

// --- Requests ---

export async function createRequest(
  token: string,
  serviceId: string,
  payload: { requesterCharName: string; notes?: string },
): Promise<{ id: string }> {
  return api(`/api/services/${serviceId}/request`, { method: 'POST', body: payload, token })
}

export async function listRequests(
  token: string,
  role: 'incoming' | 'outgoing',
  status?: RequestStatus,
): Promise<{ requests: RequestItem[]; role: string; total: number }> {
  const sp = new URLSearchParams({ role })
  if (status) sp.set('status', status)
  return api(`/api/requests?${sp.toString()}`, { token })
}

export type RequestAction = 'accept' | 'decline' | 'complete' | 'cancel'

export async function transitionRequest(
  token: string,
  id: string,
  action: RequestAction,
): Promise<{ ok: true; status: RequestStatus }> {
  return api(`/api/requests/${id}`, { method: 'PATCH', body: { action }, token })
}

export async function rateRequest(token: string, id: string, stars: number): Promise<{ ok: true }> {
  return api(`/api/requests/${id}/rate`, { method: 'POST', body: { stars }, token })
}

// --- Events ---

export async function listEvents(
  token: string,
  since?: number,
  unreadOnly = false,
): Promise<{ events: EventItem[]; serverTime: number }> {
  const sp = new URLSearchParams()
  if (since) sp.set('since', String(since))
  if (unreadOnly) sp.set('unreadOnly', '1')
  const qs = sp.toString()
  return api(`/api/events${qs ? `?${qs}` : ''}`, { token })
}

export async function markEventRead(token: string, id: string): Promise<{ ok: true }> {
  return api(`/api/events/${id}/read`, { method: 'PATCH', token })
}

// --- Public profile ---

export async function getUserProfile(id: string): Promise<{
  user: { id: string; displayName: string; poeCharName: string | null; defaultLeague: string | null; poeVersion: number; createdAt: string }
  rating: { average: number; count: number }
  stats: { activeServices: number; completedJobs: number }
  activeServices: Array<{ id: string; title: string; category: string; priceCurrency: string; priceMin: string | null; priceMax: string | null; league: string; poeVersion: number }>
}> {
  return api(`/api/users/${id}`)
}
