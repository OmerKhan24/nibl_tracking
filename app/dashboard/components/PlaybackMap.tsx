'use client'
import { useEffect, useRef } from 'react'
import type { MapHandle } from '@/components/MapLibreMap'
import dynamic from 'next/dynamic'

const MapLibreMap = dynamic(() => import('@/components/MapLibreMap'), { ssr: false })

interface Props {
  pings: { lat: number; lng: number }[]
  stops: { lat: number; lng: number; label: string; arrived_at: string; duration_seconds: number | null }[]
}

export function PlaybackMap({ pings, stops }: Props) {
  const mapRef = useRef<MapHandle>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.on('load', () => {
      // Draw actual path taken
      if (pings.length > 1) {
        const coords = pings.map(p => [p.lng, p.lat])
        map.addSource('history-path', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
        })
        map.addLayer({
          id: 'history-path-layer', type: 'line', source: 'history-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.7 }
        })
        // Fit bounds
        const bounds = new maplibregl.LngLatBounds(coords[0] as [number,number], coords[0] as [number,number])
        coords.forEach(c => bounds.extend(c as [number,number]))
        map.fitBounds(bounds, { padding: 50 })
      }

      // Add stops
      import('maplibre-gl').then(({ Marker, Popup }) => {
        stops.forEach(s => {
          const el = document.createElement('div')
          el.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md'
          const m = Math.floor((s.duration_seconds || 0) / 60)
          new Marker({ element: el })
            .setLngLat([s.lng, s.lat])
            .setPopup(new Popup({ offset: 10 }).setHTML(`<strong>${s.label}</strong><br/>Stop: ${m} mins`))
            .addTo(map)
        })
      })
    })
  }, [pings, stops])

  return <MapLibreMap ref={mapRef} zoom={12} className="w-full h-full" />
}
