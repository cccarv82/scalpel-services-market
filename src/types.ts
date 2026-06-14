export type ServiceCategory =
  | 'act_carry'
  | 'boss_carry'
  | 'leveling_carry'
  | 'map_hosting'
  | 'trial_carry'
  | 'ascendancy_carry'
  | 'campaign_carry'
  | 'other'

export interface PriceTier {
  label: string
  price: number
}

export type PriceCurrency = 'chaos' | 'divine' | 'exalted' | 'mirror' | 'free_for_vouch'

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

export type EventKind =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_completed'
  | 'request_cancelled'
  | 'new_rating'

export interface AuthedUser {
  id: string
  discordUsername: string
  displayName: string
  poeCharName: string | null
  defaultLeague: string | null
  poeVersion: number
}

export interface MeResponse {
  user: AuthedUser
  rating: { average: number; count: number }
}

export interface ServiceListItem {
  id: string
  category: ServiceCategory
  title: string
  description: string
  priceCurrency: PriceCurrency
  priceMin: string | null
  priceMax: string | null
  priceTiers: PriceTier[]
  tags: string[]
  poeVersion: number
  league: string
  active: boolean
  createdAt: string
  providerId: string
  providerName: string
  providerCharName: string | null
  ratingAvg: number
  ratingCount: number
}

export interface RequestItem {
  id: string
  status: RequestStatus
  requesterCharName: string
  notes: string | null
  createdAt: string
  acceptedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  declinedAt: string | null
  service: {
    id: string
    title: string
    category: ServiceCategory
    priceCurrency: PriceCurrency
    priceMin: string | null
    priceMax: string | null
    league: string
    poeVersion: number
  }
  counterparty: {
    id: string
    displayName: string
    poeCharName: string | null
  }
}

export interface EventItem {
  id: string
  userId: string
  kind: EventKind
  payload: Record<string, unknown>
  read: boolean
  createdAt: string
}

export interface ServiceCreatePayload {
  category: ServiceCategory
  title: string
  description: string
  priceCurrency: PriceCurrency
  priceMin?: number | null
  priceMax?: number | null
  priceTiers?: PriceTier[]
  tags: string[]
  poeVersion: 1 | 2
  league: string
}

export type ServiceUpdatePayload = Partial<ServiceCreatePayload> & { active?: boolean }
