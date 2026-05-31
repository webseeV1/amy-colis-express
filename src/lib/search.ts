/**
 * Utilitaires de recherche pour les colis (réception + encaissement).
 * Recherche tolérante : insensible à la casse et aux accents,
 * matche sur le nom/prénom (dans les deux sens) ou sur le numéro de téléphone.
 */

/** Minuscules + suppression des accents + trim. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Vrai si le colis correspond à la recherche.
 * - Si la requête est vide → toujours vrai (pas de filtre).
 * - Texte : matche sur "nom prénom" ou "prénom nom".
 * - Chiffres : matche sur le téléphone (comparaison chiffres uniquement).
 */
export function colisMatchesQuery(
  query: string,
  c: { nom: string; prenom: string; telephone: string }
): boolean {
  const q = normalizeText(query)
  if (!q) return true

  const name = normalizeText(`${c.nom} ${c.prenom}`)
  const nameRev = normalizeText(`${c.prenom} ${c.nom}`)
  if (name.includes(q) || nameRev.includes(q)) return true

  const qDigits = query.replace(/\D/g, '')
  if (qDigits.length > 0) {
    const telDigits = (c.telephone || '').replace(/\D/g, '')
    if (telDigits.includes(qDigits)) return true
  }

  return false
}
