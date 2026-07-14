'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreateManagerModal } from './components/CreateManagerModal'
import { Shield, Users, LogOut } from 'lucide-react'

interface Manager { id: string; full_name: string; is_active: boolean; created_at: string }

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const [managers, setManagers] = useState<Manager[]>([])
  const [showModal, setShowModal] = useState(false)

  const fetchManagers = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/managers', { headers: { Authorization: `Bearer ${session?.access_token}` } })
    if (res.ok) setManagers(await res.json())
  }

  useEffect(() => { fetchManagers() }, [])

  const toggleStatus = async (id: string, current: boolean) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/admin/managers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ is_active: !current })
    })
    fetchManagers()
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center">
            <Shield size={16} className="text-brand" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">Super Admin</h1>
            <p className="text-xs text-gray-500">System Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{profile?.full_name}</span>
          <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-surface-border">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-5xl mx-auto overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Managers</h2>
            <p className="text-gray-400 mt-1">Manage platform access for sales managers</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Users size={16} /> Add Manager
          </Button>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-border/50 text-gray-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {managers.map(m => (
                <tr key={m.id} className="hover:bg-surface-border/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{m.full_name}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Badge color={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.id, m.is_active)} className={m.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}>
                      {m.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {managers.length === 0 && <div className="p-8 text-center text-gray-500">No managers found.</div>}
        </div>
      </main>

      <CreateManagerModal open={showModal} onClose={() => setShowModal(false)} onCreated={fetchManagers} />
    </div>
  )
}
