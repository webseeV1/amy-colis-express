'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  voyage: { id: string; statut: string; numero: number }
  session: { role: string }
}

export default function VoyageActions({ voyage, session }: Props) {
  const [showPayModal, setShowPayModal] = useState(false)
  const [colisId, setColisId] = useState('')
  const [modePayment, setModePayment] = useState('especes')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEnvoyer() {
    if (!confirm(`Marquer le voyage #${voyage.numero} comme "Envoyé" ?`)) return
    const res = await fetch(`/api/voyages/${voyage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'envoye' }),
    })
    if (res.ok) { toast.success('Voyage marqué comme envoyé'); router.refresh() }
    else toast.error('Erreur')
  }

  const canModify = session.role === 'admin' || session.role === 'employe_abidjan'
  const canReceive = session.role === 'admin' || session.role === 'employe_france'

  return (
    <div className="flex flex-wrap gap-2">
      {voyage.statut === 'preparation' && canModify && (
        <Button variant="primary" size="sm" onClick={handleEnvoyer}>
          ✈️ Marquer Envoyé
        </Button>
      )}
      {voyage.statut === 'envoye' && canReceive && (
        <Button variant="orange" size="sm" onClick={() => router.push(`/colis/reception?voyageId=${voyage.id}`)}>
          📦 Réceptionner
        </Button>
      )}
    </div>
  )
}
