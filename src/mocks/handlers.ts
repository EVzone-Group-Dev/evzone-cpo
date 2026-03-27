import { http, HttpResponse } from 'msw'

const stations = [
  { 
    id: 'st-1', 
    name: 'Westlands Hub', 
    status: 'Online', 
    address: 'Westlands Ave', 
    city: 'Nairobi', 
    country: 'Kenya', 
    capacity: 150, 
    lat: -1.2633, 
    lng: 36.8045,
    chargePoints: [
      { id: 'cp-1', status: 'Available', type: 'DC Fast' },
      { id: 'cp-2', status: 'Charging', type: 'DC Fast' },
    ]
  },
  { 
    id: 'st-2', 
    name: 'CBD Charging Station', 
    status: 'Degraded', 
    address: 'Kenyatta Ave', 
    city: 'Nairobi', 
    country: 'Kenya', 
    capacity: 100, 
    lat: -1.2863, 
    lng: 36.8172,
    chargePoints: [
      { id: 'cp-3', status: 'Faulted', type: 'AC Type 2' },
    ]
  },
]

export const handlers = [
  http.get('/api/stations', () => {
    return HttpResponse.json(stations)
  }),

  http.get('/api/stations/:id', ({ params }) => {
    const { id } = params
    const station = stations.find(s => s.id === id)
    if (!station) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(station)
  }),

  http.post('/api/commands/start', async ({ request }) => {
    const { chargePointId } = await request.json() as { chargePointId: string }
    console.log(`[MSW] Starting remote session for ${chargePointId}`)
    return HttpResponse.json({ status: 'Accepted', sessionId: `ses-${Math.random().toString(36).slice(2, 9)}` })
  }),
]
