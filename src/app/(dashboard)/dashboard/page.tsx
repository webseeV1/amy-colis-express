import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/ui/Card'
import { formatMontant } from '@/lib/utils'
import { Package, Plane, CheckCircle, Clock, Euro, TrendingDown, Wallet, Ship } from 'lucide-react'
import Link from 'next/link'
import { StatutBadge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Fetch relevant data based on role
  const [totalColis, colisEnStock, colisEnVoyage, colisPaies, voyagesRecents] = await Promise.all([
    prisma.colis.count(),
    prisma.colis.count({ where: { statut: 'en_stock' } }),
    prisma.colis.count({ where: { statut: 'en_voyage' } }),
    prisma.colis.count({ where: { statut: 'paye' } }),
    prisma.voyage.findMany({
      orderBy: { dateVoyage: 'desc' },
      take: 5,
      include: { _count: { select: { colis: true } } },
    }),
  ])

  // Finance totals for current user
  const finances = await prisma.finance.findMany({
    where: session.role === 'admin' ? {} : { userId: session.id },
  })
  const ca = finances.filter(f => f.type === 'entree').reduce((s, f) => s + f.montant, 0)
  const entreesDiverses = finances.filter(f => f.type === 'entree_diverse').reduce((s, f) => s + f.montant, 0)
  const totalDepenses = finances.filter(f => f.type === 'depense').reduce((s, f) => s + f.montant, 0)
  const tresorerie = ca + entreesDiverses - totalDepenses

  // Recent colis
  const recentColis = await prisma.colis.findMany({
    where: session.role === 'employe_abidjan' ? { enregistreParId: session.id } : {},
    include: { client: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">
          Bonjour, {session.username} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.role === 'admin' ? 'Vue administrateur — toutes les données' :
           session.role === 'employe_abidjan' ? 'Bureau Abidjan — gestion des dépôts' :
           'Bureau Paris — gestion des réceptions'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Colis" value={totalColis} icon={<Package size={20} />} color="blue" />
        <StatCard title="En Stock" value={colisEnStock} subtitle="Abidjan" icon={<Clock size={20} />} color="orange" />
        <StatCard title="En Voyage" value={colisEnVoyage} icon={<Plane size={20} />} color="purple" />
        <StatCard title="Livrés" value={colisPaies} icon={<CheckCircle size={20} />} color="green" />
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard
          title={session.role === 'admin' ? 'CA Global' : 'Mon CA'}
          value={formatMontant(ca)}
          icon={<Euro size={20} />}
          color="green"
        />
        <StatCard
          title="Dépenses"
          value={formatMontant(totalDepenses)}
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <StatCard
          title="Trésorerie"
          value={formatMontant(tresorerie)}
          icon={<Wallet size={20} />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Voyages */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-blue-900 flex items-center gap-2">
              <Ship size={18} className="text-blue-600" />
              Voyages Récents
            </h2>
            <Link href="/colis/voyages" className="text-blue-600 text-sm font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {voyagesRecents.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">Aucun voyage</p>
            ) : (
              voyagesRecents.map((v) => (
                <Link
                  key={v.id}
                  href={`/colis/voyages/${v.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Voyage #{v.numero}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(v.dateVoyage).toLocaleDateString('fr-FR')} · {v._count.colis} colis
                    </p>
                  </div>
                  <StatutBadge statut={v.statut} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Colis */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-blue-900 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              Colis Récents
            </h2>
            <Link href="/colis/stock" className="text-blue-600 text-sm font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentColis.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">Aucun colis</p>
            ) : (
              recentColis.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">
                      {c.client.nom} {c.client.prenom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.poids}kg · {formatMontant(c.montant)}
                    </p>
                  </div>
                  <StatutBadge statut={c.statut} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-bold text-blue-900 mb-3">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(session.role === 'admin' || session.role === 'employe_abidjan') && (
            <Link href="/colis/stock" className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
              <Package size={24} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">Nouveau Colis</span>
            </Link>
          )}
          {(session.role === 'admin' || session.role === 'employe_abidjan') && (
            <Link href="/colis/voyages" className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center">
              <Plane size={24} className="text-purple-600" />
              <span className="text-xs font-semibold text-purple-800">Créer Voyage</span>
            </Link>
          )}
          {(session.role === 'admin' || session.role === 'employe_france') && (
            <Link href="/colis/reception" className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs font-semibold text-green-800">Réceptionner</span>
            </Link>
          )}
          <Link href="/caisse" className="flex flex-col items-center gap-2 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
            <Euro size={24} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-800">Ma Caisse</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
