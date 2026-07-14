import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Allow login page and API routes to pass through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/')) {
    // If already logged in and hitting /login, redirect to correct dashboard
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = profile?.role
      const dest = role === 'rep' ? '/rep' : role === 'super_admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return response
  }

  // Not logged in → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=disabled', request.url))
  }

  const role = profile.role as 'super_admin' | 'manager' | 'rep'

  // Enforce role-based routing
  if (pathname.startsWith('/admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL(role === 'rep' ? '/rep' : '/dashboard', request.url))
  }
  if (pathname.startsWith('/dashboard') && role === 'rep') {
    return NextResponse.redirect(new URL('/rep', request.url))
  }
  if (pathname.startsWith('/rep') && role !== 'rep') {
    return NextResponse.redirect(new URL(role === 'super_admin' ? '/admin' : '/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
