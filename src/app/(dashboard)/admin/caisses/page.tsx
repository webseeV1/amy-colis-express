import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMontant, formatDate } from '@/lib/utils'
import { Wallet, BarChart3 } from 'lucide-react'

export default async function ToutesCaissesPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
  })

  const allFinances = await prisma.finance.findMany({
    include: {
      user: { select: { id: true, username: true } },
      voyage: { select: { numero: true } },
    },
    orderBy: { date: 'desc' },
  })

  // Helpers
  const sumBy = (arr: typeof allFinances, t: string) =>
    arr.filter(f => f.type === t).reduce((s, f) => s + f.montant, 0)

  // Globaux
  const globalCA = sumBy(allFinances, 'entree')
  const globalEntreesDiverses = sumBy(allFinances, 'entree_diverse')
  const globalDepenses = sumBy(allFinances, 'depense')
  const globalTresorerie = globalCA + globalEntreesDiverses - globalDepenses

  // Par employé
  const employeeData = users
    .map(u => {
      const mine = allFinances.filter(f => f.user.id === u.id)
      const ca = sumBy(mine, 'entree')
      const entreesDiverses = sumBy(mine, 'entree_diverse')
      const depenses = sumBy(mine, 'depense')
      return {
        ...u,
        finances: mine,
        ca,
        entreesDiverses,
        depenses,
        tresorerie: ca + entreesDiverses - depenses,
      }
    })
    .filter(e => e.finances.length > 0 || e.role !== 'admin')
    .sort((a, b) => b.ca - a.ca)

  const maxCA = Math.max(1, ...employeeData.map(e => e.ca))

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    employe_abidjan: 'Employé Abidjan',
    employe_france: 'Employé France',
  }

  const typeLabels: Record<string, string> = {
    entree: '💰 Encaissement',
    depense: '💸 Dépense',
    entree_diverse: '➕ Entrée diverse',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Trésorerie & Chiffre d&apos;affaires</h1>
        <p className="text-gray-500 text-sm">Vue consolidée — Admin uniquement</p>
      </div>

      {/* Totaux globaux : CA + Trésorerie en grand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
            <BarChart3 size={18} /> CA Global
          </div>
          <p className="text-3xl font-extrabold mt-2">{formatMontant(globalCA)}</p>
          <p className="text-xs text-blue-200 mt-1">Total encaissé (tous employés)</p>
        </div>
        <div className={`rounded-2xl p-5 text-white shadow-md bg-gradient-to-br ${
          globalTresorerie >= 0 ? 'from-emerald-600 to-emerald-800' : 'from-red-600 to-red-800'
        }`}>
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <Wallet size={18} /> Trésorerie Globale
          </div>
          <p className="text-3xl font-extrabold mt-2">{formatMontant(globalTresorerie)}</p>
          <p className="text-xs text-white/70 mt-1">CA + entrées diverses − dépenses</p>
        </div>
      </div>

      {/* Mini totaux secondaires */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Entrées diverses</p>
          <p className="font-bold text-green-600">{formatMontant(globalEntreesDiverses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Dépenses</p>
          <p className="font-bold text-red-600">{formatMontant(globalDepenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">CA encaissé</p>
          <p className="font-bold text-blue-600">{formatMontant(globalCA)}</p>
        </div>
      </div>

      {/* Graphe CA par employé */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
          <BarChart3 size={16} /> CA par employé
        </h2>
        {employeeData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
        ) : (
          <div className="space-y-3">
            {employeeData.map(emp => (
              <div key={emp.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{emp.username}</span>
                  <span className="font-bold text-blue-900">{formatMontant(emp.ca)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                    style={{ width: `${Math.round((emp.ca / maxCA) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Détail par employé */}
      {employeeData.map(emp => (
        <div key={emp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800 text-sm">
                {emp.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-blue-900">{emp.username}</p>
                <p className="text-xs text-blue-600">{roleLabels[emp.role] || emp.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-extrabold text-lg ${emp.tresorerie >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatMontant(emp.tresorerie)}
              </p>
              <p className="text-xs text-gray-500">Trésorerie</p>
            </div>
          </div>

          {/* Mini stats : CA / Diverses / Dépenses */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500">CA</p>
              <p className="font-bold text-blue-600">{formatMontant(emp.ca)}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500">Diverses</p>
              <p className="font-bold text-green-600">{formatMontant(emp.entreesDiverses)}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500">Dépenses</p>
              <p className="font-bold text-red-600">{formatMontant(emp.depenses)}</p>
            </div>
          </div>

          {emp.finances.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">Aucune transaction</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto ace-scrollbar">
              {emp.finances.map(f => (
                <div key={f.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900">{typeLabels[f.type] || f.type}</p>
                    <p className="text-xs text-gray-500 truncate">{f.motif}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(f.date)}{f.voyage && ` · Voyage #${f.voyage.numero}`}
                      {f.modePayment && ` · ${f.modePayment === 'especes' ? 'Espèces' : 'Virement'}`}
                    </p>
                  </div>
                  <span className={`ml-3 text-sm font-bold shrink-0 ${f.type === 'depense' ? 'text-red-600' : 'text-green-600'}`}>
                    {f.type === 'depense' ? '−' : '+'}{formatMontant(f.montant)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
