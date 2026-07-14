'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PlaybackMap } from '../components/PlaybackMap'

export default function HistoryPage() {
  const [reps, setReps] = useState<{value:string,label:string}[]>([])
  const [repId, setRepId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [data, setData] = useState<{pings:any[], stops:any[], summary:any|null} | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadReps() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/team/reps', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      if (res.ok) {
        const arr = await res.json()
        setReps(arr.map((r:any) => ({ value: r.id, label: r.full_name })))
        if (arr.length) setRepId(arr[0].id)
      }
    }
    loadReps()
  }, [])

  async function handleSearch() {
    if (!repId || !date) return
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/history?rep_id=${repId}&date=${date}`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full">
      <div className="bg-surface-raised border-b border-surface-border p-4 flex items-end gap-4 z-10 shadow-sm">
        <Select label="Select Rep" options={reps} value={repId} onChange={e => setRepId(e.target.value)} className="w-64" />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button onClick={handleSearch} loading={loading}>Load History</Button>

        {data?.summary && (
          <div className="ml-auto flex gap-6 text-sm">
            <div>
              <span className="text-gray-400 block text-xs">Total Distance</span>
              <strong className="text-white">{(data.summary.total_distance_m / 1000).toFixed(1)} km</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">Stops Visited</span>
              <strong className="text-white">{data.summary.stops_completed}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        {data ? (
          <PlaybackMap pings={data.pings} stops={data.stops} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Select a rep and date to view their historical route.
          </div>
        )}
      </div>
    </div>
  )
}
