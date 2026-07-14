'use client'
import { useEffect, useRef } from 'react'
import type { MapHandle } from '@/components/MapLibreMap'
import dynamic from 'next/dynamic'

const MapLibreMap = dynamic(() => import('@/components/MapLibreMap'), { ssr: false })

interface Rep { id: string; full_name: string }
interface Ping { rep_id: string; lat: number; lng: number }

interface Props {
  reps: Rep[]
  pings: Record<string, Ping>
  selected: string | null
  onSelect: (id: string | null) => void
}

export function LiveMap({ reps, pings, selected, onSelect }: Props) {
  const mapRef = useRef<MapHandle>(null)
  const markersRef = useRef<Record<string, any>>({})

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    import('maplibre-gl').then(({ Marker, Popup }) => {
      // Add/update markers for each rep that has a ping
      Object.values(pings).forEach((ping) => {
        const rep = reps.find(r => r.id === ping.rep_id)
        if (!rep) return

        const isSelected = selected === rep.id
        let marker = markersRef.current[rep.id]

        if (!marker) {
          const el = document.createElement('div')
          el.style.cssText = 'width:28px;height:28px;background:#F97316;border-radius:50%;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;cursor:pointer;transition:transform 0.2s;'
          el.textContent = rep.full_name.charAt(0).toUpperCase()
          el.onclick = () => onSelect(rep.id)

          const popup = new Popup({ offset: 15, closeButton: false }).setHTML(`<strong>${rep.full_name}</strong><br/><span style="color:#9ca3af;font-size:11px">Live</span>`)

          marker = new Marker({ element: el })
            .setLngLat([ping.lng, ping.lat])
            .setPopup(popup)
            .addTo(map)

          markersRef.current[rep.id] = marker
        } else {
          marker.setLngLat([ping.lng, ping.lat])
        }

        // Highlight selected
        const el = marker.getElement()
        if (isSelected) {
          el.style.transform = 'scale(1.3)'
          el.style.background = '#3b82f6' // Blue when selected
          el.style.zIndex = '10'
          if (!marker.getPopup().isOpen()) marker.togglePopup()
          map.flyTo({ center: [ping.lng, ping.lat], zoom: 14 })
        } else {
          el.style.transform = 'scale(1)'
          el.style.background = '#F97316'
          el.style.zIndex = '1'
        }
      })

      // Clean up markers for reps that no longer exist
      Object.keys(markersRef.current).forEach(id => {
        if (!pings[id]) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })
    })
  }, [pings, reps, selected, onSelect])

  return (
    <div className="absolute inset-0">
      <MapLibreMap ref={mapRef} zoom={11} />
    </div>
  )
}
