import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useModuleNotice } from '@/core/hooks/usePlatformData'

export function IntegrationsPage() {
  const { data, isLoading, error } = useModuleNotice('integrations')

  if (isLoading) {
    return <DashboardLayout pageTitle="Integrations"><p className="text-muted text-sm">Loading integration module...</p></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Integrations"><p className="text-danger text-sm">Unable to load integration module.</p></DashboardLayout>
  }

  return <DashboardLayout pageTitle="Integrations"><p className="text-muted text-sm">{data.message}</p></DashboardLayout>
}
