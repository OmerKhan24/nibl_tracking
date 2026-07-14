import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/admin/managers/:id — enable or disable a manager
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const { is_active } = await request.json()
  if (typeof is_active !== 'boolean')
    return NextResponse.json({ error: 'is_active (boolean) required' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db
    .from('profiles')
    .update({ is_active })
    .eq('id', params.id)
    .eq('role', 'manager')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
