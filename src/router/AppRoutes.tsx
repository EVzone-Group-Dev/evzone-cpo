import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
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
const CreateChargePointPage = lazy(() => import('@/pages/charge-points/CreateChargePointPage').then(m => ({ default: m.CreateChargePointPage })))
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
  const user = useAuthStore((state) => state.user)
  return <Navigate to={getRoleHomePath(user)} replace />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path={PATHS.HOME} element={<Navigate to={PATHS.DASHBOARD} replace />} />
        <Route path={PATHS.LOGIN} element={<RequireGuest><LoginPage /></RequireGuest>} />

        {/* Protected — Infrastructure */}
        <Route path={PATHS.DASHBOARD} element={<RequireAuth policy="dashboardHome"><RoleHomeRedirect /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_SUPER_ADMIN} element={<RequireAuth policy="dashboardSuperAdmin"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_CPO_ADMIN} element={<RequireAuth policy="dashboardCpoAdmin"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_STATION_MANAGER} element={<RequireAuth policy="dashboardStationManager"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_FINANCE} element={<RequireAuth policy="dashboardFinance"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_OPERATOR} element={<RequireAuth policy="dashboardOperator"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.DASHBOARD_TECHNICIAN} element={<RequireAuth policy="dashboardTechnician"><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.SITE_DASHBOARD} element={<RequireAuth policy="siteDashboard"><SiteOwnerDashboard /></RequireAuth>} />
        <Route path={PATHS.STATIONS} element={<RequireAuth policy="stationsRead"><StationsPage /></RequireAuth>} />
        <Route path="/stations/new" element={<RequireAuth policy="stationsWrite"><CreateStationPage /></RequireAuth>} />
        <Route path="/stations/:id" element={<RequireAuth policy="stationsRead"><StationDetailPage /></RequireAuth>} />
        <Route path={PATHS.CHARGE_POINTS} element={<RequireAuth policy="chargePointsRead"><ChargePointsPage /></RequireAuth>} />
        <Route path={PATHS.CHARGE_POINT_NEW}  element={<RequireAuth policy="chargePointsWrite"><CreateChargePointPage /></RequireAuth>} />
        <Route path="/charge-points/:id"  element={<RequireAuth policy="chargePointsRead"><ChargePointDetailPage /></RequireAuth>} />
        <Route path={PATHS.SWAP_STATIONS} element={<RequireAuth policy="swapStationsRead"><SwapStationsPage /></RequireAuth>} />
        <Route path="/swap-stations/:id" element={<RequireAuth policy="swapStationsRead"><SwapStationDetailPage /></RequireAuth>} />

        {/* Operations */}
        <Route path={PATHS.SESSIONS}   element={<RequireAuth policy="sessionsRead"><SessionsPage /></RequireAuth>} />
        <Route path={PATHS.SWAP_SESSIONS} element={<RequireAuth policy="swapSessionsRead"><SwapSessionsPage /></RequireAuth>} />
        <Route path={PATHS.INCIDENTS}  element={<RequireAuth policy="incidentsRead"><IncidentsPage /></RequireAuth>} />
        <Route path={PATHS.ALERTS}     element={<RequireAuth policy="alertsRead"><AlertsPage /></RequireAuth>} />

        {/* Energy */}
        <Route path={PATHS.SMART_CHARGING} element={<RequireAuth policy="smartChargingRead"><SmartChargingPage /></RequireAuth>} />
        <Route path={PATHS.LOAD_POLICY}    element={<RequireAuth policy="loadPoliciesRead"><LoadPolicyPage /></RequireAuth>} />
        <Route path={PATHS.BATTERY_INVENTORY} element={<RequireAuth policy="batteryInventoryRead"><BatteryInventoryPage /></RequireAuth>} />

        {/* Roaming */}
        <Route path={PATHS.OCPI_PARTNERS}  element={<RequireAuth policy="roamingRead"><OCPIPartnersPage /></RequireAuth>} />
        <Route path={PATHS.OCPI_SESSIONS}  element={<RequireAuth policy="roamingRead"><RoamingSessionsPage /></RequireAuth>} />
        <Route path={PATHS.OCPI_COMMANDS}  element={<RequireAuth policy="roamingRead"><OCPICommandsPage /></RequireAuth>} />
        <Route path={PATHS.OCPI_CDRS}      element={<RequireAuth policy="roamingRead"><OCPICDRsPage /></RequireAuth>} />

        {/* Finance */}
        <Route path={PATHS.TARIFFS}    element={<RequireAuth policy="tariffsRead"><TariffsPage /></RequireAuth>} />
        <Route path={PATHS.BILLING}    element={<RequireAuth policy="billingRead"><BillingPage /></RequireAuth>} />
        <Route path={PATHS.PAYOUTS}    element={<RequireAuth policy="payoutsRead"><PayoutsPage /></RequireAuth>} />
        <Route path={PATHS.SETTLEMENT} element={<RequireAuth policy="settlementRead"><SettlementPage /></RequireAuth>} />

        {/* Team */}
        <Route path={PATHS.TEAM}       element={<RequireAuth policy="teamRead"><TeamPage /></RequireAuth>} />

        {/* Platform */}
        <Route path={PATHS.REPORTS}       element={<RequireAuth policy="reportsRead"><ReportsPage /></RequireAuth>} />
        <Route path={PATHS.AUDIT_LOGS}    element={<RequireAuth policy="auditLogsRead"><AuditLogsPage /></RequireAuth>} />
        <Route path={PATHS.WEBHOOKS}      element={<RequireAuth policy="platformAdminRead"><WebhooksPage /></RequireAuth>} />
        <Route path={PATHS.INTEGRATIONS}  element={<RequireAuth policy="platformAdminRead"><IntegrationsPage /></RequireAuth>} />
        <Route path={PATHS.PROTOCOLS}     element={<RequireAuth policy="platformAdminRead"><ProtocolsPage /></RequireAuth>} />

        {/* Settings */}
        <Route path={PATHS.SETTINGS}      element={<RequireAuth policy="settingsRead"><SettingsPage /></RequireAuth>} />
        <Route path="/settings/white-label" element={<RequireAuth policy="whiteLabelAdmin"><WhiteLabelPage /></RequireAuth>} />
        <Route path={PATHS.NOTIFICATIONS} element={<RequireAuth policy="notificationsRead"><NotificationsPage /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  )
}
