export interface NeptunAlertEntry {
  name?: string
  oblast?: string
  since?: string
  level?: string
}

export interface NeptunAlertPayload {
  raions?: NeptunAlertEntry[]
  oblasts?: NeptunAlertEntry[]
}

export interface NormalizedAlert {
  location: string
  region: string
  type: string
  startedAt: string
  startedAtIso: string
  duration: string
  alertLevel: string
}

export interface NormalizedFeed {
  source: string
  fetchedAt: string
  alerts: NormalizedAlert[]
}

export const neptunAlertsUrl: string
export const neptunStreamUrl: string
export const neptunSource: string
export const neptunAlertType: string

export function formatStartedAt(value: string): string
export function formatDuration(startedAt: string): string
export function normalizeNeptunAlert(entry: NeptunAlertEntry): NormalizedAlert
export function normalizeNeptunFeed(payload: NeptunAlertPayload, fetchedAt?: string): NormalizedFeed
