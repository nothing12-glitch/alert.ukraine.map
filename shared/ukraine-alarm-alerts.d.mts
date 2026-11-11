export type AlertScope = 'oblast' | 'raion'

export interface UkraineAlarmAlertLevel {
  alertLevel?: string
  reason?: string
  createdAt?: string
}

export interface UkraineAlarmActiveAlert {
  regionId?: string
  regionType?: string
  type?: string
  lastUpdate?: string
  activeAlertLevels?: UkraineAlarmAlertLevel[]
}

export interface UkraineAlarmRegion {
  regionId?: string
  regionName?: string
  regionEngName?: string
  regionType?: string
  lastUpdate?: string
  activeAlerts?: UkraineAlarmActiveAlert[]
  regionChildIds?: UkraineAlarmRegion[]
}

export type UkraineAlarmAlertsPayload = UkraineAlarmRegion[]
export type UkraineAlarmRegionsPayload = { states?: UkraineAlarmRegion[] }
export type OblastIndex = Map<string, string>

export interface NormalizedAlert {
  location: string
  region: string
  scope: AlertScope
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

export const ukraineAlarmRegionsUrl: string
export const ukraineAlarmAlertsUrl: string
export const ukraineAlarmSource: string

export function formatStartedAt(value: string): string
export function formatDuration(startedAt: string): string
export function buildOblastIndex(payload: UkraineAlarmRegionsPayload): OblastIndex
export function normalizeUkraineAlarmFeed(
  payload: UkraineAlarmAlertsPayload,
  oblastIndex: OblastIndex,
  fetchedAt?: string,
): NormalizedFeed
