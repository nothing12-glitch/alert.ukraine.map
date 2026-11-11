export interface OfficialAlert {
  location: string
  region: string
  scope: 'oblast' | 'raion'
  type: string
  startedAt: string
  startedAtIso: string
  duration: string
  alertLevel: string
}

export interface AlertFeed {
  source: string
  fetchedAt: string
  alerts: OfficialAlert[]
}

export const feedCacheMs: number

export function fetchAlertsFeed(token?: string): Promise<AlertFeed>
export function getAlertsFeed(token?: string): Promise<AlertFeed>