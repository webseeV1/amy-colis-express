'use client'
import { useState, useEffect, Suspense } from 'react'
import Button from '@/components/ui/Button'
import { formatMontant } from '@/lib/utils'
import { Camera, CheckCircle, Loader2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

interface ColisItem {
  id: string
  poids: number
  description: string
  montant: number
  statut: string
  estPrepaye: boolean
  client: { nom: string; prenom: string; telephone: string }
}

interface Voyage {
  id: string
  numero: number
  statut: string
  colis: ColisItem[]
}

function ReceptionContent() {
  const searchParams = useSearchParams()
  const preselectedVoyageId = searchParams.get('voyageId') || ''

  const [voyages, setVoyages] = useState<{ id: string; numero: number; statut: string }[]>([])
  const [selectedVoyageId, setSelectedVoyageId] = useState(preselectedVoyageId)
  const [voyage, setVoyage] = useState<Voyage | null>(null)
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [confirmes, setConfirmes] = useState<string[]>([])
  const [loadingVoyage, setLoadingVoyage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/voyages')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setVoyages(d.data.filter((v: { statut: string }) => ['envoye', 'receptionne'].includes(v.statut)))
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedVoyageId) { setVoyage(null); return }
    setLoadingVoyage(true)
    fetch(`/api/voyages/${selectedVoyageId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setVoyage(d.data) })
      .finally(() => setLoadingVoyage(false))
  }, [selectedVoyageId])

  function handlePhoto(colisId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Save to device gallery via download trick + store as base64 in state
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setPhotos(p => ({ ...p, [colisId]: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  function toggleConfirme(colisId: string) {
    setConfirmes(p =>
      p.includes(colisId) ? p.filter(id => id !== colisId) : [...p, colisId]
    )
  }

  async function handleConfirmReception() {
    if (!voyage || confirmes.length === 0) { toast.error('Confirmez au moins un colis'); return }
    setSubmitting(true)
    try {
      const colisReceptionnes = confirmes.map(id => ({ id, photoUrl: photos[id] || null }))
      const res = await fetch(`/api/voyages/${voyage.id}/reception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colisReceptionnes }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erreur'); return }
      toast.success(`${confirmes.length} colis réceptionnés avec succès !`)
      router.push(`/colis/voyages/${voyage.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Multi-colis : pour chaque colis, position X et total Y des colis du même client (groupés par téléphone)
  const multiInfo = new Map<string, { x: number; y: number }>()
  if (voyage) {
    const totaux = new Map<string, number>()
    for (const c of voyage.colis) totaux.set(c.client.telephone, (totaux.get(c.client.telephone) || 0) + 1)
    const vus = new Map<string, number>()
    for (const c of voyage.colis) {
      const x = (vus.get(c.client.telephone) || 0) + 1
      vus.set(c.client.telephone, x)
      multiInfo.set(c.id, { x, y: totaux.get(c.client.telephone) || 1 })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Réception France</h1>
        <p className="text-gray-500 text-sm">Comptez, photographiez et confirmez chaque colis</p>
      </div>

      {/* Voyage selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Sélectionner le voyage à réceptionner
        </label>
        <select
          value={selectedVoyageId}
          onChange={e => { setSelectedVoyageId(e.target.value); setConfirmes([]); setPhotos({}) }}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Choisir un voyage —</option>
          {voyages.map(v => (
            <option key={v.id} value={v.id}>
              Voyage #{v.numero} ({v.statut === 'envoye' ? 'En transit' : 'Réceptionné'})
            </option>
          ))}
        </select>
      </div>

      {loadingVoyage && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" size={36} />
        </div>
      )}

      {voyage && !loadingVoyage && (
        <>
          {/* Progress banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900">Voyage #{voyage.numero}</p>
              <p className="text-sm text-blue-700">{voyage.colis.length} colis attendus</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{confirmes.length}</p>
              <p className="text-xs text-gray-500">confirmés / {voyage.colis.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(confirmes.length / Math.max(voyage.colis.length, 1)) * 100}%` }}
            />
          </div>

          {/* Colis list */}
          <div className="space-y-3">
            {voyage.colis.map((c, i) => {
              const isConfirme = confirmes.includes(c.id)
              const hasPhoto = !!photos[c.id]
              const m = multiInfo.get(c.id) || { x: 1, y: 1 }
              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border-2 p-4 transition-all ${
                    isConfirme ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isConfirme ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isConfirme ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-blue-900">{c.client.nom} {c.client.prenom}</p>
                        {m.y > 1 && (
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            📦 Colis {m.x}/{m.y}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{c.client.telephone}</p>
                      {m.y > 1 && (
                        <div className="mb-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-800">
                          ⚠️ Ce client a {m.y} colis au total — vérifiez qu&apos;ils sont tous présents.
                        </div>
                      )}
                      <p className="text-xs text-gray-600 truncate mb-2">{c.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{c.poids} kg</span>
                        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded">
                          {c.estPrepaye ? 'Prépayé' : formatMontant(c.montant)}
                        </span>
                      </div>

                      {/* Photo capture */}
                      <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                        hasPhoto ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}>
                        <Camera size={14} />
                        {hasPhoto ? '✓ Photo prise' : 'Prendre une photo *'}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={e => handlePhoto(c.id, e)}
                          className="hidden"
                        />
                      </label>

                      {hasPhoto && (
                        <img
                          src={photos[c.id]}
                          alt="colis"
                          className="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                      )}

                      {/* Confirm toggle */}
                      <button
                        onClick={() => toggleConfirme(c.id)}
                        className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-full justify-center transition-colors ${
                          isConfirme
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <CheckCircle size={16} />
                        {isConfirme ? 'Réception confirmée ✓' : 'Confirmer la réception'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sticky submit button */}
          {confirmes.length > 0 && (
            <div className="sticky bottom-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={handleConfirmReception}
                className="w-full shadow-xl"
              >
                <CheckCircle size={20} />
                Valider la réception ({confirmes.length}/{voyage.colis.length} colis)
              </Button>
            </div>
          )}
        </>
      )}

      {!selectedVoyageId && !loadingVoyage && (
        <div className="text-center py-16 text-gray-400">
          <Package size={56} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Sélectionnez un voyage pour commencer la réception</p>
        </div>
      )}
    </div>
  )
}

export default function ReceptionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={36} /></div>}>
      <ReceptionContent />
    </Suspense>
  )
}
