import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'
import { optimizeRoute } from '@/lib/ors'

// POST /api/routes/optimize
// Body: { destinations: [{lat, lng, label, address?}], startLat, startLng }
export async function POST(request: Request) {
  const auth = await requireAuth(request, ['rep'])
  if ('error' in auth) return auth.error

  const { destinations, startLat, startLng } = await request.json()
  if (!Array.isArray(destinations) || destinations.length === 0)
    return NextResponse.json({ error: 'destinations array required' }, { status: 400 })

  let result
  try {
    result = await optimizeRoute(startLat, startLng, destinations)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'ORS error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const db = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // Store geometry as encoded string (GeoJSON coords array JSON-stringified)
  const { error: upsertErr } = await db.from('routes').upsert({
    rep_id:          auth.profile.id,
    date:            today,
    waypoints:       result.orderedWaypoints,
    osrm_geometry:   JSON.stringify(result.geojsonCoords),
    total_distance_m: result.totalDistanceM,
  }, { onConflict: 'rep_id,date' })

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  return NextResponse.json(result)
}
