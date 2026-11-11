export type AlertState = 'active' | 'partial' | 'nominal' | 'clear' | 'unknown'
export type ThreatLevel = 'red' | 'yellow'
export type PulseItem = { regionId: string; level: ThreatLevel }
export type Pulse = { token: number; items: PulseItem[] }
