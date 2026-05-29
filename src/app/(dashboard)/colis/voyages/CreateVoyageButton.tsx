'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CreateVoyageButton() {
  const [open, setOpen] = useState(false)
  const [dateVoyage, setDateVoyage] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!dateVoyage) { toast.error('Date requise'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/voyages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateVoyage, notes }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Voyage #${data.data.numero} créé !`)
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus size={18} />
        Nouveau Voyage
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau Voyage">
        <div className="space-y-4">
          <Input
            label="Date du voyage *"
            type="date"
            value={dateVoyage}
            onChange={e => setDateVoyage(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" loading={loading} onClick={handleCreate} className="flex-1">Créer</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
