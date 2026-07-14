'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimePings, type LivePing } from '@/hooks/useRealtimePings'
import { LiveMap } from './components/LiveMap'
import { RepSidebar } from './components/RepSidebar'

interface Rep { id: string; full_name: string; is_active: boolean }

export default function DashboardPage() {
  const [reps, setReps] = useState<Rep[]>([])
  const [initialPings, setInitialPings] = useState<Record<string, LivePing>>({})
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const repRes = await fetch('/api/team/reps', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (repRes.ok) {
        const repsData = await repRes.json()
        setReps(repsData.filter((r: Rep) => r.is_active))
      }

      // Fetch latest ping per active rep to bootstrap map before realtime kicks in
      const { data: pingsData } = await supabase
        .from('gps_pings')
        .select('rep_id, lat, lng, accuracy_m, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(100)

      const map: Record<string, LivePing> = {}
      pingsData?.forEach(p => { if (!map[p.rep_id]) map[p.rep_id] = p })
      setInitialPings(map)
    }
    loadData()
  }, [])

  const pings = useRealtimePings(initialPings)

  return (
    <div className="flex-1 flex w-full h-full">
      <RepSidebar reps={reps} pings={pings} selected={selectedRepId} onSelect={setSelectedRepId} />
      <div className="flex-1 relative">
        <LiveMap reps={reps} pings={pings} selected={selectedRepId} onSelect={setSelectedRepId} />
      </div>
    </div>
  )
}
