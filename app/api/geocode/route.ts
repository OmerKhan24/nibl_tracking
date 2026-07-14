import { NextResponse } from 'next/server'

let lastCallTime = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

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
    countrycodes:   'pk',
  })

  const appDomain    = process.env.NEXT_PUBLIC_APP_DOMAIN    ?? 'niblfoods.vercel.app'
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'it@niblfoods.com'

  try {
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

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim error' }, { status: res.status })
    }

    const results = await res.json()
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch from Nominatim' }, { status: 500 })
  }
}
