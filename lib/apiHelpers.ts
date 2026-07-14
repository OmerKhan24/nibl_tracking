import { verifyToken, getProfile } from './supabase/server'
import { NextResponse } from 'next/server'

export async function requireAuth(request: Request, allowedRoles?: string[]) {
  const user = await verifyToken(request.headers.get('Authorization'))
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const profile = await getProfile(user.id)
  if (!profile || !profile.is_active)
    return { error: NextResponse.json({ error: 'Forbidden — account disabled' }, { status: 403 }) }

  if (allowedRoles && !allowedRoles.includes(profile.role))
    return { error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) }

  return { user, profile }
}
