import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/history?rep_id=&date=YYYY-MM-DD
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['rep', 'manager', 'super_admin'])
  if ('error' in auth) return auth.error

  const url   = new URL(request.url)
  const repId = url.searchParams.get('rep_id') ?? auth.profile.id
  const date  = url.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  if (auth.profile.role === 'rep' && repId !== auth.profile.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()

  const [{ data: pings }, { data: stops }, { data: summary }] = await Promise.all([
    db.from('gps_pings')
      .select('lat, lng, accuracy_m, recorded_at')
      .eq('rep_id', repId)
      .gte('recorded_at', `${date}T00:00:00Z`)
      .lte('recorded_at', `${date}T23:59:59Z`)
      .order('recorded_at', { ascending: true }),

    db.from('stops')
      .select('*')
      .eq('rep_id', repId)
      .gte('arrived_at', `${date}T00:00:00Z`)
      .lte('arrived_at', `${date}T23:59:59Z`)
      .order('arrived_at', { ascending: true }),

    db.from('daily_summaries')
      .select('*')
      .eq('rep_id', repId)
      .eq('date', date)
      .single(),
  ])

  return NextResponse.json({ pings: pings ?? [], stops: stops ?? [], summary: summary ?? null })
}
