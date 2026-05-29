import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMontant, formatDate } from '@/lib/utils'
import { Wallet, TrendingUp, TrendingDown, BarChart3, Banknote } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import CaisseActions from './CaisseActions'

export default async function CaissePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const finances = await prisma.finance.findMany({
    where: { userId: session.id },
    include: { voyage: { select: { numero: true } } },
    orderBy: { date: 'desc' },
  })

  // CA = encaissements (paiements colis) — type 'entree'
  const ca = finances
    .filter(f => f.type === 'entree')
    .reduce((s, f) => s + f.montant, 0)
  const entreesDiverses = finances
    .filter(f => f.type === 'entree_diverse')
    .reduce((s, f) => s + f.montant, 0)
  const totalDepenses = finances
    .filter(f => f.type === 'depense')
    .reduce((s, f) => s + f.montant, 0)
  // Trésorerie = CA + entrées diverses - dépenses
  const tresorerie = ca + entreesDiverses - totalDepenses

  // CA par voyage (pour le détail)
  const caParVoyage = new Map<string, number>()
  for (const f of finances) {
    if (f.type !== 'entree') continue
    const key = f.voyage ? `Voyage #${f.voyage.numero}` : 'Hors voyage'
    caParVoyage.set(key, (caParVoyage.get(key) || 0) + f.montant)
  }

  const typeLabels: Record<string, string> = {
    entree: '💰 Encaissement',
    depense: '💸 Dépense',
    entree_diverse: '➕ Entrée diverse',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Ma Caisse</h1>
          <p className="text-gray-500 text-sm">{session.username}</p>
        </div>
        <CaisseActions />
      </div>

      {/* Les 2 grands chiffres : CA + Trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
            <BarChart3 size={18} /> Chiffre d&apos;affaires
          </div>
          <p className="text-3xl font-extrabold mt-2">{formatMontant(ca)}</p>
          <p className="text-xs text-blue-200 mt-1">Total encaissé (paiements colis)</p>
        </div>
        <div className={`rounded-2xl p-5 text-white shadow-md bg-gradient-to-br ${
          tresorerie >= 0 ? 'from-emerald-600 to-emerald-800' : 'from-red-600 to-red-800'
        }`}>
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <Wallet size={18} /> Trésorerie
          </div>
          <p className="text-3xl font-extrabold mt-2">{formatMontant(tresorerie)}</p>
          <p className="text-xs text-white/70 mt-1">CA + entrées diverses − dépenses</p>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Encaissements (CA)"
          value={formatMontant(ca)}
          icon={<Banknote size={20} />}
          color="blue"
        />
        <StatCard
          title="Entrées diverses"
          value={formatMontant(entreesDiverses)}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          title="Total Dépenses"
          value={formatMontant(totalDepenses)}
          icon={<TrendingDown size={20} />}
          color="red"
        />
      </div>

      {/* CA par voyage */}
      {caParVoyage.size > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="font-bold text-blue-900 mb-3 text-sm">CA par voyage</h2>
          <div className="space-y-2">
            {[...caParVoyage.entries()].map(([label, montant]) => {
              const pct = ca > 0 ? Math.round((montant / ca) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-blue-900">{formatMontant(montant)} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-blue-900">Historique des transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">{finances.length} opérations</p>
        </div>
        <div className="divide-y divide-gray-100">
          {finances.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Wallet size={44} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Aucune transaction pour le moment</p>
            </div>
          ) : (
            finances.map(f => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900">
                    {typeLabels[f.type] || f.type}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{f.motif}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(f.date)}
                    {f.voyage && ` · Voyage #${f.voyage.numero}`}
                  </p>
                </div>
                <span className={`ml-4 font-bold text-sm shrink-0 ${
                  f.type === 'depense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {f.type === 'depense' ? '−' : '+'}{formatMontant(f.montant)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
