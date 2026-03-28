import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  ACCESS_POLICY,
  getRoleHomePath,
} from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { RequireAuth, RequireGuest } from './guards'
import { PATHS } from './paths'

// Lazy-loaded pages
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const SiteOwnerDashboard = lazy(() => import('@/pages/dashboard/SiteOwnerDashboard').then(m => ({ default: m.SiteOwnerDashboard })))
const StationsPage      = lazy(() => import('@/pages/stations/StationsPage').then(m => ({ default: m.StationsPage })))
const StationDetailPage = lazy(() => import('@/pages/stations/StationDetailPage').then(m => ({ default: m.StationDetailPage })))
const CreateStationPage = lazy(() => import('@/pages/stations/CreateStationPage').then(m => ({ default: m.CreateStationPage })))
const ChargePointsPage  = lazy(() => import('@/pages/charge-points/ChargePointsPage').then(m => ({ default: m.ChargePointsPage })))
const ChargePointDetailPage = lazy(() => import('@/pages/charge-points/ChargePointDetailPage').then(m => ({ default: m.ChargePointDetailPage })))
const SwapStationsPage = lazy(() => import('@/pages/swapping/SwapStationsPage').then(m => ({ default: m.SwapStationsPage })))
const SwapStationDetailPage = lazy(() => import('@/pages/swapping/SwapStationDetailPage').then(m => ({ default: m.SwapStationDetailPage })))
const SessionsPage      = lazy(() => import('@/pages/sessions/SessionsPage').then(m => ({ default: m.SessionsPage })))
const SwapSessionsPage = lazy(() => import('@/pages/swapping/SwapSessionsPage').then(m => ({ default: m.SwapSessionsPage })))
const IncidentsPage     = lazy(() => import('@/pages/incidents/IncidentsPage').then(m => ({ default: m.IncidentsPage })))
const AlertsPage        = lazy(() => import('@/pages/alerts/AlertsPage').then(m => ({ default: m.AlertsPage })))
const TariffsPage       = lazy(() => import('@/pages/tariffs/TariffsPage').then(m => ({ default: m.TariffsPage })))
const SmartChargingPage = lazy(() => import('@/pages/energy/SmartChargingPage').then(m => ({ default: m.SmartChargingPage })))
const LoadPolicyPage    = lazy(() => import('@/pages/energy/LoadPolicyPage').then(m => ({ default: m.LoadPolicyPage })))
const BatteryInventoryPage = lazy(() => import('@/pages/swapping/BatteryInventoryPage').then(m => ({ default: m.BatteryInventoryPage })))
const OCPIPartnersPage  = lazy(() => import('@/pages/roaming/OCPIPartnersPage').then(m => ({ default: m.OCPIPartnersPage })))
const OCPICDRsPage      = lazy(() => import('@/pages/roaming/OCPICDRsPage').then(m => ({ default: m.OCPICDRsPage })))
const RoamingSessionsPage = lazy(() => import('@/pages/roaming/RoamingSessionsPage').then(m => ({ default: m.RoamingSessionsPage })))
const OCPICommandsPage = lazy(() => import('@/pages/roaming/OCPICommandsPage').then(m => ({ default: m.OCPICommandsPage })))
const BillingPage       = lazy(() => import('@/pages/finance/BillingPage').then(m => ({ default: m.BillingPage })))
const PayoutsPage       = lazy(() => import('@/pages/finance/PayoutsPage').then(m => ({ default: m.PayoutsPage })))
const SettlementPage    = lazy(() => import('@/pages/finance/SettlementPage').then(m => ({ default: m.SettlementPage })))
const TeamPage          = lazy(() => import('@/pages/team/TeamPage').then(m => ({ default: m.TeamPage })))
const ReportsPage       = lazy(() => import('@/pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const AuditLogsPage     = lazy(() => import('@/pages/audit/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })))
const WebhooksPage      = lazy(() => import('@/pages/webhooks/WebhooksPage').then(m => ({ default: m.WebhooksPage })))
const IntegrationsPage  = lazy(() => import('@/pages/integrations/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })))
const ProtocolsPage     = lazy(() => import('@/pages/protocols/ProtocolsPage').then(m => ({ default: m.ProtocolsPage })))
const SettingsPage      = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const WhiteLabelPage    = lazy(() => import('@/pages/settings/WhiteLabelPage').then(m => ({ default: m.WhiteLabelPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #30363d', borderTopColor: '#3fb950', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function RoleHomeRedirect() {
  const userRole = useAuthStore((state) => state.user?.role)
  return <Navigate to={getRoleHomePath(userRole)} replace />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path={PATHS.HOME} element={<Navigate to={PATHS.DASHBOARD} replace />} />
        <Route path={PATHS.LOGIN} element={<RequireGuest><LoginPage /></RequireGuest>} />

        {/* Protected — Infrastructure */}
        <Route path={PATHS.DASHBOARD} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardHome}><RoleHomeRedirect /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_SUPER_ADMIN} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardSuperAdmin}><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_CPO_ADMIN} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardCpoAdmin}><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_STATION_MANAGER} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardStationManager}><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_FINANCE} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardFinance}><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_OPERATOR} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardOperator}><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_TECHNICIAN} element={<RequireAuth allowedRoles={ACCESS_POLICY.dashboardTechnician}><DashboardPage /></RequireAuth>} />
        <Route path="/site-dashboard"     element={<RequireAuth allowedRoles={ACCESS_POLICY.siteDashboard}><SiteOwnerDashboard /></RequireAuth>} />
        <Route path={PATHS.STATIONS} element={<RequireAuth allowedRoles={ACCESS_POLICY.stationsRead}><StationsPage /></RequireAuth>} />
        <Route path="/stations/new" element={<RequireAuth allowedRoles={ACCESS_POLICY.stationsWrite}><CreateStationPage /></RequireAuth>} />
        <Route path="/stations/:id" element={<RequireAuth allowedRoles={ACCESS_POLICY.stationsRead}><StationDetailPage /></RequireAuth>} />
        <Route path={PATHS.CHARGE_POINTS} element={<RequireAuth allowedRoles={ACCESS_POLICY.chargePointsRead}><ChargePointsPage /></RequireAuth>} />
        <Route path="/charge-points/:id"  element={<RequireAuth allowedRoles={ACCESS_POLICY.chargePointsRead}><ChargePointDetailPage /></RequireAuth>} />
        <Route path={PATHS.SWAP_STATIONS} element={<RequireAuth allowedRoles={ACCESS_POLICY.swapStationsRead}><SwapStationsPage /></RequireAuth>} />
        <Route path="/swap-stations/:id" element={<RequireAuth allowedRoles={ACCESS_POLICY.swapStationsRead}><SwapStationDetailPage /></RequireAuth>} />

        {/* Operations */}
        <Route path={PATHS.SESSIONS}   element={<RequireAuth allowedRoles={ACCESS_POLICY.sessionsRead}><SessionsPage /></RequireAuth>} />
        <Route path={PATHS.SWAP_SESSIONS} element={<RequireAuth allowedRoles={ACCESS_POLICY.swapSessionsRead}><SwapSessionsPage /></RequireAuth>} />
        <Route path={PATHS.INCIDENTS}  element={<RequireAuth allowedRoles={ACCESS_POLICY.incidentsRead}><IncidentsPage /></RequireAuth>} />
        <Route path={PATHS.ALERTS}     element={<RequireAuth allowedRoles={ACCESS_POLICY.alertsRead}><AlertsPage /></RequireAuth>} />

        {/* Energy */}
        <Route path={PATHS.SMART_CHARGING} element={<RequireAuth allowedRoles={ACCESS_POLICY.smartChargingRead}><SmartChargingPage /></RequireAuth>} />
        <Route path={PATHS.LOAD_POLICY}    element={<RequireAuth allowedRoles={ACCESS_POLICY.loadPoliciesRead}><LoadPolicyPage /></RequireAuth>} />
        <Route path={PATHS.BATTERY_INVENTORY} element={<RequireAuth allowedRoles={ACCESS_POLICY.batteryInventoryRead}><BatteryInventoryPage /></RequireAuth>} />

        {/* Roaming */}
        <Route path={PATHS.OCPI_PARTNERS}  element={<RequireAuth allowedRoles={ACCESS_POLICY.roamingRead}><OCPIPartnersPage /></RequireAuth>} />
        <Route path="/roaming/sessions"    element={<RequireAuth allowedRoles={ACCESS_POLICY.roamingRead}><RoamingSessionsPage /></RequireAuth>} />
        <Route path="/roaming/commands"    element={<RequireAuth allowedRoles={ACCESS_POLICY.roamingRead}><OCPICommandsPage /></RequireAuth>} />
        <Route path={PATHS.OCPI_CDRS}      element={<RequireAuth allowedRoles={ACCESS_POLICY.roamingRead}><OCPICDRsPage /></RequireAuth>} />

        {/* Finance */}
        <Route path={PATHS.TARIFFS}    element={<RequireAuth allowedRoles={ACCESS_POLICY.tariffsRead}><TariffsPage /></RequireAuth>} />
        <Route path={PATHS.BILLING}    element={<RequireAuth allowedRoles={ACCESS_POLICY.billingRead}><BillingPage /></RequireAuth>} />
        <Route path={PATHS.PAYOUTS}    element={<RequireAuth allowedRoles={ACCESS_POLICY.payoutsRead}><PayoutsPage /></RequireAuth>} />
        <Route path={PATHS.SETTLEMENT} element={<RequireAuth allowedRoles={ACCESS_POLICY.settlementRead}><SettlementPage /></RequireAuth>} />

        {/* Team */}
        <Route path={PATHS.TEAM}       element={<RequireAuth allowedRoles={ACCESS_POLICY.teamRead}><TeamPage /></RequireAuth>} />

        {/* Platform */}
        <Route path={PATHS.REPORTS}       element={<RequireAuth allowedRoles={ACCESS_POLICY.reportsRead}><ReportsPage /></RequireAuth>} />
        <Route path={PATHS.AUDIT_LOGS}    element={<RequireAuth allowedRoles={ACCESS_POLICY.auditLogsRead}><AuditLogsPage /></RequireAuth>} />
        <Route path={PATHS.WEBHOOKS}      element={<RequireAuth allowedRoles={ACCESS_POLICY.platformAdminRead}><WebhooksPage /></RequireAuth>} />
        <Route path={PATHS.INTEGRATIONS}  element={<RequireAuth allowedRoles={ACCESS_POLICY.platformAdminRead}><IntegrationsPage /></RequireAuth>} />
        <Route path={PATHS.PROTOCOLS}     element={<RequireAuth allowedRoles={ACCESS_POLICY.platformAdminRead}><ProtocolsPage /></RequireAuth>} />

        {/* Settings */}
        <Route path={PATHS.SETTINGS}      element={<RequireAuth allowedRoles={ACCESS_POLICY.settingsRead}><SettingsPage /></RequireAuth>} />
        <Route path="/settings/white-label" element={<RequireAuth allowedRoles={ACCESS_POLICY.whiteLabelAdmin}><WhiteLabelPage /></RequireAuth>} />
        <Route path={PATHS.NOTIFICATIONS} element={<RequireAuth allowedRoles={ACCESS_POLICY.notificationsRead}><NotificationsPage /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  )
}
