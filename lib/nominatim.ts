export interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

let lastCallTime = 0

export async function geocode(query: string): Promise<GeoResult[]> {
  // Enforce 1 second between calls (Nominatim usage policy)
  const now = Date.now()
  const wait = 1000 - (now - lastCallTime)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallTime = Date.now()

  const params = new URLSearchParams({
    q:              query,
    format:         'json',
    limit:          '5',
    addressdetails: '1',
  })

  const appDomain   = process.env.NEXT_PUBLIC_APP_DOMAIN   ?? 'niblfoods.vercel.app'
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'it@niblfoods.com'

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        'User-Agent': `NIBL-Foods-FieldTracker/1.0 (${contactEmail})`,
        'Referer':    `https://${appDomain}`,
        'Accept':     'application/json',
      },
    }
  )

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const results = await res.json()
  return results.map((r: { lat: string; lon: string; display_name: string }) => ({
    lat:         parseFloat(r.lat),
    lng:         parseFloat(r.lon),
    displayName: r.display_name,
  }))
}
