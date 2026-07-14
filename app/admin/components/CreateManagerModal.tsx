'use client'
import { useState, FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function CreateManagerModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/admin/managers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ full_name: name, email, password: pass }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to create manager')
    } else {
      onCreated()
      onClose()
      setName(''); setEmail(''); setPass('')
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Sales Manager">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Temporary Password" type="password" value={pass} onChange={e => setPass(e.target.value)} required minLength={6} />
        {error && <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Manager</Button>
        </div>
      </form>
    </Modal>
  )
}
