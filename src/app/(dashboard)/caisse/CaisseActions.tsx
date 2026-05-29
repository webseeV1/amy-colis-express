'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Minus, ArrowUpCircle, PlusCircle } from 'lucide-react'

type ActionType = 'entree' | 'entree_diverse' | 'depense'

const META: Record<ActionType, { title: string; success: string; placeholder: string }> = {
  entree: {
    title: '💰 Encaisser',
    success: 'Encaissement enregistré',
    placeholder: 'Ex: Paiement espèces client...',
  },
  entree_diverse: {
    title: '➕ Entrée diverse',
    success: 'Entrée enregistrée',
    placeholder: 'Ex: Remboursement, apport...',
  },
  depense: {
    title: '💸 Enregistrer une dépense',
    success: 'Dépense enregistrée',
    placeholder: 'Ex: Frais de transport, fournitures bureau...',
  },
}

export default function CaisseActions() {
  const [actionType, setActionType] = useState<ActionType | null>(null)
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState('')
  const [modePayment, setModePayment] = useState<'especes' | 'virement'>('especes')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function openModal(type: ActionType) {
    setActionType(type)
    setMontant('')
    setMotif('')
    setModePayment('especes')
  }

  async function handleSubmit() {
    if (!montant || parseFloat(montant) <= 0) { toast.error('Montant invalide'); return }
    if (!motif.trim()) { toast.error('Le motif est obligatoire'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: actionType,
          motif: motif.trim(),
          montant: parseFloat(montant),
          modePayment: actionType === 'depense' ? undefined : modePayment,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erreur'); return }
      toast.success(actionType ? META[actionType].success : 'Enregistré')
      setActionType(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap justify-end">
        <Button variant="primary" size="sm" onClick={() => openModal('entree')}>
          <PlusCircle size={16} />
          Encaisser
        </Button>
        <Button variant="orange" size="sm" onClick={() => openModal('entree_diverse')}>
          <ArrowUpCircle size={16} />
          Entrée
        </Button>
        <Button variant="danger" size="sm" onClick={() => openModal('depense')}>
          <Minus size={16} />
          Dépense
        </Button>
      </div>

      <Modal
        open={actionType !== null}
        onClose={() => setActionType(null)}
        title={actionType ? META[actionType].title : ''}
      >
        <div className="space-y-4">
          <Input
            label="Montant (€) *"
            type="number"
            step="0.01"
            min="0.01"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            placeholder="0.00"
          />
          {actionType !== 'depense' && (
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Mode de paiement</label>
              <div className="flex gap-2">
                {(['especes', 'virement'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModePayment(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      modePayment === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {m === 'especes' ? '💵 Espèces' : '🏦 Virement'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">
              Motif * <span className="text-red-500">(obligatoire)</span>
            </label>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder={actionType ? META[actionType].placeholder : ''}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setActionType(null)} className="flex-1">
              Annuler
            </Button>
            <Button
              variant={actionType === 'depense' ? 'danger' : 'primary'}
              loading={loading}
              onClick={handleSubmit}
              className="flex-1"
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
