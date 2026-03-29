import type {
  RoamingPartnerObservabilityResponse,
  RoamingPartnerRecord,
} from '@/core/types/mockApi'

export const DELIVERY_STATUS_CLASS = {
  Healthy: 'online',
  Retrying: 'pending',
  Degraded: 'faulted',
} as const

type PartnerObservabilitySummary = RoamingPartnerObservabilityResponse['partners'][number]

export interface RoamingPartnerTelemetryView extends PartnerObservabilitySummary {
  country: string
  name: string
  partyId: string
  type: RoamingPartnerRecord['type']
}

function attentionScore(partner: RoamingPartnerTelemetryView) {
  const deliveryScore = partner.deliveryStatus === 'Degraded' ? 2 : partner.deliveryStatus === 'Retrying' ? 1 : 0
  return deliveryScore * 1000 + partner.callbackFailures24h * 100 + partner.retryQueueDepth * 10 + partner.totalEvents24h
}

export function buildRoamingPartnerTelemetry(
  partners?: RoamingPartnerRecord[],
  observability?: RoamingPartnerObservabilityResponse,
) {
  const partnerById = new Map((partners ?? []).map((partner) => [partner.id, partner]))
  const views: RoamingPartnerTelemetryView[] = []

  for (const summary of observability?.partners ?? []) {
    const partner = partnerById.get(summary.id)
    if (!partner) {
      continue
    }

    views.push({
      ...summary,
      country: partner.country,
      name: partner.name,
      partyId: partner.partyId,
      type: partner.type,
    })
  }

  const byPartnerId = new Map(views.map((partner) => [partner.id, partner]))
  const byPartyId = new Map(views.map((partner) => [partner.partyId, partner]))
  const attentionPartners = [...views]
    .filter((partner) => partner.deliveryStatus !== 'Healthy' || partner.callbackFailures24h > 0 || partner.retryQueueDepth > 0)
    .sort((left, right) => attentionScore(right) - attentionScore(left))

  return {
    attentionPartners,
    byPartnerId,
    byPartyId,
    healthyCount: views.filter((partner) => partner.deliveryStatus === 'Healthy').length,
    totalFailures24h: views.reduce((sum, partner) => sum + partner.callbackFailures24h, 0),
    totalRetryQueueDepth: views.reduce((sum, partner) => sum + partner.retryQueueDepth, 0),
    views,
  }
}
