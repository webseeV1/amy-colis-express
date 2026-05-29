'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Save, Eye, EyeOff } from 'lucide-react'
import TestIAButton from '@/components/admin/TestIAButton'

interface Params {
  adresseRecuperation: string
  lienGoogleMaps: string
  telephoneEntreprise: string
  prixParKg: number
  messageWhatsapp: string
  messageRelance: string
  livraisonTexte: string
  livraisonPrix: number
  geminiApiKey: string
  dureeConservationPhoto: number
}

export default function ParametresPage() {
  const [params, setParams] = useState<Params>({
    adresseRecuperation: '',
    lienGoogleMaps: '',
    telephoneEntreprise: '',
    prixParKg: 8,
    messageWhatsapp: '',
    messageRelance: '',
    livraisonTexte: '',
    livraisonPrix: 20,
    geminiApiKey: '',
    dureeConservationPhoto: 14,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetch('/api/parametres')
      .then(r => r.json())
      .then(d => {
        if (d.success) setParams(p => ({ ...p, ...d.data }))
      })
      .finally(() => setLoading(false))
  }, [])

  function update(key: keyof Params, value: string | number) {
    setParams(p => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/parametres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erreur'); return }
      toast.success('Paramètres sauvegardés !')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Paramètres</h1>
          <p className="text-gray-500 text-sm">Configuration de l&apos;application</p>
        </div>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          <Save size={16} />
          Sauvegarder
        </Button>
      </div>

      {/* Section: Récupération */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-blue-900 flex items-center gap-2 text-base">
          📍 Adresse &amp; Récupération
        </h2>
        <Input
          label="Adresse de récupération"
          value={params.adresseRecuperation}
          onChange={e => update('adresseRecuperation', e.target.value)}
          placeholder="Ex: 12 rue de la Paix, 75001 Paris"
        />
        <Input
          label="Lien Google Maps"
          value={params.lienGoogleMaps}
          onChange={e => update('lienGoogleMaps', e.target.value)}
          placeholder="https://maps.app.goo.gl/..."
        />
        <Input
          label="Numéro WhatsApp de l'entreprise"
          value={params.telephoneEntreprise}
          onChange={e => update('telephoneEntreprise', e.target.value.replace(/\D/g, ''))}
          placeholder="0612345678"
          hint="Numéro français (10 chiffres) — utilisé pour le lien de contact direct WhatsApp"
          maxLength={10}
          inputMode="numeric"
        />
      </div>

      {/* Section: Tarification */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-blue-900 text-base">💰 Tarification</h2>
        <Input
          label="Prix au kg (€)"
          type="number"
          step="0.5"
          min="0"
          value={params.prixParKg}
          onChange={e => update('prixParKg', parseFloat(e.target.value))}
          hint="Utilisé pour le calcul automatique du montant"
        />
        <Input
          label="Prix livraison domicile Île-de-France (€)"
          type="number"
          step="1"
          min="0"
          value={params.livraisonPrix}
          onChange={e => update('livraisonPrix', parseFloat(e.target.value))}
        />
        <div>
          <label className="block text-sm font-medium text-blue-900 mb-1">Texte livraison domicile</label>
          <input
            value={params.livraisonTexte}
            onChange={e => update('livraisonTexte', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Livraison à domicile disponible pour..."
          />
        </div>
      </div>

      {/* Section: Messages WhatsApp */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-blue-900 text-base">📱 Messages WhatsApp</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          Variables disponibles : <code className="font-mono bg-blue-100 px-1 rounded">{'{nom}'}</code>{' '}
          <code className="font-mono bg-blue-100 px-1 rounded">{'{montant}'}</code>{' '}
          <code className="font-mono bg-blue-100 px-1 rounded">{'{adresse}'}</code>{' '}
          <code className="font-mono bg-blue-100 px-1 rounded">{'{maps_link}'}</code>{' '}
          <code className="font-mono bg-blue-100 px-1 rounded">{'{livraison}'}</code>
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-900 mb-1">Message d&apos;arrivée</label>
          <textarea
            value={params.messageWhatsapp}
            onChange={e => update('messageWhatsapp', e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Bonjour {nom}, votre colis est arrivé..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-900 mb-1">Message de relance</label>
          <textarea
            value={params.messageRelance}
            onChange={e => update('messageRelance', e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Bonjour {nom}, votre colis vous attend..."
          />
        </div>
      </div>

      {/* Section: Photos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-blue-900 text-base">📸 Gestion des photos</h2>
        <Input
          label="Durée de conservation des photos (jours)"
          type="number"
          min="1"
          max="365"
          value={params.dureeConservationPhoto}
          onChange={e => update('dureeConservationPhoto', parseInt(e.target.value))}
          hint="Les photos sont automatiquement supprimées après ce délai"
        />
      </div>

      {/* Section: IA */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-blue-900 text-base">🤖 Intelligence Artificielle (Gemini)</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          Obtenez votre clé API gratuite sur{' '}
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            Google AI Studio
          </a>
          . Modèle utilisé : gemini-2.5-flash
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-blue-900 mb-1">Clé API Google Gemini</label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={params.geminiApiKey}
              onChange={e => update('geminiApiKey', e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AIzaSy..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(v => !v)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            🔒 La clé est stockée côté serveur et n&apos;est jamais exposée au navigateur.
            Sauvegardez avant de tester si vous venez de la modifier.
          </p>
        </div>

        {/* Test de connexion en temps réel */}
        <TestIAButton />
      </div>

      {/* Save button at bottom too */}
      <div className="pb-4">
        <Button variant="primary" size="lg" loading={saving} onClick={handleSave} className="w-full">
          <Save size={18} />
          Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  )
}
