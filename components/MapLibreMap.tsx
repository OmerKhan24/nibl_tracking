'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Map as MaplibreMap, LngLatLike, GeoJSONSource } from 'maplibre-gl'

// Types are imported statically but the library is loaded dynamically
export interface MapHandle {
  getMap: () => MaplibreMap | null
}

interface MapLibreMapProps {
  center?: [number, number]   // [lng, lat]
  zoom?: number
  className?: string
}

const MapLibreMap = forwardRef<MapHandle, MapLibreMapProps>(
  ({ center = [74.3587, 31.5204], zoom = 12, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef       = useRef<MaplibreMap | null>(null)

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
    }))

    useEffect(() => {
      if (!containerRef.current) return
      let map: MaplibreMap

      import('maplibre-gl').then(({ Map, NavigationControl }) => {
        map = new Map({
          container: containerRef.current!,
          style:     'https://tiles.openfreemap.org/styles/positron',
          center:    center as LngLatLike,
          zoom,
        })
        map.addControl(new NavigationControl(), 'top-right')
        mapRef.current = map
      })

      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      }
    }, [])   // Run once on mount

    return (
      <div ref={containerRef} className={`w-full h-full ${className}`} />
    )
  }
)

MapLibreMap.displayName = 'MapLibreMap'
export default MapLibreMap
