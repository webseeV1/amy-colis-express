'use client'
import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { StatutBadge } from '@/components/ui/Badge'
import { formatMontant, formatDate } from '@/lib/utils'
import { Package, Plus, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ColisItem {
  id: string
  poids: number
  description: string
  montant: number
  statut: string
  estPrepaye: boolean
  dateEnregistrement: string
  client: { nom: string; prenom: string; telephone: string }
  enregistrePar: { username: string }
}

export default function StockPage() {
  const [tab, setTab] = useState<'liste' | 'nouveau'>('liste')
  const [colis, setColis] = useState<ColisItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [prixParKg, setPrixParKg] = useState(8)

  // Form state
  const [form, setForm] = useState({
    nom: '', prenom: '', telephoneDestinataire: '', telephoneExpediteur: '',
    poids: '', description: '', estPrepaye: false, montant: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedColis, setSelectedColis] = useState<string[]>([])

  const loadColis = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ statut: 'en_stock' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/colis?${params}`)
      const data = await res.json()
      if (data.success) setColis(data.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadColis()
  }, [loadColis])

  useEffect(() => {
    fetch('/api/parametres').then(r => r.json()).then(d => {
      if (d.success) setPrixParKg(d.data.prixParKg || 8)
    })
  }, [])

  useEffect(() => {
    if (form.poids && !form.estPrepaye) {
      setForm(f => ({ ...f, montant: (parseFloat(f.poids) * prixParKg).toFixed(2) }))
    }
  }, [form.poids, prixParKg, form.estPrepaye])

  function validateTelFr(tel: string) {
    const digits = tel.replace(/\D/g, '')
    return digits.length === 10 && digits.startsWith('0')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.telephoneDestinataire || !form.poids || !form.description) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!validateTelFr(form.telephoneDestinataire)) {
      toast.error('Téléphone destinataire invalide — 10 chiffres requis (ex: 0612345678)')
      return
    }
    if (form.telephoneExpediteur && form.telephoneExpediteur.replace(/\D/g, '').length < 8) {
      toast.error('Téléphone expéditeur invalide — minimum 8 chiffres')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/colis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, poids: parseFloat(form.poids), montant: parseFloat(form.montant) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Colis enregistré avec succès !')
      setForm({ nom: '', prenom: '', telephoneDestinataire: '', telephoneExpediteur: '', poids: '', description: '', estPrepaye: false, montant: '' })
      setTab('liste')
      loadColis()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAffecterVoyage() {
    if (selectedColis.length === 0) { toast.error('Sélectionnez au moins un colis'); return }
    const dateVoyage = prompt('Date du voyage (YYYY-MM-DD) :')
    if (!dateVoyage) return
    const res = await fetch('/api/voyages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateVoyage, colisIds: selectedColis }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success(`Voyage #${data.data.numero} créé avec ${selectedColis.length} colis`)
    setSelectedColis([])
    loadColis()
  }

  const filteredColis = colis.filter(c =>
    !search || `${c.client.nom} ${c.client.prenom} ${c.client.telephone}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Stock Abidjan</h1>
          <p className="text-gray-500 text-sm">{colis.length} colis en attente d&apos;expédition</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setTab('nouveau')}>
          <Plus size={18} />
          Nouveau Colis
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['liste', 'nouveau'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'liste' ? `Liste (${colis.length})` : 'Enregistrer un colis'}
          </button>
        ))}
      </div>

      {/* Liste Tab */}
      {tab === 'liste' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom, téléphone..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {selectedColis.length > 0 && (
              <Button variant="orange" onClick={handleAffecterVoyage}>
                <Package size={16} />
                Créer voyage ({selectedColis.length})
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : filteredColis.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun colis en stock</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredColis.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border p-3 transition-colors ${
                    selectedColis.includes(c.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedColis.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedColis(p => [...p, c.id])
                        else setSelectedColis(p => p.filter(id => id !== c.id))
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-blue-900 text-sm">{c.client.nom} {c.client.prenom}</p>
                        <StatutBadge statut={c.statut} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.client.telephone}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{c.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-medium text-gray-700">{c.poids} kg</span>
                        <span className="text-xs font-bold text-blue-600">{formatMontant(c.montant)}</span>
                        {c.estPrepaye && <span className="text-xs text-teal-600 font-semibold">✓ Prépayé</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(c.dateEnregistrement)} · par {c.enregistrePar?.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nouveau Colis Tab */}
      {tab === 'nouveau' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="font-bold text-blue-900 text-lg">Enregistrement d&apos;un colis</h2>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom destinataire *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Diallo" />
            <Input label="Prénom destinataire *" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Mohamed" />
          </div>

          <div>
            <Input
              label="Tél. destinataire * (France)"
              value={form.telephoneDestinataire}
              onChange={e => setForm(f => ({ ...f, telephoneDestinataire: e.target.value.replace(/[^\d\s\-\+\(\)\.]/g, '') }))}
              placeholder="0612345678"
              type="tel"
              inputMode="numeric"
              error={
                form.telephoneDestinataire && !validateTelFr(form.telephoneDestinataire)
                  ? '10 chiffres requis (ex: 0612345678)'
                  : undefined
              }
            />
          </div>

          <div>
            <Input
              label="Tél. expéditeur (Abidjan)"
              value={form.telephoneExpediteur}
              onChange={e => setForm(f => ({ ...f, telephoneExpediteur: e.target.value.replace(/[^\d\s\-\+\(\)\.]/g, '') }))}
              placeholder="07 XX XX XX XX"
              type="tel"
              inputMode="numeric"
              hint="Numéro Côte d'Ivoire (optionnel)"
            />
          </div>

          <Input
            label="Poids (kg) *"
            value={form.poids}
            onChange={e => setForm(f => ({ ...f, poids: e.target.value }))}
            type="number"
            step="0.1"
            min="0"
            placeholder="5.5"
          />

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Description du contenu *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Vêtements, chaussures..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
            <input
              type="checkbox"
              id="prepaye"
              checked={form.estPrepaye}
              onChange={e => setForm(f => ({ ...f, estPrepaye: e.target.checked, montant: e.target.checked ? '0' : (parseFloat(f.poids || '0') * prixParKg).toFixed(2) }))}
              className="h-4 w-4 rounded border-gray-300 text-teal-600"
            />
            <label htmlFor="prepaye" className="text-sm font-medium text-teal-800">
              Colis à poster (prépayé — déjà réglé à l&apos;envoi)
            </label>
          </div>

          {!form.estPrepaye && (
            <Input
              label={`Montant à payer (€) — Prix auto: ${form.poids ? (parseFloat(form.poids) * prixParKg).toFixed(2) : 0}€`}
              value={form.montant}
              onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTab('liste')} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">
              Enregistrer le colis
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
