import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'
import { runStopDetection } from '@/lib/stopDetection'
import { totalDistance, haversine } from '@/lib/haversine'

export async function POST(request: Request) {
  const auth = await requireAuth(request, ['rep'])
  if ('error' in auth) return auth.error

  const { lat, lng, accuracy_m, recorded_at } = await request.json()
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })

  const db = createServiceClient()
  const repId = auth.profile.id
  const today = new Date().toISOString().slice(0, 10)

  // 1. Insert ping
  const { error: pingErr } = await db.from('gps_pings').insert({
    rep_id:      repId,
    lat, lng,
    accuracy_m:  accuracy_m ?? null,
    recorded_at: recorded_at ?? new Date().toISOString(),
  })
  if (pingErr) return NextResponse.json({ error: pingErr.message }, { status: 500 })

  // 2. Fetch today's route for stop detection
  const { data: route } = await db
    .from('routes')
    .select('id, waypoints')
    .eq('rep_id', repId)
    .eq('date', today)
    .single()

  const waypoints = route?.waypoints ?? []

  // 3. Run stop detection
  await runStopDetection(repId, { lat, lng }, route?.id ?? null, waypoints)

  // 4. Update daily summary
  const { data: allPings } = await db
    .from('gps_pings')
    .select('lat, lng, recorded_at')
    .eq('rep_id', repId)
    .gte('recorded_at', `${today}T00:00:00Z`)
    .order('recorded_at', { ascending: true })

  if (allPings && allPings.length >= 2) {
    const distM = totalDistance(allPings)
    const firstTime = new Date(allPings[0].recorded_at).getTime()
    const lastTime  = new Date(allPings[allPings.length - 1].recorded_at).getTime()
    const activeS   = Math.round((lastTime - firstTime) / 1000)

    const { data: stopsCount } = await db
      .from('stops')
      .select('id', { count: 'exact' })
      .eq('rep_id', repId)
      .gte('arrived_at', `${today}T00:00:00Z`)
      .not('departed_at', 'is', null)

    await db.from('daily_summaries').upsert({
      rep_id:               repId,
      date:                 today,
      total_distance_m:     distM,
      total_active_seconds: activeS,
      stops_completed:      stopsCount?.length ?? 0,
    }, { onConflict: 'rep_id,date' })
  }

  return NextResponse.json({ success: true })
}
