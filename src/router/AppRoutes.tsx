import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth, RequireGuest } from './guards'
import { PATHS } from './paths'

// Lazy-loaded pages
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const StationsPage      = lazy(() => import('@/pages/stations/StationsPage').then(m => ({ default: m.StationsPage })))
const StationDetailPage = lazy(() => import('@/pages/stations/StationDetailPage').then(m => ({ default: m.StationDetailPage })))
const ChargePointsPage  = lazy(() => import('@/pages/charge-points/ChargePointsPage').then(m => ({ default: m.ChargePointsPage })))
const ChargePointDetailPage = lazy(() => import('@/pages/charge-points/ChargePointDetailPage').then(m => ({ default: m.ChargePointDetailPage })))
const SessionsPage      = lazy(() => import('@/pages/sessions/SessionsPage').then(m => ({ default: m.SessionsPage })))
const IncidentsPage     = lazy(() => import('@/pages/incidents/IncidentsPage').then(m => ({ default: m.IncidentsPage })))
const AlertsPage        = lazy(() => import('@/pages/alerts/AlertsPage').then(m => ({ default: m.AlertsPage })))
const TariffsPage       = lazy(() => import('@/pages/tariffs/TariffsPage').then(m => ({ default: m.TariffsPage })))
const SmartChargingPage = lazy(() => import('@/pages/energy/SmartChargingPage').then(m => ({ default: m.SmartChargingPage })))
const LoadPolicyPage    = lazy(() => import('@/pages/energy/LoadPolicyPage').then(m => ({ default: m.LoadPolicyPage })))
const OCPIPartnersPage  = lazy(() => import('@/pages/roaming/OCPIPartnersPage').then(m => ({ default: m.OCPIPartnersPage })))
const OCPICDRsPage      = lazy(() => import('@/pages/roaming/OCPICDRsPage').then(m => ({ default: m.OCPICDRsPage })))
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
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #30363d', borderTopColor: '#3fb950', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path={PATHS.HOME} element={<Navigate to={PATHS.DASHBOARD} replace />} />
        <Route path={PATHS.LOGIN} element={<RequireGuest><LoginPage /></RequireGuest>} />

        {/* Protected — Infrastructure */}
        <Route path={PATHS.DASHBOARD}     element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path={PATHS.STATIONS}      element={<RequireAuth><StationsPage /></RequireAuth>} />
        <Route path="/stations/:id"       element={<RequireAuth><StationDetailPage /></RequireAuth>} />
        <Route path={PATHS.CHARGE_POINTS} element={<RequireAuth><ChargePointsPage /></RequireAuth>} />
        <Route path="/charge-points/:id"  element={<RequireAuth><ChargePointDetailPage /></RequireAuth>} />

        {/* Operations */}
        <Route path={PATHS.SESSIONS}   element={<RequireAuth><SessionsPage /></RequireAuth>} />
        <Route path={PATHS.INCIDENTS}  element={<RequireAuth><IncidentsPage /></RequireAuth>} />
        <Route path={PATHS.ALERTS}     element={<RequireAuth><AlertsPage /></RequireAuth>} />

        {/* Energy */}
        <Route path={PATHS.SMART_CHARGING} element={<RequireAuth><SmartChargingPage /></RequireAuth>} />
        <Route path={PATHS.LOAD_POLICY}    element={<RequireAuth><LoadPolicyPage /></RequireAuth>} />

        {/* Roaming */}
        <Route path={PATHS.OCPI_PARTNERS}  element={<RequireAuth><OCPIPartnersPage /></RequireAuth>} />
        <Route path={PATHS.OCPI_CDRS}      element={<RequireAuth><OCPICDRsPage /></RequireAuth>} />

        {/* Finance */}
        <Route path={PATHS.TARIFFS}    element={<RequireAuth><TariffsPage /></RequireAuth>} />
        <Route path={PATHS.BILLING}    element={<RequireAuth><BillingPage /></RequireAuth>} />
        <Route path={PATHS.PAYOUTS}    element={<RequireAuth><PayoutsPage /></RequireAuth>} />
        <Route path={PATHS.SETTLEMENT} element={<RequireAuth><SettlementPage /></RequireAuth>} />

        {/* Team */}
        <Route path={PATHS.TEAM}       element={<RequireAuth><TeamPage /></RequireAuth>} />

        {/* Platform */}
        <Route path={PATHS.REPORTS}       element={<RequireAuth><ReportsPage /></RequireAuth>} />
        <Route path={PATHS.AUDIT_LOGS}    element={<RequireAuth><AuditLogsPage /></RequireAuth>} />
        <Route path={PATHS.WEBHOOKS}      element={<RequireAuth><WebhooksPage /></RequireAuth>} />
        <Route path={PATHS.INTEGRATIONS}  element={<RequireAuth><IntegrationsPage /></RequireAuth>} />
        <Route path={PATHS.PROTOCOLS}     element={<RequireAuth><ProtocolsPage /></RequireAuth>} />

        {/* Settings */}
        <Route path={PATHS.SETTINGS}      element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path={PATHS.NOTIFICATIONS} element={<RequireAuth><NotificationsPage /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  )
}
