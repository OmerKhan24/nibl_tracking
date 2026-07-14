'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocationTracker } from '@/hooks/useLocationTracker'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { RepMap } from './components/RepMap'
import { AddDestination } from './components/AddDestination'
import { StopList } from './components/StopList'
import { MapPin, Navigation, LogOut, Plus, Route } from 'lucide-react'

interface Waypoint { lat: number; lng: number; label: string; address?: string }
interface Stop {
  id: number; label: string; lat: number; lng: number
  arrived_at: string; departed_at: string | null; duration_seconds: number | null
}

export default function RepPage() {
  const { profile, signOut, loading } = useAuth()
  const [waypoints, setWaypoints]     = useState<Waypoint[]>([])
  const [stops, setStops]             = useState<Stop[]>([])
  const [routeGeom, setRouteGeom]     = useState<[number,number][] | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [optimizing, setOptimizing]   = useState(false)
  const [currentPos, setCurrentPos]   = useState<{lat:number;lng:number} | null>(null)
  const [todayStats, setTodayStats]   = useState<{km:string;active:string;stops:number} | null>(null)

  const unvisitedWaypoints = waypoints.filter(
    (wp) => !stops.some((s) => s.label === wp.label && s.departed_at)
  )
  useLocationTracker(true, unvisitedWaypoints)

  // Fetch current GPS position for display
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }, [])

  // Fetch today's route + stops on load
  useEffect(() => {
    fetchRouteAndStops()
  }, [])

  async function fetchRouteAndStops() {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const [routeRes, stopsRes] = await Promise.all([
      fetch('/api/routes', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/stops',  { headers: { Authorization: `Bearer ${token}` } }),
    ])

    if (routeRes.ok) {
      const route = await routeRes.json()
      if (route) {
        setWaypoints(route.waypoints ?? [])
        if (route.osrm_geometry) setRouteGeom(JSON.parse(route.osrm_geometry))
        setTodayStats({
          km:     ((route.total_distance_m ?? 0) / 1000).toFixed(1),
          active: '',
          stops:  0,
        })
      }
    }
    if (stopsRes.ok) {
      const s = await stopsRes.json()
      setStops(s ?? [])
    }
  }

  async function handleOptimize() {
    if (!currentPos || waypoints.length === 0) return
    setOptimizing(true)
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/routes/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ destinations: waypoints, startLat: currentPos.lat, startLng: currentPos.lng }),
    })
    if (res.ok) {
      const data = await res.json()
      setWaypoints(data.orderedWaypoints)
      setRouteGeom(data.geojsonCoords)
    }
    setOptimizing(false)
  }

  function handleAddWaypoint(wp: Waypoint) {
    setWaypoints((prev) => [...prev, wp])
    setShowAdd(false)
  }

  if (loading) return <div className="min-h-screen bg-navy-900 flex items-center justify-center"><Spinner size={40} /></div>

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <header className="bg-surface-raised border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center">
            <Navigation size={16} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="text-xs text-gray-500">Field Rep · NIBL Foods</p>
          </div>
        </div>
        <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '55vh' }}>
        <RepMap
          center={currentPos ? [currentPos.lng, currentPos.lat] : undefined}
          waypoints={waypoints}
          stops={stops}
          routeGeom={routeGeom}
          currentPos={currentPos}
        />
        {/* Floating action bar */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          <Button onClick={() => setShowAdd(true)} className="flex-1" size="sm">
            <Plus size={16} /> Add Stop
          </Button>
          <Button
            variant="secondary"
            onClick={handleOptimize}
            loading={optimizing}
            disabled={waypoints.length < 2}
            size="sm"
          >
            <Route size={16} /> Optimize
          </Button>
        </div>
      </div>

      {/* Stop list + stats */}
      <div className="bg-surface-raised border-t border-surface-border" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
        <div className="px-4 py-3 border-b border-surface-border flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin size={12} className="text-brand" />
            {stops.filter(s => s.departed_at).length}/{waypoints.length} stops
          </div>
          {todayStats && (
            <div className="text-xs text-gray-400">{todayStats.km} km today</div>
          )}
          <div className="ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-ping-slow" />
          </div>
        </div>
        <StopList waypoints={waypoints} stops={stops} />
      </div>

      <AddDestination open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddWaypoint} />
    </div>
  )
}
