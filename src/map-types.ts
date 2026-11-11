export type AlertState = 'active' | 'partial' | 'nominal' | 'clear' | 'unknown'
export type ThreatLevel = 'red' | 'yellow'
export type ThreatKind = 'air' | 'artillery' | 'urban' | 'chemical' | 'radiation' | 'other'
export type PulseItem = { regionId: string; level: ThreatLevel; kind: ThreatKind }
export type Pulse = { token: number; items: PulseItem[] }
