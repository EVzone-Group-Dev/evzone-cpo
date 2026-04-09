export interface TariffBand {
  id: string
  label: string
  daysOfWeek: number[]
  startHour: number
  endHour: number
  pricePerKwh: number
  currency: string
}

export interface TariffBandIntegrity {
  isConsistent: boolean
  issues: string[]
}

export interface TariffCalendar {
  id: string
  tenantId: string
  siteId: string | null
  name: string
  version: number
  currency: string
  timezone: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | string
  active: boolean
  type: string
  effectiveFrom: string
  effectiveTo: string | null
  pricePerKwh: number
  averagePricePerKwh: number
  bandCount: number
  bands: TariffBand[]
  stale: boolean
  inconsistent: boolean
  integrity: TariffBandIntegrity
  metadata: Record<string, unknown> | null
  approvedBy: string | null
  approvedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface TariffCalendarInput {
  siteId?: string | null
  name: string
  version?: number
  currency?: string
  timezone?: string
  status?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  metadata?: Record<string, unknown>
  bands?: Array<{
    id?: string
    label: string
    daysOfWeek: number[]
    startHour: number
    endHour: number
    pricePerKwh: number
    currency?: string
  }>
  pricePerKwh?: number
}

export interface EnergyOptimizationPlan {
  id: string
  tenantId: string
  stationId: string
  groupId: string | null
  tariffCalendarId: string | null
  state: string
  fallbackReason: string | null
  windowStart: string
  windowEnd: string
  constraints: Record<string, unknown> | null
  summary: Record<string, unknown> | null
  schedule: Array<Record<string, unknown>> | null
  diagnostics: Record<string, unknown> | null
  approvedBy: string | null
  approvedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface EnergyOptimizationPlanInput {
  stationId: string
  groupId?: string
  tariffCalendarId?: string
  windowStart?: string
  windowEnd?: string
  departureTime?: string
  targetEnergyKwh?: number
  minChargeAmps?: number
  maxChargeAmps?: number
  dryRun?: boolean
}

export interface EnergySchedule {
  id: string
  tenantId: string
  stationId: string
  groupId: string | null
  planId: string | null
  status: string
  source: string
  startsAt: string
  endsAt: string
  entries: Array<Record<string, unknown>>
  fallbackToDlm: boolean
  notes: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface EnergyScheduleInput {
  planId?: string
  stationId?: string
  groupId?: string
  status?: string
  startsAt?: string
  endsAt?: string
  entries?: Array<Record<string, unknown>>
  fallbackToDlm?: boolean
  notes?: string
}

export interface EnergyPlanRun {
  id: string
  tenantId: string
  planId: string | null
  scheduleId: string | null
  stationId: string | null
  groupId: string | null
  trigger: string
  state: string
  message: string | null
  startedAt: string
  completedAt: string | null
  metrics: Record<string, unknown> | null
  output: Record<string, unknown> | null
  initiatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface EnergyPlanRunInput {
  planId?: string
  scheduleId?: string
  stationId?: string
  groupId?: string
  trigger?: string
  state?: string
  dryRun?: boolean
  message?: string
  metrics?: Record<string, unknown>
  output?: Record<string, unknown>
}
