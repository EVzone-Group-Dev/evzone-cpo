import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MapPin, Cpu, Activity } from 'lucide-react'

const MOCK = {
  'st-1': { name: 'Westlands Hub', address: 'Westlands Ave', city: 'Nairobi', country: 'Kenya', status: 'Online', capacity: 150, chargePoints: 8, activeSessions: 5, energyToday: 342 },
  'st-2': { name: 'CBD Charging Station', address: 'Kenyatta Ave', city: 'Nairobi', country: 'Kenya', status: 'Degraded', capacity: 100, chargePoints: 6, activeSessions: 2, energyToday: 188 },
}

export function StationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const station = MOCK[id as keyof typeof MOCK]

  if (!station) return (
    <DashboardLayout pageTitle="Station Not Found">
      <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>Station not found.</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout pageTitle={station.name}>
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        <MapPin size={14} /> {station.address}, {station.city}, {station.country}
        <span className={`pill ml-2 ${station.status.toLowerCase()}`}>{station.status}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Capacity</div><div className="value">{station.capacity} kW</div></div>
        <div className="kpi-card"><div className="label">Charge Points</div><div className="value">{station.chargePoints}</div></div>
        <div className="kpi-card"><div className="label">Active Sessions</div><div className="value">{station.activeSessions}</div></div>
        <div className="kpi-card"><div className="label">Energy Today</div><div className="value">{station.energyToday} kWh</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-title"><Cpu size={16} style={{ color: 'var(--accent)' }} />Charge Points</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Navigate to <strong>Charge Points</strong> to manage individual connectors for this station.
          </p>
        </div>
        <div className="card">
          <div className="section-title"><Activity size={16} style={{ color: 'var(--accent)' }} />Recent Sessions</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Recent sessions for this station are visible in the <strong>Sessions</strong> module.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
