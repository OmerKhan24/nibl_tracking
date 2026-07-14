import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request, ['super_admin', 'manager'])
  if ('error' in auth) return auth.error

  const { is_active } = await request.json()
  if (typeof is_active !== 'boolean')
    return NextResponse.json({ error: 'is_active required' }, { status: 400 })

  const db = createServiceClient()

  // Managers can only disable their own reps
  let query = db.from('profiles').update({ is_active }).eq('id', params.id).eq('role', 'rep')
  if (auth.profile.role === 'manager') {
    query = query.eq('manager_id', auth.profile.id)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
