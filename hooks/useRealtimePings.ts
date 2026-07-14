'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LivePing {
  rep_id:      string
  lat:         number
  lng:         number
  accuracy_m:  number | null
  recorded_at: string
}

/** Returns a map of rep_id → latest LivePing */
export function useRealtimePings(initialPings: Record<string, LivePing> = {}) {
  const [pings, setPings] = useState<Record<string, LivePing>>(initialPings)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('live-pings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gps_pings' },
        (payload) => {
          const row = payload.new as LivePing
          setPings((prev) => ({ ...prev, [row.rep_id]: row }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return pings
}
