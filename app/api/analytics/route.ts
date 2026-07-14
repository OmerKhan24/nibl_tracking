import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['super_admin', 'manager'])
  if ('error' in auth) return auth.error

  const url  = new URL(request.url)
  const from = url.searchParams.get('from')
  const to   = url.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from and to required' }, { status: 400 })

  const db = createServiceClient()

  // Get scoped rep IDs
  let repQuery = db.from('profiles').select('id, full_name').eq('role', 'rep').eq('is_active', true)
  if (auth.profile.role === 'manager') {
    repQuery = repQuery.eq('manager_id', auth.profile.id)
  }
  const { data: reps } = await repQuery
  if (!reps?.length) return NextResponse.json([])

  const repIds = reps.map((r: { id: string }) => r.id)

  const { data: summaries } = await db
    .from('daily_summaries')
    .select('rep_id, date, total_distance_m, total_active_seconds, stops_completed')
    .in('rep_id', repIds)
    .gte('date', from)
    .lte('date', to)

  // Aggregate per rep
  const repMap = Object.fromEntries(
    (reps as { id: string; full_name: string }[]).map((r) => [r.id, { id: r.id, full_name: r.full_name, total_distance_m: 0, total_active_seconds: 0, stops_completed: 0, days_active: 0 }])
  )

  for (const s of summaries ?? []) {
    const rep = repMap[s.rep_id]
    if (!rep) continue
    rep.total_distance_m      += s.total_distance_m
    rep.total_active_seconds  += s.total_active_seconds
    rep.stops_completed       += s.stops_completed
    if (s.total_distance_m > 0) rep.days_active++
  }

  return NextResponse.json(Object.values(repMap))
}
