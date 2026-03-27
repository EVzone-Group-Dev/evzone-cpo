import { type Station } from '@/core/hooks/useStations'

/**
 * OCPI 2.2.1 Location Object Mapper
 * Translates internal platform assets to standard OCPI JSON format
 */

export function mapToOCPILocation(station: Station) {
  return {
    id: station.id,
    type: 'ON_STREET', // Default, should be dynamic
    name: station.name,
    address: station.address,
    city: station.city,
    country: station.country,
    coordinates: {
      latitude: station.lat.toString(),
      longitude: station.lng.toString(),
    },
    evses: station.chargePoints.map((cp) => ({
      uid: cp.id,
      evse_id: `KE*EVZ*E${cp.id.replace('cp-', '')}`, // Example ID generation
      status: mapStatusToOCPI(cp.status),
      capabilities: ['REMOTE_START_STOP_CAPABLE', 'RESERVABLE'],
      connectors: [
        {
          id: '1',
          standard: cp.type === 'DC Fast' ? 'IEC_62196_T2_COMBO' : 'IEC_62196_T2',
          format: 'CABLE',
          power_type: cp.type === 'DC Fast' ? 'DC' : 'AC_3_PHASE',
          max_voltage: 400,
          max_amperage: 32,
          max_electric_power: cp.type === 'DC Fast' ? 50000 : 22000,
          last_updated: new Date().toISOString(),
        }
      ],
      last_updated: new Date().toISOString(),
    })),
    operator: {
      name: 'EVzone Kenya'
    },
    time_zone: 'Africa/Nairobi',
    last_updated: new Date().toISOString(),
  }
}

function mapStatusToOCPI(status: string) {
  switch (status) {
    case 'Available': return 'AVAILABLE'
    case 'Charging': return 'CHARGING'
    case 'Faulted': return 'OUT_OF_ORDER'
    default: return 'UNKNOWN'
  }
}
