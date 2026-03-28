import { type Station } from '@/core/hooks/useStations'
import type { OCPILocation, OCPIPartyContext } from '@/core/types/ocpi'

/**
 * OCPI 2.2.1 Location Object Mapper
 * Translates internal platform assets to standard OCPI JSON format.
 *
 * The caller must provide the OCPI party identity and timezone explicitly.
 * This keeps the mapper reusable across regions, parties, and tenants.
 */

interface OCPILocationMapperOptions {
  party: OCPIPartyContext
  timestamp?: string
}

export function mapToOCPILocation(
  station: Station,
  { party, timestamp = new Date().toISOString() }: OCPILocationMapperOptions,
): OCPILocation {
  return {
    id: station.id,
    type: 'ON_STREET',
    name: station.name,
    address: station.address,
    city: station.city,
    country: station.country,
    coordinates: {
      latitude: station.lat.toString(),
      longitude: station.lng.toString(),
    },
    evses: station.chargePoints.map((chargePoint) => ({
      uid: chargePoint.id,
      evse_id: `${party.countryCode}*${party.partyId}*E${chargePoint.id.replace('cp-', '')}`,
      status: mapStatusToOCPI(chargePoint.status),
      capabilities: ['REMOTE_START_STOP_CAPABLE', 'RESERVABLE'],
      connectors: [
        {
          id: '1',
          standard: chargePoint.type === 'DC Fast' ? 'IEC_62196_T2_COMBO' : 'IEC_62196_T2',
          format: 'CABLE',
          power_type: chargePoint.type === 'DC Fast' ? 'DC' : 'AC_3_PHASE',
          max_voltage: 400,
          max_amperage: 32,
          max_electric_power: chargePoint.type === 'DC Fast' ? 50000 : 22000,
          last_updated: timestamp,
        },
      ],
      last_updated: timestamp,
    })),
    operator: {
      name: party.operatorName,
    },
    time_zone: party.timeZone,
    last_updated: timestamp,
  }
}

function mapStatusToOCPI(status: string) {
  switch (status) {
    case 'Available':
      return 'AVAILABLE'
    case 'Charging':
      return 'CHARGING'
    case 'Faulted':
      return 'OUT_OF_ORDER'
    case 'Unavailable':
      return 'INOPERATIVE'
    default:
      return 'UNKNOWN'
  }
}
