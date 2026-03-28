import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointDetail,
  ChargePointSummary,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  IntegrationModuleResponse,
  LoadPolicyRecord,
  NotificationsModuleResponse,
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
  WebhooksModuleResponse,
} from '@/core/types/mockApi'

function useTenantQueryContext(enabled = true) {
  const { activeTenantId, isReady } = useTenant()

  return {
    enabled: enabled && isReady,
    tenantKey: activeTenantId ?? 'default',
  }
}

export function useDemoUsers() {
  return useQuery<DemoUserHint[]>({
    queryKey: ['auth', 'demo-users'],
    queryFn: () => fetchJson<DemoUserHint[]>('/api/auth/demo-users'),
  })
}

export function useDashboardOverview(options?: { enabled?: boolean }) {
  const { enabled, tenantKey } = useTenantQueryContext(options?.enabled ?? true)

  return useQuery<DashboardOverviewResponse>({
    queryKey: ['dashboard', 'overview', tenantKey],
    queryFn: () => fetchJson<DashboardOverviewResponse>('/api/dashboard/overview'),
    enabled,
  })
}

export function useSiteOwnerDashboard(options?: { enabled?: boolean }) {
  const { enabled, tenantKey } = useTenantQueryContext(options?.enabled ?? true)

  return useQuery<SiteOwnerDashboardResponse>({
    queryKey: ['dashboard', 'site-owner', tenantKey],
    queryFn: () => fetchJson<SiteOwnerDashboardResponse>('/api/dashboard/site-owner'),
    enabled,
  })
}

export function useChargePoints() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<ChargePointSummary[]>({
    queryKey: ['charge-points', tenantKey],
    queryFn: () => fetchJson<ChargePointSummary[]>('/api/charge-points'),
    enabled,
  })
}

export function useChargePoint(id?: string) {
  const { enabled, tenantKey } = useTenantQueryContext(!!id)

  return useQuery<ChargePointDetail>({
    queryKey: ['charge-points', tenantKey, id],
    queryFn: () => fetchJson<ChargePointDetail>(`/api/charge-points/${id}`),
    enabled,
  })
}

export function useSessions() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<SessionRecord[]>({
    queryKey: ['sessions', tenantKey],
    queryFn: () => fetchJson<SessionRecord[]>('/api/sessions'),
    enabled,
  })
}

export function useIncidentCommand() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<IncidentCommandResponse>({
    queryKey: ['incidents', 'command', tenantKey],
    queryFn: () => fetchJson<IncidentCommandResponse>('/api/incidents'),
    enabled,
  })
}

export function useAlerts() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<AlertRecord[]>({
    queryKey: ['alerts', tenantKey],
    queryFn: () => fetchJson<AlertRecord[]>('/api/alerts'),
    enabled,
  })
}

export function useTariffs() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<TariffRecord[]>({
    queryKey: ['tariffs', tenantKey],
    queryFn: () => fetchJson<TariffRecord[]>('/api/tariffs'),
    enabled,
  })
}

export function useSmartCharging() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<SmartChargingResponse>({
    queryKey: ['energy', 'smart-charging', tenantKey],
    queryFn: () => fetchJson<SmartChargingResponse>('/api/energy/smart-charging'),
    enabled,
  })
}

export function useLoadPolicies() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<LoadPolicyRecord[]>({
    queryKey: ['energy', 'load-policies', tenantKey],
    queryFn: () => fetchJson<LoadPolicyRecord[]>('/api/energy/load-policies'),
    enabled,
  })
}

export function useRoamingPartners() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<RoamingPartnerRecord[]>({
    queryKey: ['roaming', 'partners', tenantKey],
    queryFn: () => fetchJson<RoamingPartnerRecord[]>('/api/roaming/partners'),
    enabled,
  })
}

export function useRoamingSessions() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<RoamingSessionsResponse>({
    queryKey: ['roaming', 'sessions', tenantKey],
    queryFn: () => fetchJson<RoamingSessionsResponse>('/api/roaming/sessions'),
    enabled,
  })
}

export function useOCPICdrs() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<OCPICdrsResponse>({
    queryKey: ['roaming', 'cdrs', tenantKey],
    queryFn: () => fetchJson<OCPICdrsResponse>('/api/roaming/cdrs'),
    enabled,
  })
}

export function useOCPICommands() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<OCPICommandsResponse>({
    queryKey: ['roaming', 'commands', tenantKey],
    queryFn: () => fetchJson<OCPICommandsResponse>('/api/roaming/commands'),
    enabled,
  })
}

export function useBilling() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<BillingResponse>({
    queryKey: ['finance', 'billing', tenantKey],
    queryFn: () => fetchJson<BillingResponse>('/api/finance/billing'),
    enabled,
  })
}

export function usePayouts() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<PayoutRecord[]>({
    queryKey: ['finance', 'payouts', tenantKey],
    queryFn: () => fetchJson<PayoutRecord[]>('/api/finance/payouts'),
    enabled,
  })
}

export function useSettlement() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<SettlementResponse>({
    queryKey: ['finance', 'settlement', tenantKey],
    queryFn: () => fetchJson<SettlementResponse>('/api/finance/settlement'),
    enabled,
  })
}

export function useTeamMembers() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<TeamMember[]>({
    queryKey: ['team', tenantKey],
    queryFn: () => fetchJson<TeamMember[]>('/api/team'),
    enabled,
  })
}

export function useAuditLogs() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<AuditLogRecord[]>({
    queryKey: ['audit-logs', tenantKey],
    queryFn: () => fetchJson<AuditLogRecord[]>('/api/audit-logs'),
    enabled,
  })
}

export function useReports() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<ReportsResponse>({
    queryKey: ['reports', tenantKey],
    queryFn: () => fetchJson<ReportsResponse>('/api/reports'),
    enabled,
  })
}

export function useProtocolEngine() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<ProtocolEngineResponse>({
    queryKey: ['protocols', tenantKey],
    queryFn: () => fetchJson<ProtocolEngineResponse>('/api/protocols'),
    enabled,
  })
}

export function useIntegrationsModule() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<IntegrationModuleResponse>({
    queryKey: ['platform', 'integrations', tenantKey],
    queryFn: () => fetchJson<IntegrationModuleResponse>('/api/platform/integrations'),
    enabled,
  })
}

export function useWebhooksModule() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<WebhooksModuleResponse>({
    queryKey: ['platform', 'webhooks', tenantKey],
    queryFn: () => fetchJson<WebhooksModuleResponse>('/api/platform/webhooks'),
    enabled,
  })
}

export function useNotificationsModule() {
  const { enabled, tenantKey } = useTenantQueryContext()

  return useQuery<NotificationsModuleResponse>({
    queryKey: ['platform', 'notifications', tenantKey],
    queryFn: () => fetchJson<NotificationsModuleResponse>('/api/platform/notifications'),
    enabled,
  })
}
