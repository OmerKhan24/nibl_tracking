const fs = require('fs')

const env = fs.readFileSync('.env.local.example', 'utf-8')
const getVal = (key) => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

const url = getVal('NEXT_PUBLIC_SUPABASE_URL')
const anon = getVal('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const serviceRole = getVal('SUPABASE_SERVICE_ROLE_KEY')

async function testKeys() {
  console.log('--- Detailed Supabase Key Test ---')
  
  try {
    // 1. Test Anon Key
    const res1 = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anon,
        'Authorization': `Bearer ${anon}`
      }
    })
    const body1 = await res1.text()
    console.log(`Anon Key Test: ${res1.status}`)
    if (!res1.ok) console.log(`Anon Key Error Body:`, body1.slice(0, 500))

    // 2. Test Service Role Key
    const res2 = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`
      }
    })
    const body2 = await res2.text()
    console.log(`Service Role Key Test: ${res2.status}`)
    if (!res2.ok) console.log(`Service Role Key Error Body:`, body2.slice(0, 500))

  } catch (err) {
    console.error('Network Error:', err.message)
  }
}

testKeys()
