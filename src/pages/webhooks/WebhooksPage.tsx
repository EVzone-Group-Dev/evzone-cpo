import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useModuleNotice } from '@/core/hooks/usePlatformData'

export function WebhooksPage() {
  const { data, isLoading, error } = useModuleNotice('webhooks')

  if (isLoading) {
    return <DashboardLayout pageTitle="Webhooks"><p className="text-muted text-sm">Loading webhook module...</p></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Webhooks"><p className="text-danger text-sm">Unable to load webhook module.</p></DashboardLayout>
  }

  return <DashboardLayout pageTitle="Webhooks"><p className="text-muted text-sm">{data.message}</p></DashboardLayout>
}
