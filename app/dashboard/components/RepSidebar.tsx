'use client'
import { Users, Navigation } from 'lucide-react'

interface Rep { id: string; full_name: string }
interface Ping { rep_id: string; recorded_at: string }

interface Props {
  reps: Rep[]
  pings: Record<string, Ping>
  selected: string | null
  onSelect: (id: string | null) => void
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function RepSidebar({ reps, pings, selected, onSelect }: Props) {
  return (
    <div className="w-80 bg-surface-raised border-r border-surface-border flex flex-col z-10 shadow-xl">
      <div className="p-4 border-b border-surface-border">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users size={16} className="text-brand" /> Active Team
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {reps.map(r => {
          const ping = pings[r.id]
          const isSelected = selected === r.id
          return (
            <button
              key={r.id}
              onClick={() => onSelect(isSelected ? null : r.id)}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                isSelected
                  ? 'bg-brand/10 border-brand/30'
                  : 'bg-transparent border-transparent hover:bg-surface-border/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`font-medium text-sm ${isSelected ? 'text-brand' : 'text-white'}`}>
                  {r.full_name}
                </span>
                {ping && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping-slow" />
                    <span className="text-[10px] text-gray-500 font-medium">
                      {timeAgo(ping.recorded_at)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Navigation size={12} />
                {ping ? 'Tracking active' : 'No signal yet today'}
              </div>
            </button>
          )
        })}
        {reps.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">No active reps found.</div>
        )}
      </div>
    </div>
  )
}
