import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useReservationAction, useReservations } from '@/core/hooks/usePlatformData'

type ReservationFilter = 'All' | 'Pending' | 'Confirmed' | 'Cancelled' | 'No Show' | 'Expired'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
} as const

const STATUS_CLASS = {
  Pending: 'pending',
  Confirmed: 'online',
  Cancelled: 'faulted',
  'No Show': 'warning',
  Expired: 'faulted',
} as const

export function ReservationsPage() {
  const [filter, setFilter] = useState<ReservationFilter>('All')
  const [busyId, setBusyId] = useState<string | null>(null)
  const reservationsQuery = useReservations()
  const reservationAction = useReservationAction()

  const rows = useMemo(() => {
    const source = reservationsQuery.data?.records || []
    if (filter === 'All') return source
    return source.filter((record) => record.status === filter)
  }, [filter, reservationsQuery.data?.records])

  if (reservationsQuery.isLoading) {
    return <DashboardLayout pageTitle="Reservations"><div className="p-8 text-center text-subtle">Loading reservation operations...</div></DashboardLayout>
  }

  if (reservationsQuery.error || !reservationsQuery.data) {
    return <DashboardLayout pageTitle="Reservations"><div className="p-8 text-center text-danger">Unable to load reservation operations.</div></DashboardLayout>
  }

  const handleAction = async (
    reservationId: string,
    action: 'checkin' | 'cancel' | 'no-show' | 'expire' | 'dispatch-reserve' | 'dispatch-cancel',
    reason?: string,
  ) => {
    try {
      setBusyId(reservationId)
      await reservationAction.mutateAsync({
        reservationId,
        action,
        reason,
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardLayout pageTitle="Reservations">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reservationsQuery.data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="section-title">Reservation Lifecycle Console</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['All', 'Pending', 'Confirmed', 'Cancelled', 'No Show', 'Expired'] as ReservationFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Customer</th>
                <th>Station / CP</th>
                <th>Window</th>
                <th>State</th>
                <th>Command</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <td className="font-mono text-xs">{record.reservationId ?? record.id}</td>
                  <td>
                    <div className="font-semibold">{record.customer}</div>
                    <div className="text-[11px] text-subtle">{record.customerRef}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold">{record.stationName}</div>
                    <div className="text-[11px] text-subtle">{record.chargePointId}</div>
                  </td>
                  <td>
                    <div className="text-xs">{record.startAt}</div>
                    <div className="text-[11px] text-subtle">{record.endAt}</div>
                  </td>
                  <td>
                    <span className={`pill ${STATUS_CLASS[record.status]}`}>{record.status}</span>
                    <div className="text-[10px] text-subtle mt-1">{record.source}</div>
                  </td>
                  <td>
                    <span className={`pill ${record.commandStatus === 'Rejected' || record.commandStatus === 'Failed' || record.commandStatus === 'Timeout' || record.commandStatus === 'DispatchFailed' ? 'faulted' : 'active'}`}>
                      {record.commandStatus}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn sm secondary"
                        disabled={busyId === record.id}
                        onClick={() => handleAction(record.id, 'checkin')}
                      >
                        Check-in
                      </button>
                      <button
                        type="button"
                        className="btn sm secondary"
                        disabled={busyId === record.id}
                        onClick={() => handleAction(record.id, 'cancel', 'Cancelled by operator')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn sm secondary"
                        disabled={busyId === record.id}
                        onClick={() => handleAction(record.id, 'dispatch-reserve')}
                      >
                        Re-dispatch Reserve
                      </button>
                      <button
                        type="button"
                        className="btn sm secondary"
                        disabled={busyId === record.id}
                        onClick={() => handleAction(record.id, 'dispatch-cancel')}
                      >
                        Dispatch Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-subtle py-8">
                    No reservations matched this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Operations Note</div>
        <p className="text-sm text-subtle">{reservationsQuery.data.note}</p>
      </div>
    </DashboardLayout>
  )
}
