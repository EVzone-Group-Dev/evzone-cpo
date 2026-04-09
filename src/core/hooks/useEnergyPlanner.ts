import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateTariffCalendar,
  approveEnergyOptimizationPlan,
  approveEnergySchedule,
  archiveTariffCalendar,
  createEnergyOptimizationPlan,
  createEnergyPlanRun,
  createEnergySchedule,
  createTariffCalendar,
  listEnergyOptimizationPlans,
  listEnergyPlanRuns,
  listEnergySchedules,
  listTariffCalendars,
  updateTariffCalendar,
} from '@/core/api/energyPlanner'
import { useTenant } from '@/core/hooks/useTenant'
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

function usePlannerTenantQueryContext(enabled = true) {
  const { activeScopeKey, isReady } = useTenant()
  return {
    enabled: enabled && isReady,
    scopeKey: activeScopeKey,
  }
}

function useInvalidatePlannerQueries() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
      queryClient.invalidateQueries({ queryKey: ['energy-optimization'] }),
      queryClient.invalidateQueries({ queryKey: ['energy-management', 'schedules'] }),
      queryClient.invalidateQueries({ queryKey: ['energy-management', 'plan-runs'] }),
    ])
}

export function useTariffCalendars(query?: { siteId?: string; status?: string }) {
  const { enabled, scopeKey } = usePlannerTenantQueryContext()
  return useQuery<TariffCalendar[]>({
    queryKey: ['tariffs', 'calendars', scopeKey, query?.siteId ?? null, query?.status ?? null],
    queryFn: () => listTariffCalendars(query),
    enabled,
  })
}

export function useCreateTariffCalendar() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (input: TariffCalendarInput) => createTariffCalendar(input),
    onSuccess: invalidate,
  })
}

export function useUpdateTariffCalendar() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TariffCalendarInput> }) =>
      updateTariffCalendar(id, input),
    onSuccess: invalidate,
  })
}

export function useActivateTariffCalendar() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (id: string) => activateTariffCalendar(id),
    onSuccess: invalidate,
  })
}

export function useArchiveTariffCalendar() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (id: string) => archiveTariffCalendar(id),
    onSuccess: invalidate,
  })
}

export function useEnergyOptimizationPlans(
  query?: { stationId?: string; groupId?: string; state?: string },
  options?: { enabled?: boolean },
) {
  const { enabled, scopeKey } = usePlannerTenantQueryContext(options?.enabled ?? true)
  return useQuery<EnergyOptimizationPlan[]>({
    queryKey: [
      'energy-optimization',
      'plans',
      scopeKey,
      query?.stationId ?? null,
      query?.groupId ?? null,
      query?.state ?? null,
    ],
    queryFn: () => listEnergyOptimizationPlans(query),
    enabled,
  })
}

export function useCreateEnergyOptimizationPlan() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (input: EnergyOptimizationPlanInput) => createEnergyOptimizationPlan(input),
    onSuccess: invalidate,
  })
}

export function useApproveEnergyOptimizationPlan() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (id: string) => approveEnergyOptimizationPlan(id),
    onSuccess: invalidate,
  })
}

export function useEnergySchedules(
  query?: { stationId?: string; groupId?: string; status?: string },
  options?: { enabled?: boolean },
) {
  const { enabled, scopeKey } = usePlannerTenantQueryContext(options?.enabled ?? true)
  return useQuery<EnergySchedule[]>({
    queryKey: [
      'energy-management',
      'schedules',
      scopeKey,
      query?.stationId ?? null,
      query?.groupId ?? null,
      query?.status ?? null,
    ],
    queryFn: () => listEnergySchedules(query),
    enabled,
  })
}

export function useCreateEnergySchedule() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (input: EnergyScheduleInput) => createEnergySchedule(input),
    onSuccess: invalidate,
  })
}

export function useApproveEnergySchedule() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: { notes?: string; fallbackToDlm?: boolean } }) =>
      approveEnergySchedule(id, input),
    onSuccess: invalidate,
  })
}

export function useEnergyPlanRuns(
  query?: { stationId?: string; groupId?: string; planId?: string },
  options?: { enabled?: boolean },
) {
  const { enabled, scopeKey } = usePlannerTenantQueryContext(options?.enabled ?? true)
  return useQuery<EnergyPlanRun[]>({
    queryKey: [
      'energy-management',
      'plan-runs',
      scopeKey,
      query?.stationId ?? null,
      query?.groupId ?? null,
      query?.planId ?? null,
    ],
    queryFn: () => listEnergyPlanRuns(query),
    enabled,
  })
}

export function useCreateEnergyPlanRun() {
  const invalidate = useInvalidatePlannerQueries()
  return useMutation({
    mutationFn: (input: EnergyPlanRunInput) => createEnergyPlanRun(input),
    onSuccess: invalidate,
  })
}
