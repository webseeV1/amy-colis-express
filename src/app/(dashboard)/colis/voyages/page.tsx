import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatutBadge } from '@/components/ui/Badge'
import { formatDateShort, formatMontant } from '@/lib/utils'
import { Ship, Package, Euro, ChevronRight, Plus } from 'lucide-react'
import CreateVoyageButton from './CreateVoyageButton'

export default async function VoyagesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const voyages = await prisma.voyage.findMany({
    include: {
      _count: { select: { colis: true } },
      colis: {
        select: { montant: true, statut: true },
      },
    },
    orderBy: { dateVoyage: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Voyages</h1>
          <p className="text-gray-500 text-sm">{voyages.length} voyages au total</p>
        </div>
        {(session.role === 'admin' || session.role === 'employe_abidjan') && <CreateVoyageButton />}
      </div>

      {voyages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Ship size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Aucun voyage enregistré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {voyages.map((v) => {
            const totalCA = v.colis.filter(c => c.statut === 'paye').reduce((s, c) => s + c.montant, 0)
            const colisNonPaies = v.colis.filter(c => !['paye', 'prepaye'].includes(c.statut)).length
            return (
              <Link
                key={v.id}
                href={`/colis/voyages/${v.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                      <Ship size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">Voyage #{v.numero}</p>
                      <p className="text-xs text-gray-500">{formatDateShort(v.dateVoyage)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatutBadge statut={v.statut} />
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Colis</p>
                    <p className="font-bold text-blue-900">{v._count.colis}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">CA</p>
                    <p className="font-bold text-green-600">{formatMontant(totalCA)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">En attente</p>
                    <p className="font-bold text-orange-600">{colisNonPaies}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
