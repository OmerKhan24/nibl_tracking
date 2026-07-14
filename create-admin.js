const fs = require('fs')

const env = fs.readFileSync('.env.local.example', 'utf-8')
const getVal = (key) => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

const url = getVal('NEXT_PUBLIC_SUPABASE_URL')
const serviceRole = getVal('SUPABASE_SERVICE_ROLE_KEY')

async function createAdmin() {
  console.log('Creating Admin User...')
  const email = 'admin@niblfoods.com'
  const password = 'Password123!'

  // 1. Create User in Auth
  const authRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceRole,
      'Authorization': `Bearer ${serviceRole}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  })

  const authData = await authRes.json()
  if (!authRes.ok) {
    if (authData.msg && authData.msg.includes('already exists')) {
      console.log('User already exists in auth. Just update profile...')
    } else {
      console.error('Failed to create auth user:', authData)
      return
    }
  }

  const userId = authData.id

  if (userId) {
      // 2. Insert into profiles
      const profileRes = await fetch(`${url}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': serviceRole,
          'Authorization': `Bearer ${serviceRole}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: userId,
          full_name: 'System Admin',
          role: 'super_admin',
          is_active: true
        })
      })

      if (!profileRes.ok) {
        console.error('Failed to insert profile:', await profileRes.text())
        return
      }
  }

  console.log('\n--- ADMIN CREATED SUCCESSFULLY ---')
  console.log('URL:', 'https://nibl-report-natf.vercel.app/login (or your Vercel URL)')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('----------------------------------\n')
}

createAdmin()
