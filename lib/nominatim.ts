export interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

export async function geocode(query: string): Promise<GeoResult[]> {
  // Call our own Next.js API route to bypass browser restrictions on User-Agent
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
  
  if (!res.ok) throw new Error(`Geocode error: ${res.status}`)

  const results = await res.json()
  
  return results.map((r: { lat: string; lon: string; display_name: string }) => ({
    lat:         parseFloat(r.lat),
    lng:         parseFloat(r.lon),
    displayName: r.display_name,
  }))
}
