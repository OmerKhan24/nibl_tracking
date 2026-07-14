import { haversine } from './haversine'
import { createServiceClient } from './supabase/server'

const ARRIVAL_RADIUS_M   = parseInt(process.env.NEXT_PUBLIC_ARRIVAL_RADIUS_M   ?? '30')
const DEPARTURE_RADIUS_M = parseInt(process.env.NEXT_PUBLIC_DEPARTURE_RADIUS_M ?? '50')

interface Ping { lat: number; lng: number }
interface Waypoint { lat: number; lng: number; label: string; address?: string }

export async function runStopDetection(
  repId: string,
  newPing: Ping,
  routeId: number | null,
  waypoints: Waypoint[]
) {
  const db = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // ── A. Departure check ────────────────────────────────────
  const { data: openStop } = await db
    .from('stops')
    .select('id, lat, lng, arrived_at')
    .eq('rep_id', repId)
    .is('departed_at', null)
    .order('arrived_at', { ascending: false })
    .limit(1)
    .single()

  if (openStop) {
    const dist = haversine(newPing, { lat: openStop.lat, lng: openStop.lng })
    if (dist > DEPARTURE_RADIUS_M) {
      // Check previous 2 pings — require 3 consecutive outside radius before closing
      const { data: prevPings } = await db
        .from('gps_pings')
        .select('lat, lng')
        .eq('rep_id', repId)
        .order('recorded_at', { ascending: false })
        .limit(2)

      const allOutside = (prevPings ?? []).every(
        (p: Ping) => haversine(p, { lat: openStop.lat, lng: openStop.lng }) > DEPARTURE_RADIUS_M
      )

      if (allOutside || (prevPings ?? []).length === 0) {
        const arrivedAt = new Date(openStop.arrived_at)
        const durationSeconds = Math.round((Date.now() - arrivedAt.getTime()) / 1000)

        await db
          .from('stops')
          .update({
            departed_at:      new Date().toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', openStop.id)
      }
    }
    // If rep is still inside the stop radius, no arrival check needed
    return
  }

  // ── B. Arrival check ─────────────────────────────────────
  // Get already-visited stop labels today to avoid double-recording
  const { data: visitedStops } = await db
    .from('stops')
    .select('label')
    .eq('rep_id', repId)
    .gte('arrived_at', `${today}T00:00:00Z`)

  const visitedLabels = new Set((visitedStops ?? []).map((s: { label: string }) => s.label))

  for (const wp of waypoints) {
    if (visitedLabels.has(wp.label)) continue
    const dist = haversine(newPing, wp)
    if (dist <= ARRIVAL_RADIUS_M) {
      // Confirm with previous ping also within radius (debounce single-ping false positives)
      const { data: prevPings } = await db
        .from('gps_pings')
        .select('lat, lng')
        .eq('rep_id', repId)
        .order('recorded_at', { ascending: false })
        .limit(1)

      const prevPing = prevPings?.[0]
      const prevClose = prevPing
        ? haversine(prevPing, wp) <= ARRIVAL_RADIUS_M
        : true  // First ping of the day — allow arrival

      if (prevClose) {
        await db.from('stops').insert({
          rep_id:     repId,
          route_id:   routeId,
          label:      wp.label,
          lat:        wp.lat,
          lng:        wp.lng,
          arrived_at: new Date().toISOString(),
        })
        break  // Only detect one arrival per ping
      }
    }
  }
}
