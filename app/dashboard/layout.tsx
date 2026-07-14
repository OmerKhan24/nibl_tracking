'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, Map, Users, BarChart3, History } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Live Map', icon: Map },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center">
              <span className="text-brand font-bold text-sm">NF</span>
            </div>
            <h1 className="text-sm font-semibold text-white tracking-wide">Manager</h1>
          </div>
          <nav className="flex gap-1">
            {links.map((l) => {
              const active = pathname === l.href
              const Icon = l.icon
              return (
                <Link
                  key={l.href} href={l.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-surface-border text-white' : 'text-gray-400 hover:text-white hover:bg-surface-border/50'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-brand' : ''} />
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="text-xs text-gray-500">Sales Manager</p>
          </div>
          <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-surface-border">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  )
}
