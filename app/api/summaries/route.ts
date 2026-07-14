import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'
import { totalDistance } from '@/lib/haversine'

export async function POST(request: Request) {
  const auth = await requireAuth(request, ['rep'])
  if ('error' in auth) return auth.error

  const db    = createServiceClient()
  const repId = auth.profile.id
  const today = new Date().toISOString().slice(0, 10)

  const { data: pings } = await db
    .from('gps_pings')
    .select('lat, lng, recorded_at')
    .eq('rep_id', repId)
    .gte('recorded_at', `${today}T00:00:00Z`)
    .order('recorded_at', { ascending: true })

  if (!pings?.length) return NextResponse.json({ message: 'No pings today' })

  const distM   = totalDistance(pings)
  const firstTs = new Date(pings[0].recorded_at).getTime()
  const lastTs  = new Date(pings[pings.length - 1].recorded_at).getTime()
  const activeS = Math.round((lastTs - firstTs) / 1000)

  const { data: stopsRows } = await db
    .from('stops')
    .select('id', { count: 'exact' })
    .eq('rep_id', repId)
    .gte('arrived_at', `${today}T00:00:00Z`)
    .not('departed_at', 'is', null)

  await db.from('daily_summaries').upsert({
    rep_id: repId, date: today,
    total_distance_m: distM,
    total_active_seconds: activeS,
    stops_completed: stopsRows?.length ?? 0,
  }, { onConflict: 'rep_id,date' })

  return NextResponse.json({ distM, activeS })
}
