import { fetchJson } from '@/core/api/fetchJson'
import type {
  EnergyOptimizationPlan,
  EnergyOptimizationPlanInput,
  EnergyPlanRun,
  EnergyPlanRunInput,
  EnergySchedule,
  EnergyScheduleInput,
  TariffCalendar,
  TariffCalendarInput,
} from '@/core/types/energyPlanner'

function buildQueryString(query?: Record<string, string | undefined | null>) {
  if (!query) return ''

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (!value || !value.trim()) return
    params.set(key, value.trim())
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function jsonRequest<T>(path: string, body?: unknown, method = 'POST') {
  return fetchJson<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function listTariffCalendars(query?: { siteId?: string; status?: string }) {
  return fetchJson<TariffCalendar[]>(`/api/v1/tariffs${buildQueryString(query)}`)
}

export function getTariffCalendar(id: string) {
  return fetchJson<TariffCalendar>(`/api/v1/tariffs/${encodeURIComponent(id)}`)
}

export function createTariffCalendar(input: TariffCalendarInput) {
  return jsonRequest<TariffCalendar>('/api/v1/tariffs', input, 'POST')
}

export function updateTariffCalendar(id: string, input: Partial<TariffCalendarInput>) {
  return jsonRequest<TariffCalendar>(
    `/api/v1/tariffs/${encodeURIComponent(id)}`,
    input,
    'PATCH',
  )
}

export function activateTariffCalendar(id: string) {
  return jsonRequest<TariffCalendar>(
    `/api/v1/tariffs/${encodeURIComponent(id)}/activate`,
    {},
    'POST',
  )
}

export function archiveTariffCalendar(id: string) {
  return fetchJson<TariffCalendar>(`/api/v1/tariffs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function listEnergyOptimizationPlans(query?: {
  stationId?: string
  groupId?: string
  state?: string
}) {
  return fetchJson<EnergyOptimizationPlan[]>(
    `/api/v1/energy-optimization/plans${buildQueryString(query)}`,
  )
}

export function getEnergyOptimizationPlan(id: string) {
  return fetchJson<EnergyOptimizationPlan>(
    `/api/v1/energy-optimization/plans/${encodeURIComponent(id)}`,
  )
}

export function createEnergyOptimizationPlan(input: EnergyOptimizationPlanInput) {
  return jsonRequest<EnergyOptimizationPlan>('/api/v1/energy-optimization/plans', input, 'POST')
}

export function approveEnergyOptimizationPlan(id: string) {
  return jsonRequest<EnergyOptimizationPlan>(
    `/api/v1/energy-optimization/plans/${encodeURIComponent(id)}/approve`,
    {},
    'POST',
  )
}

export function listEnergySchedules(query?: {
  stationId?: string
  groupId?: string
  status?: string
}) {
  return fetchJson<EnergySchedule[]>(
    `/api/v1/energy-management/schedules${buildQueryString(query)}`,
  )
}

export function createEnergySchedule(input: EnergyScheduleInput) {
  return jsonRequest<EnergySchedule>('/api/v1/energy-management/schedules', input, 'POST')
}

export function approveEnergySchedule(id: string, input?: { notes?: string; fallbackToDlm?: boolean }) {
  return jsonRequest<EnergySchedule>(
    `/api/v1/energy-management/schedules/${encodeURIComponent(id)}/approve`,
    input ?? {},
    'POST',
  )
}

export function listEnergyPlanRuns(query?: {
  stationId?: string
  groupId?: string
  planId?: string
}) {
  return fetchJson<EnergyPlanRun[]>(
    `/api/v1/energy-management/plan-runs${buildQueryString(query)}`,
  )
}

export function createEnergyPlanRun(input: EnergyPlanRunInput) {
  return jsonRequest<EnergyPlanRun>('/api/v1/energy-management/plan-runs', input, 'POST')
}
