'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreateRepModal } from '../components/CreateRepModal'
import { UserPlus } from 'lucide-react'

interface Rep { id: string; full_name: string; is_active: boolean; created_at: string }

export default function TeamPage() {
  const [reps, setReps] = useState<Rep[]>([])
  const [showModal, setShowModal] = useState(false)

  const fetchReps = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/team/reps', { headers: { Authorization: `Bearer ${session?.access_token}` } })
    if (res.ok) setReps(await res.json())
  }

  useEffect(() => { fetchReps() }, [])

  const toggleStatus = async (id: string, current: boolean) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/team/reps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ is_active: !current })
    })
    fetchReps()
  }

  return (
    <div className="p-8 w-full max-w-5xl mx-auto overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-gray-400 mt-1">Manage your field sales representatives</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add Rep
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
            {reps.map(r => (
              <tr key={r.id} className="hover:bg-surface-border/20 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{r.full_name}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Badge color={r.is_active ? 'green' : 'gray'}>{r.is_active ? 'Active' : 'Disabled'}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(r.id, r.is_active)} className={r.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}>
                    {r.is_active ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reps.length === 0 && <div className="p-8 text-center text-gray-500">No reps found. Add one to get started.</div>}
      </div>

      <CreateRepModal open={showModal} onClose={() => setShowModal(false)} onCreated={fetchReps} />
    </div>
  )
}
