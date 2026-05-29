'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Employe {
  id: string
  username: string
  role: string
}

interface Props {
  colisId: string
  montant: number
  clientNom: string
  /** true si l'utilisateur connecté est admin (peut attribuer le paiement) */
  isAdmin?: boolean
  /** liste des employés à qui l'admin peut attribuer l'encaissement */
  employes?: Employe[]
}

export default function PayerColisButton({ colisId, montant, clientNom, isAdmin = false, employes = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [modePayment, setModePayment] = useState<'especes' | 'virement'>('especes')
  const [montantInput, setMontantInput] = useState(String(montant ?? 0))
  const [payeParId, setPayeParId] = useState<string>(employes[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePayer() {
    const montantNum = parseFloat(montantInput)
    if (!Number.isFinite(montantNum) || montantNum < 0) {
      toast.error('Montant invalide')
      return
    }
    if (isAdmin && employes.length > 0 && !payeParId) {
      toast.error('Sélectionnez l\'employé qui encaisse')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/colis/${colisId}/payer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modePayment,
          montant: montantNum,
          ...(isAdmin && payeParId ? { payeParId } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erreur'); return }
      toast.success(`Paiement de ${clientNom} enregistré !`)
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        ✓ Confirmer le paiement
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Enregistrer le paiement">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-sm text-gray-600">Client</p>
            <p className="font-bold text-blue-900 text-lg">{clientNom}</p>
          </div>

          {/* Montant (modifiable) */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Montant à encaisser (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={montantInput}
              onChange={e => setMontantInput(e.target.value)}
              inputMode="decimal"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <p className="text-sm font-medium text-blue-900 mb-2">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-3">
              {([['especes', '💵 Espèces'], ['virement', '🏦 Virement']] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModePayment(mode)}
                  className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    modePayment === mode
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Attribution (admin uniquement) */}
          {isAdmin && employes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Attribuer l&apos;encaissement à</label>
              <select
                value={payeParId}
                onChange={e => setPayeParId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {employes.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.username} {emp.role === 'employe_france' ? '(France)' : emp.role === 'employe_abidjan' ? '(Abidjan)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">La caisse de cet employé sera créditée du montant.</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" loading={loading} onClick={handlePayer} className="flex-1">
              Valider le paiement
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
