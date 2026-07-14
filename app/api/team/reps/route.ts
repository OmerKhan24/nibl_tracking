import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/team/reps — list reps (scoped by manager)
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['super_admin', 'manager'])
  if ('error' in auth) return auth.error

  const db = createServiceClient()
  let query = db
    .from('profiles')
    .select('id, full_name, role, is_active, created_at, manager_id')
    .eq('role', 'rep')
    .order('created_at', { ascending: false })

  // Manager only sees their own reps
  if (auth.profile.role === 'manager') {
    query = query.eq('manager_id', auth.profile.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/team/reps — create a new rep account
export async function POST(request: Request) {
  const auth = await requireAuth(request, ['super_admin', 'manager'])
  if ('error' in auth) return auth.error

  const { full_name, email, password } = await request.json()
  if (!full_name || !email || !password)
    return NextResponse.json({ error: 'full_name, email, password required' }, { status: 400 })

  const db = createServiceClient()

  const { data: newUser, error: authErr } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  const { error: profileErr } = await db.from('profiles').insert({
    id:         newUser.user.id,
    full_name,
    role:       'rep',
    manager_id: auth.profile.role === 'manager' ? auth.profile.id : null,
    is_active:  true,
    created_by: auth.profile.id,
  })
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  return NextResponse.json({ id: newUser.user.id, full_name, email }, { status: 201 })
}
