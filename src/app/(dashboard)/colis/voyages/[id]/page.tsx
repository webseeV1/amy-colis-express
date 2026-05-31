import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { StatutBadge } from '@/components/ui/Badge'
import { formatMontant } from '@/lib/utils'
import VoyageActions from './VoyageActions'
import VoyageColisList from './VoyageColisList'
export default async function VoyageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const voyage = await prisma.voyage.findUnique({
    where: { id },
    include: {
      colis: {
        include: {
          client: true,
          enregistrePar: { select: { username: true } },
          payePar: { select: { username: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!voyage) notFound()

  // Liste des employés pour l'attribution d'un encaissement par l'admin
  const isAdmin = session.role === 'admin'
  const employes = isAdmin
    ? await prisma.user.findMany({
        where: { role: { not: 'admin' }, actif: true },
        select: { id: true, username: true, role: true },
        orderBy: { username: 'asc' },
      })
    : []

  const parametres = await prisma.parametres.findUnique({ where: { id: 'singleton' } })
  const adresse = parametres?.adresseRecuperation || 'Paris, France'
  const mapsLink = parametres?.lienGoogleMaps ? `📍 ${parametres.lienGoogleMaps}` : ''
  const msgTemplate = parametres?.messageWhatsapp || 'Bonjour {nom}, votre colis est arrivé ! Montant : {montant}€. Adresse : {adresse}'
  const msgRelance = parametres?.messageRelance || 'Bonjour {nom}, votre colis vous attend. Montant : {montant}€'
  const livraisonTexte = parametres?.livraisonTexte || ''

  const totalCA = voyage.colis.filter(c => c.statut === 'paye').reduce((s, c) => s + c.montant, 0)
  const nbPaies = voyage.colis.filter(c => c.statut === 'paye').length
  const nbAttente = voyage.colis.filter(c => !['paye', 'prepaye'].includes(c.statut)).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Voyage #{voyage.numero}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date(voyage.dateVoyage).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <StatutBadge statut={voyage.statut} className="mt-2" />
          </div>
          <VoyageActions voyage={voyage} session={session} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total colis</p>
            <p className="font-bold text-blue-900 text-xl">{voyage.colis.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Payés</p>
            <p className="font-bold text-green-600 text-xl">{nbPaies}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">En attente</p>
            <p className="font-bold text-orange-600 text-xl">{nbAttente}</p>
          </div>
        </div>
      </div>

      {voyage.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          <strong>Notes :</strong> {voyage.notes}
        </div>
      )}

      {/* Colis List */}
      <h2 className="font-bold text-blue-900">Colis du voyage ({voyage.colis.length})</h2>
      <VoyageColisList
        colis={voyage.colis.map(c => ({
          id: c.id,
          clientId: c.clientId,
          statut: c.statut,
          montant: c.montant,
          poids: c.poids,
          description: c.description,
          estPrepaye: c.estPrepaye,
          photoUrl: c.photoUrl,
          photoExpiresAt: c.photoExpiresAt,
          datePaiement: c.datePaiement,
          payePar: c.payePar,
          client: { nom: c.client.nom, prenom: c.client.prenom, telephone: c.client.telephone },
        }))}
        isAdmin={isAdmin}
        employes={employes}
        adresse={adresse}
        mapsLink={mapsLink}
        msgTemplate={msgTemplate}
        msgRelance={msgRelance}
        livraisonTexte={livraisonTexte}
      />

      {/* Summary */}
      {nbPaies > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-bold text-green-800">CA encaissé : {formatMontant(totalCA)}</p>
          <p className="text-sm text-green-600">{nbPaies} colis payés sur {voyage.colis.length}</p>
        </div>
      )}
    </div>
  )
}
