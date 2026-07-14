'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Agg { full_name: string; total_distance_m: number; total_active_seconds: number; stops_completed: number; days_active: number }

export default function AnalyticsPage() {
  const [data, setData] = useState<Agg[]>([])
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10))

  useEffect(() => {
    async function fetchAgg() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/analytics?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
      if (res.ok) setData(await res.json())
    }
    fetchAgg()
  }, [from, to])

  const chartData = data.map(d => ({
    name: d.full_name,
    km: +(d.total_distance_m / 1000).toFixed(1),
    stops: d.stops_completed,
  }))

  return (
    <div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
          <p className="text-gray-400 mt-1">Aggregated metrics across the team</p>
        </div>
        <div className="flex gap-4">
          <Input label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Distance Travelled (km)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#374151', opacity: 0.4 }} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="km" fill="#F97316" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Stops Completed</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#374151', opacity: 0.4 }} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="stops" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
