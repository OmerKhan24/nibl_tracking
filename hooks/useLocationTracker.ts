'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { haversine } from '@/lib/haversine'

const FAR_INTERVAL    = parseInt(process.env.NEXT_PUBLIC_GPS_FAR_INTERVAL_MS  ?? '60000')
const NEAR_INTERVAL   = parseInt(process.env.NEXT_PUBLIC_GPS_NEAR_INTERVAL_MS ?? '15000')
const NEAR_THRESHOLD  = parseInt(process.env.NEXT_PUBLIC_NEAR_THRESHOLD_M     ?? '300')

interface PendingPing {
  lat: number; lng: number; accuracy_m: number | null; recorded_at: string
}

// ── IndexedDB helpers ─────────────────────────────────────
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nibl-tracker', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true })
    req.onsuccess  = () => resolve(req.result)
    req.onerror    = () => reject(req.error)
  })
}

async function queuePing(ping: PendingPing) {
  const db    = await openDB()
  const tx    = db.transaction('queue', 'readwrite')
  tx.objectStore('queue').add(ping)
}

async function flushQueue(token: string) {
  const db  = await openDB()
  const tx  = db.transaction('queue', 'readwrite')
  const req = tx.objectStore('queue').openCursor()
  return new Promise<void>((resolve) => {
    req.onsuccess = async (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null
      if (!cursor) { resolve(); return }
      const ping = cursor.value as PendingPing
      try {
        const res = await fetch('/api/pings', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify(ping),
        })
        if (res.ok) cursor.delete()
      } catch { /* keep for next flush */ }
      await new Promise(r => setTimeout(r, 500))
      cursor.continue()
    }
  })
}

// ── Hook ──────────────────────────────────────────────────
export function useLocationTracker(
  enabled: boolean,
  unvisitedWaypoints: Array<{ lat: number; lng: number }>
) {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase    = createClient()

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  const sendPing = useCallback(async (pos: GeolocationPosition) => {
    const ping: PendingPing = {
      lat:         pos.coords.latitude,
      lng:         pos.coords.longitude,
      accuracy_m:  pos.coords.accuracy,
      recorded_at: new Date(pos.timestamp).toISOString(),
    }
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch('/api/pings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(ping),
      })
      if (!res.ok) throw new Error('ping failed')
    } catch {
      await queuePing(ping)
    }
    // Adaptive interval: switch to fast mode if near a waypoint
    const nearest = unvisitedWaypoints.length
      ? Math.min(...unvisitedWaypoints.map(wp => haversine(ping, wp)))
      : Infinity
    const interval = nearest < NEAR_THRESHOLD ? NEAR_INTERVAL : FAR_INTERVAL
    scheduleNext(interval)
  }, [getToken, unvisitedWaypoints])

  function scheduleNext(interval: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        sendPing,
        (err) => console.warn('GPS error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }, interval)
  }

  useEffect(() => {
    if (!enabled) return
    // Kick off first ping immediately
    navigator.geolocation.getCurrentPosition(
      sendPing,
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
    // Flush offline queue when network comes back
    const handleOnline = async () => {
      const token = await getToken()
      if (token) await flushQueue(token)
    }
    window.addEventListener('online', handleOnline)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, sendPing, getToken])
}
