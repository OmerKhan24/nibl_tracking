import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Service-role client — bypasses RLS. Use only in server API routes. */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Verifies a JWT from the Authorization header and returns the user, or null. */
export async function verifyToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  // Use anon client to verify the JWT (supabase verifies against its own key)
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  return user
}

/** Fetches the profile row for a given user ID using service role (bypasses RLS). */
export async function getProfile(userId: string) {
  const db = createServiceClient()
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}
