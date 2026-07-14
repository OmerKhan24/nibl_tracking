// ORS uses [longitude, latitude] order (GeoJSON convention)
export interface Waypoint {
  lat: number
  lng: number
  label: string
  address?: string
}

export interface OptimizeResult {
  orderedWaypoints: Waypoint[]
  geojsonCoords: [number, number][]   // [lng, lat] pairs for MapLibre
  totalDistanceM: number
  totalDurationS: number
}

export async function optimizeRoute(
  startLat: number,
  startLng: number,
  waypoints: Waypoint[]
): Promise<OptimizeResult> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY is not set')

  // Build ORS Optimization (VROOM) request
  const jobs = waypoints.map((wp, i) => ({
    id: i,
    location: [wp.lng, wp.lat],   // [lng, lat]
  }))

  const body = {
    vehicles: [
      {
        id: 0,
        profile: 'driving-car',
        start: [startLng, startLat],
        end:   [startLng, startLat],
      },
    ],
    jobs,
    options: { g: true },   // request geometry
  }

  const res = await fetch('https://api.openrouteservice.org/optimization', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json, application/geo+json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ORS error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('ORS returned no route')

  // Extract ordered job IDs from steps (filter out start/end steps)
  const orderedIds: number[] = route.steps
    .filter((s: { type: string }) => s.type === 'job')
    .map((s: { id: number }) => s.id)

  const orderedWaypoints = orderedIds.map((id) => waypoints[id])

  // Decode geometry (ORS returns encoded polyline when g:true)
  // Import @mapbox/polyline to decode
  const polyline = await import('@mapbox/polyline')
  const latlngPairs = polyline.decode(route.geometry) // [[lat,lng], ...]
  const geojsonCoords: [number, number][] = latlngPairs.map(
    ([lat, lng]) => [lng, lat]
  )

  return {
    orderedWaypoints,
    geojsonCoords,
    totalDistanceM: route.summary?.distance ?? 0,
    totalDurationS: route.summary?.duration ?? 0,
  }
}
