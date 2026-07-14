/** Returns distance in metres between two lat/lng points. */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6_371_000 // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.asin(Math.sqrt(x))
}

/** Sum haversine distance over an ordered array of pings. Returns metres. */
export function totalDistance(
  pings: Array<{ lat: number; lng: number }>
): number {
  let total = 0
  for (let i = 1; i < pings.length; i++) {
    total += haversine(pings[i - 1], pings[i])
  }
  return Math.round(total)
}
