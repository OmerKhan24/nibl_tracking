import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/managers — list all managers
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const db = createServiceClient()
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .eq('role', 'manager')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/managers — create a new manager account
export async function POST(request: Request) {
  const auth = await requireAuth(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const { full_name, email, password } = await request.json()
  if (!full_name || !email || !password)
    return NextResponse.json({ error: 'full_name, email, password required' }, { status: 400 })

  const db = createServiceClient()

  // 1. Create auth user
  const { data: newUser, error: authErr } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  // 2. Insert profile row
  const { error: profileErr } = await db.from('profiles').insert({
    id:         newUser.user.id,
    full_name,
    role:       'manager',
    is_active:  true,
    created_by: auth.profile.id,
  })
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  return NextResponse.json({ id: newUser.user.id, full_name, email }, { status: 201 })
}
