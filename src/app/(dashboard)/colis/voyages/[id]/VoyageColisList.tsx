'use client'
import { useState } from 'react'
import { StatutBadge } from '@/components/ui/Badge'
import { formatMontant, formatDate, daysUntilExpiry } from '@/lib/utils'
import { buildWhatsAppLink, buildWhatsAppMessage } from '@/lib/whatsapp'
import { colisMatchesQuery } from '@/lib/search'
import ColisSearchBox from '../../../components/ColisSearchBox'
import PayerColisButton from '../../../components/PayerColisButton'

interface ColisData {
  id: string
  clientId: string
  statut: string
  montant: number
  poids: number
  description: string
  estPrepaye: boolean
  photoUrl: string | null
  photoExpiresAt: Date | string | null
  datePaiement: Date | string | null
  payePar: { username: string } | null
  client: { nom: string; prenom: string; telephone: string }
}

interface Employe {
  id: string
  username: string
  role: string
}

export default function VoyageColisList({
  colis,
  isAdmin,
  employes,
  adresse,
  mapsLink,
  msgTemplate,
  msgRelance,
  livraisonTexte,
}: {
  colis: ColisData[]
  isAdmin: boolean
  employes: Employe[]
  adresse: string
  mapsLink: string
  msgTemplate: string
  msgRelance: string
  livraisonTexte: string
}) {
  const [search, setSearch] = useState('')

  // Multi-colis : position X et total Y des colis du même client sur ce voyage
  const multiInfo = new Map<string, { x: number; y: number }>()
  {
    const totaux = new Map<string, number>()
    for (const c of colis) totaux.set(c.clientId, (totaux.get(c.clientId) || 0) + 1)
    const vus = new Map<string, number>()
    for (const c of colis) {
      const x = (vus.get(c.clientId) || 0) + 1
      vus.set(c.clientId, x)
      multiInfo.set(c.id, { x, y: totaux.get(c.clientId) || 1 })
    }
  }

  const colisFiltres = colis.filter(c => colisMatchesQuery(search, c.client))
  const suggestions = colisFiltres.slice(0, 8).map(c => {
    const m = multiInfo.get(c.id) || { x: 1, y: 1 }
    return {
      id: c.id,
      nom: `${c.client.nom} ${c.client.prenom}`,
      telephone: c.client.telephone,
      montant: c.montant,
      extra: m.y > 1 ? `Colis ${m.x}/${m.y}` : undefined,
    }
  })

  return (
    <>
      {/* Recherche intelligente */}
      {colis.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <ColisSearchBox
            query={search}
            setQuery={setSearch}
            suggestions={suggestions}
            onSelect={s => setSearch(s.nom)}
            placeholder="Rechercher un colis à encaisser (nom ou téléphone)…"
            resultCount={colisFiltres.length}
          />
        </div>
      )}

      <div className="space-y-3">
        {search.trim().length > 0 && colisFiltres.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun colis ne correspond à « {search} »
          </div>
        )}
        {colisFiltres.map((c) => {
          const i = colis.indexOf(c)
          const m = multiInfo.get(c.id) || { x: 1, y: 1 }
          const msg = buildWhatsAppMessage(msgTemplate, {
            nom: `${c.client.nom} ${c.client.prenom}`,
            montant: c.montant,
            adresse,
            maps_link: mapsLink,
            livraison: livraisonTexte,
          })
          const msgR = buildWhatsAppMessage(msgRelance, {
            nom: `${c.client.nom} ${c.client.prenom}`,
            montant: c.montant,
          })
          const waLink = buildWhatsAppLink(c.client.telephone, msg)
          const waRelance = buildWhatsAppLink(c.client.telephone, msgR)
          const waDirect = buildWhatsAppLink(c.client.telephone)
          const daysLeft = c.photoExpiresAt ? daysUntilExpiry(c.photoExpiresAt) : null

          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-900">{c.client.nom} {c.client.prenom}</p>
                      {m.y > 1 && (
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          📦 Colis {m.x}/{m.y}
                        </span>
                      )}
                    </div>
                    <a href={waDirect} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      {c.client.telephone}
                    </a>
                  </div>
                </div>
                <StatutBadge statut={c.statut} />
              </div>

              {m.y > 1 && (
                <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-800">
                  ⚠️ Ce client a {m.y} colis au total sur ce voyage — vérifiez qu&apos;ils sont tous présents.
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="bg-gray-100 px-2 py-1 rounded">{c.poids} kg</span>
                <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded">{formatMontant(c.montant)}</span>
                {c.estPrepaye && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded font-semibold">✓ Prépayé</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{c.description}</p>

              {/* Photo expiry warning */}
              {daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
                  ⚠️ Photo expire dans {daysLeft} jour{daysLeft !== 1 ? 's' : ''}
                </div>
              )}
              {c.photoUrl && (
                <a href={c.photoUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 block text-xs text-blue-600 hover:underline">
                  📸 Voir la photo du colis
                </a>
              )}

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {!['paye', 'prepaye'].includes(c.statut) && ['receptionne', 'notifie'].includes(c.statut) && (
                  <>
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Notifier
                    </a>
                    <a href={waRelance} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition-colors">
                      🔔 Relance
                    </a>
                    <PayerColisButton
                      colisId={c.id}
                      montant={c.montant}
                      clientNom={`${c.client.nom} ${c.client.prenom}`}
                      isAdmin={isAdmin}
                      employes={employes}
                    />
                  </>
                )}
                {c.statut === 'paye' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                    ✓ Payé le {c.datePaiement ? formatDate(c.datePaiement) : ''} par {c.payePar?.username}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
