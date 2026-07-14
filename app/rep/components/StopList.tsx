import { CheckCircle2, Clock, MapPin } from 'lucide-react'

interface Waypoint { lat: number; lng: number; label: string }
interface Stop { label: string; arrived_at: string; departed_at: string | null; duration_seconds: number | null }

function fmt(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
}

export function StopList({ waypoints, stops }: { waypoints: Waypoint[]; stops: Stop[] }) {
  if (waypoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-600">
        <MapPin size={24} className="mb-2" />
        <p className="text-sm">No destinations added yet</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-surface-border">
      {waypoints.map((wp, i) => {
        const stop = stops.find((s) => s.label === wp.label)
        const done = !!(stop?.departed_at)
        const active = !!(stop && !stop.departed_at)
        return (
          <li key={i} className="px-4 py-3 flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-green-900/50 text-green-400' : active ? 'bg-brand/20 text-brand' : 'bg-surface-border text-gray-500'}`}>
              {done ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-white'}`}>{wp.label}</p>
              {stop && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {fmtTime(stop.arrived_at)}
                  {stop.departed_at && ` → ${fmtTime(stop.departed_at)}`}
                  {stop.duration_seconds ? ` · ${fmt(stop.duration_seconds)}` : ''}
                </p>
              )}
            </div>
            {active && <div className="w-2 h-2 rounded-full bg-brand animate-ping-slow" />}
          </li>
        )
      })}
    </ul>
  )
}
