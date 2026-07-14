'use client'
import { useEffect, useRef } from 'react'
import type { MapHandle } from '@/components/MapLibreMap'
import dynamic from 'next/dynamic'

const MapLibreMap = dynamic(() => import('@/components/MapLibreMap'), { ssr: false })

interface RepMapProps {
  center?: [number, number]
  waypoints: { lat: number; lng: number; label: string }[]
  stops: { lat: number; lng: number; label: string; departed_at: string | null }[]
  routeGeom: [number, number][] | null
  currentPos: { lat: number; lng: number } | null
}

export function RepMap({ center, waypoints, stops, routeGeom, currentPos }: RepMapProps) {
  const mapRef = useRef<MapHandle>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.on('load', () => {
      // Route line
      if (routeGeom) {
        const src = map.getSource('route') as import('maplibre-gl').GeoJSONSource | undefined
        const geojson: GeoJSON.Feature = {
          type: 'Feature', geometry: { type: 'LineString', coordinates: routeGeom }, properties: {},
        }
        if (src) {
          src.setData(geojson)
        } else {
          map.addSource('route', { type: 'geojson', data: geojson })
          map.addLayer({
            id: 'route', type: 'line', source: 'route',
            paint: { 'line-color': '#F97316', 'line-width': 3, 'line-dasharray': [2, 2] },
          })
        }
      }

      // Waypoint markers
      import('maplibre-gl').then(({ Marker, Popup }) => {
        waypoints.forEach((wp, i) => {
          const visited = stops.some(s => s.label === wp.label && s.departed_at)
          const el = document.createElement('div')
          el.className = 'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-lg border-2'
          el.style.cssText = `background:${visited ? '#22c55e' : '#F97316'};color:white;border-color:${visited ? '#16a34a' : '#ea6a0a'}`
          el.textContent = String(i + 1)
          new Marker({ element: el })
            .setLngLat([wp.lng, wp.lat])
            .setPopup(new Popup({ offset: 25 }).setHTML(`<strong>${wp.label}</strong>`))
            .addTo(map)
        })

        // Current position marker
        if (currentPos) {
          const el = document.createElement('div')
          el.style.cssText = 'width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)'
          new Marker({ element: el }).setLngLat([currentPos.lng, currentPos.lat]).addTo(map)
        }
      })
    })
  }, [waypoints, stops, routeGeom, currentPos])

  return <MapLibreMap ref={mapRef} center={center} zoom={13} className="w-full h-full" />
}
