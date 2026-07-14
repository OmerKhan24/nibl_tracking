import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const auth = await requireAuth(request, ['rep', 'manager', 'super_admin'])
  if ('error' in auth) return auth.error

  const url   = new URL(request.url)
  const date  = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const repId = url.searchParams.get('rep_id') ?? auth.profile.id

  if (auth.profile.role === 'rep' && repId !== auth.profile.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('stops')
    .select('*')
    .eq('rep_id', repId)
    .gte('arrived_at', `${date}T00:00:00Z`)
    .lte('arrived_at', `${date}T23:59:59Z`)
    .order('arrived_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
