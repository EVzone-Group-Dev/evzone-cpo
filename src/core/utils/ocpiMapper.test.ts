import { describe, expect, it } from 'vitest'
import { mapToOCPILocation } from '@/core/utils/ocpiMapper'
import type { Station } from '@/core/hooks/useStations'

describe('mapToOCPILocation', () => {
  it('maps a station using the provided OCPI party context instead of hardcoded values', () => {
    const station: Station = {
      id: 'st-1',
      name: 'Global Hub',
      address: '1 Mobility Way',
      city: 'Kampala',
      country: 'Uganda',
      lat: 0.3136,
      lng: 32.5811,
      capacity: 150,
      status: 'Online',
      chargePoints: [
        { id: 'cp-9', status: 'Charging', type: 'DC Fast', lastHeartbeatLabel: '10s ago' },
        { id: 'cp-10', status: 'Unavailable', type: 'AC Type 2', lastHeartbeatLabel: '20s ago' },
      ],
    }

    const location = mapToOCPILocation(station, {
      party: {
        countryCode: 'UG',
        partyId: 'EVG',
        operatorName: 'EVzone Global Uganda',
        timeZone: 'Africa/Kampala',
      },
      timestamp: '2026-03-28T10:00:00.000Z',
    })

    expect(location.operator.name).toBe('EVzone Global Uganda')
    expect(location.time_zone).toBe('Africa/Kampala')
    expect(location.evses[0].evse_id).toBe('UG*EVG*E9')
    expect(location.evses[0].status).toBe('CHARGING')
    expect(location.evses[1].status).toBe('INOPERATIVE')
    expect(location.evses[0].connectors[0].last_updated).toBe('2026-03-28T10:00:00.000Z')
  })
})
