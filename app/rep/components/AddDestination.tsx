'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { geocode } from '@/lib/nominatim'
import { MapPin } from 'lucide-react'

interface Waypoint { lat: number; lng: number; label: string; address?: string }

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (wp: Waypoint) => void
}

export function AddDestination({ open, onClose, onAdd }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<{ lat: number; lng: number; displayName: string }[]>([])
  const [label, setLabel]     = useState('')
  const [searching, setSearching] = useState(false)
  const [selected, setSelected]   = useState<{ lat: number; lng: number; displayName: string } | null>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await geocode(query)
      setResults(res)
    } catch { /* ignore */ }
    setSearching(false)
  }

  function handleSelect(r: { lat: number; lng: number; displayName: string }) {
    setSelected(r)
    setLabel(r.displayName.split(',')[0])
  }

  function handleAdd() {
    if (!selected) return
    onAdd({ lat: selected.lat, lng: selected.lng, label: label || selected.displayName.split(',')[0], address: selected.displayName })
    setQuery(''); setResults([]); setSelected(null); setLabel('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Destination">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search address or place..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} loading={searching} size="sm">Search</Button>
        </div>

        {results.length > 0 && !selected && (
          <ul className="border border-surface-border rounded-lg overflow-hidden divide-y divide-surface-border">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-surface-border transition-colors flex items-center gap-2"
                >
                  <MapPin size={14} className="text-brand shrink-0" />
                  <span className="truncate">{r.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div className="bg-surface-DEFAULT border border-surface-border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2 truncate">{selected.displayName}</p>
            <Input
              label="Stop label (shown on map)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Metro Store Gulberg"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selected}>Add Stop</Button>
        </div>
      </div>
    </Modal>
  )
}
