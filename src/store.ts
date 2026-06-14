import type { PluginStorage } from '@scalpelpoe/plugin-sdk'
import { create } from 'zustand'
import type { AuthedUser, EventItem, EventKind, MeResponse, RequestItem, ServiceListItem } from './types'

const KEYS = {
  token: 'token',
  user: 'user',
  lastEventTs: 'lastEventTs',
} as const

interface Store {
  ready: boolean
  token: string | null
  user: AuthedUser | null
  rating: { average: number; count: number }

  // Cache
  services: ServiceListItem[]
  myServices: ServiceListItem[]
  incoming: RequestItem[]
  outgoing: RequestItem[]
  events: EventItem[]
  lastEventTs: number

  // UI
  view: 'login' | 'board' | 'mine' | 'incoming' | 'outgoing' | 'profile'

  hydrate(payload: { token: string | null; user: AuthedUser | null; lastEventTs: number }): void
  setAuth(token: string, me: MeResponse): void
  logout(): void
  setMe(me: MeResponse): void
  setServices(list: ServiceListItem[]): void
  setMyServices(list: ServiceListItem[]): void
  setIncoming(list: RequestItem[]): void
  setOutgoing(list: RequestItem[]): void
  pushEvents(list: EventItem[], serverTime: number): void
  markEventRead(id: string): void
  setView(view: Store['view']): void
  markEventsReadByKind(kinds: EventKind[]): void
}

export const useStore = create<Store>((set) => ({
  ready: false,
  token: null,
  user: null,
  rating: { average: 0, count: 0 },
  services: [],
  myServices: [],
  incoming: [],
  outgoing: [],
  events: [],
  lastEventTs: 0,
  view: 'login',

  hydrate({ token, user, lastEventTs }) {
    set({ token, user, lastEventTs, ready: true, view: token && user ? 'board' : 'login' })
  },

  setAuth(token, me) {
    set({ token, user: me.user, rating: me.rating, view: 'board' })
  },

  logout() {
    set({
      token: null,
      user: null,
      rating: { average: 0, count: 0 },
      services: [],
      myServices: [],
      incoming: [],
      outgoing: [],
      events: [],
      view: 'login',
    })
  },

  setMe(me) {
    set({ user: me.user, rating: me.rating })
  },

  setServices(list) {
    set({ services: list })
  },
  setMyServices(list) {
    set({ myServices: list })
  },
  setIncoming(list) {
    set({ incoming: list })
  },
  setOutgoing(list) {
    set({ outgoing: list })
  },
  pushEvents(list, serverTime) {
    set((s) => {
      const known = new Set(s.events.map((e) => e.id))
      const fresh = list.filter((e) => !known.has(e.id))
      return {
        events: [...fresh, ...s.events].slice(0, 200),
        lastEventTs: serverTime,
      }
    })
  },
  markEventRead(id) {
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, read: true } : e)),
    }))
  },
  setView(view) {
    set({ view })
  },

  markEventsReadByKind(kinds) {
    set((s) => ({
      events: s.events.map((e) => (kinds.includes(e.kind) ? { ...e, read: true } : e)),
    }))
  },
}))

export async function loadFromStorage(storage: PluginStorage): Promise<{
  token: string | null
  user: AuthedUser | null
  lastEventTs: number
}> {
  const [token, user, lastEventTs] = await Promise.all([
    storage.get<string>(KEYS.token),
    storage.get<AuthedUser>(KEYS.user),
    storage.get<number>(KEYS.lastEventTs),
  ])
  return { token, user, lastEventTs: lastEventTs ?? 0 }
}

export async function persistAuth(storage: PluginStorage, token: string | null, user: AuthedUser | null): Promise<void> {
  if (token) await storage.set(KEYS.token, token)
  else await storage.delete(KEYS.token)
  if (user) await storage.set(KEYS.user, user)
  else await storage.delete(KEYS.user)
}

export async function persistLastEventTs(storage: PluginStorage, ts: number): Promise<void> {
  await storage.set(KEYS.lastEventTs, ts)
}
