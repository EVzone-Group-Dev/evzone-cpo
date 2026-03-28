import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointDetail,
  ChargePointSummary,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  LoadPolicyRecord,
  ModuleNotice,
  OCPICdrsResponse,
  OCPICommandsResponse,
  PayoutRecord,
  ProtocolEngineResponse,
  ReportsResponse,
  RoamingPartnerRecord,
  RoamingSessionsResponse,
  SessionRecord,
  SettlementResponse,
  SiteOwnerDashboardResponse,
  SmartChargingResponse,
  TariffRecord,
  TeamMember,
} from '@/core/types/mockApi'

export function useDemoUsers() {
  return useQuery<DemoUserHint[]>({
    queryKey: ['auth', 'demo-users'],
    queryFn: () => fetchJson<DemoUserHint[]>('/api/auth/demo-users'),
  })
}

export function useDashboardOverview() {
  return useQuery<DashboardOverviewResponse>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => fetchJson<DashboardOverviewResponse>('/api/dashboard/overview'),
  })
}

export function useSiteOwnerDashboard() {
  return useQuery<SiteOwnerDashboardResponse>({
    queryKey: ['dashboard', 'site-owner'],
    queryFn: () => fetchJson<SiteOwnerDashboardResponse>('/api/dashboard/site-owner'),
  })
}

export function useChargePoints() {
  return useQuery<ChargePointSummary[]>({
    queryKey: ['charge-points'],
    queryFn: () => fetchJson<ChargePointSummary[]>('/api/charge-points'),
  })
}

export function useChargePoint(id?: string) {
  return useQuery<ChargePointDetail>({
    queryKey: ['charge-points', id],
    queryFn: () => fetchJson<ChargePointDetail>(`/api/charge-points/${id}`),
    enabled: !!id,
  })
}

export function useSessions() {
  return useQuery<SessionRecord[]>({
    queryKey: ['sessions'],
    queryFn: () => fetchJson<SessionRecord[]>('/api/sessions'),
  })
}

export function useIncidentCommand() {
  return useQuery<IncidentCommandResponse>({
    queryKey: ['incidents', 'command'],
    queryFn: () => fetchJson<IncidentCommandResponse>('/api/incidents'),
  })
}

export function useAlerts() {
  return useQuery<AlertRecord[]>({
    queryKey: ['alerts'],
    queryFn: () => fetchJson<AlertRecord[]>('/api/alerts'),
  })
}

export function useTariffs() {
  return useQuery<TariffRecord[]>({
    queryKey: ['tariffs'],
    queryFn: () => fetchJson<TariffRecord[]>('/api/tariffs'),
  })
}

export function useSmartCharging() {
  return useQuery<SmartChargingResponse>({
    queryKey: ['energy', 'smart-charging'],
    queryFn: () => fetchJson<SmartChargingResponse>('/api/energy/smart-charging'),
  })
}

export function useLoadPolicies() {
  return useQuery<LoadPolicyRecord[]>({
    queryKey: ['energy', 'load-policies'],
    queryFn: () => fetchJson<LoadPolicyRecord[]>('/api/energy/load-policies'),
  })
}

export function useRoamingPartners() {
  return useQuery<RoamingPartnerRecord[]>({
    queryKey: ['roaming', 'partners'],
    queryFn: () => fetchJson<RoamingPartnerRecord[]>('/api/roaming/partners'),
  })
}

export function useRoamingSessions() {
  return useQuery<RoamingSessionsResponse>({
    queryKey: ['roaming', 'sessions'],
    queryFn: () => fetchJson<RoamingSessionsResponse>('/api/roaming/sessions'),
  })
}

export function useOCPICdrs() {
  return useQuery<OCPICdrsResponse>({
    queryKey: ['roaming', 'cdrs'],
    queryFn: () => fetchJson<OCPICdrsResponse>('/api/roaming/cdrs'),
  })
}

export function useOCPICommands() {
  return useQuery<OCPICommandsResponse>({
    queryKey: ['roaming', 'commands'],
    queryFn: () => fetchJson<OCPICommandsResponse>('/api/roaming/commands'),
  })
}

export function useBilling() {
  return useQuery<BillingResponse>({
    queryKey: ['finance', 'billing'],
    queryFn: () => fetchJson<BillingResponse>('/api/finance/billing'),
  })
}

export function usePayouts() {
  return useQuery<PayoutRecord[]>({
    queryKey: ['finance', 'payouts'],
    queryFn: () => fetchJson<PayoutRecord[]>('/api/finance/payouts'),
  })
}

export function useSettlement() {
  return useQuery<SettlementResponse>({
    queryKey: ['finance', 'settlement'],
    queryFn: () => fetchJson<SettlementResponse>('/api/finance/settlement'),
  })
}

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: () => fetchJson<TeamMember[]>('/api/team'),
  })
}

export function useAuditLogs() {
  return useQuery<AuditLogRecord[]>({
    queryKey: ['audit-logs'],
    queryFn: () => fetchJson<AuditLogRecord[]>('/api/audit-logs'),
  })
}

export function useReports() {
  return useQuery<ReportsResponse>({
    queryKey: ['reports'],
    queryFn: () => fetchJson<ReportsResponse>('/api/reports'),
  })
}

export function useProtocolEngine() {
  return useQuery<ProtocolEngineResponse>({
    queryKey: ['protocols'],
    queryFn: () => fetchJson<ProtocolEngineResponse>('/api/protocols'),
  })
}

export function useModuleNotice(moduleKey: 'integrations' | 'webhooks' | 'notifications') {
  return useQuery<ModuleNotice>({
    queryKey: ['platform', moduleKey],
    queryFn: () => fetchJson<ModuleNotice>(`/api/platform/${moduleKey}`),
  })
}
