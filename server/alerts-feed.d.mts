export interface OfficialAlert {
  location: string
  region: string
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

export function fetchAlertsFeed(token?: string): Promise<AlertFeed>