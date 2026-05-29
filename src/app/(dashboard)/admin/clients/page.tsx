import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMontant, formatDateShort } from '@/lib/utils'
import { StatutBadge } from '@/components/ui/Badge'
import { Users, Phone, Package } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export default async function ClientsPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const clients = await prisma.client.findMany({
    include: {
      colis: {
        select: { id: true, statut: true, montant: true, estPrepaye: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Base de Clients</h1>
        <p className="text-gray-500 text-sm">{clients.length} clients enregistrés</p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={56} className="mx-auto mb-3 text-gray-200" />
          <p>Aucun client enregistré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => {
            const totalCA = client.colis
              .filter(c => c.statut === 'paye')
              .reduce((s, c) => s + c.montant, 0)
            const nbPaies = client.colis.filter(c => c.statut === 'paye').length
            const nbImpay = client.colis.filter(c => c.statut === 'impaye').length
            const waLink = buildWhatsAppLink(client.telephone)

            return (
              <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                      {client.nom[0]}{client.prenom[0]}
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">{client.nom} {client.prenom}</p>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone size={11} />
                        {client.telephone}
                      </a>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{formatMontant(totalCA)}</p>
                    <p className="text-xs text-gray-400">CA total</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total colis</p>
                    <p className="font-bold text-blue-900">{client.colis.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Payés</p>
                    <p className="font-bold text-green-600">{nbPaies}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Impayés</p>
                    <p className={`font-bold ${nbImpay > 0 ? 'text-red-600' : 'text-gray-400'}`}>{nbImpay}</p>
                  </div>
                </div>

                {/* Recent colis */}
                {client.colis.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">DERNIERS COLIS</p>
                    <div className="space-y-1">
                      {client.colis.slice(0, 3).map(c => (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{formatDateShort(c.createdAt)}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{c.estPrepaye ? 'Prépayé' : formatMontant(c.montant)}</span>
                            <StatutBadge statut={c.statut} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning for bad payers */}
                {nbImpay > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    ⚠️ {nbImpay} colis impayé{nbImpay > 1 ? 's' : ''} — Mauvais payeur potentiel
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
