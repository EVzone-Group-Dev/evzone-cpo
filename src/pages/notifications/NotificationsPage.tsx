import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useModuleNotice } from '@/core/hooks/usePlatformData'

export function NotificationsPage() {
  const { data, isLoading, error } = useModuleNotice('notifications')

  if (isLoading) {
    return <DashboardLayout pageTitle="Notifications"><p className="text-muted text-sm">Loading notification module...</p></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Notifications"><p className="text-danger text-sm">Unable to load notification module.</p></DashboardLayout>
  }

  return <DashboardLayout pageTitle="Notifications"><p className="text-muted text-sm">{data.message}</p></DashboardLayout>
}
