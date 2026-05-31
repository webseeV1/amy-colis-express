'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { formatMontant } from '@/lib/utils'

export interface ColisSuggestion {
  id: string
  /** Nom complet affiché (ex: "Diallo Mariam") */
  nom: string
  telephone: string
  montant: number
  /** Libellé optionnel à droite (ex: "Colis 1/2") */
  extra?: string
}

/**
 * Champ de recherche avec autocomplétion pour les colis.
 * - Filtre sur nom/prénom ou téléphone (logique dans le parent via `suggestions`).
 * - Affiche une liste déroulante des correspondances.
 * - Cliquer une suggestion appelle `onSelect`.
 * Le parent garde le contrôle de `query` et l'utilise pour filtrer sa propre liste.
 */
export default function ColisSearchBox({
  query,
  setQuery,
  suggestions,
  onSelect,
  placeholder = 'Rechercher par nom ou téléphone…',
  resultCount,
}: {
  query: string
  setQuery: (s: string) => void
  suggestions: ColisSuggestion[]
  onSelect: (s: ColisSuggestion) => void
  placeholder?: string
  resultCount?: number
}) {
  const [open, setOpen] = useState(false)
  const show = open && query.trim().length > 0

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {show && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-400">Aucun colis trouvé</div>
          ) : (
            suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  onSelect(s)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-gray-100 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-blue-900 text-sm truncate">{s.nom}</span>
                  <span className="block text-xs text-gray-500">{s.telephone}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-xs font-semibold text-blue-700">{formatMontant(s.montant)}</span>
                  {s.extra && <span className="block text-[10px] text-purple-600 font-bold">{s.extra}</span>}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {query.trim().length > 0 && typeof resultCount === 'number' && (
        <p className="mt-1.5 text-xs text-gray-500">
          {resultCount} colis correspondant{resultCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
