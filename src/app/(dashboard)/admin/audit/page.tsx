import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { ClipboardList } from 'lucide-react'

const actionColors: Record<string, string> = {
  creation: 'bg-green-100 text-green-700',
  modification: 'bg-blue-100 text-blue-700',
  suppression: 'bg-red-100 text-red-700',
  paiement: 'bg-emerald-100 text-emerald-700',
  reception: 'bg-purple-100 text-purple-700',
  notification: 'bg-indigo-100 text-indigo-700',
  connexion: 'bg-gray-100 text-gray-600',
  deconnexion: 'bg-gray-100 text-gray-600',
  depense: 'bg-orange-100 text-orange-700',
  entree: 'bg-teal-100 text-teal-700',
}

const actionEmojis: Record<string, string> = {
  creation: '✅',
  modification: '✏️',
  suppression: '🗑️',
  paiement: '💰',
  reception: '📦',
  notification: '📱',
  connexion: '🔓',
  deconnexion: '🔒',
  depense: '💸',
  entree: '➕',
}

export default async function AuditPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { username: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Journal d'Audit</h1>
        <p className="text-gray-500 text-sm">{logs.length} actions enregistrées (200 dernières)</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={56} className="mx-auto mb-3 text-gray-200" />
          <p>Aucune action enregistrée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                <div className="text-lg shrink-0 mt-0.5">
                  {actionEmojis[log.action] || '•'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-blue-800">{log.user.username}</span>
                    <span className="text-xs text-gray-400">({log.user.role.replace('employe_', '')})</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    <span className="font-medium">{log.entityType}</span>
                    {log.entityId && <span className="text-gray-400"> #{log.entityId.slice(0, 8)}…</span>}
                  </p>
                  {log.details && typeof log.details === 'object' && Object.keys(log.details as object).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-blue-500 cursor-pointer hover:text-blue-700">Voir détails</summary>
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-24">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="text-xs text-gray-400 shrink-0 text-right">
                  {formatDate(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
